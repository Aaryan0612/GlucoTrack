import { useLocation, useNavigate } from 'react-router-dom';
import { Apple, Home, PlusCircle, Target, TrendingUp } from 'lucide-react';
import './BottomNav.css';

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/onboarding') return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-btn ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
        aria-label="Home"
      >
        <Home size={24} />
        <span>Home</span>
      </button>

      <button
        className={`nav-btn ${isActive('/food') ? 'active' : ''}`}
        onClick={() => navigate('/food')}
        aria-label="Food"
      >
        <Apple size={22} />
        <span>Food</span>
      </button>

      <button
        className="nav-btn nav-btn-fab"
        onClick={() => navigate('/log')}
        aria-label="Log Reading"
      >
        <PlusCircle size={28} />
      </button>

      <button
        className={`nav-btn ${isActive('/goals') ? 'active' : ''}`}
        onClick={() => navigate('/goals')}
        aria-label="Goals"
      >
        <Target size={22} />
        <span>Goals</span>
      </button>

      <button
        className={`nav-btn ${isActive('/progress') ? 'active' : ''}`}
        onClick={() => navigate('/progress')}
        aria-label="Progress"
      >
        <TrendingUp size={24} />
        <span>Progress</span>
      </button>
    </nav>
  );
}

export default BottomNav;
