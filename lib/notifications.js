'use client';

// Register service worker
export async function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('SW registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Show immediate notification
export function showNotification(title, body, tag = 'riviera') {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body,
      icon: '/icon-192.png',
      tag,
      vibrate: [200, 100, 200],
    });
  }).catch(() => {
    // Fallback to basic Notification
    new Notification(title, { body, icon: '/icon-192.png' });
  });
}

// Schedule a notification at a specific time today
export function scheduleNotificationAt(hour, minute, title, body, tag) {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // If time already passed today, skip
  if (target <= now) return;

  const delay = target - now;

  navigator.serviceWorker.ready.then(reg => {
    reg.active?.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      title, body, delay, tag,
    });
  });

  // Also use setTimeout as fallback
  setTimeout(() => {
    showNotification(title, body, tag);
  }, delay);
}

// Schedule all daily reminders
export function scheduleDailyReminders(medsTaken = false) {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const h = now.getHours();

  // Oli Medikamente: 11:11 Uhr (und alle 15 Min bis abgehakt)
  if (!medsTaken && h < 11) {
    scheduleNotificationAt(10, 45, '💊 Medikamente in 30 Min!', 'Bupropion + Tafil müssen bis 11:11 eingenommen werden. Nicht vergessen!', 'meds-warning');
    scheduleNotificationAt(11, 0, '💊 Medikamente in 11 Min!', 'Letzte Erinnerung! Bupropion + Tafil jetzt nehmen.', 'meds-urgent');
    scheduleNotificationAt(11, 11, '💊 JETZT Medikamente nehmen!', 'Bupropion 150mg + Tafil 0,5mg — Zeit ist 11:11 🕐', 'meds-now');
  }

  // Amitriptylin abends
  scheduleNotificationAt(18, 30, '🌙 Amitriptylin', 'Oli: Amitriptylin 25mg jetzt nehmen (18:00-20:00 Uhr)', 'amit');

  // Wasser-Erinnerung
  if (h < 9) scheduleNotificationAt(9, 0, '💧 Wasser trinken!', 'Hast du heute schon 0,5L Wasser getrunken? Starte deinen Tag!', 'wasser');

  // Gassi-Erinnerung mittags
  scheduleNotificationAt(12, 0, '🐾 Gassi-Zeit!', 'Chico & Sunny warten — Mittagsgassi ist dran!', 'gassi-mittag');

  // Gassi abends
  scheduleNotificationAt(18, 15, '🐾 Abend-Gassi', 'Chico & Sunny brauchen ihre Abendrunde!', 'gassi-abend');

  // Screen-free Erinnerung
  scheduleNotificationAt(20, 45, '📵 Screen-free Zeit!', 'Ab 21h: Handy weg, Quality Time mit Oli/Tanja 💑', 'screenfree');

  // No-Carb Erinnerung
  scheduleNotificationAt(15, 45, '🚫 No-Carb Reminder', 'Ab 16h: keine Kohlenhydrate mehr! Protein + Gemüse statt Carbs.', 'nocarb');
}

// Check if meds are overdue and show repeat notification
export function checkMedsOverdue(medsTaken) {
  if (typeof window === 'undefined') return;
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();

  // After 11:11 if not taken — show urgent notification
  if (!medsTaken && h >= 11 && m >= 11) {
    showNotification(
      '🔴 Medikamente VERGESSEN!',
      'Bupropion + Tafil wurden noch nicht eingenommen! Bitte sofort nachholen.',
      'meds-overdue'
    );
  }
}
