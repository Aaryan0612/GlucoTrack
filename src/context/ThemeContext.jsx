import { createContext, useContext, useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '../utils/storage';

const ThemeContext = createContext();

function getInitialTheme() {
  const saved = loadSettings()?.theme;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#1A1A18' : '#2D6A4F');
    }
    
    const settings = loadSettings();
    saveSettings({ ...settings, theme });
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
