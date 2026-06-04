import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { toDateKey } from '../../utils/dateHelpers';

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
  const { carePlans, settings, reminders, showToast, updateSettings } = useApp();
  // Store fired alarms in a ref so they persist within the active session lifecycle
  const firedAlarmsRef = useRef({});

  useEffect(() => {
    const checkReminder = async () => {
      const now = new Date();
      const todayKey = toDateKey(now);
      const todayDayName = now.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Mon"
      const nowMs = now.getTime();

      // 1. Standard Daily Exercise Reminder
      if (settings?.reminderEnabled && settings.lastReminderSentDate !== todayKey) {
        const [hours, minutes] = settings.reminderTime.split(':').map(Number);
        const dueTime = new Date(now);
        dueTime.setHours(hours, minutes, 0, 0);

        if (now >= dueTime) {
          const body = getReminderMessage(carePlans);
          showToast('Daily check-in reminder ready ⏰');

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('GlucoTrack Daily Check-in', { body, icon: '/pwa-192x192.png' });
          }
          updateSettings({ lastReminderSentDate: todayKey });
        }
      }

      // 2. Custom Alarms & Pre-reminders (Insulin, Sugar Checks, etc.)
      reminders.forEach((rem) => {
        if (!rem.active || !rem.time) return;

        // Check if repetition matches today (empty day list means repeats everyday)
        const repeatsToday = !rem.days || rem.days.length === 0 || rem.days.includes(todayDayName);
        if (!repeatsToday) return;

        const [hours, minutes] = rem.time.split(':').map(Number);
        const targetTime = new Date(now);
        targetTime.setHours(hours, minutes, 0, 0);
        const targetTimeMs = targetTime.getTime();

        // Calculate helper windows (30m before, 15m before, and exact time)
        const timeDiffMins = (targetTimeMs - nowMs) / (60 * 1000);

        // a. 30 Minutes Before Pre-Alert
        if (rem.preReminders?.includes(30) && timeDiffMins > 28 && timeDiffMins <= 30) {
          const alarmKey = `${rem.id}_30m_${todayKey}`;
          if (!firedAlarmsRef.current[alarmKey]) {
            firedAlarmsRef.current[alarmKey] = true;
            triggerNotification(`Reminder in 30m: ${rem.title}`, `Scheduled at ${rem.time}. Gentle prep reminder.`);
          }
        }

        // b. 15 Minutes Before Pre-Alert
        if (rem.preReminders?.includes(15) && timeDiffMins > 13 && timeDiffMins <= 15) {
          const alarmKey = `${rem.id}_15m_${todayKey}`;
          if (!firedAlarmsRef.current[alarmKey]) {
            firedAlarmsRef.current[alarmKey] = true;
            triggerNotification(`Reminder in 15m: ${rem.title}`, `Scheduled at ${rem.time}. Time to prepare.`);
          }
        }

        // c. Exact Scheduled Time
        if (timeDiffMins <= 0 && timeDiffMins > -15) { // Active within a 15-minute window past scheduled time
          const alarmKey = `${rem.id}_exact_${todayKey}`;
          if (!firedAlarmsRef.current[alarmKey]) {
            firedAlarmsRef.current[alarmKey] = true;
            triggerNotification(`It's time: ${rem.title}`, `Your scheduled alarm for ${rem.time} is due.`);
          }
        }
      });
    };

    const triggerNotification = (title, body) => {
      showToast(title);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/pwa-192x192.png' });
      }
    };

    // Check immediately on render and then set interval to check every 15 seconds for precision
    checkReminder();
    const intervalId = window.setInterval(checkReminder, 15000);
    return () => window.clearInterval(intervalId);
  }, [carePlans, settings, reminders, showToast]);

  return null;
}

export default DailyReminderManager;
