// Rolling calendar utilities
// Instead of static MO/DI/MI... we use real dates

const DAY_KEYS = ['SO','MO','DI','MI','DO','FR','SA'];

// Get the real date for a given day offset from today
export function getRealDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
}

// Get the date for a specific weekday in the current week
// weekday: 0=SO, 1=MO, ... 6=SA
export function getDateForWeekday(targetWeekday) {
  const today = new Date();
  const todayWeekday = today.getDay(); // 0=Sun, 1=Mon...
  const diff = targetWeekday - todayWeekday;
  const d = new Date(today);
  d.setDate(d.getDate() + diff);
  return d;
}

// Get all 7 days of the current week with real dates
export function getCurrentWeek() {
  const today = new Date();
  const todayWeekday = today.getDay();

  return DAY_KEYS.map((key, idx) => {
    const diff = idx - todayWeekday;
    const d = new Date(today);
    d.setDate(d.getDate() + diff);
    return {
      key,
      date: d,
      dateStr: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
      dateKey: d.toISOString().split('T')[0],
      isToday: diff === 0,
      isPast: diff < 0,
      isFuture: diff > 0,
    };
  });
}

// Get the date key (YYYY-MM-DD) for a given day key in current week
export function getDateKeyForDay(dayKey) {
  const week = getCurrentWeek();
  return week.find(d => d.key === dayKey)?.dateKey || new Date().toISOString().split('T')[0];
}

// Format a date as "Mo. 4. Mai"
export function formatDayLabel(date) {
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Get upcoming days (next 7 days from today)
export function getUpcomingDays(count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const d = getRealDate(i);
    return {
      key: DAY_KEYS[d.getDay()],
      date: d,
      dateStr: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
      dateKey: d.toISOString().split('T')[0],
      isToday: i === 0,
    };
  });
}
