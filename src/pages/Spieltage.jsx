import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Spieltage({ nav }) {
  const [spieltage, setSpieltage] = useState([])
  const [ausgewaehlt, setAusgewaehlt] = useState(null)
  const [ergebnisse, setErgebnisse]   = useState([])
  const [laden, setLaden]             = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('spieltage')
        .select('*')
        .order('datum', { ascending: false })
      setSpieltage(data || [])
      setLaden(false)
    }
    load()
  }, [])

  async function oeffne(sp) {
    setAusgewaehlt(sp)
    const { data } = await supabase
      .from('v_spieltag_auswertung')
      .select('*')
      .eq('spieltag_id', sp.id)
      .order('punkte_gesamt', { ascending: false })
    setErgebnisse(data || [])
  }

  function formatDatum(d) {
    return new Date(d).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (laden) return <div className="loading">Lade Spieltage…</div>

  if (ausgewaehlt) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-outline" onClick={() => { setAusgewaehlt(null); setErgebnisse([]) }}>
            ← Zurück
          </button>
        </div>
        <div className="card">
          <div className="card-title">
            {formatDatum(ausgewaehlt.datum)}
            <span className={`badge badge-${ausgewaehlt.art}`}>{ausgewaehlt.art}</span>
          </div>
          {ausgewaehlt.bemerkung && (
            <p style={{ marginBottom: 16, color: 'var(--grau-text)' }}>{ausgewaehlt.bemerkung}</p>
          )}
          {ergebnisse.length === 0 ? (
            <div className="empty">Noch keine Ergebnisse für diesen Spieltag.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mitglied</th>
                    <th className="zahl">Runden</th>
                    <th className="zahl">Volle</th>
                    <th className="zahl">Abräumen</th>
                    <th className="zahl">Gesamt</th>
                    <th className="zahl">Fehler</th>
                    <th className="zahl">Schnitt/Runde</th>
                    <th className="zahl">Beste Runde</th>
                  </tr>
                </thead>
                <tbody>
                  {ergebnisse.map((e, mi) => (
                    <tr key={mi}>
                      <td className="rang">{mi + 1}</td>
                      <td style={{ fontWeight: 600 }}>{e.mitglied_name}</td>
                      <td className="zahl">{e.anzahl_runden}</td>
                      <td className="zahl">{e.volle_punkte_gesamt}</td>
                      <td className="zahl">{e.abraeumen_punkte_gesamt}</td>
                      <td className="zahl" style={{ fontWeight: 700, color: 'var(--tsv-blau)' }}>{e.punkte_gesamt}</td>
                      <td className="zahl" style={{ color: e.fehler_gesamt > 0 ? '#c0392b' : 'inherit' }}>{e.fehler_gesamt}</td>
                      <td className="zahl">{e.schnitt_pro_runde}</td>
                      <td className="zahl">{e.beste_runde}</td>
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

  return (
    <div>
      <div className="card">
        <div className="card-title">Alle Spieltage</div>
        {spieltage.length === 0 ? (
          <div className="empty">Noch keine Spieltage eingetragen.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Art</th>
                  <th>Bemerkung</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {spieltage.map((sp, mi) => (
                  <tr key={mi} style={{ cursor: 'pointer' }} onClick={() => oeffne(sp)}>
                    <td style={{ fontWeight: 600 }}>{formatDatum(sp.datum)}</td>
                    <td><span className={`badge badge-${sp.art}`}>{sp.art}</span></td>
                    <td style={{ color: 'var(--grau-text)' }}>{sp.bemerkung || '–'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--tsv-blau)', fontSize: 13 }}>Details →</span>
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
