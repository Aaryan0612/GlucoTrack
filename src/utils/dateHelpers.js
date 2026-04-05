export function getMostRecentSaturday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 6 ? 0 : (dayOfWeek + 1);
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysToSubtract);
  return saturday.toISOString().split('T')[0];
}

export function isTodaySaturday() {
  return new Date().getDay() === 6;
}

export function wasInsulinTakenThisSaturday(insulinLog) {
  const thisSat = getMostRecentSaturday();
  return insulinLog.some(r => r.scheduledDate === thisSat && r.taken === true);
}

export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

export function formatTime(dateStr) {
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function roundToNearest5Minutes(date = new Date()) {
  const ms = 1000 * 60 * 5;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

export function getDefaultMealType() {
  const hour = new Date().getHours();
  if (hour < 10) return 'fasting';
  if (hour >= 12 && hour < 20) return 'post-meal';
  if (hour >= 21) return 'bedtime';
  return 'other';
}
