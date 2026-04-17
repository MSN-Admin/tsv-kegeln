import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auswaerts() {
  const [orte, setOrte]         = useState([])
  const [suche, setSuche]       = useState('')
  const [laden, setLaden]       = useState(true)
  const [offen, setOffen]       = useState(null)

  useEffect(() => {
    supabase.from('auswaertsorte').select('*').order('name')
      .then(({ data }) => { setOrte(data || []); setLaden(false) })
  }, [])

  const gefiltert = suche
    ? orte.filter(o => o.name.toLowerCase().includes(suche.toLowerCase()))
    : orte

  function mapsLink(adresse) {
    if (!adresse) return null
    // Direkte Routenberechnung von aktuellem Standort zur Adresse
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(adresse)}`
  }

  function appleMapsLink(adresse) {
    if (!adresse) return null
    return `https://maps.apple.com/?daddr=${encodeURIComponent(adresse)}&dirflg=d`
  }

  if (laden) return <div className="loading">Lade Vereine…</div>

  return (
    <div>
      <div className="card">
        <div className="card-title">✈️ Auswärtsvereine</div>
        <p style={{ fontSize: 15, color: 'var(--grau-text)', marginBottom: 14 }}>
          Adressen und Anfahrt zu allen Auswärtsgegnern.
        </p>

        {/* Suche */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={suche}
            onChange={e => setSuche(e.target.value)}
            placeholder="Verein suchen…"
            style={{ fontSize: 16, padding: '12px 14px', border: '2px solid var(--grau-mid)', borderRadius: 10, width: '100%' }}
          />
        </div>

        {gefiltert.length === 0 && <div className="empty">Kein Verein gefunden.</div>}

        {gefiltert.map((o, i) => {
          const istOffen = offen === o.id
          const maps = o.maps_url || mapsLink(o.adresse)
          const apple = appleMapsLink(o.adresse)

          return (
            <div key={i} style={{
              border: `2px solid ${istOffen ? 'var(--blau)' : 'var(--grau-mid)'}`,
              borderRadius: 12,
              marginBottom: 10,
              overflow: 'hidden',
              background: istOffen ? '#f0f4ff' : 'var(--weiss)',
            }}>
              {/* Kopfzeile */}
              <div
                onClick={() => setOffen(istOffen ? null : o.id)}
                style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', gap: 12 }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: o.logo_url ? '#f0f0f0' : 'var(--blau)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, flexShrink: 0, overflow: 'hidden'
                }}>
                  {o.logo_url
                    ? <img src={o.logo_url} alt={o.name} style={{ width: 42, height: 42, objectFit: 'contain' }} onError={e => { e.target.style.display='none' }} />
                    : o.name.charAt(0)
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{o.name}</div>
                  {o.adresse ? (
                    <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 2 }}>{o.adresse}</div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#bbb', marginTop: 2 }}>Adresse noch nicht eingetragen</div>
                  )}
                </div>
                <div style={{ fontSize: 22, color: istOffen ? 'var(--blau)' : 'var(--grau-text)' }}>
                  {istOffen ? '▲' : '▼'}
                </div>
              </div>

              {/* Details */}
              {istOffen && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--grau-mid)' }}>
                  {o.adresse && (
                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 4 }}>ADRESSE</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{o.adresse}</div>
                    </div>
                  )}

                  {o.zusatz && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 4 }}>HINWEIS</div>
                      <div style={{ fontSize: 15, color: 'var(--text)' }}>{o.zusatz}</div>
                    </div>
                  )}

                  {o.adresse ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                      <a
                        href={maps}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '12px', borderRadius: 10, background: '#003D8F', color: 'white',
                          fontWeight: 700, fontSize: 15, textDecoration: 'none'
                        }}
                      >
                        🗺️ Google Maps
                      </a>
                      <a
                        href={apple}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '12px', borderRadius: 10, background: '#555', color: 'white',
                          fontWeight: 700, fontSize: 15, textDecoration: 'none'
                        }}
                      >
                        🍎 Apple Maps
                      </a>
                    </div>
                  ) : (
                    <div style={{ background: '#fff3cd', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#7a5800' }}>
                      📍 Adresse noch nicht eingetragen – bitte Admin kontaktieren.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
