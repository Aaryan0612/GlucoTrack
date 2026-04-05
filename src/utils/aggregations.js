export function getReadingsForDate(readings, dateStr) {
  return readings.filter(r => r.loggedAt.startsWith(dateStr));
}

export function getReadingsInRange(readings, startDate, endDate) {
  return readings.filter(r => {
    const d = new Date(r.loggedAt);
    return d >= startDate && d <= endDate;
  });
}

export function getAverage(readings) {
  if (!readings.length) return null;
  return Math.round(readings.reduce((sum, r) => sum + r.value, 0) / readings.length);
}

export function getTodaysFasting(readings) {
  const today = new Date().toISOString().split('T')[0];
  return readings
    .filter(r => r.loggedAt.startsWith(today) && r.mealType === 'fasting')
    .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))[0] || null;
}

export function getTodaysPostMeal(readings) {
  const today = new Date().toISOString().split('T')[0];
  return readings
    .filter(r => r.loggedAt.startsWith(today) && r.mealType === 'post-meal')
    .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))[0] || null;
}

export function getInsulinStreak(insulinLog) {
  const saturdays = insulinLog
    .filter(r => r.taken)
    .map(r => r.scheduledDate)
    .sort()
    .reverse();

  if (!saturdays.length) return 0;

  let streak = 0;
  let current = getMostRecentSaturday();

  for (let i = 0; i < saturdays.length; i++) {
    if (saturdays[i] === current) {
      streak++;
      const d = new Date(current);
      d.setDate(d.getDate() - 7);
      current = d.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return streak;
}

function getMostRecentSaturday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 6 ? 0 : (dayOfWeek + 1);
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysToSubtract);
  return saturday.toISOString().split('T')[0];
}
