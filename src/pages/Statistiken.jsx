import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function getSaisonListe() {
  const heute = new Date()
  const aktJahr = heute.getMonth() >= 8 ? heute.getFullYear() : heute.getFullYear() - 1
  // Aktuelle Saison + nächste Saison
  return [
    { label: `${aktJahr}/${String(aktJahr+1).slice(2)}`, start: `${aktJahr}-09-01`, end: `${aktJahr+1}-04-30` },
    { label: `${aktJahr+1}/${String(aktJahr+2).slice(2)}`, start: `${aktJahr+1}-09-01`, end: `${aktJahr+2}-04-30` },
  ]
}

export default function Statistiken() {
  const saisonListe = getSaisonListe()
  const [mitglieder, setMitglieder]     = useState([])
  const [modus, setModus]               = useState('einzel') // 'einzel' | 'vergleich'
  const [ausgewaehlt, setAusgewaehlt]   = useState(null)
  const [vergleichIds, setVergleichIds] = useState([])
  const [daten, setDaten]               = useState([])
  const [vergleichDaten, setVergleichDaten] = useState({})
  const [saisonIdx, setSaisonIdx]       = useState(1)
  const [tab, setTab]                   = useState('uebersicht')
  const [laden, setLaden]               = useState(true)

  const saison = saisonListe[saisonIdx]

  useEffect(() => {
    supabase.from('mitglieder').select('id, name, mannschaft, mannschaftsfuehrer').eq('aktiv', true).order('name')
      .then(({ data }) => { setMitglieder(data || []); setLaden(false) })
  }, [])

  async function waehle(m) {
    setAusgewaehlt(m)
    setTab('uebersicht')
    ladeDaten(m.id, saison)
  }

  async function ladeDaten(mid, s) {
    const { data } = await supabase
      .from('ergebnisse')
      .select('datum, art, ort, runde, volle_punkte, volle_fehler, abraeumen_punkte, abraeumen_fehler, gesamt_punkte, gesamt_fehler')
      .eq('mitglied_id', mid)
      .gte('datum', s.start)
      .lte('datum', s.end)
      .order('datum', { ascending: true })
      .order('runde', { ascending: true })
    setDaten(data || [])
  }

  useEffect(() => {
    if (ausgewaehlt) ladeDaten(ausgewaehlt.id, saison)
  }, [saisonIdx])

  async function toggleVergleich(m) {
    if (vergleichIds.includes(m.id)) {
      setVergleichIds(p => p.filter(id => id !== m.id))
      setVergleichDaten(p => { const n = { ...p }; delete n[m.id]; return n })
    } else {
      if (vergleichIds.length >= 4) return
      setVergleichIds(p => [...p, m.id])
      const { data } = await supabase
        .from('ergebnisse')
        .select('datum, art, ort, gesamt_punkte, gesamt_fehler, volle_punkte, abraeumen_punkte')
        .eq('mitglied_id', m.id)
        .gte('datum', saison.start)
        .lte('datum', saison.end)
      setVergleichDaten(p => ({ ...p, [m.id]: { name: m.name, mannschaft: m.mannschaft, daten: data || [] } }))
    }
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
      schnitt: parseFloat((s.punkte.reduce((a,b)=>a+b,0)/s.punkte.length).toFixed(1)),
    }))
  }

  const FARBEN = ['#003D8F', '#1a7a3e', '#c0392b', '#7a5800']

  if (laden) return <div className="loading">Lade…</div>

  // ── VERGLEICH ─────────────────────────────────────────────
  if (modus === 'vergleich') return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={() => { setModus('einzel'); setVergleichIds([]); setVergleichDaten({}) }}>
          ← Zurück
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: '44px', color: 'var(--blau)' }}>
          Spieler vergleichen (max. 4)
        </div>
      </div>

      {/* Saison wählen */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {saisonListe.map((s, i) => (
          <button key={i} onClick={() => { setSaisonIdx(i); setVergleichDaten({}) ; setVergleichIds([]) }}
            style={{ padding: '4px 10px', fontSize: 13, fontWeight: 700, borderRadius: 6, border: '2px solid', cursor: 'pointer',
              borderColor: i === saisonIdx ? 'var(--blau)' : 'var(--grau-mid)',
              background: i === saisonIdx ? 'var(--blau)' : 'var(--weiss)',
              color: i === saisonIdx ? 'var(--weiss)' : 'var(--grau-text)' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Mitglieder wählen */}
      {[1, 2, 3, null].map(gruppe => {
        const gruppeMitglieder = mitglieder
          .filter(m => m.mannschaft === gruppe)
          .sort((a, b) => a.name.localeCompare(b.name, 'de'))
        if (gruppeMitglieder.length === 0) return null
        return (
          <div key={gruppe} className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 12, letterSpacing: 1 }}>
              {gruppe ? `G${gruppe} – ${gruppe}. Mannschaft` : 'Ohne Mannschaft'}
            </div>
            {gruppeMitglieder.map((m, i) => {
              const idx = vergleichIds.indexOf(m.id)
              const aktiv = idx !== -1
              return (
                <div key={i} onClick={() => toggleVergleich(m)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                  borderBottom: '1px solid var(--grau-mid)', cursor: 'pointer'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: aktiv ? FARBEN[idx] : 'var(--grau-mid)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, flexShrink: 0
                  }}>
                    {aktiv ? idx + 1 : ''}
                  </div>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>
                    {m.name}
                    {m.mannschaftsfuehrer && <span style={{ marginLeft: 6, fontSize: 14 }}>Ⓒ</span>}
                  </div>
                  <div style={{ fontSize: 20, color: aktiv ? FARBEN[idx] : 'var(--grau-mid)' }}>
                    {aktiv ? '✓' : '+'}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Vergleichsauswertung */}
      {vergleichIds.length >= 2 && (
        <div className="card">
          <div className="card-title">Vergleich – {saison.label}</div>
          {(() => {
            // Alle Werte pro Metrik berechnen
            const alleWerte = vergleichIds.map(id => {
              const vd = vergleichDaten[id]
              if (!vd) return null
              const punkte = vd.daten.map(e => e.gesamt_punkte)
              const volle  = vd.daten.map(e => e.volle_punkte)
              const abr    = vd.daten.map(e => e.abraeumen_punkte)
              const fehler = vd.daten.map(e => e.gesamt_fehler)
              return {
                id,
                schnittGesamt: parseFloat(schnitt(punkte)) || 0,
                besteRunde:    punkte.length ? Math.max(...punkte) : 0,
                schnittVolle:  parseFloat(schnitt(volle)) || 0,
                schnittAbr:    parseFloat(schnitt(abr)) || 0,
                schnittFehler: parseFloat(schnitt(fehler)) || 0,
                runden:        punkte.length,
              }
            }).filter(Boolean)

            // Für jede Metrik: wer ist bester/schlechtester
            // höher = besser außer bei Fehlern (niedriger = besser)
            function highlightFarbe(metrik, wert, alleW, hoeherBesser = true) {
              const werte = alleW.map(w => w[metrik]).filter(v => v > 0)
              if (werte.length < 2) return {}
              const best  = hoeherBesser ? Math.max(...werte) : Math.min(...werte)
              const worst = hoeherBesser ? Math.min(...werte) : Math.max(...werte)
              if (wert === best && wert !== worst)  return { color: '#155724', background: '#d4edda', borderRadius: 4, padding: '0 4px' }
              if (wert === worst && wert !== best) return { color: '#721c24', background: '#f8d7da', borderRadius: 4, padding: '0 4px' }
              return {}
            }

            return (
              <div className="vergleich-cards" style={{ display: 'grid', gridTemplateColumns: `repeat(${vergleichIds.length}, minmax(180px, 1fr))`, gap: 12, marginBottom: 20 }}>
                {vergleichIds.map((id, idx) => {
                  const vd = vergleichDaten[id]
                  if (!vd) return null
                  const w = alleWerte.find(w => w.id === id)
                  if (!w) return null
                  const metriken = [
                    { label: 'Ø Gesamt',    val: schnitt(vd.daten.map(e=>e.gesamt_punkte)),    key: 'schnittGesamt',  hoeher: true },
                    { label: 'Beste Runde', val: w.besteRunde || '–',                           key: 'besteRunde',     hoeher: true },
                    { label: 'Ø Volle',     val: schnitt(vd.daten.map(e=>e.volle_punkte)),      key: 'schnittVolle',   hoeher: true },
                    { label: 'Ø Abräumen',  val: schnitt(vd.daten.map(e=>e.abraeumen_punkte)), key: 'schnittAbr',     hoeher: true },
                    { label: 'Ø Fehler',    val: schnitt(vd.daten.map(e=>e.gesamt_fehler)),     key: 'schnittFehler',  hoeher: false },
                    { label: 'Runden',      val: vd.daten.length,                               key: 'runden',         hoeher: true },
                  ]
                  return (
                    <div key={id} style={{ background: '#f7f7f7', borderRadius: 10, padding: 14, borderTop: `4px solid ${FARBEN[idx]}` }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: FARBEN[idx], marginBottom: 10 }}>{vd.name}</div>
                      {metriken.map((r, ri) => (
                        <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--grau-mid)', fontSize: 14 }}>
                          <span style={{ color: 'var(--grau-text)' }}>{r.label}</span>
                          <span style={{ fontWeight: 700, ...highlightFarbe(r.key, w[r.key], alleWerte, r.hoeher) }}>
                            {r.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )

  // ── EINZEL ────────────────────────────────────────────────
  if (!ausgewaehlt) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>📊 Statistiken</div>
        <button className="btn btn-outline" style={{ fontSize: 14 }}
          onClick={() => setModus('vergleich')}>
          ⚖️ Spieler vergleichen
        </button>
      </div>

      {[1, 2, 3, null].map(gruppe => {
        const gruppeMitglieder = mitglieder
          .filter(m => m.mannschaft === gruppe)
          .sort((a, b) => a.name.localeCompare(b.name, 'de'))
        if (gruppeMitglieder.length === 0) return null
        return (
          <div key={gruppe} className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 12, letterSpacing: 1 }}>
              {gruppe ? `G${gruppe} – ${gruppe}. Mannschaft` : 'Ohne Mannschaft'}
            </div>
            {gruppeMitglieder.map((m, i) => (
              <div key={i} className="mitglied-karte" onClick={() => waehle(m)}>
                <div className="mitglied-avatar">{m.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div className="mitglied-name">
                    {m.name}
                    {m.mannschaftsfuehrer && (
                      <span title="Mannschaftsführer*in" style={{ marginLeft: 6, fontSize: 16 }}>Ⓒ</span>
                    )}
                  </div>
                </div>
                <div style={{ color: 'var(--blau)', fontSize: 22 }}>›</div>
              </div>
            ))}
          </div>
        )
      })}
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
  const fehlerAlle = daten.map(e => e.gesamt_fehler)

  const kurveB = 560, kurveH = 100
  const minP = spieltage.length ? Math.min(...spieltage.map(s => s.schnitt)) - 10 : 0
  const maxP = spieltage.length ? Math.max(...spieltage.map(s => s.schnitt)) + 10 : 200
  const kurvePunkte = spieltage.map((s, i) => ({
    x: spieltage.length === 1 ? kurveB/2 : (i/(spieltage.length-1))*kurveB,
    y: kurveH - ((s.schnitt - minP) / (maxP - minP || 1)) * kurveH,
    s,
  }))
  const pfad = kurvePunkte.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div>
      {/* Zurück + Vergleich */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button className="btn btn-outline" onClick={() => { setAusgewaehlt(null); setDaten([]) }}>
          ← Zurück
        </button>
        <button className="btn btn-outline" style={{ fontSize: 14 }}
          onClick={() => setModus('vergleich')}>
          ⚖️ Vergleichen
        </button>
      </div>

      {/* Name + Saison */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div className="mitglied-avatar" style={{ width: 54, height: 54, fontSize: 24 }}>
            {ausgewaehlt.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {ausgewaehlt.name}
              {ausgewaehlt.mannschaftsfuehrer && (
                <span title="Mannschaftsführer*in" style={{ marginLeft: 8, fontSize: 18 }}>Ⓒ</span>
              )}
            </div>
            {ausgewaehlt.mannschaft && (
              <div style={{ fontSize: 14, color: 'var(--grau-text)' }}>{ausgewaehlt.mannschaft}. Mannschaft</div>
            )}
            <div style={{ fontSize: 13, color: 'var(--grau-text)' }}>{daten.length} Runden</div>
          </div>
        </div>

        {/* Saison Filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {saisonListe.map((s, i) => (
            <button key={i} onClick={() => setSaisonIdx(i)}
              style={{ padding: '4px 10px', fontSize: 13, fontWeight: 700, borderRadius: 6, border: '2px solid', cursor: 'pointer',
                borderColor: i === saisonIdx ? 'var(--blau)' : 'var(--grau-mid)',
                background: i === saisonIdx ? 'var(--blau)' : 'var(--weiss)',
                color: i === saisonIdx ? 'var(--weiss)' : 'var(--grau-text)' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {daten.length === 0 ? (
        <div className="card"><div className="empty">Keine Ergebnisse in dieser Saison.</div></div>
      ) : (
        <>
          {/* Tabs */}
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
                <div className="stat-card" style={{ borderTopColor: '#c0392b' }}>
                  <div className="stat-value" style={{ color: '#c0392b' }}>{schnitt(fehlerAlle)}</div>
                  <div className="stat-label">Ø Fehlwürfe</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{daten.length}</div>
                  <div className="stat-label">Runden</div>
                </div>
                {wettkampf.length > 0 && (
                  <div className="stat-card" style={{ gridColumn: '1 / -1', borderTopColor: 'var(--gelb)', background: '#fff9e6' }}>
                    <div className="stat-value" style={{ color: '#7a5800', fontSize: 34 }}>
                      {wettkampf.reduce((a,b)=>a+b,0)}
                    </div>
                    <div className="stat-label" style={{ color: '#7a5800' }}>🏆 Wettkampf Gesamt ({wettkampf.length} Runden)</div>
                  </div>
                )}
              </div>

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
                <div className="empty">Mindestens 2 Spieltage nötig.</div>
              ) : (
                <>
                  <svg viewBox={`-10 -15 ${kurveB+20} ${kurveH+30}`} style={{ width: '100%', height: 130 }}>
                    <path d={pfad} fill="none" stroke="var(--blau)" strokeWidth="2.5" strokeLinejoin="round"/>
                    {kurvePunkte.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="6"
                          fill={p.s.art === 'wettkampf' ? 'var(--gelb)' : 'var(--blau)'}
                          stroke="white" strokeWidth="2"/>
                        <text x={p.x} y={p.y-10} textAnchor="middle" fontSize="11" fill="var(--blau)" fontWeight="700">
                          {p.s.schnitt}
                        </text>
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--grau-text)', marginTop: 8, marginBottom: 16 }}>
                    <span>🔵 Training</span><span>🟡 Wettkampf</span>
                  </div>
                  {[...spieltage].reverse().map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--grau-mid)', fontSize: 15 }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>
                          {new Date(s.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span className={`badge badge-${s.art}`} style={{ marginLeft: 8 }}>{s.art === 'wettkampf' ? 'WK' : 'TR'}</span>
                        <span style={{ marginLeft: 6 }}>{s.ort === 'heim' ? '🏠' : '✈️'}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--blau)', fontSize: 18 }}>{s.schnitt} Ø</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ALLE ERGEBNISSE */}
          {tab === 'ergebnisse' && (
            <div className="card">
              <div className="card-title" style={{ fontSize: 17 }}>📋 Alle Ergebnisse</div>
              {[...daten].reverse().map((e, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--grau-mid)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                      {new Date(e.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} · Runde {e.runde}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blau)' }}>{e.gesamt_punkte}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13, color: 'var(--grau-text)' }}>
                    <span className={`badge badge-${e.art}`}>{e.art === 'wettkampf' ? 'Wettkampf' : 'Training'}</span>
                    <span>{e.ort === 'heim' ? '🏠' : '✈️'}</span>
                    <span>Volle: {e.volle_punkte}</span>
                    <span>Abräumen: {e.abraeumen_punkte}</span>
                    {e.gesamt_fehler > 0 && (
                      <span style={{ color: 'var(--rot)', fontWeight: 700 }}>⚠️ {e.gesamt_fehler} Fehlwurf{e.gesamt_fehler !== 1 ? 'e' : ''}</span>
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
