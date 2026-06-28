import { useState, useEffect } from 'react'
import { C, Card, MetricCard, Badge, Btn, ProgressBar, ProgressRing, Input, Select, Skeleton, Divider, SectionHeader } from './ui.jsx'
import { loadDayLogs, loadRangeLogs, getTeamMembers, getSettings, saveSettings, clearSettingsCache, addTeamMember, updateTeamMember, deleteTeamMember, getTaskTypesForRole } from '../lib/supabase.js'
import { MANAGER_PASSWORD, getWeekDates, getMonthDates, DAY_NAMES, todayStr, fmtDate, fmtShort } from '../lib/config.js'

// ── Password gate ──────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pass, setPass] = useState('')
  const [err,  setErr]  = useState('')
  function attempt() { pass === MANAGER_PASSWORD ? onAuth() : setErr('Incorrect password.') }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 320 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>Manager Access</div>
          <div style={{ fontSize: 13, color: C.text3 }}>Guri · Gurjinder · SMM lead only</div>
        </div>
        <Card accent>
          <Input type="password" placeholder="Enter password" value={pass}
            onChange={e => setPass(e.target.value)}
            style={{ marginBottom: 10, textAlign: 'center', fontSize: 16 }} />
          {err && <div style={{ fontSize: 12, color: C.danger, textAlign: 'center', marginBottom: 10 }}>{err}</div>}
          <Btn onClick={attempt} size="lg" style={{ width: '100%' }}>Unlock →</Btn>
        </Card>
      </div>
    </div>
  )
}

// ── Today dashboard ────────────────────────────────────────────────────────
function TodayDash({ members, settings }) {
  const [selDate, setSelDate] = useState(todayStr())
  const [logs,    setLogs]    = useState({})
  const [loading, setLoading] = useState(true)

  async function fetchLogs(date) {
    setLoading(true)
    const data = await loadDayLogs(date)
    const map = {}; data.forEach(l => { map[l.editor_name] = l })
    setLogs(map); setLoading(false)
  }
  useEffect(() => { fetchLogs(selDate) }, [])

  const submitted    = Object.keys(logs).length
  const totalCredits = Object.values(logs).reduce((s, l) => s + (l.credits || 0), 0)
  const missing      = members.filter(m => !logs[m.name])

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input type="date" value={selDate} onChange={e => { setSelDate(e.target.value); fetchLogs(e.target.value) }}
          style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg, color: C.text, outline: 'none', boxShadow: C.shadowSm }} />
        <Btn variant="ghost" size="sm" onClick={() => fetchLogs(selDate)}>↻ Refresh</Btn>
        {!loading && <Badge color={submitted === members.length ? 'green' : submitted > 0 ? 'amber' : 'red'} dot>{submitted}/{members.length} submitted</Badge>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.25rem' }}>
        <MetricCard label="Credits today"  value={totalCredits} color={C.red}     icon="⭐" />
        <MetricCard label="Submitted"      value={submitted}    color={C.success}  icon="✅" sub={`of ${members.length}`} />
        <MetricCard label="Pending"        value={members.length - submitted} color={members.length - submitted > 0 ? C.warning : C.success} icon="⏳" />
        <MetricCard label="Avg credits"    value={submitted > 0 ? (totalCredits / submitted).toFixed(1) : '—'} color={C.text2} icon="📊" />
      </div>

      {missing.length > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, color: '#92400E' }}>Not submitted yet: {missing.map(m => m.name).join(', ')}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10 }}>
          {[1,2,3].map(i => <Skeleton key={i} height={160} radius={12} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10 }}>
          {members.map(m => {
            const log      = logs[m.name]
            const cr       = log?.credits || 0
            const target   = settings.weeklyTargets?.[m.role] || 10
            const dayTarget = target / 5
            const types    = getTaskTypesForRole(settings, m.role)
            return (
              <Card key={m.id} style={{ borderColor: log ? (cr >= dayTarget ? 'rgba(26,158,74,.3)' : 'rgba(196,123,0,.3)') : C.border }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.redDim, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.red }}>{m.initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: C.text3, textTransform: 'capitalize' }}>{m.role}</div>
                    </div>
                  </div>
                  <Badge color={log ? (cr >= dayTarget ? 'green' : 'amber') : 'muted'} dot>
                    {log ? (cr >= dayTarget ? 'On target' : 'Low') : 'Pending'}
                  </Badge>
                </div>
                {log ? (
                  <>
                    <div style={{ fontSize: 30, fontWeight: 900, color: C.red, marginBottom: 8 }}>
                      {cr} <span style={{ fontSize: 13, color: C.text3, fontWeight: 400 }}>credits</span>
                    </div>
                    {(log.entries || []).slice(0, 3).map((e, i) => {
                      const tp = types.find(t => t.id === e.typeId)
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                          <span style={{ color: C.text2 }}>
                            {e.typeLabel || tp?.label || e.typeId}
                            {e.client && <span style={{ color: C.text3 }}> · {e.client}</span>}
                            <span style={{ color: C.text3, textTransform: 'capitalize' }}> · {e.complexity}</span>
                          </span>
                          <span style={{ fontWeight: 700, color: C.text }}>{e.credits} cr</span>
                        </div>
                      )
                    })}
                    {log.entries?.length > 3 && <div style={{ fontSize: 11, color: C.text3, paddingTop: 4 }}>+{log.entries.length - 3} more</div>}
                    {log.entries?.find(e => e.note) && (
                      <div style={{ marginTop: 8, fontSize: 11, color: C.text3, fontStyle: 'italic', borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                        "{log.entries.find(e => e.note).note}"
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: C.text3, padding: '1rem 0', fontSize: 13 }}>Awaiting log</div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Analytics ──────────────────────────────────────────────────────────────
function Analytics({ members, settings }) {
  const [period,  setPeriod]  = useState('week')
  const [csStart, setCsStart] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0] })
  const [csEnd,   setCsEnd]   = useState(todayStr())
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const today = todayStr()

  async function load() {
    setLoading(true)
    let start, end
    if (period === 'week')  { const d = getWeekDates(); start = d[0]; end = d[6] }
    else if (period === 'month') { const m = getMonthDates(); start = m.start; end = m.end }
    else { start = csStart; end = csEnd }
    setLogs(await loadRangeLogs(start, end))
    setLoading(false)
  }
  useEffect(() => { load() }, [period])

  const byMember = {}
  logs.forEach(l => {
    if (!byMember[l.editor_name]) byMember[l.editor_name] = { credits: 0, days: 0 }
    byMember[l.editor_name].credits += l.credits || 0
    byMember[l.editor_name].days++
  })

  const totalCr = Object.values(byMember).reduce((s, m) => s + m.credits, 0)
  const topName = members.reduce((t, m) => (byMember[m.name]?.credits || 0) > (byMember[t]?.credits || 0) ? m.name : t, members[0]?.name || '—')

  function downloadSummary() {
    const lines = ['ELEV8 MEDIA — PERFORMANCE SUMMARY', `Generated: ${new Date().toLocaleDateString('en-CA')}`, '', '']
    members.forEach(m => {
      const d = byMember[m.name]
      lines.push(`${m.name} (${m.role}): ${d?.credits || 0} credits | ${d?.days || 0} days logged`)
    })
    lines.push('', `TEAM TOTAL: ${totalCr} credits`)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `elev8-summary-${todayStr()}.txt`; a.click()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: C.surface2, borderRadius: 10, padding: 4 }}>
          {[['week','This week'],['month','This month'],['custom','Custom']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)} style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: 'none', background: period===v?C.bg:'none', color: period===v?C.text:C.text3, fontWeight: period===v?600:400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: period===v?C.shadowSm:'none', transition: 'all .12s' }}>{l}</button>
          ))}
        </div>
        {period === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={csStart} onChange={e => setCsStart(e.target.value)} style={{ fontSize: 12, padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg, color: C.text, outline: 'none' }} />
            <span style={{ color: C.text3 }}>→</span>
            <input type="date" value={csEnd} onChange={e => setCsEnd(e.target.value)} style={{ fontSize: 12, padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg, color: C.text, outline: 'none' }} />
            <Btn size="sm" onClick={load}>Apply</Btn>
          </div>
        )}
        <Btn variant="surface" size="sm" onClick={downloadSummary}>⬇ Export summary</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.25rem' }}>
        <MetricCard label="Total credits"  value={totalCr} color={C.red} icon="⭐" />
        <MetricCard label="Active members" value={Object.keys(byMember).length} color={C.text} icon="👥" />
        <MetricCard label="Top performer"  value={topName} color={C.success} icon="🏆" />
        <MetricCard label="Avg / member"   value={members.length > 0 ? (totalCr / members.length).toFixed(1) : '—'} color={C.text2} icon="📊" />
      </div>

      {/* Utilization */}
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: '1rem' }}>Team utilization</div>
        {loading ? <Skeleton height={80} /> : members.map(m => {
          const d      = byMember[m.name] || { credits: 0, days: 0 }
          const target = settings.weeklyTargets?.[m.role] || 10
          const pct    = Math.min(1, d.credits / target)
          const col    = pct >= 1 ? C.success : pct >= .6 ? C.warning : C.danger
          const status = pct >= 1 ? 'At capacity' : pct >= .6 ? 'In progress' : d.credits === 0 ? 'No logs' : 'Low output'
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 90, fontSize: 13, fontWeight: 600, color: C.text, flexShrink: 0 }}>{m.name}</div>
              <div style={{ flex: 1 }}>
                <ProgressBar value={d.credits} max={target} color={col} height={7} />
              </div>
              <div style={{ width: 75, fontSize: 12, fontWeight: 700, color: col, textAlign: 'right', flexShrink: 0 }}>{d.credits}/{target}cr</div>
              <div style={{ width: 90, flexShrink: 0 }}><Badge color={pct>=1?'green':pct>=.6?'amber':'red'} dot>{status}</Badge></div>
            </div>
          )
        })}
      </Card>

      {/* Table */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: '1rem' }}>Member breakdown</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Member','Role','Credits','Days','Avg/day','vs target'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const d      = byMember[m.name] || { credits: 0, days: 0 }
              const target = settings.weeklyTargets?.[m.role] || 10
              const pct    = d.credits / target
              return (
                <tr key={m.id}>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.text }}>{m.name}</td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, color: C.text3, textTransform: 'capitalize' }}>{m.role}</td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, fontWeight: 900, color: C.red, fontSize: 16 }}>{d.credits}</td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>{d.days}</td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>{d.days > 0 ? (d.credits/d.days).toFixed(1) : '—'}</td>
                  <td style={{ padding: '10px', borderBottom: `1px solid ${C.border}` }}><Badge color={pct>=1?'green':pct>=.5?'amber':'red'} dot>{Math.round(pct*100)}%</Badge></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Settings ───────────────────────────────────────────────────────────────
function TaskTypeEditor({ title, settingsKey, tasks, onUpdate, onSave, saving }) {
  function updTask(id, field, val) {
    const updated = tasks.map(t => t.id === id ? { ...t, [field]: field === 'base' ? parseFloat(val) || 0 : val } : t)
    onUpdate(updated)
  }
  function addTask() {
    onUpdate([...tasks, { id: 'task_' + Date.now(), label: 'New task', sub: '', unit: 'credits', base: 1 }])
  }
  function removeTask(id) {
    onUpdate(tasks.filter(t => t.id !== id))
  }

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: '1rem' }}>{title}</div>
      {tasks.map(t => (
        <div key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <Input value={t.label} onChange={e => updTask(t.id, 'label', e.target.value)} placeholder="Task name" style={{ flex: 2 }} />
          <Input value={t.sub}   onChange={e => updTask(t.id, 'sub',   e.target.value)} placeholder="Description" style={{ flex: 2 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <input type="number" step="0.5" min="0" value={t.base}
              onChange={e => updTask(t.id, 'base', e.target.value)}
              style={{ width: 64, fontSize: 14, fontWeight: 700, padding: '8px', borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg, color: C.red, outline: 'none', textAlign: 'center' }} />
            <span style={{ fontSize: 11, color: C.text3 }}>cr</span>
          </div>
          <button onClick={() => removeTask(t.id)} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(217,48,37,.25)', background: 'none', color: C.danger, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn variant="surface" size="sm" onClick={addTask}>+ Add task</Btn>
        <Btn size="sm" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
      </div>
    </Card>
  )
}

function Settings({ onLock }) {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved]       = useState('')
  const [tab, setTab]           = useState('editor')
  const [savingKey, setSavingKey] = useState('')

  useEffect(() => { getSettings().then(setSettings) }, [])

  async function saveKey(key, val) {
    setSavingKey(key)
    await saveSettings(key, val)
    clearSettingsCache()
    setSaved('Saved ✓')
    setTimeout(() => setSaved(''), 2000)
    setSavingKey('')
  }

  if (!settings) return <Skeleton height={200} />

  const { taskTypes, productionTasks, socialTasks, complexity, weeklyTargets } = settings

  const settingsTabs = [
    { id: 'editor',     label: 'Editor tasks'     },
    { id: 'production', label: 'Production tasks'  },
    { id: 'social',     label: 'Social tasks'      },
    { id: 'complexity', label: 'Complexity'        },
    { id: 'targets',    label: 'Targets'           },
    { id: 'system',     label: 'System'            },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Settings</div>
        {saved && <Badge color="green" dot>{saved}</Badge>}
      </div>

      <div style={{ display: 'flex', gap: 3, background: C.surface2, borderRadius: 10, padding: 4, marginBottom: '1.5rem', width: 'fit-content', flexWrap: 'wrap' }}>
        {settingsTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 7, border: 'none', background: tab===t.id?C.bg:'none', color: tab===t.id?C.text:C.text3, fontWeight: tab===t.id?600:400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab===t.id?C.shadowSm:'none' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'editor' && (
        <TaskTypeEditor
          title="Editor task types & base credits"
          settingsKey="task_types"
          tasks={taskTypes}
          onUpdate={updated => setSettings(s => ({ ...s, taskTypes: updated }))}
          onSave={() => saveKey('task_types', taskTypes)}
          saving={savingKey === 'task_types'}
        />
      )}

      {tab === 'production' && (
        <TaskTypeEditor
          title="Production task types & base credits"
          settingsKey="production_tasks"
          tasks={productionTasks}
          onUpdate={updated => setSettings(s => ({ ...s, productionTasks: updated }))}
          onSave={() => saveKey('production_tasks', productionTasks)}
          saving={savingKey === 'production_tasks'}
        />
      )}

      {tab === 'social' && (
        <TaskTypeEditor
          title="Social Media task types & base credits"
          settingsKey="social_tasks"
          tasks={socialTasks}
          onUpdate={updated => setSettings(s => ({ ...s, socialTasks: updated }))}
          onSave={() => saveKey('social_tasks', socialTasks)}
          saving={savingKey === 'social_tasks'}
        />
      )}

      {tab === 'complexity' && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: '1rem' }}>Complexity multipliers (apply to ALL roles)</div>
          {complexity.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <Input value={c.label} onChange={e => setSettings(s => ({ ...s, complexity: s.complexity.map(x => x.id===c.id?{...x,label:e.target.value}:x) }))} style={{ flex: 1 }} />
              <Input value={c.sub}   onChange={e => setSettings(s => ({ ...s, complexity: s.complexity.map(x => x.id===c.id?{...x,sub:e.target.value}:x) }))} style={{ flex: 2 }} />
              <span style={{ fontSize: 13, color: C.text3, flexShrink: 0 }}>×</span>
              <input type="number" step="0.25" min="0" value={c.multiplier}
                onChange={e => setSettings(s => ({ ...s, complexity: s.complexity.map(x => x.id===c.id?{...x,multiplier:parseFloat(e.target.value)||1}:x) }))}
                style={{ width: 70, fontSize: 14, fontWeight: 700, padding: '8px', borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg, color: C.red, outline: 'none', textAlign: 'center' }} />
            </div>
          ))}
          <Btn size="sm" style={{ marginTop: 8 }} onClick={() => saveKey('complexity', complexity)} disabled={savingKey==='complexity'}>
            {savingKey === 'complexity' ? 'Saving…' : 'Save multipliers'}
          </Btn>
        </Card>
      )}

      {tab === 'targets' && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: '1rem' }}>Weekly credit targets by role</div>
          {['editor','production','social'].map(role => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 100, fontSize: 13, fontWeight: 600, color: C.text, textTransform: 'capitalize' }}>{role}</div>
              <input type="number" min="0" step="1" value={weeklyTargets[role] || 10}
                onChange={e => setSettings(s => ({ ...s, weeklyTargets: { ...s.weeklyTargets, [role]: parseFloat(e.target.value) || 0 } }))}
                style={{ width: 80, fontSize: 18, fontWeight: 800, padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg, color: C.red, outline: 'none', textAlign: 'center' }} />
              <span style={{ fontSize: 13, color: C.text3 }}>credits / week</span>
            </div>
          ))}
          <Btn size="sm" style={{ marginTop: 8 }} onClick={() => saveKey('weekly_targets', weeklyTargets)} disabled={savingKey==='weekly_targets'}>
            {savingKey === 'weekly_targets' ? 'Saving…' : 'Save targets'}
          </Btn>
        </Card>
      )}

      {tab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>System info</div>
            {[['Database','Supabase'],['Deployment','Vercel'],['ClickUp list','Daily Team Logs'],['Version','V3']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.text3 }}>{k}</span><span style={{ color: C.text2, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </Card>
          <Btn variant="ghost" onClick={onLock} style={{ width: 'fit-content' }}>🔒 Lock portal</Btn>
        </div>
      )}
    </div>
  )
}

// ── Team manager ───────────────────────────────────────────────────────────
function TeamManager() {
  const [members, setMembers] = useState([])
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({ name: '', role: 'editor', initials: '', pin: '1234' })
  const [msg,     setMsg]     = useState('')
  const [saving,  setSaving]  = useState(false)

  async function reload() { setMembers(await getTeamMembers()) }
  useEffect(() => { reload() }, [])

  function startEdit(m) { setEditing(m.id); setForm({ name: m.name, role: m.role, initials: m.initials, pin: m.pin }); setMsg('') }
  function startNew()   { setEditing('new'); setForm({ name: '', role: 'editor', initials: '', pin: '1234' }); setMsg('') }
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v, ...(k==='name'&&editing==='new'?{initials:v.slice(0,2).toUpperCase()}:{}) }))

  async function save() {
    if (!form.name.trim()) { setMsg('Name is required.'); return }
    setSaving(true)
    if (editing === 'new') { const { error } = await addTeamMember(form); error ? setMsg('Error') : setMsg('Added ✓') }
    else { const { error } = await updateTeamMember(editing, form); error ? setMsg('Error') : setMsg('Saved ✓') }
    setSaving(false); reload(); setTimeout(() => { setMsg(''); setEditing(null) }, 1500)
  }
  async function remove(id, name) {
    if (!window.confirm(`Remove ${name}?`)) return
    await deleteTeamMember(id); reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Team members</div>
        <Btn size="sm" onClick={startNew}>+ Add member</Btn>
      </div>

      {members.map(m => (
        <Card key={m.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: C.redDim, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: C.red }}>{m.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.name}</div>
            <div style={{ fontSize: 11, color: C.text3, textTransform: 'capitalize' }}>{m.role} · PIN: {m.pin}</div>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => startEdit(m)}>Edit</Btn>
          <Btn variant="danger" size="sm" onClick={() => remove(m.id, m.name)}>Remove</Btn>
        </Card>
      ))}

      {editing && (
        <Card style={{ marginTop: 16, borderColor: C.redBorder }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: '1rem' }}>
            {editing === 'new' ? 'Add new member' : `Edit — ${members.find(m => m.id === editing)?.name}`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Name *</div><Input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Full name" /></div>
            <div><div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Initials</div><Input value={form.initials} onChange={e => upd('initials', e.target.value.toUpperCase().slice(0,2))} placeholder="AB" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Role</div>
              <Select value={form.role} onChange={e => upd('role', e.target.value)}>
                {['editor','production','social'].map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
              </Select>
            </div>
            <div><div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>4-digit PIN</div><Input value={form.pin} onChange={e => upd('pin', e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="1234" /></div>
          </div>
          {msg && <div style={{ fontSize: 12, color: msg.includes('✓') ? C.success : C.danger, marginBottom: 10 }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing === 'new' ? 'Add member' : 'Save changes'}</Btn>
            <Btn variant="ghost" onClick={() => { setEditing(null); setMsg('') }}>Cancel</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────
const MGR_TABS = [
  { id: 'today',     label: 'Today',     icon: '📅' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'team',      label: 'Team',      icon: '👥' },
  { id: 'settings',  label: 'Settings',  icon: '⚙️'  },
]

export default function ManagerPortal() {
  const [authed,   setAuthed]   = useState(false)
  const [sub,      setSub]      = useState('today')
  const [members,  setMembers]  = useState([])
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    if (authed) {
      Promise.all([getTeamMembers(), getSettings()])
        .then(([m, s]) => { setMembers(m); setSettings(s) })
    }
  }, [authed])

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />
  if (!settings) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <Skeleton key={i} height={80} radius={12} />)}</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 2, background: C.surface2, borderRadius: 10, padding: 4 }}>
          {MGR_TABS.map(t => {
            const active = sub === t.id
            return (
              <button key={t.id} onClick={() => setSub(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px', borderRadius: 7, border: 'none', background: active?C.bg:'none', color: active?C.text:C.text3, fontWeight: active?600:400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: active?C.shadowSm:'none', transition: 'all .12s' }}>
                <span>{t.icon}</span>{t.label}
              </button>
            )
          })}
        </div>
        <Btn variant="ghost" size="sm" onClick={() => setAuthed(false)}>🔒 Lock</Btn>
      </div>

      <div className="fade-in" key={sub}>
        {sub === 'today'     && <TodayDash members={members} settings={settings} />}
        {sub === 'analytics' && <Analytics members={members} settings={settings} />}
        {sub === 'team'      && <TeamManager />}
        {sub === 'settings'  && <Settings onLock={() => setAuthed(false)} />}
      </div>
    </div>
  )
}
