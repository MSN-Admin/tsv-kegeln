import { useState } from 'react'
import './index.css'

import Startseite     from './pages/Startseite'
import Eintragen      from './pages/Eintragen'
import Statistiken    from './pages/Statistiken'
import Termine        from './pages/Termine'
import Auswaerts      from './pages/Auswaerts'
import Liga           from './pages/Liga'
import Admin          from './pages/Admin'
import Pokalkegeln    from './pages/Pokalkegeln'
import Tandemkegeln   from './pages/Tandemkegeln'
import SpezialTraining from './pages/SpezialTraining'

// Vereins-PIN wird serverseitig geprüft – kein Klartext im Bundle
const VERIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-vereinspin`
const SESSION_KEY = 'tsv_zugang'

async function pruefVereinsPin(pin) {
  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, typ: 'verein' }),
  })
  const { ok } = await res.json()
  return ok
}

function PinGate({ onErfolg }) {
  const [pin, setPin]       = useState('')
  const [fehler, setFehler] = useState(false)
  const [laden, setLaden]   = useState(false)

  async function pruefen() {
    if (!pin || laden) return
    setLaden(true)
    const ok = await pruefVereinsPin(pin)
    setLaden(false)
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onErfolg()
    } else {
      setFehler(true)
      setPin('')
      setTimeout(() => setFehler(false), 2000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--grau-hell)', padding: '24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)', maxWidth: 340, width: '100%',
        textAlign: 'center',
      }}>
        <img src="/tsv-logo.svg" alt="TSV UG Logo" style={{ width: 72, height: 72, marginBottom: 20 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#003D8F', marginBottom: 6 }}>
          TSV UG Kegeln
        </h2>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 28 }}>
          Bitte Vereins-PIN eingeben
        </p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          autoFocus
          onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && pruefen()}
          placeholder="••••"
          style={{
            width: '100%', padding: '14px', fontSize: 28, textAlign: 'center',
            letterSpacing: 10, border: `2px solid ${fehler ? '#c0392b' : '#d0d0d0'}`,
            borderRadius: 10, marginBottom: 16, outline: 'none',
            transition: 'border-color 0.2s',
            background: fehler ? '#fde8e8' : '#fff',
          }}
        />
        {fehler && (
          <p style={{ color: '#c0392b', fontWeight: 700, marginBottom: 12, fontSize: 15 }}>
            ⚠️ Falscher PIN
          </p>
        )}
        <button onClick={pruefen} disabled={laden || !pin}
          style={{
            width: '100%', padding: '14px', fontSize: 17, fontWeight: 700,
            background: laden ? '#888' : '#003D8F', color: '#fff', border: 'none',
            borderRadius: 10, cursor: laden ? 'wait' : 'pointer',
          }}>
          {laden ? '⏳ Prüfe…' : 'Einloggen'}
        </button>
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 20 }}>
          Nur für Mitglieder der Kegelabteilung
        </p>
      </div>
    </div>
  )
}

const SEITEN = [
  { key: 'start',           label: '🏠 Start' },
  { key: 'termine',         label: '📅 Interne Termine' },
  { key: 'liga',            label: '🏆 Liga' },
  { key: 'statistiken',     label: '📊 Statistiken' },
  { key: 'auswaerts',       label: '✈️ Auswärts' },
  { key: 'turniere',        label: '🥇 Interne Turniere', sub: [
    { key: 'pokalkegeln',   label: '🏆 Pokalkegeln' },
    { key: 'tandemkegeln',  label: '🤝 Tandemkegeln' },
  ]},
  { key: 'spezialtraining', label: '🎯 Spezial-Training' },
  { key: 'eintragen',       label: '🎳 Ergebnis eintragen' },
  { key: 'admin',           label: '⚙️ Admin' },
]

export default function App() {
  const [seite, setSeite]           = useState('start')
  const [menuOffen, setMenuOffen]   = useState(false)
  const [turniereOffen, setTurniereOffen] = useState(false)
  const [eingeloggt, setEingeloggt] = useState(
    sessionStorage.getItem(SESSION_KEY) === '1'
  )

  if (!eingeloggt) return <PinGate onErfolg={() => setEingeloggt(true)} />

  function navigiere(key) {
    setSeite(key)
    setMenuOffen(false)
    if (key !== 'pokalkegeln' && key !== 'tandemkegeln') setTurniereOffen(false)
  }

  const istTurnier = seite === 'pokalkegeln' || seite === 'tandemkegeln'

  return (
    <div>
      <header className="header">
        <div className="header-logo" onClick={() => navigiere('start')}>
          <img src="/tsv-logo.svg" alt="TSV UG Logo" style={{ width: 42, height: 42 }} />
          <div>
            <h1>TSV UG Kegeln</h1>
            <span>Unterpfaffenhofen-Germering e.V.</span>
          </div>
        </div>

        <nav className="nav">
          {SEITEN.map(s => s.sub ? (
            <div key={s.key} style={{ position: 'relative' }}>
              <a
                className={istTurnier ? 'active' : ''}
                onClick={e => { e.preventDefault(); setTurniereOffen(o => !o) }}
                href="#"
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {s.label} <span style={{ fontSize: 10 }}>▾</span>
              </a>
              {turniereOffen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 300,
                  background: 'var(--blau)', borderRadius: 8, padding: 6,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)', minWidth: 160
                }}>
                  {s.sub.map(sub => (
                    <a key={sub.key}
                      className={seite === sub.key ? 'active' : ''}
                      onClick={e => { e.preventDefault(); navigiere(sub.key) }}
                      href="#"
                      style={{ display: 'block', padding: '8px 12px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                      {sub.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <a key={s.key} className={seite === s.key ? 'active' : ''}
              onClick={e => { e.preventDefault(); navigiere(s.key) }} href="#">
              {s.label}
            </a>
          ))}
        </nav>

        <button className="hamburger" onClick={() => setMenuOffen(o => !o)} aria-label="Menü">
          <span style={{ transform: menuOffen ? 'rotate(45deg) translate(5px, 5px)' : '' }} />
          <span style={{ opacity: menuOffen ? 0 : 1 }} />
          <span style={{ transform: menuOffen ? 'rotate(-45deg) translate(5px, -5px)' : '' }} />
        </button>
      </header>

      {/* Mobile Nav */}
      <nav className={`mobile-nav ${menuOffen ? 'open' : ''}`}>
        {SEITEN.map(s => s.sub ? (
          <div key={s.key}>
            <a onClick={e => { e.preventDefault(); setTurniereOffen(o => !o) }} href="#"
              style={{ opacity: 0.8 }}>
              {s.label} {turniereOffen ? '▲' : '▼'}
            </a>
            {turniereOffen && s.sub.map(sub => (
              <a key={sub.key}
                className={seite === sub.key ? 'active' : ''}
                onClick={e => { e.preventDefault(); navigiere(sub.key) }}
                href="#"
                style={{ paddingLeft: 36, fontSize: 18, opacity: 0.9 }}>
                {sub.label}
              </a>
            ))}
          </div>
        ) : (
          <a key={s.key} className={seite === s.key ? 'active' : ''}
            onClick={e => { e.preventDefault(); navigiere(s.key) }} href="#">
            {s.label}
          </a>
        ))}
      </nav>

      <main className="main">
        {seite === 'start'           && <Startseite      nav={navigiere} />}
        {seite === 'termine'         && <Termine                         />}
        {seite === 'liga'            && <Liga                            />}
        {seite === 'statistiken'     && <Statistiken                     />}
        {seite === 'auswaerts'       && <Auswaerts                       />}
        {seite === 'pokalkegeln'     && <Pokalkegeln                     />}
        {seite === 'tandemkegeln'    && <Tandemkegeln                    />}
        {seite === 'spezialtraining' && <SpezialTraining                 />}
        {seite === 'eintragen'       && <Eintragen        nav={navigiere} />}
        {seite === 'admin'           && <Admin                           />}
      </main>

      <footer className="footer">
        TSV Unterpfaffenhofen-Germering e.V. – Abteilung Kegeln
      </footer>
    </div>
  )
}
