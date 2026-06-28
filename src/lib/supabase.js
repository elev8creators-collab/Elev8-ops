import { createClient } from '@supabase/supabase-js'
import { DEFAULT_TASK_TYPES, DEFAULT_COMPLEXITY } from './config.js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const CLICKUP_LIST_ID = '901714813967'

// ── Settings ──────────────────────────────────────────────────────────────
let _cache = null

export async function getSettings() {
  if (_cache) return _cache
  const { data } = await supabase.from('app_settings').select('*')
  if (!data || data.length === 0) return _buildDefault()
  const map = {}
  data.forEach(r => {
    try { map[r.key] = JSON.parse(r.value) } catch { map[r.key] = r.value }
  })
  _cache = {
    taskTypes:       map.task_types        || DEFAULT_TASK_TYPES.editor,
    productionTasks: map.production_tasks  || DEFAULT_TASK_TYPES.production,
    socialTasks:     map.social_tasks      || DEFAULT_TASK_TYPES.social,
    complexity:      map.complexity        || DEFAULT_COMPLEXITY,
    weeklyTargets:   map.weekly_targets    || { editor: 10, production: 8, social: 8 },
    streakEnabled:   map.streak_enabled    ?? true,
  }
  return _cache
}

function _buildDefault() {
  return {
    taskTypes:       DEFAULT_TASK_TYPES.editor,
    productionTasks: DEFAULT_TASK_TYPES.production,
    socialTasks:     DEFAULT_TASK_TYPES.social,
    complexity:      DEFAULT_COMPLEXITY,
    weeklyTargets:   { editor: 10, production: 8, social: 8 },
    streakEnabled:   true,
  }
}

export function clearSettingsCache() { _cache = null }

export async function saveSettings(key, value) {
  clearSettingsCache()
  const { error } = await supabase.from('app_settings')
    .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' })
  return { error }
}

// Helper — get task types for a role
export function getTaskTypesForRole(settings, role) {
  if (role === 'production') return settings.productionTasks || DEFAULT_TASK_TYPES.production
  if (role === 'social')     return settings.socialTasks     || DEFAULT_TASK_TYPES.social
  return settings.taskTypes || DEFAULT_TASK_TYPES.editor
}

// ── Team members ──────────────────────────────────────────────────────────
export async function getTeamMembers() {
  const { data } = await supabase
    .from('team_members').select('*').eq('active', true).order('sort_order')
  return data || []
}

export async function addTeamMember({ name, role, initials, pin }) {
  const { data, error } = await supabase.from('team_members')
    .insert([{ name, role, initials: initials || name.slice(0,2).toUpperCase(), pin: pin || '1234' }])
    .select()
  return { data, error }
}

export async function updateTeamMember(id, updates) {
  const { data, error } = await supabase.from('team_members')
    .update(updates).eq('id', id).select()
  return { data, error }
}

export async function deleteTeamMember(id) {
  const { error } = await supabase.from('team_members').update({ active: false }).eq('id', id)
  return { error }
}

export async function verifyPin(name, pin) {
  const { data } = await supabase.from('team_members')
    .select('id,name,role,initials').eq('name', name).eq('pin', pin).eq('active', true).single()
  return data || null
}

// ── Logs ──────────────────────────────────────────────────────────────────
export async function saveLog({ memberName, memberRole, logDate, entries, totalCredits }) {
  const { data, error } = await supabase.from('editor_logs').upsert(
    {
      editor_name: memberName, log_date: logDate,
      videos_done: entries.length, credits: totalCredits,
      on_target: totalCredits >= 2, entries,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'editor_name,log_date' }
  )
  if (!error) {
    syncToClickUp(memberName, memberRole, logDate, entries, totalCredits).catch(() => {})
  }
  return { data, error }
}

export async function loadDayLogs(date) {
  const { data } = await supabase.from('editor_logs')
    .select('*').eq('log_date', date).order('editor_name')
  return data || []
}

export async function loadRangeLogs(startDate, endDate) {
  const { data } = await supabase.from('editor_logs').select('*')
    .gte('log_date', startDate).lte('log_date', endDate).order('log_date')
  return data || []
}

export async function loadMemberHistory(memberName) {
  const { data } = await supabase.from('editor_logs').select('*')
    .eq('editor_name', memberName).order('log_date', { ascending: false })
  return data || []
}

// ── ClickUp sync (server-side via /api/clickup) ───────────────────────────
async function syncToClickUp(name, role, date, entries, credits) {
  try {
    const lines = entries.map(e =>
      `• ${e.typeLabel || e.typeId} [${e.complexity || 'standard'}] — ${e.credits} credits${e.client ? ` | Client: ${e.client}` : ''}${e.note ? ` | Note: ${e.note}` : ''}`
    ).join('\n')

    await fetch('/api/clickup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${name} — ${date}`,
        description: `📊 Daily Log — ${name}\nDate: ${date}\nRole: ${role}\n\nTasks:\n${lines}\n\nTotal Credits: ${credits}`,
        listId: CLICKUP_LIST_ID,
        priority: credits >= 5 ? 3 : 2,
      }),
    })
  } catch (_) {}
}
