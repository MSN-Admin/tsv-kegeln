import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function SpezialTraining() {
  const [trainings, setTrainings]   = useState([])
  const [paarungen, setPaarungen]   = useState([])
  const [mitglieder, setMitglieder] = useState([])
  const [aktivId, setAktivId]       = useState(null)
  const [laden, setLaden]           = useState(true)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('spezial_trainings').select('*').order('datum', { ascending: false })
      const { data: m } = await supabase.from('mitglieder').select('id, name').eq('aktiv', true).order('name')
      setMitglieder(m || [])
      setTrainings(t || [])
      if (t && t.length > 0) {
        setAktivId(t[0].id)
        ladePaarungen(t[0].id)
      } else {
        setLaden(false)
      }
    }
    load()
  }, [])

  async function ladePaarungen(tid) {
    setLaden(true)
    const { data } = await supabase
      .from('spezial_paarungen')
      .select('*, h1:heim1_id(id,name), h2:heim2_id(id,name), g1:gast1_id(id,name), g2:gast2_id(id,name)')
      .eq('training_id', tid)
      .order('uhrzeit', { ascending: true })
    setPaarungen(data || [])
    setLaden(false)
  }

  function waehleTraining(id) {
    setAktivId(id)
    ladePaarungen(id)
  }

  const aktivTraining = trainings.find(t => t.id === aktivId)

  function formatDatum(d) {
    if (!d) return ''
    const date = new Date(d)
    const wo = ['So.','Mo.','Di.','Mi.','Do.','Fr.','Sa.'][date.getDay()]
    return `${wo} ${date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
  }

  if (laden) return <div className="loading">🎯 Lade Spezial-Training…</div>

  if (trainings.length === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blau)', marginBottom: 8 }}>Noch kein Spezial-Training angelegt</div>
      <div style={{ color: 'var(--grau-text)' }}>Der Admin kann im Admin-Bereich ein neues Spezial-Training erstellen.</div>
    </div>
  )

  return (
    <div>
      {/* Training wählen */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {trainings.map(t => (
          <button key={t.id} onClick={() => waehleTraining(t.id)}
            style={{ padding: '6px 14px', fontSize: 14, fontWeight: 700, borderRadius: 8,
              border: `2px solid ${aktivId === t.id ? 'var(--blau)' : 'var(--grau-mid)'}`,
              background: aktivId === t.id ? 'var(--blau)' : 'var(--weiss)',
              color: aktivId === t.id ? 'var(--weiss)' : 'var(--grau-text)', cursor: 'pointer' }}>
            {t.bezeichnung}
          </button>
        ))}
      </div>

      {/* Training-Info */}
      {aktivTraining && (
        <div className="card" style={{ borderLeft: '5px solid var(--gelb)', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blau)', marginBottom: 4 }}>
            {aktivTraining.bezeichnung}
          </div>
          <div style={{ fontSize: 14, color: 'var(--grau-text)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>📅 {formatDatum(aktivTraining.datum)}</span>
            {aktivTraining.ort && <span>📍 {aktivTraining.ort}</span>}
          </div>
        </div>
      )}

      {/* Paarungen */}
      <div className="card">
        <div className="card-title">🎯 Spielplan</div>
        {paarungen.length === 0 ? (
          <div className="empty">Noch keine Paarungen eingetragen.</div>
        ) : (
          paarungen.map((p, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--grau-mid)', padding: '14px 0' }}>
              {/* Uhrzeit */}
              {p.uhrzeit && (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blau)', marginBottom: 6 }}>
                  🕐 {p.uhrzeit.slice(0,5)} Uhr
                  {p.ort && <span style={{ fontWeight: 400, color: 'var(--grau-text)', marginLeft: 8 }}>📍 {p.ort}</span>}
                </div>
              )}
              {/* 2 vs 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
                {/* Heim */}
                <div style={{ background: '#dce8ff', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blau)', marginBottom: 4 }}>🏠 HEIM</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.h1?.name || '–'}</div>
                  {p.h2 && <div style={{ fontWeight: 700, fontSize: 15 }}>{p.h2.name}</div>}
                </div>
                {/* VS */}
                <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, color: 'var(--grau-text)' }}>vs.</div>
                {/* Gast */}
                <div style={{ background: '#fff3cd', borderRadius: 10, padding: '10px 12px', textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7a5800', marginBottom: 4 }}>✈️ GAST</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.g1?.name || '–'}</div>
                  {p.g2 && <div style={{ fontWeight: 700, fontSize: 15 }}>{p.g2.name}</div>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
