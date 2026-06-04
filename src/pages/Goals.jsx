import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  FilePenLine,
  Flame,
  Minus,
  Plus,
  Trash2,
  Clock,
  Pill,
  Volume2
} from 'lucide-react';
import BottomSheet from '../components/shared/BottomSheet';
import { useApp } from '../context/AppContext';
import { getGoalStreak } from '../utils/aggregations';
import { addDays, getMonthGrid, isSameMonth, toDateKey } from '../utils/dateHelpers';
import ProfileTab from './ProfileTab';
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

const WEEKDAYS = [
  { label: 'S', value: 'Sun' },
  { label: 'M', value: 'Mon' },
  { label: 'T', value: 'Tue' },
  { label: 'W', value: 'Wed' },
  { label: 'T', value: 'Thu' },
  { label: 'F', value: 'Fri' },
  { label: 'S', value: 'Sat' }
];

function Goals() {
  const {
    carePlans,
    goalsLog,
    goalTargets,
    settings,
    medicines,
    reminders,
    showToast,
    toggleGoal,
    saveGoalsForDate,
    updateGoalTarget,
    updateCarePlan,
    updateSettings,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addReminder,
    updateReminder,
    deleteReminder
  } = useApp();

  const [activeTab, setActiveTab] = useState('goals'); // 'goals', 'medicines', 'reminders', 'profile'
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

  // Medication States
  const [medSheetOpen, setMedSheetOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medTime, setMedTime] = useState('08:00');
  const [medNotes, setMedNotes] = useState('');

  // Custom Reminder States
  const [remSheetOpen, setRemSheetOpen] = useState(false);
  const [selectedRem, setSelectedRem] = useState(null);
  const [remTitle, setRemTitle] = useState('');
  const [remTime, setRemTime] = useState('09:00');
  const [remDays, setRemDays] = useState([]); // Mon, Tue, etc.
  const [pre30, setPre30] = useState(true);
  const [pre15, setPre15] = useState(true);

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
  };

  const shouldShowYesterdayNudge =
    settings?.lastGoalsNudgeHandledDate !== yesterdayKey &&
    (!yesterdayGoals ||
      ['walk', 'meditation', 'exercise'].some((goalKey) => !yesterdayGoals?.[goalKey]?.completed));

  const handleSaveYesterdayGoals = () => {
    saveGoalsForDate(yesterdayKey, yesterdayDraft);
    updateSettings({ lastGoalsNudgeHandledDate: yesterdayKey });
    setYesterdaySheetOpen(false);
    showToast('Yesterday updated ✓');
  };

  const handleDismissYesterdayNudge = () => {
    updateSettings({ lastGoalsNudgeHandledDate: yesterdayKey });
    setYesterdaySheetOpen(false);
  };

  const handleOpenExercisePlan = (key) => {
    setEditingExercisePlan(key);
    setExercisePlanDraft(carePlans?.exercisePlans?.[key] || '');
  };

  const handleSaveExercisePlan = () => {
    if (!editingExercisePlan) return;
    updateCarePlan('exercisePlans', editingExercisePlan, exercisePlanDraft.trim());
    showToast('Exercise plan updated ✓');
    setEditingExercisePlan(null);
  };

  const handleReminderToggle = () => {
    updateSettings({ reminderEnabled: !settings?.reminderEnabled });
  };

  const handleReminderTime = (value) => {
    updateSettings({ reminderTime: value, lastReminderSentDate: null });
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

  // Medicine Actions
  const handleOpenAddMed = () => {
    setSelectedMed(null);
    setMedName('');
    setMedDose('');
    setMedTime('08:00');
    setMedNotes('');
    setMedSheetOpen(true);
  };

  const handleOpenEditMed = (med) => {
    setSelectedMed(med);
    setMedName(med.name);
    setMedDose(med.dosage || '');
    setMedTime(med.time || '08:00');
    setMedNotes(med.notes || '');
    setMedSheetOpen(true);
  };

  const handleSaveMed = async () => {
    if (!medName.trim()) {
      showToast('Please enter a medicine name', 'error');
      return;
    }
    const payload = {
      name: medName.trim(),
      dosage: medDose.trim(),
      time: medTime,
      notes: medNotes.trim(),
      active: selectedMed ? selectedMed.active : true
    };

    if (selectedMed) {
      await updateMedicine(selectedMed.id, payload);
      showToast('Medicine details updated');
    } else {
      await addMedicine(payload);
      showToast('Medicine added to cabinet 💊');
    }
    setMedSheetOpen(false);
  };

  const handleDeleteMed = async () => {
    if (!selectedMed) return;
    await deleteMedicine(selectedMed.id);
    showToast('Medicine deleted');
    setMedSheetOpen(false);
  };

  // Custom Reminder Actions
  const handleOpenAddRem = () => {
    setSelectedRem(null);
    setRemTitle('');
    setRemTime('09:00');
    setRemDays([]);
    setPre30(true);
    setPre15(true);
    setRemSheetOpen(true);
  };

  const handleOpenEditRem = (rem) => {
    setSelectedRem(rem);
    setRemTitle(rem.title);
    setRemTime(rem.time);
    setRemDays(rem.days || []);
    setPre30(rem.preReminders?.includes(30) ?? false);
    setPre15(rem.preReminders?.includes(15) ?? false);
    setRemSheetOpen(true);
  };

  const handleSaveRem = async () => {
    if (!remTitle.trim()) {
      showToast('Please enter a reminder title', 'error');
      return;
    }

    const preReminders = [];
    if (pre30) preReminders.push(30);
    if (pre15) preReminders.push(15);

    const payload = {
      title: remTitle.trim(),
      time: remTime,
      days: remDays,
      preReminders,
      active: selectedRem ? selectedRem.active : true
    };

    if (selectedRem) {
      await updateReminder(selectedRem.id, payload);
      showToast('Reminder alarm updated');
    } else {
      await addReminder(payload);
      showToast('Custom reminder scheduled ⏰');
    }
    setRemSheetOpen(false);
  };

  const handleDeleteRem = async () => {
    if (!selectedRem) return;
    await deleteReminder(selectedRem.id);
    showToast('Reminder deleted');
    setRemSheetOpen(false);
  };

  const handleToggleReminderActive = async (rem) => {
    await updateReminder(rem.id, { active: !rem.active });
    showToast(rem.active ? 'Reminder paused' : 'Reminder active');
  };

  const handleToggleWeekday = (dayValue) => {
    setRemDays(current =>
      current.includes(dayValue)
        ? current.filter(d => d !== dayValue)
        : [...current, dayValue]
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
        <p className="section-eyebrow">Routine & Care</p>
        <h1>Routine Planner</h1>
        <p className="subtitle">Set up daily habits, custom alarm alerts, and medicines.</p>
      </header>

      {/* Sub-Tabs Selector */}
      <div className="goals-tabs">
        <button className={activeTab === 'goals' ? 'active' : ''} onClick={() => setActiveTab('goals')}>
          Daily Habits
        </button>
        <button className={activeTab === 'medicines' ? 'active' : ''} onClick={() => setActiveTab('medicines')}>
          Meds Cabinet
        </button>
        <button className={activeTab === 'reminders' ? 'active' : ''} onClick={() => setActiveTab('reminders')}>
          Custom Alarms
        </button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
          Profile & Diet
        </button>
      </div>


      {/* Habits Content Tab */}
      {activeTab === 'goals' && (
        <>
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
            <div className="plan-card-top">
              <div>
                <p className="section-eyebrow">Daily support plans</p>
                <h2>Gentle exercises for mom</h2>
              </div>
            </div>
            <div className="care-plan-grid">
              {[
                ['diabetesPlan', 'Diabetes Care / मधुमेह काळजी'],
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
        </>
      )}

      {/* Medicines Cabinet Content Tab */}
      {activeTab === 'medicines' && (
        <>
          <div className="tab-header-row">
            <h2>Medication Cabinet</h2>
            <button className="inline-link" onClick={handleOpenAddMed}>
              <Plus size={16} /> Add Med
            </button>
          </div>

          <div className="meds-container">
            {medicines.length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                <Pill size={36} style={{ color: 'var(--color-primary-light)', marginBottom: '12px' }} />
                <p>No medicines added yet.</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Tap "Add Med" to log her prescriptions here.
                </p>
              </div>
            ) : (
              medicines.map((med) => (
                <article key={med.id} className="med-card">
                  <div className="med-details">
                    <div className="med-title-row">
                      <Pill size={18} style={{ color: 'var(--color-primary)' }} />
                      <strong>{med.name}</strong>
                    </div>
                    <span className="med-meta">Dosage: {med.dosage || '—'}</span>
                    <span className="med-meta">Consume at: {med.time}</span>
                    {med.notes && <p className="med-notes">Note: {med.notes}</p>}
                  </div>
                  <button className="inline-link" onClick={() => handleOpenEditMed(med)}>
                    <FilePenLine size={16} /> Edit
                  </button>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {/* Custom Alarms & Reminders Tab */}
      {activeTab === 'reminders' && (
        <>
          <section className="care-card reminder-card" style={{ marginTop: 0, marginBottom: '24px' }}>
            <div className="plan-card-top">
              <div>
                <p className="section-eyebrow">Quick Daily Reminder</p>
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
                Allow device notifications
              </button>
            </div>
          </section>

          <div className="tab-header-row">
            <h2>Custom Alarm Routines</h2>
            <button className="inline-link" onClick={handleOpenAddRem}>
              <Plus size={16} /> Add Alarm
            </button>
          </div>

          <div className="reminders-container">
            {reminders.length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                <Bell size={36} style={{ color: 'var(--color-primary-light)', marginBottom: '12px' }} />
                <p>No custom alarms scheduled yet.</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Schedule alarms for insulin or checking blood sugar.
                </p>
              </div>
            ) : (
              reminders.map((rem) => (
                <article key={rem.id} className="rem-card">
                  <div className="rem-details">
                    <div className="rem-title-row">
                      <Clock size={18} style={{ color: rem.active ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                      <strong style={{ opacity: rem.active ? 1 : 0.6 }}>{rem.title}</strong>
                    </div>
                    <span className="rem-meta" style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
                      {rem.time}
                    </span>
                    <span className="rem-meta">
                      Repeats: {rem.days?.length === 0 ? 'Everyday' : rem.days?.join(', ')}
                    </span>
                    {rem.preReminders?.length > 0 && (
                      <span className="rem-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)' }}>
                        <Volume2 size={12} /> Pre-alerts: {rem.preReminders.map(m => `${m}m`).join(' & ')} before
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className={`toggle-pill ${rem.active ? 'on' : ''}`} onClick={() => handleToggleReminderActive(rem)}>
                      <i />
                    </button>
                    <button className="inline-link" onClick={() => handleOpenEditRem(rem)}>
                      <FilePenLine size={16} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {/* Profile & Nutrition Content Tab */}
      {activeTab === 'profile' && <ProfileTab />}

      {/* Sheets & Dialogs */}
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

      {/* Medicines Add/Edit Sheet */}
      <BottomSheet
        open={medSheetOpen}
        onClose={() => setMedSheetOpen(false)}
        title={selectedMed ? "Edit Medication" : "Add Medication"}
      >
        <div className="form-group">
          <label>Medicine Name</label>
          <input
            type="text"
            className="form-input"
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            placeholder="e.g., Metformin"
          />
        </div>

        <div className="form-group">
          <label>Dosage</label>
          <input
            type="text"
            className="form-input"
            value={medDose}
            onChange={(e) => setMedDose(e.target.value)}
            placeholder="e.g., 500 mg, 1 tablet"
          />
        </div>

        <div className="form-group">
          <label>Scheduled Intake Time</label>
          <input
            type="time"
            className="form-input"
            value={medTime}
            onChange={(e) => setMedTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Notes / Advice (Optional)</label>
          <input
            type="text"
            className="form-input"
            value={medNotes}
            onChange={(e) => setMedNotes(e.target.value)}
            placeholder="e.g., take after breakfast"
          />
        </div>

        <button className="btn-primary" onClick={handleSaveMed}>
          Save Medicine
        </button>

        {selectedMed && (
          <div className="danger-button-row">
            <button className="danger-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleDeleteMed}>
              <Trash2 size={16} /> Delete Medicine
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Custom Alarms Add/Edit Sheet */}
      <BottomSheet
        open={remSheetOpen}
        onClose={() => setRemSheetOpen(false)}
        title={selectedRem ? "Edit Alarm Routine" : "Create Alarm Routine"}
      >
        <div className="form-group">
          <label>Alarm Title / Description</label>
          <input
            type="text"
            className="form-input"
            value={remTitle}
            onChange={(e) => setRemTitle(e.target.value)}
            placeholder="e.g., Take Insulin, Walk, Check Sugar"
          />
        </div>

        <div className="form-group">
          <label>Trigger Time</label>
          <input
            type="time"
            className="form-input"
            value={remTime}
            onChange={(e) => setRemTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Days to Repeat</label>
          <p className="subtitle" style={{ fontSize: 'var(--text-xs)', marginTop: '-4px' }}>If none selected, it repeats everyday.</p>
          <div className="days-grid-selector">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                className={`day-chk-btn ${remDays.includes(day.value) ? 'active' : ''}`}
                onClick={() => handleToggleWeekday(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Pre-alert Notifications</label>
          <div className="checkbox-group-row">
            <label className="checkbox-label-btn">
              <input
                type="checkbox"
                checked={pre30}
                onChange={(e) => setPre30(e.target.checked)}
              />
              <span>30 mins before</span>
            </label>
            <label className="checkbox-label-btn">
              <input
                type="checkbox"
                checked={pre15}
                onChange={(e) => setPre15(e.target.checked)}
              />
              <span>15 mins before</span>
            </label>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSaveRem}>
          Save Alarm Routine
        </button>

        {selectedRem && (
          <div className="danger-button-row">
            <button className="danger-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleDeleteRem}>
              <Trash2 size={16} /> Delete Alarm
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default Goals;
