import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Startseite({ nav }) {
  const [rangliste, setRangliste] = useState([])
  const [letzte, setLetzte]       = useState([])
  const [laden, setLaden]         = useState(true)

  useEffect(() => {
    async function load() {
      const saison = getSaison()

      const { data: erg } = await supabase
        .from('ergebnisse')
        .select('mitglied_id, gesamt_punkte, mitglieder(name)')
        .gte('datum', saison.start)
        .lte('datum', saison.end)

      if (erg) {
        const map = {}
        for (const e of erg) {
          const id = e.mitglied_id
          const name = e.mitglieder?.name || '–'
          if (!map[id]) map[id] = { name, punkte: [], beste: 0 }
          map[id].punkte.push(e.gesamt_punkte)
          map[id].beste = Math.max(map[id].beste, e.gesamt_punkte)
        }
        const liste = Object.values(map).map(m => ({
          name: m.name,
          schnitt: (m.punkte.reduce((a, b) => a + b, 0) / m.punkte.length).toFixed(1),
          beste: m.beste,
          runden: m.punkte.length,
        })).sort((a, b) => parseFloat(b.schnitt) - parseFloat(a.schnitt))
        setRangliste(liste)
      }

      const { data: letzteErg } = await supabase
        .from('ergebnisse')
        .select('datum, art, ort, gesamt_punkte, gesamt_fehler, runde, mitglieder(name)')
        .order('datum', { ascending: false })
        .order('erstellt_am', { ascending: false })
        .limit(10)
      setLetzte(letzteErg || [])

      setLaden(false)
    }
    load()
  }, [])

  function getSaison() {
    const heute = new Date()
    const jahr = heute.getMonth() >= 8 ? heute.getFullYear() : heute.getFullYear() - 1
    return { start: `${jahr}-09-01`, end: `${jahr + 1}-04-30` }
  }

  function formatDatum(d) {
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const saison = getSaison()
  const saisonLabel = `${new Date(saison.start).getFullYear()}/${String(new Date(saison.end).getFullYear()).slice(2)}`

  if (laden) return <div className="loading">Lade Daten…</div>

  return (
    <div>
      <div className="hero">
        <div>
          <h2>TSV UG Kegeln</h2>
          <p>Saison {saisonLabel} – Ergebnisse & Rangliste</p>
        </div>
        <div className="hero-kegel">🎳</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Rangliste */}
        <div className="card">
          <div className="card-title">Rangliste {saisonLabel}</div>
          {rangliste.length === 0 ? (
            <div className="empty">Noch keine Ergebnisse.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Mitglied</th>
                  <th className="zahl">Schnitt</th>
                  <th className="zahl">Beste</th>
                </tr>
              </thead>
              <tbody>
                {rangliste.map((m, mi) => (
                  <tr key={mi}>
                    <td className="rang">{mi === 0 ? '🥇' : mi === 1 ? '🥈' : mi === 2 ? '🥉' : mi + 1}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td className="zahl" style={{ fontWeight: 700, color: 'var(--tsv-blau)' }}>{m.schnitt}</td>
                    <td className="zahl">{m.beste}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button className="btn btn-outline" onClick={() => nav('statistiken')}>
              Statistiken →
            </button>
          </div>
        </div>

        {/* Letzte Ergebnisse */}
        <div className="card">
          <div className="card-title">Letzte Ergebnisse</div>
          {letzte.length === 0 ? (
            <div className="empty">Noch keine Ergebnisse eingetragen.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Mitglied</th>
                  <th>Art</th>
                  <th className="zahl">Pkt</th>
                </tr>
              </thead>
              <tbody>
                {letzte.map((e, mi) => (
                  <tr key={mi}>
                    <td style={{ fontSize: 13, color: 'var(--grau-text)' }}>{formatDatum(e.datum)}</td>
                    <td style={{ fontWeight: 600 }}>{e.mitglieder?.name}</td>
                    <td>
                      <span className={`badge badge-${e.art}`}>{e.art === 'wettkampf' ? 'WK' : 'TR'}</span>
                      {' '}
                      <span style={{ fontSize: 11, color: 'var(--grau-text)' }}>{e.ort === 'heim' ? '🏠' : '✈️'}</span>
                    </td>
                    <td className="zahl" style={{ fontWeight: 700, color: 'var(--tsv-blau)' }}>{e.gesamt_punkte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button className="btn btn-gelb" onClick={() => nav('eintragen')}>
              + Ergebnis eintragen
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
