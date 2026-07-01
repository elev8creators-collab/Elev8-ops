const TOKEN = import.meta.env.VITE_CLICKUP_TOKEN

// Map member names to their ClickUp list IDs
export const MEMBER_LIST_IDS = {
  'Abhijot':    '901711705653',
  'Narsi':      '901711705655',
  'Narpat':     '901711705661',
  'Vansh':      '901712160906',
  'Vansh Verma':'901712160906',
}

export const fetchMemberTasks = async (memberName) => {
  const listId = MEMBER_LIST_IDS[memberName]
  if (!listId || !TOKEN) return []
  try {
    const res = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task?archived=false&include_closed=false&order_by=due_date&reverse=false`,
      { headers: { 'Authorization': TOKEN } }
    )
    const data = await res.json()
    return data.tasks || []
  } catch(e) {
    console.warn('ClickUp fetch failed:', e)
    return []
  }
}

export const getTaskStatusColor = (status) => {
  const s = (status||'').toLowerCase()
  if (s === 'complete' || s === 'done') return '#22d3a5'
  if (s === 'in progress' || s === 'in review') return '#6366f1'
  if (s === 'to do' || s === 'open') return '#f59e0b'
  return '#64748b'
}

export const formatDueDate = (dueDateMs) => {
  if (!dueDateMs) return null
  const due = new Date(parseInt(dueDateMs))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.round((dueDay - today) / (1000*60*60*24))
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: '#f87171' }
  if (diffDays === 0) return { label: 'Due today', color: '#fbbf24' }
  if (diffDays === 1) return { label: 'Due tomorrow', color: '#f59e0b' }
  return { label: `Due in ${diffDays}d`, color: '#64748b' }
}
