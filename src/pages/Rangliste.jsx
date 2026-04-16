import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Rangliste() {
  const [daten, setDaten]     = useState([])
  const [filter, setFilter]   = useState('alle')
  const [laden, setLaden]     = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('v_saison_rangliste')
        .select('*')
        .order('schnitt', { ascending: false })
      setDaten(data || [])
      setLaden(false)
    }
    load()
  }, [])

  const gefiltert = filter === 'alle'
    ? Object.values(
        daten.reduce((acc, r) => {
          const key = r.mitglied_id
          if (!acc[key]) {
            acc[key] = { ...r, runden_gesamt: 0, punkte_gesamt_sum: 0 }
          }
          acc[key].runden_gesamt    += r.runden_gespielt
          acc[key].punkte_gesamt_sum += r.punkte_gesamt
          acc[key].beste_runde = Math.max(acc[key].beste_runde || 0, r.beste_runde || 0)
          acc[key].spieltage_gespielt = (acc[key].spieltage_gespielt || 0) + r.spieltage_gespielt
          return acc
        }, {})
      ).map(r => ({
        ...r,
        schnitt: r.runden_gesamt > 0
          ? (r.punkte_gesamt_sum / r.runden_gesamt).toFixed(1)
          : '–'
      })).sort((a, b) => parseFloat(b.schnitt) - parseFloat(a.schnitt))
    : daten.filter(r => r.art === filter)

  if (laden) return <div className="loading">Lade Rangliste…</div>

  return (
    <div>
      <div className="card">
        <div className="card-title">Saisonrangliste 2024/25</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['alle', 'training', 'wettkampf'].map(f => (
            <button
              key={f}
              className={filter === f ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setFilter(f)}
            >
              {f === 'alle' ? 'Gesamt' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {gefiltert.length === 0 ? (
          <div className="empty">Keine Daten für diesen Filter.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Mitglied</th>
                  <th className="zahl">Spieltage</th>
                  <th className="zahl">Runden</th>
                  <th className="zahl">Schnitt/Runde</th>
                  <th className="zahl">Beste Runde</th>
                  <th className="zahl">Fehler/Runde</th>
                </tr>
              </thead>
              <tbody>
                {gefiltert.map((m, mi) => (
                  <tr key={mi}>
                    <td className="rang">
                      {mi === 0 ? '🥇' : mi === 1 ? '🥈' : mi === 2 ? '🥉' : mi + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.mitglied_name}</td>
                    <td className="zahl">{m.spieltage_gespielt}</td>
                    <td className="zahl">{m.runden_gespielt ?? m.runden_gesamt}</td>
                    <td className="zahl" style={{ fontWeight: 700, color: 'var(--tsv-blau)', fontSize: 16 }}>
                      {m.schnitt}
                    </td>
                    <td className="zahl">{m.beste_runde}</td>
                    <td className="zahl" style={{ color: parseFloat(m.fehler_pro_runde) > 1 ? '#c0392b' : 'inherit' }}>
                      {m.fehler_pro_runde ?? '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
