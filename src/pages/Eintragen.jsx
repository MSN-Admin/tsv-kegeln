import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const LEER = { volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' }

const S = {
  seite: {
    maxWidth: 500,
    margin: '0 auto',
  },
  schritt: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  schrittTitel: {
    fontSize: 22,
    fontWeight: 700,
    color: '#003D8F',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  schrittNr: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: '#003D8F',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  },
  label: {
    display: 'block',
    fontSize: 17,
    fontWeight: 700,
    color: '#222',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 22,
    fontWeight: 700,
    border: '2px solid #ccc',
    borderRadius: 10,
    color: '#111',
    background: '#fff',
    appearance: 'none',
    WebkitAppearance: 'none',
    marginBottom: 4,
  },
  inputFokus: {
    borderColor: '#003D8F',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(0,61,143,0.15)',
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 18,
    fontWeight: 600,
    border: '2px solid #ccc',
    borderRadius: 10,
    color: '#111',
    background: '#fff',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23003D8F\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '24px',
    paddingRight: 48,
    marginBottom: 4,
  },
  btnPrimary: {
    width: '100%',
    padding: '18px 24px',
    fontSize: 20,
    fontWeight: 700,
    background: '#003D8F',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    marginTop: 8,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  btnGruen: {
    width: '100%',
    padding: '18px 24px',
    fontSize: 20,
    fontWeight: 700,
    background: '#1a7a3e',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    marginTop: 8,
    touchAction: 'manipulation',
  },
  btnRot: {
    width: '100%',
    padding: '14px 24px',
    fontSize: 17,
    fontWeight: 600,
    background: '#fff',
    color: '#c0392b',
    border: '2px solid #c0392b',
    borderRadius: 10,
    cursor: 'pointer',
    marginTop: 8,
    touchAction: 'manipulation',
  },
  btnZurueck: {
    padding: '12px 20px',
    fontSize: 16,
    fontWeight: 600,
    background: '#fff',
    color: '#003D8F',
    border: '2px solid #003D8F',
    borderRadius: 10,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  hinweis: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  fehlerBox: {
    background: '#fde8e8',
    border: '2px solid #c0392b',
    borderRadius: 10,
    padding: '14px 16px',
    fontSize: 17,
    color: '#c0392b',
    fontWeight: 600,
    marginTop: 12,
  },
  ergebnisBox: {
    background: '#003D8F',
    color: '#fff',
    borderRadius: 10,
    padding: '14px 18px',
    marginTop: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ergebnisZahl: {
    fontSize: 28,
    fontWeight: 700,
  },
  ergebnisLabel: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },
  rundeBox: {
    background: '#f0f4ff',
    border: '2px solid #003D8F',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  rundeTitel: {
    fontSize: 20,
    fontWeight: 700,
    color: '#003D8F',
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gruppeLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#555',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
    paddingBottom: 6,
    borderBottom: '1px solid #ccc',
  },
  toggleGruppe: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 4,
  },
  toggleBtn: (aktiv) => ({
    padding: '14px 8px',
    fontSize: 16,
    fontWeight: 700,
    border: '2px solid',
    borderColor: aktiv ? '#003D8F' : '#ccc',
    borderRadius: 10,
    background: aktiv ? '#003D8F' : '#fff',
    color: aktiv ? '#fff' : '#555',
    cursor: 'pointer',
    textAlign: 'center',
    touchAction: 'manipulation',
  }),
}

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
  const [fokus, setFokus]           = useState(null)

  useEffect(() => {
    supabase.from('mitglieder').select('id, name').eq('aktiv', true).order('name')
      .then(({ data }) => setMitglieder(data || []))
  }, [])

  async function pruefePIN() {
    setPinFehler('')
    if (pin.length < 4) {
      setPinFehler('Bitte gib deinen PIN ein (mindestens 4 Stellen).')
      return
    }
    const { data } = await supabase
      .from('mitglieder').select('pin_hash').eq('id', mitgliedId).single()
    if (!data || data.pin_hash !== pin) {
      setPinFehler('Der PIN ist leider falsch. Bitte nochmal versuchen.')
      return
    }
    setSchritt(3)
  }

  function setRunde(i, feld, val) {
    const num = val.replace(/[^0-9]/g, '')
    setRunden(prev => prev.map((r, mi) => mi === i ? { ...r, [feld]: num } : r))
  }

  function validiereEingabe(val, max) {
    const n = parseInt(val)
    if (isNaN(n)) return false
    if (n < 0 || n > max) return false
    return true
  }

  async function absenden() {
    setFehler('')
    for (let i = 0; i < runden.length; i++) {
      const r = runden[i]
      if (!r.volle_punkte || !validiereEingabe(r.volle_punkte, 135)) {
        setFehler(`Runde ${i + 1}: Bitte gib eine gültige Punktzahl für Volle ein (0–135).`)
        return
      }
      if (!r.abraeumen_punkte || !validiereEingabe(r.abraeumen_punkte, 135)) {
        setFehler(`Runde ${i + 1}: Bitte gib eine gültige Punktzahl für Abräumen ein (0–135).`)
        return
      }
    }
    setSpeichern(true)
    const inserts = runden.map((r, i) => ({
      mitglied_id:      mitgliedId,
      datum,
      art,
      ort,
      runde:            i + 1,
      volle_punkte:     parseInt(r.volle_punkte),
      volle_fehler:     parseInt(r.volle_fehler) || 0,
      abraeumen_punkte: parseInt(r.abraeumen_punkte),
      abraeumen_fehler: parseInt(r.abraeumen_fehler) || 0,
    }))
    const { error } = await supabase.from('ergebnisse').insert(inserts)
    setSpeichern(false)
    if (error) {
      setFehler(error.code === '23505'
        ? 'Du hast für diesen Tag bereits ein Ergebnis eingetragen.'
        : 'Es ist ein Fehler aufgetreten. Bitte nochmal versuchen.')
      return
    }
    setSchritt(4)
  }

  function reset() {
    setSchritt(1); setMitgliedId(''); setPin(''); setPinFehler('')
    setDatum(new Date().toISOString().slice(0, 10)); setArt('training'); setOrt('heim')
    setRunden([{ ...LEER }]); setFehler('')
  }

  const mitgliedName = mitglieder.find(m => m.id === mitgliedId)?.name

  // ── SCHRITT 1: Name wählen ──────────────────────────────────
  if (schritt === 1) return (
    <div style={S.seite}>
      <div style={S.schritt}>
        <div style={S.schrittTitel}>
          <div style={S.schrittNr}>1</div>
          Wer spielt?
        </div>
        <label style={S.label}>Dein Name</label>
        <select
          style={{ ...S.select, borderColor: mitgliedId ? '#003D8F' : '#ccc' }}
          value={mitgliedId}
          onChange={e => setMitgliedId(e.target.value)}
        >
          <option value="">– Name auswählen –</option>
          {mitglieder.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <p style={S.hinweis}>Tippe auf deinen Namen in der Liste.</p>
        <button
          style={{ ...S.btnPrimary, opacity: mitgliedId ? 1 : 0.4 }}
          disabled={!mitgliedId}
          onClick={() => setSchritt(2)}
        >
          Weiter →
        </button>
      </div>
    </div>
  )

  // ── SCHRITT 2: PIN ──────────────────────────────────────────
  if (schritt === 2) return (
    <div style={S.seite}>
      <div style={S.schritt}>
        <div style={S.schrittTitel}>
          <div style={S.schrittNr}>2</div>
          Dein geheimer PIN
        </div>
        <p style={{ fontSize: 17, color: '#444', marginBottom: 20 }}>
          Hallo <strong>{mitgliedName}</strong>! Bitte gib deinen persönlichen PIN ein.
        </p>
        <label style={S.label}>PIN eingeben</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          autoFocus
          onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && pruefePIN()}
          placeholder="••••"
          style={{
            ...S.input,
            letterSpacing: 12,
            textAlign: 'center',
            fontSize: 32,
            ...(fokus === 'pin' ? S.inputFokus : {}),
          }}
          onFocus={() => setFokus('pin')}
          onBlur={() => setFokus(null)}
        />
        {pinFehler && <div style={S.fehlerBox}>⚠️ {pinFehler}</div>}
        <button style={S.btnPrimary} onClick={pruefePIN}>
          PIN bestätigen
        </button>
        <button style={S.btnZurueck} onClick={() => setSchritt(1)}>
          ← Zurück
        </button>
      </div>
    </div>
  )

  // ── SCHRITT 3: Ergebnis eintragen ───────────────────────────
  if (schritt === 3) return (
    <div style={S.seite}>

      {/* Spielinfos */}
      <div style={S.schritt}>
        <div style={S.schrittTitel}>
          <div style={S.schrittNr}>3</div>
          Spielinfos
        </div>

        <label style={S.label}>Datum</label>
        <input
          type="date"
          value={datum}
          onChange={e => setDatum(e.target.value)}
          style={{ ...S.input, fontSize: 18 }}
        />

        <label style={{ ...S.label, marginTop: 16 }}>Was wurde gespielt?</label>
        <div style={S.toggleGruppe}>
          <button style={S.toggleBtn(art === 'training')} onClick={() => setArt('training')}>
            🎳 Training
          </button>
          <button style={S.toggleBtn(art === 'wettkampf')} onClick={() => setArt('wettkampf')}>
            🏆 Wettkampf
          </button>
        </div>

        <label style={{ ...S.label, marginTop: 16 }}>Wo wurde gespielt?</label>
        <div style={S.toggleGruppe}>
          <button style={S.toggleBtn(ort === 'heim')} onClick={() => setOrt('heim')}>
            🏠 Zuhause
          </button>
          <button style={S.toggleBtn(ort === 'auswaerts')} onClick={() => setOrt('auswaerts')}>
            ✈️ Auswärts
          </button>
        </div>
      </div>

      {/* Runden */}
      {runden.map((r, i) => {
        const gp = (parseInt(r.volle_punkte) || 0) + (parseInt(r.abraeumen_punkte) || 0)
        const gf = (parseInt(r.volle_fehler) || 0) + (parseInt(r.abraeumen_fehler) || 0)
        const rundeVollstaendig = r.volle_punkte !== '' && r.abraeumen_punkte !== ''
        return (
          <div key={i} style={S.schritt}>
            <div style={S.rundeTitel}>
              <span>Runde {i + 1}</span>
              {runden.length > 1 && (
                <button
                  onClick={() => setRunden(p => p.filter((_, x) => x !== i))}
                  style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: 16, fontWeight: 700, cursor: 'pointer', padding: '4px 8px' }}
                >
                  ✕ Entfernen
                </button>
              )}
            </div>

            {/* Volle */}
            <div style={S.gruppeLabel}>VOLLE – 15 Würfe</div>
            <label style={S.label}>Punkte Volle</label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max="135"
              value={r.volle_punkte}
              onChange={e => setRunde(i, 'volle_punkte', e.target.value)}
              placeholder="z. B. 87"
              style={{
                ...S.input,
                borderColor: r.volle_punkte && !validiereEingabe(r.volle_punkte, 135) ? '#c0392b' : fokus === `vp${i}` ? '#003D8F' : '#ccc'
              }}
              onFocus={() => setFokus(`vp${i}`)}
              onBlur={() => setFokus(null)}
            />
            {r.volle_punkte && !validiereEingabe(r.volle_punkte, 135) && (
              <div style={{ color: '#c0392b', fontSize: 14, marginBottom: 8 }}>
                ⚠️ Bitte eine Zahl zwischen 0 und 135 eingeben.
              </div>
            )}

            <label style={S.label}>Fehlwürfe Volle</label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max="15"
              value={r.volle_fehler}
              onChange={e => setRunde(i, 'volle_fehler', e.target.value)}
              placeholder="0"
              style={{ ...S.input, borderColor: fokus === `vf${i}` ? '#003D8F' : '#ccc' }}
              onFocus={() => setFokus(`vf${i}`)}
              onBlur={() => setFokus(null)}
            />

            {/* Abräumen */}
            <div style={{ ...S.gruppeLabel, marginTop: 16 }}>ABRÄUMEN – 15 Würfe</div>
            <label style={S.label}>Punkte Abräumen</label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max="135"
              value={r.abraeumen_punkte}
              onChange={e => setRunde(i, 'abraeumen_punkte', e.target.value)}
              placeholder="z. B. 72"
              style={{
                ...S.input,
                borderColor: r.abraeumen_punkte && !validiereEingabe(r.abraeumen_punkte, 135) ? '#c0392b' : fokus === `ap${i}` ? '#003D8F' : '#ccc'
              }}
              onFocus={() => setFokus(`ap${i}`)}
              onBlur={() => setFokus(null)}
            />
            {r.abraeumen_punkte && !validiereEingabe(r.abraeumen_punkte, 135) && (
              <div style={{ color: '#c0392b', fontSize: 14, marginBottom: 8 }}>
                ⚠️ Bitte eine Zahl zwischen 0 und 135 eingeben.
              </div>
            )}

            <label style={S.label}>Fehlwürfe Abräumen</label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max="15"
              value={r.abraeumen_fehler}
              onChange={e => setRunde(i, 'abraeumen_fehler', e.target.value)}
              placeholder="0"
              style={{ ...S.input, borderColor: fokus === `af${i}` ? '#003D8F' : '#ccc' }}
              onFocus={() => setFokus(`af${i}`)}
              onBlur={() => setFokus(null)}
            />

            {/* Ergebnis-Vorschau */}
            {rundeVollstaendig && (
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

      {/* Weitere Runde */}
      <div style={S.schritt}>
        <button
          style={{ ...S.btnZurueck, width: '100%', textAlign: 'center', fontSize: 18 }}
          onClick={() => setRunden(p => [...p, { ...LEER }])}
        >
          + Weitere Runde hinzufügen
        </button>
      </div>

      {/* Speichern */}
      <div style={S.schritt}>
        {fehler && <div style={{ ...S.fehlerBox, marginBottom: 16 }}>⚠️ {fehler}</div>}
        <button
          style={{ ...S.btnGruen, opacity: speichern ? 0.6 : 1 }}
          onClick={absenden}
          disabled={speichern}
        >
          {speichern ? '⏳ Wird gespeichert…' : '✓ Ergebnis speichern'}
        </button>
        <button style={{ ...S.btnZurueck, marginTop: 12 }} onClick={() => setSchritt(2)}>
          ← Zurück
        </button>
      </div>
    </div>
  )

  // ── SCHRITT 4: Fertig ───────────────────────────────────────
  const gesamt = runden.reduce((s, r) =>
    s + (parseInt(r.volle_punkte) || 0) + (parseInt(r.abraeumen_punkte) || 0), 0)

  return (
    <div style={S.seite}>
      <div style={{ ...S.schritt, textAlign: 'center', padding: 36 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎳</div>
        <h2 style={{ fontSize: 26, color: '#1a7a3e', marginBottom: 12 }}>
          Ergebnis gespeichert!
        </h2>
        <div style={{
          background: '#f0faf4',
          border: '2px solid #1a7a3e',
          borderRadius: 12,
          padding: '16px 24px',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: '#1a7a3e' }}>{gesamt}</div>
          <div style={{ fontSize: 16, color: '#555' }}>Punkte gesamt · {runden.length} Runde{runden.length !== 1 ? 'n' : ''}</div>
          <div style={{ fontSize: 15, color: '#888', marginTop: 4 }}>
            {art === 'wettkampf' ? '🏆 Wettkampf' : '🎳 Training'} · {ort === 'heim' ? '🏠 Zuhause' : '✈️ Auswärts'}
          </div>
        </div>
        <button style={S.btnPrimary} onClick={() => nav('start')}>
          Zur Startseite
        </button>
        <button style={{ ...S.btnRot, marginTop: 10 }} onClick={reset}>
          Weiteres Ergebnis eintragen
        </button>
      </div>
    </div>
  )
}
