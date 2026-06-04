import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LogIn } from 'lucide-react';
import './Login.css';

function Login() {
  const { user, authLoading, signInWithGoogle, settings } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading && settings) {
      if (settings.onboardingComplete) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, authLoading, settings, navigate]);

  if (authLoading) {
    return (
      <div className="login-page loading-screen">
        <div className="loading-spinner" />
        <p>Warm greetings, preparing your space...</p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-header">
          <img
            src="/glucotrack-icon.png"
            alt="GlucoTrack logo"
            className="brand-logo"
          />
          <h1 className="brand-name">GlucoTrack</h1>
          <p className="brand-tagline">Your gentle daily health companion</p>
        </div>

        <div className="login-copy">
          <h2>Welcome home</h2>
          <p>
            Sign in securely using Google to view your blood sugar records, track medications, and schedule daily reminders.
          </p>
        </div>

        <button className="btn-primary btn-google" onClick={signInWithGoogle}>
          <LogIn size={20} />
          <span>Sign in with Google</span>
        </button>

        <div className="love-note">
          <p>Made with love for our mothers and families 💖</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
