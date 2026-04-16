import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Statistiken() {
  const [mitglieder, setMitglieder] = useState([])
  const [ausgewaehlt, setAusgewaehlt] = useState(null)
  const [daten, setDaten]           = useState([])
  const [laden, setLaden]           = useState(true)

  useEffect(() => {
    supabase.from('mitglieder').select('id, name').eq('aktiv', true).order('name')
      .then(({ data }) => { setMitglieder(data || []); setLaden(false) })
  }, [])

  async function waehle(m) {
    setAusgewaehlt(m)
    const { data } = await supabase
      .from('ergebnisse')
      .select('datum, art, ort, runde, volle_punkte, volle_fehler, abraeumen_punkte, abraeumen_fehler, gesamt_punkte, gesamt_fehler')
      .eq('mitglied_id', m.id)
      .order('datum', { ascending: true })
      .order('runde', { ascending: true })
    setDaten(data || [])
  }

  function schnitt(arr) {
    if (!arr.length) return '–'
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
  }

  function formatDatum(d) {
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  // Gruppiere Runden nach Datum+Art+Ort für Formkurve (ein Spieltag = Durchschnitt aller Runden)
  function gruppiertNachSpieltag() {
    const map = {}
    for (const e of daten) {
      const key = `${e.datum}_${e.art}_${e.ort}`
      if (!map[key]) map[key] = { datum: e.datum, art: e.art, ort: e.ort, punkte: [] }
      map[key].punkte.push(e.gesamt_punkte)
    }
    return Object.values(map).map(s => ({
      ...s,
      schnitt: parseFloat((s.punkte.reduce((a, b) => a + b, 0) / s.punkte.length).toFixed(1)),
      gesamt: s.punkte.reduce((a, b) => a + b, 0),
      runden: s.punkte.length,
    }))
  }

  if (laden) return <div className="loading">Lade…</div>

  if (!ausgewaehlt) return (
    <div className="card">
      <div className="card-title">Statistiken – Mitglied wählen</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {mitglieder.map((m, mi) => (
          <div key={mi} onClick={() => waehle(m)} style={{
            background: 'var(--grau-hell)', border: '1px solid var(--grau-mid)',
            borderRadius: 'var(--radius)', padding: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'box-shadow 0.15s'
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,61,143,0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
            <div style={{
              width: 40, height: 40, background: 'var(--tsv-blau)', color: 'white',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16, flexShrink: 0
            }}>{m.name.charAt(0)}</div>
            <span style={{ fontWeight: 600 }}>{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const spieltage = gruppiertNachSpieltag()
  const allePunkte = daten.map(e => e.gesamt_punkte)
  const training   = daten.filter(e => e.art === 'training').map(e => e.gesamt_punkte)
  const wettkampf  = daten.filter(e => e.art === 'wettkampf').map(e => e.gesamt_punkte)
  const heim       = daten.filter(e => e.ort === 'heim').map(e => e.gesamt_punkte)
  const auswaerts  = daten.filter(e => e.ort === 'auswaerts').map(e => e.gesamt_punkte)
  const volleAlle  = daten.map(e => e.volle_punkte)
  const abraeumen  = daten.map(e => e.abraeumen_punkte)

  // Einfache SVG Formkurve
  const kurveBreite = 520
  const kurveHoehe  = 120
  const minP = Math.min(...spieltage.map(s => s.schnitt)) - 10
  const maxP = Math.max(...spieltage.map(s => s.schnitt)) + 10
  const punkte = spieltage.map((s, mi) => {
    const x = spieltage.length === 1 ? kurveBreite / 2 : (mi / (spieltage.length - 1)) * kurveBreite
    const y = kurveHoehe - ((s.schnitt - minP) / (maxP - minP)) * kurveHoehe
    return { x, y, s }
  })
  const pfad = punkte.map((p, mi) => `${mi === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={() => { setAusgewaehlt(null); setDaten([]) }}>
          ← Zurück
        </button>
      </div>

      <div className="card">
        <div className="card-title">{ausgewaehlt.name}</div>

        {daten.length === 0 ? (
          <div className="empty">Noch keine Ergebnisse vorhanden.</div>
        ) : (
          <div>
            {/* Kennzahlen */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">{schnitt(allePunkte)}</div>
                <div className="stat-label">Schnitt gesamt</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{Math.max(...allePunkte)}</div>
                <div className="stat-label">Beste Runde</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{daten.length}</div>
                <div className="stat-label">Runden gespielt</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{schnitt(volleAlle)}</div>
                <div className="stat-label">Schnitt Volle</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{schnitt(abraeumen)}</div>
                <div className="stat-label">Schnitt Abräumen</div>
              </div>
            </div>

            {/* Formkurve */}
            {spieltage.length > 1 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, color: 'var(--tsv-blau)', marginBottom: 12 }}>Formkurve</div>
                <svg viewBox={`-10 -10 ${kurveBreite + 20} ${kurveHoehe + 20}`} style={{ width: '100%', height: 140 }}>
                  <path d={pfad} fill="none" stroke="var(--tsv-blau)" strokeWidth="2.5" strokeLinejoin="round"/>
                  {punkte.map((p, mi) => (
                    <g key={mi}>
                      <circle cx={p.x} cy={p.y} r="4"
                        fill={p.s.art === 'wettkampf' ? 'var(--tsv-gelb)' : 'var(--tsv-blau)'}
                        stroke="white" strokeWidth="1.5"/>
                    </g>
                  ))}
                </svg>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--grau-text)' }}>
                  <span>🔵 Training</span>
                  <span>🟡 Wettkampf</span>
                </div>
              </div>
            )}

            {/* Vergleiche */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'var(--grau-hell)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--tsv-blau)' }}>Training vs. Wettkampf</div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--tsv-blau)' }}>{schnitt(training)}</div>
                    <div style={{ fontSize: 12, color: 'var(--grau-text)' }}>Training</div>
                    <div style={{ fontSize: 11, color: 'var(--grau-text)' }}>{training.length} Runden</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#92680a' }}>{schnitt(wettkampf)}</div>
                    <div style={{ fontSize: 12, color: 'var(--grau-text)' }}>Wettkampf</div>
                    <div style={{ fontSize: 11, color: 'var(--grau-text)' }}>{wettkampf.length} Runden</div>
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--grau-hell)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--tsv-blau)' }}>Heim vs. Auswärts</div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--tsv-blau)' }}>{schnitt(heim)}</div>
                    <div style={{ fontSize: 12, color: 'var(--grau-text)' }}>🏠 Heim</div>
                    <div style={{ fontSize: 11, color: 'var(--grau-text)' }}>{heim.length} Runden</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#92680a' }}>{schnitt(auswaerts)}</div>
                    <div style={{ fontSize: 12, color: 'var(--grau-text)' }}>✈️ Auswärts</div>
                    <div style={{ fontSize: 11, color: 'var(--grau-text)' }}>{auswaerts.length} Runden</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ergebnis-Tabelle */}
            <div style={{ fontWeight: 600, color: 'var(--tsv-blau)', marginBottom: 12 }}>Alle Ergebnisse</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Art</th>
                    <th>Ort</th>
                    <th className="zahl">Runde</th>
                    <th className="zahl">Volle</th>
                    <th className="zahl">Abräumen</th>
                    <th className="zahl">Gesamt</th>
                    <th className="zahl">Fehler</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daten].reverse().map((e, mi) => (
                    <tr key={mi}>
                      <td style={{ fontSize: 13 }}>{formatDatum(e.datum)}</td>
                      <td><span className={`badge badge-${e.art}`}>{e.art === 'wettkampf' ? 'WK' : 'TR'}</span></td>
                      <td style={{ fontSize: 13 }}>{e.ort === 'heim' ? '🏠' : '✈️'}</td>
                      <td className="zahl">{e.runde}</td>
                      <td className="zahl">{e.volle_punkte}</td>
                      <td className="zahl">{e.abraeumen_punkte}</td>
                      <td className="zahl" style={{ fontWeight: 700, color: 'var(--tsv-blau)' }}>{e.gesamt_punkte}</td>
                      <td className="zahl" style={{ color: e.gesamt_fehler > 0 ? '#c0392b' : 'inherit' }}>{e.gesamt_fehler}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
