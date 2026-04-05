import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { addReading } from '../utils/storage';
import { getDefaultMealType, roundToNearest5Minutes, formatDate } from '../utils/dateHelpers';
import { getReadingStatus, getStatusLabel } from '../utils/statusHelpers';
import { ArrowLeft } from 'lucide-react';
import './LogReading.css';

function LogReading() {
  const navigate = useNavigate();
  const { refreshReadings, showToast } = useApp();
  
  const [value, setValue] = useState('');
  const [mealType, setMealType] = useState(getDefaultMealType());
  const [loggedAt, setLoggedAt] = useState(roundToNearest5Minutes().toISOString());
  const [notes, setNotes] = useState('');

  const status = value.length >= 3 ? getReadingStatus(Number(value), mealType) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const numValue = Number(value);
    if (!numValue || numValue < 20 || numValue > 600) {
      showToast('Please enter a valid blood sugar value', 'error');
      return;
    }

    addReading({
      value: numValue,
      unit: 'mg/dL',
      mealType,
      loggedAt,
      notes: notes.trim()
    });

    refreshReadings();
    showToast('Reading saved! ✓', 'success');
    navigate('/');
  };

  return (
    <div className="page log-reading">
      <header className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1>Log Reading</h1>
          <p className="subtitle">{formatDate(new Date().toISOString())}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <label className="form-label">Meal Type</label>
          <div className="meal-type-grid">
            <button
              type="button"
              className={`meal-btn ${mealType === 'fasting' ? 'active' : ''}`}
              onClick={() => setMealType('fasting')}
            >
              🌅 Fasting
            </button>
            <button
              type="button"
              className={`meal-btn ${mealType === 'post-meal' ? 'active' : ''}`}
              onClick={() => setMealType('post-meal')}
            >
              🍽️ Post-Meal
            </button>
            <button
              type="button"
              className={`meal-btn ${mealType === 'bedtime' ? 'active' : ''}`}
              onClick={() => setMealType('bedtime')}
            >
              🌙 Bedtime
            </button>
            <button
              type="button"
              className={`meal-btn ${mealType === 'other' ? 'active' : ''}`}
              onClick={() => setMealType('other')}
            >
              📌 Other
            </button>
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Blood Sugar Value</label>
          <div className="value-input-wrapper">
            <input
              type="number"
              inputMode="decimal"
              className="value-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="000"
              required
              autoFocus
            />
            <span className="value-unit">mg/dL</span>
          </div>
          
          {status && (
            <div className="live-status">
              <span className={`status-badge status-${status}`}>
                {getStatusLabel(status)}
              </span>
            </div>
          )}
          
          <p className="helper-text">
            {mealType === 'fasting' && 'Healthy range: 70–99 mg/dL'}
            {mealType === 'post-meal' && 'Healthy range: under 140 mg/dL'}
            {(mealType === 'bedtime' || mealType === 'other') && 'Healthy range: 70–130 mg/dL'}
          </p>
        </div>

        <div className="form-section">
          <label className="form-label">Notes (Optional)</label>
          <input
            type="text"
            className="notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes? (e.g., after exercise, ate late...)"
            maxLength={200}
          />
        </div>

        <button type="submit" className="btn-primary btn-save">
          Save Reading
        </button>
      </form>
    </div>
  );
}

export default LogReading;
