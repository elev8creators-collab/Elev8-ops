import { useState, useEffect } from 'react'
import { Card, BarChart, ProgressBar, T } from './ui.jsx'
import { loadMemberHistory } from '../lib/supabase.js'
import { getWeekDates, DAY_NAMES } from '../lib/config.js'

export default function MyStats({ member, today }) {
  const [history, setHistory] = useState(null)
  const [view, setView]       = useState('week') // week | month | all

  useEffect(() => {
    loadMemberHistory(member.name).then(setHistory)
  }, [member.name])

  if (!history) {
    return <div style={{ color: T.muted, textAlign: 'center', padding: '2rem 0' }}>Loading your stats…</div>
  }

  const byDate = {}
  history.forEach(l => { byDate[l.log_date] = l })

  const weekDates = getWeekDates()
  const weekVals  = weekDates.map(d => byDate[d]?.videos_done ?? null)
  const weekTotal = weekVals.reduce((s, v) => s + (v || 0), 0)
  const weekDays  = weekVals.filter(v => v !== null).length

  const allTotal  = history.reduce((s, l) => s + (l.videos_done || 0), 0)
  const allDays   = history.length
  const avgPerDay = allDays > 0 ? (allTotal / allDays).toFixed(1) : '0'

  // last 30 days for the extended chart
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
  const last30Vals = last30.map(d => byDate[d]?.videos_done ?? null)

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.25rem' }}>
        {[
          { label: 'This week',    val: weekTotal, col: T.red    },
          { label: 'All time',     val: allTotal,  col: T.text   },
          { label: 'Daily avg',    val: avgPerDay, col: allTotal >= 2 ? T.success : T.warning },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.col }}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* This week bar chart */}
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: '1rem' }}>This week — daily output</div>
        <BarChart dates={weekDates} values={weekVals} today={today} />
        <div style={{ marginTop: '1rem' }}>
          <ProgressBar value={weekTotal} max={10} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 11, color: T.muted }}>Weekly tasks toward target</span>
            <span style={{ fontSize: 11, color: T.muted }}>{weekTotal} / 10</span>
          </div>
        </div>
      </Card>

      {/* All-time history */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: '1rem' }}>All-time log history</div>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', color: T.muted, padding: '1.5rem 0', fontSize: 13 }}>No logs yet — submit your first end-of-day log</div>
        ) : (
          <div>
            {history.slice(0, 30).map((log, i) => {
              const count = log.videos_done || 0
              const ok = count >= 2
              const col = count >= 2 ? T.success : count >= 1 ? T.warning : T.danger
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < history.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ fontSize: 12, color: log.log_date === today ? T.red : T.muted, width: 90, flexShrink: 0, fontWeight: log.log_date === today ? 700 : 400 }}>
                    {log.log_date}
                  </div>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={count} max={Math.max(5, count)} color={col} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: col, width: 40, textAlign: 'right' }}>
                    {count}
                  </div>
                </div>
              )
            })}
            {history.length > 30 && (
              <div style={{ textAlign: 'center', fontSize: 12, color: T.muted, paddingTop: 10 }}>
                Showing last 30 entries of {history.length} total
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
