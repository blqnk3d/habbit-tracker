import { defaultHabits, uid } from './helpers.js'

const DB = 'habbit-tracker'
const STORE = 'data'
const META = '__meta__'

function openDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 2)
    r.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function get(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(key)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function set(key, val) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(val, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function del(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadAll() {
  const [habits, meta] = await Promise.all([get('habits'), get(META)])
  if (habits) return { habits, meta: meta || { bestStreak: 0 } }
  const init = defaultHabits()
  const m = { bestStreak: 0 }
  await Promise.all([set('habits', init), set(META, m)])
  return { habits: init, meta: m }
}

export async function getHabits() {
  const h = await get('habits')
  if (h) return h
  const init = defaultHabits()
  await set('habits', init)
  return init
}

export async function saveHabits(habits) {
  await set('habits', habits)
}

export async function addHabit({ title, category, icon, color, schedule, habitType, target, unit }) {
  const habits = await getHabits()
  const h = {
    id: uid(),
    title,
    category: category || 'General',
    icon: icon || 'run',
    color: color || 'emerald',
    schedule: schedule || 'daily',
    habitType: habitType || 'boolean',
    target: target || null,
    unit: unit || null,
    createdAt: new Date().toISOString(),
    archived: false,
    sortOrder: habits.length,
    history: {},
    notes: {},
    skips: {},
  }
  habits.push(h)
  await set('habits', habits)
  return h
}

export async function removeHabit(id) {
  let habits = await getHabits()
  habits = habits.filter(h => h.id !== id)
  await set('habits', habits)
}

export async function archiveHabit(id) {
  const habits = await getHabits()
  const h = habits.find(x => x.id === id)
  if (h) { h.archived = !h.archived; await set('habits', habits) }
}

export async function toggleHabit(id, dateStr) {
  const habits = await getHabits()
  const h = habits.find(x => x.id === id)
  if (!h) return false
  if (!h.history) h.history = {}
  if (h.habitType === 'count' || h.habitType === 'duration') {
    const current = h.history[dateStr] || 0
    const target = h.target || 1
    if (current >= target) {
      h.history[dateStr] = 0
    } else {
      h.history[dateStr] = target
    }
  } else {
    h.history[dateStr] = !h.history[dateStr]
  }
  await set('habits', habits)
  return h.history[dateStr]
}

export async function setHabitValue(id, dateStr, value) {
  const habits = await getHabits()
  const h = habits.find(x => x.id === id)
  if (!h) return
  if (!h.history) h.history = {}
  h.history[dateStr] = Math.max(0, value)
  await set('habits', habits)
}

export async function skipHabit(id, dateStr) {
  const habits = await getHabits()
  const h = habits.find(x => x.id === id)
  if (!h) return
  if (!h.skips) h.skips = {}
  h.skips[dateStr] = !h.skips[dateStr]
  await set('habits', habits)
}

export async function setHabitNote(id, dateStr, note) {
  const habits = await getHabits()
  const h = habits.find(x => x.id === id)
  if (!h) return
  if (!h.notes) h.notes = {}
  h.notes[dateStr] = note
  await set('habits', habits)
}

export async function updateBestStreak(streak) {
  const meta = await get(META) || { bestStreak: 0 }
  if (streak > (meta.bestStreak || 0)) {
    meta.bestStreak = streak
    await set(META, meta)
  }
  return meta.bestStreak
}

export async function updateXP(xp) {
  const meta = await get(META) || { bestStreak: 0 }
  meta.xp = xp
  await set(META, meta)
}

export async function getMeta() {
  return (await get(META)) || { bestStreak: 0 }
}

export async function getBestStreak() {
  const meta = await get(META) || { bestStreak: 0 }
  return meta.bestStreak || 0
}

export async function exportData() {
  const [habits, meta] = await Promise.all([get('habits'), get(META)])
  return JSON.stringify({ habits: habits || [], meta: meta || {}, exportedAt: new Date().toISOString() }, null, 2)
}

export async function importData(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (data.habits) await set('habits', data.habits)
  if (data.meta) await set(META, data.meta)
  return data
}

export async function clearAll() {
  await Promise.all([del('habits'), del(META)])
}
