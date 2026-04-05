import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { toDateKey } from '../../utils/dateHelpers';
import { updateSettings } from '../../utils/storage';

function getReminderMessage(carePlans) {
  const entries = Object.entries(carePlans?.exercisePlans || {})
    .filter(([, text]) => text.trim())
    .map(([key, text]) => `${key.replace(/([A-Z])/g, ' $1')}: ${text.split('\n')[0]}`);

  if (!entries.length) {
    return 'Time for your gentle movement and breathing check-in.';
  }

  return `Reminder: ${entries.slice(0, 2).join(' • ')}`;
}

function DailyReminderManager() {
  const { carePlans, settings, showToast, refreshSettings } = useApp();

  useEffect(() => {
    if (!settings?.reminderEnabled) return undefined;

    const checkReminder = async () => {
      const now = new Date();
      const todayKey = toDateKey(now);
      if (settings.lastReminderSentDate === todayKey) return;

      const [hours, minutes] = settings.reminderTime.split(':').map(Number);
      const dueTime = new Date(now);
      dueTime.setHours(hours, minutes, 0, 0);
      if (now < dueTime) return;

      const body = getReminderMessage(carePlans);
      showToast('Gentle reminder ready');

      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('GlucoTrack reminder', { body });
        }
      }

      updateSettings({ lastReminderSentDate: todayKey });
      refreshSettings();
    };

    checkReminder();
    const intervalId = window.setInterval(checkReminder, 60000);
    return () => window.clearInterval(intervalId);
  }, [carePlans, refreshSettings, settings, showToast]);

  return null;
}

export default DailyReminderManager;
