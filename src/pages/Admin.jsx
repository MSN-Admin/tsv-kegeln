import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const VERIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-vereinspin`

export default function Admin() {
  const [eingeloggt, setEingeloggt] = useState(false)
  const [pw, setPw]                 = useState('')
  const [pwFehler, setPwFehler]     = useState('')
  const [pwLaden, setPwLaden]       = useState(false)
  const [tab, setTab]               = useState('termine')

  // Mitglieder
  const [mitglieder, setMitglieder]   = useState([])
  const [mName, setMName]             = useState('')
  const [mPin, setMPin]               = useState('')
  const [mEintritt, setMEintritt]     = useState('')
  const [mMannschaft, setMMannschaft] = useState('')
  const [mMeldung, setMMeldung]       = useState('')

  // Termine
  const [termine, setTermine]               = useState([])
  const [tTitel, setTTitel]                 = useState('')
  const [tDatum, setTDatum]                 = useState('')
  const [tUhrzeit, setTUhrzeit]             = useState('')
  const [tOrt, setTOrt]                     = useState('')
  const [tBeschreibung, setTBeschreibung]   = useState('')
  const [tArt, setTArt]                     = useState('sonstiges')
  const [tMeldung, setTMeldung]             = useState('')
  const [tBearbeite, setTBearbeite]         = useState(null) // id des zu bearbeitenden Termins
  const [tEditWerte, setTEditWerte]         = useState({})

  // Ergebnisse
  const [ergebnisse, setErgebnisse] = useState([])
  const [ergFilter, setErgFilter]   = useState('')
  const [bearbeite, setBearbeite]   = useState(null)
  const [editWerte, setEditWerte]   = useState({})
  const [ergMeldung, setErgMeldung] = useState('')
  // Admin neu eintragen
  const [neuErgMitglied, setNeuErgMitglied] = useState('')
  const [neuErgDatum, setNeuErgDatum]       = useState(new Date().toISOString().slice(0,10))
  const [neuErgArt, setNeuErgArt]           = useState('training')
  const [neuErgOrt, setNeuErgOrt]           = useState('heim')
  const [neuErgRunden, setNeuErgRunden]     = useState([{ volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' }])
  const [neuErgMeldung, setNeuErgMeldung]   = useState('')

  // Auswärtsorte
  const [orte, setOrte]             = useState([])
  const [ortBearbeite, setOrtBearbeite] = useState(null)
  const [ortEdit, setOrtEdit]       = useState({})
  const [ortMeldung, setOrtMeldung] = useState('')
  const [neuerOrtName, setNeuerOrtName] = useState('')

  // Pokalkegeln
  const [pokalTurniere, setPokalTurniere]   = useState([])
  const [pokalPaarungen, setPokalPaarungen] = useState([])
  const [aktivPokalId, setAktivPokalId]     = useState(null)
  const [pkJahr, setPkJahr]                 = useState(new Date().getFullYear())
  const [pkName, setPkName]                 = useState('TSV UG Pokalturnier')
  const [pkMeldung, setPkMeldung]           = useState('')
  const [ppRunde, setPpRunde]               = useState(1)
  const [ppS1, setPpS1]                     = useState('')
  const [ppS2, setPpS2]                     = useState('')
  const [ppS3, setPpS3]                     = useState('')
  const [ppDatum, setPpDatum]               = useState('')
  const [ppUhrzeit, setPpUhrzeit]           = useState('')
  const [ppOrt, setPpOrt]                   = useState('')
  const [ppMeldung, setPpMeldung]           = useState('')
  const [ppBearbeite, setPpBearbeite]       = useState(null)
  const [ppEditWerte, setPpEditWerte]       = useState({})
  const [siegerId, setSiegerId]             = useState({})

  // Spezialtraining
  const [spezTrainings, setSpezTrainings]   = useState([])
  const [spezPaarungen, setSpezPaarungen]   = useState([])
  const [aktivSpezId, setAktivSpezId]       = useState(null)
  const [stBez, setStBez]                   = useState('')
  const [stDatum, setStDatum]               = useState('')
  const [stOrt, setStOrt]                   = useState('')
  const [stMeldung, setStMeldung]           = useState('')
  const [spH1, setSpH1]                     = useState('')
  const [spH2, setSpH2]                     = useState('')
  const [spG1, setSpG1]                     = useState('')
  const [spG2, setSpG2]                     = useState('')
  const [spUhrzeit, setSpUhrzeit]           = useState('')
  const [spOrt, setSpOrt]                   = useState('')
  const [spMeldung, setSpMeldung]           = useState('')

  async function login() {
    setPwFehler('')
    setPwLaden(true)
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pw, typ: 'admin' }),
    })
    const { ok } = await res.json()
    setPwLaden(false)
    if (ok) { setEingeloggt(true); ladeAlles() }
    else setPwFehler('Falsches Passwort.')
  }

  async function ladeAlles() {
    const { data: m } = await supabase.from('mitglieder').select('*').order('name')
    setMitglieder(m || [])
    const { data: t } = await supabase.from('termine').select('*').order('datum')
    setTermine(t || [])
    const { data: o } = await supabase.from('auswaertsorte').select('*').order('name')
    setOrte(o || [])
    const { data: pt } = await supabase.from('pokal_turniere').select('*').order('jahr', { ascending: false })
    setPokalTurniere(pt || [])
    if (pt && pt.length > 0 && !aktivPokalId) {
      setAktivPokalId(pt[0].id)
      ladePokalPaarungen(pt[0].id)
    } else if (aktivPokalId) {
      ladePokalPaarungen(aktivPokalId)
    }
    const { data: st } = await supabase.from('spezial_trainings').select('*').order('datum', { ascending: false })
    setSpezTrainings(st || [])
    if (st && st.length > 0 && !aktivSpezId) {
      setAktivSpezId(st[0].id)
      ladeSpezPaarungen(st[0].id)
    } else if (aktivSpezId) {
      ladeSpezPaarungen(aktivSpezId)
    }
    await ladeErgebnisse()
  }

  async function ladePokalPaarungen(tid) {
    const { data } = await supabase
      .from('pokal_paarungen')
      .select('*, s1:spieler1_id(id,name), s2:spieler2_id(id,name), s3:spieler3_id(id,name), sieger:sieger_id(id,name)')
      .eq('turnier_id', tid).order('runde').order('erstellt_am')
    setPokalPaarungen(data || [])
  }

  async function ladeSpezPaarungen(tid) {
    const { data } = await supabase
      .from('spezial_paarungen')
      .select('*, h1:heim1_id(id,name), h2:heim2_id(id,name), g1:gast1_id(id,name), g2:gast2_id(id,name)')
      .eq('training_id', tid).order('uhrzeit')
    setSpezPaarungen(data || [])
  }

  async function ladeErgebnisse() {
    const { data } = await supabase
      .from('ergebnisse')
      .select('id, datum, art, ort, runde, volle_punkte, volle_fehler, abraeumen_punkte, abraeumen_fehler, gesamt_punkte, gesamt_fehler, mitglied_id, mitglieder(name)')
      .order('datum', { ascending: false })
      .order('mitglied_id').order('runde')
    setErgebnisse(data || [])
  }

  // Mitglieder
  async function mitgliedAnlegen() {
    setMMeldung('')
    const { error } = await supabase.from('mitglieder').insert({
      name: mName, pin_hash: mPin,
      eintrittsdatum: mEintritt || null,
      mannschaft: mMannschaft ? parseInt(mMannschaft) : null,
    })
    if (error) { setMMeldung('Fehler: ' + error.message); return }
    setMMeldung('Mitglied angelegt!')
    setMName(''); setMPin(''); setMEintritt(''); setMMannschaft('')
    ladeAlles()
  }

  async function mannschaftAendern(m, wert) {
    await supabase.from('mitglieder').update({ mannschaft: wert ? parseInt(wert) : null }).eq('id', m.id)
    ladeAlles()
  }

  async function toggleKapit(m) {
    await supabase.from('mitglieder').update({ mannschaftsfuehrer: !m.mannschaftsfuehrer }).eq('id', m.id)
    ladeAlles()
  }

  async function toggleAktiv(m) {
    await supabase.from('mitglieder').update({ aktiv: !m.aktiv }).eq('id', m.id)
    ladeAlles()
  }

  async function pinAendern(m) {
    const neuerPin = prompt(`Neuer PIN für ${m.name}:`)
    if (!neuerPin) return
    const { error } = await supabase.rpc('update_mitglied_pin', { p_id: m.id, p_pin: neuerPin })
    if (error) { alert('Fehler: ' + error.message); return }
    alert('PIN geändert.')
  }

  // Termine
  async function terminAnlegen() {
    setTMeldung('')
    const { error } = await supabase.from('termine').insert({
      titel: tTitel, datum: tDatum,
      uhrzeit: tUhrzeit || null, ort: tOrt || null,
      beschreibung: tBeschreibung || null, art: tArt,
    })
    if (error) { setTMeldung('Fehler: ' + error.message); return }
    setTMeldung('Termin angelegt!')
    setTTitel(''); setTDatum(''); setTUhrzeit(''); setTOrt(''); setTBeschreibung(''); setTArt('sonstiges')
    ladeAlles()
  }

  async function terminLoeschen(id) {
    if (!confirm('Termin löschen?')) return
    await supabase.from('termine').delete().eq('id', id)
    ladeAlles()
  }

  function terminBearbeitenStart(t) {
    setTBearbeite(t.id)
    setTEditWerte({
      titel: t.titel, datum: t.datum,
      uhrzeit: t.uhrzeit || '', ort: t.ort || '',
      beschreibung: t.beschreibung || '', art: t.art,
    })
    setTMeldung('')
  }

  async function terminSpeichern() {
    setTMeldung('')
    const { error } = await supabase.from('termine').update({
      titel: tEditWerte.titel,
      datum: tEditWerte.datum,
      uhrzeit: tEditWerte.uhrzeit || null,
      ort: tEditWerte.ort || null,
      beschreibung: tEditWerte.beschreibung || null,
      art: tEditWerte.art,
    }).eq('id', tBearbeite)
    if (error) { setTMeldung('Fehler: ' + error.message); return }
    setTMeldung('✓ Termin gespeichert!')
    setTBearbeite(null)
    await ladeAlles()
    setTimeout(() => setTMeldung(''), 3000)
  }

  // Ergebnisse
  function startBearbeiten(e) {
    setBearbeite(e.id)
    setEditWerte({
      volle_punkte: e.volle_punkte,
      volle_fehler: e.volle_fehler,
      abraeumen_punkte: e.abraeumen_punkte,
      abraeumen_fehler: e.abraeumen_fehler,
      datum: e.datum,
    })
    setErgMeldung('')
  }

  async function ergebnisSpeichern(id) {
    const { error } = await supabase.from('ergebnisse').update({
      datum: editWerte.datum,
      volle_punkte: parseInt(editWerte.volle_punkte),
      volle_fehler: parseInt(editWerte.volle_fehler) || 0,
      abraeumen_punkte: parseInt(editWerte.abraeumen_punkte),
      abraeumen_fehler: parseInt(editWerte.abraeumen_fehler) || 0,
    }).eq('id', id)
    if (error) { setErgMeldung('Fehler: ' + error.message); return }
    setBearbeite(null)
    setErgMeldung('✓ Gespeichert!')
    await ladeErgebnisse()
    setTimeout(() => setErgMeldung(''), 3000)
  }

  async function ergebnisLoeschen(id) {
    if (!confirm('Ergebnis löschen?')) return
    await supabase.from('ergebnisse').delete().eq('id', id)
    await ladeErgebnisse()
  }

  // Auswärtsorte
  async function ortSpeichern(id) {
    setOrtMeldung('')
    const { error } = await supabase.from('auswaertsorte').update({
      adresse: ortEdit.adresse || null,
      zusatz:  ortEdit.zusatz  || null,
      maps_url: ortEdit.maps_url || null,
      logo_url: ortEdit.logo_url || null,
    }).eq('id', id)
    if (error) { setOrtMeldung('Fehler: ' + error.message); return }
    setOrtBearbeite(null)
    setOrtMeldung('✓ Gespeichert!')
    const { data } = await supabase.from('auswaertsorte').select('*').order('name')
    setOrte(data || [])
    setTimeout(() => setOrtMeldung(''), 3000)
  }

  async function ortAnlegen() {
    if (!neuerOrtName.trim()) return
    const { error } = await supabase.from('auswaertsorte').insert({ name: neuerOrtName.trim() })
    if (error) { setOrtMeldung('Fehler: ' + error.message); return }
    setNeuerOrtName('')
    const { data } = await supabase.from('auswaertsorte').select('*').order('name')
    setOrte(data || [])
  }

  async function ortLoeschen(id) {
    if (!confirm('Verein löschen?')) return
    await supabase.from('auswaertsorte').delete().eq('id', id)
    const { data } = await supabase.from('auswaertsorte').select('*').order('name')
    setOrte(data || [])
  }

  const gefilterteErg = ergFilter
    ? ergebnisse.filter(e => e.mitglieder?.name?.toLowerCase().includes(ergFilter.toLowerCase()))
    : ergebnisse

  function fD(d) { return d ? new Date(d).toLocaleDateString('de-DE') : '–' }
  function fU(t) { return t ? t.slice(0, 5) + ' Uhr' : '–' }

  const editInput = { width: '100%', padding: '6px 8px', fontSize: 15, border: '2px solid #003D8F', borderRadius: 6, textAlign: 'right', fontWeight: 700 }

  if (!eingeloggt) return (
    <div className="card" style={{ maxWidth: 360 }}>
      <div className="card-title">Admin</div>
      <div className="form-group">
        <label>Passwort</label>
        <input type="password" value={pw} autoFocus onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
      </div>
      {pwFehler && <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 12 }}>{pwFehler}</p>}
      <button className="btn btn-primary btn-voll" onClick={login} disabled={pwLaden}>
        {pwLaden ? '⏳ Prüfe…' : 'Anmelden'}
      </button>
    </div>
  )

  return (
    <div>
      <div className="grid-4 admin-tabs" style={{ marginBottom: 16 }}>
        {[
          { key: 'termine',    label: '📅 Termine' },
          { key: 'ergebnisse', label: '🎳 Ergebnisse' },
          { key: 'mitglieder', label: '👥 Mitglieder' },
          { key: 'orte',       label: '✈️ Auswärts' },
          { key: 'pokal',      label: '🏆 Pokal' },
          { key: 'spezial',    label: '🎯 Spezial' },
        ].map(t => (
          <button key={t.key} className={tab === t.key ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ fontSize: 13, padding: '10px 6px' }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TERMINE ── */}
      {tab === 'termine' && (
        <div>
          <div className="card">
            <div className="card-title">Termin anlegen</div>
            <div className="form-group"><label>Titel</label><input type="text" value={tTitel} onChange={e => setTTitel(e.target.value)} placeholder="z.B. Vereinstraining" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Datum</label><input type="date" value={tDatum} onChange={e => setTDatum(e.target.value)} /></div>
              <div className="form-group"><label>Uhrzeit</label><input type="time" value={tUhrzeit} onChange={e => setTUhrzeit(e.target.value)} /></div>
              <div className="form-group">
                <label>Art</label>
                <select value={tArt} onChange={e => setTArt(e.target.value)}>
                  <option value="training">Training</option>
                  <option value="wettkampf">Wettkampf</option>
                  <option value="ausflug">Ausflug</option>
                  <option value="sitzung">Sitzung</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div className="form-group"><label>Ort</label><input type="text" value={tOrt} onChange={e => setTOrt(e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Beschreibung</label><input type="text" value={tBeschreibung} onChange={e => setTBeschreibung(e.target.value)} /></div>
            <button className="btn btn-gelb btn-voll" onClick={terminAnlegen} disabled={!tTitel || !tDatum}>Termin anlegen</button>
          </div>
          <div className="card">
            <div className="card-title">Alle Termine ({termine.length})</div>
            {tMeldung && (
              <div style={{ background: tMeldung.startsWith('Fehler') ? '#fde8e8' : '#d4edda', border: `2px solid ${tMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontWeight: 700, color: tMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)' }}>
                {tMeldung}
              </div>
            )}
            {termine.length === 0 ? <div className="empty">Noch keine Termine.</div> : (
              termine.map((t, i) => (
                <div key={i} style={{
                  border: `2px solid ${tBearbeite === t.id ? 'var(--blau)' : 'var(--grau-mid)'}`,
                  borderRadius: 10, padding: 14, marginBottom: 10,
                  background: tBearbeite === t.id ? '#f0f4ff' : 'var(--grau-hell)'
                }}>
                  {tBearbeite === t.id ? (
                    // ── Bearbeitungsformular ──
                    <div>
                      <div className="form-group">
                        <label>Titel</label>
                        <input type="text" value={tEditWerte.titel} onChange={e => setTEditWerte(p => ({ ...p, titel: e.target.value }))} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>Datum</label><input type="date" value={tEditWerte.datum} onChange={e => setTEditWerte(p => ({ ...p, datum: e.target.value }))} /></div>
                        <div className="form-group"><label>Uhrzeit</label><input type="time" value={tEditWerte.uhrzeit} onChange={e => setTEditWerte(p => ({ ...p, uhrzeit: e.target.value }))} /></div>
                        <div className="form-group">
                          <label>Art</label>
                          <select value={tEditWerte.art} onChange={e => setTEditWerte(p => ({ ...p, art: e.target.value }))}>
                            <option value="training">Training</option>
                            <option value="wettkampf">Wettkampf</option>
                            <option value="ausflug">Ausflug</option>
                            <option value="sitzung">Sitzung</option>
                            <option value="sonstiges">Sonstiges</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Ort</label><input type="text" value={tEditWerte.ort} onChange={e => setTEditWerte(p => ({ ...p, ort: e.target.value }))} /></div>
                      </div>
                      <div className="form-group"><label>Beschreibung</label><input type="text" value={tEditWerte.beschreibung} onChange={e => setTEditWerte(p => ({ ...p, beschreibung: e.target.value }))} /></div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-gruen" style={{ flex: 1 }} onClick={terminSpeichern}>✓ Speichern</button>
                        <button className="btn btn-outline" onClick={() => setTBearbeite(null)}>Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    // ── Ansicht ──
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{t.titel}</div>
                        <div style={{ fontSize: 13, color: 'var(--grau-text)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <span>📅 {fD(t.datum)}</span>
                          {t.uhrzeit && <span>🕐 {fU(t.uhrzeit)}</span>}
                          {t.ort && <span>📍 {t.ort}</span>}
                          <span className={`badge badge-${t.art}`} style={{ fontSize: 11 }}>{t.art}</span>
                        </div>
                        {t.beschreibung && <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 4 }}>{t.beschreibung}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => terminBearbeitenStart(t)}
                          style={{ background: 'none', border: '2px solid var(--blau)', color: 'var(--blau)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                          ✏️
                        </button>
                        <button onClick={() => terminLoeschen(t.id)}
                          style={{ background: 'none', border: '2px solid #c0392b', color: '#c0392b', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ERGEBNISSE ── */}
      {tab === 'ergebnisse' && (
        <div>
        {/* Neu eintragen */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 16 }}>🎳 Ergebnis eintragen</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label>Mitglied</label>
              <select value={neuErgMitglied} onChange={e => setNeuErgMitglied(e.target.value)}>
                <option value="">– wählen –</option>
                {mitglieder.filter(m => m.aktiv).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select></div>
            <div className="form-group"><label>Datum</label>
              <input type="date" value={neuErgDatum} onChange={e => setNeuErgDatum(e.target.value)} /></div>
            <div className="form-group"><label>Art</label>
              <select value={neuErgArt} onChange={e => setNeuErgArt(e.target.value)}>
                <option value="training">Training</option>
                <option value="wettkampf">Wettkampf</option>
              </select></div>
            <div className="form-group"><label>Ort</label>
              <select value={neuErgOrt} onChange={e => setNeuErgOrt(e.target.value)}>
                <option value="heim">🏠 Heim</option>
                <option value="auswaerts">✈️ Auswärts</option>
              </select></div>
          </div>
          {neuErgRunden.map((r, i) => (
            <div key={i} style={{ background: 'var(--grau-hell)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blau)', marginBottom: 10 }}>
                Runde {i + 1}
                {neuErgRunden.length > 1 && (
                  <button onClick={() => setNeuErgRunden(p => p.filter((_,x) => x !== i))}
                    style={{ marginLeft: 12, background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 13 }}>✕</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                {[['volle_punkte','Volle Pkt'],['volle_fehler','Volle Fehl'],['abraeumen_punkte','Abr. Pkt'],['abraeumen_fehler','Abr. Fehl']].map(([k,l]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 4 }}>{l}</div>
                    <input type="number" value={r[k]} onChange={ev => setNeuErgRunden(p => p.map((x,xi) => xi===i ? {...x,[k]:ev.target.value} : x))}
                      style={{ width: '100%', padding: '8px', fontSize: 16, fontWeight: 700, border: '2px solid var(--grau-mid)', borderRadius: 6, textAlign: 'right' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-outline btn-voll" style={{ marginBottom: 10 }}
            onClick={() => setNeuErgRunden(p => [...p, { volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' }])}>
            + Runde hinzufügen
          </button>
          {neuErgMeldung && <div style={{ background: neuErgMeldung.startsWith('Fehler') ? '#fde8e8' : '#d4edda', border: `2px solid ${neuErgMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontWeight: 700, color: neuErgMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)' }}>{neuErgMeldung}</div>}
          <button className="btn btn-gruen btn-voll" onClick={async () => {
            setNeuErgMeldung('')
            if (!neuErgMitglied || !neuErgDatum) { setNeuErgMeldung('Bitte Mitglied und Datum wählen.'); return }
            const rows = neuErgRunden.map((r, i) => ({
              mitglied_id: neuErgMitglied, datum: neuErgDatum, art: neuErgArt, ort: neuErgOrt, runde: i + 1,
              volle_punkte: parseInt(r.volle_punkte) || 0, volle_fehler: parseInt(r.volle_fehler) || 0,
              abraeumen_punkte: parseInt(r.abraeumen_punkte) || 0, abraeumen_fehler: parseInt(r.abraeumen_fehler) || 0,
            }))
            const { error } = await supabase.from('ergebnisse').insert(rows)
            if (error) { setNeuErgMeldung('Fehler: ' + error.message); return }
            setNeuErgMeldung('✓ Ergebnis gespeichert!')
            setNeuErgMitglied(''); setNeuErgDatum(''); setNeuErgRunden([{ volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' }])
            await ladeErgebnisse()
            setTimeout(() => setNeuErgMeldung(''), 3000)
          }}>✓ Ergebnis speichern</button>
        </div>

        <div className="card">
          <div className="card-title">📋 Ergebnisse bearbeiten</div>
          {ergMeldung && (
            <div style={{ background: ergMeldung.startsWith('Fehler') ? '#fde8e8' : '#d4edda', border: `2px solid ${ergMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontWeight: 700, fontSize: 15, color: ergMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)' }}>
              {ergMeldung}
            </div>
          )}
          <div className="form-group">
            <label>Nach Mitglied filtern</label>
            <input type="text" value={ergFilter} onChange={e => setErgFilter(e.target.value)} placeholder="Name eingeben…" />
          </div>
          <p style={{ fontSize: 14, color: 'var(--grau-text)', marginBottom: 12 }}>{gefilterteErg.length} Ergebnis{gefilterteErg.length !== 1 ? 'se' : ''}</p>
          {gefilterteErg.map((e, i) => (
            <div key={i} style={{ border: `2px solid ${bearbeite === e.id ? '#003D8F' : 'var(--grau-mid)'}`, borderRadius: 10, padding: 14, marginBottom: 10, background: bearbeite === e.id ? '#f0f4ff' : 'var(--grau-hell)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{e.mitglieder?.name}</span>
                  <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--grau-text)' }}>{fD(e.datum)} · Runde {e.runde}</span>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                    <span className={`badge badge-${e.art}`}>{e.art}</span>
                    <span style={{ fontSize: 13 }}>{e.ort === 'heim' ? '🏠' : '✈️'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {bearbeite !== e.id && (
                    <button onClick={() => startBearbeiten(e)} style={{ background: 'none', border: '2px solid #003D8F', color: '#003D8F', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✏️</button>
                  )}
                  <button onClick={() => ergebnisLoeschen(e.id)} style={{ background: 'none', border: '2px solid #c0392b', color: '#c0392b', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>🗑️</button>
                </div>
              </div>
              {bearbeite === e.id ? (
                <div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 4 }}>DATUM</div>
                    <input type="date" style={{ ...editInput, textAlign: 'left', fontWeight: 400, width: '100%' }} value={editWerte.datum || e.datum} onChange={ev => setEditWerte(p => ({ ...p, datum: ev.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[['volle_punkte','VOLLE PKT'],['volle_fehler','VOLLE FEHL'],['abraeumen_punkte','ABR. PKT'],['abraeumen_fehler','ABR. FEHL']].map(([k, l]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 4 }}>{l}</div>
                        <input type="number" style={editInput} value={editWerte[k]} onChange={ev => setEditWerte(p => ({ ...p, [k]: ev.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-gruen" style={{ flex: 1 }} onClick={() => ergebnisSpeichern(e.id)}>✓ Speichern</button>
                    <button className="btn btn-outline" onClick={() => setBearbeite(null)}>Abbrechen</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[['Volle', e.volle_punkte, false],['Abräumen', e.abraeumen_punkte, false],['Gesamt', e.gesamt_punkte, true],['Fehler', e.gesamt_fehler, false]].map(([l, v, h]) => (
                    <div key={l} style={{ textAlign: 'center', background: h ? '#003D8F' : '#fff', borderRadius: 6, padding: '6px 4px' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: h ? '#fff' : '#003D8F' }}>{v}</div>
                      <div style={{ fontSize: 11, color: h ? 'rgba(255,255,255,0.7)' : 'var(--grau-text)' }}>{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      )}
      {tab === 'mitglieder' && (
        <div>
          <div className="card">
            <div className="card-title">Mitglied anlegen</div>
            <div className="form-group"><label>Name</label><input type="text" value={mName} onChange={e => setMName(e.target.value)} placeholder="Vorname Nachname" /></div>
            <div className="form-group"><label>PIN (4–6 Stellen)</label><input type="text" maxLength={6} value={mPin} onChange={e => setMPin(e.target.value)} placeholder="1234" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Mannschaft</label>
                <select value={mMannschaft} onChange={e => setMMannschaft(e.target.value)}>
                  <option value="">– keine –</option>
                  <option value="1">G1</option>
                  <option value="2">G2</option>
                  <option value="3">G3</option>
                </select>
              </div>
              <div className="form-group"><label>Eintrittsdatum</label><input type="date" value={mEintritt} onChange={e => setMEintritt(e.target.value)} /></div>
            </div>
            {mMeldung && <p style={{ color: mMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)', fontSize: 14, marginBottom: 12 }}>{mMeldung}</p>}
            <button className="btn btn-gelb btn-voll" onClick={mitgliedAnlegen} disabled={!mName || !mPin}>Mitglied anlegen</button>
          </div>
          <div className="card">
            <div className="card-title">Alle Mitglieder ({mitglieder.length})</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Mannschaft</th><th>Kapt.</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {mitglieder.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>
                        {m.mannschaftsfuehrer && <span title="Mannschaftsführer*in" style={{ marginRight: 4 }}>Ⓒ</span>}
                        {m.name}
                      </td>
                      <td>
                        <select value={m.mannschaft || ''} onChange={e => mannschaftAendern(m, e.target.value)}
                          style={{ fontSize: 14, border: '1px solid var(--grau-mid)', borderRadius: 6, padding: '4px 8px' }}>
                          <option value="">–</option>
                          <option value="1">G1</option>
                          <option value="2">G2</option>
                          <option value="3">G3</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => toggleKapit(m)}
                          title={m.mannschaftsfuehrer ? 'Kapitänsbinde entfernen' : 'Zum/zur Mannschaftsführer*in machen'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>
                          {m.mannschaftsfuehrer ? 'Ⓒ' : '○'}
                        </button>
                      </td>
                      <td>
                        <span className="badge" style={{ background: m.aktiv ? '#d4edda' : '#f8d7da', color: m.aktiv ? '#155724' : '#721c24' }}>
                          {m.aktiv ? 'aktiv' : 'inaktiv'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => pinAendern(m)} style={{ background: 'none', border: 'none', color: '#003D8F', cursor: 'pointer', fontSize: 13, marginRight: 10 }}>PIN</button>
                        <button onClick={() => toggleAktiv(m)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 13 }}>{m.aktiv ? 'deakt.' : 'aktiv.'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── AUSWÄRTSORTE ── */}
      {tab === 'orte' && (
        <div>
          <div className="card">
            <div className="card-title">✈️ Auswärtsverein anlegen</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="text" value={neuerOrtName} onChange={e => setNeuerOrtName(e.target.value)}
                placeholder="Vereinsname" style={{ flex: 1, padding: '12px', fontSize: 16, border: '2px solid var(--grau-mid)', borderRadius: 10 }} />
              <button className="btn btn-primary" onClick={ortAnlegen} disabled={!neuerOrtName.trim()}>
                + Anlegen
              </button>
            </div>
          </div>

          {ortMeldung && (
            <div style={{ background: ortMeldung.startsWith('Fehler') ? '#fde8e8' : '#d4edda', border: `2px solid ${ortMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontWeight: 700, fontSize: 15, color: ortMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)' }}>
              {ortMeldung}
            </div>
          )}

          <div className="card">
            <div className="card-title">Alle Vereine ({orte.length})</div>
            {orte.map((o, i) => (
              <div key={i} style={{ border: `2px solid ${ortBearbeite === o.id ? '#003D8F' : 'var(--grau-mid)'}`, borderRadius: 10, padding: 14, marginBottom: 10, background: ortBearbeite === o.id ? '#f0f4ff' : 'var(--grau-hell)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: ortBearbeite === o.id ? 12 : 0 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{o.name}</div>
                    {o.adresse && <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 2 }}>{o.adresse}</div>}
                    {!o.adresse && <div style={{ fontSize: 13, color: '#bbb', marginTop: 2 }}>Noch keine Adresse</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ortBearbeite !== o.id && (
                      <button onClick={() => { setOrtBearbeite(o.id); setOrtEdit({ adresse: o.adresse || '', zusatz: o.zusatz || '', maps_url: o.maps_url || '' }) }}
                        style={{ background: 'none', border: '2px solid #003D8F', color: '#003D8F', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                        ✏️ Bearbeiten
                      </button>
                    )}
                    <button onClick={() => ortLoeschen(o.id)}
                      style={{ background: 'none', border: '2px solid #c0392b', color: '#c0392b', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      🗑️
                    </button>
                  </div>
                </div>

                {ortBearbeite === o.id && (
                  <div>
                    <div className="form-group">
                      <label>Logo-URL (optional)</label>
                      <input type="text" value={ortEdit.logo_url || ''} onChange={e => setOrtEdit(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://beispiel.de/logo.png" />
                    </div>
                    <div className="form-group">
                      <label>Adresse (Straße, PLZ Ort)</label>
                      <input type="text" value={ortEdit.adresse} onChange={e => setOrtEdit(p => ({ ...p, adresse: e.target.value }))} placeholder="z.B. Musterstraße 1, 80000 München" />
                    </div>
                    <div className="form-group">
                      <label>Hinweis (optional)</label>
                      <input type="text" value={ortEdit.zusatz} onChange={e => setOrtEdit(p => ({ ...p, zusatz: e.target.value }))} placeholder="z.B. Parkplatz hinter dem Gebäude" />
                    </div>
                    <div className="form-group">
                      <label>Maps-Link (optional, überschreibt Auto-Link)</label>
                      <input type="text" value={ortEdit.maps_url} onChange={e => setOrtEdit(p => ({ ...p, maps_url: e.target.value }))} placeholder="https://maps.google.com/…" />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-gruen" style={{ flex: 1 }} onClick={() => ortSpeichern(o.id)}>✓ Speichern</button>
                      <button className="btn btn-outline" onClick={() => setOrtBearbeite(null)}>Abbrechen</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── POKAL ── */}
      {tab === 'pokal' && (
        <div>
          {/* Turnier anlegen */}
          <div className="card">
            <div className="card-title">🏆 Pokalturnier anlegen</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div className="form-group"><label>Jahr</label>
                <input type="number" value={pkJahr} onChange={e => setPkJahr(e.target.value)} /></div>
              <div className="form-group"><label>Name</label>
                <input type="text" value={pkName} onChange={e => setPkName(e.target.value)} /></div>
            </div>
            {pkMeldung && <p style={{ color: pkMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)', marginBottom: 12, fontWeight: 700 }}>{pkMeldung}</p>}
            <button className="btn btn-gelb btn-voll" onClick={async () => {
              setPkMeldung('')
              const { error } = await supabase.from('pokal_turniere').insert({ jahr: parseInt(pkJahr), name: pkName })
              if (error) { setPkMeldung('Fehler: ' + error.message); return }
              setPkMeldung('✓ Turnier angelegt!')
              ladeAlles()
            }}>Turnier anlegen</button>
          </div>

          {pokalTurniere.length > 0 && (
            <>
              {/* Turnier wählen */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {pokalTurniere.map(t => (
                  <button key={t.id} onClick={() => { setAktivPokalId(t.id); ladePokalPaarungen(t.id) }}
                    style={{ padding: '6px 14px', fontSize: 14, fontWeight: 700, borderRadius: 8,
                      border: `2px solid ${aktivPokalId === t.id ? 'var(--blau)' : 'var(--grau-mid)'}`,
                      background: aktivPokalId === t.id ? 'var(--blau)' : 'var(--weiss)',
                      color: aktivPokalId === t.id ? 'var(--weiss)' : 'var(--grau-text)', cursor: 'pointer' }}>
                    Pokal {t.jahr}
                  </button>
                ))}
              </div>

              {aktivPokalId && (() => {
                // Rundenlogik
                const alleRunden = [...new Set(pokalPaarungen.map(p => p.runde))].sort((a,b)=>a-b)
                const maxRunde = alleRunden.length > 0 ? Math.max(...alleRunden) : 0

                // Für eine Runde: wer kommt weiter?
                function berechneWeiterkommende(runde) {
                  const rPaarungen = pokalPaarungen.filter(p => p.runde === runde)
                  const alleHabenSieger = rPaarungen.every(p => p.sieger_id)
                  if (!alleHabenSieger) return null // Runde noch nicht fertig

                  const sieger = rPaarungen.map(p => p.sieger).filter(Boolean)
                  const verlierer = rPaarungen.flatMap(p =>
                    [p.s1, p.s2, p.s3].filter(s => s && s.id !== p.sieger_id)
                  )

                  // Bester Verlierer nötig wenn ungerade Anzahl Sieger
                  let besterVerlierer = null
                  if (sieger.length % 2 !== 0 && verlierer.length > 0) {
                    // Punkte aus ergebnissen holen – wir nutzen gespeicherte Scores
                    // Verlierer-Scores werden separat geladen (async nicht möglich hier)
                    // Stattdessen: Admin wählt besten Verlierer manuell aus Liste
                    besterVerlierer = verlierer // zeige alle zur Auswahl
                  }

                  return { sieger, verlierer, besterVerlierer, alleHabenSieger, ungerade: sieger.length % 2 !== 0 }
                }

                return (
                  <>
                    {/* Paarung anlegen */}
                    <div className="card">
                      <div className="card-title" style={{ fontSize: 16 }}>Paarung anlegen</div>
                      <div className="form-group">
                        <label>Runde</label>
                        <select value={ppRunde} onChange={e => setPpRunde(e.target.value)}>
                          {[1,2,3,4,5,6].map(r => <option key={r} value={r}>{r}. Runde</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>Spieler 1</label>
                          <select value={ppS1} onChange={e => setPpS1(e.target.value)}>
                            <option value="">– wählen –</option>
                            {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select></div>
                        <div className="form-group"><label>Spieler 2</label>
                          <select value={ppS2} onChange={e => setPpS2(e.target.value)}>
                            <option value="">– wählen –</option>
                            {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select></div>
                        <div className="form-group"><label>Spieler 3 (Finale, optional)</label>
                          <select value={ppS3} onChange={e => setPpS3(e.target.value)}>
                            <option value="">– keiner –</option>
                            {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select></div>
                        <div className="form-group"><label>Datum</label>
                          <input type="date" value={ppDatum} onChange={e => setPpDatum(e.target.value)} /></div>
                        <div className="form-group"><label>Uhrzeit</label>
                          <input type="time" value={ppUhrzeit} onChange={e => setPpUhrzeit(e.target.value)} /></div>
                        <div className="form-group"><label>Ort</label>
                          <input type="text" value={ppOrt} onChange={e => setPpOrt(e.target.value)} /></div>
                      </div>
                      {ppMeldung && <p style={{ color: ppMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)', marginBottom: 12, fontWeight: 700 }}>{ppMeldung}</p>}
                      <button className="btn btn-primary btn-voll" onClick={async () => {
                        setPpMeldung('')
                        if (!ppS1 || !ppS2) { setPpMeldung('Bitte mind. 2 Spieler wählen.'); return }
                        const { error } = await supabase.from('pokal_paarungen').insert({
                          turnier_id: aktivPokalId, runde: parseInt(ppRunde),
                          spieler1_id: ppS1, spieler2_id: ppS2, spieler3_id: ppS3 || null,
                          datum: ppDatum || null, uhrzeit: ppUhrzeit || null, ort: ppOrt || null
                        })
                        if (error) { setPpMeldung('Fehler: ' + error.message); return }
                        setPpMeldung('✓ Paarung angelegt!')
                        setPpS1(''); setPpS2(''); setPpS3(''); setPpDatum(''); setPpUhrzeit(''); setPpOrt('')
                        ladePokalPaarungen(aktivPokalId)
                      }}>Paarung anlegen</button>
                    </div>

                    {/* Paarungen nach Runde */}
                    {alleRunden.map(runde => {
                      const rPaarungen = pokalPaarungen.filter(p => p.runde === runde)
                      const wk = berechneWeiterkommende(runde)
                      const rundenLabel = runde === 5 || runde === 6 ? 'Finale' :
                        runde === 4 ? 'Halbfinale' : runde === 3 ? 'Viertelfinale' : `${runde}. Runde`

                      return (
                        <div key={runde} className="card" style={{ marginBottom: 12 }}>
                          <div className="card-title" style={{ fontSize: 16 }}>
                            {rundenLabel}
                            {wk?.alleHabenSieger && <span style={{ fontSize: 12, background: '#d4edda', color: '#155724', borderRadius: 6, padding: '2px 8px', marginLeft: 10, fontWeight: 700 }}>✓ Abgeschlossen</span>}
                          </div>

                          {rPaarungen.map((p, i) => (
                            <div key={i} style={{ border: `2px solid ${ppBearbeite === p.id ? 'var(--blau)' : p.sieger_id ? '#d4edda' : 'var(--grau-mid)'}`, borderRadius: 10, padding: 12, marginBottom: 10, background: ppBearbeite === p.id ? '#f0f4ff' : p.sieger_id ? '#f0faf4' : 'var(--grau-hell)' }}>

                              {ppBearbeite === p.id ? (
                                // ── BEARBEITEN ──
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--blau)', marginBottom: 12 }}>
                                    ✏️ Paarung bearbeiten
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div className="form-group"><label>Spieler 1</label>
                                      <select value={ppEditWerte.s1} onChange={e => setPpEditWerte(v => ({...v, s1: e.target.value}))}>
                                        <option value="">– wählen –</option>
                                        {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                      </select></div>
                                    <div className="form-group"><label>Spieler 2</label>
                                      <select value={ppEditWerte.s2} onChange={e => setPpEditWerte(v => ({...v, s2: e.target.value}))}>
                                        <option value="">– wählen –</option>
                                        {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                      </select></div>
                                    <div className="form-group"><label>Spieler 3 (optional)</label>
                                      <select value={ppEditWerte.s3} onChange={e => setPpEditWerte(v => ({...v, s3: e.target.value}))}>
                                        <option value="">– keiner –</option>
                                        {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                      </select></div>
                                    <div className="form-group"><label>Datum</label>
                                      <input type="date" value={ppEditWerte.datum} onChange={e => setPpEditWerte(v => ({...v, datum: e.target.value}))} /></div>
                                    <div className="form-group"><label>Uhrzeit</label>
                                      <input type="time" value={ppEditWerte.uhrzeit} onChange={e => setPpEditWerte(v => ({...v, uhrzeit: e.target.value}))} /></div>
                                    <div className="form-group"><label>Ort</label>
                                      <input type="text" value={ppEditWerte.ort} onChange={e => setPpEditWerte(v => ({...v, ort: e.target.value}))} /></div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-gruen" style={{ flex: 1 }} onClick={async () => {
                                      await supabase.from('pokal_paarungen').update({
                                        spieler1_id: ppEditWerte.s1 || null,
                                        spieler2_id: ppEditWerte.s2 || null,
                                        spieler3_id: ppEditWerte.s3 || null,
                                        datum: ppEditWerte.datum || null,
                                        uhrzeit: ppEditWerte.uhrzeit || null,
                                        ort: ppEditWerte.ort || null,
                                      }).eq('id', p.id)
                                      setPpBearbeite(null)
                                      ladePokalPaarungen(aktivPokalId)
                                    }}>✓ Speichern</button>
                                    <button className="btn btn-outline" onClick={() => setPpBearbeite(null)}>Abbrechen</button>
                                  </div>
                                </div>
                              ) : (
                                // ── ANSICHT ──
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                                        {p.s1?.name} vs. {p.s2?.name}{p.s3 ? ` vs. ${p.s3.name}` : ''}
                                      </div>
                                      <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 3 }}>
                                        {p.datum && `📅 ${new Date(p.datum).toLocaleDateString('de-DE')}`}
                                        {p.uhrzeit && ` 🕐 ${p.uhrzeit.slice(0,5)}`}
                                        {p.ort && ` 📍 ${p.ort}`}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button onClick={() => {
                                        setPpBearbeite(p.id)
                                        setPpEditWerte({ s1: p.spieler1_id||'', s2: p.spieler2_id||'', s3: p.spieler3_id||'', datum: p.datum||'', uhrzeit: p.uhrzeit||'', ort: p.ort||'' })
                                      }} style={{ background: 'none', border: '2px solid var(--blau)', color: 'var(--blau)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 13 }}>✏️</button>
                                      <button onClick={async () => {
                                        if (!confirm('Paarung löschen?')) return
                                        await supabase.from('pokal_paarungen').delete().eq('id', p.id)
                                        ladePokalPaarungen(aktivPokalId)
                                      }} style={{ background: 'none', border: '2px solid #c0392b', color: '#c0392b', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>🗑️</button>
                                    </div>
                                  </div>

                                  {/* Sieger setzen / anzeigen */}
                                  {p.sieger_id ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#d4edda', borderRadius: 8, padding: '8px 12px' }}>
                                      <span style={{ color: '#155724', fontWeight: 700 }}>🏆 Sieger: {p.sieger?.name}</span>
                                      <button onClick={async () => {
                                        await supabase.from('pokal_paarungen').update({ sieger_id: null }).eq('id', p.id)
                                        ladePokalPaarungen(aktivPokalId)
                                      }} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 13 }}>zurücksetzen</button>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--grau-text)' }}>Sieger:</span>
                                      {[p.s1, p.s2, p.s3].filter(Boolean).map(s => (
                                        <button key={s.id} onClick={async () => {
                                          await supabase.from('pokal_paarungen').update({ sieger_id: s.id }).eq('id', p.id)
                                          ladePokalPaarungen(aktivPokalId)
                                        }} style={{ padding: '6px 14px', borderRadius: 8, border: '2px solid var(--blau)', background: 'var(--weiss)', color: 'var(--blau)', fontWeight: 700, cursor: 'pointer' }}>
                                          {s.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Rundenauswertung – wer kommt weiter */}
                          {wk?.alleHabenSieger && (
                            <div style={{ marginTop: 8, background: '#f0f8ff', borderRadius: 10, padding: 14, border: '2px solid var(--blau)' }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--blau)', marginBottom: 10 }}>
                                📋 Topf für nächste Runde
                              </div>

                              {/* Sieger */}
                              <div style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 6 }}>✅ SIEGER – kommen weiter:</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {wk.sieger.map((s, i) => (
                                    <span key={i} style={{ background: '#d4edda', color: '#155724', borderRadius: 8, padding: '5px 12px', fontWeight: 700, fontSize: 14 }}>
                                      🏆 {s.name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Bester Verlierer wenn ungerade */}
                              {wk.ungerade && wk.verlierer.length > 0 && (
                                <div style={{ marginTop: 10, padding: 10, background: '#fff3cd', borderRadius: 8, border: '1px solid #f5c400' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7a5800', marginBottom: 6 }}>
                                    ⚡ UNGERADE ANZAHL – bester Verlierer kommt weiter:
                                  </div>
                                  <div style={{ fontSize: 13, color: '#7a5800', marginBottom: 8 }}>
                                    Wähle den Verlierer mit dem höchsten Gesamtscore:
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {wk.verlierer.map((s, i) => (
                                      <span key={i} style={{ background: '#fff', border: '2px solid #f5c400', color: '#7a5800', borderRadius: 8, padding: '5px 12px', fontWeight: 700, fontSize: 14 }}>
                                        {s.name}
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ fontSize: 12, color: '#7a5800', marginTop: 6 }}>
                                    → Schau in Statistiken wer am besten Tag gespielt hat und trage ihn in die nächste Runde ein.
                                  </div>
                                </div>
                              )}

                              {/* Finale Hinweis */}
                              {wk.sieger.length <= 3 && (
                                <div style={{ marginTop: 10, background: '#fff3cd', borderRadius: 8, padding: 10, border: '2px solid var(--gelb)' }}>
                                  <div style={{ fontWeight: 700, color: '#7a5800', fontSize: 14 }}>
                                    🏆 FINALE – {wk.sieger.length === 3 ? 'alle 3 spielen gemeinsam!' : 'letzten 3 Spieler werden ermittelt'}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* ── SPEZIAL-TRAINING ── */}
      {tab === 'spezial' && (
        <div>
          {/* Training anlegen */}
          <div className="card">
            <div className="card-title">🎯 Spezial-Training anlegen</div>
            <div className="form-group"><label>Bezeichnung</label>
              <input type="text" value={stBez} onChange={e => setStBez(e.target.value)} placeholder="z.B. Spieltag-Simulation April 2026" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Datum</label>
                <input type="date" value={stDatum} onChange={e => setStDatum(e.target.value)} /></div>
              <div className="form-group"><label>Ort</label>
                <input type="text" value={stOrt} onChange={e => setStOrt(e.target.value)} /></div>
            </div>
            {stMeldung && <p style={{ color: stMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)', marginBottom: 12, fontWeight: 700 }}>{stMeldung}</p>}
            <button className="btn btn-gelb btn-voll" onClick={async () => {
              setStMeldung('')
              if (!stBez || !stDatum) { setStMeldung('Bitte Bezeichnung und Datum ausfüllen.'); return }
              const { error } = await supabase.from('spezial_trainings').insert({ bezeichnung: stBez, datum: stDatum, ort: stOrt || null })
              if (error) { setStMeldung('Fehler: ' + error.message); return }
              setStMeldung('✓ Training angelegt!')
              setStBez(''); setStDatum(''); setStOrt('')
              ladeAlles()
            }}>Training anlegen</button>
          </div>

          {/* Training wählen */}
          {spezTrainings.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {spezTrainings.map(t => (
                  <button key={t.id} onClick={() => { setAktivSpezId(t.id); ladeSpezPaarungen(t.id) }}
                    style={{ padding: '6px 14px', fontSize: 14, fontWeight: 700, borderRadius: 8,
                      border: `2px solid ${aktivSpezId === t.id ? 'var(--blau)' : 'var(--grau-mid)'}`,
                      background: aktivSpezId === t.id ? 'var(--blau)' : 'var(--weiss)',
                      color: aktivSpezId === t.id ? 'var(--weiss)' : 'var(--grau-text)', cursor: 'pointer' }}>
                    {t.bezeichnung}
                  </button>
                ))}
              </div>

              {/* Paarung anlegen */}
              {aktivSpezId && (
                <div className="card">
                  <div className="card-title" style={{ fontSize: 16 }}>2 vs. 2 Paarung anlegen</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blau)', marginBottom: 8 }}>🏠 HEIM</div>
                      <div className="form-group"><label>Spieler 1</label>
                        <select value={spH1} onChange={e => setSpH1(e.target.value)}>
                          <option value="">– wählen –</option>
                          {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select></div>
                      <div className="form-group"><label>Spieler 2</label>
                        <select value={spH2} onChange={e => setSpH2(e.target.value)}>
                          <option value="">– wählen –</option>
                          {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select></div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#7a5800', marginBottom: 8 }}>✈️ GAST</div>
                      <div className="form-group"><label>Spieler 1</label>
                        <select value={spG1} onChange={e => setSpG1(e.target.value)}>
                          <option value="">– wählen –</option>
                          {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select></div>
                      <div className="form-group"><label>Spieler 2</label>
                        <select value={spG2} onChange={e => setSpG2(e.target.value)}>
                          <option value="">– wählen –</option>
                          {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select></div>
                    </div>
                    <div className="form-group"><label>Uhrzeit</label>
                      <input type="time" value={spUhrzeit} onChange={e => setSpUhrzeit(e.target.value)} /></div>
                    <div className="form-group"><label>Ort (optional)</label>
                      <input type="text" value={spOrt} onChange={e => setSpOrt(e.target.value)} /></div>
                  </div>
                  {spMeldung && <p style={{ color: spMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)', marginBottom: 12, fontWeight: 700 }}>{spMeldung}</p>}
                  <button className="btn btn-primary btn-voll" onClick={async () => {
                    setSpMeldung('')
                    if (!spH1 || !spG1) { setSpMeldung('Bitte mind. je 1 Spieler pro Team wählen.'); return }
                    const { error } = await supabase.from('spezial_paarungen').insert({
                      training_id: aktivSpezId,
                      heim1_id: spH1 || null, heim2_id: spH2 || null,
                      gast1_id: spG1 || null, gast2_id: spG2 || null,
                      uhrzeit: spUhrzeit || null, ort: spOrt || null
                    })
                    if (error) { setSpMeldung('Fehler: ' + error.message); return }
                    setSpMeldung('✓ Paarung angelegt!')
                    setSpH1(''); setSpH2(''); setSpG1(''); setSpG2(''); setSpUhrzeit(''); setSpOrt('')
                    ladeSpezPaarungen(aktivSpezId)
                  }}>Paarung anlegen</button>
                </div>
              )}

              {/* Paarungen anzeigen */}
              {spezPaarungen.length > 0 && (
                <div className="card">
                  <div className="card-title" style={{ fontSize: 16 }}>Spielplan</div>
                  {spezPaarungen.map((p, i) => (
                    <div key={i} style={{ border: '2px solid var(--grau-mid)', borderRadius: 10, padding: 12, marginBottom: 8, background: 'var(--grau-hell)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          {p.uhrzeit && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blau)', marginBottom: 6 }}>🕐 {p.uhrzeit.slice(0,5)} Uhr</div>}
                          <div style={{ fontSize: 14 }}>
                            <span style={{ fontWeight: 700 }}>🏠 {p.h1?.name}{p.h2 ? ` & ${p.h2.name}` : ''}</span>
                            <span style={{ color: 'var(--grau-text)', margin: '0 8px' }}>vs.</span>
                            <span style={{ fontWeight: 700 }}>✈️ {p.g1?.name}{p.g2 ? ` & ${p.g2.name}` : ''}</span>
                          </div>
                        </div>
                        <button onClick={async () => {
                          if (!confirm('Paarung löschen?')) return
                          await supabase.from('spezial_paarungen').delete().eq('id', p.id)
                          ladeSpezPaarungen(aktivSpezId)
                        }} style={{ background: 'none', border: '2px solid #c0392b', color: '#c0392b', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
