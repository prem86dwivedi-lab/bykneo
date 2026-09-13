/**
 * RiderXO Push Notification Utility
 *
 * Supports both:
 * 1. Native Mobile FCM Push (Android / iOS via Capacitor & Firebase Messaging)
 * 2. Web Push (Service Worker + VAPID for desktop/mobile browsers)
 */

import { Capacitor } from '@capacitor/core';
import { DriverKeepAlive } from './notification.js';

// Convert a Base64URL VAPID public key to a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Register push notifications (Native FCM on mobile APK, Web Push in browser)
 *
 * @param {string} driverId   - The driver's DB id
 * @param {string} backendUrl - e.g. http://localhost:5000
 * @returns {Promise<boolean>}
 */
export async function subscribeToPush(driverId, backendUrl) {
  if (!driverId || !backendUrl) return false;

  // 1. Native Mobile (Capacitor / Android APK) -> Firebase Cloud Messaging (FCM)
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('📱 [Push] Registering native FCM token for driver:', driverId);
      const res = await DriverKeepAlive.getFcmToken();
      const fcmToken = res?.token;

      if (fcmToken) {
        console.log('🔥 [Push] Native FCM token obtained:', fcmToken.slice(0, 15) + '...');
        const apiRes = await fetch(`${backendUrl}/api/push/register-fcm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId,
            fcmToken,
            platform: Capacitor.getPlatform()
          })
        });
        const result = await apiRes.json();
        if (result.success) {
          console.log('✅ [Push] FCM Token successfully registered with backend server!');
          return true;
        }
      }
    } catch (e) {
      console.warn('⚠️ [Push] Native FCM registration failed, will try Web Push fallback:', e);
    }
  }

  // 2. Web Browser / PWA -> Service Worker + VAPID Web Push
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Web Push not supported in this environment.');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('[Push] Service worker ready.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission denied.');
      return false;
    }

    const keyRes = await fetch(`${backendUrl}/api/push/vapid-key`);
    const { publicKey } = await keyRes.json();
    if (!publicKey) throw new Error('No VAPID public key from backend');

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    const res = await fetch(`${backendUrl}/api/push/subscribe`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ driverId, subscription: subscription.toJSON() })
    });
    const data = await res.json();

    if (data.success) {
      console.log('[Push] ✅ Driver subscribed to Web Push ride alerts!');
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Push] subscribeToPush error:', err);
    return false;
  }
}

/**
 * Unsubscribe this driver from push notifications (call on logout / offline).
 */
export async function unsubscribeFromPush(driverId, backendUrl) {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }
    await fetch(`${backendUrl}/api/push/unsubscribe`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ driverId })
    });
    console.log('[Push] Driver unsubscribed from push notifications.');
  } catch (err) {
    console.warn('[Push] unsubscribeFromPush error:', err);
  }
}

export function listenForSwMessages(onRideIncoming) {
  if (!('serviceWorker' in navigator)) return () => {};

  const handler = (event) => {
    if (event.data?.type === 'RIDE_INCOMING') {
      onRideIncoming({ rideId: event.data.rideId });
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
