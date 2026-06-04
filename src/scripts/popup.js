import * as Store from './storage.js'
import {
  todayISO, formatDate, dayShort, weekRange, monthRange, calcStreak, calcRate, isDone,
  calcLevel, calcTotalXP, calcBadges, calcNextLevelXP, confetti, SVG_ICONS,
  CATEGORIES, ICON_OPTIONS, COLOR_OPTIONS, uid
} from './helpers.js'

let state = { habits: [], meta: { bestStreak: 0 } }
let activeTab = 'tabHabits'

const $ = (s, p = document) => p.querySelector(s)
const $$ = (s, p = document) => [...p.querySelectorAll(s)]

/* ───── Init ───── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadState()
  renderDate()
  renderHabitsTab()
  renderStatsTab()
  renderSettingsTab()
  buildConfirmModal()
  bindUI()
})

async function loadState() {
  state = await Store.loadAll()
  if (!state.meta.xp) state.meta.xp = calcTotalXP(state.habits)
  state._badgeCount = calcBadges(state.habits, state.meta).length
}

async function persist() {
  await Store.saveHabits(state.habits)
}

/* ───── Date ───── */
function renderDate() {
  const el = $('#currentDate')
  if (el) el.textContent = formatDate(todayISO())
}

/* ══════════════════════════════════════════════════════════
   TAB SWITCHING
   ══════════════════════════════════════════════════════════ */
function switchTab(id) {
  activeTab = id
  $$('.tab-content').forEach(el => el.classList.toggle('active', el.id === id))
  $$('.nav-btn').forEach(el => el.classList.toggle('active', el.dataset.tab === id))
  const titles = { tabHabits: 'Habits', tabStats: 'Stats', tabSettings: 'Settings' }
  const titleEl = $('#pageTitle')
  if (titleEl) titleEl.textContent = titles[id] || 'Habits'

  if (id === 'tabStats') renderStatsTab()
  if (id === 'tabSettings') renderSettingsTab()

  const scrollEl = document.querySelector(`#${id} .tab-scroll`) || document.getElementById(id)
  if (scrollEl) scrollEl.scrollTop = 0

  const fab = $('#fab')
  if (fab) fab.classList.toggle('hidden', id !== 'tabHabits')
}

/* ══════════════════════════════════════════════════════════
   HABITS TAB
   ══════════════════════════════════════════════════════════ */
function renderHabitsTab() {
  const today = todayISO()
  const active = state.habits.filter(h => !h.archived)
  const done = active.filter(h => isDone(h, today)).length
  const total = active.length

  $('#doneToday').textContent = done
  $('#bestStreak').textContent = state.meta.bestStreak || 0

  const allHistory = {}
  active.forEach(h => Object.assign(allHistory, h.history || {}))
  $('#completionRate').textContent = calcRate(allHistory) + '%'

  renderXP()
  renderWeekGrid(active)
  renderHabitList(active)
}

function renderXP() {
  const container = $('#xpBar')
  if (!container) return
  const xp = state.meta.xp || calcTotalXP(state.habits)
  const level = calcLevel(xp)
  const nextXP = calcNextLevelXP(level.level)
  const prevXP = level.xp
  const range = nextXP - prevXP
  const progress = range ? Math.min(((xp - prevXP) / range) * 100, 100) : 100
  const badges = calcBadges(state.habits, state.meta)

  container.innerHTML = `
<div class="xp-bar">
  <div class="lvl-badge">${level.level}</div>
  <div class="xp-info">
    <div class="lvl-label">${level.name}</div>
    <div class="xp-label">${xp} XP &middot; Next: ${nextXP} XP</div>
    <div class="xp-track"><div class="xp-fill" style="width:${progress}%"></div></div>
  </div>
  <div class="badges">
    ${badges.slice(0, 5).map(b => `<div class="mini-badge earned" title="${b.label}">${b.icon}</div>`).join('')}
    ${badges.length > 5 ? `<div class="mini-badge earned">+${badges.length - 5}</div>` : ''}
  </div>
</div>`
}

function renderWeekGrid(habits) {
  const container = $('#weekGrid')
  if (!container) return
  const today = todayISO()
  const days = weekRange(today)
  container.innerHTML = days.map((d, i) => {
    const done = habits.filter(h => isDone(h, d)).length
    const pct = habits.length ? Math.round((done / habits.length) * 100) : 0
    const isFuture = d > today
    let cls = 'w-no'
    let label = '-'
    if (pct > 80) { cls = 'w-ok'; label = `${pct}%` }
    else if (pct > 60) { cls = 'w-hi'; label = `${pct}%` }
    else if (pct > 40) { cls = 'w-md'; label = `${pct}%` }
    else if (pct > 20) { cls = 'w-lo'; label = `${pct}%` }
    else if (pct > 0) { cls = 'w-mi'; label = `${pct}%` }
    return `<div class="week-day ${isFuture ? 'op-40' : ''}"><span>${dayShort(i)}</span><div class="week-cell ${cls}">${isFuture ? '-' : label}</div></div>`
  }).join('')
}

function renderHabitList(habits) {
  const container = $('#habitList')
  if (!container) return
  const today = todayISO()

  if (!habits.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:0.85rem"><div style="font-size:2rem;margin-bottom:8px;opacity:.4">+</div>Tap + to add your first habit</div>`
    return
  }

  container.innerHTML = habits.map((h, idx) => {
    const done = isDone(h, today)
    const streak = calcStreak(h.history || {}, h)
    const icon = SVG_ICONS[h.icon] || SVG_ICONS.run
    const val = h.history?.[today] || 0
    const isMeasurable = h.habitType === 'count' || h.habitType === 'duration'
    const pct = isMeasurable && h.target ? Math.round(Math.min(val / h.target, 1) * 100) : (done ? 100 : 0)

    const isSkipped = h.skips?.[today] || false

    const actionBtns = `
  <div class="habit-actions">
    <button class="action-btn" data-act="skip" title="${isSkipped ? 'Remove skip' : 'Skip day'}">${isSkipped ? '&#10003;' : '&#9881;'}</button>
    <button class="action-btn" data-act="archive" title="Archive"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg></button>
    <button class="action-btn danger" data-act="delete" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
  </div>`

    let rightContent = ''
    if (isMeasurable) {
      const unit = h.unit || 'x'
      rightContent = `
<div class="habit-right">
  ${actionBtns}
  <div class="counter-wrap ${done ? 'done' : ''}">
    <button class="counter-btn" data-act="dec">−</button>
    <div class="counter-val">${val}</div>
    <span class="counter-slash">/</span>
    <span class="counter-target">${h.target}</span>
    <button class="counter-btn" data-act="inc">+</button>
  </div>
  ${done ? `<div class="mini-check">${SVG_ICONS.check}</div>` : ''}
  ${isSkipped ? `<span class="skip-badge">skipped</span>` : ''}
</div>`
    } else {
      rightContent = `
<div class="habit-right">
  ${actionBtns}
  <button class="check-btn ${done ? 'checked' : ''}">${SVG_ICONS.check}</button>
  ${isSkipped ? `<span class="skip-badge">skipped</span>` : ''}
</div>`
    }

    const note = h.notes?.[today] || ''
    const hasNote = !!note

    return `<div class="habit ${done ? 'done' : ''}" data-id="${h.id}" style="animation-delay:${idx*0.04}s">
<div class="habit-main-row">
<div class="habit-left">
  <div class="habit-icon icon-${h.color || 'emerald'}">${icon}</div>
  <div class="habit-info">
    <div class="habit-title ${done ? 'done' : ''}">${h.title}</div>
    <div class="habit-meta">${h.category} &middot; ${streak}d streak${isMeasurable ? ` &middot; ${pct}%` : ''}</div>
  </div>
</div>
<div class="habit-right-wrap">
  <button class="more-btn" data-act="toggle-actions" title="More">&#8942;</button>
  <button class="note-btn ${hasNote ? 'has-note' : ''}" data-act="note" title="${hasNote ? 'Edit note' : 'Add note'}">${hasNote ? '!' : '&#9998;'}</button>
${rightContent}
</div>
</div>
<div class="habit-note-area" id="note-${h.id}">
  <textarea class="note-input" rows="2" placeholder="Quick note...">${note}</textarea>
  <div style="display:flex;gap:6px;margin-top:6px">
    <button class="btn-primary" style="padding:6px 12px;font-size:0.75rem" data-act="save-note">Save</button>
    <button class="btn-secondary" style="padding:6px 12px;font-size:0.75rem" data-act="cancel-note">Cancel</button>
  </div>
</div>
</div>`
  }).join('')
}

/* ══════════════════════════════════════════════════════════
   STATS TAB
   ══════════════════════════════════════════════════════════ */
function renderStatsTab() {
  const active = state.habits.filter(h => !h.archived)
  const today = todayISO()
  const doneToday = active.filter(h => isDone(h, today)).length
  const totalActive = active.length
  const allHistory = {}
  active.forEach(h => Object.assign(allHistory, h.history || {}))
  const overallRate = calcRate(allHistory)
  const streaks = active.map(h => calcStreak(h.history || {}, h))
  const currentBest = Math.max(...streaks, 0)

  // Overview grid
  const grid = $('#statsOverview')
  if (grid) {
    grid.innerHTML = `
<div class="stats-card"><div class="num">${totalActive}</div><div class="lbl">Active Habits</div></div>
<div class="stats-card"><div class="num green">${doneToday}</div><div class="lbl">Done Today</div></div>
<div class="stats-card"><div class="num">${currentBest}</div><div class="lbl">Current Best Streak</div></div>
<div class="stats-card"><div class="num muted">${state.meta.bestStreak || 0}</div><div class="lbl">All-time Best</div></div>
<div class="stats-card full">
  <div style="display:flex;align-items:baseline;justify-content:center;gap:4px">
    <span class="num" style="font-size:1.6rem">${overallRate}%</span>
    <span class="lbl">completion rate</span>
  </div>
  <div style="margin-top:6px;height:4px;background:var(--surface);border-radius:4px;overflow:hidden">
    <div style="height:100%;width:${overallRate}%;background:var(--text);border-radius:4px;transition:width .5s"></div>
  </div>
</div>`
  }

  renderCalendar(active)
}

const COLOR_HEX = {
  emerald:'#34d399', amber:'#fbbf24', rose:'#f43f5e', sky:'#38bdf8',
  violet:'#a78bfa', lime:'#a3e635', neutral:'#a3a3a3', white:'#fff'
}

function renderCalendar(habits) {
  const container = $('#calendarView')
  if (!container) return
  const today = todayISO()
  const days = monthRange(today)
  const headers = ['S','M','T','W','T','F','S'].map(d => `<div class="cal-head">${d}</div>`).join('')
  const startDow = new Date(days[0] + 'T12:00:00').getDay()
  const blanks = Array(startDow).fill('<div class="cal-day"></div>').join('')

  const cells = days.map(d => {
    const dots = habits.filter(h => isDone(h, d)).map(h =>
      `<span class="cal-dot" style="background:${COLOR_HEX[h.color] || '#34d399'}"></span>`
    ).join('')
    const isToday = d === today
    return `<div class="cal-day ${isToday ? 'today' : ''}">${d.split('-')[2]}${dots ? `<div class="cal-dots">${dots}</div>` : ''}</div>`
  }).join('')

  container.innerHTML = `<div class="cal-grid">${headers}${blanks}${cells}</div>`
}

/* ══════════════════════════════════════════════════════════
   SETTINGS TAB
   ══════════════════════════════════════════════════════════ */
function renderSettingsTab() {
  const archived = state.habits.filter(h => h.archived)
  const container = $('#archivedList')
  if (!container) return
  if (!archived.length) { container.innerHTML = '<div class="about-text">None archived.</div>'; return }
  container.innerHTML = archived.map(h => {
    const icon = SVG_ICONS[h.icon] || SVG_ICONS.run
    return `<div class="setting-card">
  <div class="info" style="display:flex;align-items:center;gap:10px">
    <div class="habit-icon icon-${h.color || 'emerald'}" style="width:32px;height:32px">${icon}</div>
    <div><div class="title">${h.title}</div><div class="desc">${h.category} &middot; archived</div></div>
  </div>
  <button class="action-btn" data-act="unarchive" data-id="${h.id}">Restore</button>
</div>`
  }).join('')
}

/* ══════════════════════════════════════════════════════════
   ADD HABIT MODAL
   ══════════════════════════════════════════════════════════ */
let selectedIcon = 'run'
let selectedColor = 'emerald'

function openModal() {
  const modal = $('#addModal')
  if (!modal) return

  $('#habitTitle').value = ''
  selectedIcon = 'run'
  selectedColor = 'emerald'

  // Populate category dropdown
  const catSel = $('#habitCategory')
  catSel.innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')

  // Icon picker
  const ip = $('#iconPicker')
  if (ip) {
    ip.innerHTML = ICON_OPTIONS.map(o =>
      `<button class="picker-btn ${o.id === selectedIcon ? 'active' : ''}" data-icon="${o.id}">${o.svg}</button>`
    ).join('')
  }

  // Color picker
  const cp = $('#colorPicker')
  if (cp) {
    cp.innerHTML = COLOR_OPTIONS.map(o =>
      `<button class="color-swatch ${o.id} ${o.id === selectedColor ? 'active' : ''}" data-color="${o.id}" title="${o.label}"></button>`
    ).join('')
  }

  // Type conditional fields
  const targetGroup = $('#targetGroup')
  const unitGroup = $('#unitGroup')
  if (targetGroup) targetGroup.style.display = 'none'
  if (unitGroup) unitGroup.style.display = 'none'
  $('#habitType').value = 'boolean'

  modal.classList.add('open')
}

function closeModal() {
  $('#addModal').classList.remove('open')
}

async function saveNewHabit() {
  const title = $('#habitTitle').value.trim()
  if (!title) { toast('Please enter a habit title'); return }
  const category = $('#habitCategory').value
  const schedule = $('#habitSchedule').value
  const habitType = $('#habitType').value
  const target = habitType === 'boolean' ? null : parseInt($('#habitTarget').value) || null
  const unit = habitType === 'boolean' ? null : ($('#habitUnit').value.trim() || null)
  if (habitType !== 'boolean' && (!target || target < 1)) { toast('Please enter a valid target'); return }
  await Store.addHabit({ title, category, icon: selectedIcon, color: selectedColor, schedule, habitType, target, unit })
  await loadState()
  renderHabitsTab()
  renderStatsTab()
  renderSettingsTab()
  closeModal()
  toast(`"${title}" created`)
}

/* ══════════════════════════════════════════════════════════
   BIND UI EVENTS
   ══════════════════════════════════════════════════════════ */
function bindUI() {
  // Tab switching
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  })

  // FAB
  $('#fab').addEventListener('click', openModal)

  // Scroll-based FAB hide/show
  let lastScroll = 0
  document.addEventListener('scroll', () => {
    const fab = $('#fab')
    if (!fab || activeTab !== 'tabHabits') return
    const cur = window.scrollY
    if (cur > lastScroll && cur > 20) fab.classList.add('hidden')
    else fab.classList.remove('hidden')
    lastScroll = cur
  }, { passive: true })

  // Modal close
  $('#modalClose').addEventListener('click', closeModal)
  $('#addModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal() })
  $('#saveHabit').addEventListener('click', saveNewHabit)
  $('#habitTitle').addEventListener('keydown', e => { if (e.key === 'Enter') saveNewHabit() })

  // Icon picker (delegated)
  $('#iconPicker').addEventListener('click', e => {
    const btn = e.target.closest('.picker-btn')
    if (!btn) return
    selectedIcon = btn.dataset.icon
    $$('.picker-btn', $('#iconPicker')).forEach(b => b.classList.toggle('active', b.dataset.icon === selectedIcon))
  })

  // Color picker (delegated)
  $('#colorPicker').addEventListener('click', e => {
    const btn = e.target.closest('.color-swatch')
    if (!btn) return
    selectedColor = btn.dataset.color
    $$('.color-swatch', $('#colorPicker')).forEach(b => b.classList.toggle('active', b.dataset.color === selectedColor))
  })

  // Habit type change → show/hide target/unit
  $('#habitType').addEventListener('change', () => {
    const type = $('#habitType').value
    const targetGroup = $('#targetGroup')
    const unitGroup = $('#unitGroup')
    if (targetGroup) targetGroup.style.display = type === 'boolean' ? 'none' : ''
    if (unitGroup) unitGroup.style.display = type === 'boolean' ? 'none' : ''
    if (type === 'duration') $('#habitUnit').value = 'min'
    else if (type === 'count') $('#habitUnit').value = ''
  })

  function updateBestStreak() {
    const streaks = state.habits.filter(h => !h.archived).map(h => calcStreak(h.history || {}, h))
    const best = Math.max(...streaks, 0)
    Store.updateBestStreak(best)
    state.meta.bestStreak = best
  }

  async function syncXP() {
    const xp = calcTotalXP(state.habits)
    await Store.updateXP(xp)
    state.meta.xp = xp
    return xp
  }

  async function trackMilestone(prevXP) {
    const badges = calcBadges(state.habits, state.meta)
    const prevBadgeCount = state._badgeCount || 0
    if (badges.length > prevBadgeCount && prevBadgeCount > 0) {
      confetti()
      toast(`New badge earned!`)
    }
    state._badgeCount = badges.length
  }

  // Habit list delegated: check, archive, delete, inc, dec
  $('#habitList').addEventListener('click', async e => {
    const item = e.target.closest('.habit')
    if (!item) return
    const id = item.dataset.id
    const habit = state.habits.find(h => h.id === id)
    if (!habit) return
    const today = todayISO()

    // Check button (boolean only)
    if (e.target.closest('.check-btn')) {
      const prevXP = calcTotalXP(state.habits)
      await Store.toggleHabit(id, today)
      await loadState()
      renderHabitsTab()
      renderStatsTab()
      updateBestStreak()
      await syncXP()
      trackMilestone(prevXP)
    }

    // Counter increment
    if (e.target.closest('[data-act="inc"]')) {
      const current = habit.history?.[today] || 0
      const step = habit.habitType === 'duration' ? 5 : 1
      await Store.setHabitValue(id, today, current + step)
      await loadState()
      renderHabitsTab()
      renderStatsTab()
      updateBestStreak()
      await syncXP()
    }

    // Counter decrement
    if (e.target.closest('[data-act="dec"]')) {
      const current = habit.history?.[today] || 0
      const step = habit.habitType === 'duration' ? 5 : 1
      await Store.setHabitValue(id, today, Math.max(0, current - step))
      await loadState()
      renderHabitsTab()
      renderStatsTab()
      updateBestStreak()
      await syncXP()
    }

    // Toggle actions menu
    if (e.target.closest('[data-act="toggle-actions"]')) {
      const actions = item.querySelector('.habit-actions')
      if (actions) {
        const nowOpen = actions.classList.toggle('open')
        if (nowOpen) {
          const close = e => {
            if (!e.target.closest(`[data-id="${id}"]`)) {
              actions.classList.remove('open')
              document.removeEventListener('click', close)
            }
          }
          setTimeout(() => document.addEventListener('click', close), 0)
        }
      }
    }

    // Skip day
    if (e.target.closest('[data-act="skip"]')) {
      await Store.skipHabit(id, today)
      await loadState()
      renderHabitsTab()
      renderStatsTab()
      updateBestStreak()
    }

    // Note toggle
    if (e.target.closest('[data-act="note"]')) {
      const area = document.getElementById(`note-${id}`)
      if (area) area.classList.toggle('open')
    }

    // Save note
    if (e.target.closest('[data-act="save-note"]')) {
      const area = document.getElementById(`note-${id}`)
      const textarea = area?.querySelector('.note-input')
      if (textarea) {
        await Store.setHabitNote(id, today, textarea.value.trim())
        await loadState()
        renderHabitsTab()
        toast('Note saved')
      }
    }

    // Cancel note
    if (e.target.closest('[data-act="cancel-note"]')) {
      const area = document.getElementById(`note-${id}`)
      if (area) area.classList.remove('open')
    }

    // Delete
    if (e.target.closest('[data-act="delete"]')) {
      const ok = await customConfirm('Delete habit', 'Delete this habit permanently?', true)
      if (!ok) return
      await Store.removeHabit(id)
      await loadState()
      renderHabitsTab()
      renderStatsTab()
      renderSettingsTab()
    }
  })

  // Settings: export
  $('#exportBtn').addEventListener('click', async () => {
    const json = await Store.exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `habits-${todayISO()}.json`
    a.click(); URL.revokeObjectURL(url)
    toast('Data exported')
  })

  // Settings: import
  $('#importBtn').addEventListener('click', () => $('#importFile').click())
  $('#importFile').addEventListener('change', async e => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      await Store.importData(text)
      await loadState()
      renderHabitsTab(); renderStatsTab(); renderSettingsTab()
      toast('Data imported')
    } catch { toast('Invalid file', true) }
    e.target.value = ''
  })

  // Settings: reset
  $('#resetBtn').addEventListener('click', async () => {
    const ok = await customConfirm('Reset all data', 'Delete ALL habits and history? This cannot be undone.', true)
    if (!ok) return
    await Store.clearAll()
    await loadState()
    renderHabitsTab(); renderStatsTab(); renderSettingsTab()
    toast('All data cleared')
  })

  // Settings: unarchive
  $('#archivedList').addEventListener('click', async e => {
    const btn = e.target.closest('[data-act="unarchive"]')
    if (!btn) return
    await Store.archiveHabit(btn.dataset.id)
    await loadState()
    renderHabitsTab()
    renderSettingsTab()
    toast('Habit restored')
  })
}

/* ───── Custom Confirm Modal ───── */
function buildConfirmModal() {
  if ($('#_confirmOverlay')) return
  const div = document.createElement('div')
  div.id = '_confirmOverlay'
  div.className = 'confirm-overlay'
  div.innerHTML = `<div class="confirm-box">
    <div class="confirm-title" id="_confirmTitle"></div>
    <div class="confirm-msg" id="_confirmMsg"></div>
    <div class="confirm-actions">
      <button class="btn btn-cancel" id="_confirmCancel">Cancel</button>
      <button class="btn btn-danger" id="_confirmOk">Delete</button>
    </div>
  </div>`
  document.body.appendChild(div)

  div.addEventListener('click', e => {
    if (e.target === div) resolveConfirm(false)
  })
  $('#_confirmCancel').addEventListener('click', () => resolveConfirm(false))
}

let _confirmResolve = null

function resolveConfirm(val) {
  if (_confirmResolve) _confirmResolve(val)
  _confirmResolve = null
  $('#_confirmOverlay').classList.remove('open')
}

function customConfirm(title, msg, destructive = false) {
  return new Promise(resolve => {
    _confirmResolve = resolve
    const overlay = $('#_confirmOverlay')
    $('#_confirmTitle').textContent = title
    $('#_confirmMsg').textContent = msg
    const okBtn = $('#_confirmOk')
    okBtn.textContent = destructive ? 'Delete' : 'Confirm'
    okBtn.className = destructive ? 'btn btn-danger' : 'btn btn-primary'
    overlay.classList.add('open')
    okBtn.onclick = () => resolveConfirm(true)
  })
}

/* ───── Toast ───── */
function toast(msg, isError = false) {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'toast'
  el.textContent = msg
  if (isError) el.style.borderColor = 'var(--danger)'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2200)
}
