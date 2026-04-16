import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const ADMIN_PASSWORT = 'Markus'

export default function Admin() {
  const [eingeloggt, setEingeloggt] = useState(false)
  const [pw, setPw]                 = useState('')
  const [pwFehler, setPwFehler]     = useState('')
  const [mitglieder, setMitglieder] = useState([])
  const [name, setName]             = useState('')
  const [pin, setPin]               = useState('')
  const [eintritt, setEintritt]     = useState('')
  const [meldung, setMeldung]       = useState('')

  function login() {
    if (pw === ADMIN_PASSWORT) { setEingeloggt(true); lade() }
    else setPwFehler('Falsches Passwort.')
  }

  async function lade() {
    const { data } = await supabase.from('mitglieder').select('*').order('name')
    setMitglieder(data || [])
  }

  async function anlegen() {
    setMeldung('')
    const { error } = await supabase.from('mitglieder').insert({
      name, pin_hash: pin, eintrittsdatum: eintritt || null
    })
    if (error) { setMeldung('Fehler: ' + error.message); return }
    setMeldung('Mitglied angelegt!')
    setName(''); setPin(''); setEintritt('')
    lade()
  }

  async function toggleAktiv(m) {
    await supabase.from('mitglieder').update({ aktiv: !m.aktiv }).eq('id', m.id)
    lade()
  }

  async function pinAendern(m) {
    const neuerPin = prompt(`Neuer PIN für ${m.name}:`)
    if (!neuerPin) return
    await supabase.from('mitglieder').update({ pin_hash: neuerPin }).eq('id', m.id)
    alert('PIN geändert.')
  }

  function formatDatum(d) {
    if (!d) return '–'
    return new Date(d).toLocaleDateString('de-DE')
  }

  if (!eingeloggt) return (
    <div className="card" style={{ maxWidth: 360 }}>
      <div className="card-title">Admin</div>
      <div className="form-group">
        <label>Passwort</label>
        <input type="password" value={pw} autoFocus
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()} />
      </div>
      {pwFehler && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{pwFehler}</p>}
      <button className="btn btn-primary" onClick={login} style={{ width: '100%', justifyContent: 'center' }}>
        Anmelden
      </button>
    </div>
  )

  return (
    <div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-title">Mitglied anlegen</div>
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Vorname Nachname" />
        </div>
        <div className="form-group">
          <label>PIN (4–6 Stellen)</label>
          <input type="text" maxLength={6} value={pin} onChange={e => setPin(e.target.value)} placeholder="z.B. 1234" />
        </div>
        <div className="form-group">
          <label>Eintrittsdatum (optional)</label>
          <input type="date" value={eintritt} onChange={e => setEintritt(e.target.value)} />
        </div>
        {meldung && (
          <p style={{ color: meldung.startsWith('Fehler') ? '#c0392b' : 'green', fontSize: 13, marginBottom: 12 }}>
            {meldung}
          </p>
        )}
        <button className="btn btn-gelb" onClick={anlegen} disabled={!name || !pin}
          style={{ width: '100%', justifyContent: 'center' }}>
          Mitglied anlegen
        </button>
      </div>

      <div className="card">
        <div className="card-title">Alle Mitglieder ({mitglieder.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Eintritt</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mitglieder.map((m, mi) => (
                <tr key={mi}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>
                    <span className="badge" style={{
                      background: m.aktiv ? '#d4edda' : '#f8d7da',
                      color: m.aktiv ? '#155724' : '#721c24'
                    }}>
                      {m.aktiv ? 'aktiv' : 'inaktiv'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{formatDatum(m.eintrittsdatum)}</td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={() => pinAendern(m)}
                      style={{ background: 'none', border: 'none', color: 'var(--tsv-blau)', cursor: 'pointer', fontSize: 13 }}>
                      PIN ändern
                    </button>
                    <button onClick={() => toggleAktiv(m)}
                      style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 13 }}>
                      {m.aktiv ? 'deaktivieren' : 'aktivieren'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
