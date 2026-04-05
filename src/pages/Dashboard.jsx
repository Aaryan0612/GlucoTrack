import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, Moon, Plus, Sun, Syringe, Target } from 'lucide-react';
import BottomSheet from '../components/shared/BottomSheet';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  getLatestReading,
  getQuickInsight,
  getTodaysFasting,
  getTodaysPostMeal,
  getWeeklyReadingOverview,
} from '../utils/aggregations';
import {
  formatCalendarLabel,
  formatDate,
  formatTime,
  getTimeOfDay,
  shouldShowInsulinBanner,
  toDateKey,
} from '../utils/dateHelpers';
import { getReadingStatus, getStatusLabel } from '../utils/statusHelpers';
import { addInsulinRecord } from '../utils/storage';
import './Dashboard.css';

const FOOD_MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { key: 'lunch', label: 'Lunch', icon: '🥗' },
  { key: 'snacks', label: 'Snacks', icon: '☕' },
  { key: 'dinner', label: 'Dinner', icon: '🍲' },
];

const GOALS = [
  { key: 'walk', label: 'Walk', icon: '🚶' },
  { key: 'meditation', label: 'Meditation', icon: '🧘' },
  { key: 'exercise', label: 'Exercise', icon: '💪' },
];

function Dashboard() {
  const navigate = useNavigate();
  const { readings, foodLog, goalsLog, insulinLog, settings, refreshInsulinLog, showToast } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (settings && !settings.onboardingComplete) {
      navigate('/onboarding');
    }
  }, [navigate, settings]);

  const todayKey = toDateKey();
  const todayFood = foodLog.filter((entry) => entry.date === todayKey);
  const todayGoals = goalsLog.find((entry) => entry.date === todayKey);
  const todayFasting = getTodaysFasting(readings);
  const todayPostMeal = getTodaysPostMeal(readings);
  const latestReading = getLatestReading(readings);
  const weekOverview = getWeeklyReadingOverview(readings);
  const insight = getQuickInsight({ readings, foodLog, goalsLog });

  const currentSaturday = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysToSaturday = day === 6 ? 0 : 6 - day;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysToSaturday);
    return toDateKey(saturday);
  }, []);
  const insulinTaken = insulinLog.some((record) => record.scheduledDate === currentSaturday && record.taken);

  if (!settings) return null;

  const handleMarkInsulin = () => {
    addInsulinRecord({
      scheduledDate: currentSaturday,
      taken: true,
      takenAt: new Date().toISOString(),
      notes: '',
    });
    refreshInsulinLog();
    showToast('Insulin logged 💉');
  };

  return (
    <div className="page dashboard">
      <header className="dashboard-header">
        <div>
          <p className="section-eyebrow">GlucoTrack</p>
          <h1 className="greeting">Good {getTimeOfDay()}, {settings.userName || 'there'}</h1>
          <p className="date">{formatDate(new Date())}</p>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <section className="card hero-card">
        <div className="section-title-row">
          <h2>Today's Readings</h2>
          <button className="inline-link" onClick={() => navigate('/log')}>
            <Plus size={16} /> Log
          </button>
        </div>
        {!todayFasting && !todayPostMeal ? (
          <p className="empty-message">No readings yet today - tap + to add</p>
        ) : (
          <div className="readings-grid">
            {[todayFasting, todayPostMeal].filter(Boolean).map((reading) => {
              const label = reading.mealType === 'post-meal' ? 'Post-Meal' : 'Fasting';
              const status = getReadingStatus(reading.value, reading.mealType);
              return (
                <div key={reading.id} className="reading-item">
                  <span className="reading-label">{label}</span>
                  <div className="reading-value-row">
                    <span className="reading-value">{reading.value}</span>
                    <span className="reading-unit">mg/dL</span>
                  </div>
                  <span className={`status-badge status-${status}`}>{getStatusLabel(status)}</span>
                </div>
              );
            })}
          </div>
        )}
        {latestReading && (
          <p className="last-updated">Last updated at {formatTime(latestReading.loggedAt)}</p>
        )}
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Today's Goals</h2>
          <button className="inline-link" onClick={() => navigate('/goals')}>
            <Target size={16} /> Details
          </button>
        </div>
        <div className="goal-strip">
          {GOALS.map((goal) => {
            const completed = todayGoals?.[goal.key]?.completed;
            return (
              <button key={goal.key} className={`goal-pill ${completed ? 'done' : ''}`} onClick={() => navigate('/goals')}>
                <span>{goal.icon}</span>
                <span>{goal.label}</span>
                <i>{completed ? '✓' : ''}</i>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Today's Food</h2>
          <button className="inline-link" onClick={() => navigate('/food')}>
            <Apple size={16} /> Open
          </button>
        </div>
        <div className="food-strip">
          {FOOD_MEALS.map((meal) => {
            const entry = todayFood.find((item) => item.mealType === meal.key);
            return (
              <button
                key={meal.key}
                className={`food-summary-card ${entry ? 'logged' : ''}`}
                onClick={() => navigate('/food', { state: { mealType: meal.key } })}
              >
                <span className="food-icon">{meal.icon}</span>
                <strong>{meal.label}</strong>
                <span>{entry ? '✓ Logged' : '+ Add'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Weekly Overview</h2>
          <button className="inline-link" onClick={() => navigate('/progress')}>See trends</button>
        </div>
        <div className="week-strip">
          {weekOverview.map((day) => (
            <button key={day.dateKey} className="week-card" onClick={() => setSelectedDay(day)}>
              <span>{formatCalendarLabel(day.date)}</span>
              <i className={day.hasReading ? 'filled' : ''} />
            </button>
          ))}
        </div>
      </section>

      {settings.reminderEnabled && shouldShowInsulinBanner() && (
        <section className={`card insulin-banner ${insulinTaken ? 'taken' : ''}`}>
          <div className="insulin-copy">
            <Syringe size={20} />
            <div>
              <strong>{insulinTaken ? 'Insulin taken ✓' : "Don't forget your insulin today 💉"}</strong>
              <p>{insulinTaken ? 'This week is already marked.' : 'A quick tap keeps the weekly log complete.'}</p>
            </div>
          </div>
          {!insulinTaken && (
            <button className="banner-btn" onClick={handleMarkInsulin}>
              Mark as Done
            </button>
          )}
        </section>
      )}

      <section className="card insight-card">
        <h2>Quick Insight</h2>
        <p>{insight}</p>
      </section>

      <BottomSheet
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDate(selectedDay.date) : ''}
      >
        {selectedDay && (
          <div className="day-sheet">
            {selectedDay.count ? (
              readings
                .filter((reading) => toDateKey(reading.loggedAt) === selectedDay.dateKey)
                .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))
                .map((reading) => (
                  <div key={reading.id} className="day-sheet-row">
                    <strong>{reading.mealType === 'post-meal' ? 'Post-Meal' : reading.mealType}</strong>
                    <span>{reading.value} mg/dL</span>
                    <small>{formatTime(reading.loggedAt)}</small>
                  </div>
                ))
            ) : (
              <p className="empty-message">No readings saved for this day yet.</p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default Dashboard;
