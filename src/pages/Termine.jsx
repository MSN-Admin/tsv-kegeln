import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const WOCHENTAGE = ['Mo','Di','Mi','Do','Fr','Sa','So']

export default function Termine() {
  const [termine, setTermine]   = useState([])
  const [ansicht, setAnsicht]   = useState('liste')
  const [monat, setMonat]       = useState(new Date().getMonth())
  const [jahr, setJahr]         = useState(new Date().getFullYear())
  const [laden, setLaden]       = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('termine')
        .select('*')
        .order('datum', { ascending: true })
        .order('uhrzeit', { ascending: true })
      setTermine(data || [])
      setLaden(false)
    }
    load()
  }, [])

  function formatDatum(d) {
    return new Date(d).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  }

  function formatUhrzeit(t) {
    if (!t) return ''
    return t.slice(0, 5) + ' Uhr'
  }

  function artFarbe(art) {
    if (art === 'training')   return { bg: '#e8f0fe', color: '#1a56c4' }
    if (art === 'wettkampf')  return { bg: '#fef3cd', color: '#92680a' }
    return { bg: '#e8f5e9', color: '#2e7d32' }
  }

  function artLabel(art) {
    if (art === 'training')  return 'Training'
    if (art === 'wettkampf') return 'Wettkampf'
    return 'Sonstiges'
  }

  // Zukünftige Termine
  const heute = new Date().toISOString().slice(0, 10)
  const kommend = termine.filter(t => t.datum >= heute)
  const vergangen = termine.filter(t => t.datum < heute)

  // Kalender-Logik
  function kalenderTage() {
    const ersterTag = new Date(jahr, monat, 1)
    const letzterTag = new Date(jahr, monat + 1, 0)
    let wochentag = ersterTag.getDay() // 0=So
    wochentag = wochentag === 0 ? 6 : wochentag - 1 // Mo=0

    const tage = []
    for (let i = 0; i < wochentag; i++) tage.push(null)
    for (let d = 1; d <= letzterTag.getDate(); d++) tage.push(d)
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
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Termine</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={ansicht === 'liste' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setAnsicht('liste')}>Liste</button>
            <button className={ansicht === 'kalender' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setAnsicht('kalender')}>Kalender</button>
          </div>
        </div>

        {/* LISTE */}
        {ansicht === 'liste' && (
          <div>
            {termine.length === 0 && <div className="empty">Noch keine Termine eingetragen.</div>}

            {kommend.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 12, letterSpacing: 1 }}>
                  KOMMENDE TERMINE
                </div>
                {kommend.map((t, mi) => (
                  <TerminKarte key={mi} t={t} formatDatum={formatDatum} formatUhrzeit={formatUhrzeit} artFarbe={artFarbe} artLabel={artLabel} />
                ))}
              </div>
            )}

            {vergangen.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 12, letterSpacing: 1 }}>
                  VERGANGENE TERMINE
                </div>
                {[...vergangen].reverse().map((t, mi) => (
                  <TerminKarte key={mi} t={t} formatDatum={formatDatum} formatUhrzeit={formatUhrzeit} artFarbe={artFarbe} artLabel={artLabel} vergangen />
                ))}
              </div>
            )}
          </div>
        )}

        {/* KALENDER */}
        {ansicht === 'kalender' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={vorMonat}>←</button>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--tsv-blau)' }}>
                {MONATE[monat]} {jahr}
              </span>
              <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={nachMonat}>→</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {WOCHENTAGE.map(w => (
                <div key={w} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--grau-text)', padding: '4px 0' }}>
                  {w}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {kalenderTage().map((tag, mi) => {
                const tagTermine = termineAmTag(tag)
                const istHeute = tag && `${jahr}-${String(monat + 1).padStart(2, '0')}-${String(tag).padStart(2, '0')}` === heute
                return (
                  <div key={mi} style={{
                    minHeight: 64,
                    background: tag ? (istHeute ? '#e8f0fe' : 'var(--grau-hell)') : 'transparent',
                    borderRadius: 'var(--radius)',
                    padding: '6px 4px',
                    border: istHeute ? '2px solid var(--tsv-blau)' : '1px solid var(--grau-mid)',
                    borderColor: tag ? undefined : 'transparent',
                  }}>
                    {tag && (
                      <>
                        <div style={{
                          fontSize: 13, fontWeight: istHeute ? 700 : 400,
                          color: istHeute ? 'var(--tsv-blau)' : 'var(--text)',
                          marginBottom: 4, textAlign: 'center'
                        }}>
                          {tag}
                        </div>
                        {tagTermine.map((t, ti) => (
                          <div key={ti} style={{
                            fontSize: 10, padding: '2px 4px', borderRadius: 3,
                            marginBottom: 2, lineHeight: 1.3,
                            ...artFarbe(t.art)
                          }}>
                            {t.uhrzeit ? formatUhrzeit(t.uhrzeit) + ' ' : ''}{t.titel}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TerminKarte({ t, formatDatum, formatUhrzeit, artFarbe, artLabel, vergangen }) {
  const farbe = artFarbe(t.art)
  return (
    <div style={{
      display: 'flex', gap: 16, padding: '14px 0',
      borderBottom: '1px solid var(--grau-mid)',
      opacity: vergangen ? 0.6 : 1
    }}>
      <div style={{
        flexShrink: 0, width: 52, textAlign: 'center',
        background: farbe.bg, borderRadius: 'var(--radius)',
        padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: farbe.color, lineHeight: 1 }}>
          {new Date(t.datum).getDate()}
        </div>
        <div style={{ fontSize: 11, color: farbe.color }}>
          {new Date(t.datum).toLocaleDateString('de-DE', { month: 'short' })}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t.titel}</span>
          <span className="badge" style={{ background: farbe.bg, color: farbe.color }}>{artLabel(t.art)}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--grau-text)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {t.uhrzeit && <span>🕐 {formatUhrzeit(t.uhrzeit)}</span>}
          {t.ort && <span>📍 {t.ort}</span>}
        </div>
        {t.beschreibung && (
          <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 4 }}>{t.beschreibung}</div>
        )}
      </div>
    </div>
  )
}
