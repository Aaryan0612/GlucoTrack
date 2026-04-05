export function toDateKey(input = new Date()) {
  const date = typeof input === 'string' ? new Date(input) : input;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(input = new Date()) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(input = new Date()) {
  const date = new Date(input);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function addDays(input, days) {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date;
}

export function formatDate(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatShortDate(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatCalendarLabel(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatTime(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTime(dateInput) {
  return `${formatDate(dateInput)} at ${formatTime(dateInput)}`;
}

export function formatRelativeDayLabel(dateKey) {
  const today = toDateKey();
  const yesterday = toDateKey(addDays(new Date(), -1));
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  return formatShortDate(dateKey);
}

export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function roundToNearest5Minutes(date = new Date()) {
  const ms = 1000 * 60 * 5;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

export function getDefaultMealType(date = new Date()) {
  const hour = new Date(date).getHours();
  if (hour < 10) return 'fasting';
  if (hour >= 12 && hour < 20) return 'post-meal';
  if (hour >= 21) return 'bedtime';
  return 'other';
}

export function toInputDateValue(dateInput) {
  return toDateKey(dateInput);
}

export function toInputTimeValue(dateInput) {
  const date = new Date(dateInput);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function combineDateAndTime(dateKey, timeValue) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return date.toISOString();
}

export function isTodaySaturday() {
  return new Date().getDay() === 6;
}

export function getMostRecentSaturday(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  return toDateKey(addDays(today, -daysToSubtract));
}

export function getUpcomingSaturday(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  const dayOfWeek = today.getDay();
  const daysToAdd = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;
  return toDateKey(addDays(today, daysToAdd));
}

export function wasInsulinTakenThisSaturday(insulinLog) {
  const thisSaturday = getMostRecentSaturday();
  return insulinLog.some((record) => record.scheduledDate === thisSaturday && record.taken);
}

export function shouldShowInsulinBanner(date = new Date()) {
  const now = new Date(date);
  const day = now.getDay();
  const hour = now.getHours();
  return (day === 5 && hour >= 18) || day === 6;
}

export function getWeekDates(referenceDate = new Date()) {
  const date = startOfDay(referenceDate);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, diffToMonday);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function getDaysInRange(days, referenceDate = new Date()) {
  const end = startOfDay(referenceDate);
  return Array.from({ length: days }, (_, index) => addDays(end, -(days - index - 1)));
}

export function getDaysBackLimit(days = 30) {
  return toDateKey(addDays(new Date(), -days));
}

export function getMonthGrid(referenceDate = new Date()) {
  const first = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const gridStart = addDays(first, -(first.getDay() === 0 ? 6 : first.getDay() - 1));
  return Array.from({ length: 35 }, (_, index) => addDays(gridStart, index));
}

export function isSameMonth(a, b) {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return dateA.getMonth() === dateB.getMonth() && dateA.getFullYear() === dateB.getFullYear();
}
