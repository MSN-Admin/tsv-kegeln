import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const LEER = { volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' }

export default function Eintragen({ nav }) {
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

  useEffect(() => {
    supabase.from('mitglieder').select('id, name').eq('aktiv', true).order('name')
      .then(({ data }) => setMitglieder(data || []))
  }, [])

  async function pruefePIN() {
    setPinFehler('')
    const { data } = await supabase
      .from('mitglieder').select('pin_hash').eq('id', mitgliedId).single()
    if (!data || data.pin_hash !== pin) {
      setPinFehler('PIN falsch – bitte nochmal versuchen.')
      return
    }
    setSchritt(3)
  }

  function setRunde(i, feld, val) {
    setRunden(prev => prev.map((r, mi) => mi === i ? { ...r, [feld]: val } : r))
  }

  async function absenden() {
    setFehler('')
    for (let mi = 0; mi < runden.length; mi++) {
      if (runden[mi].volle_punkte === '' || runden[mi].abraeumen_punkte === '') {
        setFehler(`Runde ${mi + 1}: Bitte alle Punkte eintragen.`)
        return
      }
    }
    setSpeichern(true)
    const inserts = runden.map((r, mi) => ({
      mitglied_id:      mitgliedId,
      datum,
      art,
      ort,
      runde:            mi + 1,
      volle_punkte:     parseInt(r.volle_punkte),
      volle_fehler:     parseInt(r.volle_fehler) || 0,
      abraeumen_punkte: parseInt(r.abraeumen_punkte),
      abraeumen_fehler: parseInt(r.abraeumen_fehler) || 0,
    }))
    const { error } = await supabase.from('ergebnisse').insert(inserts)
    setSpeichern(false)
    if (error) {
      setFehler(error.code === '23505'
        ? 'Für dieses Datum hast du bereits Ergebnisse eingetragen.'
        : 'Fehler: ' + error.message)
      return
    }
    setSchritt(4)
  }

  function reset() {
    setSchritt(1); setMitgliedId(''); setPin(''); setPinFehler('')
    setDatum(new Date().toISOString().slice(0, 10)); setArt('training'); setOrt('heim')
    setRunden([{ ...LEER }]); setFehler('')
  }

  // Schritt 1: Wer bist du?
  if (schritt === 1) return (
    <div className="card" style={{ maxWidth: 440 }}>
      <div className="card-title">Ergebnis eintragen</div>
      <div className="form-group">
        <label>Dein Name</label>
        <select value={mitgliedId} onChange={e => setMitgliedId(e.target.value)}>
          <option value="">– bitte wählen –</option>
          {mitglieder.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <button className="btn btn-primary" disabled={!mitgliedId}
        onClick={() => setSchritt(2)} style={{ width: '100%', justifyContent: 'center' }}>
        Weiter →
      </button>
    </div>
  )

  // Schritt 2: PIN
  if (schritt === 2) return (
    <div className="card" style={{ maxWidth: 360 }}>
      <div className="card-title">PIN eingeben</div>
      <div className="form-group">
        <input type="password" maxLength={6} value={pin} autoFocus
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && pruefePIN()}
          placeholder="••••"
          style={{ fontSize: 28, letterSpacing: 10, textAlign: 'center' }} />
      </div>
      {pinFehler && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{pinFehler}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline" onClick={() => setSchritt(1)}>← Zurück</button>
        <button className="btn btn-primary" onClick={pruefePIN} style={{ flex: 1, justifyContent: 'center' }}>
          Bestätigen
        </button>
      </div>
    </div>
  )

  // Schritt 3: Runden eintragen
  if (schritt === 3) {
    const mitgliedName = mitglieder.find(m => m.id === mitgliedId)?.name
    return (
      <div style={{ maxWidth: 560 }}>
        <div className="card">
          <div className="card-title">Hallo {mitgliedName}!</div>

          {/* Spielinfo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Datum</label>
              <input type="date" value={datum} onChange={e => setDatum(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Art</label>
              <select value={art} onChange={e => setArt(e.target.value)}>
                <option value="training">Training</option>
                <option value="wettkampf">Wettkampf</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Ort</label>
              <select value={ort} onChange={e => setOrt(e.target.value)}>
                <option value="heim">🏠 Heim</option>
                <option value="auswaerts">✈️ Auswärts</option>
              </select>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--grau-mid)', marginBottom: 20 }} />

          {/* Runden */}
          {runden.map((r, mi) => {
            const gp = (parseInt(r.volle_punkte) || 0) + (parseInt(r.abraeumen_punkte) || 0)
            const gf = (parseInt(r.volle_fehler) || 0) + (parseInt(r.abraeumen_fehler) || 0)
            return (
              <div key={mi} style={{
                background: 'var(--grau-hell)', borderRadius: 'var(--radius)',
                padding: 16, marginBottom: 16, border: '1px solid var(--grau-mid)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <strong style={{ color: 'var(--tsv-blau)' }}>Runde {mi + 1}</strong>
                  {runden.length > 1 && (
                    <button onClick={() => setRunden(p => p.filter((_, x) => x !== mi))}
                      style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 13 }}>
                      ✕ entfernen
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 8, letterSpacing: 1 }}>VOLLE (15 Würfe)</div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label>Punkte</label>
                      <input type="number" min="0" max="135" value={r.volle_punkte}
                        onChange={e => setRunde(mi, 'volle_punkte', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Fehlwürfe</label>
                      <input type="number" min="0" max="15" value={r.volle_fehler}
                        onChange={e => setRunde(mi, 'volle_fehler', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 8, letterSpacing: 1 }}>ABRÄUMEN (15 Würfe)</div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label>Punkte</label>
                      <input type="number" min="0" max="135" value={r.abraeumen_punkte}
                        onChange={e => setRunde(mi, 'abraeumen_punkte', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Fehlwürfe</label>
                      <input type="number" min="0" max="15" value={r.abraeumen_fehler}
                        onChange={e => setRunde(mi, 'abraeumen_fehler', e.target.value)} />
                    </div>
                  </div>
                </div>
                {r.volle_punkte !== '' && r.abraeumen_punkte !== '' && (
                  <div style={{
                    marginTop: 12, padding: '8px 14px', background: 'var(--tsv-blau)',
                    color: 'white', borderRadius: 'var(--radius)',
                    display: 'flex', justifyContent: 'space-between', fontSize: 14
                  }}>
                    <span>Gesamt: <strong>{gp} Punkte</strong></span>
                    {gf > 0 && <span style={{ opacity: 0.8 }}>{gf} Fehlwurf{gf !== 1 ? 'e' : ''}</span>}
                  </div>
                )}
              </div>
            )
          })}

          <button className="btn btn-outline" onClick={() => setRunden(p => [...p, { ...LEER }])}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
            + Weitere Runde
          </button>

          {fehler && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{fehler}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => setSchritt(2)}>← Zurück</button>
            <button className="btn btn-gelb" onClick={absenden} disabled={speichern}
              style={{ flex: 1, justifyContent: 'center' }}>
              {speichern ? 'Speichern…' : '✓ Ergebnis speichern'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Schritt 4: Fertig
  const gesamt = runden.reduce((s, r) =>
    s + (parseInt(r.volle_punkte) || 0) + (parseInt(r.abraeumen_punkte) || 0), 0)

  return (
    <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>🎳</div>
      <h2 style={{ color: 'var(--tsv-blau)', marginBottom: 8 }}>Gespeichert!</h2>
      <p style={{ color: 'var(--grau-text)', marginBottom: 4 }}>
        {runden.length} Runde{runden.length !== 1 ? 'n' : ''} – {gesamt} Punkte gesamt
      </p>
      <p style={{ color: 'var(--grau-text)', marginBottom: 24, fontSize: 14 }}>
        {art === 'wettkampf' ? 'Wettkampf' : 'Training'} · {ort === 'heim' ? '🏠 Heim' : '✈️ Auswärts'}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline" onClick={reset} style={{ flex: 1, justifyContent: 'center' }}>
          Weiteres Ergebnis
        </button>
        <button className="btn btn-primary" onClick={() => nav('start')} style={{ flex: 1, justifyContent: 'center' }}>
          Zur Startseite
        </button>
      </div>
    </div>
  )
}
