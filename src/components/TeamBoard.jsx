import { useState, useEffect } from 'react'
import { C, Card, ProgressBar, Badge, Skeleton, SectionHeader } from './ui.jsx'
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
      const result = members.map(m => {
        const myLogs    = logs.filter(l => l.editor_name === m.name)
        const weekTotal = myLogs.reduce((s,l) => s+(l.credits||0), 0)
        const todayLog  = myLogs.find(l => l.log_date === today)
        const t         = settings.weeklyTargets?.[m.role] || 10
        return { ...m, weekTotal, todayCredits:todayLog?.credits||0, submitted:!!todayLog, target:t }
      })
      setData(result.sort((a,b) => b.weekTotal - a.weekTotal))
    }
    load()
  }, [today])

  if (!data) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[1,2,3,4].map(i => <Skeleton key={i} height={90} radius={12} />)}
    </div>
  )

  const maxWeek = Math.max(...data.map(d => d.weekTotal), 1)

  return (
    <div className="fade-in">
      <SectionHeader title="Leaderboard" sub="This week's credits — counts only visible to managers" />

      {data.map((m, rank) => {
        const isTop = rank === 0 && m.weekTotal > 0
        const pct   = m.weekTotal / m.target
        const col   = pct >= 1 ? C.success : pct >= 0.5 ? C.warning : C.danger
        return (
          <Card key={m.id} style={{ marginBottom:10, borderColor: isTop ? C.redBorder : C.border,
            boxShadow: isTop ? `0 4px 16px ${C.redGlow}` : C.shadowSm }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {/* Rank badge */}
              <div style={{
                width:40, height:40, borderRadius:10, flexShrink:0,
                background: isTop ? C.redDim : C.surface2,
                border:`1px solid ${isTop ? C.redBorder : C.border}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:isTop?18:13, fontWeight:800, color:isTop?C.red:C.text3,
              }}>
                {isTop ? '🏆' : `#${rank+1}`}
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:C.text }}>{m.name}</span>
                  <Badge color={m.submitted?(m.todayCredits>0?'green':'amber'):'muted'} dot>
                    {m.submitted?`${m.todayCredits} cr today`:'Not submitted'}
                  </Badge>
                </div>
                <ProgressBar value={m.weekTotal} max={m.target} color={col} height={6} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:11, color:C.text3, textTransform:'capitalize' }}>{m.role}</span>
                  <span style={{ fontSize:11, color:C.text3 }}>{m.weekTotal} / {m.target} credits</span>
                </div>
              </div>

              {/* Credits */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:30, fontWeight:900, color:isTop?C.red:C.text, lineHeight:1 }}>{m.weekTotal}</div>
                <div style={{ fontSize:11, color:C.text3 }}>this week</div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
