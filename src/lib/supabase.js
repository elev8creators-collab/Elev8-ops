import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const CLICKUP_TOKEN   = import.meta.env.VITE_CLICKUP_TOKEN
const CLICKUP_LIST_ID = '901714813967'

// ── Team members ──────────────────────────────────────────────────────────
export async function getTeamMembers() {
  const { data } = await supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  return data || []
}

export async function addTeamMember({ name, role, initials, pin }) {
  const { data, error } = await supabase
    .from('team_members')
    .insert([{ name, role, initials: initials || name.slice(0, 2).toUpperCase(), pin: pin || '1234' }])
    .select()
  return { data, error }
}

export async function updateTeamMember(id, updates) {
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .select()
  return { data, error }
}

export async function deleteTeamMember(id) {
  const { error } = await supabase
    .from('team_members')
    .update({ active: false })
    .eq('id', id)
  return { error }
}

export async function verifyPin(name, pin) {
  const { data } = await supabase
    .from('team_members')
    .select('id, name, role, initials')
    .eq('name', name)
    .eq('pin', pin)
    .eq('active', true)
    .single()
  return data || null
}

// ── Daily logs ────────────────────────────────────────────────────────────
export async function saveLog({ memberName, memberRole, logDate, entries, totalCount }) {
  const { data, error } = await supabase
    .from('editor_logs')
    .upsert(
      { editor_name: memberName, log_date: logDate, videos_done: totalCount,
        credits: totalCount, on_target: totalCount >= 2,
        entries, submitted_at: new Date().toISOString() },
      { onConflict: 'editor_name,log_date' }
    )
  if (!error && CLICKUP_TOKEN) {
    syncToClickUp({ name: memberName, role: memberRole }, logDate, entries, totalCount).catch(() => {})
  }
  return { data, error }
}

export async function loadDayLogs(date) {
  const { data } = await supabase.from('editor_logs').select('*').eq('log_date', date).order('editor_name')
  return data || []
}

export async function loadRangeLogs(startDate, endDate) {
  const { data } = await supabase
    .from('editor_logs').select('*')
    .gte('log_date', startDate).lte('log_date', endDate).order('log_date')
  return data || []
}

export async function loadMemberHistory(memberName) {
  const { data } = await supabase
    .from('editor_logs').select('*')
    .eq('editor_name', memberName).order('log_date', { ascending: false })
  return data || []
}

// ── ClickUp sync ──────────────────────────────────────────────────────────
async function syncToClickUp(member, logDate, entries, totalCount) {
  if (!CLICKUP_TOKEN) return
  const { TASK_TYPES, fmtDate } = await import('./config.js')
  const role = member.role || 'editor'
  const types = TASK_TYPES[role] || TASK_TYPES.editor

  const lines = entries.map(e => {
    const t = types.find(t => t.id === e.typeId)
    return `• ${t?.label || e.typeId} × ${e.count}${e.note ? ` — ${e.note}` : ''}`
  }).join('\n')

  const desc = `📊 Daily Log — ${member.name}\nDate: ${fmtDate(logDate)}\nRole: ${role}\n\nTasks completed:\n${lines}\n\nTotal: ${totalCount} tasks\nStatus: ${totalCount >= 2 ? 'On target ✓' : 'Below minimum ⚠️'}`

  await fetch(`https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task`, {
    method: 'POST',
    headers: { Authorization: CLICKUP_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${member.name} — ${logDate}`,
      description: desc,
      priority: totalCount >= 2 ? 3 : 2,
      status: 'complete',
    }),
  })
}
