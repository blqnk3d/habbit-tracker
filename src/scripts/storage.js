import { defaultHabits } from './helpers.js';

const STORAGE_KEY = 'habbit_tracker';

export async function loadAll() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY];
  if (data) return data;
  const init = { habits: defaultHabits(), streak: 0, bestStreak: 0 };
  await saveAll(init);
  return init;
}

export async function saveAll(data) {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

export async function getHabits() {
  const data = await loadAll();
  return data.habits;
}

export async function saveHabits(habits) {
  const data = await loadAll();
  data.habits = habits;
  await saveAll(data);
}

export async function toggleHabit(habitId, dateStr) {
  const data = await loadAll();
  const habit = data.habits.find(h => h.id === habitId);
  if (!habit) return;
  if (!habit.history) habit.history = {};
  habit.history[dateStr] = !habit.history[dateStr];
  await saveAll(data);
  return habit.history[dateStr];
}

export async function addHabit(habit) {
  const data = await loadAll();
  data.habits.push(habit);
  await saveAll(data);
}

export async function removeHabit(habitId) {
  const data = await loadAll();
  data.habits = data.habits.filter(h => h.id !== habitId);
  await saveAll(data);
}

export async function updateBestStreak(streak) {
  const data = await loadAll();
  if (streak > (data.bestStreak || 0)) {
    data.bestStreak = streak;
    await saveAll(data);
  }
  return data.bestStreak;
}
