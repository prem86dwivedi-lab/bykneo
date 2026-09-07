// Bykneo Admin Operations PWA Notification Utility

export const playNotificationSound = (type = 'default') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';

    if (type === 'kyc') {
      // High-priority double beep
      osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.15); // E6
    } else {
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.12);
    }

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // ignore
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

export const sendPwaNotification = (title, body, tag = 'bykneo-admin-alert') => {
  playNotificationSound('kyc');

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [300, 150, 300],
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
