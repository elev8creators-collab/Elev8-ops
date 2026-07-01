import React, { useState, useEffect, useRef } from 'react'
import { TEAM_MEMBERS, WEEKLY_TARGETS, DEFAULT_TASK_TYPES } from '../config.js'
import { getTodayLogsAllMembers, getLogsInRange, getWeekRange, getMonthRange, aggregateStats, getMemberDateStr } from '../data.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const COLORS = { blue:'#6366f1', teal:'#22d3a5', amber:'#f59e0b', pink:'#ec4899', purple:'#8b5cf6' }
const COLOR_MAP = {
  blue:{solid:'#6366f1'}, teal:{solid:'#22d3a5'}, amber:{solid:'#f59e0b'},
  pink:{solid:'#ec4899'}, purple:{solid:'#8b5cf6'}, gray:{solid:'#64748b'},
}

export default function ManagerPortal({ onLock }) {
  const [tab, setTab] = useState('today')
  const [todayData, setTodayData] = useState({})
  const [weekData, setWeekData] = useState([])
  const [monthData, setMonthData] = useState([])
  const [loading, setLoading] = useState(true)
  const weekRange = getWeekRange()
  const monthRange = getMonthRange()

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [today, week, month] = await Promise.all([
        getTodayLogsAllMembers(TEAM_MEMBERS),
        getLogsInRange(weekRange.start, weekRange.end),
        getLogsInRange(monthRange.start, monthRange.end),
      ])
      setTodayData(today)
      setWeekData(week)
      setMonthData(month)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const tabs = [
    { id:'today', label:'📅 Today' },
    { id:'analytics', label:'📊 Analytics' },
    { id:'leaderboard', label:'🏆 Leaderboard' },
    { id:'reports', label:'📋 Reports' },
    { id:'settings', label:'⚙️ Settings' },
  ]

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div className="live-dot" />
            <span style={{ fontSize:11, color:'var(--text2)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Manager Control</span>
          </div>
          <h1 className="page-title">Operations <span style={{ color:'#f59e0b' }}>Hub</span></h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={loadAll}>↻ Refresh</button>
          <button className="btn btn-ghost" onClick={onLock}>🔒 Lock</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--card)', borderRadius:10, padding:4, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600,
            background: tab===t.id ? '#f59e0b' : 'transparent',
            color: tab===t.id ? '#000' : 'var(--text2)',
            transition:'all 0.2s', border:'none', cursor:'pointer', whiteSpace:'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {loading && tab !== 'settings' ? (
        <div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⟳</div>Loading...
        </div>
      ) : (
        <>
          {tab==='today' && <TodayView todayData={todayData} weekData={weekData} weekRange={weekRange} />}
          {tab==='analytics' && <AnalyticsView weekData={weekData} monthData={monthData} weekRange={weekRange} monthRange={monthRange} />}
          {tab==='leaderboard' && <LeaderboardView weekData={weekData} monthData={monthData} />}
          {tab==='reports' && <ReportsView weekData={weekData} monthData={monthData} weekRange={weekRange} monthRange={monthRange} />}
          {tab==='settings' && <SettingsView />}
        </>
      )}
    </div>
  )
}

function TodayView({ todayData, weekData, weekRange }) {
  const totalTodayPoints = Object.values(todayData).reduce((s,d) => s + d.logs.reduce((ss,l) => ss+(parseFloat(l.total_points)||0), 0), 0)
  const totalTodayVideos = Object.values(todayData).reduce((s,d) => s + d.logs.reduce((ss,l) => ss+(parseInt(l.total_videos)||0), 0), 0)
  const submitted = Object.values(todayData).filter(d=>d.logs.length>0).length
  const pending = TEAM_MEMBERS.filter(m=>!todayData[m.name]?.logs?.length)

  return (
    <div>
      <div className="grid-4" style={{ marginBottom:24, gap:16 }}>
        <StatCard label="Videos Today" value={totalTodayVideos} color="#22d3a5" icon="🎬" />
        <StatCard label="Points Today" value={totalTodayPoints} color="#f59e0b" icon="⭐" />
        <StatCard label="Submitted" value={`${submitted}/${TEAM_MEMBERS.length}`} color="#6366f1" icon="✅" />
        <StatCard label="Pending" value={pending.length} color={pending.length>0?'#ec4899':'#22d3a5'} icon="⏳" />
      </div>

      {pending.length>0 && (
        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#fbbf24' }}>
          ⚠️ Not submitted yet: {pending.map(m=>m.name).join(', ')}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
        {TEAM_MEMBERS.map(m => {
          const logs = todayData[m.name]?.logs || []
          const pts = logs.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0)
          const vids = logs.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0)
          const myWeekLogs = weekData.filter(l=>l.member_name===m.name)
          const weekPts = myWeekLogs.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0)
          const target = WEEKLY_TARGETS[m.role]||14
          const weekProg = Math.min((weekPts/target)*100,100)
          const hasLogged = logs.length>0
          const c = COLORS[m.color]||COLORS.blue

          return (
            <div key={m.name} className="card" style={{ borderColor:hasLogged?`${c}44`:'rgba(255,255,255,0.05)', boxShadow:hasLogged?`0 0 20px ${c}11`:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div className="avatar" style={{ background:`${c}22`, color:c, border:`1px solid ${c}44` }}>
                  {m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{m.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{m.role}</div>
                </div>
                <span className={`badge ${hasLogged?'green':'gray'}`}>{hasLogged?'✓ Done':'Pending'}</span>
              </div>
              {hasLogged ? (
                <>
                  <div style={{ display:'flex', gap:16, marginBottom:12 }}>
                    <div><div style={{ fontSize:11, color:'var(--text3)' }}>Videos</div><div style={{ fontSize:22, fontWeight:700, color:'#22d3a5' }}>{vids}</div></div>
                    <div><div style={{ fontSize:11, color:'var(--text3)' }}>Points</div><div style={{ fontSize:22, fontWeight:700, color:c }}>{pts}</div></div>
                    <div><div style={{ fontSize:11, color:'var(--text3)' }}>Logs</div><div style={{ fontSize:22, fontWeight:700, color:'#fbbf24' }}>{logs.length}</div></div>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {logs.flatMap(l=>l.tasks||[]).map((t,i)=>(
                      <span key={i} className="badge gray" style={{ fontSize:10 }}>{t.label}</span>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color:'var(--text3)', fontSize:13, padding:'8px 0' }}>Awaiting log...</div>
              )}
              <div style={{ marginTop:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:4 }}>
                  <span>Week: {weekPts}/{target}pts</span><span>{Math.round(weekProg)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${weekProg}%`, background:`linear-gradient(90deg, ${c}, ${c}88)` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AnalyticsView({ weekData, monthData, weekRange, monthRange }) {
  // Weekly daily chart
  const weekChartData = Array.from({length:7}, (_,i) => {
    const d = new Date(weekRange.start); d.setDate(d.getDate()+i)
    const ds = d.toISOString().slice(0,10)
    const dl = weekData.filter(l=>l.log_date===ds)
    return { day:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], videos:dl.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0), points:dl.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0) }
  })

  // Monthly daily chart
  const monthChartData = Array.from({length:new Date(new Date(monthRange.end).getFullYear(), new Date(monthRange.end).getMonth()+1, 0).getDate()}, (_,i) => {
    const d = new Date(monthRange.start); d.setDate(d.getDate()+i)
    const ds = d.toISOString().slice(0,10)
    const dl = monthData.filter(l=>l.log_date===ds)
    return { day:`${i+1}`, videos:dl.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0), points:dl.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0) }
  })

  const memberWeekStats = TEAM_MEMBERS.map(m => {
    const logs = weekData.filter(l=>l.member_name===m.name)
    const pts = logs.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0)
    const vids = logs.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0)
    const target = WEEKLY_TARGETS[m.role]||14
    return { name:m.name.split(' ')[0], pts, vids, target, pct:Math.round((pts/target)*100), color:COLORS[m.color]||COLORS.blue }
  }).sort((a,b)=>b.pts-a.pts)

  const memberMonthStats = TEAM_MEMBERS.map(m => {
    const logs = monthData.filter(l=>l.member_name===m.name)
    const pts = logs.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0)
    const vids = logs.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0)
    return { name:m.name.split(' ')[0], pts, vids, color:COLORS[m.color]||COLORS.blue }
  }).sort((a,b)=>b.pts-a.pts)

  const ttStyle = { background:'#11151f', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, color:'#fff' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="grid-4" style={{ gap:16 }}>
        <StatCard label="Week Videos" value={weekData.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0)} color="#22d3a5" icon="🎬" />
        <StatCard label="Week Points" value={weekData.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0)} color="#f59e0b" icon="⭐" />
        <StatCard label="Month Videos" value={monthData.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0)} color="#8b5cf6" icon="🎬" />
        <StatCard label="Month Points" value={monthData.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0)} color="#ec4899" icon="⭐" />
      </div>

      {/* Week chart + member breakdown */}
      <div className="grid-2" style={{ gap:20 }}>
        <div className="card amber">
          <div className="label" style={{ marginBottom:4 }}>Weekly Output — {weekRange.start} → {weekRange.end}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="videos" fill="#22d3a5" radius={[4,4,0,0]} name="Videos" />
              <Bar dataKey="points" fill="#f59e0b" radius={[4,4,0,0]} name="Points" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card blue">
          <div className="label" style={{ marginBottom:16 }}>Team — This Week</div>
          {memberWeekStats.map(m => (
            <div key={m.name} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                <span style={{ fontWeight:600 }}>{m.name}</span>
                <span style={{ color:'var(--text2)' }}>{m.pts}pts · {m.vids} vids</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${Math.min(m.pct,100)}%`, background:`linear-gradient(90deg, ${m.color}, ${m.color}88)` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month chart + member breakdown */}
      <div className="grid-2" style={{ gap:20 }}>
        <div className="card purple">
          <div className="label" style={{ marginBottom:4 }}>Monthly Output — {monthRange.start} → {monthRange.end}</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#11151f', border:'1px solid rgba(139,92,246,0.3)', borderRadius:8, color:'#fff' }} />
              <Line type="monotone" dataKey="videos" stroke="#22d3a5" strokeWidth={2} dot={false} name="Videos" />
              <Line type="monotone" dataKey="points" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Points" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card pink">
          <div className="label" style={{ marginBottom:16 }}>Team — This Month</div>
          {memberMonthStats.map(m => {
            const maxPts = memberMonthStats[0]?.pts || 1
            const pct = (m.pts/maxPts)*100
            return (
              <div key={m.name} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span style={{ fontWeight:600 }}>{m.name}</span>
                  <span style={{ color:'var(--text2)' }}>{m.pts}pts · {m.vids} vids</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${m.color}, ${m.color}88)` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LeaderboardView({ weekData, monthData }) {
  const [period, setPeriod] = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [customData, setCustomData] = useState([])
  const [loadingCustom, setLoadingCustom] = useState(false)

  const logs = period==='week' ? weekData : period==='month' ? monthData : customData

  const loadCustom = async () => {
    if (!customStart || !customEnd) return
    setLoadingCustom(true)
    try {
      const data = await (await import('../data.js')).getLogsInRange(customStart, customEnd)
      setCustomData(data)
    } catch(e) {}
    setLoadingCustom(false)
  }

  const ranked = TEAM_MEMBERS.map(m => {
    const ml = logs.filter(l=>l.member_name===m.name)
    return { ...m, points:ml.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0), videos:ml.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0), days:new Set(ml.map(l=>l.log_date)).size }
  }).sort((a,b)=>b.points-a.points)

  const medals = ['🥇','🥈','🥉']
  const maxPts = ranked[0]?.points||1

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {['week','month','custom'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:600,
            background: period===p ? '#ec4899' : 'rgba(255,255,255,0.05)',
            color: period===p ? '#fff' : 'var(--text2)',
            border:`1px solid ${period===p?'transparent':'var(--border)'}`, cursor:'pointer',
          }}>
            {p==='week'?'This Week':p==='month'?'This Month':'Custom Range'}
          </button>
        ))}
        {period==='custom' && (
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{ width:150 }} />
            <span style={{ color:'var(--text3)' }}>→</span>
            <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{ width:150 }} />
            <button className="btn btn-blue" onClick={loadCustom} disabled={loadingCustom} style={{ padding:'8px 16px' }}>
              {loadingCustom ? '...' : 'Load'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {ranked.map((m,i) => {
          const c = COLORS[m.color]||COLORS.blue
          const pct = (m.points/maxPts)*100
          return (
            <div key={m.name} className="card" style={{
              display:'flex', alignItems:'center', gap:16,
              borderColor:i===0?'rgba(245,158,11,0.4)':i===1?'rgba(148,163,184,0.3)':i===2?'rgba(180,120,60,0.3)':'var(--border)',
              boxShadow:i===0?'0 0 30px rgba(245,158,11,0.1)':'none',
              animation:`slideIn 0.3s ease ${i*80}ms both`,
            }}>
              <div style={{ fontSize:28, width:36, textAlign:'center' }}>{medals[i]||<span style={{ color:'var(--text3)',fontSize:16 }}>#{i+1}</span>}</div>
              <div className="avatar" style={{ background:`${c}22`, color:c, border:`1px solid ${c}44` }}>
                {m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>{m.name} <span style={{ fontSize:12, color:'var(--text3)', fontWeight:400 }}>· {m.role}</span></div>
                <div className="progress-bar" style={{ height:4 }}>
                  <div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${c}, ${c}88)` }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:16, textAlign:'right', flexShrink:0 }}>
                {[['Videos',m.videos,'#22d3a5'],['Points',m.points,c],['Days',m.days,'#fbbf24']].map(([lbl,val,col])=>(
                  <div key={lbl}><div style={{ fontSize:20, fontWeight:700, color:col }}>{val}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{lbl}</div></div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReportsView({ weekData, monthData, weekRange, monthRange }) {
  const [period, setPeriod] = useState('week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [customData, setCustomData] = useState([])
  const [generating, setGenerating] = useState(false)

  const logs = period==='custom' ? customData : period==='week' ? weekData : monthData
  const range = period==='week' ? weekRange : period==='month' ? monthRange : { start:customStart, end:customEnd }

  const loadCustom = async () => {
    if (!customStart||!customEnd) return
    try {
      const data = await (await import('../data.js')).getLogsInRange(customStart, customEnd)
      setCustomData(data)
    } catch(e) {}
  }

  const memberStats = TEAM_MEMBERS.map(m => {
    const ml = logs.filter(l=>l.member_name===m.name)
    const pts = ml.reduce((s,l)=>s+(parseFloat(l.total_points)||0),0)
    const vids = ml.reduce((s,l)=>s+(parseInt(l.total_videos)||0),0)
    const days = new Set(ml.map(l=>l.log_date)).size
    const target = WEEKLY_TARGETS[m.role]||14
    return { ...m, pts, vids, days, target, pct:Math.round((pts/target)*100) }
  }).sort((a,b)=>b.pts-a.pts)

  const totalVideos = memberStats.reduce((s,m)=>s+m.vids,0)
  const totalPoints = memberStats.reduce((s,m)=>s+m.pts,0)
  const medals = ['🥇','🥈','🥉']

  const handleDownload = () => {
    setGenerating(true)
    const cmap = { blue:'#6366f1', teal:'#22d3a5', purple:'#8b5cf6', pink:'#ec4899', amber:'#f59e0b' }
    const w = window.open('','_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Elev8 Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Space Grotesk',sans-serif;background:#0a0a14;color:#fff;padding:40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.1)}
    .logo h1{font-size:28px;font-weight:700}.logo span{color:#6366f1}.logo p{color:#64748b;font-size:13px;margin-top:4px}
    .rtitle h2{font-size:18px;color:#f59e0b;text-align:right}.rtitle p{color:#64748b;font-size:13px;text-align:right;margin-top:4px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
    .sc{background:#11151f;border-radius:12px;border:1px solid rgba(255,255,255,0.07);padding:18px}
    .sc .lbl{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:8px}
    .sc .val{font-size:32px;font-weight:700}
    .stitle{font-size:13px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-bottom:16px}
    .mrow{background:#11151f;border-radius:10px;padding:16px 20px;margin-bottom:10px;display:flex;align-items:center;gap:16px}
    .rank{font-size:24px;width:36px}.av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
    .mi{flex:1}.mn{font-weight:700;font-size:15px}.mr{font-size:12px;color:#64748b}
    .pb{height:5px;background:rgba(255,255,255,0.06);border-radius:3px;margin-top:8px}
    .pf{height:100%;border-radius:3px}
    .stats{display:flex;gap:20px;text-align:center}.sv{font-size:20px;font-weight:700}.sl{font-size:11px;color:#64748b}
    .footer{margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.07);display:flex;justify-content:space-between;font-size:12px;color:#475569}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
    <div class="header"><div class="logo"><h1>ELEV<span>8</span> MEDIA</h1><p>Team Report Card</p></div>
    <div class="rtitle"><h2>${period==='week'?'Weekly':period==='month'?'Monthly':'Custom'} Report</h2><p>${range.start} → ${range.end}</p></div></div>
    <div class="grid">
      <div class="sc"><div class="lbl">Total Videos</div><div class="val" style="color:#22d3a5">${totalVideos}</div></div>
      <div class="sc"><div class="lbl">Total Points</div><div class="val" style="color:#f59e0b">${totalPoints}</div></div>
      <div class="sc"><div class="lbl">Top Performer</div><div class="val" style="color:#6366f1;font-size:20px">${memberStats[0]?.name||'-'}</div></div>
      <div class="sc"><div class="lbl">Active Members</div><div class="val" style="color:#ec4899">${memberStats.filter(m=>m.pts>0).length}</div></div>
    </div>
    <div class="stitle">Performance Breakdown</div>
    ${memberStats.map((m,i)=>{
      const c=cmap[m.color]||'#6366f1'
      return `<div class="mrow">
        <div class="rank">${medals[i]||`#${i+1}`}</div>
        <div class="av" style="background:${c}22;color:${c};border:1px solid ${c}44">${m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
        <div class="mi"><div class="mn">${m.name}</div><div class="mr">${m.role}</div>
        <div class="pb"><div class="pf" style="width:${Math.min(m.pct,100)}%;background:${c}"></div></div></div>
        <div class="stats">
          <div><div class="sv" style="color:#22d3a5">${m.vids}</div><div class="sl">Videos</div></div>
          <div><div class="sv" style="color:${c}">${m.pts}</div><div class="sl">Points</div></div>
          <div><div class="sv" style="color:#fbbf24">${m.days}</div><div class="sl">Days</div></div>
          <div><div class="sv" style="color:${m.pct>=80?'#22d3a5':m.pct>=50?'#f59e0b':'#f87171'}">${m.pct}%</div><div class="sl">Target</div></div>
        </div></div>`
    }).join('')}
    <div class="footer"><span>Elev8 Media OPS · V4</span><span>${new Date().toLocaleString()}</span></div>
    </body></html>`)
    w.document.close(); w.focus()
    setTimeout(()=>{ w.print(); setGenerating(false) }, 600)
  }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {['week','month','custom'].map(p=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{
            padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:600,
            background:period===p?'#8b5cf6':'rgba(255,255,255,0.05)',
            color:period===p?'#fff':'var(--text2)',
            border:`1px solid ${period===p?'transparent':'var(--border)'}`, cursor:'pointer',
          }}>
            {p==='week'?'Weekly':p==='month'?'Monthly':'Custom'}
          </button>
        ))}
        {period==='custom' && (
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{ width:150 }} />
            <span style={{ color:'var(--text3)' }}>→</span>
            <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{ width:150 }} />
            <button className="btn btn-blue" onClick={loadCustom} style={{ padding:'8px 16px' }}>Load</button>
          </div>
        )}
        <button className="btn btn-blue" onClick={handleDownload} style={{ marginLeft:'auto' }} disabled={generating}>
          {generating?'⏳ Generating...':'⬇ Download PDF'}
        </button>
      </div>

      {/* Preview */}
      <div className="card" style={{ border:'1px solid rgba(139,92,246,0.3)', boxShadow:'0 0 30px rgba(139,92,246,0.08)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize:22, fontWeight:700 }}>ELEV<span style={{ color:'#6366f1' }}>8</span> MEDIA</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Team Report Card</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'#f59e0b', fontWeight:700 }}>{period==='week'?'Weekly':period==='month'?'Monthly':'Custom'} Report</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>{range.start} → {range.end}</div>
          </div>
        </div>
        <div className="grid-4" style={{ marginBottom:28, gap:12 }}>
          {[['Total Videos',totalVideos,'#22d3a5'],['Total Points',totalPoints,'#f59e0b'],['Top Performer',memberStats[0]?.name?.split(' ')[0]||'-','#6366f1'],['Active',memberStats.filter(m=>m.pts>0).length,'#ec4899']].map(([l,v,c])=>(
            <div key={l} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
              <div className="label" style={{ marginBottom:6 }}>{l}</div>
              <div style={{ fontSize:typeof v==='string'?18:26, fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="label" style={{ marginBottom:16 }}>Performance Breakdown</div>
        {memberStats.map((m,i)=>{
          const c=COLORS[m.color]||COLORS.blue
          return (
            <div key={m.name} style={{ display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.02)', borderRadius:10, padding:'14px 16px', marginBottom:8, borderLeft:`3px solid ${c}` }}>
              <div style={{ fontSize:20, width:28 }}>{medals[i]||`#${i+1}`}</div>
              <div className="avatar" style={{ background:`${c}22`, color:c, width:36, height:36, fontSize:12, border:`1px solid ${c}33`, flexShrink:0 }}>
                {m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{m.name} <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>· {m.role}</span></div>
                <div className="progress-bar" style={{ marginTop:6 }}>
                  <div className="progress-fill" style={{ width:`${Math.min(m.pct,100)}%`, background:c }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:14, textAlign:'center', flexShrink:0 }}>
                {[['Videos',m.vids,'#22d3a5'],['Points',m.pts,c],['Days',m.days,'#fbbf24'],['Target',`${m.pct}%`,m.pct>=80?'#22d3a5':m.pct>=50?'#f59e0b':'#f87171']].map(([l,v,col])=>(
                  <div key={l}><div style={{ fontSize:16, fontWeight:700, color:col }}>{v}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{l}</div></div>
                ))}
              </div>
            </div>
          )
        })}
        <div style={{ marginTop:20, paddingTop:14, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)' }}>
          <span>Elev8 Media OPS · V4</span><span>Generated {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function SettingsView() {
  const [taskTypes, setTaskTypes] = useState(DEFAULT_TASK_TYPES)
  const [targets, setTargets] = useState({ Editor:14, Production:12, Social:10 })
  const [members, setMembers] = useState(TEAM_MEMBERS.map(m=>({...m})))
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('tasks')

  const saveAll = () => {
    localStorage.setItem('elev8_task_types', JSON.stringify(taskTypes))
    localStorage.setItem('elev8_targets', JSON.stringify(targets))
    localStorage.setItem('elev8_members', JSON.stringify(members))
    setSaved(true)
    setTimeout(()=>setSaved(false),3000)
  }

  const updateTask = (i, field, val) => {
    const updated = [...taskTypes]
    updated[i] = { ...updated[i], [field]: field==='points'||field==='videos' ? parseFloat(val)||0 : val }
    setTaskTypes(updated)
  }

  const addTask = () => {
    setTaskTypes([...taskTypes, { id:`task_${Date.now()}`, label:'New Task', points:1, videos:1, color:'blue' }])
  }

  const removeTask = (i) => setTaskTypes(taskTypes.filter((_,idx)=>idx!==i))

  const sections = [
    { id:'tasks', label:'Task Types & Points' },
    { id:'targets', label:'Weekly Targets' },
    { id:'members', label:'Team Members' },
  ]

  return (
    <div>
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--card)', borderRadius:10, padding:4, width:'fit-content' }}>
        {sections.map(s=>(
          <button key={s.id} onClick={()=>setActiveSection(s.id)} style={{
            padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600,
            background:activeSection===s.id?'rgba(99,102,241,0.3)':'transparent',
            color:activeSection===s.id?'#818cf8':'var(--text2)',
            border:'none', cursor:'pointer',
          }}>{s.label}</button>
        ))}
      </div>

      {activeSection==='tasks' && (
        <div className="card blue">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <div className="label" style={{ marginBottom:4 }}>Task Types & Points</div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>Edit task names, point values and whether they count as videos</div>
            </div>
            <button className="btn btn-blue" onClick={addTask} style={{ padding:'8px 14px' }}>+ Add Task</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 80px 32px', gap:8, padding:'0 4px' }}>
              {['Task Name','Points','Videos','Color',''].map(h=>(
                <div key={h} className="label">{h}</div>
              ))}
            </div>
            {taskTypes.map((t,i)=>(
              <div key={t.id||i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 80px 32px', gap:8, alignItems:'center' }}>
                <input value={t.label} onChange={e=>updateTask(i,'label',e.target.value)} style={{ fontSize:13 }} />
                <input type="number" value={t.points} min="0" step="0.5" onChange={e=>updateTask(i,'points',e.target.value)} style={{ textAlign:'center' }} />
                <input type="number" value={t.videos} min="0" max="1" onChange={e=>updateTask(i,'videos',e.target.value)} style={{ textAlign:'center' }} />
                <select value={t.color} onChange={e=>updateTask(i,'color',e.target.value)}>
                  {['blue','teal','purple','pink','amber','gray'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={()=>removeTask(i)} style={{ color:'#f87171', background:'none', border:'none', fontSize:18, cursor:'pointer' }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection==='targets' && (
        <div className="card amber">
          <div className="label" style={{ marginBottom:4 }}>Weekly Point Targets</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>Set weekly point goals per role</div>
          {Object.entries(targets).map(([role, target])=>(
            <div key={role} style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16, padding:'14px 16px', background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, marginBottom:2 }}>{role}</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>
                  {role==='Editor'?'Abhijot, Narsi, Param, Vansh':role==='Production'?'Narpat':'Vansh Verma'}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ color:'var(--text2)', fontSize:13 }}>Weekly target:</span>
                <input
                  type="number" value={target} min="1" max="100"
                  onChange={e=>setTargets({...targets,[role]:parseInt(e.target.value)||1})}
                  style={{ width:70, textAlign:'center', fontSize:18, fontWeight:700, color:'#f59e0b' }}
                />
                <span style={{ color:'var(--text3)', fontSize:13 }}>points</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection==='members' && (
        <div className="card teal">
          <div className="label" style={{ marginBottom:4 }}>Team Members</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:20 }}>Edit names and roles</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {members.map((m,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 120px 100px', gap:10, alignItems:'center', padding:'12px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
                <input value={m.name} onChange={e=>{ const u=[...members]; u[i]={...u[i],name:e.target.value}; setMembers(u) }} style={{ fontWeight:600 }} />
                <select value={m.role} onChange={e=>{ const u=[...members]; u[i]={...u[i],role:e.target.value}; setMembers(u) }}>
                  {['Editor','Production','Social','Manager'].map(r=><option key={r}>{r}</option>)}
                </select>
                <select value={m.color} onChange={e=>{ const u=[...members]; u[i]={...u[i],color:e.target.value}; setMembers(u) }}>
                  {['blue','teal','purple','pink','amber'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20, gap:12, alignItems:'center' }}>
        {saved && <span style={{ color:'#22d3a5', fontSize:13 }}>✅ Settings saved!</span>}
        <button className="btn btn-teal" onClick={saveAll}>Save All Settings</button>
      </div>
      <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(245,158,11,0.06)', borderRadius:8, fontSize:12, color:'#fbbf24', border:'1px solid rgba(245,158,11,0.15)' }}>
        ⚠️ Settings are saved locally for now. A future update will sync them across all devices.
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card" style={{ borderColor:`${color}33`, padding:'16px 20px' }}>
      <div className="label" style={{ marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color }}>{icon} {value}</div>
    </div>
  )
}
