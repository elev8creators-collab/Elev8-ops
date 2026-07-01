import { supabase, getMemberTZ } from './config.js'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'

// Get current date string in member's timezone
export const getMemberDateStr = (memberName) => {
  const tz = getMemberTZ(memberName)
  return formatInTimeZone(new Date(), tz, 'yyyy-MM-dd')
}

// Get week range in a given timezone
export const getWeekRange = (tz = 'Asia/Kolkata') => {
  const now = toZonedTime(new Date(), tz)
  const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(now, { weekStartsOn: 1 })
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

export const getMonthRange = (tz = 'Asia/Kolkata') => {
  const now = toZonedTime(new Date(), tz)
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

// Submit a daily log
export const submitLog = async (memberName, tasks, notes = '') => {
  const dateStr = getMemberDateStr(memberName)
  const tz = getMemberTZ(memberName)

  const totalPoints = tasks.reduce((s, t) => s + (t.points || 0), 0)
  const totalVideos = tasks.reduce((s, t) => s + (t.videos || 0), 0)

  const { data, error } = await supabase
    .from('daily_logs')
    .insert({
      member_name: memberName,
      log_date: dateStr,
      timezone: tz,
      tasks: tasks,
      total_points: totalPoints,
      total_videos: totalVideos,
      notes: notes,
      submitted_at: new Date().toISOString(),
    })
    .select()

  if (error) throw error
  return data[0]
}

// Get logs for a member on a specific date
export const getMemberLogsForDate = async (memberName, dateStr) => {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('member_name', memberName)
    .eq('log_date', dateStr)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get all logs in a date range
export const getLogsInRange = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get today's logs for all members (each in their own timezone)
export const getTodayLogsAllMembers = async (members) => {
  const results = {}
  for (const m of members) {
    const dateStr = getMemberDateStr(m.name)
    const logs = await getMemberLogsForDate(m.name, dateStr)
    results[m.name] = { logs, dateStr }
  }
  return results
}

// Aggregate stats from logs
export const aggregateStats = (logs) => {
  return logs.reduce((acc, log) => {
    acc.totalPoints += log.total_points || 0
    acc.totalVideos += log.total_videos || 0
    acc.days = new Set([...acc.days, log.log_date])
    acc.tasks = [...acc.tasks, ...(log.tasks || [])]
    return acc
  }, { totalPoints: 0, totalVideos: 0, days: new Set(), tasks: [] })
}

// Push log to ClickUp
export const pushToClickUp = async (log, token, listId) => {
  if (!token || !listId) return
  try {
    const taskNames = (log.tasks || []).map(t => `${t.label} (${t.points}pts)`).join(', ')
    await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${log.member_name} — ${log.log_date} — ${log.total_videos} videos / ${log.total_points} pts`,
        description: `Tasks: ${taskNames}\n\nNotes: ${log.notes || 'None'}`,
        status: 'complete',
      }),
    })
  } catch (e) {
    console.warn('ClickUp sync failed:', e)
  }
}
