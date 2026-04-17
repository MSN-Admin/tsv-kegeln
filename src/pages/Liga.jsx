import { useEffect, useState } from 'react'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sportwinner`

const LIGEN = [
  { label: 'G1 – Kreisliga 1', id_liga: 4095 },
  { label: 'G2 – Kreisliga 2', id_liga: 4098 },
  { label: 'G3 – Kreisliga 3', id_liga: 4099 },
]

const TSV_NAMEN = ['TSV Upf', 'Germering', 'TSV UG']

function istTSV(name) {
  if (!name) return false
  return TSV_NAMEN.some(n => name.toLowerCase().includes(n.toLowerCase()))
}

async function callSportwinner(command, params = {}) {
  const body = { command, id_saison: '11', ...Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)])) }
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  // Edge function gibt { status, body } zurück
  if (json.body) {
    try { return JSON.parse(json.body) } catch { return null }
  }
  return json
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
      setFehler('Daten konnten nicht geladen werden: ' + e.message)
    }
    setLaden(false)
  }

  // Tabelle: [id, pl, name, kurz, sp, sp_h, sp_a, sp_pkt, sp_pkt_h, sp_pkt_a, satz_gegen, ...]
  // Index:    0   1   2     3     4   5      6     7        8          9          10
  // MP = index 13, SP_plus = 7, SP_minus = 10

  // Spiele: schauen wir uns an sobald Daten da

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
                    const name = t[2] || '–'
                    const tsv = istTSV(name)
                    const pl = t[1]
                    const sp = t[4]
                    const spPlus = t[7]
                    const spMinus = t[10]
                    const mp = t[13]
                    return (
                      <tr key={i} style={{ background: tsv ? '#fff3cd' : '', fontWeight: tsv ? 700 : 400 }}>
                        <td className="rang">{pl}</td>
                        <td style={{ color: tsv ? '#7a5800' : 'inherit' }}>
                          {tsv && '⭐ '}{name}
                        </td>
                        <td className="zahl">{sp}</td>
                        <td className="zahl">{spPlus} : {spMinus}</td>
                        <td className="zahl" style={{ fontWeight: 700, color: 'var(--blau)' }}>{mp}</td>
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
        <div className="card">
          <div className="card-title">{liga.label} – Spiele</div>
          {spiele.length === 0 ? (
            <div className="empty">Keine Spiele verfügbar.</div>
          ) : (
            <div>
              {spiele.map((s, i) => {
                // Spiele-Array Struktur ermitteln
                const isArr = Array.isArray(s)
                const heim = isArr ? (s[3] || s[2] || '') : (s.klub1 || s.heim || '')
                const gast = isArr ? (s[5] || s[4] || '') : (s.klub2 || s.gast || '')
                const datum = isArr ? s[1] : s.datum
                const ergebnis = isArr ? s[7] : s.ergebnis
                const tsvHeim = istTSV(heim)
                const tsvGast = istTSV(gast)
                const beteiligt = tsvHeim || tsvGast
                const gespielt = ergebnis && ergebnis !== '' && ergebnis !== '0:0'

                function formatDatum(d) {
                  if (!d) return ''
                  const date = new Date(d)
                  if (isNaN(date)) return d
                  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                }

                return (
                  <div key={i} style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--grau-mid)',
                    background: beteiligt ? '#fffbf0' : 'transparent',
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--grau-text)', marginBottom: 4 }}>
                      {formatDatum(datum)}
                      {beteiligt && <span style={{ color: '#7a5800', fontWeight: 700, marginLeft: 8 }}>⭐ TSV</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, fontWeight: tsvHeim ? 700 : 600, fontSize: 14, color: tsvHeim ? 'var(--blau)' : 'var(--text)' }}>
                        {heim || '–'}
                      </div>
                      <div style={{
                        minWidth: 70, textAlign: 'center',
                        background: gespielt ? 'var(--blau)' : 'var(--grau-mid)',
                        color: gespielt ? 'white' : 'var(--grau-text)',
                        borderRadius: 8, padding: '4px 8px',
                        fontWeight: 700, fontSize: 15,
                      }}>
                        {gespielt ? ergebnis : '–:–'}
                      </div>
                      <div style={{ flex: 1, fontWeight: tsvGast ? 700 : 600, fontSize: 14, textAlign: 'right', color: tsvGast ? 'var(--blau)' : 'var(--text)' }}>
                        {gast || '–'}
                      </div>
                    </div>
                    {/* Debug: erste Zeile anzeigen um Struktur zu sehen */}
                    {i === 0 && <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{JSON.stringify(s).slice(0, 150)}</div>}
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--grau-text)', textAlign: 'right' }}>
            Daten: bskv.sportwinner.de
          </div>
        </div>
      )}
    </div>
  )
}
