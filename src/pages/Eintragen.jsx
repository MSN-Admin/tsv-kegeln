import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const VERIFY_PIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-pin`

const S = {
  seite: { maxWidth: 500, margin: '0 auto' },
  schritt: { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  schrittTitel: { fontSize: 22, fontWeight: 700, color: '#003D8F', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 },
  schrittNr: { width: 34, height: 34, borderRadius: '50%', background: '#003D8F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  label: { display: 'block', fontSize: 17, fontWeight: 700, color: '#222', marginBottom: 8 },
  input: { width: '100%', padding: '14px 16px', fontSize: 22, fontWeight: 700, border: '2px solid #ccc', borderRadius: 10, color: '#111', background: '#fff', appearance: 'none', WebkitAppearance: 'none', marginBottom: 4 },
  inputFokus: { borderColor: '#003D8F', outline: 'none', boxShadow: '0 0 0 3px rgba(0,61,143,0.15)' },
  select: { width: '100%', padding: '14px 16px', fontSize: 18, fontWeight: 600, border: '2px solid #ccc', borderRadius: 10, color: '#111', background: '#fff', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23003D8F\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '24px', paddingRight: 48, marginBottom: 4 },
  btnPrimary: { width: '100%', padding: '18px 24px', fontSize: 20, fontWeight: 700, background: '#003D8F', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', marginTop: 8, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' },
  btnGruen: { width: '100%', padding: '18px 24px', fontSize: 20, fontWeight: 700, background: '#1a7a3e', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', marginTop: 8, touchAction: 'manipulation' },
  btnRot: { width: '100%', padding: '14px 24px', fontSize: 17, fontWeight: 600, background: '#fff', color: '#c0392b', border: '2px solid #c0392b', borderRadius: 10, cursor: 'pointer', marginTop: 8, touchAction: 'manipulation' },
  btnZurueck: { padding: '12px 20px', fontSize: 16, fontWeight: 600, background: '#fff', color: '#003D8F', border: '2px solid #003D8F', borderRadius: 10, cursor: 'pointer', touchAction: 'manipulation' },
  hinweis: { fontSize: 14, color: '#666', marginTop: 6 },
  fehlerBox: { background: '#fde8e8', border: '2px solid #c0392b', borderRadius: 10, padding: '14px 16px', fontSize: 17, color: '#c0392b', fontWeight: 600, marginTop: 12 },
  ergebnisBox: { background: '#003D8F', color: '#fff', borderRadius: 10, padding: '14px 18px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ergebnisZahl: { fontSize: 28, fontWeight: 700 },
  ergebnisLabel: { fontSize: 13, opacity: 0.8, marginTop: 2 },
  rundeBox: { background: '#f0f4ff', border: '2px solid #003D8F', borderRadius: 12, padding: 20, marginBottom: 20 },
  rundeTitel: { fontSize: 20, fontWeight: 700, color: '#003D8F', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gruppeLabel: { fontSize: 13, fontWeight: 700, color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid #ccc' },
  toggleGruppe: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 },
  toggleBtn: (aktiv) => ({ padding: '14px 8px', fontSize: 16, fontWeight: 700, border: '2px solid', borderColor: aktiv ? '#003D8F' : '#ccc', borderRadius: 10, background: aktiv ? '#003D8F' : '#fff', color: aktiv ? '#fff' : '#555', cursor: 'pointer', textAlign: 'center', touchAction: 'manipulation' }),
}

export default function Eintragen({ nav }) {
  const [modus, setModus]           = useState('auswahl') // auswahl | neu | bearbeiten | pin_aendern
  const [schritt, setSchritt]       = useState(1)
  const [mitglieder, setMitglieder] = useState([])
  const [mitgliedId, setMitgliedId] = useState('')
  const [pin, setPin]               = useState('')
  const [pinFehler, setPinFehler]   = useState('')
  const [datum, setDatum]           = useState(new Date().toISOString().slice(0, 10))
  const [art, setArt]               = useState('training')
  const [ort, setOrt]               = useState('heim')
  const [runden, setRunden]         = useState([{ ...LEER }])
  const [fehler, setFehler]         = useState('')
  const [speichern, setSpeichern]   = useState(false)
  const [fokus, setFokus]           = useState(null)

  // Bearbeiten
  const [meineErgebnisse, setMeineErgebnisse] = useState([])
  const [bearbeiteId, setBearbeiteId]         = useState(null)
  const [bearbeiteDatum, setBearbeiteDatum]   = useState('')
  const [bearbeiteMeldung, setBearbeiteMeldung] = useState('')

  // PIN ändern
  const [neuerPin1, setNeuerPin1]   = useState('')
  const [neuerPin2, setNeuerPin2]   = useState('')
  const [pinMeldung, setPinMeldung] = useState('')

  useEffect(() => {
    supabase.from('mitglieder').select('id, name').eq('aktiv', true).order('name')
      .then(({ data }) => setMitglieder(data || []))
  }, [])

  const mitgliedName = mitglieder.find(m => m.id === mitgliedId)?.name || ''

  async function pruefePIN(danach) {
    setPinFehler('')
    if (pin.length < 4) { setPinFehler('Bitte gib deinen PIN ein (mindestens 4 Stellen).'); return }
    const res = await fetch(VERIFY_PIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mitglied_id: mitgliedId, pin }),
    })
    const { ok } = await res.json()
    if (!ok) { setPinFehler('Der PIN ist leider falsch. Bitte nochmal versuchen.'); return }
    danach()
  }

  function setRunde(i, feld, val) {
    const num = val.replace(/[^0-9]/g, '')
    setRunden(prev => prev.map((r, mi) => mi === i ? { ...r, [feld]: num } : r))
  }

  function validiereEingabe(val, max) {
    const n = parseInt(val)
    return !isNaN(n) && n >= 0 && n <= max
  }

  async function absenden() {
    setFehler('')
    for (const r of runden) {
      if (!r.volle_punkte || !r.abraeumen_punkte) { setFehler('Bitte alle Felder ausfüllen.'); return }
      if (!validiereEingabe(r.volle_punkte, 135) || !validiereEingabe(r.abraeumen_punkte, 135)) { setFehler('Ungültige Punkte (max. 135).'); return }
    }
    setSpeichern(true)
    const rows = runden.map((r, i) => ({
      mitglied_id: mitgliedId, datum, art, ort, runde: i + 1,
      volle_punkte: parseInt(r.volle_punkte), volle_fehler: parseInt(r.volle_fehler) || 0,
      abraeumen_punkte: parseInt(r.abraeumen_punkte), abraeumen_fehler: parseInt(r.abraeumen_fehler) || 0,
    }))
    const { error } = await supabase.from('ergebnisse').insert(rows)
    if (error) { setFehler('Fehler beim Speichern: ' + error.message); setSpeichern(false); return }
    setSchritt(4)
    setSpeichern(false)
  }

  function reset() {
    setSchritt(1); setMitgliedId(''); setPin(''); setPinFehler('')
    setDatum(new Date().toISOString().slice(0, 10)); setArt('training'); setOrt('heim')
    setRunden([{ ...LEER }]); setFehler('')
    setModus('auswahl')
  }

  // ── Ergebnisse laden nach PIN-Login ──
  async function ladeErgebnisse() {
    const { data } = await supabase
      .from('ergebnisse')
      .select('id, datum, art, ort, runde, volle_punkte, volle_fehler, abraeumen_punkte, abraeumen_fehler, gesamt_punkte')
      .eq('mitglied_id', mitgliedId)
      .order('datum', { ascending: false })
      .order('runde', { ascending: true })
      .limit(30)
    setMeineErgebnisse(data || [])
  }

  async function ergebnisBearbeiten(e) {
    setBearbeiteId(e.id)
    setBearbeiteDatum(e.datum)
    setRunden([{
      volle_punkte: String(e.volle_punkte),
      volle_fehler: String(e.volle_fehler),
      abraeumen_punkte: String(e.abraeumen_punkte),
      abraeumen_fehler: String(e.abraeumen_fehler),
    }])
    setArt(e.art); setOrt(e.ort)
    setBearbeiteMeldung('')
  }

  async function ergebnisSpeichernEdit() {
    setBearbeiteMeldung('')
    const r = runden[0]
    const { error } = await supabase.from('ergebnisse').update({
      datum: bearbeiteDatum,
      volle_punkte: parseInt(r.volle_punkte),
      volle_fehler: parseInt(r.volle_fehler) || 0,
      abraeumen_punkte: parseInt(r.abraeumen_punkte),
      abraeumen_fehler: parseInt(r.abraeumen_fehler) || 0,
      art, ort,
    }).eq('id', bearbeiteId)
    if (error) { setBearbeiteMeldung('Fehler: ' + error.message); return }
    setBearbeiteMeldung('✓ Gespeichert!')
    setBearbeiteId(null)
    await ladeErgebnisse()
    setTimeout(() => setBearbeiteMeldung(''), 3000)
  }

  async function pinSpeichern() {
    setPinMeldung('')
    if (neuerPin1.length < 4) { setPinMeldung('PIN muss mindestens 4 Stellen haben.'); return }
    if (neuerPin1 !== neuerPin2) { setPinMeldung('Die PINs stimmen nicht überein.'); return }
    // Neuen PIN gehasht speichern via RPC
    const { error } = await supabase.rpc('update_mitglied_pin', {
      p_id: mitgliedId,
      p_pin: neuerPin1,
    })
    if (error) { setPinMeldung('Fehler: ' + error.message); return }
    setPinMeldung('✓ PIN erfolgreich geändert!')
    setNeuerPin1(''); setNeuerPin2('')
  }

  // ── SCHRITT 1: Name wählen ──
  if (schritt === 1) return (
    <div style={S.seite}>
      <div style={S.schritt}>
        <div style={S.schrittTitel}><div style={S.schrittNr}>1</div>Wer bist du?</div>
        <label style={S.label}>Dein Name</label>
        <select value={mitgliedId} onChange={e => setMitgliedId(e.target.value)} style={{ ...S.select, fontSize: 20 }}>
          <option value="">– Name auswählen –</option>
          {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button style={{ ...S.btnPrimary, opacity: !mitgliedId ? 0.5 : 1 }}
          disabled={!mitgliedId} onClick={() => setSchritt(2)}>
          Weiter →
        </button>
      </div>
    </div>
  )

  // ── SCHRITT 2: PIN ──
  if (schritt === 2) return (
    <div style={S.seite}>
      <div style={S.schritt}>
        <div style={S.schrittTitel}><div style={S.schrittNr}>2</div>Dein geheimer PIN</div>
        <p style={{ fontSize: 17, color: '#444', marginBottom: 20 }}>
          Hallo <strong>{mitgliedName}</strong>! Bitte gib deinen persönlichen PIN ein.
        </p>
        <label style={S.label}>PIN eingeben</label>
        <input type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
          onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && pruefePIN(() => setSchritt(3))}
          placeholder="••••"
          style={{ ...S.input, letterSpacing: 12, textAlign: 'center', fontSize: 32, ...(fokus === 'pin' ? S.inputFokus : {}) }}
          onFocus={() => setFokus('pin')} onBlur={() => setFokus(null)} />
        {pinFehler && <div style={S.fehlerBox}>⚠️ {pinFehler}</div>}
        <button style={S.btnPrimary} onClick={() => pruefePIN(() => setSchritt(3))}>PIN bestätigen</button>
        <button style={{ ...S.btnZurueck, marginTop: 12 }} onClick={() => setSchritt(1)}>← Zurück</button>
      </div>
    </div>
  )

  // ── SCHRITT 3: Aktions-Auswahl ──
  if (schritt === 3 && modus === 'auswahl') return (
    <div style={S.seite}>
      <div style={S.schritt}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#003D8F', marginBottom: 20 }}>
          Hallo {mitgliedName} 👋
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button style={S.btnPrimary} onClick={() => setModus('neu')}>
            🎳 Neues Ergebnis eintragen
          </button>
          <button style={{ ...S.btnZurueck, width: '100%', textAlign: 'center', fontSize: 18, padding: '16px' }}
            onClick={() => { setModus('bearbeiten'); ladeErgebnisse() }}>
            ✏️ Eigenes Ergebnis bearbeiten
          </button>
          <button style={{ ...S.btnZurueck, width: '100%', textAlign: 'center', fontSize: 18, padding: '16px' }}
            onClick={() => setModus('pin_aendern')}>
            🔑 PIN ändern
          </button>
        </div>
        <button style={{ ...S.btnRot, marginTop: 16 }} onClick={reset}>← Abmelden</button>
      </div>
    </div>
  )

  // ── BEARBEITEN ──
  if (schritt === 3 && modus === 'bearbeiten') return (
    <div style={S.seite}>
      <div style={S.schritt}>
        <div style={S.schrittTitel}>✏️ Ergebnis bearbeiten</div>
        {bearbeiteMeldung && (
          <div style={{ background: bearbeiteMeldung.startsWith('Fehler') ? '#fde8e8' : '#d4edda', border: `2px solid ${bearbeiteMeldung.startsWith('Fehler') ? '#c0392b' : '#1a7a3e'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontWeight: 700, color: bearbeiteMeldung.startsWith('Fehler') ? '#c0392b' : '#1a7a3e' }}>
            {bearbeiteMeldung}
          </div>
        )}

        {bearbeiteId === null ? (
          meineErgebnisse.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>Noch keine Ergebnisse gefunden.</div>
          ) : (
            meineErgebnisse.map((e, i) => (
              <div key={i} style={{ border: '2px solid var(--grau-mid,#d0d0d0)', borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {new Date(e.datum).toLocaleDateString('de-DE')} · Runde {e.runde}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                    {e.art === 'wettkampf' ? 'Wettkampf' : 'Training'} · {e.ort === 'heim' ? '🏠' : '✈️'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#003D8F' }}>{e.gesamt_punkte}</div>
                  <button onClick={() => ergebnisBearbeiten(e)}
                    style={{ background: '#003D8F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                    ✏️
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          <div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={S.label}>Datum</label>
              <input type="date" value={bearbeiteDatum} onChange={e => setBearbeiteDatum(e.target.value)} style={{ ...S.input, fontSize: 18 }} />
            </div>
            <div style={S.toggleGruppe}>
              <button style={S.toggleBtn(art === 'training')} onClick={() => setArt('training')}>🎳 Training</button>
              <button style={S.toggleBtn(art === 'wettkampf')} onClick={() => setArt('wettkampf')}>🏆 Wettkampf</button>
            </div>
            <div style={{ ...S.toggleGruppe, marginTop: 10 }}>
              <button style={S.toggleBtn(ort === 'heim')} onClick={() => setOrt('heim')}>🏠 Zuhause</button>
              <button style={S.toggleBtn(ort === 'auswaerts')} onClick={() => setOrt('auswaerts')}>✈️ Auswärts</button>
            </div>
            {runden.map((r, i) => (
              <div key={i} style={{ marginTop: 16 }}>
                <div style={S.gruppeLabel}>VOLLE</div>
                <label style={S.label}>Punkte</label>
                <input type="number" inputMode="numeric" value={r.volle_punkte} onChange={e => setRunde(i, 'volle_punkte', e.target.value)} style={S.input} />
                <label style={S.label}>Fehlwürfe</label>
                <input type="number" inputMode="numeric" value={r.volle_fehler} onChange={e => setRunde(i, 'volle_fehler', e.target.value)} style={S.input} />
                <div style={{ ...S.gruppeLabel, marginTop: 12 }}>ABRÄUMEN</div>
                <label style={S.label}>Punkte</label>
                <input type="number" inputMode="numeric" value={r.abraeumen_punkte} onChange={e => setRunde(i, 'abraeumen_punkte', e.target.value)} style={S.input} />
                <label style={S.label}>Fehlwürfe</label>
                <input type="number" inputMode="numeric" value={r.abraeumen_fehler} onChange={e => setRunde(i, 'abraeumen_fehler', e.target.value)} style={S.input} />
              </div>
            ))}
            <button style={S.btnGruen} onClick={ergebnisSpeichernEdit}>✓ Speichern</button>
            <button style={{ ...S.btnZurueck, marginTop: 10, width: '100%', textAlign: 'center' }} onClick={() => setBearbeiteId(null)}>← Zurück zur Liste</button>
          </div>
        )}
        <button style={{ ...S.btnRot, marginTop: 12 }} onClick={() => setModus('auswahl')}>← Zurück</button>
      </div>
    </div>
  )

  // ── PIN ÄNDERN ──
  if (schritt === 3 && modus === 'pin_aendern') return (
    <div style={S.seite}>
      <div style={S.schritt}>
        <div style={S.schrittTitel}>🔑 PIN ändern</div>
        {pinMeldung && (
          <div style={{ background: pinMeldung.startsWith('Fehler') ? '#fde8e8' : '#d4edda', border: `2px solid ${pinMeldung.startsWith('Fehler') ? '#c0392b' : '#1a7a3e'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontWeight: 700, color: pinMeldung.startsWith('Fehler') ? '#c0392b' : '#1a7a3e' }}>
            {pinMeldung}
          </div>
        )}
        <label style={S.label}>Neuer PIN</label>
        <input type="password" inputMode="numeric" maxLength={6} value={neuerPin1}
          onChange={e => setNeuerPin1(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="••••" style={{ ...S.input, letterSpacing: 12, textAlign: 'center', fontSize: 32 }} />
        <label style={{ ...S.label, marginTop: 16 }}>PIN wiederholen</label>
        <input type="password" inputMode="numeric" maxLength={6} value={neuerPin2}
          onChange={e => setNeuerPin2(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="••••" style={{ ...S.input, letterSpacing: 12, textAlign: 'center', fontSize: 32 }} />
        {neuerPin1 && neuerPin2 && neuerPin1 !== neuerPin2 && (
          <div style={S.fehlerBox}>⚠️ PINs stimmen nicht überein.</div>
        )}
        <button style={S.btnGruen} onClick={pinSpeichern}>✓ PIN speichern</button>
        <button style={{ ...S.btnZurueck, marginTop: 10, width: '100%', textAlign: 'center' }} onClick={() => setModus('auswahl')}>← Zurück</button>
      </div>
    </div>
  )

  // ── NEU EINTRAGEN (Schritt 3, modus=neu) ──
  if (schritt === 3 && modus === 'neu') return (
    <div style={S.seite}>
      <div style={S.schritt}>
        <div style={S.schrittTitel}><div style={S.schrittNr}>3</div>Spielinfos</div>
        <label style={S.label}>Datum</label>
        <input type="date" value={datum} onChange={e => setDatum(e.target.value)} style={{ ...S.input, fontSize: 18 }} />
        <label style={{ ...S.label, marginTop: 16 }}>Was wurde gespielt?</label>
        <div style={S.toggleGruppe}>
          <button style={S.toggleBtn(art === 'training')} onClick={() => setArt('training')}>🎳 Training</button>
          <button style={S.toggleBtn(art === 'wettkampf')} onClick={() => setArt('wettkampf')}>🏆 Wettkampf</button>
        </div>
        <label style={{ ...S.label, marginTop: 16 }}>Wo wurde gespielt?</label>
        <div style={S.toggleGruppe}>
          <button style={S.toggleBtn(ort === 'heim')} onClick={() => setOrt('heim')}>🏠 Zuhause</button>
          <button style={S.toggleBtn(ort === 'auswaerts')} onClick={() => setOrt('auswaerts')}>✈️ Auswärts</button>
        </div>
      </div>

      {runden.map((r, i) => {
        const gp = (parseInt(r.volle_punkte) || 0) + (parseInt(r.abraeumen_punkte) || 0)
        const gf = (parseInt(r.volle_fehler) || 0) + (parseInt(r.abraeumen_fehler) || 0)
        const vollstaendig = r.volle_punkte !== '' && r.abraeumen_punkte !== ''
        return (
          <div key={i} style={S.schritt}>
            <div style={S.rundeTitel}>
              <span>Runde {i + 1}</span>
              {runden.length > 1 && (
                <button onClick={() => setRunden(p => p.filter((_, x) => x !== i))}
                  style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: 16, fontWeight: 700, cursor: 'pointer', padding: '4px 8px' }}>
                  ✕ Entfernen
                </button>
              )}
            </div>
            <div style={S.gruppeLabel}>VOLLE – 15 Würfe</div>
            <label style={S.label}>Punkte Volle</label>
            <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="135"
              value={r.volle_punkte} onChange={e => setRunde(i, 'volle_punkte', e.target.value)}
              placeholder="z. B. 87"
              style={{ ...S.input, borderColor: r.volle_punkte && !validiereEingabe(r.volle_punkte, 135) ? '#c0392b' : fokus === `vp${i}` ? '#003D8F' : '#ccc' }}
              onFocus={() => setFokus(`vp${i}`)} onBlur={() => setFokus(null)} />
            <label style={S.label}>Fehlwürfe Volle</label>
            <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="15"
              value={r.volle_fehler} onChange={e => setRunde(i, 'volle_fehler', e.target.value)}
              placeholder="0" style={{ ...S.input, borderColor: fokus === `vf${i}` ? '#003D8F' : '#ccc' }}
              onFocus={() => setFokus(`vf${i}`)} onBlur={() => setFokus(null)} />
            <div style={{ ...S.gruppeLabel, marginTop: 16 }}>ABRÄUMEN – 15 Würfe</div>
            <label style={S.label}>Punkte Abräumen</label>
            <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="135"
              value={r.abraeumen_punkte} onChange={e => setRunde(i, 'abraeumen_punkte', e.target.value)}
              placeholder="z. B. 72"
              style={{ ...S.input, borderColor: r.abraeumen_punkte && !validiereEingabe(r.abraeumen_punkte, 135) ? '#c0392b' : fokus === `ap${i}` ? '#003D8F' : '#ccc' }}
              onFocus={() => setFokus(`ap${i}`)} onBlur={() => setFokus(null)} />
            <label style={S.label}>Fehlwürfe Abräumen</label>
            <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="15"
              value={r.abraeumen_fehler} onChange={e => setRunde(i, 'abraeumen_fehler', e.target.value)}
              placeholder="0" style={{ ...S.input, borderColor: fokus === `af${i}` ? '#003D8F' : '#ccc' }}
              onFocus={() => setFokus(`af${i}`)} onBlur={() => setFokus(null)} />
            {vollstaendig && (
              <div style={S.ergebnisBox}>
                <div>
                  <div style={S.ergebnisZahl}>{gp} Punkte</div>
                  <div style={S.ergebnisLabel}>Gesamt Runde {i + 1}</div>
                </div>
                {gf > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#F5C400' }}>{gf}</div>
                    <div style={S.ergebnisLabel}>Fehlwurf{gf !== 1 ? 'e' : ''}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div style={S.schritt}>
        <button style={{ ...S.btnZurueck, width: '100%', textAlign: 'center', fontSize: 18 }}
          onClick={() => setRunden(p => [...p, { ...LEER }])}>
          + Weitere Runde hinzufügen
        </button>
      </div>

      <div style={S.schritt}>
        {fehler && <div style={{ ...S.fehlerBox, marginBottom: 16 }}>⚠️ {fehler}</div>}
        <button style={{ ...S.btnGruen, opacity: speichern ? 0.6 : 1 }} onClick={absenden} disabled={speichern}>
          {speichern ? '⏳ Wird gespeichert…' : '✓ Ergebnis speichern'}
        </button>
        <button style={{ ...S.btnZurueck, marginTop: 12 }} onClick={() => setModus('auswahl')}>← Zurück</button>
      </div>
    </div>
  )

  // ── SCHRITT 4: Fertig ──
  const gesamt = runden.reduce((s, r) => s + (parseInt(r.volle_punkte) || 0) + (parseInt(r.abraeumen_punkte) || 0), 0)
  return (
    <div style={S.seite}>
      <div style={{ ...S.schritt, textAlign: 'center', padding: 36 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎳</div>
        <h2 style={{ fontSize: 26, color: '#1a7a3e', marginBottom: 12 }}>Ergebnis gespeichert!</h2>
        <div style={{ background: '#f0faf4', border: '2px solid #1a7a3e', borderRadius: 12, padding: '16px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: '#1a7a3e' }}>{gesamt}</div>
          <div style={{ fontSize: 16, color: '#555' }}>Punkte gesamt · {runden.length} Runde{runden.length !== 1 ? 'n' : ''}</div>
          <div style={{ fontSize: 15, color: '#888', marginTop: 4 }}>
            {art === 'wettkampf' ? '🏆 Wettkampf' : '🎳 Training'} · {ort === 'heim' ? '🏠 Zuhause' : '✈️ Auswärts'}
          </div>
        </div>
        <button style={S.btnPrimary} onClick={() => nav('start')}>Zur Startseite</button>
        <button style={{ ...S.btnRot, marginTop: 10 }} onClick={reset}>Weiteres Ergebnis eintragen</button>
      </div>
    </div>
  )
}
