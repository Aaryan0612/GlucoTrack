import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Flame, Minus, Plus } from 'lucide-react';
import BottomSheet from '../components/shared/BottomSheet';
import { useApp } from '../context/AppContext';
import { getGoalStreak } from '../utils/aggregations';
import { getMonthGrid } from '../utils/dateHelpers';
import { toggleGoal, updateGoalTarget } from '../utils/storage';
import { toDateKey, isSameMonth } from '../utils/dateHelpers';
import './Goals.css';

const GOAL_META = {
  walk: {
    emoji: '🚶',
    title: 'Walk',
    description: 'Complete a walk today',
    min: 10,
    max: 60,
  },
  meditation: {
    emoji: '🧘',
    title: 'Meditation',
    description: '10 minutes of calm',
    min: 5,
    max: 30,
  },
  exercise: {
    emoji: '💪',
    title: 'Exercise',
    description: 'Light stretching or workout',
    min: 10,
    max: 60,
  },
};

function Goals() {
  const { goalsLog, goalTargets, refreshGoalsLog, refreshGoalTargets, showToast } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const todayKey = toDateKey();
  const todayGoals = goalsLog.find((entry) => entry.date === todayKey);

  const completedCount = ['walk', 'meditation', 'exercise'].filter(
    (goalKey) => todayGoals?.[goalKey]?.completed
  ).length;

  const monthGrid = useMemo(() => getMonthGrid(new Date()), []);

  const progressMessage = {
    0: "Let's get started today 🌅",
    1: 'Good start! Keep going 💪',
    2: 'Almost there - one more! 🌿',
    3: 'All done! Wonderful day 🎉',
  }[completedCount];

  const handleToggleGoal = (goalKey) => {
    toggleGoal(todayKey, goalKey);
    refreshGoalsLog();
    showToast(
      todayGoals?.[goalKey]?.completed ? `${GOAL_META[goalKey].title} unchecked` : 'Goal marked complete 💪'
    );
  };

  const handleAdjustTarget = (goalKey, direction) => {
    const current = goalTargets?.[goalKey]?.targetMins || 10;
    const next = current + direction;
    const { min, max } = GOAL_META[goalKey];
    if (next < min || next > max) return;
    updateGoalTarget(goalKey, next);
    refreshGoalTargets();
  };

  return (
    <div className="page goals-page">
      <header className="goals-header">
        <p className="section-eyebrow">Daily habits</p>
        <h1>Daily Goals</h1>
        <p className="subtitle">Small, steady routines build a calmer week.</p>
      </header>

      <section className="goal-stack">
        {Object.entries(GOAL_META).map(([goalKey, meta]) => {
          const isDone = todayGoals?.[goalKey]?.completed;
          return (
            <button
              key={goalKey}
              className={`goal-card ${isDone ? 'done' : ''}`}
              onClick={() => handleToggleGoal(goalKey)}
            >
              <div className="goal-copy">
                <div className="goal-title-row">
                  <span className="goal-emoji">{meta.emoji}</span>
                  <strong>{meta.title}</strong>
                </div>
                <p>{meta.description}</p>
                <span className="goal-target">
                  Target: {goalTargets?.[goalKey]?.targetMins || 0} mins
                </span>
              </div>
              <span className={`goal-check ${isDone ? 'done' : ''}`}>{isDone ? '✓' : ''}</span>
            </button>
          );
        })}
      </section>

      <section className="progress-card">
        <div className="progress-copy">
          <strong>Today: {completedCount} of 3 goals completed</strong>
          <p>{progressMessage}</p>
        </div>
        <div className="progress-dots">
          {[0, 1, 2].map((index) => (
            <span key={index} className={`progress-dot ${index < completedCount ? 'filled' : ''}`} />
          ))}
        </div>
      </section>

      <section className="settings-card">
        <button className="settings-toggle" onClick={() => setSettingsOpen((open) => !open)}>
          <span>Adjust your targets</span>
          {settingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {settingsOpen && (
          <div className="target-list">
            {Object.entries(GOAL_META).map(([goalKey, meta]) => (
              <div key={goalKey} className="target-row">
                <span>{meta.title}</span>
                <div className="stepper">
                  <button onClick={() => handleAdjustTarget(goalKey, -1)} aria-label={`Decrease ${meta.title}`}>
                    <Minus size={16} />
                  </button>
                  <strong>{goalTargets?.[goalKey]?.targetMins || 0}</strong>
                  <button onClick={() => handleAdjustTarget(goalKey, 1)} aria-label={`Increase ${meta.title}`}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="calendar-card">
        <h2>This Month</h2>
        <div className="calendar-grid">
          {monthGrid.map((date) => {
            const dateKey = toDateKey(date);
            const record = goalsLog.find((entry) => entry.date === dateKey);
            const doneCount = ['walk', 'meditation', 'exercise'].filter(
              (goalKey) => record?.[goalKey]?.completed
            ).length;
            return (
              <button
                key={dateKey}
                className={`calendar-day ${doneCount === 3 ? 'perfect' : ''} ${isSameMonth(date, new Date()) ? '' : 'muted'}`}
                onClick={() => setSelectedDay({ date, dateKey, record })}
              >
                <span>{date.getDate()}</span>
                <div className="calendar-dots">
                  {['walk', 'meditation', 'exercise'].map((goalKey) => (
                    <i key={goalKey} className={record?.[goalKey]?.completed ? 'on' : ''} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="streak-row">
        {Object.entries(GOAL_META).map(([goalKey, meta]) => (
          <div key={goalKey} className="streak-card-mini">
            <Flame size={16} />
            <strong>{getGoalStreak(goalsLog, goalKey)} days</strong>
            <span>{meta.title}</span>
          </div>
        ))}
      </section>

      <BottomSheet
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? selectedDay.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}
      >
        {selectedDay && (
          <div className="day-detail">
            {Object.entries(GOAL_META).map(([goalKey, meta]) => (
              <div key={goalKey} className="day-detail-row">
                <span>{meta.title}</span>
                <strong>{selectedDay.record?.[goalKey]?.completed ? 'Done ✓' : 'Not marked'}</strong>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default Goals;
