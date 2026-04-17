import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sportwinner`
const ID_SAISON = 11

const LIGEN = [
  { label: 'G1 – Kreisliga 1', id_liga: 4095 },
  { label: 'G2 – Kreisliga 2', id_liga: 4098 },
  { label: 'G3 – Kreisliga 3', id_liga: 4099 },
]

const TSV_NAMEN = ['TSV Upf.-Germering', 'TSV Upf', 'Germering', 'TSV UG']

function istTSV(name) {
  if (!name) return false
  return TSV_NAMEN.some(n => name.toLowerCase().includes(n.toLowerCase()))
}

async function callSportwinner(command, params = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ command, id_saison: ID_SAISON, ...params }),
  })
  return res.json()
}

export default function Liga() {
  const [ligaIdx, setLigaIdx]     = useState(0)
  const [tabelle, setTabelle]     = useState([])
  const [spiele, setSpiele]       = useState([])
  const [ansicht, setAnsicht]     = useState('tabelle')
  const [laden, setLaden]         = useState(false)
  const [fehler, setFehler]       = useState(null)

  const liga = LIGEN[ligaIdx]

  useEffect(() => {
    ladeDaten()
  }, [ligaIdx])

  async function ladeDaten() {
    setLaden(true)
    setFehler(null)
    try {
      const [tabData, spielData] = await Promise.all([
        callSportwinner('GetTabelle', { id_liga: liga.id_liga, nr_spieltag: 100, sort: 0 }),
        callSportwinner('GetSpiel', {
          id_liga: liga.id_liga, id_klub: 0, id_bezirk: 5,
          id_kreis: 35, id_spieltag: 0, art_bezirk: 2,
          art_kreis: 1, art_liga: 0, art_spieltag: 0
        }),
      ])
      setTabelle(Array.isArray(tabData) ? tabData : tabData?.tabelle || [])
      setSpiele(Array.isArray(spielData) ? spielData : spielData?.spiele || [])
    } catch (e) {
      setFehler('Daten konnten nicht geladen werden.')
    }
    setLaden(false)
  }

  function formatDatum(d) {
    if (!d) return '–'
    const date = new Date(d)
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  function formatUhrzeit(d) {
    if (!d) return ''
    const date = new Date(d)
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
  }

  return (
    <div>
      {/* Liga Auswahl */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {LIGEN.map((l, i) => (
          <button key={i}
            className={ligaIdx === i ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ fontSize: 14, padding: '12px 8px', fontWeight: 700 }}
            onClick={() => setLigaIdx(i)}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Ansicht wählen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <button className={ansicht === 'tabelle' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ fontSize: 15, padding: '12px' }}
          onClick={() => setAnsicht('tabelle')}>
          🏆 Tabelle
        </button>
        <button className={ansicht === 'spiele' ? 'btn btn-primary' : 'btn btn-outline'}
          style={{ fontSize: 15, padding: '12px' }}
          onClick={() => setAnsicht('spiele')}>
          📋 Spiele
        </button>
      </div>

      {laden && <div className="loading">Lade Sportwinner-Daten…</div>}

      {fehler && (
        <div className="card" style={{ background: '#fde8e8', border: '2px solid #c0392b', color: '#c0392b', padding: 20, fontWeight: 700 }}>
          ⚠️ {fehler}
        </div>
      )}

      {/* TABELLE */}
      {!laden && !fehler && ansicht === 'tabelle' && (
        <div className="card">
          <div className="card-title">{liga.label} – Tabelle</div>
          {tabelle.length === 0 ? (
            <div className="empty">Keine Tabellendaten verfügbar.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>Pl.</th>
                    <th>Mannschaft</th>
                    <th className="zahl">Sp.</th>
                    <th className="zahl">MP</th>
                    <th className="zahl">SP</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelle.map((t, i) => {
                    const tsv = istTSV(t.name || t.klub || t.mannschaft)
                    return (
                      <tr key={i} style={{
                        background: tsv ? '#fff3cd' : '',
                        fontWeight: tsv ? 700 : 400,
                      }}>
                        <td className="rang" style={{ fontSize: 16 }}>
                          {t.pl || t.platz || i + 1}
                        </td>
                        <td>
                          <span style={{ color: tsv ? '#7a5800' : 'inherit' }}>
                            {tsv && '⭐ '}{t.name || t.klub || t.mannschaft || '–'}
                          </span>
                        </td>
                        <td className="zahl">{t.sp || t.spiele || '–'}</td>
                        <td className="zahl" style={{ fontWeight: 700, color: 'var(--blau)' }}>
                          {t.mp || t.mannschaftspunkte || '–'}
                        </td>
                        <td className="zahl">{t.sp_diff || t.satzdifferenz || `${t.sp_plus || ''}:${t.sp_minus || ''}` || '–'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--grau-text)', textAlign: 'right' }}>
            Daten: bskv.sportwinner.de
          </div>
        </div>
      )}

      {/* SPIELE */}
      {!laden && !fehler && ansicht === 'spiele' && (
        <div className="card">
          <div className="card-title">{liga.label} – Spielergebnisse</div>
          {spiele.length === 0 ? (
            <div className="empty">Keine Spiele verfügbar.</div>
          ) : (
            <div>
              {spiele.map((s, i) => {
                const heim    = s.klub1 || s.heim || s.heimmannschaft || ''
                const gast    = s.klub2 || s.gast || s.gastmannschaft || ''
                const tsvHeim = istTSV(heim)
                const tsvGast = istTSV(gast)
                const beteiligt = tsvHeim || tsvGast
                const gespielt = s.ergebnis || (s.sp1 !== undefined && s.sp2 !== undefined)

                return (
                  <div key={i} style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--grau-mid)',
                    background: beteiligt ? '#f0f8ff' : 'transparent',
                    marginLeft: beteiligt ? -20 : 0,
                    marginRight: beteiligt ? -20 : 0,
                    paddingLeft: beteiligt ? 20 : 0,
                    paddingRight: beteiligt ? 20 : 0,
                  }}>
                    {/* Datum + Spieltag */}
                    <div style={{ fontSize: 12, color: 'var(--grau-text)', marginBottom: 4 }}>
                      {s.datum ? formatDatum(s.datum) : ''}
                      {s.datum && s.uhrzeit ? ' · ' : ''}
                      {s.uhrzeit ? formatUhrzeit(s.datum + ' ' + s.uhrzeit) : ''}
                      {s.spieltag ? ` · Spieltag ${s.spieltag}` : ''}
                      {beteiligt && <span style={{ color: '#7a5800', fontWeight: 700, marginLeft: 8 }}>⭐ TSV</span>}
                    </div>

                    {/* Heimteam vs Gastteam */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, fontWeight: tsvHeim ? 700 : 600, fontSize: 15, color: tsvHeim ? 'var(--blau)' : 'var(--text)' }}>
                        {heim || '–'}
                      </div>

                      {/* Ergebnis */}
                      <div style={{
                        minWidth: 80, textAlign: 'center',
                        background: gespielt ? 'var(--blau)' : 'var(--grau-mid)',
                        color: gespielt ? 'white' : 'var(--grau-text)',
                        borderRadius: 8, padding: '4px 10px',
                        fontWeight: 700, fontSize: gespielt ? 16 : 13,
                      }}>
                        {gespielt
                          ? (s.ergebnis || `${s.sp1}:${s.sp2}`)
                          : (s.uhrzeit ? s.uhrzeit.slice(0, 5) : '–:–')
                        }
                      </div>

                      <div style={{ flex: 1, fontWeight: tsvGast ? 700 : 600, fontSize: 15, textAlign: 'right', color: tsvGast ? 'var(--blau)' : 'var(--text)' }}>
                        {gast || '–'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--grau-text)', textAlign: 'right' }}>
            Daten: bskv.sportwinner.de
          </div>
        </div>
      )}
    </div>
  )
}
