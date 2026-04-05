import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Flame, Minus, Plus } from 'lucide-react';
import BottomSheet from '../components/shared/BottomSheet';
import { useApp } from '../context/AppContext';
import { getGoalStreak } from '../utils/aggregations';
import { addDays, getMonthGrid, isSameMonth, toDateKey } from '../utils/dateHelpers';
import { saveGoalsForDate, toggleGoal, updateGoalTarget, updateSettings } from '../utils/storage';
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
  const { goalsLog, goalTargets, settings, refreshGoalsLog, refreshGoalTargets, refreshSettings, showToast } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [yesterdaySheetOpen, setYesterdaySheetOpen] = useState(false);
  const todayKey = toDateKey();
  const yesterdayKey = toDateKey(addDays(new Date(), -1));
  const todayGoals = goalsLog.find((entry) => entry.date === todayKey);
  const yesterdayGoals = goalsLog.find((entry) => entry.date === yesterdayKey);
  const [yesterdayDraft, setYesterdayDraft] = useState({
    walk: yesterdayGoals?.walk?.completed ?? false,
    meditation: yesterdayGoals?.meditation?.completed ?? false,
    exercise: yesterdayGoals?.exercise?.completed ?? false,
  });
  const previousCompletedCount = useRef(0);

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

  useEffect(() => {
    setYesterdayDraft({
      walk: yesterdayGoals?.walk?.completed ?? false,
      meditation: yesterdayGoals?.meditation?.completed ?? false,
      exercise: yesterdayGoals?.exercise?.completed ?? false,
    });
  }, [yesterdayGoals]);

  useEffect(() => {
    if (completedCount === 3 && previousCompletedCount.current < 3) {
      setShowConfetti(true);
      const timeoutId = window.setTimeout(() => setShowConfetti(false), 2200);
      previousCompletedCount.current = completedCount;
      return () => window.clearTimeout(timeoutId);
    }
    previousCompletedCount.current = completedCount;
    return undefined;
  }, [completedCount]);

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

  const shouldShowYesterdayNudge =
    settings?.lastGoalsNudgeHandledDate !== yesterdayKey &&
    (!yesterdayGoals ||
      ['walk', 'meditation', 'exercise'].some((goalKey) => !yesterdayGoals?.[goalKey]?.completed));

  const handleSaveYesterdayGoals = () => {
    saveGoalsForDate(yesterdayKey, yesterdayDraft);
    updateSettings({ lastGoalsNudgeHandledDate: yesterdayKey });
    refreshGoalsLog();
    refreshSettings();
    setYesterdaySheetOpen(false);
    showToast('Yesterday updated ✓');
  };

  const handleDismissYesterdayNudge = () => {
    updateSettings({ lastGoalsNudgeHandledDate: yesterdayKey });
    refreshSettings();
    setYesterdaySheetOpen(false);
  };

  return (
    <div className="page goals-page">
      {showConfetti && (
        <div className="celebration-layer" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <span key={index} className={`celebration-piece piece-${index % 6}`} />
          ))}
        </div>
      )}
      <header className="goals-header">
        <p className="section-eyebrow">Daily habits</p>
        <h1>Daily Goals</h1>
        <p className="subtitle">Small, steady routines build a calmer week.</p>
      </header>

      {shouldShowYesterdayNudge && (
        <section className="yesterday-nudge">
          <div>
            <strong>Did you complete your goals yesterday?</strong>
            <p>You can quickly fill in yesterday if it slipped your mind.</p>
          </div>
          <div className="yesterday-actions">
            <button className="mini-primary" onClick={() => setYesterdaySheetOpen(true)}>
              Yes, review
            </button>
            <button className="mini-secondary" onClick={handleDismissYesterdayNudge}>
              Skip
            </button>
          </div>
        </section>
      )}

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

      <BottomSheet
        open={yesterdaySheetOpen}
        onClose={() => setYesterdaySheetOpen(false)}
        title="Yesterday's goals"
      >
        <p className="sheet-helper">Mark what was completed yesterday. It only takes a moment.</p>
        {Object.entries(GOAL_META).map(([goalKey, meta]) => (
          <button
            key={goalKey}
            className={`yesterday-goal-row ${yesterdayDraft[goalKey] ? 'done' : ''}`}
            onClick={() =>
              setYesterdayDraft((current) => ({ ...current, [goalKey]: !current[goalKey] }))
            }
          >
            <span>{meta.emoji} {meta.title}</span>
            <strong>{yesterdayDraft[goalKey] ? 'Yes' : 'No'}</strong>
          </button>
        ))}
        <button className="btn-primary" onClick={handleSaveYesterdayGoals}>
          Save yesterday
        </button>
        <button className="mini-secondary full-width" onClick={handleDismissYesterdayNudge}>
          Skip for now
        </button>
      </BottomSheet>
    </div>
  );
}

export default Goals;
