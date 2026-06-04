export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function shortDate(iso) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function monthDay(iso) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export function dayAbbr(i) {
  return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][i]
}

export function dayShort(i) {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]
}

export function weekRange(ref) {
  const d = new Date(ref + 'T12:00:00')
  const day = d.getDay()
  const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  const days = []
  for (let i = 0; i < 7; i++) {
    const c = new Date(mon); c.setDate(mon.getDate() + i)
    days.push(c.toISOString().split('T')[0])
  }
  return days
}

export function monthRange(iso) {
  const d = new Date(iso + 'T12:00:00')
  const y = d.getFullYear(), m = d.getMonth()
  const first = new Date(y, m, 1)
  const start = new Date(first)
  start.setDate(start.getDate() - start.getDay())
  const days = []
  let cur = new Date(start)
  for (let i = 0; i < 42; i++) {
    days.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export function isDone(habit, dateStr) {
  const val = habit.history?.[dateStr]
  if (!val) return false
  if (habit.habitType === 'count' || habit.habitType === 'duration') {
    return val >= (habit.target || 1)
  }
  return !!val
}

export function calcStreak(history, habit) {
  const dates = Object.keys(history).sort().reverse()
  if (!dates.length) return 0
  const today = todayISO()
  const yesterday = daysAgo(1)
  const skips = habit?.skips || {}
  const startFrom = history[today] ? today : (skips[today] ? today : (history[yesterday] ? yesterday : (skips[yesterday] ? yesterday : null)))
  if (!startFrom) {
    if (history[yesterday]) return 1
    return 0
  }
  let cur = new Date(startFrom + 'T12:00:00')
  let s = 0
  while (true) {
    const key = cur.toISOString().split('T')[0]
    const val = history[key]
    const isSkipped = skips[key]
    if (isSkipped) {
      s++; cur.setDate(cur.getDate() - 1); continue
    }
    if (val !== undefined && val !== false) {
      if (habit?.habitType === 'count' || habit?.habitType === 'duration') {
        if (val >= (habit.target || 1)) { s++; cur.setDate(cur.getDate() - 1) }
        else break
      } else {
        s++; cur.setDate(cur.getDate() - 1)
      }
    } else break
  }
  return s
}

export function calcRate(history, windowDays = 30, habit) {
  const entries = Object.entries(history)
  if (!entries.length) return 0
  const cutoff = daysAgo(windowDays)
  const relevant = entries.filter(([d]) => d >= cutoff)
  if (!relevant.length) return 0
  const done = relevant.filter(([, v]) => {
    if (!v) return false
    if (habit?.habitType === 'count' || habit?.habitType === 'duration') {
      return v >= (habit.target || 1)
    }
    return !!v
  })
  return Math.round((done.length / relevant.length) * 100)
}

export function calcStreaks(history, habit) {
  const skips = habit?.skips || {}
  const checkDone = d => {
    if (skips[d]) return true
    const val = history[d]
    if (!val) return false
    if (habit?.habitType === 'count' || habit?.habitType === 'duration') {
      return val >= (habit.target || 1)
    }
    return !!val
  }
  const dates = Object.keys(history).filter(d => checkDone(d)).sort()
  if (!dates.length) return { current: 0, best: 0, longest: 0 }
  let best = 0, curStreak = 0, longest = 0
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) { curStreak = 1; continue }
    const prev = new Date(dates[i - 1] + 'T12:00:00')
    const cur = new Date(dates[i] + 'T12:00:00')
    const diff = (cur - prev) / 86400000
    if (diff === 1) curStreak++
    else { best = Math.max(best, curStreak); curStreak = 1 }
  }
  longest = Math.max(best, curStreak)
  const today = todayISO()
  const yesterday = daysAgo(1)
  const recent = checkDone(today) ? today : (checkDone(yesterday) ? yesterday : null)
  let current = 0
  if (recent) {
    let c = new Date(recent + 'T12:00:00')
    while (checkDone(c.toISOString().split('T')[0])) {
      current++; c.setDate(c.getDate() - 1)
    }
  }
  return { current, best: longest, longest }
}

export const ICON_MAP = {
  run: 'run', book: 'book', sparkles: 'sparkles',
  meditate: 'meditate', water: 'water', food: 'food',
  workout: 'workout', code: 'code', write: 'write',
  sleep: 'sleep', pill: 'pill', music: 'music',
}

export const CATEGORIES = ['Health', 'Fitness', 'Learning', 'Productivity', 'Mindfulness', 'Creative', 'Finance', 'Social', 'General']

export const COLOR_OPTIONS = [
  { id: 'emerald', label: 'Emerald', class: 'icon-emerald' },
  { id: 'amber', label: 'Amber', class: 'icon-amber' },
  { id: 'rose', label: 'Rose', class: 'icon-rose' },
  { id: 'sky', label: 'Sky', class: 'icon-sky' },
  { id: 'violet', label: 'Violet', class: 'icon-violet' },
  { id: 'lime', label: 'Lime', class: 'icon-lime' },
  { id: 'neutral', label: 'Neutral', class: 'icon-neutral' },
  { id: 'white', label: 'White', class: 'icon-white' },
]

export const ICON_OPTIONS = [
  { id: 'run', label: 'Run', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>' },
  { id: 'book', label: 'Read', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>' },
  { id: 'sparkles', label: 'Sparkle', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>' },
  { id: 'meditate', label: 'Meditate', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>' },
  { id: 'water', label: 'Water', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>' },
  { id: 'food', label: 'Food', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9V6a3 3 0 116 0v3M9 9h6m0 0a3 3 0 013 3v3a3 3 0 01-3 3H9a3 3 0 01-3-3v-3a3 3 0 013-3z" /></svg>' },
  { id: 'workout', label: 'Workout', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>' },
  { id: 'code', label: 'Code', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg>' },
  { id: 'write', label: 'Write', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>' },
]

export function defaultHabits() {
  return [
    {
      id: uid(), title: 'Morning Run', category: 'Fitness', icon: 'run', color: 'emerald',
      schedule: 'daily', habitType: 'boolean', target: null, unit: null,
      createdAt: new Date().toISOString(), archived: false,
      sortOrder: 0, history: {}, notes: {}, skips: {},
    },
    {
      id: uid(), title: 'Read 30 mins', category: 'Learning', icon: 'book', color: 'sky',
      schedule: 'daily', habitType: 'duration', target: 30, unit: 'min',
      createdAt: new Date().toISOString(), archived: false,
      sortOrder: 1, history: {}, notes: {}, skips: {},
    },
    {
      id: uid(), title: 'Drink 2L Water', category: 'Health', icon: 'water', color: 'amber',
      schedule: 'daily', habitType: 'count', target: 8, unit: 'glasses',
      createdAt: new Date().toISOString(), archived: false,
      sortOrder: 2, history: {}, notes: {}, skips: {},
    },
  ]
}

/* ───── Gamification ───── */
const LEVELS = [
  { level: 1, name: 'Beginner', xp: 0 },
  { level: 2, name: 'Apprentice', xp: 100 },
  { level: 3, name: 'Regular', xp: 300 },
  { level: 4, name: 'Committed', xp: 600 },
  { level: 5, name: 'Dedicated', xp: 1000 },
  { level: 6, name: 'Focused', xp: 1500 },
  { level: 7, name: 'Disciplined', xp: 2100 },
  { level: 8, name: 'Consistent', xp: 2800 },
  { level: 9, name: 'Habit Master', xp: 3600 },
  { level: 10, name: 'Legend', xp: 4500 },
]

export function calcLevel(xp) {
  let last = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.xp) last = l
    else break
  }
  return last
}

export function calcXPForHabit(habit, dateStr) {
  const val = habit.history?.[dateStr]
  if (!val) return 0
  if (habit.habitType === 'boolean') return val ? 10 : 0
  if (habit.habitType === 'count') {
    const done = Math.min(val, habit.target || 1)
    return Math.round((done / (habit.target || 1)) * 10)
  }
  if (habit.habitType === 'duration') {
    const done = Math.min(val, habit.target || 1)
    return Math.round((done / (habit.target || 1)) * 10)
  }
  return 0
}

export function calcBadges(habits, meta) {
  const badges = []
  const active = habits.filter(h => !h.archived)
  const totalCompletions = active.reduce((s, h) => s + Object.values(h.history || {}).filter(v => !!v).length, 0)

  if (totalCompletions >= 1) badges.push({ id: 'first', label: 'First Step', icon: '★' })
  if (active.some(h => calcStreak(h.history || {}, h) >= 7)) badges.push({ id: 'week', label: 'Week Warrior', icon: '⚔' })
  if (active.some(h => {
    const hs = h.history || {}
    const skips = h.skips || {}
    return calcStreak(hs, h) >= 30
  })) badges.push({ id: 'fortress', label: 'Fortress', icon: '🏰' })
  if (active.some(h => calcStreak(h.history || {}, h) >= 100)) badges.push({ id: 'cent', label: 'Centurion', icon: '🗡' })
  if (active.length >= 5) badges.push({ id: 'collector', label: 'Collector', icon: '📚' })
  if (active.some(h => Object.values(h.notes || {}).some(n => n))) badges.push({ id: 'note', label: 'Note Taker', icon: '✍' })
  if (active.some(h => {
    const streak = calcStreak(h.history || {}, h)
    return streak >= 365
  })) badges.push({ id: 'year', label: 'Year Hero', icon: '👑' })

  return badges
}

export function calcTotalXP(habits) {
  let xp = 0
  for (const h of habits) {
    if (h.archived) continue
    for (const [d, v] of Object.entries(h.history || {})) {
      if (v === undefined || v === null || v === false || v === 0) continue
      if (h.habitType === 'boolean') xp += 10
      else if (h.habitType === 'count') {
        const done = Math.min(v, h.target || 1)
        xp += Math.round((done / (h.target || 1)) * 10)
      } else if (h.habitType === 'duration') {
        const done = Math.min(v, h.target || 1)
        xp += Math.round((done / (h.target || 1)) * 10)
      } else {
        xp += 10
      }
    }
  }
  return xp
}

export function calcNextLevelXP(currentLevel) {
  const next = LEVELS.find(l => l.level === currentLevel + 1)
  return next ? next.xp : LEVELS[LEVELS.length - 1].xp
}

export function confetti() {
  const container = document.createElement('div')
  container.className = 'confetti-container'
  const colors = ['#fff', '#fbbf24', '#34d399', '#f43f5e', '#38bdf8', '#a78bfa']
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div')
    piece.className = 'confetti-piece'
    piece.style.left = Math.random() * 100 + '%'
    piece.style.background = colors[Math.floor(Math.random() * colors.length)]
    piece.style.width = (Math.random() * 6 + 4) + 'px'
    piece.style.height = (Math.random() * 6 + 4) + 'px'
    piece.style.animationDuration = (Math.random() * 1.5 + 1) + 's'
    piece.style.animationDelay = (Math.random() * 0.5) + 's'
    container.appendChild(piece)
  }
  document.body.appendChild(container)
  setTimeout(() => container.remove(), 2500)
}

export const SVG_ICONS = {
  bell: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>',
  run: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>',
  book: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>',
  sparkles: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>',
  plus: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  archive: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>',
  unarchive: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" /></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>',
  upload: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>',
  habits: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" /></svg>',
  stats: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
  meditate: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>',
  water: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>',
  food: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9V6a3 3 0 116 0v3M9 9h6m0 0a3 3 0 013 3v3a3 3 0 01-3 3H9a3 3 0 01-3-3v-3a3 3 0 013-3z" /></svg>',
  workout: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>',
  code: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg>',
  write: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>',
}
