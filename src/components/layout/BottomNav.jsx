import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, TrendingUp, Syringe } from 'lucide-react';
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
        className="nav-btn nav-btn-fab"
        onClick={() => navigate('/log')}
        aria-label="Log Reading"
      >
        <Plus size={28} />
      </button>

      <button 
        className={`nav-btn ${isActive('/progress') ? 'active' : ''}`}
        onClick={() => navigate('/progress')}
        aria-label="Progress"
      >
        <TrendingUp size={24} />
        <span>Progress</span>
      </button>

      <button 
        className={`nav-btn ${isActive('/insulin') ? 'active' : ''}`}
        onClick={() => navigate('/insulin')}
        aria-label="Insulin"
      >
        <Syringe size={24} />
        <span>Insulin</span>
      </button>
    </nav>
  );
}

export default BottomNav;
