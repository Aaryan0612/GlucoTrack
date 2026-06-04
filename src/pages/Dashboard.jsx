import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, Moon, Plus, Sun, Syringe, Target, Clock, Pill, Check, LogOut, Droplet, Play, Square, Music, Youtube, Upload, Trash2 } from 'lucide-react';
import BottomSheet from '../components/shared/BottomSheet';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { MotivationCard } from '../components/layout/OpeningQuote';
import {
  getEncouragementMessage,
  getLatestReading,
  getQuickInsight,
  getTodaysFasting,
  getTodaysPostMeal,
  getWeeklyReadingOverview,
} from '../utils/aggregations';
import {
  combineDateAndTime,
  formatDate,
  formatCalendarLabel,
  formatTime,
  getTimeOfDay,
  shouldShowInsulinBanner,
  toDateKey,
  toInputTimeValue
} from '../utils/dateHelpers';
import { getReadingStatus, getStatusLabel } from '../utils/statusHelpers';
import { playSongMelody, playMeditationOm, stopAllAudio } from '../utils/audioEngine';
import { saveLocalSong, getLocalSongUrl, hasLocalSong, deleteLocalSong } from '../utils/audioStorage';
import './Dashboard.css';

const FOOD_MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { key: 'lunch', label: 'Lunch', icon: '🥗' },
  { key: 'snacks', label: 'Snacks', icon: '☕' },
  { key: 'dinner', label: 'Dinner', icon: '🍲' },
];

const GOALS = [
  { key: 'walk', label: 'Walk', icon: '🚶' },
  { key: 'meditation', label: 'Meditation', icon: '🧘' },
  { key: 'exercise', label: 'Exercise', icon: '💪' },
];

// Helper to format HH:MM into a beautiful 12-hour AM/PM label
function formatTimeLabel(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function Dashboard() {
  const navigate = useNavigate();
  const {
    readings,
    foodLog,
    goalsLog,
    insulinLog,
    settings,
    medicines,
    reminders,
    medicineLogs,
    addMedicineLog,
    showToast,
    signOut,
    addInsulinRecord,
    waterLog,
    addWaterLog,
    deleteWaterLog,
    toggleGoal
  } = useApp();
  const { theme, toggleTheme } = useTheme();
  
  const [selectedDay, setSelectedDay] = useState(null);
  const [logMedOpen, setLogMedOpen] = useState(false);
  const [activeTimelineMed, setActiveTimelineMed] = useState(null);
  const [medLogTime, setMedLogTime] = useState(toInputTimeValue(new Date()));
  const [medLogNotes, setMedLogNotes] = useState('');

  // Mindfulness & Audio Synth States
  const [activeSong, setActiveSong] = useState(null);
  const [isPlayingMp3, setIsPlayingMp3] = useState(false);
  const [localSongs, setLocalSongs] = useState({ chandTaare: false, pyarKeLiye: false, meriChunar: false });
  const [meditationActive, setMeditationActive] = useState(false);
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(0);
  const [meditationDuration, setMeditationDuration] = useState(300);
  const [breathingPhase, setBreathingPhase] = useState('Inhale 🌸');
  const [meditationTimer, setMeditationTimer] = useState(null);
  const audioRef = useRef(null);

  // Load local song status from IndexedDB and auto-populate from assets if available
  useEffect(() => {
    async function checkLocalSongs() {
      try {
        const songsList = [
          { id: 'chandTaare', path: '/songs/chandTaare.mp3' },
          { id: 'pyarKeLiye', path: '/songs/pyarKeLiye.mp3' },
          { id: 'meriChunar', path: '/songs/meriChunar.mp3' }
        ];
        
        const status = {};
        
        for (const song of songsList) {
          let hasSong = await hasLocalSong(song.id);
          if (!hasSong) {
            // Auto-populate from public assets
            try {
              const res = await fetch(song.path);
              if (res.ok) {
                const blob = await res.blob();
                await saveLocalSong(song.id, blob);
                hasSong = true;
              }
            } catch (fetchErr) {
              console.warn(`Could not auto-populate song ${song.id} from ${song.path}:`, fetchErr);
            }
          }
          status[song.id] = hasSong;
        }
        
        setLocalSongs(status);
      } catch (err) {
        console.error('Error checking local songs:', err);
      }
    }
    checkLocalSongs();
  }, []);

  // Audio Engine Lifecycle Cleanup
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (meditationTimer) clearInterval(meditationTimer);
    };
  }, [meditationTimer]);

  const handlePlaySong = async (songId, forceSynth = false) => {
    const useMp3 = !forceSynth && localSongs[songId];

    if (activeSong === songId) {
      stopAllAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setActiveSong(null);
      setIsPlayingMp3(false);
      showToast('Music stopped 🎵');
      return;
    }

    // Stop active synth and MP3 before playing a new one
    stopAllAudio();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    // Cancel active meditation if playing
    if (meditationActive) {
      handleCancelMeditation();
    }

    setActiveSong(songId);

    if (useMp3) {
      setIsPlayingMp3(true);
      try {
        const songUrl = await getLocalSongUrl(songId);
        if (songUrl && audioRef.current) {
          audioRef.current.src = songUrl;
          audioRef.current.play()
            .then(() => {
              showToast('Playing your uploaded MP3 song 🎵💖');
            })
            .catch((err) => {
              console.error('Audio playback error:', err);
              showToast('Playback failed. Please click play again.');
              setActiveSong(null);
              setIsPlayingMp3(false);
            });
        } else {
          showToast('Failed to load MP3. Playing synth cover instead 🎹');
          setIsPlayingMp3(false);
          playSongMelody(songId, () => {});
        }
      } catch (err) {
        console.error(err);
        setIsPlayingMp3(false);
        playSongMelody(songId, () => {});
      }
    } else {
      setIsPlayingMp3(false);
      playSongMelody(songId, () => {});
      showToast('Playing warm chiptune covers 🎵💖');
    }
  };

  const handleUploadSong = async (e, songId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      showToast('Please select a valid audio file (MP3, etc.) 🚫');
      return;
    }

    try {
      showToast('Saving song locally for offline play...');
      await saveLocalSong(songId, file);
      setLocalSongs((prev) => ({ ...prev, [songId]: true }));
      showToast('Song saved successfully! 🎵✨');

      // Reset active song if the uploaded song was active
      if (activeSong === songId) {
        stopAllAudio();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setActiveSong(null);
        setIsPlayingMp3(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save song. Please try again.');
    }
  };

  const handleDeleteSong = async (songId) => {
    try {
      await deleteLocalSong(songId);
      setLocalSongs((prev) => ({ ...prev, [songId]: false }));
      showToast('Local MP3 file removed 🗑️');

      if (activeSong === songId && isPlayingMp3) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setActiveSong(null);
        setIsPlayingMp3(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete song. Please try again.');
    }
  };

  const handleSongEnded = () => {
    setActiveSong(null);
    setIsPlayingMp3(false);
    showToast('Song playback completed 🎵');
  };

  const handleStartMeditation = (minutes) => {
    // Cancel active music (synth and MP3)
    stopAllAudio();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setActiveSong(null);
    setIsPlayingMp3(false);

    const secs = minutes * 60;
    setMeditationActive(true);
    setMeditationTimeLeft(secs);
    setMeditationDuration(secs);
    setBreathingPhase('Inhale 🌸');
    
    // Play deep Om & Binaural focus beats
    playMeditationOm();

    if (meditationTimer) clearInterval(meditationTimer);

    const timer = setInterval(() => {
      setMeditationTimeLeft((prev) => {
        const nextSecs = prev - 1;
        if (nextSecs <= 0) {
          clearInterval(timer);
          stopAllAudio();
          setMeditationActive(false);
          // Mark meditation goal complete!
          const todayKey = toDateKey();
          toggleGoal(todayKey, 'meditation');
          showToast('Meditation complete! Feeling peaceful and refreshed 🧘✨');
          return 0;
        }

        // 12-second breathing cycle (4s inhale, 4s hold, 4s exhale)
        const elapsed = secs - nextSecs;
        const phaseSecs = elapsed % 12;
        if (phaseSecs < 4) {
          setBreathingPhase('Inhale 🌸');
        } else if (phaseSecs < 8) {
          setBreathingPhase('Hold 🧘');
        } else {
          setBreathingPhase('Exhale 💨');
        }

        return nextSecs;
      });
    }, 1000);

    setMeditationTimer(timer);
  };

  const handleCancelMeditation = () => {
    stopAllAudio();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (meditationTimer) {
      clearInterval(meditationTimer);
      setMeditationTimer(null);
    }
    setMeditationActive(false);
    showToast('Meditation session cancelled 🧘');
  };

  useEffect(() => {
    if (settings && !settings.onboardingComplete) {
      navigate('/onboarding');
    }
  }, [navigate, settings]);

  const todayKey = toDateKey();
  const todayFood = foodLog.filter((entry) => entry.date === todayKey);
  const todayGoals = goalsLog.find((entry) => entry.date === todayKey);
  const todayFasting = getTodaysFasting(readings);
  const todayPostMeal = getTodaysPostMeal(readings);
  const latestReading = getLatestReading(readings);
  const weekOverview = getWeeklyReadingOverview(readings);
  const insight = getQuickInsight({ readings, foodLog, goalsLog });
  const encouragement = getEncouragementMessage(readings);

  const todaysWaterLog = useMemo(() => {
    return waterLog.filter((entry) => entry.date === todayKey);
  }, [waterLog, todayKey]);

  const totalWaterLogged = useMemo(() => {
    return todaysWaterLog.reduce((sum, entry) => sum + entry.amountMl, 0);
  }, [todaysWaterLog]);

  const waterGoal = settings?.waterGoalMl || 5000;
  const waterProgressPct = Math.min(Math.round((totalWaterLogged / waterGoal) * 100), 100);

  const handleLogWater = async (amountMl) => {
    await addWaterLog(amountMl, todayKey);
    showToast(`Logged +${amountMl}ml of water 💧`);
  };

  const handleClearWater = async () => {
    if (window.confirm("Are you sure you want to clear today's water intake logs?")) {
      const promises = todaysWaterLog.map((log) => deleteWaterLog(log.id));
      await Promise.all(promises);
      showToast('Water logs cleared for today 💧');
    }
  };

  const currentSaturday = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysToSaturday = day === 6 ? 0 : 6 - day;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysToSaturday);
    return toDateKey(saturday);
  }, []);
  const insulinTaken = insulinLog.some((record) => record.scheduledDate === currentSaturday && record.taken);

  // Compile today's care routine timeline: medicines & reminders sorted chronologically
  const timelineItems = useMemo(() => {
    const items = [];
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    // Active medicines
    medicines.forEach((med) => {
      if (!med.active) return;
      const log = medicineLogs.find(
        (l) => l.medicineId === med.id && l.date === todayKey
      );
      items.push({
        type: 'medicine',
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        time: med.time,
        taken: !!log,
        takenAt: log ? log.consumedAt : null,
        notes: log ? log.notes : '',
        raw: med
      });
    });

    // Active reminders for today
    reminders.forEach((rem) => {
      if (!rem.active) return;
      const repeatEveryday = !rem.days || rem.days.length === 0;
      if (repeatEveryday || rem.days.includes(todayDayName)) {
        items.push({
          type: 'reminder',
          id: rem.id,
          name: rem.title,
          time: rem.time,
          taken: false,
          raw: rem
        });
      }
    });

    // Sort by scheduled minutes from midnight
    return items.sort((a, b) => {
      const [hA, mA] = a.time.split(':').map(Number);
      const [hB, mB] = b.time.split(':').map(Number);
      return (hA * 60 + mA) - (hB * 60 + mB);
    });
  }, [medicines, reminders, medicineLogs, todayKey]);

  if (!settings) return null;

  const handleMarkInsulin = () => {
    addInsulinRecord({
      scheduledDate: currentSaturday,
      taken: true,
      takenAt: new Date().toISOString(),
      notes: '',
    });
    showToast('Insulin logged 💉');
  };

  const handleOpenLogMed = (item) => {
    setActiveTimelineMed(item);
    setMedLogTime(toInputTimeValue(new Date()));
    setMedLogNotes('');
    setLogMedOpen(true);
  };

  const handleSaveMedLog = async () => {
    if (!activeTimelineMed) return;
    
    await addMedicineLog({
      medicineId: activeTimelineMed.id,
      medicineName: activeTimelineMed.name,
      dosage: activeTimelineMed.dosage,
      date: todayKey,
      consumedAt: combineDateAndTime(todayKey, medLogTime),
      notes: medLogNotes.trim()
    });

    showToast('Medication log saved ✓');
    setLogMedOpen(false);
  };

  return (
    <div className="page dashboard">
      <header className="dashboard-header">
        <div>
          <p className="section-eyebrow">GlucoTrack</p>
          <h1 className="greeting">Good {getTimeOfDay()}, {settings.userName || 'there'}</h1>
          <p className="date">{formatDate(new Date())}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="theme-toggle"
            onClick={signOut}
            aria-label="Sign out"
            style={{ color: 'var(--color-high)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* POSITIVITY INSPIRATIONAL COMPONENT */}
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <MotivationCard />
      </section>

      {/* MUSIC & MEDITATION MINDFULNESS WIDGET */}
      <section className="card mindfulness-card">
        <div className="section-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mindfulness-sparkle">🌸</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700 }}>Mindfulness & Melodies</h2>
          </div>
          {activeSong && (
            <button className="btn-stop-music" onClick={() => handlePlaySong(activeSong)}>
              <Square size={10} fill="currentColor" style={{ marginRight: '4px' }} /> Stop Music
            </button>
          )}
        </div>
        <p className="mindfulness-subtitle">Play her favorite songs or begin a scientific deep focus "Om" meditation session.</p>

        {/* Favorite Songs Sequencer */}
        <div className="music-player-grid">
          {[
            { id: 'chandTaare', title: 'Chaand Taare Tod Laoon', movie: 'Yes Boss (Shah Rukh Khan)', yt: 'https://www.youtube.com/watch?v=R2_5N2e2qCo' },
            { id: 'pyarKeLiye', title: 'Pyar Ke Liye Char Pal', movie: 'Dil Kya Kare', yt: 'https://www.youtube.com/watch?v=F07gB5v64b0' },
            { id: 'meriChunar', title: 'Meri Chunar Udd Udd Jaye', movie: 'Falguni Pathak', yt: 'https://www.youtube.com/watch?v=68SGlX3sC4c' }
          ].map((song) => (
            <div className="song-row" key={song.id}>
              <div className="song-info">
                <Music size={16} className={`song-icon ${activeSong === song.id ? 'playing' : ''}`} />
                <div className="song-details">
                  <strong>{song.title}</strong>
                  <span>{song.movie}</span>
                </div>
              </div>
              <div className="song-actions">
                {localSongs[song.id] ? (
                  <>
                    <button 
                      className={`btn-play-mp3 ${activeSong === song.id && isPlayingMp3 ? 'active' : ''}`}
                      onClick={() => handlePlaySong(song.id)}
                      aria-label="Play song"
                    >
                      {activeSong === song.id && isPlayingMp3 ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />} Play Song
                    </button>
                    <button
                      className="btn-delete-song"
                      onClick={() => handleDeleteSong(song.id)}
                      title="Remove MP3"
                      aria-label="Remove MP3"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <label className="btn-upload-mp3">
                    <Upload size={12} /> Upload MP3
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={(e) => handleUploadSong(e, song.id)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                )}

                {/* Synth Cover Alternate Button */}
                <button 
                  className={`btn-play-synth ${activeSong === song.id && !isPlayingMp3 ? 'active' : ''}`}
                  onClick={() => handlePlaySong(song.id, true)}
                  title="Play 8-bit Synth version"
                  aria-label="Play 8-bit synth version"
                >
                  Synth
                </button>

                <a 
                  href={song.yt} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-play-youtube"
                  title="Watch Video"
                >
                  <Youtube size={12} /> Video
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Scientific Meditation Launcher */}
        <div className="meditation-launcher-section">
          <h3>Scientific "Om" Meditation / ध्यान 🧘</h3>
          <p className="med-desc">Deep cosmic 136.1Hz resonant chant with 6Hz Theta brainwave focus waves.</p>
          <div className="meditation-durations">
            <button className="med-dur-btn" onClick={() => handleStartMeditation(5)}>5 Mins</button>
            <button className="med-dur-btn" onClick={() => handleStartMeditation(10)}>10 Mins</button>
            <button className="med-dur-btn" onClick={() => handleStartMeditation(15)}>15 Mins</button>
          </div>
        </div>
      </section>

      {/* FULL-SCREEN PEACEFUL MEDITATION OVERLAY */}
      {meditationActive && (
        <div className="meditation-fullscreen-overlay">
          <div className="meditation-overlay-content">
            <div className="meditation-lotus">🧘</div>
            <h2 className="meditation-timer-display">
              {Math.floor(meditationTimeLeft / 60)}:{(meditationTimeLeft % 60).toString().padStart(2, '0')}
            </h2>
            <div className="breathing-circle-container">
              <div className={`breathing-circle-outer ${breathingPhase.includes('Inhale') ? 'expand' : breathingPhase.includes('Exhale') ? 'contract' : 'hold'}`} />
              <div className="breathing-circle-inner">
                <span className="breathing-text">{breathingPhase}</span>
              </div>
            </div>
            <p className="meditation-prompt">Close your eyes, breathe with the circle, and follow the resonant vibration...</p>
            <button className="btn-cancel-meditation" onClick={handleCancelMeditation}>
              Stop & Exit Session
            </button>
          </div>
        </div>
      )}

      {/* TODAY'S MEDICINES & REMINDERS WIDGET */}
      <section className="card timeline-card">
        <div className="section-title-row">
          <h2>Today's Care Routine</h2>
          <button className="inline-link" onClick={() => navigate('/goals', { state: { tab: 'medicines' } })}>
            Manage
          </button>
        </div>
        {timelineItems.length === 0 ? (
          <p className="empty-message" style={{ fontSize: 'var(--text-sm)' }}>
            No routines or medicines scheduled for today.
          </p>
        ) : (
          <div className="timeline-list">
            {timelineItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="timeline-row">
                <div className={`timeline-dot ${item.taken ? 'completed' : ''} ${item.type === 'reminder' ? 'reminder' : ''}`} />
                <div className="timeline-time">
                  {formatTimeLabel(item.time)}
                </div>
                <div className="timeline-content">
                  <div className="timeline-details">
                    <strong className="timeline-title">{item.name}</strong>
                    {item.type === 'medicine' ? (
                      <>
                        <span className="timeline-sub">Dosage: {item.dosage || '1 unit'}</span>
                        {item.taken ? (
                          <span className="timeline-sub taken">
                            Taken at {formatTime(item.takenAt)}
                            {item.notes && ` (${item.notes})`}
                          </span>
                        ) : (
                          <span className="timeline-sub" style={{ color: 'var(--color-accent)' }}>Pending consumption</span>
                        )}
                      </>
                    ) : (
                      <span className="timeline-sub">Routine alarm alert</span>
                    )}
                  </div>
                  {item.type === 'medicine' && !item.taken && (
                    <button className="btn-take-med" onClick={() => handleOpenLogMed(item)}>
                      <Check size={14} /> Taken
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DAILY WATER HYDRATION TRACKER */}
      <section className="card water-card">
        <div className="section-title-row">
          <div className="water-header-title">
            <Droplet size={20} className="water-icon" />
            <h2>Daily Hydration</h2>
          </div>
          {todaysWaterLog.length > 0 && (
            <button className="inline-link text-danger" onClick={handleClearWater}>
              Clear
            </button>
          )}
        </div>
        
        <div className="water-stats">
          <div className="water-progress-text">
            <strong>{totalWaterLogged.toLocaleString()} ml</strong>
            <span> of {waterGoal.toLocaleString()} ml target</span>
          </div>
          <span className="water-percentage">{waterProgressPct}%</span>
        </div>

        <div className="water-progress-bar-container">
          <div 
            className="water-progress-bar-fill" 
            style={{ width: `${waterProgressPct}%` }}
          />
        </div>

        <div className="water-quick-actions">
          <button className="water-btn" onClick={() => handleLogWater(250)}>
            +250ml
          </button>
          <button className="water-btn" onClick={() => handleLogWater(500)}>
            +500ml
          </button>
          <button className="water-btn" onClick={() => handleLogWater(1000)}>
            +1.0L
          </button>
        </div>
      </section>

      <section className="card hero-card">
        <div className="section-title-row">
          <h2>Today's Readings</h2>
          <button className="inline-link" onClick={() => navigate('/log')}>
            <Plus size={16} /> Log
          </button>
        </div>
        {!todayFasting && !todayPostMeal ? (
          <p className="empty-message">No readings yet today - tap + to add</p>
        ) : (
          <div className="readings-grid">
            {[todayFasting, todayPostMeal].filter(Boolean).map((reading) => {
              const label = reading.mealType === 'post-meal' ? 'Post-Meal' : 'Fasting';
              const status = getReadingStatus(reading.value, reading.mealType);
              return (
                <div key={reading.id} className="reading-item">
                  <span className="reading-label">{label}</span>
                  <div className="reading-value-row">
                    <span className="reading-value">{reading.value}</span>
                    <span className="reading-unit">mg/dL</span>
                  </div>
                  <span className={`status-badge status-${status}`}>{getStatusLabel(status)}</span>
                </div>
              );
            })}
          </div>
        )}
        {latestReading && (
          <p className="last-updated">Last updated at {formatTime(latestReading.loggedAt)}</p>
        )}
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Today's Goals</h2>
          <button className="inline-link" onClick={() => navigate('/goals')}>
            <Target size={16} /> Details
          </button>
        </div>
        <div className="goal-strip">
          {GOALS.map((goal) => {
            const completed = todayGoals?.[goal.key]?.completed;
            return (
              <button key={goal.key} className={`goal-pill ${completed ? 'done' : ''}`} onClick={() => navigate('/goals')}>
                <span>{goal.icon}</span>
                <span>{goal.label}</span>
                <i>{completed ? '✓' : ''}</i>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Today's Food</h2>
          <button className="inline-link" onClick={() => navigate('/food')}>
            <Apple size={16} /> Open
          </button>
        </div>
        <div className="food-strip">
          {FOOD_MEALS.map((meal) => {
            const entry = todayFood.find((item) => item.mealType === meal.key);
            return (
              <button
                key={meal.key}
                className={`food-summary-card ${entry ? 'logged' : ''}`}
                onClick={() => navigate('/food', { state: { mealType: meal.key } })}
              >
                <span className="food-icon">{meal.icon}</span>
                <strong>{meal.label}</strong>
                <span>{entry ? '✓ Logged' : '+ Add'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Weekly Overview</h2>
          <button className="inline-link" onClick={() => navigate('/progress')}>See trends</button>
        </div>
        <div className="week-strip">
          {weekOverview.map((day) => (
            <button key={day.dateKey} className="week-card" onClick={() => setSelectedDay(day)}>
              <span>{formatCalendarLabel(day.date)}</span>
              <i className={day.hasReading ? 'filled' : ''} />
            </button>
          ))}
        </div>
      </section>

      {settings.reminderEnabled && shouldShowInsulinBanner() && (
        <section className={`card insulin-banner ${insulinTaken ? 'taken' : ''}`}>
          <div className="insulin-copy">
            <Syringe size={20} />
            <div>
              <strong>{insulinTaken ? 'Insulin taken ✓' : "Don't forget your insulin today 💉"}</strong>
              <p>{insulinTaken ? 'This week is already marked.' : 'A quick tap keeps the weekly log complete.'}</p>
            </div>
          </div>
          {!insulinTaken && (
            <button className="banner-btn" onClick={handleMarkInsulin}>
              Mark as Done
            </button>
          )}
        </section>
      )}

      <section className="card insight-card">
        <div className={`encouragement-card encouragement-${encouragement.tone}`}>
          <span className="encouragement-kicker">A note for today</span>
          <h2>{encouragement.title}</h2>
          <p>{encouragement.body}</p>
        </div>
      </section>

      <section className="card insight-card">
        <h2>Quick Insight</h2>
        <p>{insight}</p>
      </section>

      <BottomSheet
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDate(selectedDay.date) : ''}
      >
        {selectedDay && (
          <div className="day-sheet">
            {selectedDay.count ? (
              readings
                .filter((reading) => toDateKey(reading.loggedAt) === selectedDay.dateKey)
                .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))
                .map((reading) => (
                  <div key={reading.id} className="day-sheet-row">
                    <strong>{reading.mealType === 'post-meal' ? 'Post-Meal' : reading.mealType}</strong>
                    <span>{reading.value} mg/dL</span>
                    <small>{formatTime(reading.loggedAt)}</small>
                  </div>
                ))
            ) : (
              <p className="empty-message">No readings saved for this day yet.</p>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Log Medicine Intake BottomSheet */}
      <BottomSheet
        open={logMedOpen}
        onClose={() => setLogMedOpen(false)}
        title={activeTimelineMed ? `Log Intake: ${activeTimelineMed.name}` : ''}
      >
        {activeTimelineMed && (
          <>
            <div className="form-group" style={{ textCombineUpright: 'left' }}>
              <label>Consumed Time</label>
              <input
                type="time"
                className="form-input"
                value={medLogTime}
                onChange={(e) => setMedLogTime(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Intake Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={medLogNotes}
                onChange={(e) => setMedLogNotes(e.target.value)}
                placeholder="e.g. took with warm water, ate lunch..."
              />
            </div>

            <button className="btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={handleSaveMedLog}>
              Save Medicine Intake Log
            </button>
          </>
        )}
      </BottomSheet>
      <audio ref={audioRef} style={{ display: 'none' }} onEnded={handleSongEnded} />
    </div>
  );
}

export default Dashboard;
