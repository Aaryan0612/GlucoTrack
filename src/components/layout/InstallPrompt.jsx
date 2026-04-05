import { useEffect, useMemo, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { updateSettings } from '../../utils/storage';
import './InstallPrompt.css';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function InstallPrompt() {
  const location = useLocation();
  const { settings, refreshSettings } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setReady(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const shouldShow = useMemo(() => {
    if (!settings || settings.installPromptDismissed) return false;
    if (typeof window === 'undefined') return false;
    if (location.pathname === '/onboarding') return false;
    return !isStandalone() && (ready || isIOS());
  }, [location.pathname, ready, settings]);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    updateSettings({ installPromptDismissed: true });
    refreshSettings();
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    handleDismiss();
  };

  return (
    <div className="install-banner">
      <div className="install-copy">
        <p className="install-title">Install GlucoTrack</p>
        <p className="install-text">
          Keep it on the home screen so it opens like an app and stays easy to reach every day.
          {isIOS() ? ' Tap Share, then Add to Home Screen.' : ''}
        </p>
      </div>
      <div className="install-actions">
        {isIOS() ? (
          <span className="install-ios-tip">
            <Share2 size={16} /> Add to Home Screen
          </span>
        ) : (
          <button className="install-cta" onClick={handleInstall}>
            <Download size={16} /> Install
          </button>
        )}
        <button className="install-dismiss" onClick={handleDismiss} aria-label="Dismiss install prompt">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
