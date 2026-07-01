import React, { useState, useEffect, useRef } from 'react'
import { TEAM_MEMBERS, WEEKLY_TARGETS } from '../config.js'
import { getTodayLogsAllMembers, getLogsInRange, getWeekRange, getMonthRange, aggregateStats, getMemberDateStr } from '../data.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const COLORS = { blue: '#6366f1', teal: '#22d3a5', amber: '#f59e0b', pink: '#ec4899', purple: '#8b5cf6' }

export default function ManagerPortal({ onLock }) {
  const [tab, setTab] = useState('today')
  const [todayData, setTodayData] = useState({})
  const [weekData, setWeekData] = useState([])
  const [monthData, setMonthData] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportRange, setReportRange] = useState('week')

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
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const tabs = [
    { id: 'today', label: '📅 Today' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
    { id: 'reports', label: '📋 Reports' },
  ]

  // Build member stats
  const getMemberStats = (logs, memberName) => {
    const ml = logs.filter(l => l.member_name === memberName)
    return aggregateStats(ml)
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Manager Control</span>
          </div>
          <h1 className="page-title">Operations <span style={{ color: '#f59e0b' }}>Hub</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={loadAll}>↻ Refresh</button>
          <button className="btn btn-ghost" onClick={onLock}>🔒 Lock</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--card)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: tab === t.id ? '#f59e0b' : 'transparent',
            color: tab === t.id ? '#000' : 'var(--text2)',
            transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⟳</div>Loading data...
        </div>
      ) : (
        <>
          {tab === 'today' && <TodayView todayData={todayData} weekData={weekData} />}
          {tab === 'analytics' && <AnalyticsView weekData={weekData} monthData={monthData} weekRange={weekRange} monthRange={monthRange} />}
          {tab === 'leaderboard' && <LeaderboardView weekData={weekData} monthData={monthData} />}
          {tab === 'reports' && <ReportsView weekData={weekData} monthData={monthData} weekRange={weekRange} monthRange={monthRange} />}
        </>
      )}
    </div>
  )
}

function TodayView({ todayData, weekData }) {
  const weekRange = getWeekRange()

  const totalTodayPoints = Object.values(todayData).reduce((s, d) => {
    return s + d.logs.reduce((ss, l) => ss + (l.total_points || 0), 0)
  }, 0)

  const totalTodayVideos = Object.values(todayData).reduce((s, d) => {
    return s + d.logs.reduce((ss, l) => ss + (l.total_videos || 0), 0)
  }, 0)

  const submitted = Object.values(todayData).filter(d => d.logs.length > 0).length
  const pending = TEAM_MEMBERS.filter(m => !todayData[m.name]?.logs?.length)

  return (
    <div>
      {/* Top Stats */}
      <div className="grid-4" style={{ marginBottom: 24, gap: 16 }}>
        <StatCard label="Videos Today" value={totalTodayVideos} color="#22d3a5" icon="🎬" />
        <StatCard label="Points Today" value={totalTodayPoints} color="#f59e0b" icon="⭐" />
        <StatCard label="Submitted" value={`${submitted}/${TEAM_MEMBERS.length}`} color="#6366f1" icon="✅" />
        <StatCard label="Pending" value={pending.length} color={pending.length > 0 ? '#ec4899' : '#22d3a5'} icon="⏳" />
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#fbbf24' }}>
          ⚠️ Not submitted yet: {pending.map(m => m.name).join(', ')}
        </div>
      )}

      {/* Team Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {TEAM_MEMBERS.map(m => {
          const memberData = todayData[m.name] || { logs: [] }
          const logs = memberData.logs || []
          const pts = logs.reduce((s, l) => s + (l.total_points || 0), 0)
          const vids = logs.reduce((s, l) => s + (l.total_videos || 0), 0)
          const myWeekLogs = weekData.filter(l => l.member_name === m.name)
          const weekPts = myWeekLogs.reduce((s, l) => s + (l.total_points || 0), 0)
          const weekTarget = WEEKLY_TARGETS[m.role] || 14
          const weekProg = Math.min((weekPts / weekTarget) * 100, 100)
          const hasLogged = logs.length > 0
          const accentColor = COLORS[m.color] || COLORS.blue

          return (
            <div key={m.name} className="card" style={{
              borderColor: hasLogged ? `${accentColor}44` : 'rgba(255,255,255,0.05)',
              boxShadow: hasLogged ? `0 0 20px ${accentColor}11` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div className="avatar" style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}>
                  {m.name.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.role}</div>
                </div>
                <span className={`badge ${hasLogged ? 'green' : 'gray'}`}>
                  {hasLogged ? '✓ Done' : 'Pending'}
                </span>
              </div>

              {hasLogged ? (
                <>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Videos</div><div style={{ fontSize: 22, fontWeight: 700, color: '#22d3a5' }}>{vids}</div></div>
                    <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Points</div><div style={{ fontSize: 22, fontWeight: 700, color: accentColor }}>{pts}</div></div>
                    <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Entries</div><div style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24' }}>{logs.length}</div></div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {logs.flatMap(l => l.tasks || []).map((t, i) => (
                      <span key={i} className="badge gray" style={{ fontSize: 10 }}>{t.label}</span>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>Awaiting log...</div>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                  <span>Week: {weekPts}/{weekTarget} pts</span>
                  <span>{Math.round(weekProg)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${weekProg}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)` }} />
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
  // Build daily chart data for the week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekChartData = days.map((day, i) => {
    const dateObj = new Date(weekRange.start)
    dateObj.setDate(dateObj.getDate() + i)
    const dateStr = dateObj.toISOString().slice(0, 10)
    const dayLogs = weekData.filter(l => l.log_date === dateStr)
    return {
      day,
      videos: dayLogs.reduce((s, l) => s + (l.total_videos || 0), 0),
      points: dayLogs.reduce((s, l) => s + (l.total_points || 0), 0),
    }
  })

  // Member breakdown for week
  const memberWeekStats = TEAM_MEMBERS.map(m => {
    const logs = weekData.filter(l => l.member_name === m.name)
    const pts = logs.reduce((s, l) => s + (l.total_points || 0), 0)
    const vids = logs.reduce((s, l) => s + (l.total_videos || 0), 0)
    const target = WEEKLY_TARGETS[m.role] || 14
    return { name: m.name.split(' ')[0], pts, vids, target, pct: Math.round((pts / target) * 100), color: COLORS[m.color] || COLORS.blue }
  }).sort((a, b) => b.pts - a.pts)

  const totalWeekVideos = weekData.reduce((s, l) => s + (l.total_videos || 0), 0)
  const totalWeekPoints = weekData.reduce((s, l) => s + (l.total_points || 0), 0)
  const totalMonthVideos = monthData.reduce((s, l) => s + (l.total_videos || 0), 0)
  const totalMonthPoints = monthData.reduce((s, l) => s + (l.total_points || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top stats */}
      <div className="grid-4" style={{ gap: 16 }}>
        <StatCard label="Week Videos" value={totalWeekVideos} color="#22d3a5" icon="🎬" />
        <StatCard label="Week Points" value={totalWeekPoints} color="#f59e0b" icon="⭐" />
        <StatCard label="Month Videos" value={totalMonthVideos} color="#8b5cf6" icon="🎬" />
        <StatCard label="Month Points" value={totalMonthPoints} color="#ec4899" icon="⭐" />
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ gap: 20 }}>
        {/* Daily output chart */}
        <div className="card amber">
          <div className="label" style={{ marginBottom: 4 }}>Daily Output This Week</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>{weekRange.start} → {weekRange.end}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#11151f', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="videos" fill="#22d3a5" radius={[4,4,0,0]} name="Videos" />
              <Bar dataKey="points" fill="#f59e0b" radius={[4,4,0,0]} name="Points" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Member breakdown */}
        <div className="card blue">
          <div className="label" style={{ marginBottom: 16 }}>Team Output This Week</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {memberWeekStats.map(m => (
              <div key={m.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span style={{ color: 'var(--text2)' }}>{m.pts}/{m.target} pts · {m.vids} vids</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(m.pct, 100)}%`, background: `linear-gradient(90deg, ${m.color}, ${m.color}88)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaderboardView({ weekData, monthData }) {
  const [period, setPeriod] = useState('month')
  const logs = period === 'week' ? weekData : monthData

  const ranked = TEAM_MEMBERS.map(m => {
    const ml = logs.filter(l => l.member_name === m.name)
    return {
      ...m,
      points: ml.reduce((s, l) => s + (l.total_points || 0), 0),
      videos: ml.reduce((s, l) => s + (l.total_videos || 0), 0),
      days: new Set(ml.map(l => l.log_date)).size,
    }
  }).sort((a, b) => b.points - a.points)

  const medals = ['🥇', '🥈', '🥉']
  const maxPts = ranked[0]?.points || 1

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['week', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: period === p ? '#ec4899' : 'rgba(255,255,255,0.05)',
            color: period === p ? '#fff' : 'var(--text2)',
            border: '1px solid ' + (period === p ? 'transparent' : 'var(--border)'),
            cursor: 'pointer',
          }}>
            {p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ranked.map((m, i) => {
          const accentColor = COLORS[m.color] || COLORS.blue
          const pct = (m.points / maxPts) * 100
          return (
            <div key={m.name} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 16,
              borderColor: i === 0 ? 'rgba(245,158,11,0.4)' : i === 1 ? 'rgba(148,163,184,0.3)' : i === 2 ? 'rgba(180,120,60,0.3)' : 'var(--border)',
              boxShadow: i === 0 ? '0 0 30px rgba(245,158,11,0.1)' : 'none',
              animation: `slideIn 0.3s ease ${i * 80}ms both`,
            }}>
              <div style={{ fontSize: 28, width: 36, textAlign: 'center' }}>
                {medals[i] || <span style={{ color: 'var(--text3)', fontSize: 16 }}>#{i+1}</span>}
              </div>
              <div className="avatar" style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}>
                {m.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.name} <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>· {m.role}</span></div>
                <div className="progress-bar" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, textAlign: 'right' }}>
                <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Videos</div><div style={{ fontSize: 20, fontWeight: 700, color: '#22d3a5' }}>{m.videos}</div></div>
                <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Points</div><div style={{ fontSize: 20, fontWeight: 700, color: accentColor }}>{m.points}</div></div>
                <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Days</div><div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{m.days}</div></div>
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
  const [generating, setGenerating] = useState(false)
  const reportRef = useRef()

  const logs = period === 'week' ? weekData : monthData
  const range = period === 'week' ? weekRange : monthRange

  const memberStats = TEAM_MEMBERS.map(m => {
    const ml = logs.filter(l => l.member_name === m.name)
    const pts = ml.reduce((s, l) => s + (l.total_points || 0), 0)
    const vids = ml.reduce((s, l) => s + (l.total_videos || 0), 0)
    const days = new Set(ml.map(l => l.log_date)).size
    const target = WEEKLY_TARGETS[m.role] || 14
    const pct = Math.round((pts / target) * 100)
    return { ...m, pts, vids, days, target, pct }
  }).sort((a, b) => b.pts - a.pts)

  const totalVideos = memberStats.reduce((s, m) => s + m.vids, 0)
  const totalPoints = memberStats.reduce((s, m) => s + m.pts, 0)
  const topPerformer = memberStats[0]

  const handleDownload = async () => {
    setGenerating(true)
    // Open print dialog for PDF
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Elev8 Media Team Report — ${range.start} to ${range.end}</title>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Space Grotesk', sans-serif; background: #0a0a14; color: #fff; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .logo-area h1 { font-size: 28px; font-weight: 700; }
            .logo-area h1 span { color: #6366f1; }
            .logo-area p { color: #64748b; font-size: 13px; margin-top: 4px; }
            .report-title { text-align: right; }
            .report-title h2 { font-size: 18px; color: #f59e0b; }
            .report-title p { color: #64748b; font-size: 13px; margin-top: 4px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
            .stat-card { background: #11151f; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); padding: 18px; }
            .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px; }
            .stat-value { font-size: 32px; font-weight: 700; }
            .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 16px; }
            .member-row { background: #11151f; border-radius: 10px; padding: 16px 20px; margin-bottom: 10px; display: flex; align-items: center; gap: 16px; }
            .rank { font-size: 24px; width: 36px; }
            .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
            .member-info { flex: 1; }
            .member-name { font-weight: 700; font-size: 15px; }
            .member-role { font-size: 12px; color: #64748b; }
            .progress-bar { height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; margin-top: 8px; }
            .progress-fill { height: 100%; border-radius: 3px; }
            .stats { display: flex; gap: 20px; text-align: center; }
            .stat-item .val { font-size: 20px; font-weight: 700; }
            .stat-item .lbl { font-size: 11px; color: #64748b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; font-size: 12px; color: #475569; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
              <h1>ELEV<span>8</span> MEDIA</h1>
              <p>Team Report Card</p>
            </div>
            <div class="report-title">
              <h2>${period === 'week' ? 'Weekly Report' : 'Monthly Report'}</h2>
              <p>${range.start} → ${range.end}</p>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card"><div class="stat-label">Total Videos</div><div class="stat-value" style="color:#22d3a5">${totalVideos}</div></div>
            <div class="stat-card"><div class="stat-label">Total Points</div><div class="stat-value" style="color:#f59e0b">${totalPoints}</div></div>
            <div class="stat-card"><div class="stat-label">Top Performer</div><div class="stat-value" style="color:#6366f1;font-size:22px">${topPerformer?.name || '-'}</div></div>
            <div class="stat-card"><div class="stat-label">Team Members</div><div class="stat-value" style="color:#ec4899">${TEAM_MEMBERS.length}</div></div>
          </div>

          <div class="section-title">Team Performance Breakdown</div>
          ${memberStats.map((m, i) => {
            const colors = { blue:'#6366f1', teal:'#22d3a5', purple:'#8b5cf6', pink:'#ec4899', amber:'#f59e0b' }
            const c = colors[m.color] || '#6366f1'
            const medals = ['🥇','🥈','🥉']
            return `
              <div class="member-row">
                <div class="rank">${medals[i] || `#${i+1}`}</div>
                <div class="avatar" style="background:${c}22;color:${c};border:1px solid ${c}44">${m.name.slice(0,2).toUpperCase()}</div>
                <div class="member-info">
                  <div class="member-name">${m.name}</div>
                  <div class="member-role">${m.role}</div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(m.pct,100)}%;background:${c}"></div></div>
                </div>
                <div class="stats">
                  <div class="stat-item"><div class="val" style="color:#22d3a5">${m.vids}</div><div class="lbl">Videos</div></div>
                  <div class="stat-item"><div class="val" style="color:${c}">${m.pts}</div><div class="lbl">Points</div></div>
                  <div class="stat-item"><div class="val" style="color:#fbbf24">${m.days}</div><div class="lbl">Days</div></div>
                  <div class="stat-item"><div class="val" style="color:${m.pct>=80?'#22d3a5':m.pct>=50?'#f59e0b':'#f87171'}">${m.pct}%</div><div class="lbl">Target</div></div>
                </div>
              </div>
            `
          }).join('')}

          <div class="footer">
            <span>Generated by Elev8 Media OPS System · V4</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); setGenerating(false) }, 500)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {['week', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: period === p ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
            color: period === p ? '#fff' : 'var(--text2)',
            border: '1px solid ' + (period === p ? 'transparent' : 'var(--border)'),
            cursor: 'pointer',
          }}>
            {p === 'week' ? 'Weekly Report' : 'Monthly Report'}
          </button>
        ))}
        <button className="btn btn-blue" onClick={handleDownload} style={{ marginLeft: 'auto' }} disabled={generating}>
          {generating ? 'Generating...' : '⬇ Download PDF'}
        </button>
      </div>

      {/* Preview */}
      <div ref={reportRef} className="card" style={{ border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 30px rgba(139,92,246,0.08)' }}>
        {/* Report Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>ELEV<span style={{ color: '#6366f1' }}>8</span> MEDIA</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Team Report Card</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700 }}>{period === 'week' ? 'Weekly Report' : 'Monthly Report'}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{range.start} → {range.end}</div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid-4" style={{ marginBottom: 28, gap: 12 }}>
          <ReportStat label="Total Videos" value={totalVideos} color="#22d3a5" />
          <ReportStat label="Total Points" value={totalPoints} color="#f59e0b" />
          <ReportStat label="Top Performer" value={topPerformer?.name?.split(' ')[0] || '-'} color="#6366f1" isText />
          <ReportStat label="Active Members" value={memberStats.filter(m => m.pts > 0).length} color="#ec4899" />
        </div>

        {/* Member breakdown */}
        <div className="label" style={{ marginBottom: 16 }}>Performance Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {memberStats.map((m, i) => {
            const c = COLORS[m.color] || COLORS.blue
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={m.name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '14px 16px',
                borderLeft: `3px solid ${c}`,
              }}>
                <div style={{ fontSize: 20, width: 28 }}>{medals[i] || `#${i+1}`}</div>
                <div className="avatar" style={{ background: `${c}22`, color: c, width: 36, height: 36, fontSize: 12, border: `1px solid ${c}33` }}>
                  {m.name.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name} <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>· {m.role}</span></div>
                  <div className="progress-bar" style={{ marginTop: 6 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(m.pct, 100)}%`, background: c }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                  {[['Videos', m.vids, '#22d3a5'], ['Points', m.pts, c], ['Days', m.days, '#fbbf24'], ['Target', `${m.pct}%`, m.pct >= 80 ? '#22d3a5' : m.pct >= 50 ? '#f59e0b' : '#f87171']].map(([lbl, val, col]) => (
                    <div key={lbl}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{val}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
          <span>Elev8 Media OPS · V4</span>
          <span>Generated {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card" style={{ borderColor: `${color}33`, padding: '16px 20px' }}>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color }}>{icon} {value}</div>
    </div>
  )
}

function ReportStat({ label, value, color, isText }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: isText ? 18 : 26, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
