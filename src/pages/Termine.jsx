import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const MONATE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const MONATE_LANG = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const WOCHENTAGE = ['Mo','Di','Mi','Do','Fr','Sa','So']

export default function Termine() {
  const [termine, setTermine]     = useState([])
  const [ansicht, setAnsicht]     = useState('liste')
  const [laden, setLaden]         = useState(true)
  const heute = new Date()
  const [filterMonat, setFilterMonat] = useState(null)
  const [filterJahr, setFilterJahr]   = useState(null)
  const [kalMonat, setKalMonat]   = useState(heute.getMonth())
  const [kalJahr, setKalJahr]     = useState(heute.getFullYear())

  useEffect(() => {
    supabase.from('termine').select('*')
      .order('datum', { ascending: true })
      .order('uhrzeit', { ascending: true })
      .then(({ data }) => { setTermine(data || []); setLaden(false) })
  }, [])

  const heuteStr = heute.toISOString().slice(0, 10)

  // Nächste 4 Wochen
  const vierWochen = new Date()
  vierWochen.setDate(vierWochen.getDate() + 28)
  const vierWochenStr = vierWochen.toISOString().slice(0, 10)

  // Gefilterte Termine
  const gefilterteTermine = termine.filter(t => {
    if (filterMonat !== null && filterJahr !== null) {
      const d = new Date(t.datum)
      return d.getMonth() === filterMonat && d.getFullYear() === filterJahr
    }
    return t.datum >= heuteStr && t.datum <= vierWochenStr
  })

  const kommend  = termine.filter(t => t.datum >= heuteStr)
  const vergangen = termine.filter(t => t.datum < heuteStr).reverse()

  // Verfügbare Jahre/Monate aus Terminen
  const verfuegbareJahre = [...new Set(termine.map(t => new Date(t.datum).getFullYear()))].sort((a,b) => b-a)

  function artStyle(art) {
    if (art === 'training')  return { bg: '#dce8ff', color: '#003D8F' }
    if (art === 'wettkampf') return { bg: '#fff3cd', color: '#7a5800' }
    if (art === 'ausflug')   return { bg: '#fde8ff', color: '#6a0080' }
    if (art === 'sitzung')   return { bg: '#e8f4ff', color: '#005a8e' }
    return { bg: '#d4edda', color: '#155724' }
  }

  function artLabel(art) {
    if (art === 'training')  return '🎳 Training'
    if (art === 'wettkampf') return '🏆 Wettkampf'
    if (art === 'ausflug')   return '🚌 Ausflug'
    if (art === 'sitzung')   return '📋 Sitzung'
    return '📌 Sonstiges'
  }

  function kalenderTage() {
    let wt = new Date(kalJahr, kalMonat, 1).getDay()
    wt = wt === 0 ? 6 : wt - 1
    const tage = Array(wt).fill(null)
    for (let d = 1; d <= new Date(kalJahr, kalMonat + 1, 0).getDate(); d++) tage.push(d)
    return tage
  }

  function termineAmTag(tag) {
    if (!tag) return []
    const datum = `${kalJahr}-${String(kalMonat + 1).padStart(2, '0')}-${String(tag).padStart(2, '0')}`
    return termine.filter(t => t.datum === datum)
  }

  if (laden) return <div className="loading">Lade Termine…</div>

  return (
    <div>
      {/* Ansicht wählen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <button className={ansicht === 'liste' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ fontSize: 17, padding: '14px' }}
          onClick={() => setAnsicht('liste')}>📋 Liste</button>
        <button className={ansicht === 'kalender' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ fontSize: 17, padding: '14px' }}
          onClick={() => setAnsicht('kalender')}>📅 Kalender</button>
      </div>

      {/* LISTE */}
      {ansicht === 'liste' && (
        <div>
          {/* Filter */}
          <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 10 }}>FILTER</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => { setFilterMonat(null); setFilterJahr(null) }}
                style={{
                  padding: '6px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8,
                  border: '2px solid', cursor: 'pointer',
                  borderColor: filterMonat === null ? 'var(--blau)' : 'var(--grau-mid)',
                  background: filterMonat === null ? 'var(--blau)' : 'var(--weiss)',
                  color: filterMonat === null ? 'var(--weiss)' : 'var(--grau-text)',
                }}>
                Nächste 4 Wochen
              </button>

              {verfuegbareJahre.map(jahr => (
                MONATE.map((mon, mi) => {
                  const hatTermine = termine.some(t => {
                    const d = new Date(t.datum)
                    return d.getMonth() === mi && d.getFullYear() === jahr
                  })
                  if (!hatTermine) return null
                  const aktiv = filterMonat === mi && filterJahr === jahr
                  return (
                    <button key={`${jahr}-${mi}`}
                      onClick={() => { setFilterMonat(mi); setFilterJahr(jahr) }}
                      style={{
                        padding: '6px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8,
                        border: '2px solid', cursor: 'pointer',
                        borderColor: aktiv ? 'var(--blau)' : 'var(--grau-mid)',
                        background: aktiv ? 'var(--blau)' : 'var(--weiss)',
                        color: aktiv ? 'var(--weiss)' : 'var(--grau-text)',
                      }}>
                      {mon} {jahr}
                    </button>
                  )
                })
              ))}
            </div>
          </div>

          {gefilterteTermine.length === 0 && (
            <div className="card"><div className="empty">Keine Termine in diesem Zeitraum.</div></div>
          )}

          {gefilterteTermine.length > 0 && (
            <div className="card">
              <div className="card-title">
                {filterMonat !== null
                  ? `${MONATE_LANG[filterMonat]} ${filterJahr}`
                  : 'Nächste 4 Wochen'}
              </div>
              {gefilterteTermine.map((t, i) => <TerminKarte key={i} t={t} artStyle={artStyle} artLabel={artLabel} />)}
            </div>
          )}

          {filterMonat === null && kommend.length === 0 && vergangen.length > 0 && (
            <div className="card" style={{ opacity: 0.7 }}>
              <div className="card-title" style={{ fontSize: 16 }}>Vergangene Termine</div>
              {vergangen.slice(0, 5).map((t, i) => <TerminKarte key={i} t={t} artStyle={artStyle} artLabel={artLabel} vergangen />)}
            </div>
          )}
        </div>
      )}

      {/* KALENDER */}
      {ansicht === 'kalender' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button className="btn btn-outline" style={{ padding: '10px 18px', fontSize: 20 }}
              onClick={() => { if (kalMonat === 0) { setKalMonat(11); setKalJahr(j => j-1) } else setKalMonat(m => m-1) }}>‹</button>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--blau)' }}>
              {MONATE_LANG[kalMonat]} {kalJahr}
            </span>
            <button className="btn btn-outline" style={{ padding: '10px 18px', fontSize: 20 }}
              onClick={() => { if (kalMonat === 11) { setKalMonat(0); setKalJahr(j => j+1) } else setKalMonat(m => m+1) }}>›</button>
          </div>

          <div className="kalender-grid" style={{ marginBottom: 4 }}>
            {WOCHENTAGE.map(w => (
              <div key={w} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', padding: '4px 0' }}>{w}</div>
            ))}
          </div>

          <div className="kalender-grid">
            {kalenderTage().map((tag, i) => {
              const tagTermine = termineAmTag(tag)
              const datumStr = tag ? `${kalJahr}-${String(kalMonat+1).padStart(2,'0')}-${String(tag).padStart(2,'0')}` : ''
              const istHeute = datumStr === heuteStr
              return (
                <div key={i} className={`kalender-tag ${!tag ? 'leer' : ''} ${istHeute ? 'heute' : ''}`}>
                  {tag && (
                    <>
                      <div style={{ textAlign: 'center', fontSize: 14, fontWeight: istHeute ? 700 : 400, color: istHeute ? 'var(--blau)' : 'var(--text)', marginBottom: 2 }}>
                        {tag}
                      </div>
                      {tagTermine.map((t, ti) => {
                        const s = artStyle(t.art)
                        return (
                          <div key={ti} style={{ fontSize: 10, padding: '2px 3px', borderRadius: 4, background: s.bg, color: s.color, fontWeight: 700, lineHeight: 1.3, marginBottom: 2 }}>
                            {t.uhrzeit ? t.uhrzeit.slice(0,5)+' ' : ''}{t.titel}
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
    <div style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--grau-mid)', opacity: vergangen ? 0.6 : 1 }}>
      <div style={{ flexShrink: 0, width: 56, borderRadius: 10, padding: '10px 4px', textAlign: 'center', background: s.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{d.getDate()}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginTop: 2 }}>{d.toLocaleDateString('de-DE', { month: 'short' })}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.titel}</div>
        <div style={{ fontSize: 14, color: 'var(--grau-text)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <span className="badge" style={{ background: s.bg, color: s.color }}>{artLabel(t.art)}</span>
          {t.uhrzeit && <span>🕐 {t.uhrzeit.slice(0,5)} Uhr</span>}
          {t.ort && <span>📍 {t.ort}</span>}
        </div>
        {t.beschreibung && <div style={{ fontSize: 14, color: 'var(--grau-text)', marginTop: 6 }}>{t.beschreibung}</div>}
      </div>
    </div>
  )
}
