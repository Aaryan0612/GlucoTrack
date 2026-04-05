import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Food from './pages/Food';
import Goals from './pages/Goals';
import LogReading from './pages/LogReading';
import Progress from './pages/Progress';
import Onboarding from './pages/Onboarding';
import BottomNav from './components/layout/BottomNav';
import Toast from './components/shared/Toast';

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/food" element={<Food />} />
            <Route path="/log" element={<LogReading />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
          <Toast />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
