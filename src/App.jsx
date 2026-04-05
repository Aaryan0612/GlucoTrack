import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import LogReading from './pages/LogReading';
import Progress from './pages/Progress';
import Insulin from './pages/Insulin';
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
            <Route path="/log" element={<LogReading />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/insulin" element={<Insulin />} />
          </Routes>
          <BottomNav />
          <Toast />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
