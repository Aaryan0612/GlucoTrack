import {
  addDays,
  getDaysInRange,
  getMostRecentSaturday,
  startOfDay,
  toDateKey,
} from './dateHelpers';
import { getReadingStatus } from './statusHelpers';

export function getReadingsForDate(readings, dateStr) {
  return readings.filter((reading) => toDateKey(reading.loggedAt) === dateStr);
}

export function getReadingsInRange(readings, startDate, endDate) {
  return readings.filter((reading) => {
    const date = new Date(reading.loggedAt);
    return date >= startDate && date <= endDate;
  });
}

export function getAverage(readings) {
  if (!readings.length) return null;
  return Math.round(readings.reduce((sum, reading) => sum + reading.value, 0) / readings.length);
}

export function getTodaysFasting(readings) {
  const today = toDateKey();
  return readings
    .filter((reading) => toDateKey(reading.loggedAt) === today && reading.mealType === 'fasting')
    .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))[0] || null;
}

export function getTodaysPostMeal(readings) {
  const today = toDateKey();
  return readings
    .filter((reading) => toDateKey(reading.loggedAt) === today && reading.mealType === 'post-meal')
    .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))[0] || null;
}

export function getLatestReading(readings) {
  return [...readings].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0] || null;
}

export function getDailyAverage(readings, dateKey) {
  return getAverage(getReadingsForDate(readings, dateKey));
}

export function getAverageForMealType(readings, mealType) {
  return getAverage(readings.filter((reading) => reading.mealType === mealType));
}

export function getWeeklyReadingOverview(readings, referenceDate = new Date()) {
  const weekDates = getDaysInRange(7, referenceDate);
  return weekDates.map((date) => {
    const dateKey = toDateKey(date);
    const dayReadings = getReadingsForDate(readings, dateKey);
    return {
      dateKey,
      date,
      hasReading: dayReadings.length > 0,
      count: dayReadings.length,
      average: getAverage(dayReadings),
    };
  });
}

export function buildReadingLineData(readings, days) {
  const dates = getDaysInRange(days);
  return dates.map((date) => {
    const dateKey = toDateKey(date);
    const dayReadings = getReadingsForDate(readings, dateKey);
    const fasting = dayReadings.find((reading) => reading.mealType === 'fasting');
    const postMeal = dayReadings.find((reading) => reading.mealType === 'post-meal');
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateKey,
      fasting: fasting?.value ?? null,
      postMeal: postMeal?.value ?? null,
    };
  });
}

export function buildDailyAverageData(readings, days) {
  return getDaysInRange(days).map((date) => {
    const dateKey = toDateKey(date);
    const average = getDailyAverage(readings, dateKey);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateKey,
      average,
      status: average ? getReadingStatus(average, 'other') : null,
    };
  });
}

export function buildGoalsCompletionData(goalsLog, days) {
  return getDaysInRange(days).map((date) => {
    const dateKey = toDateKey(date);
    const record = goalsLog.find((entry) => entry.date === dateKey);
    const completedCount = ['walk', 'meditation', 'exercise'].filter(
      (goalKey) => record?.[goalKey]?.completed
    ).length;
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateKey,
      completedCount,
      remaining: 3 - completedCount,
    };
  });
}

export function getGoalCompletionRate(goalsLog, days) {
  const data = buildGoalsCompletionData(goalsLog, days);
  const daysWithAllGoals = data.filter((entry) => entry.completedCount === 3).length;
  return Math.round((daysWithAllGoals / data.length) * 100);
}

export function getGoalStreak(goalsLog, goalKey) {
  const completedDates = goalsLog
    .filter((entry) => entry[goalKey]?.completed)
    .map((entry) => entry.date)
    .sort()
    .reverse();

  if (!completedDates.length) return 0;

  let streak = 0;
  let checkDate = toDateKey();

  for (const completedDate of completedDates) {
    if (completedDate === checkDate) {
      streak += 1;
      checkDate = toDateKey(addDays(new Date(checkDate), -1));
    } else {
      break;
    }
  }

  return streak;
}

export function getInsulinStreak(insulinLog) {
  const saturdays = insulinLog
    .filter((record) => record.taken)
    .map((record) => record.scheduledDate)
    .sort()
    .reverse();

  if (!saturdays.length) return 0;

  let streak = 0;
  let current = getMostRecentSaturday();

  for (const saturday of saturdays) {
    if (saturday === current) {
      streak += 1;
      current = toDateKey(addDays(new Date(current), -7));
    } else {
      break;
    }
  }

  return streak;
}

export function getFoodLoggedDaysCount(foodLog, startDate, endDate) {
  const uniqueDates = new Set(
    foodLog
      .filter((entry) => {
        const date = startOfDay(new Date(entry.date));
        return date >= startDate && date <= endDate;
      })
      .map((entry) => entry.date)
  );
  return uniqueDates.size;
}

export function getFoodSummaryForDate(foodLog, dateKey) {
  return ['breakfast', 'lunch', 'snacks', 'dinner'].map((mealType) => ({
    mealType,
    entry: foodLog.find((item) => item.date === dateKey && item.mealType === mealType) || null,
  }));
}

export function getQuickInsight({ readings, foodLog, goalsLog }) {
  const weeklyReadings = getReadingsInRange(readings, startOfDay(addDays(new Date(), -6)), new Date());
  const fastingReadings = weeklyReadings.filter((reading) => reading.mealType === 'fasting');
  const todayKey = toDateKey();
  const todayFood = foodLog.filter((entry) => entry.date === todayKey).length;
  const todayGoals = goalsLog.find((entry) => entry.date === todayKey);
  const completedGoals = ['walk', 'meditation', 'exercise'].filter(
    (goalKey) => todayGoals?.[goalKey]?.completed
  ).length;

  if (completedGoals === 3) return 'All three goals are complete today. Wonderful day 🎉';
  if (todayFood === 4) return "You've logged every meal today. Great consistency.";
  if (fastingReadings.length >= 3) {
    const average = getAverage(fastingReadings);
    if (average && average <= 110) {
      return 'Your fasting levels have looked steady this week 🌿';
    }
  }

  return 'A small update today can make tomorrow feel calmer.';
}

function hashString(value) {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function pickMessage(list, seed) {
  return list[hashString(seed) % list.length];
}

export function getPreviousReading(readings, latestReading) {
  if (!latestReading) return null;
  return [...readings]
    .filter(
      (reading) =>
        reading.id !== latestReading.id &&
        reading.mealType === latestReading.mealType &&
        new Date(reading.loggedAt) < new Date(latestReading.loggedAt)
    )
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0] || null;
}

export function getMealTypeWeekAverage(readings, latestReading) {
  if (!latestReading) return null;
  const latestDate = new Date(latestReading.loggedAt);
  const weekStart = startOfDay(addDays(latestDate, -7));
  const weekReadings = readings.filter(
    (reading) =>
      reading.id !== latestReading.id &&
      reading.mealType === latestReading.mealType &&
      new Date(reading.loggedAt) >= weekStart &&
      new Date(reading.loggedAt) < latestDate
  );
  return getAverage(weekReadings);
}

export function getEncouragementMessage(readings) {
  const latestReading = getLatestReading(readings);
  if (!latestReading) {
    return {
      tone: 'steady',
      title: 'One gentle step at a time',
      body: 'Every reading you log helps turn worry into clarity.',
    };
  }

  const status = getReadingStatus(latestReading.value, latestReading.mealType);
  const previousReading = getPreviousReading(readings, latestReading);
  const weekAverage = getMealTypeWeekAverage(readings, latestReading);
  const improvedVsPrevious = previousReading ? latestReading.value < previousReading.value : false;
  const improvedVsWeek = typeof weekAverage === 'number' ? latestReading.value < weekAverage : false;
  const trendUp = previousReading ? latestReading.value > previousReading.value : false;

  const supportiveHighQuotes = [
    {
      title: 'A higher number is not a failure',
      body: 'This is just one moment. You are still doing the right thing by tracking it.',
    },
    {
      title: 'Breathe. This number will pass',
      body: 'One reading does not define your whole day or your progress.',
    },
    {
      title: 'You are stronger than one result',
      body: 'Seeing it early means you can respond with calm and care.',
    },
  ];

  const progressQuotes = [
    {
      title: 'This is progress worth noticing',
      body: 'Today looks a little gentler than before. Keep going with the same care.',
    },
    {
      title: 'Your steady effort is showing',
      body: 'Small daily choices are adding up in a beautiful way.',
    },
    {
      title: 'Well done',
      body: 'This reading is a lovely sign that your consistency is helping.',
    },
  ];

  const neutralQuotes = [
    {
      title: 'You are doing enough today',
      body: 'Logging with honesty is already a meaningful act of self-care.',
    },
    {
      title: 'Keep taking it gently',
      body: 'Calm, regular tracking is one of the best gifts you can give yourself.',
    },
    {
      title: 'Your care matters',
      body: 'Each note you save builds a clearer picture and a calmer routine.',
    },
  ];

  if ((status === 'high' || status === 'caution') && (trendUp || (typeof weekAverage === 'number' && latestReading.value > weekAverage))) {
    return {
      tone: 'supportive',
      ...pickMessage(supportiveHighQuotes, latestReading.id || latestReading.loggedAt),
    };
  }

  if (status === 'normal' || improvedVsPrevious || improvedVsWeek) {
    return {
      tone: 'progress',
      ...pickMessage(progressQuotes, latestReading.id || latestReading.loggedAt),
    };
  }

  return {
    tone: 'steady',
    ...pickMessage(neutralQuotes, latestReading.id || latestReading.loggedAt),
  };
}
