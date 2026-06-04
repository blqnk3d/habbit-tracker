import * as Store from './storage.js';
import {
  getToday, dayShort, SVG_ICONS, calcStreak, calcRate, todayISO,
} from './helpers.js';

/* ───── State ───── */
let habits = [];
let data = {};
let currentDate = todayISO();

/* ───── DOM refs ───── */
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* ───── Init ───── */
document.addEventListener('DOMContentLoaded', async () => {
  await render();
  setupEventListeners();
});

async function render() {
  data = await Store.loadAll();
  habits = data.habits || [];

  renderDate();
  renderStats();
  renderWeek();
  renderHabits();
}

/* ───── Date ───── */
function renderDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const today = getToday();
  el.textContent = `${today.weekday}, ${today.monthDay}`;
}

/* ───── Stats ───── */
function renderStats() {
  const todayStr = todayISO();
  const doneToday = habits.filter(h => h.history?.[todayStr]).length;
  const bestStreak = data.bestStreak || 0;
  const totalRate = calcRate(
    Object.fromEntries(
      habits.flatMap(h => Object.entries(h.history || {}))
    )
  );

  const completedEl = document.getElementById('completedCount');
  if (completedEl) completedEl.textContent = doneToday;

  const streakEl = document.getElementById('bestStreak');
  if (streakEl) streakEl.textContent = bestStreak;

  const rateEl = document.getElementById('rate');
  if (rateEl) rateEl.textContent = `${totalRate}%`;
}

/* ───── Week heatmap ───── */
function renderWeek() {
  const container = document.getElementById('weekGrid');
  if (!container) return;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  container.innerHTML = days.map((d, i) => {
    const key = d.toISOString().split('T')[0];
    const total = habits.length || 1;
    const done = habits.filter(h => h.history?.[key]).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    let bg = 'bg-slate-700';
    let label = '-';
    if (pct > 80) { bg = 'bg-primary'; label = `${pct}%`; }
    else if (pct > 60) { bg = 'bg-primary/80'; label = `${pct}%`; }
    else if (pct > 40) { bg = 'bg-primary/60'; label = `${pct}%`; }
    else if (pct > 20) { bg = 'bg-primary/40'; label = `${pct}%`; }
    else if (pct > 0) { bg = 'bg-primary/30'; label = `${pct}%`; }

    const isFuture = key > todayISO();
    const opacity = isFuture ? 'opacity-40' : '';

    return `
      <div class="flex flex-col items-center gap-2 ${opacity}">
        <span class="text-xs text-slate-500">${dayShort(i)}</span>
        <div class="w-8 h-8 rounded-lg ${bg} flex items-center justify-center text-xs font-bold text-white week-cell">
          ${isFuture ? '-' : label}
        </div>
      </div>
    `;
  }).join('');
}

/* ───── Habits ───── */
function renderHabits() {
  const container = document.getElementById('habitList');
  if (!container) return;

  if (!habits.length) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-500">
        <p class="text-lg mb-2">No habits yet</p>
        <p class="text-sm">Tap + to add your first habit</p>
      </div>
    `;
    return;
  }

  const todayStr = todayISO();
  container.innerHTML = habits.map(h => {
    const isCompleted = h.history?.[todayStr] || false;
    const streak = calcStreak(h.history || {});
    const iconSvg = SVG_ICONS[h.icon] || SVG_ICONS.run;

    return `
      <div class="habit-item bg-card p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-primary/30 transition ${isCompleted ? 'opacity-60' : ''}" data-id="${h.id}">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-${h.color}-500/20 text-${h.color}-400 flex items-center justify-center">
            ${iconSvg}
          </div>
          <div>
            <h3 class="font-medium text-white ${isCompleted ? 'line-through' : ''}">${h.title}</h3>
            <p class="text-xs text-slate-400">${h.category} &bull; ${streak} day streak</p>
          </div>
        </div>
        <button class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition check-btn ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600 text-transparent hover:border-primary'}">
          ${SVG_ICONS.check}
        </button>
      </div>
    `;
  }).join('');
}

/* ───── Events ───── */
function setupEventListeners() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.check-btn');
    if (btn) {
      const item = btn.closest('.habit-item');
      if (!item) return;
      const id = item.dataset.id;
      const now = new Date().toISOString().split('T')[0];
      const isNow = await Store.toggleHabit(id, now);
      await render();
      const streak = calcStreak(
        Object.fromEntries(
          habits.flatMap(h => Object.entries(h.history || {}))
        )
      );
      await Store.updateBestStreak(streak);
    }
  });
}
