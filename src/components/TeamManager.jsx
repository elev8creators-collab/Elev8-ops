import { useState, useEffect } from 'react'
import { Card, Btn, Input, Select, Badge, T } from './ui.jsx'
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from '../lib/supabase.js'

const ROLES = ['editor', 'production', 'social']
const EMPTY = { name: '', role: 'editor', initials: '', pin: '1234' }

export default function TeamManager() {
  const [members, setMembers] = useState([])
  const [editing, setEditing] = useState(null) // id or 'new'
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  async function reload() { setMembers(await getTeamMembers()) }
  useEffect(() => { reload() }, [])

  function startEdit(m) {
    setEditing(m.id)
    setForm({ name: m.name, role: m.role, initials: m.initials, pin: m.pin })
    setMsg('')
  }

  function startNew() {
    setEditing('new')
    setForm(EMPTY)
    setMsg('')
  }

  async function save() {
    if (!form.name.trim()) { setMsg('Name is required.'); return }
    setSaving(true)
    if (editing === 'new') {
      const { error } = await addTeamMember(form)
      if (error) setMsg('Could not add. Try again.')
      else { setMsg('Member added ✓'); setEditing(null) }
    } else {
      const { error } = await updateTeamMember(editing, form)
      if (error) setMsg('Could not save. Try again.')
      else { setMsg('Saved ✓'); setEditing(null) }
    }
    setSaving(false)
    reload()
    setTimeout(() => setMsg(''), 2000)
  }

  async function remove(id, name) {
    if (!window.confirm(`Remove ${name} from the team? Their logs will be kept.`)) return
    await deleteTeamMember(id)
    reload()
  }

  const upd = (k, v) => setForm(p => ({
    ...p, [k]: v,
    ...(k === 'name' && !editing ? { initials: v.slice(0, 2).toUpperCase() } : {}),
  }))

  return (
    <div style={{ maxWidth: 480 }}>
      {/* Member list */}
      {members.map(m => (
        <Card key={m.id} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: T.red,
          }}>{m.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name}</div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: 'capitalize' }}>{m.role} · PIN: {m.pin}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="ghost" onClick={() => startEdit(m)} style={{ fontSize: 12, padding: '5px 10px' }}>Edit</Btn>
            <Btn variant="danger" onClick={() => remove(m.id, m.name)} style={{ fontSize: 12, padding: '5px 10px' }}>Remove</Btn>
          </div>
        </Card>
      ))}

      {/* Add button */}
      {editing !== 'new' && (
        <button onClick={startNew} style={{
          width: '100%', padding: '11px', fontSize: 13, borderRadius: 10,
          border: '1.5px dashed rgba(255,255,255,.08)', background: 'none',
          color: T.muted, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit',
        }}>
          + Add team member
        </button>
      )}

      {/* Edit / New form */}
      {editing && (
        <Card style={{ marginTop: 16, borderColor: 'rgba(226,75,74,.3)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: '1rem' }}>
            {editing === 'new' ? 'Add new member' : `Edit — ${members.find(m => m.id === editing)?.name}`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Name *</div>
              <Input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Initials</div>
              <Input value={form.initials} onChange={e => upd('initials', e.target.value.toUpperCase().slice(0, 2))} placeholder="AB" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Role</div>
              <Select value={form.role} onChange={e => upd('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
              </Select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>4-digit PIN</div>
              <Input
                type="text"
                value={form.pin}
                onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); upd('pin', v) }}
                placeholder="1234"
              />
            </div>
          </div>

          {msg && <div style={{ fontSize: 12, color: msg.includes('✓') ? T.success : T.danger, marginBottom: 10 }}>{msg}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={save} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : editing === 'new' ? 'Add member' : 'Save changes'}
            </Btn>
            <Btn variant="ghost" onClick={() => { setEditing(null); setMsg('') }}>Cancel</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}
