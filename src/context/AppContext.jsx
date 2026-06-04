import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import {
  DEFAULT_CARE_PLANS,
  DEFAULT_GOAL_TARGETS,
  DEFAULT_SETTINGS,
  addReading as dbAddReading,
  deleteReading as dbDeleteReading,
  updateReading as dbUpdateReading,
  saveMealEntry as dbSaveMealEntry,
  deleteMealEntry as dbDeleteMealEntry,
  toggleGoal as dbToggleGoal,
  saveGoalsForDate as dbSaveGoalsForDate,
  updateGoalTarget as dbUpdateGoalTarget,
  updateCarePlan as dbUpdateCarePlan,
  addInsulinRecord as dbAddInsulinRecord,
  updateSettings as dbUpdateSettings,
  addReminder as dbAddReminder,
  updateReminder as dbUpdateReminder,
  deleteReminder as dbDeleteReminder,
  addMedicine as dbAddMedicine,
  updateMedicine as dbUpdateMedicine,
  deleteMedicine as dbDeleteMedicine,
  addMedicineLog as dbAddMedicineLog,
  deleteMedicineLog as dbDeleteMedicineLog,
  addWaterLog as dbAddWaterLog,
  deleteWaterLog as dbDeleteWaterLog,
  addWeightLog as dbAddWeightLog,
  deleteWeightLog as dbDeleteWeightLog
} from '../utils/storage';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Scoped collection states
  const [readings, setReadings] = useState([]);
  const [foodLog, setFoodLog] = useState([]);
  const [goalsLog, setGoalsLog] = useState([]);
  const [goalTargets, setGoalTargets] = useState(null);
  const [carePlans, setCarePlans] = useState(null);
  const [insulinLog, setInsulinLog] = useState([]);
  const [settings, setSettings] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicineLogs, setMedicineLogs] = useState([]);
  const [waterLog, setWaterLog] = useState([]);
  const [weightLog, setWeightLog] = useState([]);

  const [toast, setToast] = useState(null);

  // Handle Authentication State Changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const dbUid = useMemo(() => {
    if (!user) return null;
    const ALLOWED_EMAILS = ['aaryankuchekar06@gmail.com', 'kuchekarnandini3@gmail.com'];
    if (user.email && ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
      return 'shared_mom_tracker';
    }
    return user.uid;
  }, [user]);

  // Handle Firestore subscriptions scoped by user UID
  useEffect(() => {
    if (!dbUid) {
      // Clear data states if logged out
      setReadings([]);
      setFoodLog([]);
      setGoalsLog([]);
      setGoalTargets(null);
      setCarePlans(null);
      setInsulinLog([]);
      setSettings(null);
      setReminders([]);
      setMedicines([]);
      setMedicineLogs([]);
      setWaterLog([]);
      setWeightLog([]);
      return undefined;
    }

    const uid = dbUid;

    // Subscriptions setup
    const unsubReadings = onSnapshot(collection(db, 'users', uid, 'readings'), (snap) => {
      setReadings(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubFoodLog = onSnapshot(collection(db, 'users', uid, 'foodLog'), (snap) => {
      setFoodLog(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubGoalsLog = onSnapshot(collection(db, 'users', uid, 'goalsLog'), (snap) => {
      setGoalsLog(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubInsulinLog = onSnapshot(collection(db, 'users', uid, 'insulinLog'), (snap) => {
      setInsulinLog(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubReminders = onSnapshot(collection(db, 'users', uid, 'reminders'), (snap) => {
      setReminders(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubMedicines = onSnapshot(collection(db, 'users', uid, 'medicines'), (snap) => {
      if (snap.empty) {
        // Pre-populate her 5 discharge medications from Dr. Pooja Shah
        const DISCHARGE_MEDICINES = [
          {
            name: 'Tab Gliclazide + Metformin (60/500)',
            dosage: '60/500 mg (1 tablet)',
            time: '08:30',
            notes: 'Morning dose (1-0-1), take with breakfast. PO (By mouth)',
            active: true
          },
          {
            name: 'Tab Gliclazide + Metformin (60/500)',
            dosage: '60/500 mg (1 tablet)',
            time: '20:30',
            notes: 'Night dose (1-0-1), take with dinner. PO (By mouth)',
            active: true
          },
          {
            name: 'Tab Voglibose',
            dosage: '0.2 mg (1 tablet)',
            time: '08:30',
            notes: 'Morning dose (1-0-1), take before breakfast. PO (By mouth)',
            active: true
          },
          {
            name: 'Tab Voglibose',
            dosage: '0.2 mg (1 tablet)',
            time: '20:30',
            notes: 'Night dose (1-0-1), take before dinner. PO (By mouth)',
            active: true
          },
          {
            name: 'Tab Linagliptin + Dapa (5/10)',
            dosage: '5/10 mg (1 tablet)',
            time: '13:30',
            notes: 'Afternoon dose (0-1-0), take with lunch. PO (By mouth)',
            active: true
          },
          {
            name: 'Inj Lantus (Insulin)',
            dosage: '8 units',
            time: '22:00',
            notes: 'Bedtime dose (0-0-8-0) at 10 PM. S/C (Subcutaneous)',
            active: true
          },
          {
            name: 'Tab Linezolid',
            dosage: '600 mg (1 tablet)',
            time: '08:30',
            notes: 'Morning dose (1-0-1) for 5 days. PO (By mouth)',
            active: true
          },
          {
            name: 'Tab Linezolid',
            dosage: '600 mg (1 tablet)',
            time: '20:30',
            notes: 'Night dose (1-0-1) for 5 days. PO (By mouth)',
            active: true
          }
        ];
        DISCHARGE_MEDICINES.forEach(med => dbAddMedicine(uid, med));
      } else {
        setMedicines(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
    });

    const unsubMedicineLogs = onSnapshot(collection(db, 'users', uid, 'medicineLogs'), (snap) => {
      setMedicineLogs(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubWaterLog = onSnapshot(collection(db, 'users', uid, 'waterLog'), (snap) => {
      setWaterLog(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubWeightLog = onSnapshot(collection(db, 'users', uid, 'weightLog'), (snap) => {
      setWeightLog(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    // Single document configurations with self-healing defaults
    const unsubSettings = onSnapshot(doc(db, 'users', uid, 'settings', 'main'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        // First login setup
        const defaultName = user.displayName ? user.displayName.split(' ')[0] : 'there';
        const initialSettings = { ...DEFAULT_SETTINGS, userName: defaultName };
        setDoc(doc(db, 'users', uid, 'settings', 'main'), initialSettings);
        setSettings(initialSettings);
      }
    });

    const unsubTargets = onSnapshot(doc(db, 'users', uid, 'goalTargets', 'main'), (snap) => {
      if (snap.exists()) {
        setGoalTargets(snap.data());
      } else {
        setDoc(doc(db, 'users', uid, 'goalTargets', 'main'), DEFAULT_GOAL_TARGETS);
        setGoalTargets(DEFAULT_GOAL_TARGETS);
      }
    });

    const unsubPlans = onSnapshot(doc(db, 'users', uid, 'carePlans', 'main'), (snap) => {
      if (snap.exists()) {
        setCarePlans(snap.data());
      } else {
        setDoc(doc(db, 'users', uid, 'carePlans', 'main'), DEFAULT_CARE_PLANS);
        setCarePlans(DEFAULT_CARE_PLANS);
      }
    });

    // Cleanup all listeners on unmount or user change
    return () => {
      unsubReadings();
      unsubFoodLog();
      unsubGoalsLog();
      unsubInsulinLog();
      unsubReminders();
      unsubMedicines();
      unsubMedicineLogs();
      unsubWaterLog();
      unsubWeightLog();
      unsubSettings();
      unsubTargets();
      unsubPlans();
    };
  }, [dbUid]);

  // Auth Operations
  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
      showToast('Successfully signed in! 🌿');
    } catch (err) {
      console.error("Google sign-in error:", err);
      const suffix = err.code ? `: ${err.code}` : `: ${err.message || err}`;
      showToast(`Could not complete Google Sign-in${suffix}`, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out successfully');
    } catch (err) {
      console.error(err);
      showToast('Could not sign out', 'error');
    }
  };

  // Toast alert messaging
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => setToast(null), 2800);
  };

  // Facaded async CRUD calls
  const addReading = (reading) => dbAddReading(dbUid, reading);
  const deleteReading = (id) => dbDeleteReading(dbUid, id);
  const updateReading = (id, updates) => dbUpdateReading(dbUid, id, updates);

  const saveMealEntry = (entry) => dbSaveMealEntry(dbUid, entry);
  const deleteMealEntry = (id) => dbDeleteMealEntry(dbUid, id);

  const toggleGoal = (date, goalKey) => {
    const goalsRecord = goalsLog.find((record) => record.date === date);
    return dbToggleGoal(dbUid, date, goalKey, goalsRecord);
  };

  const saveGoalsForDate = (date, updates) => {
    const goalsRecord = goalsLog.find((record) => record.date === date);
    return dbSaveGoalsForDate(dbUid, date, updates, goalsRecord);
  };

  const updateGoalTarget = (goalKey, targetMins) => dbUpdateGoalTarget(dbUid, goalKey, targetMins);
  const updateCarePlan = (section, key, value) => dbUpdateCarePlan(dbUid, section, key, value);

  const addInsulinRecord = (record) => dbAddInsulinRecord(dbUid, record);
  const updateSettings = (partialSettings) => dbUpdateSettings(dbUid, partialSettings);

  const addReminder = (reminder) => dbAddReminder(dbUid, reminder);
  const updateReminder = (id, updates) => dbUpdateReminder(dbUid, id, updates);
  const deleteReminder = (id) => dbDeleteReminder(dbUid, id);

  const addMedicine = (medicine) => dbAddMedicine(dbUid, medicine);
  const updateMedicine = (id, updates) => dbUpdateMedicine(dbUid, id, updates);
  const deleteMedicine = (id) => dbDeleteMedicine(dbUid, id);

  const addMedicineLog = (logEntry) => dbAddMedicineLog(dbUid, logEntry);
  const deleteMedicineLog = (id) => dbDeleteMedicineLog(dbUid, id);

  const addWaterLog = (amountMl, dateStr) => dbAddWaterLog(dbUid, amountMl, dateStr);
  const deleteWaterLog = (id) => dbDeleteWaterLog(dbUid, id);

  const addWeightLog = (weightKg) => dbAddWeightLog(dbUid, weightKg, settings?.height || 155);
  const deleteWeightLog = (id) => dbDeleteWeightLog(dbUid, id);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      readings,
      foodLog,
      goalsLog,
      goalTargets,
      carePlans,
      insulinLog,
      settings,
      reminders,
      medicines,
      medicineLogs,
      waterLog,
      weightLog,
      toast,
      signInWithGoogle,
      signOut: handleSignOut,
      addReading,
      deleteReading,
      updateReading,
      saveMealEntry,
      deleteMealEntry,
      toggleGoal,
      saveGoalsForDate,
      updateGoalTarget,
      updateCarePlan,
      addInsulinRecord,
      updateSettings,
      addReminder,
      updateReminder,
      deleteReminder,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      addMedicineLog,
      deleteMedicineLog,
      addWaterLog,
      deleteWaterLog,
      addWeightLog,
      deleteWeightLog,
      showToast,
    }),
    [
      user,
      authLoading,
      carePlans,
      foodLog,
      goalTargets,
      goalsLog,
      insulinLog,
      readings,
      settings,
      reminders,
      medicines,
      medicineLogs,
      waterLog,
      weightLog,
      toast
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
