import { useState, useEffect } from 'react'
import { Card, ProgressBar, Badge, T } from './ui.jsx'
import { loadWeekLogs } from '../lib/supabase.js'
import { TEAM, getWeekDates } from '../lib/config.js'

export default function TeamBoard({ today }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const dates = getWeekDates()
    loadWeekLogs(dates[0], dates[6]).then(logs => {
      const result = TEAM.map(m => {
        const myLogs = logs.filter(l => l.editor_name === m.name)
        const weekTotal = myLogs.reduce((s, l) => s + (l.videos_done || 0), 0)
        const todayLog  = myLogs.find(l => l.log_date === today)
        return {
          ...m,
          weekTotal,
          todayCount: todayLog?.videos_done || 0,
          submitted: !!todayLog,
        }
      })
      setData(result.sort((a, b) => b.weekTotal - a.weekTotal))
    })
  }, [today])

  if (!data) return <div style={{ color: T.muted, textAlign: 'center', padding: '2rem 0' }}>Loading team data…</div>

  const maxWeek = Math.max(...data.map(d => d.weekTotal), 1)

  return (
    <div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: '1rem' }}>
        This week's leaderboard · Shows task counts only
      </div>
      {data.map((m, rank) => {
        const isTop = rank === 0 && m.weekTotal > 0
        return (
          <Card key={m.id} style={{ marginBottom: 10, borderColor: isTop ? 'rgba(226,75,74,.35)' : 'rgba(255,255,255,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: isTop ? 'rgba(226,75,74,.12)' : 'rgba(255,255,255,.05)',
                border: `1px solid ${isTop ? 'rgba(226,75,74,.4)' : 'rgba(255,255,255,.06)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isTop ? 18 : 12, fontWeight: 700, color: isTop ? T.red : T.muted,
              }}>
                {isTop ? '🏆' : `#${rank + 1}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  {m.role === 'editor' ? 'Editor' : m.role === 'production' ? 'Production' : 'Social Media'} ·{' '}
                  Today: {m.submitted
                    ? <span style={{ color: m.todayCount >= 2 ? T.success : T.warning }}>{m.todayCount} tasks</span>
                    : <span>not submitted yet</span>
                  }
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: isTop ? T.red : T.text }}>{m.weekTotal}</div>
                <div style={{ fontSize: 10, color: T.muted }}>tasks this week</div>
              </div>
            </div>
            <ProgressBar value={m.weekTotal} max={maxWeek} color={isTop ? T.red : m.weekTotal >= 10 ? T.success : T.warning} />
          </Card>
        )
      })}
    </div>
  )
}
