import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Printer, AlertTriangle, CheckCircle, Clock, Heart, Activity, Droplet, Calendar, Award } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { getReadingsInRange } from '../utils/aggregations';
import { formatDate, formatTime, startOfDay } from '../utils/dateHelpers';
import { getReadingStatus, getStatusLabel } from '../utils/statusHelpers';
import './Report.css';

// Helper to convert time string (HH:MM) to minutes from midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper to format minutes from midnight into 12-hr time string
function minutesToTimeStr(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.round(mins % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${ampm}`;
}

const RANGE_MAP = {
  7: 7,
  30: 30,
  90: 90
};

// Recommended meal times bounds (minutes from midnight)
const MEAL_RECOMMENDED_TIMES = {
  breakfast: { start: 420, end: 540, label: '07:00 AM - 09:00 AM' }, // 7 AM - 9 AM
  lunch: { start: 720, end: 840, label: '12:00 PM - 02:00 PM' },      // 12 PM - 2 PM
  snacks: { start: 960, end: 1080, label: '04:00 PM - 06:00 PM' },    // 4 PM - 6 PM
  dinner: { start: 1140, end: 1200, label: '07:00 PM - 08:00 PM' }    // 7 PM - 8 PM (avoid late)
};

function Report() {
  const navigate = useNavigate();
  const {
    readings,
    foodLog,
    goalsLog,
    insulinLog,
    medicineLogs,
    medicines,
    waterLog,
    settings
  } = useApp();

  const [timeRange, setTimeRange] = useState('30');
  const days = RANGE_MAP[timeRange];

  const startDate = useMemo(() => {
    return startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  }, [days]);
  const endDate = new Date();

  // 1. Filtered Logs based on time range
  const filteredReadings = useMemo(() => {
    return getReadingsInRange(readings, startDate, endDate)
      .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
  }, [readings, startDate, endDate]);

  const filteredFoodLog = useMemo(() => {
    return foodLog.filter(entry => new Date(entry.date) >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [foodLog, startDate]);

  const filteredMedicineLogs = useMemo(() => {
    return medicineLogs.filter(log => new Date(log.consumedAt) >= startDate)
      .sort((a, b) => new Date(a.consumedAt) - new Date(b.consumedAt));
  }, [medicineLogs, startDate]);

  const filteredWaterLog = useMemo(() => {
    return waterLog.filter(log => new Date(log.date) >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [waterLog, startDate]);

  const filteredGoalsLog = useMemo(() => {
    return goalsLog.filter(log => new Date(log.date) >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [goalsLog, startDate]);

  // 2. Clinical Blood Sugar Metrics
  const bsSummary = useMemo(() => {
    const fasting = filteredReadings.filter(r => r.mealType === 'fasting');
    const postMeal = filteredReadings.filter(r => r.mealType === 'post-meal');

    const avgFasting = fasting.length 
      ? Math.round(fasting.reduce((sum, r) => sum + r.value, 0) / fasting.length)
      : null;
    const avgPostMeal = postMeal.length
      ? Math.round(postMeal.reduce((sum, r) => sum + r.value, 0) / postMeal.length)
      : null;

    const allValues = filteredReadings.map(r => r.value);
    const avgOverall = allValues.length
      ? Math.round(allValues.reduce((sum, v) => sum + v, 0) / allValues.length)
      : null;

    // HbA1c estimation: (avgGlucose + 46.7) / 28.7
    const estHbA1c = avgOverall ? ((avgOverall + 46.7) / 28.7).toFixed(1) : null;

    // Range compliance
    let inRangeCount = 0;
    filteredReadings.forEach(r => {
      const status = getReadingStatus(r.value, r.mealType);
      if (status === 'normal') inRangeCount++;
    });

    const rangePct = filteredReadings.length
      ? Math.round((inRangeCount / filteredReadings.length) * 100)
      : 0;

    return {
      avgFasting,
      avgPostMeal,
      avgOverall,
      estHbA1c,
      rangePct,
      totalReadings: filteredReadings.length
    };
  }, [filteredReadings]);

  // 3. Hydration Metrics
  const waterSummary = useMemo(() => {
    const dailyIntake = {};
    filteredWaterLog.forEach(log => {
      dailyIntake[log.date] = (dailyIntake[log.date] || 0) + log.amountMl;
    });

    const entries = Object.values(dailyIntake);
    const avgWaterMl = entries.length
      ? Math.round(entries.reduce((sum, val) => sum + val, 0) / entries.length)
      : 0;

    const targetMl = settings?.waterGoalMl || 5000;
    const hitTargetDays = entries.filter(val => val >= targetMl).length;
    const hitTargetPct = entries.length
      ? Math.round((hitTargetDays / entries.length) * 100)
      : 0;

    return {
      avgWaterMl,
      hitTargetPct,
      totalLoggedDays: entries.length
    };
  }, [filteredWaterLog, settings]);

  // 4. Meal Timings & Delays Analysis
  const mealTimings = useMemo(() => {
    const mealLogsByType = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    
    filteredFoodLog.forEach(entry => {
      if (mealLogsByType[entry.mealType]) {
        const date = new Date(entry.loggedAt);
        const mins = date.getHours() * 60 + date.getMinutes();
        mealLogsByType[entry.mealType].push(mins);
      }
    });

    const timingStats = {};
    Object.keys(mealLogsByType).forEach(type => {
      const logs = mealLogsByType[type];
      const count = logs.length;
      if (count === 0) {
        timingStats[type] = { avgStr: '—', delayCount: 0, total: 0 };
        return;
      }

      const sum = logs.reduce((a, b) => a + b, 0);
      const avgMins = sum / count;
      
      // Delay counts (checking if avg is after recommended window end)
      const limits = MEAL_RECOMMENDED_TIMES[type];
      let delayCount = 0;
      logs.forEach(mins => {
        if (mins > limits.end) delayCount++;
      });

      timingStats[type] = {
        avgStr: minutesToTimeStr(avgMins),
        delayCount,
        total: count,
        delayPct: Math.round((delayCount / count) * 100)
      };
    });

    return timingStats;
  }, [filteredFoodLog]);

  // 5. Medication Adherence Analysis (Delay & Compliance)
  const medSummary = useMemo(() => {
    let totalDosesLogged = filteredMedicineLogs.length;
    let totalDelays = 0;
    let delayedDosesCount = 0;

    filteredMedicineLogs.forEach(log => {
      const med = medicines.find(m => m.id === log.medicineId);
      if (med && med.time) {
        const actualTime = new Date(log.consumedAt);
        const actualMins = actualTime.getHours() * 60 + actualTime.getMinutes();
        const scheduledMins = timeToMinutes(med.time);
        
        const delayMins = actualMins - scheduledMins;
        if (delayMins > 15) { // Doses taken more than 15 minutes after schedule are marked delayed
          totalDelays += delayMins;
          delayedDosesCount++;
        }
      }
    });

    const averageDelayMins = delayedDosesCount
      ? Math.round(totalDelays / delayedDosesCount)
      : 0;

    return {
      totalDosesLogged,
      delayedDosesCount,
      averageDelayMins
    };
  }, [filteredMedicineLogs, medicines]);

  // 6. Routine Exercise Summary
  const exerciseSummary = useMemo(() => {
    let totalCompleted = 0;
    let totalScheduled = filteredGoalsLog.length * 3; // 3 goals: Walk, Meditation, Exercise

    filteredGoalsLog.forEach(log => {
      if (log.walk?.completed) totalCompleted++;
      if (log.meditation?.completed) totalCompleted++;
      if (log.exercise?.completed) totalCompleted++;
    });

    const exerciseCompletionPct = totalScheduled
      ? Math.round((totalCompleted / totalScheduled) * 100)
      : 0;

    return {
      totalCompleted,
      totalScheduled,
      exerciseCompletionPct
    };
  }, [filteredGoalsLog]);

  // 7. Formatted Charts Data
  const chartsData = useMemo(() => {
    // Blood Sugar line chart data
    const dailyBS = {};
    filteredReadings.forEach(r => {
      const dateStr = new Date(r.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyBS[dateStr]) dailyBS[dateStr] = { date: dateStr };
      if (r.mealType === 'fasting') dailyBS[dateStr].fasting = r.value;
      if (r.mealType === 'post-meal') dailyBS[dateStr].postMeal = r.value;
    });
    const bsChart = Object.values(dailyBS);

    // Water consumption daily data
    const dailyWater = {};
    // Populate all dates in range with 0 initially to show progress cleanly
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyWater[dateStr] = { date: dateStr, amount: 0 };
    }
    filteredWaterLog.forEach(log => {
      const dateStr = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyWater[dateStr]) {
        dailyWater[dateStr].amount += log.amountMl;
      } else {
        dailyWater[dateStr] = { date: dateStr, amount: log.amountMl };
      }
    });
    const waterChart = Object.values(dailyWater);

    return {
      bsChart,
      waterChart
    };
  }, [filteredReadings, filteredWaterLog, days]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page report-page">
      {/* ACTION HEADER (HIDDEN ON PRINT) */}
      <header className="report-action-header no-print">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="report-header-title">
          <span className="header-kicker">Clinical Reports</span>
          <h1>Health & Diabetologist Report</h1>
        </div>
        <div className="report-actions">
          <div className="range-picker">
            <button className={timeRange === '7' ? 'active' : ''} onClick={() => setTimeRange('7')}>7D</button>
            <button className={timeRange === '30' ? 'active' : ''} onClick={() => setTimeRange('30')}>30D</button>
            <button className={timeRange === '90' ? 'active' : ''} onClick={() => setTimeRange('90')}>90D</button>
          </div>
          <button className="btn-print" onClick={handlePrint}>
            <Printer size={18} /> Print / Save PDF
          </button>
        </div>
      </header>

      {/* THE ACTUAL PRINTABLE CLINICAL REPORT */}
      <main className="clinical-report-container" id="printable-report">
        
        {/* REPORT HEADER */}
        <section className="clinical-report-header">
          <div className="clinic-logo-section">
            <div className="logo-symbol">🌿</div>
            <div>
              <h2 className="app-title">GlucoTrack Patient Report</h2>
              <p className="subtitle">Clinical Glycemic & Compliance Log</p>
            </div>
          </div>
          <div className="report-meta-box">
            <p><strong>Prepared For:</strong> Diabetologist Consultation</p>
            <p><strong>Period:</strong> {formatDate(startDate)} to {formatDate(endDate)} ({days} days)</p>
            <p><strong>Generated On:</strong> {new Date().toLocaleString()}</p>
          </div>
        </section>

        <hr className="divider" />

        {/* PATIENT PROFILE CARD */}
        <section className="section-block">
          <h3 className="section-title"><Heart size={16} className="inline-icon" /> Patient Profile & Anthropometrics / रुग्णाची माहिती</h3>
          <div className="patient-profile-grid">
            <div className="profile-cell">
              <span>Patient Name</span>
              <strong>{settings?.userName || 'Mom'}</strong>
            </div>
            <div className="profile-cell">
              <span>Age / वय</span>
              <strong>{settings?.age || 51} Years</strong>
            </div>
            <div className="profile-cell">
              <span>Height / उंची</span>
              <strong>{settings?.height || 155} cm</strong>
            </div>
            <div className="profile-cell">
              <span>Weight / वजन</span>
              <strong>{settings?.weight || 60} kg</strong>
            </div>
            <div className="profile-cell">
              <span>Calculated BMI</span>
              <strong>
                {settings?.weight && settings?.height 
                  ? (settings.weight / Math.pow(settings.height / 100, 2)).toFixed(1)
                  : '—'}
              </strong>
            </div>
            <div className="profile-cell">
              <span>Diabetic Condition</span>
              <strong>{settings?.hasDiabetes ? 'Type 2 Diabetes' : 'Non-diabetic'}</strong>
            </div>
            <div className="profile-cell">
              <span>Knee Pain Status</span>
              <strong>{settings?.hasKneePain ? 'Active Knee Pain (Osteoarthritis Care)' : 'None'}</strong>
            </div>
          </div>
        </section>

        {/* CLINICAL SUMMARY CARDS */}
        <section className="section-block">
          <h3 className="section-title"><Activity size={16} className="inline-icon" /> Glycemic Metrics Summary (Diabetologist Summary)</h3>
          <div className="clinical-grid">
            
            <div className="clinical-stat-card">
              <span className="card-lbl">Avg Fasting Glucose</span>
              <strong className="card-val">{bsSummary.avgFasting ? `${bsSummary.avgFasting} mg/dL` : 'No data'}</strong>
              <span className="card-desc text-success">Target: 70-100 mg/dL</span>
            </div>

            <div className="clinical-stat-card">
              <span className="card-lbl">Avg Post-Meal Glucose</span>
              <strong className="card-val">{bsSummary.avgPostMeal ? `${bsSummary.avgPostMeal} mg/dL` : 'No data'}</strong>
              <span className="card-desc text-danger">Target: &lt; 140 mg/dL</span>
            </div>

            <div className="clinical-stat-card highlight">
              <span className="card-lbl">Estimated HbA1c</span>
              <strong className="card-val color-brand">{bsSummary.estHbA1c ? `${bsSummary.estHbA1c}%` : '—'}</strong>
              <span className="card-desc">Derived from {bsSummary.totalReadings} readings</span>
            </div>

            <div className="clinical-stat-card">
              <span className="card-lbl">In-Target Range Pct</span>
              <strong className="card-val">{bsSummary.rangePct}%</strong>
              <div className="range-indicator-bar">
                <div className="fill" style={{ width: `${bsSummary.rangePct}%` }}></div>
              </div>
            </div>

          </div>
        </section>

        {/* COMPLIANCE & ROUTINE DELAYS */}
        <section className="section-block">
          <h3 className="section-title"><Clock size={16} className="inline-icon" /> Lifestyle Timings & Compliance Auditing</h3>
          
          <div className="timings-grid">
            
            {/* Meal Timings Delays */}
            <div className="timing-audit-card">
              <h4>Diet Meal Timings & Delays / आहाराची वेळ आणि उशीर</h4>
              <div className="audit-table">
                <div className="audit-header">
                  <span>Meal Type</span>
                  <span>Target Window</span>
                  <span>Avg Logged Time</span>
                  <span>Late / Delays</span>
                </div>
                {Object.entries(MEAL_RECOMMENDED_TIMES).map(([mealKey, limits]) => {
                  const stat = mealTimings[mealKey];
                  const hasDelays = stat && stat.delayCount > 0;
                  return (
                    <div key={mealKey} className="audit-row">
                      <strong>{mealKey.charAt(0).toUpperCase() + mealKey.slice(1)}</strong>
                      <span>{limits.label}</span>
                      <span className={hasDelays ? 'text-warn' : ''}>{stat?.avgStr || '—'}</span>
                      <span className={hasDelays ? 'badge-warn' : 'badge-ok'}>
                        {hasDelays ? `${stat.delayCount} delays (${stat.delayPct}%)` : 'On Time ✓'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="note-text mt-2">
                * Eating dinner after 8:00 PM is clinically linked to elevated fasting blood glucose levels the next morning.
              </p>
            </div>

            {/* Meds & Exercise Adherence */}
            <div className="timing-audit-card">
              <h4>Medicine & Movement Adherence / औषधे आणि व्यायाम</h4>
              <div className="compliance-row">
                <div className="compliance-item">
                  <span className="num-val">{medSummary.totalDosesLogged}</span>
                  <span className="lbl-val">Medicine Doses Logged</span>
                </div>
                <div className="compliance-item">
                  <span className="num-val text-warn">{medSummary.delayedDosesCount}</span>
                  <span className="lbl-val">Delayed &gt; 15m</span>
                </div>
                <div className="compliance-item">
                  <span className="num-val">{medSummary.averageDelayMins}m</span>
                  <span className="lbl-val">Avg Medication Delay</span>
                </div>
              </div>

              <div className="compliance-row mt-4">
                <div className="compliance-item">
                  <span className="num-val">{exerciseSummary.exerciseCompletionPct}%</span>
                  <span className="lbl-val">Knee & Walk Completion</span>
                </div>
                <div className="compliance-item">
                  <span className="num-val water-color">{waterSummary.avgWaterMl}ml</span>
                  <span className="lbl-val">Avg Daily Water Logged</span>
                </div>
                <div className="compliance-item">
                  <span className="num-val water-color">{waterSummary.hitTargetPct}%</span>
                  <span className="lbl-val">Days hit 5L Target</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* VISUALIZATION CHARTS */}
        <section className="section-block page-break-before">
          <h3 className="section-title"><Activity size={16} className="inline-icon" /> Glycemic and Hydration Trends</h3>
          
          <div className="report-charts-grid">
            
            {/* Sugar trend chart */}
            <div className="report-chart-box">
              <h4>Blood Glucose Trend / रक्तातील साखरेचे प्रमाण</h4>
              <div className="chart-wrapper">
                {chartsData.bsChart.length === 0 ? (
                  <p className="empty-message-small">No blood glucose values recorded in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartsData.bsChart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" style={{ fontSize: '10px' }} />
                      <YAxis domain={[50, 250]} style={{ fontSize: '10px' }} />
                      <Tooltip />
                      <Legend style={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="fasting" name="Fasting" stroke="#2D6A4F" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="postMeal" name="Post-meal" stroke="#E76F51" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Hydration tracker chart */}
            <div className="report-chart-box">
              <h4>Daily Hydration Levels vs. Target / पाण्याची पातळी (५L ध्येय)</h4>
              <div className="chart-wrapper">
                {filteredWaterLog.length === 0 ? (
                  <p className="empty-message-small">No water consumption logs recorded in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartsData.waterChart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" style={{ fontSize: '10px' }} />
                      <YAxis style={{ fontSize: '10px' }} />
                      <Tooltip />
                      <ReferenceLine y={settings?.waterGoalMl || 5000} stroke="#E76F51" strokeDasharray="4 4" label={{ value: '5L Target', position: 'top', fill: '#E76F51', fontSize: '9px' }} />
                      <Bar dataKey="amount" name="Water (ml)" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* LOG DATA TABLES SECTION */}
        <section className="section-block page-break-before">
          <h3 className="section-title"><Activity size={16} className="inline-icon" /> Daily Clinical Logs / दैनंदिन नोंदी</h3>
          
          <div className="report-tables-container">
            
            {/* BS Logs Table */}
            <div className="report-table-wrapper">
              <h4>Blood Glucose Logs / रक्तातील साखरेच्या नोंदी</h4>
              <table className="clinical-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Meal Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Intake Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReadings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">No blood sugar values logged.</td>
                    </tr>
                  ) : (
                    filteredReadings.slice().reverse().map(r => {
                      const status = getReadingStatus(r.value, r.mealType);
                      return (
                        <tr key={r.id}>
                          <td>{new Date(r.loggedAt).toLocaleDateString()}</td>
                          <td>{formatTime(r.loggedAt)}</td>
                          <td style={{ textTransform: 'capitalize' }}>{r.mealType}</td>
                          <td><strong>{r.value} mg/dL</strong></td>
                          <td>
                            <span className={`tbl-badge badge-${status}`}>
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className="note-col">{r.notes || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Medicine Intake Logs Table */}
            <div className="report-table-wrapper mt-4">
              <h4>Medication Intake Logs / औषधोपचार नोंदी</h4>
              <table className="clinical-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Actual Intake Time</th>
                    <th>Medicine Name</th>
                    <th>Dosage</th>
                    <th>Notes / Context</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicineLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">No medicine intakes logged.</td>
                    </tr>
                  ) : (
                    filteredMedicineLogs.slice().reverse().map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.consumedAt).toLocaleDateString()}</td>
                        <td>{formatTime(log.consumedAt)}</td>
                        <td><strong>{log.medicineName}</strong></td>
                        <td>{log.dosage}</td>
                        <td className="note-col">{log.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Diet Logs Table */}
            <div className="report-table-wrapper mt-4">
              <h4>Dietary Intake Logs / आहार नोंदी</h4>
              <table className="clinical-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meal Type</th>
                    <th>Time Logged</th>
                    <th>Items Consumed</th>
                    <th>Diet Compliance Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFoodLog.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">No dietary meals logged.</td>
                    </tr>
                  ) : (
                    filteredFoodLog.slice().reverse().map(entry => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td style={{ textTransform: 'capitalize' }}>{entry.mealType}</td>
                        <td>{formatTime(entry.loggedAt)}</td>
                        <td><strong>{entry.items.join(', ')}</strong></td>
                        <td className="note-col">{entry.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </section>

        {/* SIGN OFF */}
        <footer className="clinical-report-footer mt-6">
          <div className="signature-line">
            <p>Patient Signature / नातेवाईक सही</p>
            <div className="sig-space"></div>
          </div>
          <div className="signature-line">
            <p>Diabetologist / Physician Remarks & Sign</p>
            <div className="sig-space"></div>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default Report;
