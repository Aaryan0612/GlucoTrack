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
import { Syringe } from 'lucide-react';
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
import { addInsulinRecord, deleteReading } from '../utils/storage';
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
  const { readings, foodLog, goalsLog, insulinLog, refreshInsulinLog, refreshReadings, showToast } = useApp();
  const [timeRange, setTimeRange] = useState('7');
  const [selectedReading, setSelectedReading] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
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
    refreshInsulinLog();
    showToast('Insulin logged 💉');
  };

  const handleDeleteReading = () => {
    if (!selectedReading) return;
    deleteReading(selectedReading.id);
    setConfirmDeleteOpen(false);
    setSelectedReading(null);
    refreshReadings();
    showToast('Reading deleted');
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
      <header className="page-header-simple">
        <p className="section-eyebrow">Trends and history</p>
        <h1>Progress</h1>
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
