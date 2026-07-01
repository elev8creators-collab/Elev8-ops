import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Timezone by member
export const MEMBER_TIMEZONES = {
  'Narpat': 'America/Toronto',
}
export const DEFAULT_TZ = 'Asia/Kolkata'

export const getMemberTZ = (name) => MEMBER_TIMEZONES[name] || DEFAULT_TZ

// Task types with points and video count
export const DEFAULT_TASK_TYPES = [
  { id: 'short_reel', label: 'Short Form Reel', points: 1, videos: 1, color: 'blue' },
  { id: 'long_youtube', label: 'Long Form YouTube', points: 2, videos: 1, color: 'teal' },
  { id: 'long_xl', label: 'Long Form XL', points: 3, videos: 1, color: 'purple' },
  { id: 'commercial', label: 'Commercial / Complex', points: 4, videos: 1, color: 'pink' },
  { id: 'podcast', label: 'Podcast Edit', points: 1, videos: 1, color: 'amber' },
  { id: 'thumbnail', label: 'Thumbnail / Graphic', points: 0.5, videos: 0, color: 'gray' },
  { id: 'social_post', label: 'Social Post / Caption', points: 0.5, videos: 0, color: 'teal' },
  { id: 'shoot_day', label: 'Shoot Day', points: 3, videos: 0, color: 'pink' },
  { id: 'strategy', label: 'Strategy / Planning', points: 1, videos: 0, color: 'amber' },
]

export const WEEKLY_TARGETS = {
  'Editor': 14,
  'Production': 12,
  'Social': 10,
}

export const TEAM_MEMBERS = [
  { name: 'Abhijot', role: 'Editor', color: 'blue' },
  { name: 'Narsi', role: 'Editor', color: 'teal' },
  { name: 'Param', role: 'Editor', color: 'purple' },
  { name: 'Vansh', role: 'Editor', color: 'pink' },
  { name: 'Narpat', role: 'Production', color: 'amber' },
  { name: 'Vansh Verma', role: 'Social', color: 'blue' },
]

export const MANAGER_PIN = import.meta.env.VITE_MANAGER_PIN || '1234'
export const CLICKUP_TOKEN = import.meta.env.VITE_CLICKUP_TOKEN
export const CLICKUP_LIST_ID = import.meta.env.VITE_CLICKUP_LIST_ID
