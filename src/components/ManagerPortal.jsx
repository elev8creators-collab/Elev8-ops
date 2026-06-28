import { useState, useEffect } from 'react'
import { Card, Btn, Input, Select, Badge, T } from './ui.jsx'
import { loadDayLogs, loadRangeLogs, getTeamMembers } from '../lib/supabase.js'
import { TASK_TYPES, MANAGER_PASSWORD, todayStr, fmtDate, getWeekDates, DAY_NAMES } from '../lib/config.js'
import TeamManager from './TeamManager.jsx'
import Analytics   from './Analytics.jsx'

// ── Password gate ──────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pass, setPass] = useState('')
  const [err,  setErr]  = useState('')
  function attempt() {
    if (pass === MANAGER_PASSWORD) onAuth()
    else setErr('Incorrect password.')
  }
  return (
    <div style={{ maxWidth: 340, margin: '4rem auto' }}>
      <Card accent>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>Manager access</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Guri · Gurjinder · SMM only</div>
        </div>
        <Input type="password" placeholder="Enter password" value={pass}
          onChange={e => setPass(e.target.value)}
          style={{ marginBottom: 10, textAlign: 'center', fontSize: 15 }} />
        {err && <div style={{ color: T.danger, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{err}</div>}
        <Btn onClick={attempt} style={{ width: '100%', padding: '12px', fontSize: 14 }}>Unlock →</Btn>
      </Card>
    </div>
  )
}

// ── Today view ─────────────────────────────────────────────────────────────
function TodayView({ teamMembers }) {
  const [selDate, setSelDate] = useState(todayStr())
  const [logs,    setLogs]    = useState({})
  const [loading, setLoading] = useState(true)

  async function fetch(date) {
    setLoading(true)
    const data = await loadDayLogs(date)
    const map  = {}
    data.forEach(l => { map[l.editor_name] = l })
    setLogs(map)
    setLoading(false)
  }
  useEffect(() => { fetch(selDate) }, [])

  const subCount = Object.keys(logs).length

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input type="date" value={selDate} onChange={e => { setSelDate(e.target.value); fetch(e.target.value) }}
          style={{ fontSize: 13, padding: '8px 11px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#18181F', color: T.text, outline: 'none' }} />
        <Btn variant="ghost" onClick={() => fetch(selDate)} style={{ fontSize: 12, padding: '8px 12px' }}>Refresh</Btn>
        {!loading && (
          <Badge color={subCount === teamMembers.length ? 'green' : 'amber'}>
            {subCount} / {teamMembers.length} submitted
          </Badge>
        )}
      </div>

      {loading ? (
        <div style={{ color: T.muted, textAlign: 'center', padding: '2rem 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
          {teamMembers.map(m => {
            const log = logs[m.name]
            const sub = !!log, count = log?.videos_done || 0, ok = count >= 2
            return (
              <Card key={m.id} style={{ borderColor: sub ? (ok ? 'rgba(74,222,128,.35)' : 'rgba(251,191,36,.35)') : T.border }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name}</div>
                  <Badge color={sub ? (ok ? 'green' : 'amber') : 'muted'}>
                    {sub ? (ok ? 'On target ✓' : 'Low output') : 'Not submitted'}
                  </Badge>
                </div>
                {sub ? (
                  <>
                    {(log.entries || []).map((e, i) => {
                      const role  = m.role || 'editor'
                      const types = TASK_TYPES[role] || TASK_TYPES.editor
                      const tp    = types.find(t => t.id === e.typeId)
                      return (
                        <div key={i} style={{ fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <span style={{ fontWeight: 600, color: T.text }}>{tp?.label || e.typeId}</span>
                            {e.note && <span style={{ color: T.muted }}> · {e.note}</span>}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.red, flexShrink: 0 }}>×{e.count}</span>
                        </div>
                      )
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, color: T.muted }}>Total tasks</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: ok ? T.success : T.warning }}>{count}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '1.25rem 0', textAlign: 'center', color: T.muted, fontSize: 13 }}>Awaiting end-of-day log</div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Settings ───────────────────────────────────────────────────────────────
function Settings({ onLock }) {
  return (
    <div style={{ maxWidth: 420 }}>
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>System info</div>
        {[
          ['Daily minimum', '2 tasks'],
          ['Weekly target', '10 tasks'],
          ['ClickUp list',  'Daily Team Logs → EDITORS space'],
          ['Database',      'Supabase — permanent'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
            <span style={{ color: T.muted }}>{k}</span>
            <span style={{ color: T.text, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </Card>
      <Btn variant="ghost" onClick={onLock} style={{ width: '100%' }}>🔒 Lock manager portal</Btn>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────
const TABS = [
  ['today',   'Today'],
  ['analytics','Analytics'],
  ['team',    'Team'],
  ['settings','Settings'],
]

export default function ManagerPortal() {
  const [authed,  setAuthed]  = useState(false)
  const [sub,     setSub]     = useState('today')
  const [members, setMembers] = useState([])

  useEffect(() => { if (authed) getTeamMembers().then(setMembers) }, [authed])

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 3, background: '#18181F', borderRadius: 11, padding: 4 }}>
          {TABS.map(([v, l]) => (
            <button key={v} onClick={() => setSub(v)} style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none',
              background: sub === v ? T.red : 'none',
              color: sub === v ? '#fff' : T.muted,
              fontWeight: sub === v ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>
        <Btn variant="ghost" onClick={() => setAuthed(false)} style={{ fontSize: 12, padding: '6px 12px' }}>🔒 Lock</Btn>
      </div>

      {sub === 'today'     && <TodayView  teamMembers={members} />}
      {sub === 'analytics' && <Analytics  teamMembers={members} />}
      {sub === 'team'      && <TeamManager />}
      {sub === 'settings'  && <Settings   onLock={() => setAuthed(false)} />}
    </div>
  )
}
