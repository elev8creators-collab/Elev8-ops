import { useState, useEffect } from 'react'
import { Card, Btn, Input, Badge, BarChart, T } from './ui.jsx'
import { loadDayLogs, loadWeekLogs } from '../lib/supabase.js'
import { TEAM, MANAGER_PASSWORD, todayStr, fmtDate, getWeekDates, DAY_NAMES } from '../lib/config.js'

// ── Password gate ──────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pass, setPass]   = useState('')
  const [err, setErr]     = useState('')

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
        <Input
          type="password"
          placeholder="Enter password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          style={{ marginBottom: 10, textAlign: 'center', fontSize: 15, onKeyDown: undefined }}
        />
        <div onKeyDown={e => e.key === 'Enter' && attempt()} style={{ display: 'contents' }}>
          <input type="hidden" onKeyDown={e => e.key === 'Enter' && attempt()} />
        </div>
        {err && <div style={{ color: T.danger, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{err}</div>}
        <Btn onClick={attempt} style={{ width: '100%', padding: '12px', fontSize: 14 }}>Unlock →</Btn>
      </Card>
    </div>
  )
}

// ── Today view ─────────────────────────────────────────────────────────────
function TodayView() {
  const [selDate, setSelDate] = useState(todayStr())
  const [logs, setLogs]       = useState({})
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
  const allNames = TEAM.map(m => m.name)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input type="date" value={selDate} onChange={e => { setSelDate(e.target.value); fetch(e.target.value) }}
          style={{ fontSize: 13, padding: '8px 11px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#18181F', color: T.text, outline: 'none' }} />
        <Btn variant="ghost" onClick={() => fetch(selDate)} style={{ fontSize: 12, padding: '8px 12px' }}>Refresh</Btn>
        {!loading && (
          <Badge color={subCount === TEAM.length ? 'green' : 'amber'}>{subCount} / {TEAM.length} submitted</Badge>
        )}
      </div>

      {loading ? (
        <div style={{ color: T.muted, textAlign: 'center', padding: '2rem 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 12 }}>
          {TEAM.map(m => {
            const log = logs[m.name]
            const sub = !!log
            const count = log?.videos_done || 0
            const ok = count >= 2
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
                      const isLast = i === (log.entries?.length || 0) - 1
                      return (
                        <div key={i} style={{ fontSize: 12, padding: '5px 0', borderBottom: isLast ? 'none' : `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: T.text, fontWeight: 500 }}>{e.typeId}</span>
                          {e.note && <span style={{ color: T.muted, fontSize: 11 }}>{e.note}</span>}
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.red, flexShrink: 0 }}>{e.count}</span>
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

// ── Week view ──────────────────────────────────────────────────────────────
function WeekView() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const dates = getWeekDates()
    loadWeekLogs(dates[0], dates[6]).then(logs => {
      const result = TEAM.map(m => {
        let total = 0
        const days = dates.map(d => {
          const log = logs.find(l => l.editor_name === m.name && l.log_date === d)
          if (log) total += log.videos_done || 0
          return { date: d, count: log?.videos_done ?? null }
        })
        return { ...m, days, total }
      })
      setData(result)
    })
  }, [])

  if (!data) return <div style={{ color: T.muted, textAlign: 'center', padding: '2rem 0' }}>Loading week…</div>

  const today = todayStr()
  const thStyle = { fontSize: 11, fontWeight: 600, color: T.muted, padding: '9px 10px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }
  const tdStyle = { padding: '10px', borderBottom: `1px solid ${T.border}`, textAlign: 'center' }

  return (
    <Card style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: 'left' }}>Name</th>
            {DAY_NAMES.map((d, i) => (
              <th key={d} style={{ ...thStyle, color: getWeekDates()[i] === today ? T.red : T.muted }}>
                {d}<br /><span style={{ fontSize: 9, fontWeight: 400 }}>{getWeekDates()[i].slice(5)}</span>
              </th>
            ))}
            <th style={{ ...thStyle, borderLeft: `1px solid ${T.border}` }}>Week</th>
          </tr>
        </thead>
        <tbody>
          {data.map(m => {
            const totCol = m.total >= 10 ? T.success : m.total >= 6 ? T.warning : T.danger
            return (
              <tr key={m.id}>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: T.text }}>{m.name}</td>
                {m.days.map((day, di) => {
                  const c = day.count
                  const col = c === null ? T.muted : c >= 2 ? T.success : c >= 1 ? T.warning : T.danger
                  const isT = day.date === today
                  return (
                    <td key={di} style={{ ...tdStyle, background: isT ? 'rgba(226,75,74,.04)' : 'none' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: col }}>{c !== null ? c : '—'}</span>
                    </td>
                  )
                })}
                <td style={{ ...tdStyle, borderLeft: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: totCol }}>{m.total}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
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
          ['Team size', `${TEAM.length} members`],
          ['Database', 'Supabase — permanent storage'],
          ['App version', '1.0'],
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
const TABS = [['today', 'Today'], ['week', 'This week'], ['settings', 'Settings']]

export default function ManagerPortal() {
  const [authed, setAuthed] = useState(false)
  const [sub, setSub]       = useState('today')

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 3, background: '#18181F', borderRadius: 11, padding: 4 }}>
          {TABS.map(([v, l]) => (
            <button key={v} onClick={() => setSub(v)} style={{
              fontSize: 13, padding: '6px 16px', borderRadius: 8, border: 'none',
              background: sub === v ? T.red : 'none',
              color: sub === v ? '#fff' : T.muted,
              fontWeight: sub === v ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>
        <Btn variant="ghost" onClick={() => setAuthed(false)} style={{ fontSize: 12, padding: '6px 12px' }}>🔒 Lock</Btn>
      </div>

      {sub === 'today'    && <TodayView />}
      {sub === 'week'     && <WeekView />}
      {sub === 'settings' && <Settings onLock={() => setAuthed(false)} />}
    </div>
  )
}
