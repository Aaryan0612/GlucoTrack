import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export const KEYS = {
  readings: 'readings',
  insulinLog: 'insulinLog',
  foodLog: 'foodLog',
  goalsLog: 'goalsLog',
  goalTargets: 'goalTargets',
  carePlans: 'carePlans',
  settings: 'settings',
  reminders: 'reminders',
  medicines: 'medicines',
  medicineLogs: 'medicineLogs',
  waterLog: 'waterLog',
  weightLog: 'weightLog'
};

export const DEFAULT_SETTINGS = {
  reminderEnabled: true,
  reminderTime: '09:00',
  theme: 'light',
  userName: '',
  onboardingComplete: false,
  installPromptDismissed: false,
  pastReadingsHintDismissed: false,
  lastGoalsNudgeHandledDate: null,
  lastReminderSentDate: null,
  age: 51,
  height: 155,
  weight: 60,
  hasKneePain: true,
  hasDiabetes: true,
  waterGoalMl: 5000,
};

export const DEFAULT_GOAL_TARGETS = {
  walk: { targetMins: 20 },
  meditation: { targetMins: 10 },
  exercise: { targetMins: 15 },
};

export const DEFAULT_CARE_PLANS = {
  mealPlans: {
    breakfast: 'सात्विक नाश्ता (Oats / Sprouts)\nचहा किंवा कॉफी साखरेशिवाय (नो साखर!)\nStrictly avoid biscuits, toast, or bakery products!',
    lunch: 'ज्वारी / बाजरीची भाकरी (Roti)\nडाळ, उसळ आणि पालेभाजी\nकाकडी, टोमॅटो किंवा कोशिंबीर कोशिंबीर',
    snacks: 'भाजलेला मखणा किंवा भाजलेले चणे\nड्रायफ्रूट्स (बदाम, अक्रोड)\nबेकरीचे पदार्थ आणि गोड खाणे पूर्ण टाळा!',
    dinner: 'हलका आणि लवकर आहार (संध्याकाळी ८ च्या आधी)\nमूग डाळ खिचडी किंवा भाजीचे गरम सूप\nरात्रीचे जेवण वेळेवर घेणे महत्त्वाचे आहे',
  },
  exercisePlans: {
    diabetesPlan: 'रोज २५-३० मिनिटे चालणे (Walking)\nप्राणायाम व दीर्घ श्वसन (Pranayama)\nनेहमी आनंदी, सकारात्मक व खंबीर राहणे!',
    kneePain: 'Supported chair sit-to-stand x 8\nGentle leg raises\nAnkle rotations',
    backPain: 'Wall-supported stretch\nCat-cow on the bed or chair variation\nGentle shoulder rolls',
    stress: '5 minutes deep breathing\nShort guided meditation\nSlow evening walk if comfortable',
  },
};

export const QUICK_ADD_ITEMS = {
  breakfast: ['Oats', 'Eggs', 'Bread', 'Milk', 'Tea', 'Coffee', 'Idli', 'Upma', 'Poha', 'Banana', 'Apple', 'Curd'],
  lunch: ['Rice', 'Dal', 'Roti', 'Sabzi', 'Salad', 'Curd', 'Buttermilk', 'Chicken', 'Fish', 'Paneer'],
  snacks: ['Nuts', 'Sprouts', 'Tea', 'Coffee', 'Biscuits', 'Fruit', 'Makhana', 'Chana', 'Yoghurt'],
  dinner: ['Roti', 'Sabzi', 'Dal', 'Rice', 'Soup', 'Salad', 'Paneer', 'Chicken', 'Fish', 'Khichdi'],
};

// Helpers for scoping collections under users/{userId}/
function getUserDocRef(userId) {
  return doc(db, 'users', userId);
}

function getCollectionRef(userId, key) {
  return collection(db, 'users', userId, key);
}

function getSubDocRef(userId, key, docId) {
  return doc(db, 'users', userId, key, docId);
}

function getDateKey(input = new Date()) {
  const date = typeof input === 'string' ? new Date(input) : input;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Readings CRUD
export async function addReading(userId, reading) {
  if (!userId) return null;
  const ref = getCollectionRef(userId, KEYS.readings);
  const newReading = {
    ...reading,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(ref, newReading);
  return { ...newReading, id: docRef.id };
}

export async function deleteReading(userId, id) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.readings, id);
  await deleteDoc(ref);
}

export async function updateReading(userId, id, updates) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.readings, id);
  await updateDoc(ref, updates);
}

export function checkDuplicateReading(readings, date, mealType) {
  return readings.some((reading) => getDateKey(reading.loggedAt) === date && reading.mealType === mealType);
}

// Food log CRUD
export async function saveMealEntry(userId, entry) {
  if (!userId) return;
  const ref = getCollectionRef(userId, KEYS.foodLog);
  if (entry.id) {
    const docRef = getSubDocRef(userId, KEYS.foodLog, entry.id);
    await setDoc(docRef, { ...entry, updatedAt: new Date().toISOString() }, { merge: true });
  } else {
    const newEntry = {
      ...entry,
      createdAt: new Date().toISOString(),
    };
    await addDoc(ref, newEntry);
  }
}

export async function deleteMealEntry(userId, id) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.foodLog, id);
  await deleteDoc(ref);
}

// Goals CRUD
export async function toggleGoal(userId, date, goalKey, currentGoalsState) {
  if (!userId) return;
  const docRef = getSubDocRef(userId, KEYS.goalsLog, date);
  const now = new Date().toISOString();
  
  if (currentGoalsState) {
    const isCurrentlyDone = currentGoalsState[goalKey]?.completed || false;
    await setDoc(docRef, {
      [goalKey]: {
        completed: !isCurrentlyDone,
        completedAt: !isCurrentlyDone ? now : null,
      },
      updatedAt: now
    }, { merge: true });
  } else {
    const initialRecord = {
      date,
      walk: { completed: false, completedAt: null },
      meditation: { completed: false, completedAt: null },
      exercise: { completed: false, completedAt: null },
      createdAt: now,
      updatedAt: now,
    };
    initialRecord[goalKey] = { completed: true, completedAt: now };
    await setDoc(docRef, initialRecord);
  }
}

export async function saveGoalsForDate(userId, date, updates, currentGoalsState) {
  if (!userId) return;
  const docRef = getSubDocRef(userId, KEYS.goalsLog, date);
  const now = new Date().toISOString();

  if (currentGoalsState) {
    const patch = { updatedAt: now };
    ['walk', 'meditation', 'exercise'].forEach((goalKey) => {
      if (goalKey in updates) {
        patch[goalKey] = {
          completed: Boolean(updates[goalKey]),
          completedAt: updates[goalKey] ? (currentGoalsState[goalKey]?.completedAt || now) : null,
        };
      }
    });
    await setDoc(docRef, patch, { merge: true });
  } else {
    const newRecord = {
      date,
      walk: { completed: Boolean(updates.walk), completedAt: updates.walk ? now : null },
      meditation: { completed: Boolean(updates.meditation), completedAt: updates.meditation ? now : null },
      exercise: { completed: Boolean(updates.exercise), completedAt: updates.exercise ? now : null },
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newRecord);
  }
}

export async function updateGoalTarget(userId, goalKey, targetMins) {
  if (!userId) return;
  const docRef = getSubDocRef(userId, KEYS.goalTargets, 'main');
  await setDoc(docRef, {
    [goalKey]: { targetMins }
  }, { merge: true });
}

// Care Plans CRUD
export async function updateCarePlan(userId, section, key, value) {
  if (!userId) return;
  const docRef = getSubDocRef(userId, KEYS.carePlans, 'main');
  await setDoc(docRef, {
    [section]: {
      [key]: value
    }
  }, { merge: true });
}

// Insulin CRUD
export async function addInsulinRecord(userId, record) {
  if (!userId) return;
  const docRef = getSubDocRef(userId, KEYS.insulinLog, record.scheduledDate);
  const normalized = {
    ...record,
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, normalized, { merge: true });
}

// Settings CRUD
export async function updateSettings(userId, partialSettings) {
  if (!userId) return;
  const docRef = getSubDocRef(userId, KEYS.settings, 'main');
  await setDoc(docRef, partialSettings, { merge: true });
}

// Custom Reminders CRUD
export async function addReminder(userId, reminder) {
  if (!userId) return null;
  const ref = getCollectionRef(userId, KEYS.reminders);
  const newReminder = {
    ...reminder,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(ref, newReminder);
  return { ...newReminder, id: docRef.id };
}

export async function updateReminder(userId, id, updates) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.reminders, id);
  await updateDoc(ref, updates);
}

export async function deleteReminder(userId, id) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.reminders, id);
  await deleteDoc(ref);
}

// Medicines CRUD
export async function addMedicine(userId, medicine) {
  if (!userId) return null;
  const ref = getCollectionRef(userId, KEYS.medicines);
  const newMedicine = {
    ...medicine,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(ref, newMedicine);
  return { ...newMedicine, id: docRef.id };
}

export async function updateMedicine(userId, id, updates) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.medicines, id);
  await updateDoc(ref, updates);
}

export async function deleteMedicine(userId, id) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.medicines, id);
  await deleteDoc(ref);
}

// Medicine logs (intake log) CRUD
export async function addMedicineLog(userId, logEntry) {
  if (!userId) return null;
  const ref = getCollectionRef(userId, KEYS.medicineLogs);
  const newLog = {
    ...logEntry,
    loggedAt: new Date().toISOString(),
  };
  const docRef = await addDoc(ref, newLog);
  return { ...newLog, id: docRef.id };
}

export async function deleteMedicineLog(userId, id) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.medicineLogs, id);
  await deleteDoc(ref);
}

// Water logs CRUD
export async function addWaterLog(userId, amountMl, dateStr) {
  if (!userId) return null;
  const ref = getCollectionRef(userId, KEYS.waterLog);
  const newLog = {
    amountMl: Number(amountMl),
    date: dateStr || getDateKey(),
    loggedAt: new Date().toISOString(),
  };
  const docRef = await addDoc(ref, newLog);
  return { ...newLog, id: docRef.id };
}

export async function deleteWaterLog(userId, id) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.waterLog, id);
  await deleteDoc(ref);
}

// Weight logs CRUD
export async function addWeightLog(userId, weightKg, heightCm) {
  if (!userId) return null;
  const ref = getCollectionRef(userId, KEYS.weightLog);
  const heightM = (Number(heightCm) || 155) / 100;
  const computedBmi = (Number(weightKg) / (heightM * heightM)).toFixed(1);
  const newLog = {
    weight: Number(weightKg),
    bmi: Number(computedBmi),
    date: getDateKey(),
    loggedAt: new Date().toISOString(),
  };
  const docRef = await addDoc(ref, newLog);
  return { ...newLog, id: docRef.id };
}

export async function deleteWeightLog(userId, id) {
  if (!userId || !id) return;
  const ref = getSubDocRef(userId, KEYS.weightLog, id);
  await deleteDoc(ref);
}

