// Bykneo Mobile & PWA OS-Level High-Priority Notification Utility
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';

export const DriverKeepAlive = registerPlugin('DriverKeepAlive');

const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

// 1. Initialize High-Importance Android Notification Channels & Action Types
export const initNotificationChannels = async () => {
  if (!isNativeAndroid) return;
  try {
    // Register Action Buttons (Accept / Reject directly from notification banner)
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'OPEN_RIDE_REQUEST',
          actions: [
            {
              id: 'accept',
              title: '⚡ ACCEPT RIDE',
              foreground: true
            },
            {
              id: 'reject',
              title: '❌ DECLINE',
              destructive: true,
              foreground: false
            }
          ]
        }
      ]
    });

    // High-Priority Ride Request Alert Channel (Loud, vibrating, heads-up banner over all apps)
    await LocalNotifications.createChannel({
      id: 'bykneo-ride-urgent-v3',
      name: '🚨 Urgent Ride Requests',
      description: 'Loud high-priority sound & banner alerts for incoming ride requests',
      importance: 5, // IMPORTANCE_HIGH / MAX (pops up over WhatsApp, Facebook, etc.)
      visibility: 1, // VISIBILITY_PUBLIC
      vibration: true,
      lights: true,
      lightColor: '#FFB800'
    });

    // General Updates & Ongoing Duty Channel
    await LocalNotifications.createChannel({
      id: 'bykneo-general',
      name: 'Bykneo Status & Notifications',
      description: 'Active shift status, trip updates, and wallet alerts',
      importance: 3,
      visibility: 1,
      vibration: false,
      lights: false
    });
  } catch (e) {
    console.warn('Could not initialize Android notification channels:', e);
  }
};

// Sticky Ongoing Foreground Service to keep Driver Process Alive in Background (even screen-off Doze Mode)
export const showDriverOnlineNotification = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await DriverKeepAlive.startService();
    } catch (e) {
      console.warn('DriverKeepAlive.startService error:', e);
    }
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 888888,
            title: '🟢 Bykneo Captain is ONLINE',
            body: 'Active and searching for nearby ride bookings',
            channelId: 'bykneo-general',
            ongoing: true,
            autoCancel: false,
            smallIcon: 'ic_launcher'
          }
        ]
      });
    } catch (e) {}
  }
};

export const clearDriverOnlineNotification = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await DriverKeepAlive.stopService();
    } catch (e) {
      console.warn('DriverKeepAlive.stopService error:', e);
    }
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: 888888 }]
      });
    } catch (e) {}
  }
};

// 2. Request Notification Permissions (Native Android 13+ & Web)
export const requestNotificationPermission = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
      await initNotificationChannels();
      return;
    }
  } catch (e) {
    console.warn('Native notification permission error:', e);
  }

  // Web / PWA fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {
      // ignore
    }
  }
};

// 3. Synthesize In-App Audio Chime (Foreground Only)
export const playNotificationSound = (type = 'default') => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';

    if (type === 'ride_alert') {
      // Urgent siren dual-tone (880Hz -> 1175Hz)
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1175, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      return;
    }

    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
    } else {
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.12);
    }

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // audio context might be blocked if backgrounded
  }
};

// Helper to convert string IDs to positive 32-bit integer for LocalNotifications
const getNotificationId = (str) => {
  if (!str) return Math.floor(Math.random() * 900000) + 100000;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 1000000;
};

// 4. Send High-Priority Native Android Ride Request Notification (Heads-up over all apps)
export const sendRideAlertNotification = async (ride) => {
  if (!ride) return;

  const notifId = getNotificationId(ride.id || ride._id || `ride_${Date.now()}`);
  const title = `🚨 NEW RIDE: ₹${ride.fare || 50} (${ride.vehicle_name || 'Ride'})`;
  const pickupShort = ride.pickup_name?.split(',')[0] || 'Pickup Location';
  const dropShort = ride.drop_name?.split(',')[0] || 'Drop Destination';
  const distText = ride.distance_km ? ` • ${ride.distance_km} km` : '';
  const body = `📍 ${pickupShort} ➔ 🎯 ${dropShort}${distText}\n⚡ Tap immediately to Accept before timer ends!`;

  // Native Android Alert & Screen Wakeup
  if (Capacitor.isNativePlatform()) {
    try {
      await DriverKeepAlive.triggerRideAlert({
        rideId: ride.id || ride._id,
        title,
        body
      });
    } catch (e) {
      console.warn('DriverKeepAlive.triggerRideAlert error:', e);
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            channelId: 'bykneo-ride-urgent-v3',
            smallIcon: 'ic_launcher',
            largeIcon: 'ic_launcher',
            actionTypeId: 'OPEN_RIDE_REQUEST',
            autoCancel: true,
            extra: {
              rideId: ride.id || ride._id,
              type: 'INCOMING_RIDE'
            }
          }
        ]
      });
      return;
    } catch (e) {
      console.warn('Native LocalNotification schedule error:', e);
    }
  }

  // In-app vibration & sound fallback for Web / PWA
  playNotificationSound('ride_alert');
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([400, 150, 400, 150, 400, 150, 400]);
    } catch (e) {}
  }

  // Web / PWA Notification Fallback
  sendPwaNotification(title, body, `ride-${ride.id}`);
};

// 5. Cancel Native Ride Notification (when ride is accepted/rejected or expired)
export const cancelRideAlertNotification = async (rideId) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await DriverKeepAlive.stopRideAlert();
    } catch (e) {}
    if (rideId) {
      const notifId = getNotificationId(rideId);
      try {
        await LocalNotifications.cancel({
          notifications: [{ id: notifId }]
        });
      } catch (e) {}
    }
  }
};

// 6. Generic PWA Notification
export const sendPwaNotification = (title, body, tag = 'bykneo-notif') => {
  playNotificationSound(title.toLowerCase().includes('approved') ? 'success' : 'default');

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              vibrate: [350, 150, 350, 150, 350],
              tag
            });
          })
          .catch(() => {
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
