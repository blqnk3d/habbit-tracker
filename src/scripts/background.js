const DEFAULT_HABITS = [
  { id: '1', title: 'Morning Run', category: 'Health', icon: 'run', color: 'blue', history: {} },
  { id: '2', title: 'Read 30 mins', category: 'Learning', icon: 'book', color: 'purple', history: {} },
  { id: '3', title: 'Drink 2L Water', category: 'Health', icon: 'sparkles', color: 'green', history: {} },
];

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get('habbit_tracker');
  if (!result.habbit_tracker) {
    await chrome.storage.local.set({
      habbit_tracker: { habits: DEFAULT_HABITS, streak: 0, bestStreak: 0 },
    });
  }
});
