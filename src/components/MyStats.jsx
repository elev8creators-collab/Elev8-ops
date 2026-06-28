import { useState, useEffect } from 'react'
import { C, Card, MetricCard, ProgressBar, ProgressRing, Badge, Skeleton } from './ui.jsx'
import { loadMemberHistory } from '../lib/supabase.js'
import { getSettings } from '../lib/supabase.js'
import { getWeekDates, DAY_NAMES, todayStr, fmtShort } from '../lib/config.js'

export default function MyStats({ member }) {
  const [history, setHistory] = useState(null)
  const [settings, setSettings] = useState(null)
  const today = todayStr()

  useEffect(() => {
    Promise.all([loadMemberHistory(member.name), getSettings()])
      .then(([h, s]) => { setHistory(h); setSettings(s) })
  }, [member.name])

  if (!history || !settings) return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {[1,2,3].map(i => <Skeleton key={i} height={80} radius={12} />)}
    </div>
  )

  const target = settings.weeklyTargets?.[member.role] || 10
  const byDate = {}
  history.forEach(l => { byDate[l.log_date] = l })

  const weekDates = getWeekDates()
  const weekCredits = weekDates.reduce((s,d) => s + (byDate[d]?.credits || 0), 0)
  const allCredits  = history.reduce((s,l) => s + (l.credits || 0), 0)
  const avgPerDay   = history.length > 0 ? (allCredits / history.length).toFixed(1) : '0'

  // Streak
  let streak = 0
  const todayIdx = new Date().getDay()
  let d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (byDate[ds]) { streak++; d.setDate(d.getDate()-1) }
    else break
  }

  // Personal best week
  let bestWeek = 0
  history.forEach(l => { if ((l.credits||0) > bestWeek) bestWeek = l.credits||0 })

  return (
    <div className="fade-in">
      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:'1.25rem' }}>My Stats</div>

      {/* Top metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1.25rem' }}>
        <MetricCard label="This week" value={weekCredits} sub={`of ${target} target`} color={C.red} icon="📅" />
        <MetricCard label="All-time credits" value={allCredits} color={C.text} icon="⭐" />
        <MetricCard label="Daily avg" value={avgPerDay} sub="credits/day" color={C.success} icon="📈" />
        <MetricCard label="Streak" value={`${streak}d`} sub={streak >= 3 ? '🔥 On fire' : 'Keep going'} color={streak >= 5 ? C.warning : C.text2} icon="🔥" />
      </div>

      {/* Week progress */}
      <Card style={{ marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>This week</div>
          <Badge color={weekCredits >= target ? 'green' : weekCredits >= target*0.5 ? 'amber' : 'red'}>
            {weekCredits >= target ? 'On target' : weekCredits >= target*0.5 ? 'In progress' : 'Behind'}
          </Badge>
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:8 }}>
          {weekDates.map((date,i) => {
            const val = byDate[date]?.credits || 0
            const isT = date === today
            const hasLog = !!byDate[date]
            const pct = val > 0 ? Math.max((val / Math.max(weekCredits,target)) * 100, 8) : 4
            const col = !hasLog ? C.surface3 : val >= target/5 ? C.success : C.warning
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                {hasLog && <span style={{ fontSize:10, color:C.text3 }}>{val}</span>}
                <div style={{ width:'100%', display:'flex', alignItems:'flex-end', flex:1 }}>
                  <div style={{ width:'100%', borderRadius:'4px 4px 0 0',
                    height:hasLog ? `${pct}%` : '6px',
                    background: isT ? C.red : col,
                    boxShadow: isT ? `0 0 8px ${C.redGlow}` : 'none',
                    transition:'height .3s ease',
                    minHeight:6,
                  }} />
                </div>
                <span style={{ fontSize:10, color:isT ? C.red : C.text3, fontWeight:isT?700:400 }}>
                  {DAY_NAMES[i]}
                </span>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:`1px solid ${C.border}` }}>
          <span style={{ fontSize:12, color:C.text3 }}>Weekly progress</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{weekCredits} / {target} credits</span>
        </div>
        <ProgressBar value={weekCredits} max={target} color={weekCredits >= target ? C.success : C.red} />
      </Card>

      {/* History table */}
      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:'1rem' }}>Log history</div>
        {history.length === 0 ? (
          <div style={{ textAlign:'center', color:C.text3, padding:'2rem 0', fontSize:13 }}>
            No logs yet — submit your first end-of-day log
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
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
                    <tr key={i} style={{ background: isT ? C.redDim : 'none' }}>
                      <td style={{ padding:'10px', borderBottom:`1px solid ${C.border}`, fontWeight:isT?700:400, color:isT?C.red:C.text2 }}>
                        {fmtShort(log.log_date)}
                      </td>
                      <td style={{ padding:'10px', borderBottom:`1px solid ${C.border}`, fontWeight:700, color:C.text }}>
                        {cr}
                      </td>
                      <td style={{ padding:'10px', borderBottom:`1px solid ${C.border}`, color:C.text3 }}>
                        {log.entries?.length || log.videos_done || '—'} tasks
                      </td>
                      <td style={{ padding:'10px', borderBottom:`1px solid ${C.border}` }}>
                        <Badge color={cr >= target/5 ? 'green' : cr > 0 ? 'amber' : 'red'}>
                          {cr >= target/5 ? 'Good' : cr > 0 ? 'Low' : 'None'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
