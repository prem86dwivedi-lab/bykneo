// Bykneo Mobile & PWA OS-Level Notification Utility

export const playNotificationSound = (type = 'default') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';

    if (type === 'success') {
      // Upward happy chime (D5 -> A5)
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
    } else {
      // Alert chime (A5 -> D6)
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.12);
    }

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // audio context might be blocked if no user interaction
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {
      // ignore
    }
  }
};

export const sendPwaNotification = (title, body, tag = 'bykneo-notif') => {
  playNotificationSound(title.toLowerCase().includes('approved') ? 'success' : 'default');

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/logo.svg',
            badge: '/favicon.ico',
            vibrate: [250, 100, 250],
            tag
          });
        }).catch(() => {
          new Notification(title, { body, icon: '/favicon.ico', tag });
        });
      } else {
        new Notification(title, { body, icon: '/favicon.ico', tag });
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico', tag });
        }
      });
    }
  }
};
