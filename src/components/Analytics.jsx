import { useState, useEffect } from 'react'
import { Card, ProgressBar, T } from './ui.jsx'
import { loadRangeLogs } from '../lib/supabase.js'
import { getWeekDates, getMonthDates, DAY_NAMES, todayStr } from '../lib/config.js'

function StatCard({ label, value, color }) {
  return (
    <Card>
      <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || T.text }}>{value}</div>
    </Card>
  )
}

export default function Analytics({ teamMembers }) {
  const [period,    setPeriod]    = useState('week')  // week | month | custom
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [customEnd, setCustomEnd] = useState(todayStr())
  const [logs,      setLogs]      = useState([])
  const [loading,   setLoading]   = useState(true)

  async function load() {
    setLoading(true)
    let start, end
    if (period === 'week') {
      const dates = getWeekDates(); start = dates[0]; end = dates[6]
    } else if (period === 'month') {
      const m = getMonthDates(); start = m.start; end = m.end
    } else {
      start = customStart; end = customEnd
    }
    const data = await loadRangeLogs(start, end)
    setLogs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [period])

  // Build per-member stats
  const byMember = {}
  logs.forEach(l => {
    if (!byMember[l.editor_name]) byMember[l.editor_name] = { total: 0, days: 0, logs: [] }
    byMember[l.editor_name].total += l.videos_done || 0
    byMember[l.editor_name].days  += 1
    byMember[l.editor_name].logs.push(l)
  })

  const members = teamMembers.length > 0
    ? teamMembers.map(m => m.name)
    : Object.keys(byMember)

  const totalTasks = Object.values(byMember).reduce((s, m) => s + m.total, 0)
  const topPerformer = members.reduce((top, name) =>
    (byMember[name]?.total || 0) > (byMember[top]?.total || 0) ? name : top, members[0])
  const maxVal = Math.max(...members.map(n => byMember[n]?.total || 0), 1)

  const periodLabel = period === 'week' ? 'This week'
    : period === 'month' ? 'This month'
    : `${customStart} → ${customEnd}`

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 3, background: '#18181F', borderRadius: 11, padding: 4 }}>
          {[['week','This week'],['month','This month'],['custom','Custom']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)} style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none',
              background: period === v ? T.red : 'none',
              color: period === v ? '#fff' : T.muted,
              fontWeight: period === v ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>
        {period === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              style={{ fontSize: 12, padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#18181F', color: T.text, outline: 'none' }} />
            <span style={{ color: T.muted, fontSize: 12 }}>→</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              style={{ fontSize: 12, padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#18181F', color: T.text, outline: 'none' }} />
            <button onClick={load} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'none', color: T.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
              Apply
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ color: T.muted, textAlign: 'center', padding: '2rem 0' }}>Loading {periodLabel}…</div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.25rem' }}>
            <StatCard label="Total tasks"        value={totalTasks}            color={T.red} />
            <StatCard label="Active members"     value={Object.keys(byMember).length} color={T.text} />
            <StatCard label="Top performer"      value={topPerformer || '—'}   color={T.success} />
          </div>

          {/* Per-member breakdown */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: '1rem' }}>
              Team breakdown — {periodLabel}
            </div>
            {members.length === 0 ? (
              <div style={{ color: T.muted, textAlign: 'center', padding: '1rem 0', fontSize: 13 }}>No data for this period</div>
            ) : (
              members.map(name => {
                const stats = byMember[name] || { total: 0, days: 0 }
                const avg   = stats.days > 0 ? (stats.total / stats.days).toFixed(1) : '0'
                const pct   = Math.round((stats.total / maxVal) * 100)
                const col   = stats.total >= 10 ? T.success : stats.total >= 5 ? T.warning : T.danger

                return (
                  <div key={name} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: T.muted }}>{stats.days} days logged</span>
                        <span style={{ fontSize: 11, color: T.muted }}>avg {avg}/day</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: col }}>{stats.total}</span>
                      </div>
                    </div>
                    <ProgressBar value={stats.total} max={maxVal} color={col} />
                  </div>
                )
              })
            )}
          </Card>

          {/* Day-by-day table (week only) */}
          {period === 'week' && (
            <Card style={{ marginTop: '1rem', overflowX: 'auto' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: '1rem' }}>Daily detail</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: 11, fontWeight: 600, color: T.muted, padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Name</th>
                    {getWeekDates().map((d, i) => (
                      <th key={d} style={{ fontSize: 11, fontWeight: 600, color: d === todayStr() ? T.red : T.muted, padding: '8px 6px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                        {DAY_NAMES[i]}<br /><span style={{ fontSize: 9, fontWeight: 400 }}>{d.slice(5)}</span>
                      </th>
                    ))}
                    <th style={{ fontSize: 11, fontWeight: 600, color: T.muted, padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, borderLeft: `1px solid ${T.border}` }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(name => {
                    const memberLogs = byMember[name]?.logs || []
                    const logByDate  = {}
                    memberLogs.forEach(l => { logByDate[l.log_date] = l })
                    const weekTotal  = getWeekDates().reduce((s, d) => s + (logByDate[d]?.videos_done || 0), 0)
                    return (
                      <tr key={name}>
                        <td style={{ padding: '9px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 600, color: T.text }}>{name}</td>
                        {getWeekDates().map((d, i) => {
                          const c   = logByDate[d]?.videos_done
                          const col = c === undefined ? T.muted : c >= 2 ? T.success : c >= 1 ? T.warning : T.danger
                          return (
                            <td key={d} style={{ padding: '9px 6px', borderBottom: `1px solid ${T.border}`, textAlign: 'center', background: d === todayStr() ? 'rgba(226,75,74,.04)' : 'none' }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: col }}>{c !== undefined ? c : '—'}</span>
                            </td>
                          )
                        })}
                        <td style={{ padding: '9px 10px', borderBottom: `1px solid ${T.border}`, textAlign: 'center', borderLeft: `1px solid ${T.border}` }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: weekTotal >= 10 ? T.success : weekTotal >= 6 ? T.warning : T.danger }}>{weekTotal}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
