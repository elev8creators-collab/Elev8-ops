export const DEFAULT_TASK_TYPES = {
  editor: [
    { id: 'reel',   label: 'Short Form Reel',     sub: 'Under 90s',    unit: 'credits', base: 1   },
    { id: 'med',    label: 'Medium Video',         sub: '2–5 min',      unit: 'credits', base: 2   },
    { id: 'long',   label: 'Long Form / YouTube',  sub: '5–20 min',     unit: 'credits', base: 3   },
    { id: 'xl',     label: 'Long Form XL',         sub: '20+ min',      unit: 'credits', base: 4   },
    { id: 'gfx',    label: 'Graphic / Thumbnail',  sub: 'Static asset', unit: 'credits', base: 0.5 },
    { id: 'rev',    label: 'Revision',             sub: 'Any type',     unit: 'credits', base: 0.5 },
  ],
  production: [
    { id: 'shoot',  label: 'Shoot',                sub: 'Add client name',   unit: 'credits', base: 2   },
    { id: 'assign', label: 'Footage assigned',     sub: 'Footage handoff',   unit: 'credits', base: 1   },
    { id: 'edit',   label: 'Video edited',         sub: 'Edited personally', unit: 'credits', base: 2   },
    { id: 'review', label: 'Review & feedback',    sub: 'On editor work',    unit: 'credits', base: 1   },
    { id: 'other',  label: 'Other',                sub: 'Describe in notes', unit: 'credits', base: 1   },
  ],
  social: [
    { id: 'posts',   label: 'Posts published',     sub: 'Across clients',    unit: 'credits', base: 1   },
    { id: 'tasks',   label: 'Tasks assigned',      sub: 'To editors',        unit: 'credits', base: 0.5 },
    { id: 'reports', label: 'Reports sent',        sub: 'To clients/manager',unit: 'credits', base: 1   },
    { id: 'comms',   label: 'Editor check-ins',    sub: 'Follow-ups',        unit: 'credits', base: 0.5 },
    { id: 'review',  label: 'Content reviewed',    sub: 'First-pass review', unit: 'credits', base: 1   },
    { id: 'other',   label: 'Other',               sub: 'Describe in notes', unit: 'credits', base: 0.5 },
  ],
}

export const DEFAULT_COMPLEXITY = [
  { id: 'basic',    label: 'Basic',    sub: 'Simple cuts, captions', multiplier: 0.75 },
  { id: 'standard', label: 'Standard', sub: 'Regular edit',          multiplier: 1    },
  { id: 'complex',  label: 'Complex',  sub: 'After Effects, motion', multiplier: 1.5  },
]

export const MANAGER_PASSWORD = import.meta.env.VITE_MANAGER_PASSWORD || 'Elev8Admin'
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function todayStr() { return new Date().toISOString().split('T')[0] }

export function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export function fmtShort(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric',
  })
}

export function getWeekDates() {
  const t = new Date(), dow = t.getDay()
  const mon = new Date(t)
  mon.setDate(t.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export function getMonthDates() {
  const t = new Date()
  const start = new Date(t.getFullYear(), t.getMonth(), 1)
  const end   = new Date(t.getFullYear(), t.getMonth() + 1, 0)
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}
