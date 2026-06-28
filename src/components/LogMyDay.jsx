import { useState, useEffect } from 'react'
import { C, Card, Btn, Input, Select, Badge, Spinner, SectionHeader } from './ui.jsx'
import { getSettings, getTaskTypesForRole, saveLog } from '../lib/supabase.js'
import { fmtDate } from '../lib/config.js'

function calcCredits(typeId, complexity, taskTypes, complexityLevels) {
  const task = taskTypes.find(t => t.id === typeId)
  const comp = complexityLevels.find(c => c.id === complexity)
  if (!task) return 0
  return Math.round((task.base * (comp?.multiplier || 1)) * 10) / 10
}

function newEntry(taskTypes) {
  return { id: Date.now() + Math.random(), typeId: taskTypes[0]?.id, complexity: 'standard', client: '', frameio: '', note: '' }
}

export default function LogMyDay({ member, today, onSignOut }) {
  const [settings,  setSettings]  = useState(null)
  const [taskTypes, setTaskTypes] = useState([])
  const [entries,   setEntries]   = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s)
      // ✅ Load task types based on the member's ROLE
      const types = getTaskTypesForRole(s, member.role)
      setTaskTypes(types)
      setEntries([newEntry(types)])
    })
  }, [member.role])

  if (!settings || taskTypes.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text3, padding: '3rem 0' }}>
      <Spinner size={14} /> Loading…
    </div>
  )

  const { complexity: complexityLevels, weeklyTargets } = settings
  const target = weeklyTargets?.[member.role] || 10

  const entriesWithCredits = entries.map(e => ({
    ...e,
    credits:   calcCredits(e.typeId, e.complexity, taskTypes, complexityLevels),
    typeLabel: taskTypes.find(t => t.id === e.typeId)?.label || e.typeId,
  }))
  const totalCredits = entriesWithCredits.reduce((s, e) => s + e.credits, 0)

  function upd(id, field, val) {
    setEntries(p => p.map(e => e.id === id ? { ...e, [field]: val } : e))
  }

  async function submit() {
    setError(''); setSaving(true)
    const { error: err } = await saveLog({
      memberName: member.name, memberRole: member.role,
      logDate: today, entries: entriesWithCredits, totalCredits,
    })
    setSaving(false)
    if (err) { setError('Could not save. Try again.'); return }
    setSubmitted(true)
  }

  // ── Submitted screen ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }} className="fade-in">
          <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.5rem',
            background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            ✅
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Log submitted!</div>
          <div style={{ fontSize: 13, color: C.text3, marginBottom: '1.25rem' }}>{fmtDate(today)}</div>

          <div style={{ margin: '0 auto 1.75rem', padding: '1.25rem 2rem',
            background: C.redDim, border: `1px solid ${C.redBorder}`, borderRadius: 14,
            boxShadow: `0 4px 16px ${C.redGlow}`, display: 'inline-block' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: C.red, lineHeight: 1 }}>{totalCredits}</div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>credits earned today</div>
          </div>

          {/* Summary */}
          <div style={{ marginBottom: '1.75rem', textAlign: 'left' }}>
            {entriesWithCredits.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13,
                padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.text2 }}>
                  {e.typeLabel}
                  {e.client && <span style={{ color: C.text3 }}> · {e.client}</span>}
                  <span style={{ color: C.text3, textTransform: 'capitalize' }}> · {e.complexity}</span>
                </span>
                <span style={{ fontWeight: 800, color: C.red }}>{e.credits} cr</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn size="lg" style={{ width: '100%' }} onClick={() => {
              setSubmitted(false)
              setEntries([newEntry(taskTypes)])
              setError('')
            }}>
              + Log another session
            </Btn>
            <Btn variant="ghost" size="lg" style={{ width: '100%' }} onClick={onSignOut}>
              Sign out
            </Btn>
          </div>
        </div>
      </div>
    )
  }

  // ── Log form ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 700 }} className="fade-in">
      <SectionHeader title="Daily Log" sub={fmtDate(today)} />

      {entriesWithCredits.map((e, idx) => (
        <Card key={e.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Task {idx + 1}
            </span>
            {e.credits > 0 && (
              <Badge color="crimson">{e.credits} credit{e.credits !== 1 ? 's' : ''}</Badge>
            )}
          </div>

          {/* Task type + Complexity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Task type</div>
              <Select value={e.typeId} onChange={ev => upd(e.id, 'typeId', ev.target.value)}>
                {taskTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.label} — {t.base} base cr</option>
                ))}
              </Select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Complexity</div>
              <Select value={e.complexity} onChange={ev => upd(e.id, 'complexity', ev.target.value)}>
                {complexityLevels.map(c => (
                  <option key={c.id} value={c.id}>{c.label} ×{c.multiplier}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Client + Frame.io */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Client</div>
              <Input placeholder="Client name" value={e.client} onChange={ev => upd(e.id, 'client', ev.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Frame.io link</div>
              <Input placeholder="https://…" value={e.frameio} onChange={ev => upd(e.id, 'frameio', ev.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Notes</div>
            <textarea
              placeholder="Tools used, why complex, anything relevant…"
              value={e.note} onChange={ev => upd(e.id, 'note', ev.target.value)}
              rows={2}
              style={{ fontSize: 13, padding: '9px 12px', borderRadius: 8,
                border: `1px solid ${C.border2}`, background: C.bg, color: C.text,
                outline: 'none', width: '100%', resize: 'vertical', fontFamily: 'inherit',
                lineHeight: 1.5, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
            />
          </div>

          {entries.length > 1 && (
            <button onClick={() => setEntries(p => p.filter(x => x.id !== e.id))}
              style={{ marginTop: 10, fontSize: 11, padding: '3px 10px', borderRadius: 6,
                border: '1px solid rgba(217,48,37,0.25)', background: 'none',
                color: C.danger, cursor: 'pointer', fontFamily: 'inherit' }}>
              Remove task
            </button>
          )}
        </Card>
      ))}

      <button onClick={() => setEntries(p => [...p, newEntry(taskTypes)])}
        style={{ width: '100%', padding: '11px', fontSize: 13, borderRadius: 10,
          border: `2px dashed ${C.border2}`, background: 'none', color: C.text3,
          cursor: 'pointer', marginBottom: '1.5rem', fontFamily: 'inherit' }}>
        + Add another task
      </button>

      {/* Total credits */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderRadius: 12, marginBottom: '1.25rem',
        background: totalCredits > 0 ? C.redDim : C.surface,
        border: `1px solid ${totalCredits > 0 ? C.redBorder : C.border}`,
        boxShadow: totalCredits > 0 ? `0 2px 12px ${C.redGlow}` : 'none' }}>
        <div>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>Total credits today</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: C.red, lineHeight: 1 }}>{totalCredits}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>Weekly target</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text2 }}>{target} cr</div>
        </div>
      </div>

      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 12, padding: '8px 14px', background: '#FEE2E2', borderRadius: 8 }}>{error}</div>}

      <Btn onClick={submit} disabled={saving || totalCredits === 0} size="lg" style={{ width: '100%' }}>
        {saving ? <><Spinner size={14} /> Saving…</> : 'Submit log →'}
      </Btn>
    </div>
  )
}
