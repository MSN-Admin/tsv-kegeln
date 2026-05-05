import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const VERIFY_PIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-pin`

const RUNDEN_LABELS = {
  1: '1. Runde',
  2: '2. Runde',
  3: 'Viertelfinale',
  4: 'Halbfinale',
  5: 'Finale',
  6: 'Finale',
}

function rundenName(r) {
  return RUNDEN_LABELS[r] || `${r}. Runde`
}

export default function Pokalkegeln() {
  const [turniere, setTurniere]     = useState([])
  const [aktivId, setAktivId]       = useState(null)
  const [paarungen, setPaarungen]   = useState([])
  const [mitglieder, setMitglieder] = useState([])
  const [laden, setLaden]           = useState(true)

  // Ergebnis-Eintragen
  const [eintragenId, setEintragenId] = useState(null) // paarungs-id
  const [eintragenSpieler, setEintragenSpieler] = useState(null)
  const [pin, setPin]               = useState('')
  const [pinFehler, setPinFehler]   = useState('')
  const [schritt, setSchritt]       = useState(1) // 1=spieler wählen, 2=pin, 3=ergebnisse
  const [runden, setRunden]         = useState([])
  const [meldung, setMeldung]       = useState('')
  const [speichern, setSpeichern]   = useState(false)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('pokal_turniere').select('*').order('jahr', { ascending: false })
      const { data: m } = await supabase.from('mitglieder').select('id, name').eq('aktiv', true).order('name')
      setMitglieder(m || [])
      setTurniere(t || [])
      if (t && t.length > 0) {
        const aktiv = t.find(x => x.aktiv) || t[0]
        setAktivId(aktiv.id)
        ladePaarungen(aktiv.id)
      } else {
        setLaden(false)
      }
    }
    load()
  }, [])

  async function ladePaarungen(tid) {
    setLaden(true)
    const { data } = await supabase
      .from('pokal_paarungen')
      .select('*, s1:spieler1_id(id,name), s2:spieler2_id(id,name), s3:spieler3_id(id,name), sieger:sieger_id(id,name)')
      .eq('turnier_id', tid)
      .order('datum', { ascending: true })
      .order('uhrzeit', { ascending: true })
      .order('runde', { ascending: true })
    setPaarungen(data || [])
    setLaden(false)
  }

  async function waehleTurnier(id) {
    setAktivId(id)
    ladePaarungen(id)
  }

  function mitgliedName(id) {
    return mitglieder.find(m => m.id === id)?.name || '–'
  }

  const [filterRunde, setFilterRunde] = useState(null) // null = alle

  const maxRunde = paarungen.length > 0 ? Math.max(...paarungen.map(p => p.runde)) : 1
  const alleRunden = [...new Set(paarungen.map(p => p.runde))].sort((a,b) => a-b)

  // Nach Datum gruppieren, optional nach Runde filtern
  const gefiltertePaarungen = filterRunde ? paarungen.filter(p => p.runde === filterRunde) : paarungen
  const datumGruppen = {}
  for (const p of gefiltertePaarungen) {
    const key = p.datum || '9999-99-99'
    if (!datumGruppen[key]) datumGruppen[key] = []
    datumGruppen[key].push(p)
  }
  const sortierteDaten = Object.keys(datumGruppen).sort()

  // Ergebnis eintragen Flow
  function startEintragen(paarung) {
    setEintragenId(paarung.id)
    setEintragenSpieler(null)
    setPin('')
    setPinFehler('')
    setSchritt(1)
    setMeldung('')
    setRunden([
      { volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' },
      { volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' },
      { volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' },
      { volle_punkte: '', volle_fehler: '0', abraeumen_punkte: '', abraeumen_fehler: '0' },
    ])
  }

  async function pruefePIN() {
    setPinFehler('')
    const res = await fetch(VERIFY_PIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mitglied_id: eintragenSpieler, pin }),
    })
    const { ok } = await res.json()
    if (!ok) { setPinFehler('Falscher PIN.'); return }
    setSchritt(3)
  }

  function setRunde(i, feld, val) {
    setRunden(prev => prev.map((r, mi) => mi === i ? { ...r, [feld]: val.replace(/[^0-9]/g, '') } : r))
  }

  async function absendenErgebnis(paarung) {
    setSpeichern(true)
    setMeldung('')
    const paarungDatum = paarung.datum || new Date().toISOString().slice(0, 10)
    const rows = runden.map((r, i) => ({
      mitglied_id: eintragenSpieler,
      datum: paarungDatum,
      art: 'wettkampf',
      ort: 'heim',
      runde: i + 1,
      volle_punkte: parseInt(r.volle_punkte) || 0,
      volle_fehler: parseInt(r.volle_fehler) || 0,
      abraeumen_punkte: parseInt(r.abraeumen_punkte) || 0,
      abraeumen_fehler: parseInt(r.abraeumen_fehler) || 0,
    }))
    const { data: insertData, error } = await supabase.from('ergebnisse').insert(rows).select()
    if (error) {
      setMeldung('Fehler: ' + error.message)
      setSpeichern(false)
      return
    }
    if (!insertData || insertData.length === 0) {
      setMeldung('Fehler: Daten wurden nicht gespeichert. Bitte Admin kontaktieren.')
      setSpeichern(false)
      return
    }
    // Gesamtpunkte berechnen für Anzeige
    const gesamt = rows.reduce((s, r) => s + r.volle_punkte + r.abraeumen_punkte, 0)
    setMeldung(`✓ Ergebnis gespeichert! Gesamtpunkte: ${gesamt}`)
    setSpeichern(false)
    // Ergebnisse neu laden damit sie angezeigt werden
    await ladeErgebnisseProPaarung(paarung)
    setTimeout(() => { setEintragenId(null); setMeldung('') }, 3000)
  }

  // Ergebnisse pro Paarung laden
  const [paarungErgebnisse, setPaarungErgebnisse] = useState({})

  async function ladeErgebnisseProPaarung(paarung) {
    if (!paarung?.datum) return
    const spielerIds = [paarung.spieler1_id, paarung.spieler2_id, paarung.spieler3_id].filter(Boolean)
    const { data } = await supabase
      .from('ergebnisse')
      .select('mitglied_id, runde, volle_punkte, abraeumen_punkte, gesamt_punkte, mitglieder(name)')
      .in('mitglied_id', spielerIds)
      .eq('datum', paarung.datum)
      .eq('art', 'wettkampf')
      .order('runde')
    if (data) {
      const map = {}
      for (const e of data) {
        if (!map[e.mitglied_id]) map[e.mitglied_id] = { name: e.mitglieder?.name, runden: [], gesamt: 0 }
        map[e.mitglied_id].runden.push(e.gesamt_punkte)
        map[e.mitglied_id].gesamt += e.gesamt_punkte
      }
      setPaarungErgebnisse(prev => ({ ...prev, [paarung.id]: map }))
    }
  }

  const aktivPaarung = paarungen.find(p => p.id === eintragenId)
  const spielerOptionen = aktivPaarung ? [
    aktivPaarung.s1, aktivPaarung.s2, aktivPaarung.s3
  ].filter(Boolean) : []

  function formatDatum(d) {
    if (!d) return null
    const date = new Date(d)
    const wo = ['So.','Mo.','Di.','Mi.','Do.','Fr.','Sa.'][date.getDay()]
    return `${wo} ${date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}`
  }

  if (laden) return <div className="loading">🏆 Lade Pokalturnier…</div>

  if (turniere.length === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blau)', marginBottom: 8 }}>Noch kein Turnier angelegt</div>
      <div style={{ color: 'var(--grau-text)' }}>Der Admin kann im Admin-Bereich ein neues Pokalturnier erstellen.</div>
    </div>
  )

  // Ergebnis-Eintragen Modal
  if (eintragenId && aktivPaarung) return (
    <div>
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={() => setEintragenId(null)}>
        ← Zurück zum Bracket
      </button>
      <div className="card">
        <div className="card-title">🎳 Ergebnis eintragen</div>
        <div style={{ background: 'var(--grau-hell)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--grau-text)', marginBottom: 4 }}>
            {rundenName(aktivPaarung.runde)} · {formatDatum(aktivPaarung.datum) || 'Datum offen'}
            {aktivPaarung.uhrzeit && ` · ${aktivPaarung.uhrzeit.slice(0,5)} Uhr`}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--blau)' }}>
            {aktivPaarung.s1?.name} vs. {aktivPaarung.s2?.name}
            {aktivPaarung.s3 && ` vs. ${aktivPaarung.s3.name}`}
          </div>
        </div>

        {meldung && (
          <div style={{ background: meldung.startsWith('Fehler') ? '#fde8e8' : '#d4edda', border: `2px solid ${meldung.startsWith('Fehler') ? '#c0392b' : '#1a7a3e'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontWeight: 700, color: meldung.startsWith('Fehler') ? '#c0392b' : '#1a7a3e' }}>
            {meldung}
          </div>
        )}

        {/* Schritt 1: Spieler wählen */}
        {schritt === 1 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Wer bist du?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {spielerOptionen.map(s => (
                <button key={s.id}
                  onClick={() => { setEintragenSpieler(s.id); setSchritt(2) }}
                  style={{ padding: '16px', fontSize: 17, fontWeight: 700, background: 'var(--grau-hell)', border: '2px solid var(--grau-mid)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Schritt 2: PIN */}
        {schritt === 2 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Hallo {mitglieder.find(m => m.id === eintragenSpieler)?.name}! Bitte PIN eingeben:
            </div>
            <input type="password" inputMode="numeric" maxLength={6} value={pin}
              onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="••••" autoFocus
              style={{ width: '100%', padding: '14px', fontSize: 28, textAlign: 'center', letterSpacing: 12, border: '2px solid var(--grau-mid)', borderRadius: 10, marginBottom: 12 }} />
            {pinFehler && <div style={{ color: '#c0392b', fontWeight: 700, marginBottom: 12 }}>⚠️ {pinFehler}</div>}
            <button className="btn btn-primary btn-voll" onClick={pruefePIN}>Weiter →</button>
            <button className="btn btn-outline btn-voll" style={{ marginTop: 10 }} onClick={() => setSchritt(1)}>← Zurück</button>
          </div>
        )}

        {/* Schritt 3: Ergebnisse */}
        {schritt === 3 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--blau)' }}>
              4 Runden eintragen (Wettkampf-Modus)
            </div>
            {runden.map((r, i) => {
              const ges = (parseInt(r.volle_punkte)||0) + (parseInt(r.abraeumen_punkte)||0)
              return (
                <div key={i} style={{ background: 'var(--grau-hell)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--blau)', marginBottom: 12 }}>Runde {i+1}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Volle Punkte</div>
                      <input type="number" inputMode="numeric" value={r.volle_punkte}
                        onChange={e => setRunde(i, 'volle_punkte', e.target.value)}
                        style={{ width: '100%', padding: '12px', fontSize: 20, fontWeight: 700, border: '2px solid var(--grau-mid)', borderRadius: 8 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Volle Fehler</div>
                      <input type="number" inputMode="numeric" value={r.volle_fehler}
                        onChange={e => setRunde(i, 'volle_fehler', e.target.value)}
                        style={{ width: '100%', padding: '12px', fontSize: 20, border: '2px solid var(--grau-mid)', borderRadius: 8 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Abräumen Punkte</div>
                      <input type="number" inputMode="numeric" value={r.abraeumen_punkte}
                        onChange={e => setRunde(i, 'abraeumen_punkte', e.target.value)}
                        style={{ width: '100%', padding: '12px', fontSize: 20, fontWeight: 700, border: '2px solid var(--grau-mid)', borderRadius: 8 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Abräumen Fehler</div>
                      <input type="number" inputMode="numeric" value={r.abraeumen_fehler}
                        onChange={e => setRunde(i, 'abraeumen_fehler', e.target.value)}
                        style={{ width: '100%', padding: '12px', fontSize: 20, border: '2px solid var(--grau-mid)', borderRadius: 8 }} />
                    </div>
                  </div>
                  {r.volle_punkte && r.abraeumen_punkte && (
                    <div style={{ marginTop: 10, background: 'var(--blau)', color: 'white', borderRadius: 8, padding: '8px 14px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>Gesamt Runde {i+1}</span>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>{ges}</span>
                    </div>
                  )}
                </div>
              )
            })}
            <button className="btn btn-gruen btn-voll" style={{ marginTop: 8 }}
              onClick={() => absendenErgebnis(aktivPaarung)} disabled={speichern}>
              {speichern ? '⏳ Speichern…' : '✓ Ergebnis speichern'}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div>
      {/* Turnier-Auswahl */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {turniere.map(t => (
          <button key={t.id}
            onClick={() => waehleTurnier(t.id)}
            style={{ padding: '6px 14px', fontSize: 14, fontWeight: 700, borderRadius: 8,
              border: `2px solid ${aktivId === t.id ? 'var(--blau)' : 'var(--grau-mid)'}`,
              background: aktivId === t.id ? 'var(--blau)' : 'var(--weiss)',
              color: aktivId === t.id ? 'var(--weiss)' : 'var(--grau-text)', cursor: 'pointer' }}>
            🏆 Pokal {t.jahr}
          </button>
        ))}
      </div>

      {/* Runden-Filter */}
      {alleRunden.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <button onClick={() => setFilterRunde(null)}
            style={{ padding: '5px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${filterRunde === null ? 'var(--blau)' : 'var(--grau-mid)'}`,
              background: filterRunde === null ? 'var(--blau)' : 'var(--weiss)',
              color: filterRunde === null ? 'var(--weiss)' : 'var(--grau-text)' }}>
            Alle Runden
          </button>
          {alleRunden.map(r => (
            <button key={r} onClick={() => setFilterRunde(r)}
              style={{ padding: '5px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${filterRunde === r ? 'var(--blau)' : 'var(--grau-mid)'}`,
                background: filterRunde === r ? 'var(--blau)' : 'var(--weiss)',
                color: filterRunde === r ? 'var(--weiss)' : 'var(--grau-text)' }}>
              {rundenName(r)}
            </button>
          ))}
        </div>
      )}

      {/* Bracket – nach Datum gruppiert */}
      {sortierteDaten.map(datum => {
        const gruppe = datumGruppen[datum]
        const anzRunden = [...new Set(gruppe.map(p => p.runde))]
        return (
          <div key={datum} className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ fontSize: 16 }}>
              {datum === '9999-99-99' ? 'Datum noch offen' : formatDatum(datum)}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--grau-text)', marginLeft: 8 }}>
                {anzRunden.map(r => rundenName(r)).join(' · ')}
              </span>
            </div>
            {gruppe.map((p, i) => {
              const hatSieger = !!p.sieger_id
              return (
                <div key={i} style={{
                  border: `2px solid ${hatSieger ? '#d4edda' : 'var(--grau-mid)'}`,
                  borderRadius: 10, padding: 14, marginBottom: 10,
                  background: hatSieger ? '#f0faf4' : 'var(--grau-hell)'
                }}>
                  {/* Meta */}
                  <div style={{ fontSize: 12, color: 'var(--grau-text)', marginBottom: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {p.datum && <span>📅 {formatDatum(p.datum)}</span>}
                    {p.uhrzeit && <span>🕐 {p.uhrzeit.slice(0,5)} Uhr</span>}
                    {p.ort && <span>📍 {p.ort}</span>}
                    {hatSieger && (
                      <span style={{ background: '#d4edda', color: '#155724', fontWeight: 700, borderRadius: 6, padding: '1px 8px' }}>
                        ✓ Sieger: {p.sieger.name}
                      </span>
                    )}
                  </div>

                  {/* Spieler */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {[p.s1, p.s2, p.s3].filter(Boolean).map((s, si) => {
                      const erg = paarungErgebnisse[p.id]?.[s.id]
                      return (
                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {si > 0 && <span style={{ color: 'var(--grau-text)', fontWeight: 700 }}>vs.</span>}
                          <div style={{ borderRadius: 8, overflow: 'hidden', border: `2px solid ${p.sieger_id === s.id ? 'var(--gelb)' : 'var(--grau-mid)'}` }}>
                            <div style={{
                              padding: '8px 14px', fontWeight: 700, fontSize: 15,
                              background: p.sieger_id === s.id ? 'var(--gelb)' : 'var(--weiss)',
                              color: p.sieger_id === s.id ? 'var(--blau)' : 'var(--text)',
                            }}>
                              {p.sieger_id === s.id && '🏆 '}{s.name}
                            </div>
                            {erg && (
                              <div style={{ background: 'var(--grau-hell)', padding: '4px 14px', fontSize: 13, color: 'var(--blau)', fontWeight: 700, textAlign: 'center' }}>
                                {erg.gesamt} Pkt · {erg.runden.length}R
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Ergebnisse laden Button */}
                    {!paarungErgebnisse[p.id] && p.datum && (
                      <button onClick={() => ladeErgebnisseProPaarung(p)}
                        style={{ marginLeft: 8, background: 'none', border: '1px solid var(--grau-mid)', color: 'var(--grau-text)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                        Ergebnisse laden
                      </button>
                    )}

                    {/* Ergebnis eintragen Button */}
                    {!hatSieger && p.datum && (
                      <button onClick={() => startEintragen(p)}
                        style={{ marginLeft: 'auto', background: 'var(--blau)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        🎳 Ergebnis eintragen
                      </button>
                    )}
                  </div>

                  {p.notiz && (
                    <div style={{ fontSize: 13, color: 'var(--grau-text)', marginTop: 8, fontStyle: 'italic' }}>{p.notiz}</div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {paarungen.length === 0 && (
        <div className="card"><div className="empty">Noch keine Paarungen angelegt.</div></div>
      )}
    </div>
  )
}
