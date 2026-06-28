import { useState, useEffect } from 'react'
import { C, Card, ProgressBar, Badge, Skeleton } from './ui.jsx'
import { loadRangeLogs, getTeamMembers, getSettings } from '../lib/supabase.js'
import { getWeekDates, todayStr } from '../lib/config.js'

export default function TeamBoard({ today }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    async function load() {
      const dates = getWeekDates()
      const [logs, members, settings] = await Promise.all([
        loadRangeLogs(dates[0], dates[6]),
        getTeamMembers(),
        getSettings(),
      ])
      const target = settings.weeklyTargets
      const result = members.map(m => {
        const myLogs    = logs.filter(l => l.editor_name === m.name)
        const weekTotal = myLogs.reduce((s,l) => s + (l.credits||0), 0)
        const todayLog  = myLogs.find(l => l.log_date === today)
        const t         = target[m.role] || 10
        return { ...m, weekTotal, todayCredits: todayLog?.credits||0, submitted:!!todayLog, target:t }
      })
      setData(result.sort((a,b) => b.weekTotal - a.weekTotal))
    }
    load()
  }, [today])

  if (!data) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[1,2,3].map(i => <Skeleton key={i} height={90} radius={12} />)}
    </div>
  )

  const maxWeek = Math.max(...data.map(d => d.weekTotal), 1)

  return (
    <div className="fade-in">
      <div style={{ marginBottom:'1.25rem' }}>
        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>Leaderboard</div>
        <div style={{ fontSize:13, color:C.text3 }}>This week's credits — task counts only visible to managers</div>
      </div>

      {data.map((m, rank) => {
        const isTop = rank === 0 && m.weekTotal > 0
        const pct   = m.weekTotal / m.target
        const col   = pct >= 1 ? C.success : pct >= 0.5 ? C.warning : C.danger
        return (
          <Card key={m.id} style={{ marginBottom:10, borderColor: isTop ? C.redBorder : C.border }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {/* Rank */}
              <div style={{
                width:36, height:36, borderRadius:'50%', flexShrink:0,
                background: isTop ? C.redDim : C.surface2,
                border:`1px solid ${isTop ? C.redBorder : C.border}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:isTop?16:12, fontWeight:700, color:isTop?C.red:C.text3,
              }}>
                {isTop ? '🏆' : `#${rank+1}`}
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:C.text }}>{m.name}</span>
                  <Badge color={m.submitted ? (m.todayCredits > 0 ? 'green' : 'amber') : 'muted'}>
                    {m.submitted ? `${m.todayCredits} cr today` : 'Not submitted'}
                  </Badge>
                </div>
                <ProgressBar value={m.weekTotal} max={m.target} color={col} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:11, color:C.text3, textTransform:'capitalize' }}>{m.role}</span>
                  <span style={{ fontSize:11, color:C.text3 }}>{m.weekTotal} / {m.target} cr</span>
                </div>
              </div>
              {/* Big number */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:28, fontWeight:800, color:isTop?C.red:C.text }}>{m.weekTotal}</div>
                <div style={{ fontSize:10, color:C.text3 }}>credits</div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
