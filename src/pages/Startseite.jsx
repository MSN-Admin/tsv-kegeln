import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { LIGEN, istTSV, callSportwinner, parseTabelleZeile } from './Liga'

function getSaisonListe() {
  const heute = new Date()
  const aktJahr = heute.getMonth() >= 8 ? heute.getFullYear() : heute.getFullYear() - 1
  const liste = []
  for (let j = aktJahr; j >= 2025; j--) {
    liste.push({ label: `${j}/${String(j + 1).slice(2)}`, start: `${j}-09-01`, end: `${j + 1}-04-30` })
  }
  return liste
}

function mannschaftLabel(m) {
  if (!m) return ''
  return `G${m}`
}

export default function Startseite({ nav }) {
  const saisonListe = getSaisonListe()
  const [saisonIdx, setSaisonIdx]       = useState(0)
  const [rangliste, setRangliste]       = useState([])
  const [tage, setTage]                 = useState([])
  const [aufgeklappt, setAufgeklappt]   = useState({})
  const [naechsteTermine, setNaechsteTermine] = useState([])
  const [termineAufgeklappt, setTermineAufgeklappt] = useState(false)
  const [laden, setLaden]               = useState(true)

  const [ligaPlätze, setLigaPlätze] = useState([])

  const saison = saisonListe[saisonIdx]

  useEffect(() => {
    if (!saison) return
    async function load() {
      setLaden(true)
      setAufgeklappt({})

      // Rangliste
      const { data: erg } = await supabase
        .from('ergebnisse')
        .select('mitglied_id, gesamt_punkte, art, mitglieder(name, mannschaft)')
        .gte('datum', saison.start)
        .lte('datum', saison.end)

      if (erg) {
        const map = {}
        for (const e of erg) {
          const id = e.mitglied_id
          const name = e.mitglieder?.name || '–'
          const mannschaft = e.mitglieder?.mannschaft || null
          if (!map[id]) map[id] = { name, mannschaft, punkte: [], wettkampf: [], beste: 0 }
          map[id].punkte.push(e.gesamt_punkte)
          map[id].beste = Math.max(map[id].beste, e.gesamt_punkte)
          if (e.art === 'wettkampf') map[id].wettkampf.push(e.gesamt_punkte)
        }
        const liste = Object.values(map).map(m => ({
          name: m.name,
          mannschaft: m.mannschaft,
          schnitt: (m.punkte.reduce((a, b) => a + b, 0) / m.punkte.length).toFixed(1),
          beste: m.beste,
          runden: m.punkte.length,
          wettkampfGesamt: m.wettkampf.length > 0 ? m.wettkampf.reduce((a, b) => a + b, 0) : null,
        })).sort((a, b) => parseFloat(b.schnitt) - parseFloat(a.schnitt))
        setRangliste(liste)
      }

      // Letzte Ergebnisse nach Tag gruppiert
      const { data: letzteErg } = await supabase
        .from('ergebnisse')
        .select('datum, art, ort, runde, gesamt_punkte, gesamt_fehler, mitglied_id, mitglieder(name, mannschaft)')
        .gte('datum', saison.start)
        .lte('datum', saison.end)
        .order('datum', { ascending: false })
        .order('erstellt_am', { ascending: false })
        .limit(80)

      if (letzteErg) {
        const tageMap = {}
        for (const e of letzteErg) {
          const key = `${e.datum}_${e.art}_${e.ort}`
          if (!tageMap[key]) tageMap[key] = { datum: e.datum, art: e.art, ort: e.ort, spieler: {} }
          const sid = e.mitglied_id
          if (!tageMap[key].spieler[sid]) tageMap[key].spieler[sid] = {
            name: e.mitglieder?.name,
            mannschaft: e.mitglieder?.mannschaft,
            runden: []
          }
          tageMap[key].spieler[sid].runden.push(e.gesamt_punkte)
        }
        const tageArr = Object.values(tageMap).slice(0, 10).map(t => ({
          ...t,
          spieler: Object.values(t.spieler).map(s => ({
            ...s,
            schnitt: (s.runden.reduce((a, b) => a + b, 0) / s.runden.length).toFixed(1),
            gesamt: s.runden.reduce((a, b) => a + b, 0),
          })).sort((a, b) => parseFloat(b.schnitt) - parseFloat(a.schnitt))
        }))
        setTage(tageArr)
      }

      // Nächste Termine
      const heute = new Date().toISOString().slice(0, 10)
      const { data: term } = await supabase
        .from('termine')
        .select('*')
        .gte('datum', heute)
        .order('datum', { ascending: true })
        .limit(5)
      setNaechsteTermine(term || [])

      setLaden(false)

      // Liga-Plätze laden
      const plätze = await Promise.all(LIGEN.map(async (l) => {
        const data = await callSportwinner('GetTabelle', { id_liga: l.id_liga, nr_spieltag: 100, sort: 0 })
        if (!Array.isArray(data)) return { label: l.label, platz: null, von: null }
        const tsvZeile = data.find(t => istTSV(t[2]))
        const z = tsvZeile ? parseTabelleZeile(tsvZeile) : null
        return { label: l.label, platz: z?.platz || null, von: data.length, mp: z?.mp || null }
      }))
      setLigaPlätze(plätze)
    }
    load()
  }, [saisonIdx])

  function rangIcon(i) {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return i + 1
  }

  function artFarbe(art) {
    if (art === 'training')  return { bg: '#dce8ff', color: '#003D8F' }
    if (art === 'wettkampf') return { bg: '#fff3cd', color: '#7a5800' }
    return { bg: '#d4edda', color: '#155724' }
  }

  function formatDatum(d) {
    return new Date(d).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })
  }

  if (!saison) return <div className="empty">Noch keine Saison ab 2025/26 verfügbar.</div>
  if (laden) return <div className="loading">🎳 Lade Daten…</div>

  const ersterTermin = naechsteTermine[0]
  const weitereTermine = naechsteTermine.slice(1)

  return (
    <div>

      {/* Nächster Termin */}
      {ersterTermin && (
        <div className="card" style={{ borderLeft: '5px solid var(--gelb)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 6, letterSpacing: 1 }}>NÄCHSTER TERMIN</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blau)', marginBottom: 4 }}>{ersterTermin.titel}</div>
          <div style={{ fontSize: 14, color: 'var(--grau-text)', display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: weitereTermine.length > 0 ? 10 : 0 }}>
            <span>📅 {formatDatum(ersterTermin.datum)}</span>
            {ersterTermin.uhrzeit && <span>🕐 {ersterTermin.uhrzeit.slice(0, 5)} Uhr</span>}
            {ersterTermin.ort && <span>📍 {ersterTermin.ort}</span>}
          </div>
          {ersterTermin.beschreibung && (
            <div style={{ fontSize: 14, color: 'var(--grau-text)', marginBottom: 8 }}>{ersterTermin.beschreibung}</div>
          )}
          {weitereTermine.length > 0 && (
            <>
              <button onClick={() => setTermineAufgeklappt(o => !o)}
                style={{ background: 'none', border: 'none', color: 'var(--blau)', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                {termineAufgeklappt ? '▲ Weniger' : `▼ ${weitereTermine.length} weitere Termine`}
              </button>
              {termineAufgeklappt && (
                <div style={{ marginTop: 10 }}>
                  {weitereTermine.map((t, i) => (
                    <div key={i} style={{ padding: '8px 0', borderTop: '1px solid var(--grau-mid)' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blau)' }}>{t.titel}</div>
                      <div style={{ fontSize: 13, color: 'var(--grau-text)', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                        <span>📅 {formatDatum(t.datum)}</span>
                        {t.uhrzeit && <span>🕐 {t.uhrzeit.slice(0, 5)} Uhr</span>}
                        {t.ort && <span>📍 {t.ort}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* CTA */}
      <button className="btn btn-gelb btn-voll"
        style={{ fontSize: 20, padding: '18px', marginBottom: 16, borderRadius: 12 }}
        onClick={() => nav('eintragen')}>
        🎳 Ergebnis eintragen
      </button>

      {/* Liga Miniübersicht */}
      {ligaPlätze.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16, cursor: 'pointer' }}
          onClick={() => nav('liga')}>
          {ligaPlätze.map((l, i) => (
            <div key={i} style={{
              background: 'var(--weiss)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              padding: '14px 10px',
              textAlign: 'center',
              borderTop: `4px solid ${l.platz === 1 ? '#F5C400' : l.platz <= 3 ? '#1a7a3e' : 'var(--blau)'}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--grau-text)', marginBottom: 4 }}>
                {l.label.split('–')[0].trim()}
              </div>
              {l.platz ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blau)', lineHeight: 1 }}>
                    {l.platz === 1 ? '🥇' : l.platz === 2 ? '🥈' : l.platz === 3 ? '🥉' : `${l.platz}.`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--grau-text)', marginTop: 2 }}>
                    von {l.von} · {l.mp} MP
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--grau-text)' }}>–</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="start-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Rangliste */}
        <div className="card">
          <div className="card-title">🏆 Rangliste</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {saisonListe.map((s, i) => (
              <button key={i} onClick={() => setSaisonIdx(i)}
                style={{ padding: '4px 10px', fontSize: 13, fontWeight: 700, borderRadius: 6,
                  border: `2px solid ${i === saisonIdx ? 'var(--blau)' : 'var(--grau-mid)'}`,
                  background: i === saisonIdx ? 'var(--blau)' : 'var(--weiss)',
                  color: i === saisonIdx ? 'var(--weiss)' : 'var(--grau-text)', cursor: 'pointer' }}>
                {s.label}
              </button>
            ))}
          </div>

          {rangliste.length === 0 ? (
            <div className="empty">Keine Ergebnisse.</div>
          ) : (
            rangliste.map((m, i) => (
              <div key={i} className="rang-karte">
                <div className="rang-nr">{rangIcon(i)}</div>
                <div style={{ flex: 1 }}>
                  <div className="rang-name">{m.name}</div>
                  <div className="rang-sub">
                    {m.runden} Runden
                    {m.mannschaft && <span style={{ marginLeft: 6, color: 'var(--blau)', fontWeight: 700 }}>· {mannschaftLabel(m.mannschaft)}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="rang-punkte">{m.schnitt}</div>
                  <div className="rang-sub">Ø</div>
                </div>
                {m.wettkampfGesamt !== null && (
                  <div style={{ textAlign: 'right', marginLeft: 6, background: '#fff3cd', borderRadius: 8, padding: '4px 8px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#7a5800' }}>{m.wettkampfGesamt}</div>
                    <div style={{ fontSize: 11, color: '#7a5800' }}>WK</div>
                  </div>
                )}
              </div>
            ))
          )}
          <button className="btn btn-outline btn-voll" style={{ marginTop: 14 }}
            onClick={() => nav('statistiken')}>
            Alle Statistiken →
          </button>
        </div>

        {/* Letzte Ergebnisse */}
        <div className="card">
          <div className="card-title">📋 Letzte Ergebnisse</div>
          {tage.length === 0 ? (
            <div className="empty">Noch keine Ergebnisse.</div>
          ) : (
            tage.map((t, ti) => {
              const farbe = artFarbe(t.art)
              const offen = !!aufgeklappt[ti]
              const avgSchnitt = t.spieler.length
                ? (t.spieler.reduce((s, p) => s + parseFloat(p.schnitt), 0) / t.spieler.length).toFixed(1)
                : '–'
              return (
                <div key={ti} style={{ borderBottom: '1px solid var(--grau-mid)', paddingBottom: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--blau)' }}>
                        {new Date(t.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                      <span className="badge" style={{ background: farbe.bg, color: farbe.color, marginLeft: 8, fontSize: 11 }}>
                        {t.art === 'wettkampf' ? 'Wettkampf' : 'Training'}
                      </span>
                      <span style={{ fontSize: 12, marginLeft: 6 }}>{t.ort === 'heim' ? '🏠' : '✈️'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--blau)' }}>{avgSchnitt} Ø</div>
                      <div style={{ fontSize: 11, color: 'var(--grau-text)' }}>{t.spieler.length} Spieler</div>
                    </div>
                  </div>
                  <button onClick={() => setAufgeklappt(p => ({ ...p, [ti]: !p[ti] }))}
                    style={{ background: 'none', border: 'none', color: 'var(--blau)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    {offen ? '▲ Einklappen' : '▼ Details'}
                  </button>
                  {offen && (
                    <div style={{ marginTop: 8 }}>
                      {t.spieler.map((s, si) => (
                        <div key={si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid #f0f0f0' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                            {s.mannschaft && <span style={{ fontSize: 11, color: 'var(--grau-text)', marginLeft: 6 }}>{mannschaftLabel(s.mannschaft)}</span>}
                            <div style={{ fontSize: 12, color: 'var(--grau-text)' }}>{s.runden.length} Runde{s.runden.length !== 1 ? 'n' : ''}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--blau)', fontSize: 16 }}>{s.schnitt} Ø</div>
                            <div style={{ fontSize: 12, color: 'var(--grau-text)' }}>Gesamt: {s.gesamt}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
