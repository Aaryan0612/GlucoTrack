import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './OpeningQuote.css';

const OPENING_QUOTES = [
  'You are caring for yourself with courage today.',
  'Small, steady steps can change the whole week.',
  'A calm mind makes every number easier to face.',
  'Today is a fresh chance to be gentle with your body.',
  'You are not behind. You are showing up, and that matters.',
];

function OpeningQuote() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  const quote = useMemo(() => {
    const seed = new Date().toISOString().slice(0, 10);
    const index = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0) % OPENING_QUOTES.length;
    return OPENING_QUOTES[index];
  }, []);

  useEffect(() => {
    if (location.pathname === '/onboarding') return undefined;
    if (sessionStorage.getItem('glucotrack_opening_seen') === 'true') return undefined;

    setVisible(true);
    sessionStorage.setItem('glucotrack_opening_seen', 'true');
    const timeoutId = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="opening-quote-overlay" aria-hidden="true">
      <div className="opening-quote-card">
        <span className="opening-quote-kicker">A gentle start</span>
        <p>{quote}</p>
      </div>
    </div>
  );
}

export default OpeningQuote;
