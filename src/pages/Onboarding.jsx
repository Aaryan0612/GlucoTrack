import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSettings, saveSettings } from '../utils/storage';
import { useApp } from '../context/AppContext';
import './Onboarding.css';

function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const { refreshSettings } = useApp();

  const handleComplete = (e) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const settings = loadSettings();
    saveSettings({
      ...settings,
      userName: name.trim(),
      onboardingComplete: true
    });

    refreshSettings();
    navigate('/');
  };

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <div className="welcome-section">
          <img
            src="/glucotrack-icon.svg"
            alt="GlucoTrack logo"
            className="app-logo"
          />
          <h1 className="app-name">GlucoTrack</h1>
          <p className="tagline">Your gentle daily health companion</p>
        </div>

        <form onSubmit={handleComplete} className="name-form">
          <label className="form-label">What should I call you?</label>
          <input
            type="text"
            className="name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            autoFocus
            required
          />
          
          <button type="submit" className="btn-primary">
            Get Started
          </button>
        </form>

        <div className="features-preview">
          <div className="feature-item">
            <span className="feature-emoji">📊</span>
            <p>Track your blood sugar readings</p>
          </div>
          <div className="feature-item">
            <span className="feature-emoji">📈</span>
            <p>See your progress over time</p>
          </div>
          <div className="feature-item">
            <span className="feature-emoji">💉</span>
            <p>Never miss your Saturday insulin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
