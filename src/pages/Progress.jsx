import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getReadingsInRange, getAverage } from '../utils/aggregations';
import { getReadingStatus, getStatusLabel } from '../utils/statusHelpers';
import { formatDate, formatTime } from '../utils/dateHelpers';
import './Progress.css';

function Progress() {
  const { readings } = useApp();
  const [timeRange, setTimeRange] = useState('7');

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    if (timeRange === '7') start.setDate(end.getDate() - 7);
    else if (timeRange === '30') start.setDate(end.getDate() - 30);
    else if (timeRange === '90') start.setDate(end.getDate() - 90);
    else start.setFullYear(2000);
    
    return { start, end };
  };

  const { start, end } = getDateRange();
  const filteredReadings = getReadingsInRange(readings, start, end);
  
  const fastingReadings = filteredReadings.filter(r => r.mealType === 'fasting');
  const postMealReadings = filteredReadings.filter(r => r.mealType === 'post-meal');
  
  const avgFasting = getAverage(fastingReadings);
  const avgPostMeal = getAverage(postMealReadings);

  return (
    <div className="page progress">
      <header className="page-header-simple">
        <h1>Progress</h1>
      </header>

      <div className="time-range-selector">
        <button 
          className={`range-btn ${timeRange === '7' ? 'active' : ''}`}
          onClick={() => setTimeRange('7')}
        >
          7 Days
        </button>
        <button 
          className={`range-btn ${timeRange === '30' ? 'active' : ''}`}
          onClick={() => setTimeRange('30')}
        >
          30 Days
        </button>
        <button 
          className={`range-btn ${timeRange === '90' ? 'active' : ''}`}
          onClick={() => setTimeRange('90')}
        >
          3 Months
        </button>
        <button 
          className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
          onClick={() => setTimeRange('all')}
        >
          All
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Avg Fasting</span>
          <span className="stat-value">{avgFasting || '—'}</span>
          {avgFasting && <span className="stat-unit">mg/dL</span>}
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Post-Meal</span>
          <span className="stat-value">{avgPostMeal || '—'}</span>
          {avgPostMeal && <span className="stat-unit">mg/dL</span>}
        </div>
        <div className="stat-card">
          <span className="stat-label">Readings Logged</span>
          <span className="stat-value">{filteredReadings.length}</span>
        </div>
      </div>

      <div className="card">
        <h2>Reading History</h2>
        {filteredReadings.length === 0 ? (
          <p className="empty-message">Your history will appear here once you start logging</p>
        ) : (
          <div className="readings-list">
            {filteredReadings
              .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
              .map(reading => {
                const status = getReadingStatus(reading.value, reading.mealType);
                return (
                  <div key={reading.id} className="reading-row">
                    <div className="reading-info">
                      <span className={`status-dot status-${status}`}></span>
                      <div>
                        <div className="reading-main">
                          <span className="reading-value-text">{reading.value} mg/dL</span>
                          <span className={`status-badge status-${status}`}>
                            {getStatusLabel(status)}
                          </span>
                        </div>
                        <div className="reading-meta">
                          <span className="meal-type">{reading.mealType}</span>
                          <span className="reading-time">
                            {formatDate(reading.loggedAt)} at {formatTime(reading.loggedAt)}
                          </span>
                        </div>
                        {reading.notes && (
                          <p className="reading-notes">{reading.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Progress;
