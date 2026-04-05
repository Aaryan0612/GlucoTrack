import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getTodaysFasting, getTodaysPostMeal } from '../utils/aggregations';
import { getTimeOfDay, formatDate, formatTime } from '../utils/dateHelpers';
import { getReadingStatus, getStatusLabel } from '../utils/statusHelpers';
import { Sun, Moon, Plus } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { readings, settings } = useApp();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (settings && !settings.onboardingComplete) {
      navigate('/onboarding');
    }
  }, [settings, navigate]);

  if (!settings) return null;

  const todayFasting = getTodaysFasting(readings);
  const todayPostMeal = getTodaysPostMeal(readings);
  const timeOfDay = getTimeOfDay();
  const todayDate = formatDate(new Date().toISOString());

  return (
    <div className="page dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="greeting">Good {timeOfDay}, {settings.userName}</h1>
          <p className="date">{todayDate}</p>
        </div>
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="card today-summary">
        <h2>Today's Readings</h2>
        
        {!todayFasting && !todayPostMeal ? (
          <p className="empty-message">No readings yet today — tap + to add</p>
        ) : (
          <div className="readings-grid">
            {todayFasting && (
              <div className="reading-item">
                <span className="reading-label">Fasting</span>
                <div className="reading-value-row">
                  <span className="reading-value">{todayFasting.value}</span>
                  <span className="reading-unit">mg/dL</span>
                </div>
                <span className={`status-badge status-${getReadingStatus(todayFasting.value, 'fasting')}`}>
                  {getStatusLabel(getReadingStatus(todayFasting.value, 'fasting'))}
                </span>
              </div>
            )}
            
            {todayPostMeal && (
              <div className="reading-item">
                <span className="reading-label">Post-Meal</span>
                <div className="reading-value-row">
                  <span className="reading-value">{todayPostMeal.value}</span>
                  <span className="reading-unit">mg/dL</span>
                </div>
                <span className={`status-badge status-${getReadingStatus(todayPostMeal.value, 'post-meal')}`}>
                  {getStatusLabel(getReadingStatus(todayPostMeal.value, 'post-meal'))}
                </span>
              </div>
            )}
          </div>
        )}
        
        {(todayFasting || todayPostMeal) && (
          <p className="last-updated">
            Last updated at {formatTime((todayPostMeal || todayFasting).loggedAt)}
          </p>
        )}
      </div>

      <button className="btn-primary btn-log" onClick={() => navigate('/log')}>
        <Plus size={20} />
        Log a Reading
      </button>
    </div>
  );
}

export default Dashboard;
