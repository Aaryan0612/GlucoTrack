import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Food from './pages/Food';
import Goals from './pages/Goals';
import LogReading from './pages/LogReading';
import Progress from './pages/Progress';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Report from './pages/Report';
import BottomNav from './components/layout/BottomNav';
import DailyReminderManager from './components/layout/DailyReminderManager';
import InstallPrompt from './components/layout/InstallPrompt';
import OpeningQuote from './components/layout/OpeningQuote';
import Toast from './components/shared/Toast';

// Auth Protection Component
function ProtectedRoute({ children }) {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="login-page loading-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg, #FAF7F2)', gap: '16px', color: 'var(--color-text-secondary, #5C5C5C)' }}>
        <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid var(--color-primary-pale, #D8F3DC)', borderTop: '4px solid var(--color-primary, #2D6A4F)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Warm greetings, preparing your space...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useApp();
  
  return (
    <>
      {user && <DailyReminderManager />}
      {user && <OpeningQuote />}
      {user && <InstallPrompt />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/food" element={<ProtectedRoute><Food /></ProtectedRoute>} />
        <Route path="/log" element={<ProtectedRoute><LogReading /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <BottomNav />}
      <Toast />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
