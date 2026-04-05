import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAllFoodLog,
  getAllGoalsLog,
  getAllInsulinRecords,
  getAllReadings,
  getGoalTargets,
  loadSettings,
} from '../utils/storage';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [readings, setReadings] = useState([]);
  const [foodLog, setFoodLog] = useState([]);
  const [goalsLog, setGoalsLog] = useState([]);
  const [goalTargets, setGoalTargets] = useState(null);
  const [insulinLog, setInsulinLog] = useState([]);
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setReadings(getAllReadings());
    setFoodLog(getAllFoodLog());
    setGoalsLog(getAllGoalsLog());
    setGoalTargets(getGoalTargets());
    setInsulinLog(getAllInsulinRecords());
    setSettings(loadSettings());
  }, []);

  const refreshReadings = () => setReadings(getAllReadings());
  const refreshFoodLog = () => setFoodLog(getAllFoodLog());
  const refreshGoalsLog = () => setGoalsLog(getAllGoalsLog());
  const refreshGoalTargets = () => setGoalTargets(getGoalTargets());
  const refreshInsulinLog = () => setInsulinLog(getAllInsulinRecords());
  const refreshSettings = () => setSettings(loadSettings());

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => setToast(null), 2800);
  };

  const value = useMemo(
    () => ({
      readings,
      foodLog,
      goalsLog,
      goalTargets,
      insulinLog,
      settings,
      toast,
      refreshReadings,
      refreshFoodLog,
      refreshGoalsLog,
      refreshGoalTargets,
      refreshInsulinLog,
      refreshSettings,
      showToast,
    }),
    [foodLog, goalTargets, goalsLog, insulinLog, readings, settings, toast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
