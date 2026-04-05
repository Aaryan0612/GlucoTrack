import { useApp } from '../context/AppContext';
import { addInsulinRecord } from '../utils/storage';
import { getMostRecentSaturday, isTodaySaturday, wasInsulinTakenThisSaturday, formatDate } from '../utils/dateHelpers';
import { getInsulinStreak } from '../utils/aggregations';
import { Syringe } from 'lucide-react';
import './Insulin.css';

function Insulin() {
  const { insulinLog, refreshInsulinLog, showToast } = useApp();
  
  const thisSaturday = getMostRecentSaturday();
  const isSaturday = isTodaySaturday();
  const takenThisWeek = wasInsulinTakenThisSaturday(insulinLog);
  const streak = getInsulinStreak(insulinLog);

  const handleMarkAsTaken = () => {
    addInsulinRecord({
      scheduledDate: thisSaturday,
      taken: true,
      takenAt: new Date().toISOString(),
      notes: ''
    });
    
    refreshInsulinLog();
    showToast('Insulin logged for today 💉✓', 'success');
  };

  return (
    <div className="page insulin">
      <header className="page-header-simple">
        <h1>Insulin Tracker</h1>
      </header>

      <div className={`card insulin-status ${takenThisWeek ? 'taken' : 'pending'}`}>
        <div className="insulin-icon">
          <Syringe size={32} />
        </div>
        <h2>Saturday Insulin</h2>
        <p className="insulin-date">{formatDate(thisSaturday)}</p>
        
        {takenThisWeek ? (
          <div className="status-taken">
            <span className="checkmark">✓</span>
            <span>Done — Taken this Saturday</span>
          </div>
        ) : (
          <>
            <p className="status-pending">
              {isSaturday ? 'Due today' : 'Due this Saturday'}
            </p>
            <button className="btn-primary" onClick={handleMarkAsTaken}>
              Mark as Taken
            </button>
          </>
        )}
      </div>

      {streak > 0 && (
        <div className="card streak-card">
          <div className="streak-content">
            <span className="streak-emoji">🔥</span>
            <div>
              <h3>{streak}-week streak</h3>
              <p>Keep it up!</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Injection History</h2>
        {insulinLog.length === 0 ? (
          <p className="empty-message">Your injection history will appear here</p>
        ) : (
          <div className="history-list">
            {insulinLog
              .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
              .slice(0, 12)
              .map(record => (
                <div key={record.id} className="history-row">
                  <span className={`history-status ${record.taken ? 'taken' : 'missed'}`}>
                    {record.taken ? '✓' : '✗'}
                  </span>
                  <div className="history-info">
                    <span className="history-date">{formatDate(record.scheduledDate)}</span>
                    <span className="history-label">
                      {record.taken ? 'Taken' : 'Missed'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Insulin;
