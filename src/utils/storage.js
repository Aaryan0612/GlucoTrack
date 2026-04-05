const KEYS = {
  readings: 'glucotrack_readings',
  insulinLog: 'glucotrack_insulin_log',
  settings: 'glucotrack_settings',
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

// Readings
export function getAllReadings() {
  return loadData(KEYS.readings) || [];
}

export function addReading(reading) {
  const readings = getAllReadings();
  readings.push({ 
    ...reading, 
    id: crypto.randomUUID(), 
    createdAt: new Date().toISOString() 
  });
  saveData(KEYS.readings, readings);
  return readings[readings.length - 1];
}

export function deleteReading(id) {
  const readings = getAllReadings().filter(r => r.id !== id);
  saveData(KEYS.readings, readings);
}

export function updateReading(id, updates) {
  const readings = getAllReadings().map(r => 
    r.id === id ? { ...r, ...updates } : r
  );
  saveData(KEYS.readings, readings);
}

// Insulin Log
export function getAllInsulinRecords() {
  return loadData(KEYS.insulinLog) || [];
}

export function addInsulinRecord(record) {
  const records = getAllInsulinRecords();
  records.push({
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  });
  saveData(KEYS.insulinLog, records);
  return records[records.length - 1];
}

// Settings
export function loadSettings() {
  return loadData(KEYS.settings) || {
    reminderEnabled: true,
    reminderTime: '09:00',
    theme: 'light',
    userName: '',
    onboardingComplete: false
  };
}

export function saveSettings(settings) {
  saveData(KEYS.settings, settings);
}
