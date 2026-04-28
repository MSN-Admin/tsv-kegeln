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
