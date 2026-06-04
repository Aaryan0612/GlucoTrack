import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { getRandomMotivation } from '../../utils/motivationData';
import './OpeningQuote.css';

// The original full-screen blocking overlay is disabled (returns null) to optimize loading speed.
export function OpeningQuoteOverlay() {
  return null;
}

// Inline card component to display inspiration, jokes, and love notes dynamically on the dashboard.
export function MotivationCard() {
  const [motivation, setMotivation] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const { item, index } = getRandomMotivation();
    setMotivation(item);
    setCurrentIndex(index);
  }, []);

  const handleShuffle = () => {
    setAnimate(true);
    const { item, index } = getRandomMotivation(currentIndex);
    
    // Smooth transition delay for text change
    setTimeout(() => {
      setMotivation(item);
      setCurrentIndex(index);
    }, 200);

    setTimeout(() => {
      setAnimate(false);
    }, 450);
  };

  if (!motivation) return null;

  return (
    <div className={`motivation-card-container ${animate ? 'scale-out-in' : ''}`}>
      <div className={`motivation-icon-badge ${motivation.type}`}>
        <span>{motivation.icon}</span>
      </div>
      
      <div className="motivation-text-content">
        <span className="motivation-kicker">{motivation.kicker}</span>
        <p className="motivation-quote">{motivation.text}</p>
      </div>

      <button className="btn-shuffle-positivity" onClick={handleShuffle} aria-label="Next positive message">
        <Sparkles size={16} />
        <span>Tap for a Smile 💖</span>
      </button>
    </div>
  );
}

export default OpeningQuoteOverlay;
