import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Syringe, Pill } from 'lucide-react';
import BottomSheet from '../components/shared/BottomSheet';
import ConfirmSheet from '../components/shared/ConfirmSheet';
import { useApp } from '../context/AppContext';
import {
  buildDailyAverageData,
  buildGoalsCompletionData,
  buildReadingLineData,
  getAverageForMealType,
  getFoodLoggedDaysCount,
  getGoalCompletionRate,
  getInsulinStreak,
  getReadingsInRange,
} from '../utils/aggregations';
import { formatDate, formatTime, getMostRecentSaturday, startOfDay } from '../utils/dateHelpers';
import './Progress.css';

const RANGE_MAP = {
  7: 7,
  30: 30,
  90: 90,
  all: 180,
};

const STATUS_COLORS = {
  normal: 'var(--color-normal)',
  caution: 'var(--color-caution)',
  high: 'var(--color-high)',
  low: 'var(--color-low)',
};

function Progress() {
  const navigate = useNavigate();
  const {
    readings,
    foodLog,
    goalsLog,
    insulinLog,
    medicineLogs,
    waterLog,
    weightLog,
    showToast,
    addInsulinRecord,
    deleteReading,
    addWeightLog,
    deleteWeightLog,
    settings,
  } = useApp();
  
  const [timeRange, setTimeRange] = useState('7');
  const [selectedReading, setSelectedReading] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weightOpen, setWeightOpen] = useState(false);
  const days = RANGE_MAP[timeRange];

  const startDate = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  const endDate = new Date();
  const filteredReadings = getReadingsInRange(readings, startDate, endDate);

  const lineData = useMemo(() => buildReadingLineData(readings, days), [days, readings]);
  const averageData = useMemo(() => buildDailyAverageData(readings, days), [days, readings]);
  const goalsData = useMemo(() => buildGoalsCompletionData(goalsLog, days), [days, goalsLog]);

  const avgFasting = getAverageForMealType(filteredReadings, 'fasting');
  const avgPostMeal = getAverageForMealType(filteredReadings, 'post-meal');
  const foodDays = getFoodLoggedDaysCount(foodLog, startDate, endDate);
  const goalsRate = getGoalCompletionRate(goalsLog, days);
  const insulinStreak = getInsulinStreak(insulinLog);
  const currentSaturday = getMostRecentSaturday();
  const insulinTaken = insulinLog.some((record) => record.scheduledDate === currentSaturday && record.taken);

  const handleMarkInsulin = () => {
    addInsulinRecord({
      scheduledDate: currentSaturday,
      taken: true,
      takenAt: new Date().toISOString(),
      notes: '',
    });
    showToast('Insulin logged 💉');
  };

  const handleDeleteReading = () => {
    if (!selectedReading) return;
    deleteReading(selectedReading.id);
    setConfirmDeleteOpen(false);
    setSelectedReading(null);
    showToast('Reading deleted');
  };

  const sortedWeightLog = useMemo(() => {
    return [...weightLog]
      .filter((entry) => new Date(entry.loggedAt) >= startDate)
      .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))
      .map((entry) => ({
        date: new Date(entry.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: entry.weight,
        bmi: entry.bmi,
        id: entry.id
      }));
  }, [weightLog, startDate]);

  const handleSaveWeight = async () => {
    const val = Number(weightInput);
    if (!val || val <= 0 || val > 300) {
      showToast('Please enter a valid weight (kg)', 'error');
      return;
    }
    await addWeightLog(val);
    showToast('Weight logged successfully ✓');
    setWeightInput('');
    setWeightOpen(false);
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const fasting = payload.find((entry) => entry.dataKey === 'fasting')?.value;
    const postMeal = payload.find((entry) => entry.dataKey === 'postMeal')?.value;
    return (
      <div className="chart-tooltip">
        <strong>{label}</strong>
        {typeof fasting === 'number' && <p>Fasting: {fasting} mg/dL</p>}
        {typeof postMeal === 'number' && <p>Post-meal: {postMeal} mg/dL</p>}
      </div>
    );
  };

  return (
    <div className="page progress">
      <header className="page-header-simple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <p className="section-eyebrow">Trends and history</p>
          <h1>Progress</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="inline-link"
            style={{
              fontSize: 'var(--text-sm)',
              minHeight: '44px',
              border: '1px solid var(--color-primary)',
              padding: '0 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surface-alt)',
              cursor: 'pointer'
            }}
            onClick={() => setWeightOpen(true)}
          >
            ⚖️ Log Weight
          </button>
          <button
            className="inline-link"
            style={{
              fontSize: 'var(--text-sm)',
              minHeight: '44px',
              border: '1px solid #0284C7',
              padding: '0 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(14, 165, 233, 0.05)',
              color: '#0284C7',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/report')}
          >
            📋 Clinical Report
          </button>
        </div>
      </header>

      <div className="time-range-selector">
        {[
          ['7', '7 Days'],
          ['30', '30 Days'],
          ['90', '3 Months'],
          ['all', 'All'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`range-btn ${timeRange === key ? 'active' : ''}`}
            onClick={() => setTimeRange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Average Fasting</span>
          <span className="stat-value">{avgFasting || '—'}</span>
          {avgFasting && <span className="stat-unit">mg/dL</span>}
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Post-Meal</span>
          <span className="stat-value">{avgPostMeal || '—'}</span>
          {avgPostMeal && <span className="stat-unit">mg/dL</span>}
        </div>
        <div className="stat-card">
          <span className="stat-label">Current Weight</span>
          <span className="stat-value">
            {weightLog.length > 0
              ? [...weightLog].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0].weight
              : (settings?.weight || '—')}
          </span>
          <span className="stat-unit">
            kg {weightLog.length > 0
              ? `(BMI: ${[...weightLog].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0].bmi})`
              : ''}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Readings Logged</span>
          <span className="stat-value">{filteredReadings.length}</span>
          <span className="stat-unit">This period</span>
        </div>
      </div>

      <div className="card chart-card">
        <div className="chart-heading">
          <h2>Blood Sugar Over Time</h2>
          <p>Fasting and post-meal readings for this period.</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
            <ReferenceArea y1={70} y2={139} fill="rgba(82, 183, 136, 0.10)" />
            <ReferenceArea y1={140} y2={199} fill="rgba(244, 162, 97, 0.10)" />
            <ReferenceArea y1={200} y2={280} fill="rgba(230, 57, 70, 0.08)" />
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,92,92,0.12)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <Tooltip content={<CustomLineTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="fasting" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
            <Line type="monotone" dataKey="postMeal" name="post-meal" stroke="var(--color-accent)" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <div className="chart-heading">
          <h2>Daily Averages</h2>
          <p>Each bar shows the average of that day’s readings.</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={averageData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,92,92,0.12)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <Tooltip />
            <Bar dataKey="average" radius={[12, 12, 0, 0]}>
              {averageData.map((entry) => (
                <Cell
                  key={entry.dateKey}
                  fill={entry.status ? STATUS_COLORS[entry.status] : 'rgba(92,92,92,0.24)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <div className="chart-heading">
          <h2>Goals Completion</h2>
          <p>Goals hit {goalsRate}% of days in this period.</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={goalsData} stackOffset="expand" margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,92,92,0.12)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="completedCount" stackId="a" fill="var(--color-primary)" radius={[10, 10, 0, 0]} />
            <Bar dataKey="remaining" stackId="a" fill="rgba(92,92,92,0.18)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <div className="chart-heading">
          <h2>Weight & BMI History</h2>
          <p>Track body weight and calculated BMI values over this period.</p>
        </div>
        {sortedWeightLog.length === 0 ? (
          <p className="empty-message" style={{ padding: '30px 0' }}>No weight data logged for this period yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={sortedWeightLog} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,92,92,0.12)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} width={36} domain={['dataMin - 5', 'dataMax + 5']} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={36} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="weight" name="Weight (kg)" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="bmi" name="BMI" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>

            <div className="recent-weight-list" style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[...sortedWeightLog].reverse().slice(0, 5).map((log) => (
                <div key={log.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface-alt)', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)' }}>
                  <strong>{log.weight} kg</strong>
                  <span style={{ color: 'var(--color-text-muted)' }}>{log.date}</span>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Delete weight log of ${log.weight} kg on ${log.date}?`)) {
                        deleteWeightLog(log.id);
                        showToast('Weight log deleted');
                      }
                    }} 
                    style={{ border: 'none', background: 'none', color: 'var(--color-high)', cursor: 'pointer', padding: '0 4px', fontSize: '14px', fontWeight: 'bold' }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="chart-heading">
          <h2>Food Log Summary</h2>
          <p>Food logged on {foodDays} of {days} days in this period.</p>
        </div>
        <div className="food-summary-list">
          {foodLog
            .filter((entry) => new Date(entry.date) >= startDate)
            .slice(-6)
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="food-summary-row">
                <strong>{formatDate(entry.date)}</strong>
                <span>{entry.mealType}</span>
                <small>{entry.items.join(', ')}</small>
              </div>
            ))}
          {!foodLog.length && (
            <p className="empty-message">Nothing logged yet today. Tap a meal to add what you had.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="chart-heading">
          <h2>Medication Intake History</h2>
          <p>Recent medication logs to track patterns and assess condition.</p>
        </div>
        <div className="history-list">
          {medicineLogs
            .slice()
            .sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt))
            .slice(0, 12)
            .map((log) => (
              <div key={log.id} className="history-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-surface-alt)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    <Pill size={14} style={{ color: 'var(--color-primary)' }} />
                    {log.medicineName}
                  </strong>
                  {log.notes && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{log.notes}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{log.dosage || '1 unit'}</span>
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>
                    {formatDate(log.consumedAt)} • {formatTime(log.consumedAt)}
                  </small>
                </div>
              </div>
            ))}
          {!medicineLogs.length && (
            <p className="empty-message">No medication intake logged yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="chart-heading">
          <h2>Insulin Log</h2>
          <p>{insulinStreak}-week streak - keep it up.</p>
        </div>
        <div className="insulin-progress-card">
          <div className="insulin-progress-copy">
            <Syringe size={18} />
            <div>
              <strong>{insulinTaken ? 'Taken this Saturday ✓' : 'Saturday insulin pending'}</strong>
              <p>{formatDate(currentSaturday)}</p>
            </div>
          </div>
          {!insulinTaken && (
            <button className="banner-btn" onClick={handleMarkInsulin}>
              Mark as Taken
            </button>
          )}
        </div>
        <div className="history-list">
          {insulinLog
            .slice()
            .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
            .slice(0, 12)
            .map((record) => (
              <div key={record.id} className="history-row">
                <strong>{formatDate(record.scheduledDate)}</strong>
                <span>{record.taken ? 'Taken ✓' : 'Missed ✗'}</span>
                <small>{record.takenAt ? formatTime(record.takenAt) : 'No time recorded'}</small>
              </div>
            ))}
        </div>
      </div>

      <div className="card">
        <div className="chart-heading">
          <h2>Reading History</h2>
          <p>Newest first.</p>
        </div>
        {filteredReadings.length === 0 ? (
          <p className="empty-message">No readings yet. Tap + to log your first one 🌿</p>
        ) : (
          <div className="readings-list">
            {filteredReadings
              .slice()
              .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
              .map((reading) => (
                <div key={reading.id} className="reading-row">
                  <div className="reading-main">
                    <strong>{reading.value} mg/dL</strong>
                    <span>{reading.mealType}</span>
                  </div>
                  <div className="reading-meta">
                    <span>{formatDate(reading.loggedAt)}</span>
                    <small>{formatTime(reading.loggedAt)}</small>
                    {reading.notes && <small>{reading.notes}</small>}
                  </div>
                  <button className="inline-link history-link" onClick={() => setSelectedReading(reading)}>
                    View
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
      <BottomSheet
        open={Boolean(selectedReading)}
        onClose={() => setSelectedReading(null)}
        title={selectedReading ? `${selectedReading.value} mg/dL` : ''}
      >
        {selectedReading && (
          <>
            <div className="detail-grid">
              <div className="detail-row"><span>Meal</span><strong>{selectedReading.mealType}</strong></div>
              <div className="detail-row"><span>Date</span><strong>{formatDate(selectedReading.loggedAt)}</strong></div>
              <div className="detail-row"><span>Time</span><strong>{formatTime(selectedReading.loggedAt)}</strong></div>
              {selectedReading.notes && <div className="detail-note">{selectedReading.notes}</div>}
            </div>
            <button className="danger-link" onClick={() => setConfirmDeleteOpen(true)}>
              Delete this reading
            </button>
          </>
        )}
      </BottomSheet>

      <BottomSheet
        open={weightOpen}
        onClose={() => setWeightOpen(false)}
        title="Log Body Weight / वजन नोंदवा ⚖️"
      >
        <div className="form-group" style={{ textCombineUpright: 'left', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <label className="form-label" style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Body Weight / वजन (kg)</label>
          <input
            type="number"
            className="form-input"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="e.g. 60"
            min="10"
            max="300"
            style={{ width: '100%', minHeight: '52px', border: 'none', background: 'var(--color-surface-alt)', padding: '0 16px', borderRadius: '8px', fontSize: '16px', color: 'var(--color-text-primary)' }}
            required
            autoFocus
          />
        </div>
        <button className="btn-primary" style={{ minHeight: '54px', width: '100%' }} onClick={handleSaveWeight}>
          Save Weight Log
        </button>
      </BottomSheet>

      <ConfirmSheet
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteReading}
        title="Delete this reading?"
        description="This removes the reading from progress and today's summary. You can add it again if needed."
      />
    </div>
  );
}

export default Progress;
