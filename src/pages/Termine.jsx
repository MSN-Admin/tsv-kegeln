import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const WOCHENTAGE = ['Mo','Di','Mi','Do','Fr','Sa','So']

export default function Termine() {
  const [termine, setTermine] = useState([])
  const [ansicht, setAnsicht] = useState('liste')
  const [monat, setMonat]     = useState(new Date().getMonth())
  const [jahr, setJahr]       = useState(new Date().getFullYear())
  const [laden, setLaden]     = useState(true)

  useEffect(() => {
    supabase.from('termine').select('*')
      .order('datum', { ascending: true })
      .order('uhrzeit', { ascending: true })
      .then(({ data }) => { setTermine(data || []); setLaden(false) })
  }, [])

  const heute = new Date().toISOString().slice(0, 10)
  const kommend  = termine.filter(t => t.datum >= heute)
  const vergangen = termine.filter(t => t.datum < heute).reverse()

  function artStyle(art) {
    if (art === 'training')  return { bg: '#dce8ff', color: '#003D8F' }
    if (art === 'wettkampf') return { bg: '#fff3cd', color: '#7a5800' }
    return { bg: '#d4edda', color: '#155724' }
  }

  function artLabel(art) {
    if (art === 'training')  return '🎳 Training'
    if (art === 'wettkampf') return '🏆 Wettkampf'
    return '📌 Sonstiges'
  }

  function kalenderTage() {
    let wt = new Date(jahr, monat, 1).getDay()
    wt = wt === 0 ? 6 : wt - 1
    const tage = Array(wt).fill(null)
    for (let d = 1; d <= new Date(jahr, monat + 1, 0).getDate(); d++) tage.push(d)
    return tage
  }

  function termineAmTag(tag) {
    if (!tag) return []
    const datum = `${jahr}-${String(monat + 1).padStart(2, '0')}-${String(tag).padStart(2, '0')}`
    return termine.filter(t => t.datum === datum)
  }

  function vorMonat() {
    if (monat === 0) { setMonat(11); setJahr(j => j - 1) }
    else setMonat(m => m - 1)
  }

  function nachMonat() {
    if (monat === 11) { setMonat(0); setJahr(j => j + 1) }
    else setMonat(m => m + 1)
  }

  if (laden) return <div className="loading">Lade Termine…</div>

  return (
    <div>
      {/* Ansicht wählen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <button className={ansicht === 'liste' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ fontSize: 17, padding: '14px' }}
          onClick={() => setAnsicht('liste')}>
          📋 Liste
        </button>
        <button className={ansicht === 'kalender' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ fontSize: 17, padding: '14px' }}
          onClick={() => setAnsicht('kalender')}>
          📅 Kalender
        </button>
      </div>

      {/* LISTE */}
      {ansicht === 'liste' && (
        <div>
          {termine.length === 0 && (
            <div className="card"><div className="empty">Noch keine Termine eingetragen.</div></div>
          )}

          {kommend.length > 0 && (
            <div className="card">
              <div className="card-title">Kommende Termine</div>
              {kommend.map((t, i) => <TerminKarte key={i} t={t} artStyle={artStyle} artLabel={artLabel} />)}
            </div>
          )}

          {vergangen.length > 0 && (
            <div className="card" style={{ opacity: 0.75 }}>
              <div className="card-title" style={{ fontSize: 16, color: 'var(--grau-text)' }}>
                Vergangene Termine
              </div>
              {vergangen.slice(0, 5).map((t, i) => <TerminKarte key={i} t={t} artStyle={artStyle} artLabel={artLabel} vergangen />)}
            </div>
          )}
        </div>
      )}

      {/* KALENDER */}
      {ansicht === 'kalender' && (
        <div className="card">
          {/* Monat Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button className="btn btn-outline" style={{ padding: '10px 18px', fontSize: 20 }} onClick={vorMonat}>‹</button>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--blau)' }}>
              {MONATE[monat]} {jahr}
            </span>
            <button className="btn btn-outline" style={{ padding: '10px 18px', fontSize: 20 }} onClick={nachMonat}>›</button>
          </div>

          {/* Wochentage */}
          <div className="kalender-grid" style={{ marginBottom: 4 }}>
            {WOCHENTAGE.map(w => (
              <div key={w} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', padding: '4px 0' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Tage */}
          <div className="kalender-grid">
            {kalenderTage().map((tag, i) => {
              const tagTermine = termineAmTag(tag)
              const datumStr = tag
                ? `${jahr}-${String(monat + 1).padStart(2, '0')}-${String(tag).padStart(2, '0')}`
                : ''
              const istHeute = datumStr === heute
              return (
                <div key={i} className={`kalender-tag ${!tag ? 'leer' : ''} ${istHeute ? 'heute' : ''}`}>
                  {tag && (
                    <>
                      <div style={{
                        textAlign: 'center', fontSize: 14, fontWeight: istHeute ? 700 : 400,
                        color: istHeute ? 'var(--blau)' : 'var(--text)', marginBottom: 2
                      }}>
                        {tag}
                      </div>
                      {tagTermine.map((t, ti) => {
                        const s = artStyle(t.art)
                        return (
                          <div key={ti} style={{
                            fontSize: 10, padding: '2px 3px', borderRadius: 4,
                            background: s.bg, color: s.color, fontWeight: 700,
                            lineHeight: 1.3, marginBottom: 2
                          }}>
                            {t.uhrzeit ? t.uhrzeit.slice(0, 5) + ' ' : ''}{t.titel}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TerminKarte({ t, artStyle, artLabel, vergangen }) {
  const s = artStyle(t.art)
  const d = new Date(t.datum)
  return (
    <div className="termin-karte">
      <div className="termin-datum-box" style={{ background: s.bg }}>
        <div className="termin-tag" style={{ color: s.color }}>{d.getDate()}</div>
        <div className="termin-mon" style={{ color: s.color }}>
          {d.toLocaleDateString('de-DE', { month: 'short' })}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div className="termin-titel">{t.titel}</div>
        <div className="termin-info">
          <span className="badge" style={{ background: s.bg, color: s.color }}>{artLabel(t.art)}</span>
          {t.uhrzeit && <span>🕐 {t.uhrzeit.slice(0, 5)} Uhr</span>}
          {t.ort && <span>📍 {t.ort}</span>}
        </div>
        {t.beschreibung && (
          <div style={{ fontSize: 14, color: 'var(--grau-text)', marginTop: 6 }}>{t.beschreibung}</div>
        )}
      </div>
    </div>
  )
}
