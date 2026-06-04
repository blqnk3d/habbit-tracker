chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get('habbit_tracker');
  if (!result.habbit_tracker) {
    const { defaultHabits } = await import('./helpers.js');
    await chrome.storage.local.set({
      habbit_tracker: { habits: defaultHabits(), streak: 0, bestStreak: 0 },
    });
  }
});
