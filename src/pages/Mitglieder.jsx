import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Mitglieder() {
  const [mitglieder, setMitglieder] = useState([])
  const [ausgewaehlt, setAusgewaehlt] = useState(null)
  const [verlauf, setVerlauf]         = useState([])
  const [laden, setLaden]             = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('mitglieder')
        .select('id, name, eintrittsdatum, aktiv')
        .eq('aktiv', true)
        .order('name')
      setMitglieder(data || [])
      setLaden(false)
    }
    load()
  }, [])

  async function oeffne(m) {
    setAusgewaehlt(m)
    const { data } = await supabase
      .from('v_spieltag_auswertung')
      .select('*')
      .eq('mitglied_id', m.id)
      .order('datum', { ascending: false })
    setVerlauf(data || [])
  }

  function formatDatum(d) {
    if (!d) return '–'
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (laden) return <div className="loading">Lade Mitglieder…</div>

  if (ausgewaehlt) {
    const schnitt = verlauf.length > 0
      ? (verlauf.reduce((s, r) => s + (r.schnitt_pro_runde || 0), 0) / verlauf.length).toFixed(1)
      : '–'
    const bestRunde = verlauf.length > 0
      ? Math.max(...verlauf.map(r => r.beste_runde || 0))
      : '–'

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-outline" onClick={() => { setAusgewaehlt(null); setVerlauf([]) }}>
            ← Zurück
          </button>
        </div>

        <div className="card">
          <div className="card-title">{ausgewaehlt.name}</div>
          <div className="stats-row" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-value">{verlauf.length}</div>
              <div className="stat-label">Spieltage</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{schnitt}</div>
              <div className="stat-label">Schnitt/Runde</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{bestRunde}</div>
              <div className="stat-label">Beste Runde</div>
            </div>
          </div>
        </div>

        {verlauf.length > 0 && (
          <div className="card">
            <div className="card-title">Verlauf</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Art</th>
                    <th className="zahl">Runden</th>
                    <th className="zahl">Gesamt</th>
                    <th className="zahl">Schnitt/Runde</th>
                    <th className="zahl">Beste Runde</th>
                    <th className="zahl">Fehler</th>
                  </tr>
                </thead>
                <tbody>
                  {verlauf.map((r, mi) => (
                    <tr key={mi}>
                      <td>{formatDatum(r.datum)}</td>
                      <td><span className={`badge badge-${r.art}`}>{r.art}</span></td>
                      <td className="zahl">{r.anzahl_runden}</td>
                      <td className="zahl" style={{ fontWeight: 700 }}>{r.punkte_gesamt}</td>
                      <td className="zahl">{r.schnitt_pro_runde}</td>
                      <td className="zahl">{r.beste_runde}</td>
                      <td className="zahl" style={{ color: r.fehler_gesamt > 0 ? '#c0392b' : 'inherit' }}>{r.fehler_gesamt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Mitglieder</div>
        {mitglieder.length === 0 ? (
          <div className="empty">Noch keine Mitglieder eingetragen.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {mitglieder.map((m, mi) => (
              <div
                key={mi}
                onClick={() => oeffne(m)}
                style={{
                  background: 'var(--grau-hell)',
                  border: '1px solid var(--grau-mid)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,61,143,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
              >
                <div style={{
                  width: 40, height: 40,
                  background: 'var(--tsv-blau)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, flexShrink: 0
                }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  {m.eintrittsdatum && (
                    <div style={{ fontSize: 12, color: 'var(--grau-text)' }}>seit {formatDatum(m.eintrittsdatum)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
