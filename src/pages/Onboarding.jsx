import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Onboarding.css';

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState(51);
  const [height, setHeight] = useState(155);
  const [weight, setWeight] = useState(60);
  const [hasKneePain, setHasKneePain] = useState(true);
  const [hasDiabetes, setHasDiabetes] = useState(true);
  const [condition, setCondition] = useState('Normal'); // Default baseline feeling
  
  const { updateSettings } = useApp();

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (step === 1 && !name.trim()) return;
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleComplete = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    await updateSettings({
      userName: name.trim(),
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      hasKneePain,
      hasDiabetes,
      todayCondition: condition,
      waterGoalMl: 5000, // 5 liters for mom
      onboardingComplete: true
    });

    navigate('/');
  };

  const conditionOptions = [
    { key: 'Energetic', label: 'Energetic / उत्साही', emoji: '😊' },
    { key: 'Normal', label: 'Normal / ठीक', emoji: '🙂' },
    { key: 'Tired', label: 'Tired / थकल्यासारखे', emoji: '🥱' },
    { key: 'In Pain', label: 'In Pain / त्रास होतोय', emoji: '😣' }
  ];

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <div className="welcome-section">
          <img
            src="/pwa-192x192.png"
            alt="GlucoTrack logo"
            className="app-logo"
          />
          <h1 className="app-name">GlucoTrack</h1>
          <p className="tagline">Your gentle daily health companion</p>
        </div>

        <div className="onboarding-form">
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 4 ? 'active' : ''}`} />
          </div>

          {step === 1 && (
            <form onSubmit={handleNext}>
              <div className="form-group">
                <label className="form-label">What is her name? / नाव</label>
                <input
                  type="text"
                  className="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mom"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary" disabled={!name.trim()} style={{ marginTop: 'var(--space-2)' }}>
                Next / पुढे
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNext}>
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Age / वय</label>
                <input
                  type="number"
                  className="name-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="120"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Height / उंची (cm)</label>
                <input
                  type="number"
                  className="name-input"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min="50"
                  max="250"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Weight / वजन (kg)</label>
                <input
                  type="number"
                  className="name-input"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="10"
                  max="300"
                  required
                />
              </div>
              <div className="onboarding-nav-buttons">
                <button type="button" className="btn-secondary" onClick={handleBack}>
                  Back / मागे
                </button>
                <button type="submit" className="btn-primary">
                  Next / पुढे
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleNext}>
              <div className="checkbox-section" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="checkbox-row" style={{ minHeight: '44px' }}>
                  <input
                    type="checkbox"
                    checked={hasKneePain}
                    onChange={(e) => setHasKneePain(e.target.checked)}
                  />
                  <span>Has knee pain? / गुडघेदुखी आहे का?</span>
                </label>

                <label className="checkbox-row" style={{ minHeight: '44px' }}>
                  <input
                    type="checkbox"
                    checked={hasDiabetes}
                    onChange={(e) => setHasDiabetes(e.target.checked)}
                  />
                  <span>Has Diabetes? / मधुमेह आहे का?</span>
                </label>
              </div>
              <div className="onboarding-nav-buttons">
                <button type="button" className="btn-secondary" onClick={handleBack}>
                  Back / मागे
                </button>
                <button type="submit" className="btn-primary">
                  Next / पुढे
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div>
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label" style={{ marginBottom: 'var(--space-2)' }}>
                  How is she feeling today? / आजची प्रकृती कशी आहे?
                </label>
                <div className="condition-grid">
                  {conditionOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`condition-btn ${condition === opt.key ? 'selected' : ''}`}
                      onClick={() => setCondition(opt.key)}
                    >
                      <span className="condition-emoji">{opt.emoji}</span>
                      <span className="condition-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="onboarding-nav-buttons">
                <button type="button" className="btn-secondary" onClick={handleBack}>
                  Back / मागे
                </button>
                <button type="button" className="btn-primary" onClick={handleComplete}>
                  Complete Setup / पूर्ण करा
                </button>
              </div>
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="features-preview" style={{ marginTop: 'var(--space-6)' }}>
            <div className="feature-item">
              <span className="feature-emoji">💧</span>
              <p>Track 5 liters of water daily</p>
            </div>
            <div className="feature-item">
              <span className="feature-emoji">🚶</span>
              <p>Gentle exercises & diet tips</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
