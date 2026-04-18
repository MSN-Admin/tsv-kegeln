import { useEffect, useState } from 'react'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sportwinner`

export const LIGEN = [
  { label: 'G1 – Kreisliga 1', id_liga: 4095 },
  { label: 'G2 – Kreisliga 2', id_liga: 4098 },
  { label: 'G3 – Kreisliga 3', id_liga: 4099 },
]

const TSV_NAMEN = ['TSV Upf', 'Germering']

export function istTSV(name) {
  if (!name) return false
  return TSV_NAMEN.some(n => name.toLowerCase().includes(n.toLowerCase()))
}

export async function callSportwinner(command, params = {}) {
  const body = { command, id_saison: '11', ...Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)])) }
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return null }
}

// Tabelle: [id, platz, name, kurz, sp, sp_h, sp_a, sp_plus, sp_plus_h, sp_plus_a, sp_minus, sp_minus_h, sp_minus_a, mp, mp_h, mp_a, ...]
export function parseTabelleZeile(t) {
  return {
    id:       t[0],
    platz:    t[1],
    name:     t[2],
    sp:       t[4],
    spPlus:   t[7],
    spMinus:  t[10],
    mp:       t[13],
  }
}

// Spiele: [id, datum, uhrzeit, heim, ?, gast, ?, ergebnis_mp, ergebnis_sp, status, liga_name, spieltag]
export function parseSpieleZeile(s) {
  return {
    id:       s[0],
    datum:    s[1],
    uhrzeit:  s[2],
    heim:     s[3],
    gast:     s[5],
    mp:       s[7],
    sp:       s[8],
    status:   s[9],
    liga:     s[10],
    spieltag: s[11],
  }
}

export default function Liga() {
  const [ligaIdx, setLigaIdx]   = useState(0)
  const [tabelle, setTabelle]   = useState([])
  const [spiele, setSpiele]     = useState([])
  const [ansicht, setAnsicht]   = useState('tabelle')
  const [laden, setLaden]       = useState(false)
  const [fehler, setFehler]     = useState(null)

  const liga = LIGEN[ligaIdx]

  useEffect(() => { ladeDaten() }, [ligaIdx])

  async function ladeDaten() {
    setLaden(true)
    setFehler(null)
    setTabelle([])
    setSpiele([])
    try {
      const [tabData, spielData] = await Promise.all([
        callSportwinner('GetTabelle', { id_liga: liga.id_liga, nr_spieltag: 100, sort: 0 }),
        callSportwinner('GetSpiel', {
          id_liga: liga.id_liga, id_klub: 0, id_bezirk: 5,
          id_kreis: 35, id_spieltag: 0, art_bezirk: 2,
          art_kreis: 1, art_liga: 0, art_spieltag: 0
        }),
      ])
      setTabelle(Array.isArray(tabData) ? tabData : [])
      setSpiele(Array.isArray(spielData) ? spielData : [])
    } catch (e) {
      setFehler('Daten konnten nicht geladen werden.')
    }
    setLaden(false)
  }

  function formatDatum(d) {
    if (!d) return ''
    const date = new Date(d)
    if (isNaN(date)) return d
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  // Spiele nach Spieltag/Datum gruppieren und sortieren (neueste zuerst)
  const spieleGesamt = spiele.map(parseSpieleZeile)
  const gespielt = spieleGesamt.filter(s => s.status !== 'offen').sort((a,b) => new Date(b.datum) - new Date(a.datum))
  const ausstehend = spieleGesamt.filter(s => s.status === 'offen').sort((a,b) => new Date(a.datum) - new Date(b.datum))

  return (
    <div>
      {/* Liga Auswahl */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {LIGEN.map((l, i) => (
          <button key={i}
            className={ligaIdx === i ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ fontSize: 13, padding: '12px 6px', fontWeight: 700 }}
            onClick={() => setLigaIdx(i)}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Ansicht */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <button className={ansicht === 'tabelle' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ fontSize: 15, padding: '12px' }} onClick={() => setAnsicht('tabelle')}>
          🏆 Tabelle
        </button>
        <button className={ansicht === 'spiele' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ fontSize: 15, padding: '12px' }} onClick={() => setAnsicht('spiele')}>
          📋 Spiele
        </button>
      </div>

      {laden && <div className="loading">Lade Sportwinner-Daten…</div>}
      {fehler && <div className="card" style={{ color: '#c0392b', fontWeight: 700 }}>⚠️ {fehler}</div>}

      {/* TABELLE */}
      {!laden && !fehler && ansicht === 'tabelle' && (
        <div className="card">
          <div className="card-title">{liga.label} – Tabelle</div>
          {tabelle.length === 0 ? (
            <div className="empty">Keine Daten verfügbar.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>Pl.</th>
                    <th>Mannschaft</th>
                    <th className="zahl">Sp.</th>
                    <th className="zahl">SP</th>
                    <th className="zahl">MP</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelle.map((t, i) => {
                    const z = parseTabelleZeile(t)
                    const tsv = istTSV(z.name)
                    return (
                      <tr key={i} style={{ background: tsv ? '#fff3cd' : '', fontWeight: tsv ? 700 : 400 }}>
                        <td className="rang">{z.platz}</td>
                        <td style={{ color: tsv ? '#7a5800' : 'inherit' }}>
                          {tsv && '⭐ '}{z.name}
                        </td>
                        <td className="zahl">{z.sp}</td>
                        <td className="zahl">{z.spPlus} : {z.spMinus}</td>
                        <td className="zahl" style={{ fontWeight: 700, color: 'var(--blau)' }}>{z.mp}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--grau-text)', textAlign: 'right' }}>
            Daten: bskv.sportwinner.de · SP = Satzpunkte · MP = Mannschaftspunkte
          </div>
        </div>
      )}

      {/* SPIELE */}
      {!laden && !fehler && ansicht === 'spiele' && (
        <div>
          {/* Ausstehende Spiele */}
          {ausstehend.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ fontSize: 16 }}>📅 Kommende Spiele</div>
              {ausstehend.map((s, i) => <SpielZeile key={i} s={s} formatDatum={formatDatum} />)}
            </div>
          )}

          {/* Gespielte Spiele */}
          {gespielt.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ fontSize: 16 }}>✅ Ergebnisse</div>
              {gespielt.map((s, i) => <SpielZeile key={i} s={s} formatDatum={formatDatum} />)}
            </div>
          )}

          {spieleGesamt.length === 0 && <div className="empty">Keine Spiele verfügbar.</div>}

          <div style={{ fontSize: 12, color: 'var(--grau-text)', textAlign: 'right', marginTop: 8 }}>
            Daten: bskv.sportwinner.de
          </div>
        </div>
      )}
    </div>
  )
}

function SpielZeile({ s, formatDatum }) {
  const [offen, setOffen]       = useState(false)
  const [details, setDetails]   = useState(null)
  const [ladenDet, setLadenDet] = useState(false)

  const tsvHeim  = istTSV(s.heim)
  const tsvGast  = istTSV(s.gast)
  const beteiligt = tsvHeim || tsvGast
  const gespielt  = s.status !== 'offen'

  async function toggleDetails() {
    if (offen) { setOffen(false); return }
    setOffen(true)
    if (details || !gespielt) return
    setLadenDet(true)
    const data = await callSportwinner('GetSpielerInfo', { id_spiel: s.id })
    setDetails(Array.isArray(data) ? data : null)
    setLadenDet(false)
  }

  // Datenstruktur: [Name, R1, R2, R3, R4, Kegel_h, SP_h, MP_h, MP_g, SP_g, Kegel_g, R4_g, R3_g, R2_g, R1_g, Name_g]
  // Letzte Zeile = Summe
  const spieler = details ? details.slice(0, -1) : []
  const summe   = details ? details[details.length - 1] : null

  return (
    <div style={{ borderBottom: '1px solid var(--grau-mid)', background: beteiligt ? '#fffbf0' : 'transparent' }}>
      {/* Kopfzeile */}
      <div
        onClick={gespielt ? toggleDetails : undefined}
        style={{ padding: '12px 0', cursor: gespielt ? 'pointer' : 'default' }}
      >
        <div style={{ fontSize: 12, color: 'var(--grau-text)', marginBottom: 4, display: 'flex', gap: 8 }}>
          <span>{formatDatum(s.datum)}</span>
          {s.uhrzeit && s.uhrzeit !== '00:00' && <span>{s.uhrzeit} Uhr</span>}
          {s.spieltag && <span>· Spieltag {s.spieltag}</span>}
          {beteiligt && <span style={{ color: '#7a5800', fontWeight: 700 }}>⭐ TSV</span>}
          {gespielt && <span style={{ marginLeft: 'auto', color: 'var(--blau)', fontSize: 12 }}>{offen ? '▲' : '▼'}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontWeight: tsvHeim ? 700 : 600, fontSize: 14, color: tsvHeim ? 'var(--blau)' : 'var(--text)' }}>
            {s.heim || '–'}
          </div>
          <div style={{
            minWidth: 80, textAlign: 'center',
            background: gespielt ? 'var(--blau)' : 'var(--grau-mid)',
            color: gespielt ? 'white' : 'var(--grau-text)',
            borderRadius: 8, padding: '5px 10px',
            fontWeight: 700, fontSize: gespielt ? 15 : 13,
          }}>
            {gespielt ? (s.mp || '–') : (s.uhrzeit && s.uhrzeit !== '00:00' ? s.uhrzeit : '–:–')}
          </div>
          <div style={{ flex: 1, fontWeight: tsvGast ? 700 : 600, fontSize: 14, textAlign: 'right', color: tsvGast ? 'var(--blau)' : 'var(--text)' }}>
            {s.gast || '–'}
          </div>
        </div>
        {gespielt && s.sp && (
          <div style={{ fontSize: 12, color: 'var(--grau-text)', textAlign: 'center', marginTop: 3 }}>
            SP: {s.sp}
          </div>
        )}
      </div>

      {/* Detail-Tabelle */}
      {offen && gespielt && (
        <div className="spiel-detail-wrap">
          {ladenDet ? (
            <div style={{ fontSize: 14, color: 'var(--grau-text)', padding: '8px 0' }}>Lade Details…</div>
          ) : details ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'var(--blau)', color: 'white' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>{s.heim}</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>1</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>2</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>3</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>4</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '2px solid rgba(255,255,255,0.3)' }}>Kegel</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>SP</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center', borderRight: '2px solid rgba(255,255,255,0.3)' }}>MP</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>MP</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>SP</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.3)' }}>Kegel</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>4</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>3</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>2</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>1</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{s.gast}</th>
                </tr>
              </thead>
              <tbody>
                {spieler.map((z, i) => {
                  const tsvSpieler = istTSV(s.heim)
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'var(--grau-hell)' : 'white' }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600, color: tsvSpieler ? 'var(--blau)' : 'inherit' }}>{z[0]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[1]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[2]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[3]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[4]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, borderRight: '2px solid var(--grau-mid)' }}>{z[5]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'center' }}>{z[6]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, borderRight: '2px solid var(--grau-mid)' }}>{z[7]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700 }}>{z[8]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'center' }}>{z[9]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, borderLeft: '2px solid var(--grau-mid)' }}>{z[10]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[11]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[12]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[13]}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[14]}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{z[15]}</td>
                    </tr>
                  )
                })}
                {/* Summenzeile */}
                {summe && (
                  <tr style={{ background: 'var(--blau)', color: 'white', fontWeight: 700 }}>
                    <td style={{ padding: '6px 8px' }}>Gesamt</td>
                    <td colSpan={4}></td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '2px solid rgba(255,255,255,0.3)' }}>{summe[5]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{summe[6]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '2px solid rgba(255,255,255,0.3)' }}>{summe[7]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{summe[8]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{summe[9]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.3)' }}>{summe[10]}</td>
                    <td colSpan={4}></td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}></td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--grau-text)', padding: '8px 0' }}>Keine Details verfügbar.</div>
          )}
        </div>
      )}
    </div>
  )
}
