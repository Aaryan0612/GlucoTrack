import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, PencilLine } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addReading, checkDuplicateReading, updateSettings } from '../utils/storage';
import {
  combineDateAndTime,
  formatDate,
  formatTime,
  getDefaultMealType,
  roundToNearest5Minutes,
  toDateKey,
  toInputDateValue,
  toInputTimeValue,
} from '../utils/dateHelpers';
import { getReadingStatus, getStatusLabel } from '../utils/statusHelpers';
import './LogReading.css';

function LogReading() {
  const navigate = useNavigate();
  const { readings, settings, refreshReadings, refreshSettings, showToast } = useApp();
  const roundedNow = roundToNearest5Minutes();
  const [value, setValue] = useState('');
  const [mealType, setMealType] = useState(getDefaultMealType());
  const [notes, setNotes] = useState('');
  const [dateValue, setDateValue] = useState(toInputDateValue(roundedNow));
  const [timeValue, setTimeValue] = useState(toInputTimeValue(roundedNow));
  const [isPastEntry, setIsPastEntry] = useState(false);
  const [dismissedHint, setDismissedHint] = useState(settings?.pastReadingsHintDismissed || false);

  const loggedAt = combineDateAndTime(dateValue, timeValue);
  const status = value ? getReadingStatus(Number(value), mealType) : null;
  const isPastDate = dateValue !== toDateKey();
  const duplicateExists = checkDuplicateReading(readings, dateValue, mealType);

  const helperText = useMemo(() => {
    if (mealType === 'fasting') return 'Healthy range: 70-99 mg/dL';
    if (mealType === 'post-meal') return 'Healthy range: under 140 mg/dL';
    return 'Healthy range: 70-130 mg/dL';
  }, [mealType]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const numValue = Number(value);
    if (!numValue || numValue < 20 || numValue > 600) {
      showToast('Please double-check this value', 'error');
      return;
    }

    addReading({
      value: numValue,
      unit: 'mg/dL',
      mealType,
      loggedAt,
      notes: notes.trim(),
    });

    refreshReadings();
    showToast(isPastDate ? `Reading saved for ${formatDate(loggedAt)} ✓` : 'Reading saved! ✓');
    navigate('/');
  };

  const handleDismissHint = () => {
    updateSettings({ pastReadingsHintDismissed: true });
    refreshSettings();
    setDismissedHint(true);
  };

  return (
    <div className="page log-reading">
      <header className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="page-header-copy">
          <span className="header-kicker">{isPastEntry ? 'Past entry' : 'Daily check-in'}</span>
          <h1>Log Reading</h1>
          <p className="subtitle">
            {isPastDate ? formatDate(loggedAt) : `Today, ${formatDate(new Date())}`}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="log-form">
        {isPastEntry && !dismissedHint && (
          <section className="log-panel past-reading-card">
            <div className="section-title-row">
              <h2>Logging past readings?</h2>
              <button type="button" className="ghost-close" onClick={handleDismissHint}>
                ×
              </button>
            </div>
            <p>
              No problem. You can add up to 30 days of past data - just pick the date and enter the
              value as usual.
            </p>
          </section>
        )}

        <section className="log-panel">
          <div className="section-heading">
            <span className="section-step">01</span>
            <div>
              <label className="form-label">
                {isPastEntry ? 'Which day was this reading from?' : 'Date & Time'}
              </label>
              <p className="section-note">
                {isPastEntry
                  ? 'You can backdate up to 30 days. Future dates are disabled.'
                  : 'Adjust the date or time if needed.'}
              </p>
            </div>
          </div>
          <div className="datetime-grid">
            <label className="field-chip">
              <CalendarDays size={16} />
              <input
                type="date"
                min={toDateKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))}
                max={toDateKey()}
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
              />
            </label>
            <label className="field-chip">
              <Clock3 size={16} />
              <input
                type="time"
                value={timeValue}
                onChange={(event) => setTimeValue(event.target.value)}
              />
            </label>
          </div>
          {duplicateExists && (
            <p className="duplicate-note">
              You already have a {mealType} reading for this day. Saving another is okay.
            </p>
          )}
        </section>

        <section className="log-panel">
          <div className="section-heading">
            <span className="section-step">02</span>
            <div>
              <label className="form-label">Meal Type</label>
              <p className="section-note">Choose the moment this reading belongs to.</p>
            </div>
          </div>
          <div className="meal-type-grid">
            {[
              ['fasting', '🌅 Fasting'],
              ['post-meal', '🍽️ Post-Meal'],
              ['bedtime', '🌙 Bedtime'],
              ['other', '📌 Other'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`meal-btn ${mealType === key ? 'active' : ''}`}
                onClick={() => setMealType(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="log-panel log-panel-highlight">
          <div className="section-heading">
            <span className="section-step">03</span>
            <div>
              <label className="form-label">Blood Sugar Value</label>
              <p className="section-note">Enter the number exactly as shown on the meter.</p>
            </div>
          </div>
          <div className="value-input-wrapper">
            <input
              type="number"
              inputMode="decimal"
              className="value-input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="000"
              required
              autoFocus
            />
            <span className="value-unit">mg/dL</span>
          </div>
          {status && (
            <div className="live-status">
              <span className={`status-badge status-${status}`}>{getStatusLabel(status)}</span>
            </div>
          )}
          <p className="helper-text">{helperText}</p>
        </section>

        <section className="log-panel">
          <div className="section-heading">
            <span className="section-step">04</span>
            <div>
              <label className="form-label">Notes (Optional)</label>
              <p className="section-note">Examples: after exercise, ate late, felt low.</p>
            </div>
          </div>
          <input
            type="text"
            className="notes-input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Any notes? (e.g., after exercise, ate late...)"
            maxLength={200}
          />
        </section>

        <button type="submit" className="btn-primary btn-save">
          {isPastDate ? 'Save Past Reading' : 'Save Reading'}
        </button>

        <button
          type="button"
          className="text-link-row"
          onClick={() => setIsPastEntry((current) => !current)}
        >
          <PencilLine size={16} />
          {isPastEntry ? 'Back to today’s quick log' : 'Log a past reading'}
        </button>
      </form>
    </div>
  );
}

export default LogReading;
