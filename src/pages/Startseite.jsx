import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Startseite({ nav }) {
  const [rangliste, setRangliste] = useState([])
  const [letzte, setLetzte]       = useState([])
  const [naechster, setNaechster] = useState(null)
  const [laden, setLaden]         = useState(true)

  useEffect(() => {
    async function load() {
      const saison = getSaison()

      // Rangliste
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
          if (!map[id]) map[id] = { name, punkte: [], wettkampf: [], beste: 0 }
          map[id].punkte.push(e.gesamt_punkte)
          map[id].beste = Math.max(map[id].beste, e.gesamt_punkte)
          if (e.art === 'wettkampf') map[id].wettkampf.push(e.gesamt_punkte)
        }
        const liste = Object.values(map).map(m => ({
          name: m.name,
          schnitt: (m.punkte.reduce((a, b) => a + b, 0) / m.punkte.length).toFixed(1),
          beste: m.beste,
          runden: m.punkte.length,
          wettkampfGesamt: m.wettkampf.length > 0 ? m.wettkampf.reduce((a, b) => a + b, 0) : null,
        })).sort((a, b) => parseFloat(b.schnitt) - parseFloat(a.schnitt))
        setRangliste(liste)
      }

      // Letzte Ergebnisse
      const { data: letzteErg } = await supabase
        .from('ergebnisse')
        .select('datum, art, ort, gesamt_punkte, mitglieder(name)')
        .order('datum', { ascending: false })
        .order('erstellt_am', { ascending: false })
        .limit(8)
      setLetzte(letzteErg || [])

      // Nächster Termin
      const heute = new Date().toISOString().slice(0, 10)
      const { data: term } = await supabase
        .from('termine')
        .select('*')
        .gte('datum', heute)
        .order('datum', { ascending: true })
        .limit(1)
        .single()
      setNaechster(term || null)

      setLaden(false)
    }
    load()
  }, [])

  function getSaison() {
    const heute = new Date()
    const jahr = heute.getMonth() >= 8 ? heute.getFullYear() : heute.getFullYear() - 1
    return { start: `${jahr}-09-01`, end: `${jahr + 1}-04-30` }
  }

  const saison = getSaison()
  const saisonLabel = `${new Date(saison.start).getFullYear()}/${String(new Date(saison.end).getFullYear()).slice(2)}`

  function rangIcon(i) {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return i + 1
  }

  function artFarbe(art) {
    if (art === 'training')  return { bg: '#dce8ff', color: '#003D8F' }
    if (art === 'wettkampf') return { bg: '#fff3cd', color: '#7a5800' }
    return { bg: '#d4edda', color: '#155724' }
  }

  if (laden) return <div className="loading">🎳 Lade Daten…</div>

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div>
          <h2>TSV UG Kegeln</h2>
          <p>Saison {saisonLabel}</p>
        </div>
        <div className="hero-kegel">🎳</div>
      </div>

      {/* Nächster Termin */}
      {naechster && (
        <div className="card" style={{ borderLeft: '5px solid var(--gelb)', cursor: 'pointer' }}
          onClick={() => nav('termine')}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 6, letterSpacing: 1 }}>
            NÄCHSTER TERMIN
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--blau)', marginBottom: 4 }}>
            {naechster.titel}
          </div>
          <div style={{ fontSize: 15, color: 'var(--grau-text)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span>📅 {new Date(naechster.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
            {naechster.uhrzeit && <span>🕐 {naechster.uhrzeit.slice(0, 5)} Uhr</span>}
            {naechster.ort && <span>📍 {naechster.ort}</span>}
          </div>
        </div>
      )}

      {/* Ergebnis eintragen CTA */}
      <button
        className="btn btn-gelb btn-voll"
        style={{ fontSize: 20, padding: '18px', marginBottom: 16, borderRadius: 12 }}
        onClick={() => nav('eintragen')}
      >
        🎳 Ergebnis eintragen
      </button>

      <div className="start-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Rangliste */}
        <div className="card">
          <div className="card-title">🏆 Rangliste</div>
          {rangliste.length === 0 ? (
            <div className="empty">Noch keine Ergebnisse.</div>
          ) : (
            rangliste.slice(0, 8).map((m, i) => (
              <div key={i} className="rang-karte">
                <div className="rang-nr">{rangIcon(i)}</div>
                <div style={{ flex: 1 }}>
                  <div className="rang-name">{m.name}</div>
                  <div className="rang-sub">{m.runden} Runden</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="rang-punkte">{m.schnitt}</div>
                  <div className="rang-sub">Ø Punkte</div>
                </div>
                {m.wettkampfGesamt !== null && (
                  <div style={{ textAlign: 'right', marginLeft: 8, background: '#fff3cd', borderRadius: 8, padding: '4px 8px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#7a5800' }}>{m.wettkampfGesamt}</div>
                    <div style={{ fontSize: 11, color: '#7a5800' }}>WK Gesamt</div>
                  </div>
                )}
              </div>
            ))
          )}
          <button className="btn btn-outline btn-voll" style={{ marginTop: 14 }}
            onClick={() => nav('statistiken')}>
            Alle Statistiken →
          </button>
        </div>

        {/* Letzte Ergebnisse */}
        <div className="card">
          <div className="card-title">📋 Letzte Ergebnisse</div>
          {letzte.length === 0 ? (
            <div className="empty">Noch keine Ergebnisse.</div>
          ) : (
            letzte.map((e, i) => {
              const farbe = artFarbe(e.art)
              const d = new Date(e.datum)
              return (
                <div key={i} className="erg-zeile">
                  <div className="erg-datum-box">
                    <div className="erg-datum-tag">{d.getDate()}</div>
                    <div className="erg-datum-mon">{d.toLocaleDateString('de-DE', { month: 'short' })}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="erg-name">{e.mitglieder?.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      <span className="badge" style={{ background: farbe.bg, color: farbe.color }}>
                        {e.art === 'wettkampf' ? 'Wettkampf' : 'Training'}
                      </span>
                      <span style={{ fontSize: 14 }}>{e.ort === 'heim' ? '🏠' : '✈️'}</span>
                    </div>
                  </div>
                  <div className="erg-pkt">{e.gesamt_punkte}</div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
