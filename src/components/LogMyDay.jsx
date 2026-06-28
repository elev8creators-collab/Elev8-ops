import { useState, useEffect } from 'react'
import { Card, Btn, Input, Select, Badge, T } from './ui.jsx'
import { TASK_TYPES } from '../lib/config.js'
import { saveLog, loadDayLogs } from '../lib/supabase.js'

function newEntry(role) {
  const types = TASK_TYPES[role] || TASK_TYPES.editor
  return { id: Date.now() + Math.random(), typeId: types[0].id, count: 1, note: '', client: '' }
}

export default function LogMyDay({ member, today, fmtDate }) {
  const role = member.role
  const types = TASK_TYPES[role] || TASK_TYPES.editor
  const [entries, setEntries]     = useState([newEntry(role)])
  const [submitted, setSubmitted] = useState(false)
  const [savedLog, setSavedLog]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    loadDayLogs(today).then(logs => {
      const mine = logs.find(l => l.editor_name === member.name)
      if (mine?.submitted_at) {
        setSubmitted(true)
        setSavedLog(mine)
        if (mine.entries?.length) setEntries(mine.entries)
      }
    })
  }, [member.name, today])

  const upd = (id, field, val) => setEntries(p => p.map(e => e.id === id ? { ...e, [field]: val } : e))
  const totalCount = entries.reduce((s, e) => s + (Number(e.count) || 0), 0)
  const onTarget   = totalCount >= 2

  const needsNote  = (e) => {
    const t = types.find(t => t.id === e.typeId)
    return t?.id === 'other' || t?.id === 'shoot'
  }

  async function submit() {
    for (const e of entries) {
      if (needsNote(e) && !e.note.trim()) {
        setError('Please fill in the notes field for highlighted entries.')
        return
      }
    }
    setError('')
    setSaving(true)
    const { error: err } = await saveLog({
      memberName: member.name,
      memberRole: role,
      logDate: today,
      entries,
      totalCount,
    })
    setSaving(false)
    if (err) { setError('Could not save. Please try again.'); return }
    setSubmitted(true)
    setSavedLog({ entries, totalCount })
  }

  if (submitted && savedLog) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 6 }}>Log submitted!</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>
          {member.name} · {fmtDate(today)}<br />
          <span style={{ color: T.success, fontWeight: 700 }}>{totalCount} tasks logged</span>
        </div>
        <Btn variant="ghost" onClick={() => { setSubmitted(false); setSavedLog(null); setEntries([newEntry(role)]) }}>
          Edit submission
        </Btn>
      </div>
    )
  }

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: '1.25rem' }}>{fmtDate(today)}</div>

      {entries.map((e) => {
        const t = types.find(t => t.id === e.typeId)
        const isOther = e.typeId === 'other'
        const isShoot = e.typeId === 'shoot'
        return (
          <Card key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <Select value={e.typeId} onChange={ev => upd(e.id, 'typeId', ev.target.value)} style={{ flex: '1 1 160px' }}>
                {types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
                <span style={{ fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>How many?</span>
                <input
                  type="number"
                  min="0"
                  value={e.count}
                  onChange={ev => upd(e.id, 'count', ev.target.value)}
                  style={{
                    width: 64, fontSize: 14, fontWeight: 700, textAlign: 'center',
                    padding: '8px', borderRadius: 8, border: `1px solid rgba(226,75,74,0.4)`,
                    background: 'rgba(226,75,74,0.06)', color: T.red, outline: 'none',
                  }}
                />
                <span style={{ fontSize: 11, color: T.muted }}>{t?.unit || 'items'}</span>
              </div>
            </div>

            {(isShoot || isOther) && (
              <Input
                placeholder={isShoot ? 'Client name *' : 'Describe what you did *'}
                value={e.note}
                onChange={ev => upd(e.id, 'note', ev.target.value)}
                style={{ marginBottom: 0 }}
              />
            )}

            {!isShoot && !isOther && (
              <div style={{ fontSize: 11, color: T.muted }}>{t?.sub}</div>
            )}

            {entries.length > 1 && (
              <button
                onClick={() => setEntries(p => p.filter(x => x.id !== e.id))}
                style={{ marginTop: 8, fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(248,113,113,.3)', background: 'none', color: T.danger, cursor: 'pointer' }}
              >
                Remove
              </button>
            )}
          </Card>
        )
      })}

      <button
        onClick={() => setEntries(p => [...p, newEntry(role)])}
        style={{ width: '100%', padding: '11px', fontSize: 13, borderRadius: 10, border: '1.5px dashed rgba(255,255,255,.08)', background: 'none', color: T.muted, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit', marginBottom: '1rem' }}
      >
        + Add another task
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        padding: '12px 16px', borderRadius: 12, marginBottom: '1rem',
        background: onTarget ? 'rgba(74,222,128,.07)' : 'rgba(226,75,74,.07)',
        border: `1px solid ${onTarget ? 'rgba(74,222,128,.3)' : 'rgba(226,75,74,.3)'}`,
      }}>
        <div>
          <span style={{ fontSize: 13, color: T.muted }}>Today: </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: onTarget ? T.success : T.red }}>
            {totalCount} task{totalCount !== 1 ? 's' : ''} logged
          </span>
        </div>
        <Badge color={onTarget ? 'green' : 'crimson'}>{onTarget ? 'On target ✓' : 'Below minimum'}</Badge>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: T.danger, marginBottom: 10, padding: '8px 12px', background: 'rgba(248,113,113,.08)', borderRadius: 8 }}>{error}</div>
      )}

      <Btn onClick={submit} disabled={saving} style={{ width: '100%', padding: 14, fontSize: 14, borderRadius: 12 }}>
        {saving ? 'Saving…' : 'Submit end-of-day log →'}
      </Btn>
    </div>
  )
}
