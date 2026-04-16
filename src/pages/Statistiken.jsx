import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Statistiken() {
  const [mitglieder, setMitglieder] = useState([])
  const [ausgewaehlt, setAusgewaehlt] = useState(null)
  const [daten, setDaten]             = useState([])
  const [laden, setLaden]             = useState(true)
  const [tab, setTab]                 = useState('uebersicht')

  useEffect(() => {
    supabase.from('mitglieder').select('id, name').eq('aktiv', true).order('name')
      .then(({ data }) => { setMitglieder(data || []); setLaden(false) })
  }, [])

  async function waehle(m) {
    setAusgewaehlt(m)
    setTab('uebersicht')
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
      runden: s.punkte.length,
    }))
  }

  if (laden) return <div className="loading">Lade…</div>

  // Mitglied wählen
  if (!ausgewaehlt) return (
    <div>
      <div className="card">
        <div className="card-title">📊 Statistiken</div>
        <p style={{ fontSize: 16, color: 'var(--grau-text)', marginBottom: 16 }}>
          Tippe auf deinen Namen um deine Statistiken zu sehen.
        </p>
        {mitglieder.map((m, i) => (
          <div key={i} className="mitglied-karte" onClick={() => waehle(m)}>
            <div className="mitglied-avatar">{m.name.charAt(0).toUpperCase()}</div>
            <div className="mitglied-name">{m.name}</div>
            <div style={{ marginLeft: 'auto', color: 'var(--blau)', fontSize: 22 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )

  const spieltage  = gruppiertNachSpieltag()
  const allePunkte = daten.map(e => e.gesamt_punkte)
  const training   = daten.filter(e => e.art === 'training').map(e => e.gesamt_punkte)
  const wettkampf  = daten.filter(e => e.art === 'wettkampf').map(e => e.gesamt_punkte)
  const heim       = daten.filter(e => e.ort === 'heim').map(e => e.gesamt_punkte)
  const auswaerts  = daten.filter(e => e.ort === 'auswaerts').map(e => e.gesamt_punkte)
  const volleAlle  = daten.map(e => e.volle_punkte)
  const abraeumen  = daten.map(e => e.abraeumen_punkte)

  // Formkurve SVG
  const kurveB = 560
  const kurveH = 100
  const minP = spieltage.length ? Math.min(...spieltage.map(s => s.schnitt)) - 10 : 0
  const maxP = spieltage.length ? Math.max(...spieltage.map(s => s.schnitt)) + 10 : 200
  const kurvePunkte = spieltage.map((s, i) => ({
    x: spieltage.length === 1 ? kurveB / 2 : (i / (spieltage.length - 1)) * kurveB,
    y: kurveH - ((s.schnitt - minP) / (maxP - minP || 1)) * kurveH,
    s,
  }))
  const pfad = kurvePunkte.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div>
      {/* Zurück */}
      <button className="btn btn-outline" style={{ marginBottom: 14 }}
        onClick={() => { setAusgewaehlt(null); setDaten([]) }}>
        ← Zurück
      </button>

      {/* Name */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="mitglied-avatar" style={{ width: 54, height: 54, fontSize: 24 }}>
            {ausgewaehlt.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{ausgewaehlt.name}</div>
            <div style={{ fontSize: 14, color: 'var(--grau-text)' }}>{daten.length} Runden gespielt</div>
          </div>
        </div>
      </div>

      {daten.length === 0 ? (
        <div className="card"><div className="empty">Noch keine Ergebnisse vorhanden.</div></div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { key: 'uebersicht', label: '📊 Übersicht' },
              { key: 'verlauf',    label: '📈 Verlauf' },
              { key: 'ergebnisse', label: '📋 Alle' },
            ].map(t => (
              <button key={t.key}
                className={tab === t.key ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ fontSize: 14, padding: '10px 8px' }}
                onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ÜBERSICHT */}
          {tab === 'uebersicht' && (
            <div>
              {/* Kennzahlen */}
              <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="stat-card">
                  <div className="stat-value">{schnitt(allePunkte)}</div>
                  <div className="stat-label">Ø Gesamt</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--gruen)' }}>
                    {allePunkte.length ? Math.max(...allePunkte) : '–'}
                  </div>
                  <div className="stat-label">Beste Runde</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{schnitt(volleAlle)}</div>
                  <div className="stat-label">Ø Volle</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{schnitt(abraeumen)}</div>
                  <div className="stat-label">Ø Abräumen</div>
                </div>
                {wettkampf.length > 0 && (
                  <div className="stat-card" style={{ gridColumn: '1 / -1', borderTopColor: '#F5C400', background: '#fff9e6' }}>
                    <div className="stat-value" style={{ color: '#7a5800', fontSize: 36 }}>
                      {wettkampf.reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="stat-label" style={{ color: '#7a5800' }}>🏆 Wettkampf Gesamt ({wettkampf.length} Runden)</div>
                  </div>
                )}
              </div>

              {/* Training vs Wettkampf */}
              <div className="card">
                <div className="card-title" style={{ fontSize: 17 }}>Training vs. Wettkampf</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#dce8ff', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blau)' }}>{schnitt(training)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blau)', marginTop: 4 }}>🎳 Training</div>
                    <div style={{ fontSize: 13, color: 'var(--grau-text)' }}>{training.length} Runden</div>
                  </div>
                  <div style={{ background: '#fff3cd', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#7a5800' }}>{schnitt(wettkampf)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#7a5800', marginTop: 4 }}>🏆 Wettkampf</div>
                    <div style={{ fontSize: 13, color: 'var(--grau-text)' }}>{wettkampf.length} Runden</div>
                  </div>
                </div>
              </div>

              {/* Heim vs Auswärts */}
              <div className="card">
                <div className="card-title" style={{ fontSize: 17 }}>Zuhause vs. Auswärts</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#d4edda', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#155724' }}>{schnitt(heim)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#155724', marginTop: 4 }}>🏠 Zuhause</div>
                    <div style={{ fontSize: 13, color: 'var(--grau-text)' }}>{heim.length} Runden</div>
                  </div>
                  <div style={{ background: '#fde8e8', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#7a1a1a' }}>{schnitt(auswaerts)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#7a1a1a', marginTop: 4 }}>✈️ Auswärts</div>
                    <div style={{ fontSize: 13, color: 'var(--grau-text)' }}>{auswaerts.length} Runden</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VERLAUF */}
          {tab === 'verlauf' && (
            <div className="card">
              <div className="card-title" style={{ fontSize: 17 }}>📈 Formkurve</div>
              {spieltage.length < 2 ? (
                <div className="empty">Mindestens 2 Spieltage für die Formkurve nötig.</div>
              ) : (
                <>
                  <svg viewBox={`-10 -15 ${kurveB + 20} ${kurveH + 30}`} style={{ width: '100%', height: 130 }}>
                    <path d={pfad} fill="none" stroke="var(--blau)" strokeWidth="2.5" strokeLinejoin="round"/>
                    {kurvePunkte.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="6"
                          fill={p.s.art === 'wettkampf' ? 'var(--gelb)' : 'var(--blau)'}
                          stroke="white" strokeWidth="2"/>
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill="var(--blau)" fontWeight="700">
                          {p.s.schnitt}
                        </text>
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--grau-text)', marginTop: 8 }}>
                    <span>🔵 Training</span>
                    <span>🟡 Wettkampf</span>
                  </div>

                  {/* Spieltag-Liste */}
                  <div style={{ marginTop: 16 }}>
                    {[...spieltage].reverse().map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 0', borderBottom: '1px solid var(--grau-mid)',
                        fontSize: 15
                      }}>
                        <div>
                          <span style={{ fontWeight: 700 }}>
                            {new Date(s.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          <span style={{ marginLeft: 10 }}>
                            <span className={`badge badge-${s.art}`}>{s.art === 'wettkampf' ? 'Wettkampf' : 'Training'}</span>
                          </span>
                          <span style={{ marginLeft: 6 }}>{s.ort === 'heim' ? '🏠' : '✈️'}</span>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--blau)', fontSize: 18 }}>{s.schnitt} Ø</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ALLE ERGEBNISSE */}
          {tab === 'ergebnisse' && (
            <div className="card">
              <div className="card-title" style={{ fontSize: 17 }}>📋 Alle Ergebnisse</div>
              {[...daten].reverse().map((e, i) => (
                <div key={i} style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--grau-mid)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      {new Date(e.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' '}· Runde {e.runde}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blau)' }}>{e.gesamt_punkte}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 14, color: 'var(--grau-text)' }}>
                    <span className={`badge badge-${e.art}`}>{e.art === 'wettkampf' ? 'Wettkampf' : 'Training'}</span>
                    <span>{e.ort === 'heim' ? '🏠 Zuhause' : '✈️ Auswärts'}</span>
                    <span>Volle: {e.volle_punkte}</span>
                    <span>Abräumen: {e.abraeumen_punkte}</span>
                    {e.gesamt_fehler > 0 && (
                      <span style={{ color: 'var(--rot)', fontWeight: 700 }}>{e.gesamt_fehler} Fehler</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
