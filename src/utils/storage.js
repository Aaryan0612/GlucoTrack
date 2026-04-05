const KEYS = {
  readings: 'glucotrack_readings',
  insulinLog: 'glucotrack_insulin_log',
  foodLog: 'glucotrack_food_log',
  goalsLog: 'glucotrack_goals_log',
  goalTargets: 'glucotrack_goal_targets',
  settings: 'glucotrack_settings',
};

const DEFAULT_SETTINGS = {
  reminderEnabled: true,
  reminderTime: '09:00',
  theme: 'light',
  userName: '',
  onboardingComplete: false,
  installPromptDismissed: false,
  pastReadingsHintDismissed: false,
  lastGoalsNudgeHandledDate: null,
};

const DEFAULT_GOAL_TARGETS = {
  walk: { targetMins: 20 },
  meditation: { targetMins: 10 },
  exercise: { targetMins: 15 },
};

export const QUICK_ADD_ITEMS = {
  breakfast: ['Oats', 'Eggs', 'Bread', 'Milk', 'Tea', 'Coffee', 'Idli', 'Upma', 'Poha', 'Banana', 'Apple', 'Curd'],
  lunch: ['Rice', 'Dal', 'Roti', 'Sabzi', 'Salad', 'Curd', 'Buttermilk', 'Chicken', 'Fish', 'Paneer'],
  snacks: ['Nuts', 'Sprouts', 'Tea', 'Coffee', 'Biscuits', 'Fruit', 'Makhana', 'Chana', 'Yoghurt'],
  dinner: ['Roti', 'Sabzi', 'Dal', 'Rice', 'Soup', 'Salad', 'Paneer', 'Chicken', 'Fish', 'Khichdi'],
};

export function loadData(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function getDateKey(input = new Date()) {
  const date = typeof input === 'string' ? new Date(input) : input;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Readings
export function getAllReadings() {
  return loadData(KEYS.readings) || [];
}

export function addReading(reading) {
  const readings = getAllReadings();
  const newReading = {
    ...reading,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  readings.push(newReading);
  saveData(KEYS.readings, readings);
  return newReading;
}

export function deleteReading(id) {
  const readings = getAllReadings().filter((reading) => reading.id !== id);
  saveData(KEYS.readings, readings);
}

export function updateReading(id, updates) {
  const readings = getAllReadings().map((reading) =>
    reading.id === id ? { ...reading, ...updates } : reading
  );
  saveData(KEYS.readings, readings);
}

export function checkDuplicateReading(readings, date, mealType) {
  return readings.some((reading) => getDateKey(reading.loggedAt) === date && reading.mealType === mealType);
}

// Food log
export function getAllFoodLog() {
  return loadData(KEYS.foodLog) || [];
}

export function getFoodForDate(date) {
  return getAllFoodLog().filter((entry) => entry.date === date);
}

export function saveMealEntry(entry) {
  const log = getAllFoodLog();
  const existingIndex = log.findIndex(
    (record) => record.date === entry.date && record.mealType === entry.mealType
  );

  if (existingIndex >= 0) {
    log[existingIndex] = {
      ...log[existingIndex],
      ...entry,
      createdAt: log[existingIndex].createdAt,
    };
  } else {
    log.push({
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  }

  saveData(KEYS.foodLog, log);
}

export function deleteMealEntry(id) {
  const log = getAllFoodLog().filter((entry) => entry.id !== id);
  saveData(KEYS.foodLog, log);
}

// Goals
export function getAllGoalsLog() {
  return loadData(KEYS.goalsLog) || [];
}

export function getGoalsForDate(date) {
  return getAllGoalsLog().find((record) => record.date === date) || null;
}

export function toggleGoal(date, goalKey) {
  const log = getAllGoalsLog();
  const existing = log.find((record) => record.date === date);
  const now = new Date().toISOString();

  if (existing) {
    const isCurrentlyDone = existing[goalKey].completed;
    existing[goalKey] = {
      completed: !isCurrentlyDone,
      completedAt: !isCurrentlyDone ? now : null,
    };
    existing.updatedAt = now;
    saveData(KEYS.goalsLog, log);
    return existing;
  }

  const newRecord = {
    id: crypto.randomUUID(),
    date,
    walk: { completed: false, completedAt: null },
    meditation: { completed: false, completedAt: null },
    exercise: { completed: false, completedAt: null },
    createdAt: now,
    updatedAt: now,
  };

  newRecord[goalKey] = { completed: true, completedAt: now };
  log.push(newRecord);
  saveData(KEYS.goalsLog, log);
  return newRecord;
}

export function saveGoalsForDate(date, updates) {
  const log = getAllGoalsLog();
  const existing = log.find((record) => record.date === date);
  const now = new Date().toISOString();

  if (existing) {
    ['walk', 'meditation', 'exercise'].forEach((goalKey) => {
      if (goalKey in updates) {
        existing[goalKey] = {
          completed: updates[goalKey],
          completedAt: updates[goalKey] ? existing[goalKey]?.completedAt || now : null,
        };
      }
    });
    existing.updatedAt = now;
    saveData(KEYS.goalsLog, log);
    return existing;
  }

  const newRecord = {
    id: crypto.randomUUID(),
    date,
    walk: { completed: Boolean(updates.walk), completedAt: updates.walk ? now : null },
    meditation: { completed: Boolean(updates.meditation), completedAt: updates.meditation ? now : null },
    exercise: { completed: Boolean(updates.exercise), completedAt: updates.exercise ? now : null },
    createdAt: now,
    updatedAt: now,
  };
  log.push(newRecord);
  saveData(KEYS.goalsLog, log);
  return newRecord;
}

export function getGoalTargets() {
  return loadData(KEYS.goalTargets) || DEFAULT_GOAL_TARGETS;
}

export function updateGoalTarget(goalKey, targetMins) {
  const targets = getGoalTargets();
  targets[goalKey] = { targetMins };
  saveData(KEYS.goalTargets, targets);
}

// Insulin
export function getAllInsulinRecords() {
  return loadData(KEYS.insulinLog) || [];
}

export function addInsulinRecord(record) {
  const records = getAllInsulinRecords();
  const existingIndex = records.findIndex(
    (entry) => entry.scheduledDate === record.scheduledDate
  );
  const normalized = {
    ...record,
    id: existingIndex >= 0 ? records[existingIndex].id : crypto.randomUUID(),
    createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    records[existingIndex] = normalized;
  } else {
    records.push(normalized);
  }

  saveData(KEYS.insulinLog, records);
  return normalized;
}

// Settings
export function loadSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...(loadData(KEYS.settings) || {}),
  };
}

export function saveSettings(settings) {
  saveData(KEYS.settings, {
    ...DEFAULT_SETTINGS,
    ...settings,
  });
}

export function updateSettings(partialSettings) {
  const settings = loadSettings();
  const nextSettings = { ...settings, ...partialSettings };
  saveSettings(nextSettings);
  return nextSettings;
}

export { DEFAULT_GOAL_TARGETS, DEFAULT_SETTINGS, KEYS };
