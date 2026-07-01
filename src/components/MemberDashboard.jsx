import React, { useState, useEffect } from 'react'
import { DEFAULT_TASK_TYPES, WEEKLY_TARGETS } from '../config.js'
import { submitLog, getMemberLogsForDate, getMemberDateStr, getWeekRange, getMonthRange, getLogsInRange, aggregateStats } from '../data.js'
import { fetchMemberTasks, getTaskStatusColor, formatDueDate, MEMBER_LIST_IDS } from '../clickup.js'

const COLOR_MAP = {
  blue: '#6366f1', teal: '#22d3a5', purple: '#8b5cf6',
  pink: '#ec4899', amber: '#f59e0b', gray: '#64748b',
}

export default function MemberDashboard({ member, onBack }) {
  const [tab, setTab] = useState('log')
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [todayLogs, setTodayLogs] = useState([])
  const [weekStats, setWeekStats] = useState(null)
  const [monthStats, setMonthStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTask, setSelectedTask] = useState('')
  const [taskCount, setTaskCount] = useState(1)
  const [clickupTasks, setClickupTasks] = useState([])
  const [clickupLoading, setClickupLoading] = useState(false)
  const hasClickup = !!MEMBER_LIST_IDS[member.name]

  const dateStr = getMemberDateStr(member.name)
  const weekRange = getWeekRange()
  const monthRange = getMonthRange()
  const weeklyTarget = WEEKLY_TARGETS[member.role] || 14

  useEffect(() => {
    loadData()
    loadClickup()
  }, [member.name])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [todayData, weekData, monthData] = await Promise.all([
        getMemberLogsForDate(member.name, dateStr),
        getLogsInRange(weekRange.start, weekRange.end),
        getLogsInRange(monthRange.start, monthRange.end),
      ])
      setTodayLogs(todayData)
      const myWeekLogs = weekData.filter(l => l.member_name === member.name)
      const myMonthLogs = monthData.filter(l => l.member_name === member.name)
      setWeekStats(aggregateStats(myWeekLogs))
      setMonthStats(aggregateStats(myMonthLogs))
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const loadClickup = async () => {
    if (!MEMBER_LIST_IDS[member.name]) return
    setClickupLoading(true)
    try {
      const tasks = await fetchMemberTasks(member.name)
      setClickupTasks(tasks)
    } catch(e) { console.warn(e) }
    setClickupLoading(false)
  }

  // FIX Bug 2: proper handler using event value directly
  const handleTaskSelect = (e) => {
    setSelectedTask(e.target.value)
  }

  const addTask = () => {
    if (!selectedTask) return
    const taskType = DEFAULT_TASK_TYPES.find(t => t.id === selectedTask)
    if (!taskType) return
    const count = parseInt(taskCount) || 1
    const newTasks = []
    for (let i = 0; i < count; i++) {
      newTasks.push({ ...taskType, uid: Date.now() + i })
    }
    setTasks(prev => [...prev, ...newTasks])
    setSelectedTask('')
    setTaskCount(1)
  }

  const removeTask = (uid) => setTasks(prev => prev.filter(t => t.uid !== uid))

  const totalPoints = tasks.reduce((s, t) => s + (parseFloat(t.points) || 0), 0)
  const totalVideos = tasks.reduce((s, t) => s + (parseInt(t.videos) || 0), 0)

  const handleSubmit = async () => {
    if (tasks.length === 0 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await submitLog(member.name, tasks, notes)
      setSubmitted(true)
      setTasks([])
      setNotes('')
      await loadData()
      setTimeout(() => setSubmitted(false), 3000)
    } catch (e) {
      setError(e.message)
    }
    setSubmitting(false)
  }

  const accentColor = COLOR_MAP[member.color] || COLOR_MAP.blue
  const todayPoints = todayLogs.reduce((s, l) => s + (parseFloat(l.total_points) || 0), 0)
  const todayVideos = todayLogs.reduce((s, l) => s + (parseInt(l.total_videos) || 0), 0)
  const weekPts = weekStats ? weekStats.totalPoints : 0
  const weekProgress = Math.min((weekPts / weeklyTarget) * 100, 100)

  const tabs = hasClickup ? ['log', 'today', 'stats', 'tasks'] : ['log', 'today', 'stats']
  const tabLabels = { log: '+ Log Work', today: "Today's Activity", stats: 'My Stats', tasks: '📋 My Tasks' }

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 14px' }}>← Back</button>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: accentColor, flexShrink: 0,
        }}>
          {member.name.slice(0,2).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{member.name}</h1>
          <span className={`badge ${member.color}`}>{member.role}</span>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{dateStr}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{member.name === 'Narpat' ? 'EST' : 'IST'}</div>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid-3" style={{ marginBottom: 24, gap: 12 }}>
        <StatCard label="Today Videos" value={todayVideos} color={accentColor} suffix="🎬" />
        <StatCard label="Today Points" value={todayPoints} color={accentColor} suffix="⭐" />
        <StatCard label="Week Progress" value={`${Math.round(weekProgress)}%`} color={accentColor} progress={weekProgress} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--card)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: tab === t ? accentColor : 'transparent',
            color: tab === t ? '#fff' : 'var(--text2)',
            transition: 'all 0.2s', border: 'none', cursor: 'pointer',
          }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Log Work Tab */}
      {tab === 'log' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card blue">
            <div className="label" style={{ marginBottom: 16 }}>Add Tasks</div>

            {/* FIX Bug 2: use onChange with handleTaskSelect */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select
                value={selectedTask}
                onChange={handleTaskSelect}
                style={{ flex: 1 }}
              >
                <option value="">Select task type...</option>
                {DEFAULT_TASK_TYPES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label} — {t.points}pts{t.videos > 0 ? ` · 🎬` : ''}
                  </option>
                ))}
              </select>
              <input
                type="number" min="1" max="20"
                value={taskCount}
                onChange={e => setTaskCount(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 60 }}
              />
              <button
                className="btn btn-blue"
                onClick={addTask}
                disabled={!selectedTask}
                style={{ padding: '10px 16px', opacity: selectedTask ? 1 : 0.5 }}
              >
                +
              </button>
            </div>

            {/* Task list */}
            {tasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {tasks.map(t => (
                  <div key={t.uid} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px',
                    borderLeft: `3px solid ${COLOR_MAP[t.color] || '#6366f1'}`,
                  }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{t.label}</span>
                    <span className={`badge ${t.color || 'blue'}`}>{t.points}pts</span>
                    {t.videos > 0 && <span className="badge teal">🎬</span>}
                    <button
                      onClick={() => removeTask(t.uid)}
                      style={{ color: '#f87171', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes (optional) — client names, special tasks..."
              style={{ height: 80, resize: 'vertical', marginBottom: 16 }}
            />

            {/* Summary before submit */}
            {tasks.length > 0 && (
              <div style={{
                background: 'rgba(99,102,241,0.1)', borderRadius: 10, padding: '12px 16px',
                marginBottom: 16, display: 'flex', gap: 24,
              }}>
                <div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>Videos</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#22d3a5' }}>{totalVideos}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>Points</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#818cf8' }}>{totalPoints}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>Tasks</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{tasks.length}</div>
                </div>
              </div>
            )}

            {submitted && (
              <div style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#22d3a5', fontSize: 13 }}>
                ✅ Log submitted! Check Today's Activity to verify.
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#f87171', fontSize: 13 }}>
                ❌ {error}
              </div>
            )}

            {/* FIX Bug 5: disabled when no tasks */}
            <button
              className={tasks.length > 0 ? 'btn btn-teal' : 'btn btn-ghost'}
              onClick={handleSubmit}
              disabled={tasks.length === 0 || submitting}
              style={{
                width: '100%', justifyContent: 'center',
                opacity: tasks.length === 0 ? 0.4 : 1,
                cursor: tasks.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '⏳ Submitting...' : tasks.length === 0 ? 'Add tasks above first' : `✓ Submit ${tasks.length} Task${tasks.length !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Point Reference */}
          <div className="card">
            <div className="label" style={{ marginBottom: 16 }}>Point Reference</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {DEFAULT_TASK_TYPES.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: selectedTask === t.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                    transition: 'background 0.15s',
                    border: selectedTask === t.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_MAP[t.color] || '#6366f1', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{t.label}</span>
                  <span style={{ color: COLOR_MAP[t.color] || '#6366f1', fontWeight: 700, fontSize: 13 }}>{t.points}pts</span>
                  {t.videos > 0 && <span style={{ color: '#22d3a5', fontSize: 12 }}>🎬</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
              💡 Click any task above to select it, or use the dropdown
            </div>
          </div>
        </div>
      )}

      {/* Today Tab */}
      {tab === 'today' && (
        <div>
          {loading ? <LoadingState /> : todayLogs.length === 0 ? (
            <EmptyState message="No logs submitted today yet. Go to Log Work to add your tasks." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todayLogs.map((log, i) => (
                <LogEntry key={log.id} log={log} index={i} accentColor={accentColor} />
              ))}
              <div className="card" style={{ background: 'rgba(34,211,165,0.06)', borderColor: 'rgba(34,211,165,0.2)' }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div><div className="label">Total Videos</div><div style={{ fontSize: 28, fontWeight: 700, color: '#22d3a5' }}>{todayVideos}</div></div>
                  <div><div className="label">Total Points</div><div style={{ fontSize: 28, fontWeight: 700, color: '#818cf8' }}>{todayPoints}</div></div>
                  <div><div className="label">Log Entries</div><div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{todayLogs.length}</div></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ClickUp Tasks Tab */}
      {tab === 'tasks' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>Your ClickUp Tasks</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Tasks assigned to you in the Editors space</div>
            </div>
            <button className="btn btn-ghost" onClick={loadClickup} style={{ padding:'6px 12px', fontSize:12 }}>↻ Refresh</button>
          </div>
          {clickupLoading ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text2)' }}>Loading your tasks...</div>
          ) : clickupTasks.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--text2)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <div>No open tasks — you're all caught up!</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {clickupTasks.map((task, i) => {
                const statusColor = getTaskStatusColor(task.status?.status)
                const due = formatDueDate(task.due_date)
                return (
                  <div key={task.id} style={{
                    background:'var(--card2)', borderRadius:12, padding:'14px 16px',
                    border:`1px solid rgba(255,255,255,0.06)`,
                    borderLeft:`3px solid ${statusColor}`,
                    animation:`slideIn 0.3s ease ${i*60}ms both`,
                  }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:14, marginBottom:6, lineHeight:1.3 }}>{task.name}</div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          <span style={{
                            background:`${statusColor}22`, color:statusColor,
                            border:`1px solid ${statusColor}44`,
                            padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, textTransform:'uppercase',
                          }}>{task.status?.status || 'open'}</span>
                          {due && (
                            <span style={{
                              background:`${due.color}15`, color:due.color,
                              border:`1px solid ${due.color}30`,
                              padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                            }}>{due.label}</span>
                          )}
                          {task.priority?.priority && task.priority.priority !== 'normal' && (
                            <span style={{
                              background:'rgba(239,68,68,0.1)', color:'#f87171',
                              border:'1px solid rgba(239,68,68,0.2)',
                              padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                            }}>⚡ {task.priority.priority}</span>
                          )}
                        </div>
                      </div>
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background:'rgba(99,102,241,0.15)', color:'#818cf8',
                          border:'1px solid rgba(99,102,241,0.3)',
                          padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600,
                          textDecoration:'none', flexShrink:0, whiteSpace:'nowrap',
                        }}
                      >
                        Open ↗
                      </a>
                    </div>
                  </div>
                )
              })}
              <div style={{ textAlign:'center', padding:'12px 0', fontSize:12, color:'var(--text3)' }}>
                {clickupTasks.length} task{clickupTasks.length!==1?'s':''} · Click "Open" to view in ClickUp
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card amber">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>This Week</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{weekRange.start} → {weekRange.end}</div>
              </div>
              <span className="badge amber">{weekStats?.days.size || 0} days logged</span>
            </div>
            <div className="grid-3" style={{ gap: 12, marginBottom: 16 }}>
              <MiniStat label="Videos" value={weekStats?.totalVideos || 0} color="#22d3a5" />
              <MiniStat label="Points" value={weekStats?.totalPoints || 0} color="#f59e0b" />
              <MiniStat label="Target" value={`${Math.round(weekProgress)}%`} color="#a78bfa" />
            </div>
            <div className="label" style={{ marginBottom: 6 }}>Weekly target ({weeklyTarget} pts)</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${weekProgress}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
            </div>
          </div>

          <div className="card purple">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>This Month</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{monthRange.start} → {monthRange.end}</div>
              </div>
              <span className="badge purple">{monthStats?.days.size || 0} days logged</span>
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <MiniStat label="Videos" value={monthStats?.totalVideos || 0} color="#22d3a5" />
              <MiniStat label="Points" value={monthStats?.totalPoints || 0} color="#a78bfa" />
              <MiniStat label="Avg/Day" value={monthStats?.days.size ? (monthStats.totalPoints / monthStats.days.size).toFixed(1) : 0} color="#f472b6" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, suffix, progress }) {
  return (
    <div className="card" style={{ borderColor: `${color}33`, padding: '16px 20px' }}>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, marginBottom: progress !== undefined ? 10 : 0 }}>
        {value}{suffix && <span style={{ fontSize: 18, marginLeft: 6 }}>{suffix}</span>}
      </div>
      {progress !== undefined && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: color }} />
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function LogEntry({ log, index, accentColor }) {
  const time = log.submitted_at
    ? new Date(log.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : ''
  return (
    <div className="card" style={{ animation: `slideIn 0.3s ease ${index * 80}ms both`, borderLeft: `3px solid ${accentColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge teal">🎬 {log.total_videos} videos</span>
          <span className="badge blue">⭐ {log.total_points} pts</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>{time}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(log.tasks || []).map((t, i) => (
          <span key={i} className="badge gray" style={{ fontSize: 11 }}>{t.label}</span>
        ))}
      </div>
      {log.notes && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          📝 {log.notes}
        </div>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
      <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse 1s infinite' }}>⟳</div>
      Loading your data...
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
      <div>{message}</div>
    </div>
  )
}
