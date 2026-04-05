import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Apple, Clock3, Plus, Search, Trash2 } from 'lucide-react';
import BottomSheet from '../components/shared/BottomSheet';
import ConfirmSheet from '../components/shared/ConfirmSheet';
import { useApp } from '../context/AppContext';
import {
  QUICK_ADD_ITEMS,
  deleteMealEntry,
  saveMealEntry,
} from '../utils/storage';
import {
  addDays,
  formatDate,
  formatRelativeDayLabel,
  formatTime,
  toDateKey,
  toInputDateValue,
  toInputTimeValue,
  combineDateAndTime,
} from '../utils/dateHelpers';
import './Food.css';

const MEAL_META = {
  breakfast: { label: 'Breakfast', icon: '🍳', hint: '7-9 AM' },
  lunch: { label: 'Lunch', icon: '🥗', hint: '12-2 PM' },
  snacks: { label: 'Snacks', icon: '☕', hint: '4-6 PM' },
  dinner: { label: 'Dinner', icon: '🍲', hint: '7-9 PM' },
};

function Food() {
  const location = useLocation();
  const { foodLog, refreshFoodLog, showToast } = useApp();
  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const [activeMeal, setActiveMeal] = useState(location.state?.mealType || null);
  const [search, setSearch] = useState('');
  const [draftItems, setDraftItems] = useState([]);
  const [draftNotes, setDraftNotes] = useState('');
  const [draftTime, setDraftTime] = useState(toInputTimeValue(new Date()));
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const dateMeals = useMemo(
    () => foodLog.filter((entry) => entry.date === selectedDate),
    [foodLog, selectedDate]
  );

  const activeEntry = activeMeal
    ? dateMeals.find((entry) => entry.mealType === activeMeal) || null
    : null;

  useEffect(() => {
    if (!activeMeal) return;
    setDraftItems(activeEntry?.items || []);
    setDraftNotes(activeEntry?.notes || '');
    setDraftTime(activeEntry ? toInputTimeValue(activeEntry.loggedAt) : toInputTimeValue(new Date()));
    setSearch('');
  }, [activeEntry, activeMeal]);

  const filteredChips = activeMeal
    ? QUICK_ADD_ITEMS[activeMeal].filter((item) =>
        item.toLowerCase().includes(search.trim().toLowerCase())
      )
    : [];

  const handleAddItem = (item) => {
    const normalized = item.trim();
    if (!normalized) return;
    if (draftItems.includes(normalized)) return;
    setDraftItems((current) => [...current, normalized].slice(0, 20));
    setSearch('');
  };

  const handleSaveMeal = () => {
    if (!activeMeal || draftItems.length === 0) {
      showToast('Add at least one food item first', 'error');
      return;
    }

    saveMealEntry({
      date: selectedDate,
      mealType: activeMeal,
      items: draftItems,
      notes: draftNotes.trim(),
      loggedAt: combineDateAndTime(selectedDate, draftTime),
    });

    refreshFoodLog();
    showToast('Meal logged ✓');
    setActiveMeal(null);
  };

  const handleDeleteMeal = () => {
    if (!activeEntry) return;
    deleteMealEntry(activeEntry.id);
    refreshFoodLog();
    showToast('Meal removed');
    setConfirmDeleteOpen(false);
    setActiveMeal(null);
  };

  return (
    <div className="page food-page">
      <header className="food-header">
        <div>
          <p className="section-eyebrow">Meal journal</p>
          <h1>Food Log</h1>
          <p className="subtitle">{formatDate(selectedDate)}</p>
        </div>
      </header>

      <section className="date-strip">
        <button
          className={`date-pill ${selectedDate === toDateKey() ? 'active' : ''}`}
          onClick={() => setSelectedDate(toDateKey())}
        >
          Today
        </button>
        <button
          className={`date-pill ${selectedDate === toDateKey(addDays(new Date(), -1)) ? 'active' : ''}`}
          onClick={() => setSelectedDate(toDateKey(addDays(new Date(), -1)))}
        >
          Yesterday
        </button>
        <label className="date-picker-pill">
          <span>{formatRelativeDayLabel(selectedDate)}</span>
          <input
            type="date"
            value={toInputDateValue(selectedDate)}
            min={toDateKey(addDays(new Date(), -30))}
            max={toDateKey()}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </section>

      <section className="meal-list">
        {Object.entries(MEAL_META).map(([mealType, meta]) => {
          const entry = dateMeals.find((item) => item.mealType === mealType);
          return (
            <button
              key={mealType}
              className={`meal-card ${entry ? 'logged' : 'empty'}`}
              onClick={() => setActiveMeal(mealType)}
            >
              <div className="meal-card-top">
                <div>
                  <div className="meal-card-title">
                    <span>{meta.icon}</span>
                    <strong>{meta.label}</strong>
                  </div>
                  <span className="meal-hint">{meta.hint}</span>
                </div>
                <span className="meal-status">{entry ? '✓ Logged' : '+ Add'}</span>
              </div>
              {entry ? (
                <div className="meal-item-list">
                  {entry.items.map((item) => (
                    <span key={item} className="mini-chip">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="meal-empty-copy">Add what you had</p>
              )}
            </button>
          );
        })}
      </section>

      <BottomSheet
        open={Boolean(activeMeal)}
        onClose={() => setActiveMeal(null)}
        title={activeMeal ? MEAL_META[activeMeal].label : ''}
      >
        {activeMeal && (
          <>
            <div className="sheet-time-row">
              <div className="time-chip">
                <Clock3 size={16} />
                <span>{draftTime ? formatTime(combineDateAndTime(selectedDate, draftTime)) : '--'}</span>
              </div>
              <input
                type="time"
                className="time-input"
                value={draftTime}
                onChange={(event) => setDraftTime(event.target.value)}
              />
            </div>

            <div className="sheet-search">
              <Search size={18} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search or type a food..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddItem(search);
                  }
                }}
              />
              <button className="add-custom-btn" onClick={() => handleAddItem(search)} aria-label="Add custom item">
                <Plus size={18} />
              </button>
            </div>

            <div className="quick-chip-wrap">
              {filteredChips.map((item) => (
                <button key={item} className="quick-chip" onClick={() => handleAddItem(item)}>
                  {item}
                </button>
              ))}
            </div>

            <div>
              <p className="sheet-subtitle">Added items</p>
              {draftItems.length === 0 ? (
                <p className="sheet-helper">Tap the foods she had, or type your own.</p>
              ) : (
                <div className="added-chip-wrap">
                  {draftItems.map((item) => (
                    <button
                      key={item}
                      className="added-chip"
                      onClick={() => setDraftItems((current) => current.filter((entry) => entry !== item))}
                    >
                      {item} <span>×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="notes-stack">
              <p className="sheet-subtitle">Notes</p>
              <textarea
                className="food-notes"
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                placeholder="Small bowl, less rice, had tea later..."
                maxLength={200}
              />
            </div>

            <button className="btn-primary" onClick={handleSaveMeal}>
              Save {MEAL_META[activeMeal].label}
            </button>
            {activeEntry && (
              <button className="danger-link" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 size={16} /> Remove this meal
              </button>
            )}
          </>
        )}
      </BottomSheet>
      <ConfirmSheet
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteMeal}
        title="Remove this food entry?"
        description="This will remove the meal for that day. You can always add it again later."
        confirmLabel="Remove meal"
      />
    </div>
  );
}

export default Food;
