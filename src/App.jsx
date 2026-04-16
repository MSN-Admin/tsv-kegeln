import { useState } from 'react'
import './index.css'

import Startseite  from './pages/Startseite'
import Eintragen   from './pages/Eintragen'
import Statistiken from './pages/Statistiken'
import Admin       from './pages/Admin'

const SEITEN = [
  { key: 'start',       label: 'Start' },
  { key: 'statistiken', label: 'Statistiken' },
  { key: 'eintragen',   label: '+ Ergebnis' },
  { key: 'admin',       label: 'Admin' },
]

export default function App() {
  const [seite, setSeite] = useState('start')

  return (
    <div>
      <header className="header">
        <div className="header-logo" style={{ cursor: 'pointer' }} onClick={() => setSeite('start')}>
          <div className="kegel-icon">🎳</div>
          <div>
            <h1>TSV UG Kegeln</h1>
            <span>TSV Unterpfaffenhofen-Germering e.V.</span>
          </div>
        </div>
        <nav className="nav">
          {SEITEN.map(s => (
            <a
              key={s.key}
              className={seite === s.key ? 'active' : ''}
              onClick={e => { e.preventDefault(); setSeite(s.key) }}
              href="#"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="main">
        {seite === 'start'       && <Startseite   nav={setSeite} />}
        {seite === 'statistiken' && <Statistiken               />}
        {seite === 'eintragen'   && <Eintragen    nav={setSeite} />}
        {seite === 'admin'       && <Admin                     />}
      </main>

      <footer className="footer">
        TSV Unterpfaffenhofen-Germering e.V. – Abteilung Kegeln
      </footer>
    </div>
  )
}
