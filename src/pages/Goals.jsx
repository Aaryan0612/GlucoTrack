import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, ChevronUp, FilePenLine, Flame, Minus, Plus } from 'lucide-react';
import BottomSheet from '../components/shared/BottomSheet';
import { useApp } from '../context/AppContext';
import { getGoalStreak } from '../utils/aggregations';
import { addDays, getMonthGrid, isSameMonth, toDateKey } from '../utils/dateHelpers';
import { saveGoalsForDate, toggleGoal, updateCarePlan, updateGoalTarget, updateSettings } from '../utils/storage';
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
  const { carePlans, goalsLog, goalTargets, settings, refreshCarePlans, refreshGoalsLog, refreshGoalTargets, refreshSettings, showToast } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [yesterdaySheetOpen, setYesterdaySheetOpen] = useState(false);
  const [editingExercisePlan, setEditingExercisePlan] = useState(null);
  const [exercisePlanDraft, setExercisePlanDraft] = useState('');
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

  const handleOpenExercisePlan = (key) => {
    setEditingExercisePlan(key);
    setExercisePlanDraft(carePlans?.exercisePlans?.[key] || '');
  };

  const handleSaveExercisePlan = () => {
    if (!editingExercisePlan) return;
    updateCarePlan('exercisePlans', editingExercisePlan, exercisePlanDraft.trim());
    refreshCarePlans();
    showToast('Exercise plan updated ✓');
    setEditingExercisePlan(null);
  };

  const handleReminderToggle = () => {
    updateSettings({ reminderEnabled: !settings?.reminderEnabled });
    refreshSettings();
  };

  const handleReminderTime = (value) => {
    updateSettings({ reminderTime: value, lastReminderSentDate: null });
    refreshSettings();
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported on this device', 'error');
      return;
    }
    const permission = await Notification.requestPermission();
    showToast(
      permission === 'granted' ? 'Device reminders allowed ✓' : 'Notification permission was not granted',
      permission === 'granted' ? 'success' : 'error'
    );
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

      <section className="care-card">
        <div className="section-title-row">
          <div>
            <p className="section-eyebrow">Daily support plans</p>
            <h2>Gentle exercises for mom</h2>
          </div>
        </div>
        <div className="care-plan-grid">
          {[
            ['kneePain', 'Knee pain'],
            ['backPain', 'Back pain'],
            ['stress', 'Stress care'],
          ].map(([key, label]) => (
            <article key={key} className="care-plan-card">
              <div className="plan-card-top">
                <strong>{label}</strong>
                <button className="inline-link" onClick={() => handleOpenExercisePlan(key)}>
                  <FilePenLine size={16} /> Edit
                </button>
              </div>
              <div className="formatted-plan">
                {(carePlans?.exercisePlans?.[key] || '')
                  .split('\n')
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line}>{line}</p>
                  ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="care-card reminder-card">
        <div className="plan-card-top">
          <div>
            <p className="section-eyebrow">Reminder settings</p>
            <h2>Daily exercise reminder</h2>
          </div>
          <Bell size={18} />
        </div>
        <div className="reminder-controls">
          <label className="toggle-row">
            <span>Enable daily reminder</span>
            <button className={`toggle-pill ${settings?.reminderEnabled ? 'on' : ''}`} onClick={handleReminderToggle}>
              <i />
            </button>
          </label>
          <label className="reminder-time-row">
            <span>Reminder time</span>
            <input
              type="time"
              value={settings?.reminderTime || '09:00'}
              onChange={(event) => handleReminderTime(event.target.value)}
            />
          </label>
          <button className="mini-primary left-align" onClick={requestNotifications}>
            Allow device reminders
          </button>
          <p className="sheet-helper">
            The app can send a reminder when it is open or reopened around the chosen time.
          </p>
        </div>
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

      <BottomSheet
        open={Boolean(editingExercisePlan)}
        onClose={() => setEditingExercisePlan(null)}
        title="Edit exercise plan"
      >
        <p className="sheet-helper">Write simple steps. Each new line becomes one clear point for mom.</p>
        <textarea
          className="food-plan-editor"
          value={exercisePlanDraft}
          onChange={(event) => setExercisePlanDraft(event.target.value)}
          placeholder="Add gentle daily exercises here..."
        />
        <button className="btn-primary" onClick={handleSaveExercisePlan}>
          Save exercise plan
        </button>
      </BottomSheet>
    </div>
  );
}

export default Goals;
