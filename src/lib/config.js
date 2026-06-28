export const TEAM = [
  {
    id: 'editor1',
    name: 'Editor 1',
    role: 'editor',
    initials: 'E1',
  },
  {
    id: 'editor2',
    name: 'Editor 2',
    role: 'editor',
    initials: 'E2',
  },
  {
    id: 'editor3',
    name: 'Editor 3',
    role: 'editor',
    initials: 'E3',
  },
  {
    id: 'editor4',
    name: 'Editor 4',
    role: 'editor',
    initials: 'E4',
  },
  {
    id: 'narpat',
    name: 'Narpat',
    role: 'production',
    initials: 'NP',
  },
  {
    id: 'smm',
    name: 'SMM',
    role: 'social',
    initials: 'SM',
  },
]

export const TASK_TYPES = {
  editor: [
    { id: 'reel',   label: 'Short form reel',    sub: 'under 90s',  unit: 'videos' },
    { id: 'med',    label: 'Medium video',        sub: '2–5 min',    unit: 'videos' },
    { id: 'long',   label: 'Long form / YouTube', sub: '5–20 min',   unit: 'videos' },
    { id: 'xl',     label: 'Long form XL',        sub: '20+ min',    unit: 'videos' },
    { id: 'gfx',    label: 'Graphic / thumbnail', sub: 'static',     unit: 'assets' },
    { id: 'rev',    label: 'Revision',            sub: 'any type',   unit: 'videos' },
  ],
  production: [
    { id: 'shoot',  label: 'Shoot',               sub: 'add client name in notes', unit: 'shoots' },
    { id: 'assign', label: 'Data assigned to editors', sub: 'footage handoff',     unit: 'batches' },
    { id: 'edit',   label: 'Video edited',        sub: 'edited personally',        unit: 'videos' },
    { id: 'other',  label: 'Other',               sub: 'describe below',           unit: 'tasks' },
  ],
  social: [
    { id: 'posts',   label: 'Posts published',      sub: 'across all clients',    unit: 'posts'   },
    { id: 'tasks',   label: 'Tasks assigned',       sub: 'to editors',            unit: 'tasks'   },
    { id: 'reports', label: 'Reports sent',         sub: 'to clients or manager', unit: 'reports' },
    { id: 'comms',   label: 'Talked to editors',    sub: 'check-ins / follow-ups',unit: 'convos'  },
    { id: 'other',   label: 'Other',                sub: 'describe below',        unit: 'tasks'   },
  ],
}

export const MANAGER_PASSWORD = import.meta.env.VITE_MANAGER_PASSWORD || 'Elev8Admin'

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export function getWeekDates() {
  const t = new Date(), dow = t.getDay()
  const mon = new Date(t)
  mon.setDate(t.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
