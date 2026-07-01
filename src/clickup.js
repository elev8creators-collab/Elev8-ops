const CLICKUP_TOKEN = import.meta.env.VITE_CLICKUP_TOKEN

// Fetch tasks assigned to a member from ClickUp
export const fetchMemberTasks = async (memberName) => {
  if (!CLICKUP_TOKEN) return []
  try {
    // Get teams first
    const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
      headers: { 'Authorization': CLICKUP_TOKEN }
    })
    const teamsData = await teamsRes.json()
    const teamId = teamsData.teams?.[0]?.id
    if (!teamId) return []

    // Get spaces
    const spacesRes = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
      headers: { 'Authorization': CLICKUP_TOKEN }
    })
    const spacesData = await spacesRes.json()
    
    // Find editors space
    const editorsSpace = spacesData.spaces?.find(s => 
      s.name.toLowerCase().includes('editor') || 
      s.name.toLowerCase().includes('production')
    ) || spacesData.spaces?.[0]
    
    if (!editorsSpace) return []

    // Get all tasks assigned to this member (due today or overdue)
    const today = new Date()
    today.setHours(0,0,0,0)
    
    const tasksRes = await fetch(
      `https://api.clickup.com/api/v2/space/${editorsSpace.id}/task?assignees[]=${memberName}&include_closed=false&subtasks=true`,
      { headers: { 'Authorization': CLICKUP_TOKEN } }
    )
    const tasksData = await tasksRes.json()
    return tasksData.tasks || []
  } catch (e) {
    console.warn('ClickUp fetch failed:', e)
    return []
  }
}

// Get all spaces and folders for settings
export const fetchWorkspaceStructure = async () => {
  if (!CLICKUP_TOKEN) return null
  try {
    const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
      headers: { 'Authorization': CLICKUP_TOKEN }
    })
    const teamsData = await teamsRes.json()
    return teamsData.teams?.[0] || null
  } catch (e) {
    return null
  }
}
