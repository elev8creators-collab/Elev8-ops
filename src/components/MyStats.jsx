import { useState, useEffect } from 'react'
import { C, Card, MetricCard, ProgressBar, ProgressRing, Badge, Skeleton, SectionHeader, StatRow } from './ui.jsx'
import { loadMemberHistory, getSettings } from '../lib/supabase.js'
import { getWeekDates, DAY_NAMES, todayStr, fmtShort } from '../lib/config.js'

export default function MyStats({ member }) {
  const [history,  setHistory]  = useState(null)
  const [settings, setSettings] = useState(null)
  const today = todayStr()

  useEffect(() => {
    Promise.all([loadMemberHistory(member.name), getSettings()])
      .then(([h,s]) => { setHistory(h); setSettings(s) })
  }, [member.name])

  if (!history || !settings) return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {[1,2,3].map(i => <Skeleton key={i} height={90} radius={12} />)}
    </div>
  )

  const target  = settings.weeklyTargets?.[member.role] || 10
  const byDate  = {}
  history.forEach(l => { byDate[l.log_date] = l })

  const weekDates   = getWeekDates()
  const weekCredits = weekDates.reduce((s,d) => s + (byDate[d]?.credits || 0), 0)
  const allCredits  = history.reduce((s,l) => s + (l.credits || 0), 0)
  const avgPerDay   = history.length > 0 ? (allCredits/history.length).toFixed(1) : '0'

  // Streak
  let streak = 0
  const d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (byDate[ds]) { streak++; d.setDate(d.getDate()-1) } else break
  }

  const weekPct = Math.min(1, weekCredits/target)

  return (
    <div className="fade-in">
      <SectionHeader title="My Stats" sub={`${member.name} · ${member.role}`} />

      {/* Top metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:'1.5rem' }}>
        <MetricCard label="This week"   value={weekCredits} sub={`of ${target} target`} color={C.red} icon="📅" />
        <MetricCard label="All-time"    value={allCredits}  color={C.text}              icon="⭐" />
        <MetricCard label="Daily avg"   value={avgPerDay}   color={C.success}           icon="📈" sub="credits/day" />
        <MetricCard label="Streak"      value={`${streak}d`} color={streak>=5?C.warning:C.text2} icon={streak>=3?'🔥':'📆'} sub={streak>=3?'On fire!':'Keep going'} />
      </div>

      {/* Week bar chart + ring */}
      <Card style={{ marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>This week</div>
            <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>{weekCredits} of {target} credits</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <ProgressRing value={weekCredits} max={target} size={56} stroke={5} />
            <span style={{ fontSize:11, color:C.text3 }}>{Math.round(weekPct*100)}%</span>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:10 }}>
          {weekDates.map((date, i) => {
            const val  = byDate[date]?.credits || 0
            const isT  = date === today
            const has  = !!byDate[date]
            const maxV = Math.max(weekCredits, target, 1)
            const pct  = val > 0 ? Math.max((val/maxV)*100, 8) : 4
            const col  = !has ? C.surface3 : isT ? C.red : val >= target/5 ? C.success : C.warning
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                {has && <span style={{ fontSize:10, fontWeight:600, color:isT?C.red:C.text3 }}>{val}</span>}
                <div style={{ width:'100%', display:'flex', alignItems:'flex-end', flex:1 }}>
                  <div style={{
                    width:'100%', borderRadius:'4px 4px 0 0',
                    height:has?`${pct}%`:'4px',
                    background:col, minHeight:4,
                    boxShadow:isT?`0 2px 8px ${C.redGlow}`:'none',
                    transition:'height .3s ease',
                  }} />
                </div>
                <span style={{ fontSize:10, fontWeight:isT?700:400, color:isT?C.red:C.text3 }}>
                  {DAY_NAMES[i]}
                </span>
              </div>
            )
          })}
        </div>

        <ProgressBar value={weekCredits} max={target} color={weekPct>=1?C.success:C.red} />
      </Card>

      {/* Log history */}
      <Card>
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:'1rem' }}>Log history</div>
        {history.length === 0 ? (
          <div style={{ textAlign:'center', color:C.text3, padding:'2rem 0', fontSize:13 }}>
            No logs yet — submit your first end-of-day log
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>
                {['Date','Credits','Tasks','Status'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:11, fontWeight:600,
                    color:C.text3, textTransform:'uppercase', letterSpacing:'.06em',
                    borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.slice(0,30).map((log,i) => {
                const cr = log.credits || 0
                const isT = log.log_date === today
                return (
                  <tr key={i} style={{ background:isT?C.redDim:'none' }}>
                    <td style={{ padding:'10px', borderBottom:`1px solid ${C.border}`, fontWeight:isT?700:400, color:isT?C.red:C.text2 }}>
                      {fmtShort(log.log_date)}
                    </td>
                    <td style={{ padding:'10px', borderBottom:`1px solid ${C.border}`, fontWeight:800, color:C.text, fontSize:15 }}>
                      {cr}
                    </td>
                    <td style={{ padding:'10px', borderBottom:`1px solid ${C.border}`, color:C.text3 }}>
                      {log.entries?.length || '—'}
                    </td>
                    <td style={{ padding:'10px', borderBottom:`1px solid ${C.border}` }}>
                      <Badge color={cr>=2?'green':cr>0?'amber':'red'} dot>
                        {cr>=2?'Good':cr>0?'Low':'None'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
