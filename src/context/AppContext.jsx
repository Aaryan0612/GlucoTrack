import { createContext, useContext, useState, useEffect } from 'react';
import { getAllReadings, getAllInsulinRecords, loadSettings } from '../utils/storage';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [readings, setReadings] = useState([]);
  const [insulinLog, setInsulinLog] = useState([]);
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setReadings(getAllReadings());
    setInsulinLog(getAllInsulinRecords());
    setSettings(loadSettings());
  }, []);

  const refreshReadings = () => setReadings(getAllReadings());
  const refreshInsulinLog = () => setInsulinLog(getAllInsulinRecords());
  const refreshSettings = () => setSettings(loadSettings());

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AppContext.Provider value={{
      readings,
      insulinLog,
      settings,
      toast,
      refreshReadings,
      refreshInsulinLog,
      refreshSettings,
      showToast
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
