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

// Hilfsfunktion: deutsches Datum "22.04.2026" → ISO "2026-04-22"
export function deToIso(d) {
  if (!d) return ''
  if (d.includes('-')) return d // schon ISO
  const [tag, monat, jahr] = d.split('.')
  if (!tag || !monat || !jahr) return d
  return `${jahr}-${monat.padStart(2,'0')}-${tag.padStart(2,'0')}`
}

// Spieltag-String kürzen: "Spieltag Männer / Kreisliga 2 / 18. Spieltag" → "18. Spieltag"
function kuerzeSpieltag(s) {
  if (!s) return ''
  const match = s.match(/(\d+\.\s*Spieltag)/i)
  return match ? match[1] : s
}

// Spiele: [id, datum, uhrzeit, heim, heim_mp, gast_mp, gast, sp_heim, sp_gast, status, notiz, spieltag]
export function parseSpieleZeile(s) {
  return {
    id:       s[0],
    datum:    deToIso(s[1]),
    uhrzeit:  s[2],
    heim:     s[3],
    heimMp:   s[4],
    gastMp:   s[5],
    gast:     s[6],
    spHeim:   s[7],
    spGast:   s[8],
    status:   s[9],
    notiz:    s[10],
    spieltag: kuerzeSpieltag(s[11]),
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

  // Alle Spiele – nur TSV-Spiele, nach Datum sortiert
  const spieleGesamt = spiele.map(parseSpieleZeile).filter(s => istTSV(s.heim) || istTSV(s.gast))
  const gespielt      = spieleGesamt.filter(s => !istOffen(s)).sort((a,b) => new Date(b.datum) - new Date(a.datum))
  const ausstehend    = spieleGesamt.filter(s =>  istOffen(s)).sort((a,b) => new Date(a.datum) - new Date(b.datum))

  // Spieltag-Gruppen für gespielte Spiele
  function gruppiereNachSpieltag(spiele) {
    const map = {}
    for (const s of spiele) {
      const key = s.spieltag || s.datum
      if (!map[key]) map[key] = { spieltag: s.spieltag, datum: s.datum, spiele: [] }
      map[key].spiele.push(s)
    }
    return Object.values(map).sort((a,b) => new Date(b.datum) - new Date(a.datum))
  }

  const gespieltGruppiert = gruppiereNachSpieltag(gespielt)

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
          {/* Kommende Spiele */}
          {ausstehend.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ fontSize: 16 }}>📅 Kommende Spiele</div>
              {ausstehend.map((s, i) => <SpielZeile key={i} s={s} formatDatum={formatDatum} />)}
            </div>
          )}

          {/* Ergebnisse nach Spieltag gruppiert */}
          {gespieltGruppiert.map((gruppe, gi) => (
            <div key={gi} className="card" style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 14, fontWeight: 700, color: 'var(--blau)',
                marginBottom: 12, paddingBottom: 8,
                borderBottom: '2px solid var(--gelb)',
              }}>
                {gruppe.spieltag || formatDatum(gruppe.datum)}
                {gruppe.datum && gruppe.spieltag && (
                  <span style={{ fontWeight: 400, color: 'var(--grau-text)', marginLeft: 8, fontSize: 13 }}>
                    · {formatDatum(gruppe.datum)}
                  </span>
                )}
              </div>
              {gruppe.spiele.map((s, i) => <SpielZeile key={i} s={s} formatDatum={formatDatum} />)}
            </div>
          ))}

          {spieleGesamt.length === 0 && <div className="empty">Keine Spiele verfügbar.</div>}
          <div style={{ fontSize: 12, color: 'var(--grau-text)', textAlign: 'right', marginTop: 8 }}>
            Daten: bskv.sportwinner.de
          </div>
        </div>
      )}
    </div>
  )
}


function istOffen(s) {
  return s.status === 'offen' || s.status === '0' || s.status === '' || !s.status
}

function SpielZeile({ s, formatDatum }) {
  const [offen, setOffen]       = useState(false)
  const [details, setDetails]   = useState(null)
  const [ladenDet, setLadenDet] = useState(false)

  const tsvHeim   = istTSV(s.heim)
  const tsvGast   = istTSV(s.gast)
  const beteiligt = tsvHeim || tsvGast
  const gespielt  = !istOffen(s)

  async function toggleDetails() {
    if (offen) { setOffen(false); return }
    setOffen(true)
    if (details || !gespielt) return
    setLadenDet(true)
    const data = await callSportwinner('GetSpielerInfo', { id_spiel: s.id })
    setDetails(Array.isArray(data) ? data : null)
    setLadenDet(false)
  }

  const spieler = details ? details.slice(0, -1) : []
  const summe   = details ? details[details.length - 1] : null

  return (
    <div style={{ borderBottom: '1px solid var(--grau-mid)', background: beteiligt ? '#fffbf0' : 'transparent' }}>
      <div onClick={gespielt ? toggleDetails : undefined}
        style={{ padding: '12px 0', cursor: gespielt ? 'pointer' : 'default' }}>

        {/* Meta-Zeile */}
        <div style={{ fontSize: 12, color: 'var(--grau-text)', marginBottom: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span>{formatDatum(s.datum)}</span>
          {s.uhrzeit && s.uhrzeit !== '00:00' && <span>{s.uhrzeit} Uhr</span>}
          {s.spieltag && <span>· {s.spieltag}</span>}
          {beteiligt && <span style={{ background: 'var(--gelb)', color: 'var(--blau)', fontWeight: 700, borderRadius: 6, padding: '1px 7px', fontSize: 11 }}>TSV</span>}
          {gespielt && <span style={{ marginLeft: 'auto', color: 'var(--blau)', fontSize: 13 }}>{offen ? '▲' : '▼'}</span>}
        </div>

        {/* Spielpaarung */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
          <div style={{ fontWeight: tsvHeim ? 700 : 500, fontSize: 14, color: tsvHeim ? 'var(--blau)' : 'var(--text)' }}>
            {s.heim || '–'}
          </div>

          {gespielt ? (
            <div style={{ textAlign: 'center', minWidth: 90 }}>
              <div style={{ background: 'var(--blau)', color: 'white', borderRadius: 8, padding: '4px 10px', fontWeight: 700, fontSize: 16 }}>
                {s.heimMp} : {s.gastMp}
              </div>
              <div style={{ fontSize: 11, color: 'var(--grau-text)', marginTop: 2 }}>Mannschaftspunkte</div>
              {(s.spHeim || s.spGast) && (
                <div style={{ fontSize: 11, color: 'var(--grau-text)' }}>SP: {s.spHeim} : {s.spGast}</div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ background: 'var(--grau-mid)', color: 'var(--grau-text)', borderRadius: 8, padding: '4px 10px', fontWeight: 700, fontSize: 14 }}>
                {s.uhrzeit && s.uhrzeit !== '00:00' ? s.uhrzeit : 'vs.'}
              </div>
            </div>
          )}

          <div style={{ fontWeight: tsvGast ? 700 : 500, fontSize: 14, textAlign: 'right', color: tsvGast ? 'var(--blau)' : 'var(--text)' }}>
            {s.gast || '–'}
          </div>
        </div>

        {s.notiz && (
          <div style={{ fontSize: 11, color: 'var(--grau-text)', marginTop: 4, fontStyle: 'italic' }}>{s.notiz}</div>
        )}
      </div>

      {offen && gespielt && (
        <div className="spiel-detail-wrap" style={{ paddingBottom: 12 }}>
          {ladenDet ? (
            <div style={{ fontSize: 13, color: 'var(--grau-text)', padding: '8px 0' }}>Lade Spielerdetails…</div>
          ) : details ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}>
              <thead>
                <tr style={{ background: 'var(--blau)', color: 'white' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>{s.heim}</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>1</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>2</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>3</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>4</th>
                  <th style={{ padding: '6px 6px', textAlign: 'right', borderRight: '2px solid rgba(255,255,255,0.3)' }}>Kegel</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>SP</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center', borderRight: '2px solid rgba(255,255,255,0.3)' }}>MP</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>MP</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>SP</th>
                  <th style={{ padding: '6px 6px', textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.3)' }}>Kegel</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>4</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>3</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>2</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>1</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>{s.gast}</th>
                </tr>
              </thead>
              <tbody>
                {spieler.map((z, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'var(--grau-hell)' : 'white' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: tsvHeim ? 'var(--blau)' : 'inherit' }}>{z[0]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[1]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[2]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[3]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[4]}</td>
                    <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, borderRight: '2px solid var(--grau-mid)' }}>{z[5]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>{z[6]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, borderRight: '2px solid var(--grau-mid)' }}>{z[7]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700 }}>{z[8]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>{z[9]}</td>
                    <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, borderLeft: '2px solid var(--grau-mid)' }}>{z[10]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[11]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[12]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[13]}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{z[14]}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: tsvGast ? 'var(--blau)' : 'inherit' }}>{z[15]}</td>
                  </tr>
                ))}
                {summe && (
                  <tr style={{ background: 'var(--blau)', color: 'white', fontWeight: 700 }}>
                    <td style={{ padding: '6px 8px' }}>Gesamt</td>
                    <td colSpan={4}></td>
                    <td style={{ padding: '6px 6px', textAlign: 'right', borderRight: '2px solid rgba(255,255,255,0.3)' }}>{summe[5]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{summe[6]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '2px solid rgba(255,255,255,0.3)' }}>{summe[7]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{summe[8]}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{summe[9]}</td>
                    <td style={{ padding: '6px 6px', textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.3)' }}>{summe[10]}</td>
                    <td colSpan={5}></td>
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
