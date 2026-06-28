export const TASK_TYPES = {
  editor: [
    { id: 'reel',   label: 'Short form reel',     sub: 'under 90s',  unit: 'videos'  },
    { id: 'med',    label: 'Medium video',          sub: '2–5 min',    unit: 'videos'  },
    { id: 'long',   label: 'Long form / YouTube',   sub: '5–20 min',   unit: 'videos'  },
    { id: 'xl',     label: 'Long form XL',           sub: '20+ min',    unit: 'videos'  },
    { id: 'gfx',    label: 'Graphic / thumbnail',   sub: 'static',     unit: 'assets'  },
    { id: 'rev',    label: 'Revision',               sub: 'any type',   unit: 'videos'  },
  ],
  production: [
    { id: 'shoot',  label: 'Shoot',                  sub: 'add client name', unit: 'shoots'  },
    { id: 'assign', label: 'Data assigned to editors',sub: 'footage handoff', unit: 'batches' },
    { id: 'edit',   label: 'Video edited',            sub: 'edited personally',unit: 'videos' },
    { id: 'other',  label: 'Other',                   sub: 'describe below',  unit: 'tasks'  },
  ],
  social: [
    { id: 'posts',   label: 'Posts published',     sub: 'across clients',  unit: 'posts'   },
    { id: 'tasks',   label: 'Tasks assigned',       sub: 'to editors',      unit: 'tasks'   },
    { id: 'reports', label: 'Reports sent',         sub: 'to clients/mgr',  unit: 'reports' },
    { id: 'comms',   label: 'Talked to editors',    sub: 'check-ins',       unit: 'convos'  },
    { id: 'other',   label: 'Other',                sub: 'describe below',  unit: 'tasks'   },
  ],
}

export const MANAGER_PASSWORD = import.meta.env.VITE_MANAGER_PASSWORD || 'Elev8Admin'
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function todayStr() { return new Date().toISOString().split('T')[0] }

export function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export function getWeekDates(offset = 0) {
  const t = new Date(), dow = t.getDay()
  const mon = new Date(t)
  mon.setDate(t.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export function getMonthDates() {
  const t = new Date()
  const start = new Date(t.getFullYear(), t.getMonth(), 1)
  const end   = new Date(t.getFullYear(), t.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  }
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
