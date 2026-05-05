import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const VERIFY_PIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-pin`
const VERIFY_ADMIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-vereinspin`

const RUNDEN_LABELS = { 1:'1. Runde', 2:'2. Runde', 3:'Viertelfinale', 4:'Halbfinale', 5:'Finale', 6:'Finale' }
function rundenName(r) { return RUNDEN_LABELS[r] || `${r}. Runde` }

export default function Pokalkegeln() {
  const [turniere, setTurniere]       = useState([])
  const [aktivId, setAktivId]         = useState(null)
  const [paarungen, setPaarungen]     = useState([])
  const [mitglieder, setMitglieder]   = useState([])
  const [laden, setLaden]             = useState(true)
  const [filterRunde, setFilterRunde] = useState(null)
  const [pokalErgebnisse, setPokalErgebnisse] = useState({})

  // Eintragen
  const [eintragenId, setEintragenId] = useState(null)
  const [authModus, setAuthModus]     = useState(null) // 'spieler' | 'admin'
  const [authSpieler, setAuthSpieler] = useState(null)
  const [pin, setPin]                 = useState('')
  const [pinFehler, setPinFehler]     = useState('')
  const [authOk, setAuthOk]           = useState(false)
  const [meldung, setMeldung]         = useState('')
  const [speichern, setSpeichern]     = useState(false)
  // Ergebnis-Daten: { spielerId: { r1_vp, r1_vf, r1_ap, r1_af, ... } }
  const [ergDaten, setErgDaten]       = useState({})

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('pokal_turniere').select('*').order('jahr', { ascending: false })
      const { data: m } = await supabase.from('mitglieder').select('id, name').eq('aktiv', true).order('name')
      setMitglieder(m || [])
      setTurniere(t || [])
      if (t && t.length > 0) {
        const aktiv = t.find(x => x.aktiv) || t[0]
        setAktivId(aktiv.id)
        await ladePaarungen(aktiv.id)
      } else { setLaden(false) }
    }
    load()
  }, [])

  async function ladePaarungen(tid) {
    setLaden(true)
    const { data } = await supabase
      .from('pokal_paarungen')
      .select('*, s1:spieler1_id(id,name), s2:spieler2_id(id,name), s3:spieler3_id(id,name), sieger:sieger_id(id,name)')
      .eq('turnier_id', tid)
      .order('datum', { ascending: true }).order('uhrzeit', { ascending: true }).order('runde')
    setPaarungen(data || [])
    // Ergebnisse laden
    if (data && data.length > 0) {
      const ids = data.map(p => p.id)
      const { data: erg } = await supabase
        .from('ergebnisse')
        .select('id, mitglied_id, paarung_id, runde, volle_punkte, volle_fehler, abraeumen_punkte, abraeumen_fehler, gesamt_punkte')
        .in('paarung_id', ids).order('runde')
      const map = {}
      for (const e of (erg || [])) {
        if (!map[e.paarung_id]) map[e.paarung_id] = {}
        if (!map[e.paarung_id][e.mitglied_id]) map[e.paarung_id][e.mitglied_id] = { runden: [], gesamt: 0, ids: [] }
        map[e.paarung_id][e.mitglied_id].runden.push(e)
        map[e.paarung_id][e.mitglied_id].gesamt += e.gesamt_punkte
        map[e.paarung_id][e.mitglied_id].ids.push(e.id)
      }
      setPokalErgebnisse(map)
    }
    setLaden(false)
  }

  function hatErgebnisse(paarungId) {
    const pe = pokalErgebnisse[paarungId]
    return pe && Object.keys(pe).length > 0
  }

  function spielerGesamt(paarungId, spielerId) {
    return pokalErgebnisse[paarungId]?.[spielerId]?.gesamt || null
  }

  // Eintragen starten
  function startEintragen(paarung) {
    setEintragenId(paarung.id)
    setAuthModus(null); setAuthSpieler(null); setAuthOk(false)
    setPin(''); setPinFehler(''); setMeldung('')

    // Daten vorausfüllen wenn schon vorhanden (Bearbeiten)
    const spieler = [paarung.s1, paarung.s2, paarung.s3].filter(Boolean)
    const daten = {}
    for (const s of spieler) {
      daten[s.id] = {}
      const vorh = pokalErgebnisse[paarung.id]?.[s.id]
      for (let r = 1; r <= 4; r++) {
        const rd = vorh?.runden?.find(x => x.runde === r)
        daten[s.id][`r${r}_vp`] = rd ? String(rd.volle_punkte) : ''
        daten[s.id][`r${r}_vf`] = rd ? String(rd.volle_fehler) : '0'
        daten[s.id][`r${r}_ap`] = rd ? String(rd.abraeumen_punkte) : ''
        daten[s.id][`r${r}_af`] = rd ? String(rd.abraeumen_fehler) : '0'
      }
    }
    setErgDaten(daten)
  }

  async function pruefeAuth() {
    setPinFehler('')
    if (authModus === 'admin') {
      const res = await fetch(VERIFY_ADMIN_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, typ: 'admin' }),
      })
      const { ok } = await res.json()
      if (!ok) { setPinFehler('Falsches Admin-Passwort.'); return }
    } else {
      const res = await fetch(VERIFY_PIN_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mitglied_id: authSpieler, pin }),
      })
      const { ok } = await res.json()
      if (!ok) { setPinFehler('Falscher PIN.'); return }
    }
    setAuthOk(true)
  }

  function setWert(spielerId, feld, val) {
    setErgDaten(prev => ({
      ...prev,
      [spielerId]: { ...prev[spielerId], [feld]: val.replace(/[^0-9]/g, '') }
    }))
  }

  function berechneGesamt(spielerId) {
    const d = ergDaten[spielerId]
    if (!d) return 0
    let sum = 0
    for (let r = 1; r <= 4; r++) {
      sum += (parseInt(d[`r${r}_vp`]) || 0) + (parseInt(d[`r${r}_ap`]) || 0)
    }
    return sum
  }

  async function absendenAlles(paarung) {
    setSpeichern(true); setMeldung('')
    const spieler = [paarung.s1, paarung.s2, paarung.s3].filter(Boolean)
    const paarungDatum = paarung.datum || new Date().toISOString().slice(0, 10)

    // Alte Ergebnisse löschen
    const alteIds = []
    for (const s of spieler) {
      const ids = pokalErgebnisse[paarung.id]?.[s.id]?.ids || []
      alteIds.push(...ids)
    }
    if (alteIds.length > 0) {
      await supabase.from('ergebnisse').delete().in('id', alteIds)
    }

    // Neue Ergebnisse einfügen
    const rows = []
    for (const s of spieler) {
      const d = ergDaten[s.id]
      if (!d) continue
      for (let r = 1; r <= 4; r++) {
        const vp = parseInt(d[`r${r}_vp`]) || 0
        const vf = parseInt(d[`r${r}_vf`]) || 0
        const ap = parseInt(d[`r${r}_ap`]) || 0
        const af = parseInt(d[`r${r}_af`]) || 0
        if (vp === 0 && ap === 0) continue // Leere Runde überspringen
        rows.push({
          mitglied_id: s.id, datum: paarungDatum, art: 'wettkampf', ort: 'heim',
          runde: r, paarung_id: paarung.id,
          volle_punkte: vp, volle_fehler: vf, abraeumen_punkte: ap, abraeumen_fehler: af,
        })
      }
    }

    if (rows.length === 0) { setMeldung('Fehler: Bitte mindestens eine Runde ausfüllen.'); setSpeichern(false); return }

    const { error } = await supabase.from('ergebnisse').insert(rows)
    if (error) { setMeldung('Fehler: ' + error.message); setSpeichern(false); return }

    setMeldung('✓ Ergebnisse gespeichert!')
    setSpeichern(false)
    await ladePaarungen(aktivId)
    setTimeout(() => { setEintragenId(null); setMeldung('') }, 2500)
  }

  function formatDatum(d) {
    if (!d) return null
    const date = new Date(d)
    const wo = ['So.','Mo.','Di.','Mi.','Do.','Fr.','Sa.'][date.getDay()]
    return `${wo} ${date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}`
  }

  const aktivPaarung = paarungen.find(p => p.id === eintragenId)
  const alleRunden = [...new Set(paarungen.map(p => p.runde))].sort((a,b) => a-b)
  const gefiltertePaarungen = filterRunde ? paarungen.filter(p => p.runde === filterRunde) : paarungen
  const datumGruppen = {}
  for (const p of gefiltertePaarungen) {
    const key = p.datum || '9999-99-99'
    if (!datumGruppen[key]) datumGruppen[key] = []
    datumGruppen[key].push(p)
  }
  const sortierteDaten = Object.keys(datumGruppen).sort()

  if (laden) return <div className="loading">🏆 Lade Pokalturnier…</div>

  if (turniere.length === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blau)' }}>Noch kein Turnier angelegt</div>
    </div>
  )

  // ── EINTRAGEN / BEARBEITEN ──
  if (eintragenId && aktivPaarung) {
    const spieler = [aktivPaarung.s1, aktivPaarung.s2, aktivPaarung.s3].filter(Boolean)
    const istBearbeiten = hatErgebnisse(aktivPaarung.id)

    return (
      <div>
        <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={() => setEintragenId(null)}>
          ← Zurück
        </button>
        <div className="card">
          <div className="card-title">{istBearbeiten ? '✏️ Ergebnis bearbeiten' : '🎳 Ergebnis eintragen'}</div>

          {/* Paarung Info */}
          <div style={{ background: 'var(--grau-hell)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--grau-text)' }}>
              {rundenName(aktivPaarung.runde)} · {formatDatum(aktivPaarung.datum) || 'Datum offen'}
              {aktivPaarung.uhrzeit && ` · ${aktivPaarung.uhrzeit.slice(0,5)} Uhr`}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--blau)', marginTop: 4 }}>
              {spieler.map(s => s.name).join(' vs. ')}
            </div>
          </div>

          {meldung && (
            <div style={{ background: meldung.startsWith('Fehler') ? '#fde8e8' : '#d4edda', border: `2px solid ${meldung.startsWith('Fehler') ? '#c0392b' : '#1a7a3e'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontWeight: 700, color: meldung.startsWith('Fehler') ? '#c0392b' : '#1a7a3e' }}>
              {meldung}
            </div>
          )}

          {/* Auth */}
          {!authOk ? (
            <div>
              {!authModus ? (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Wer trägt ein?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {spieler.map(s => (
                      <button key={s.id} onClick={() => { setAuthModus('spieler'); setAuthSpieler(s.id) }}
                        style={{ padding: '16px', fontSize: 17, fontWeight: 700, background: 'var(--grau-hell)', border: '2px solid var(--grau-mid)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
                        🎳 {s.name}
                      </button>
                    ))}
                    <button onClick={() => setAuthModus('admin')}
                      style={{ padding: '16px', fontSize: 17, fontWeight: 700, background: '#f0f4ff', border: '2px solid var(--blau)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', color: 'var(--blau)' }}>
                      ⚙️ Admin
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                    {authModus === 'admin' ? 'Admin-Passwort eingeben:' : `PIN für ${mitglieder.find(m => m.id === authSpieler)?.name}:`}
                  </div>
                  <input type="password" inputMode={authModus === 'admin' ? 'text' : 'numeric'}
                    maxLength={authModus === 'admin' ? 30 : 6} value={pin} autoFocus
                    onChange={e => setPin(authModus === 'admin' ? e.target.value : e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && pruefeAuth()}
                    placeholder={authModus === 'admin' ? 'Passwort' : '••••'}
                    style={{ width: '100%', padding: '14px', fontSize: authModus === 'admin' ? 18 : 28, textAlign: 'center', letterSpacing: authModus === 'admin' ? 0 : 12, border: '2px solid var(--grau-mid)', borderRadius: 10, marginBottom: 12 }} />
                  {pinFehler && <div style={{ color: '#c0392b', fontWeight: 700, marginBottom: 12 }}>⚠️ {pinFehler}</div>}
                  <button className="btn btn-primary btn-voll" onClick={pruefeAuth}>Weiter →</button>
                  <button className="btn btn-outline btn-voll" style={{ marginTop: 10 }} onClick={() => { setAuthModus(null); setPin(''); setPinFehler('') }}>← Zurück</button>
                </div>
              )}
            </div>
          ) : (
            // ── Ergebnis-Formular für ALLE Spieler ──
            <div>
              {spieler.map(s => {
                const gesamt = berechneGesamt(s.id)
                return (
                  <div key={s.id} style={{ background: 'var(--grau-hell)', borderRadius: 12, padding: 16, marginBottom: 16, border: '2px solid var(--blau)' }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--blau)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{s.name}</span>
                      {gesamt > 0 && <span style={{ background: 'var(--blau)', color: 'white', borderRadius: 8, padding: '4px 12px', fontSize: 16 }}>{gesamt} Pkt</span>}
                    </div>
                    {[1,2,3,4].map(r => {
                      const ges = (parseInt(ergDaten[s.id]?.[`r${r}_vp`]) || 0) + (parseInt(ergDaten[s.id]?.[`r${r}_ap`]) || 0)
                      return (
                        <div key={r} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blau)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Runde {r}</span>
                            {ges > 0 && <span style={{ color: 'var(--grau-text)' }}>= {ges}</span>}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                            {[
                              [`r${r}_vp`, 'V.Pkt'],
                              [`r${r}_vf`, 'V.Fehl'],
                              [`r${r}_ap`, 'A.Pkt'],
                              [`r${r}_af`, 'A.Fehl'],
                            ].map(([feld, label]) => (
                              <div key={feld}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 2 }}>{label}</div>
                                <input type="number" inputMode="numeric"
                                  value={ergDaten[s.id]?.[feld] || ''}
                                  onChange={e => setWert(s.id, feld, e.target.value)}
                                  style={{ width: '100%', padding: '8px 4px', fontSize: 16, fontWeight: 700, border: '2px solid var(--grau-mid)', borderRadius: 6, textAlign: 'center' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              <button className="btn btn-gruen btn-voll" onClick={() => absendenAlles(aktivPaarung)} disabled={speichern}>
                {speichern ? '⏳ Speichern…' : istBearbeiten ? '✓ Ergebnis aktualisieren' : '✓ Ergebnis speichern'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── BRACKET ──
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {turniere.map(t => (
          <button key={t.id} onClick={() => { setAktivId(t.id); ladePaarungen(t.id) }}
            style={{ padding: '6px 14px', fontSize: 14, fontWeight: 700, borderRadius: 8,
              border: `2px solid ${aktivId === t.id ? 'var(--blau)' : 'var(--grau-mid)'}`,
              background: aktivId === t.id ? 'var(--blau)' : 'var(--weiss)',
              color: aktivId === t.id ? 'var(--weiss)' : 'var(--grau-text)', cursor: 'pointer' }}>
            🏆 Pokal {t.jahr}
          </button>
        ))}
      </div>

      {alleRunden.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <button onClick={() => setFilterRunde(null)}
            style={{ padding: '5px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${filterRunde === null ? 'var(--blau)' : 'var(--grau-mid)'}`,
              background: filterRunde === null ? 'var(--blau)' : 'var(--weiss)',
              color: filterRunde === null ? 'var(--weiss)' : 'var(--grau-text)' }}>
            Alle
          </button>
          {alleRunden.map(r => (
            <button key={r} onClick={() => setFilterRunde(r)}
              style={{ padding: '5px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${filterRunde === r ? 'var(--blau)' : 'var(--grau-mid)'}`,
                background: filterRunde === r ? 'var(--blau)' : 'var(--weiss)',
                color: filterRunde === r ? 'var(--weiss)' : 'var(--grau-text)' }}>
              {rundenName(r)}
            </button>
          ))}
        </div>
      )}

      {sortierteDaten.map(datum => {
        const gruppe = datumGruppen[datum]
        const anzRunden = [...new Set(gruppe.map(p => p.runde))]
        return (
          <div key={datum} className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ fontSize: 16 }}>
              {datum === '9999-99-99' ? 'Datum noch offen' : formatDatum(datum)}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--grau-text)', marginLeft: 8 }}>
                {anzRunden.map(r => rundenName(r)).join(' · ')}
              </span>
            </div>
            {gruppe.map((p, i) => {
              const spieler = [p.s1, p.s2, p.s3].filter(Boolean)
              const hatSieger = !!p.sieger_id
              const hatErg = hatErgebnisse(p.id)

              return (
                <div key={i} style={{
                  border: `2px solid ${hatSieger ? '#d4edda' : 'var(--grau-mid)'}`,
                  borderRadius: 10, padding: 14, marginBottom: 10,
                  background: hatSieger ? '#f0faf4' : 'var(--grau-hell)'
                }}>
                  <div style={{ fontSize: 12, color: 'var(--grau-text)', marginBottom: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {p.uhrzeit && <span>🕐 {p.uhrzeit.slice(0,5)} Uhr</span>}
                    {p.ort && <span>📍 {p.ort}</span>}
                    {hatSieger && (
                      <span style={{ background: '#d4edda', color: '#155724', fontWeight: 700, borderRadius: 6, padding: '1px 8px' }}>
                        🏆 Sieger: {p.sieger.name}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    {spieler.map((s, si) => {
                      const ges = spielerGesamt(p.id, s.id)
                      return (
                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {si > 0 && <span style={{ color: 'var(--grau-text)', fontWeight: 700 }}>vs.</span>}
                          <div style={{
                            borderRadius: 10, overflow: 'hidden', minWidth: 90,
                            border: `2px solid ${p.sieger_id === s.id ? 'var(--gelb)' : ges ? 'var(--blau)' : 'var(--grau-mid)'}`,
                          }}>
                            <div style={{
                              padding: '8px 14px', fontWeight: 700, fontSize: 15, textAlign: 'center',
                              background: p.sieger_id === s.id ? 'var(--gelb)' : 'var(--weiss)',
                              color: p.sieger_id === s.id ? 'var(--blau)' : 'var(--text)',
                            }}>
                              {p.sieger_id === s.id && '🏆 '}{s.name}
                            </div>
                            {ges !== null && (
                              <div style={{ background: '#f0f4ff', padding: '4px 14px', fontSize: 14, color: 'var(--blau)', fontWeight: 700, textAlign: 'center', borderTop: '1px solid var(--grau-mid)' }}>
                                {ges} Pkt
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {p.datum && (
                    <button onClick={() => startEintragen(p)}
                      style={{
                        width: '100%',
                        background: hatErg ? 'var(--weiss)' : 'var(--blau)',
                        color: hatErg ? 'var(--blau)' : 'white',
                        border: '2px solid var(--blau)',
                        borderRadius: 8, padding: '10px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                      }}>
                      {hatErg ? '✏️ Ergebnis bearbeiten' : '🎳 Ergebnis eintragen'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {paarungen.length === 0 && <div className="card"><div className="empty">Noch keine Paarungen angelegt.</div></div>}
    </div>
  )
}
