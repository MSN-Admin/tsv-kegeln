import { useState } from 'react'
import './index.css'

import Startseite  from './pages/Startseite'
import Eintragen   from './pages/Eintragen'
import Statistiken from './pages/Statistiken'
import Termine     from './pages/Termine'
import Admin       from './pages/Admin'

const SEITEN = [
  { key: 'start',       label: 'Start' },
  { key: 'termine',     label: 'Termine' },
  { key: 'statistiken', label: 'Statistiken' },
  { key: 'eintragen',   label: '+ Ergebnis' },
  { key: 'admin',       label: 'Admin' },
]

export default function App() {
  const [seite, setSeite]         = useState('start')
  const [menuOffen, setMenuOffen] = useState(false)

  function navigiere(key) {
    setSeite(key)
    setMenuOffen(false)
  }

  return (
    <div>
      <header className="header">
        <div className="header-logo" onClick={() => navigiere('start')}>
         <img src="/tsv-logo.svg" alt="TSV UG Logo" style={{ width: 48, height: 48 }} />
          <div>
            <h1>TSV UG Kegeln</h1>
            <span>Unterpfaffenhofen-Germering e.V.</span>
          </div>
        </div>

        <nav className="nav">
          {SEITEN.map(s => (
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

      <nav className={`mobile-nav ${menuOffen ? 'open' : ''}`}>
        {SEITEN.map(s => (
          <a key={s.key} className={seite === s.key ? 'active' : ''}
            onClick={e => { e.preventDefault(); navigiere(s.key) }} href="#">
            {s.label}
          </a>
        ))}
      </nav>

      <main className="main">
        {seite === 'start'       && <Startseite   nav={navigiere} />}
        {seite === 'termine'     && <Termine                      />}
        {seite === 'statistiken' && <Statistiken                  />}
        {seite === 'eintragen'   && <Eintragen    nav={navigiere} />}
        {seite === 'admin'       && <Admin                        />}
      </main>

      <footer className="footer">
        TSV Unterpfaffenhofen-Germering e.V. – Abteilung Kegeln
      </footer>
    </div>
  )
}
