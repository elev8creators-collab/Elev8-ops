import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function saveLog({ memberName, memberRole, logDate, entries, totalCount }) {
  const { data, error } = await supabase
    .from('editor_logs')
    .upsert(
      {
        editor_name: memberName,
        log_date: logDate,
        videos_done: totalCount,
        credits: totalCount,
        on_target: totalCount >= 2,
        entries,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'editor_name,log_date' }
    )
  return { data, error }
}

export async function loadDayLogs(date) {
  const { data, error } = await supabase
    .from('editor_logs')
    .select('*')
    .eq('log_date', date)
    .order('editor_name')
  return data || []
}

export async function loadWeekLogs(startDate, endDate) {
  const { data, error } = await supabase
    .from('editor_logs')
    .select('*')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date')
  return data || []
}

export async function loadMemberHistory(memberName) {
  const { data, error } = await supabase
    .from('editor_logs')
    .select('*')
    .eq('editor_name', memberName)
    .order('log_date', { ascending: false })
  return data || []
}
