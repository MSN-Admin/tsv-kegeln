import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const ADMIN_PASSWORT = 'Markus'

export default function Admin() {
  const [eingeloggt, setEingeloggt] = useState(false)
  const [pw, setPw]                 = useState('')
  const [pwFehler, setPwFehler]     = useState('')
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

  // Ergebnisse
  const [ergebnisse, setErgebnisse] = useState([])
  const [ergFilter, setErgFilter]   = useState('')
  const [bearbeite, setBearbeite]   = useState(null)
  const [editWerte, setEditWerte]   = useState({})
  const [ergMeldung, setErgMeldung] = useState('')

  // Auswärtsorte
  const [orte, setOrte]             = useState([])
  const [ortBearbeite, setOrtBearbeite] = useState(null)
  const [ortEdit, setOrtEdit]       = useState({})
  const [ortMeldung, setOrtMeldung] = useState('')
  const [neuerOrtName, setNeuerOrtName] = useState('')

  function login() {
    if (pw === ADMIN_PASSWORT) { setEingeloggt(true); ladeAlles() }
    else setPwFehler('Falsches Passwort.')
  }

  async function ladeAlles() {
    const { data: m } = await supabase.from('mitglieder').select('*').order('name')
    setMitglieder(m || [])
    const { data: t } = await supabase.from('termine').select('*').order('datum')
    setTermine(t || [])
    const { data: o } = await supabase.from('auswaertsorte').select('*').order('name')
    setOrte(o || [])
    await ladeErgebnisse()
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

  async function toggleAktiv(m) {
    await supabase.from('mitglieder').update({ aktiv: !m.aktiv }).eq('id', m.id)
    ladeAlles()
  }

  async function pinAendern(m) {
    const neuerPin = prompt(`Neuer PIN für ${m.name}:`)
    if (!neuerPin) return
    await supabase.from('mitglieder').update({ pin_hash: neuerPin }).eq('id', m.id)
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

  // Ergebnisse
  function startBearbeiten(e) {
    setBearbeite(e.id)
    setEditWerte({ volle_punkte: e.volle_punkte, volle_fehler: e.volle_fehler, abraeumen_punkte: e.abraeumen_punkte, abraeumen_fehler: e.abraeumen_fehler })
    setErgMeldung('')
  }

  async function ergebnisSpeichern(id) {
    const { error } = await supabase.from('ergebnisse').update({
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
      <button className="btn btn-primary btn-voll" onClick={login}>Anmelden</button>
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
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div className="form-group"><label>Ort</label><input type="text" value={tOrt} onChange={e => setTOrt(e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Beschreibung</label><input type="text" value={tBeschreibung} onChange={e => setTBeschreibung(e.target.value)} /></div>
            {tMeldung && <p style={{ color: tMeldung.startsWith('Fehler') ? '#c0392b' : 'var(--gruen)', fontSize: 14, marginBottom: 12 }}>{tMeldung}</p>}
            <button className="btn btn-gelb btn-voll" onClick={terminAnlegen} disabled={!tTitel || !tDatum}>Termin anlegen</button>
          </div>
          <div className="card">
            <div className="card-title">Alle Termine ({termine.length})</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Datum</th><th>Zeit</th><th>Titel</th><th>Art</th><th>Ort</th><th></th></tr></thead>
                <tbody>
                  {termine.map((t, i) => (
                    <tr key={i}>
                      <td>{fD(t.datum)}</td><td>{fU(t.uhrzeit)}</td>
                      <td style={{ fontWeight: 600 }}>{t.titel}</td>
                      <td><span className={`badge badge-${t.art}`}>{t.art}</span></td>
                      <td style={{ color: 'var(--grau-text)' }}>{t.ort || '–'}</td>
                      <td><button onClick={() => terminLoeschen(t.id)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer' }}>löschen</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ERGEBNISSE ── */}
      {tab === 'ergebnisse' && (
        <div className="card">
          <div className="card-title">🎳 Ergebnisse bearbeiten</div>
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
      )}

      {/* ── MITGLIEDER ── */}
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
                <thead><tr><th>Name</th><th>Mannschaft</th><th>Status</th><th>Eintritt</th><th></th></tr></thead>
                <tbody>
                  {mitglieder.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>
                        <select value={m.mannschaft || ''} onChange={e => mannschaftAendern(m, e.target.value)}
                          style={{ fontSize: 14, border: '1px solid var(--grau-mid)', borderRadius: 6, padding: '4px 8px' }}>
                          <option value="">–</option>
                          <option value="1">G1</option>
                          <option value="2">G2</option>
                          <option value="3">G3</option>
                        </select>
                      </td>
                      <td>
                        <span className="badge" style={{ background: m.aktiv ? '#d4edda' : '#f8d7da', color: m.aktiv ? '#155724' : '#721c24' }}>
                          {m.aktiv ? 'aktiv' : 'inaktiv'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{fD(m.eintrittsdatum)}</td>
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
    </div>
  )
}
