import { useState, useEffect } from 'react'
import { C, Card, Btn, Input, Select, Badge, Spinner } from './ui.jsx'
import { getSettings } from '../lib/supabase.js'
import { saveLog, loadDayLogs } from '../lib/supabase.js'
import { fmtDate } from '../lib/config.js'

function newEntry(taskTypes) {
  return { id: Date.now()+Math.random(), typeId: taskTypes[0]?.id, complexity:'standard', client:'', frameio:'', note:'', credits:0 }
}

function calcEntryCredits(entry, taskTypes, complexity) {
  const task = taskTypes.find(t => t.id === entry.typeId)
  const comp = complexity.find(c => c.id === entry.complexity)
  if (!task) return 0
  return Math.round((task.base * (comp?.multiplier || 1)) * 10) / 10
}

export default function LogMyDay({ member, today }) {
  const [settings, setSettings]   = useState(null)
  const [entries, setEntries]     = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const role = member.role

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s)
      const taskTypes = role === 'editor' ? s.taskTypes
        : role === 'production' ? (s.productionTasks || []) : (s.socialTasks || [])
      setEntries([newEntry(s.taskTypes)])
      loadDayLogs(today).then(logs => {
        const mine = logs.find(l => l.editor_name === member.name)
        if (mine?.entries?.length) { setEntries(mine.entries); setSubmitted(true) }
      })
    })
  }, [])

  if (!settings) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, color:C.text3, padding:'2rem 0' }}>
      <Spinner size={14} /> Loading…
    </div>
  )

  const { taskTypes, complexity, weeklyTargets } = settings
  const target = weeklyTargets[role] || 10
  const entriesWithCredits = entries.map(e => ({ ...e, credits: calcEntryCredits(e, taskTypes, complexity) }))
  const totalCredits = entriesWithCredits.reduce((s,e) => s + e.credits, 0)

  function upd(id, field, val) {
    setEntries(p => p.map(e => e.id === id ? { ...e, [field]: val } : e))
  }

  async function submit() {
    setError(''); setSaving(true)
    const { error: err } = await saveLog({
      memberName: member.name,
      memberRole: role,
      logDate: today,
      entries: entriesWithCredits.map(e => ({
        ...e,
        typeLabel: taskTypes.find(t=>t.id===e.typeId)?.label || e.typeId,
      })),
      totalCredits,
    })
    setSaving(false)
    if (err) { setError('Could not save. Try again.'); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ maxWidth:560, textAlign:'center', padding:'3rem 0' }} className="fade-in">
        <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
        <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:6 }}>Log submitted!</div>
        <div style={{ fontSize:13, color:C.text3, marginBottom:8 }}>{fmtDate(today)}</div>
        <div style={{ fontSize:36, fontWeight:800, color:C.red, marginBottom:4 }}>{totalCredits}</div>
        <div style={{ fontSize:13, color:C.text3, marginBottom:'2rem' }}>credits earned today</div>
        <Btn variant="ghost" onClick={() => setSubmitted(false)}>Edit submission</Btn>
      </div>
    )
  }

  return (
    <div style={{ maxWidth:680 }} className="fade-in">
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>Daily Log</div>
        <div style={{ fontSize:13, color:C.text3 }}>{fmtDate(today)}</div>
      </div>

      {entriesWithCredits.map((e,idx) => {
        const task = taskTypes.find(t => t.id === e.typeId)
        const comp = complexity.find(c => c.id === e.complexity)
        return (
          <Card key={e.id} style={{ marginBottom:10, borderColor: e.credits > 0 ? C.border2 : C.border }}>
            {/* Row 1: Task + Complexity */}
            <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
              <div style={{ flex:'1 1 200px' }}>
                <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Task Type</div>
                <Select value={e.typeId} onChange={ev => upd(e.id,'typeId',ev.target.value)}>
                  {taskTypes.map(t => <option key={t.id} value={t.id}>{t.label} ({t.base} cr)</option>)}
                </Select>
              </div>
              <div style={{ flex:'1 1 160px' }}>
                <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Complexity</div>
                <Select value={e.complexity} onChange={ev => upd(e.id,'complexity',ev.target.value)}>
                  {complexity.map(c => <option key={c.id} value={c.id}>{c.label} ×{c.multiplier}</option>)}
                </Select>
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', paddingBottom:2 }}>
                <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Credits</div>
                <div style={{ fontSize:22, fontWeight:800, color: e.credits > 0 ? C.red : C.text3, minWidth:48, textAlign:'center' }}>{e.credits}</div>
              </div>
            </div>

            {/* Row 2: Client + Frame.io */}
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Client</div>
                <Input placeholder="Client name" value={e.client} onChange={ev => upd(e.id,'client',ev.target.value)} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Frame.io link</div>
                <Input placeholder="https://app.frame.io/…" value={e.frameio} onChange={ev => upd(e.id,'frameio',ev.target.value)} />
              </div>
            </div>

            {/* Row 3: Notes */}
            <div style={{ marginBottom: entries.length > 1 ? 10 : 0 }}>
              <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>Notes</div>
              <textarea
                placeholder="Describe the complexity, tools used, why it took longer, anything relevant…"
                value={e.note}
                onChange={ev => upd(e.id,'note',ev.target.value)}
                rows={2}
                style={{ fontSize:13, padding:'9px 12px', borderRadius:8,
                  border:`1px solid ${C.border2}`, background:C.surface2,
                  color:C.text, outline:'none', width:'100%', resize:'vertical',
                  fontFamily:'inherit',
                }}
              />
            </div>

            {entries.length > 1 && (
              <button onClick={() => setEntries(p => p.filter(x => x.id !== e.id))}
                style={{ fontSize:11, padding:'3px 8px', borderRadius:6,
                  border:'1px solid rgba(255,69,58,.25)', background:'none',
                  color:C.danger, cursor:'pointer', fontFamily:'inherit' }}>
                Remove
              </button>
            )}
          </Card>
        )
      })}

      {/* Add task */}
      <button onClick={() => setEntries(p => [...p, newEntry(taskTypes)])}
        style={{ width:'100%', padding:'10px', fontSize:13, borderRadius:10,
          border:`1.5px dashed ${C.border2}`, background:'none',
          color:C.text3, cursor:'pointer', marginBottom:'1.25rem', fontFamily:'inherit' }}>
        + Add another task
      </button>

      {/* Summary bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 18px', borderRadius:12, marginBottom:'1rem',
        background: totalCredits > 0 ? `linear-gradient(135deg, ${C.redDim}, transparent)` : C.surface,
        border:`1px solid ${totalCredits > 0 ? C.redBorder : C.border}`,
      }}>
        <div>
          <div style={{ fontSize:12, color:C.text3, marginBottom:2 }}>Total credits today</div>
          <div style={{ fontSize:28, fontWeight:800, color:C.red }}>{totalCredits}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:12, color:C.text3, marginBottom:2 }}>Weekly target</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text2 }}>{target} cr</div>
        </div>
      </div>

      {error && <div style={{ fontSize:12, color:C.danger, marginBottom:10, padding:'8px 12px', background:'rgba(255,69,58,.08)', borderRadius:8 }}>{error}</div>}

      <Btn onClick={submit} disabled={saving} size="lg" style={{ width:'100%' }}>
        {saving ? <><Spinner size={14} /> Saving…</> : 'Submit end-of-day log →'}
      </Btn>
    </div>
  )
}
