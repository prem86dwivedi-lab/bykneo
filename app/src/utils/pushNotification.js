/**
 * Bykneo Push Notification Utility
 *
 * Called once when a driver goes online.
 * Registers the service worker, requests notification permission,
 * creates a Web Push subscription, and sends it to the backend.
 */

// Convert a Base64URL VAPID public key to a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Register SW, request permission, and subscribe this driver to Web Push.
 *
 * @param {string} driverId   - The driver's DB id
 * @param {string} backendUrl - e.g. http://localhost:5000
 * @returns {Promise<boolean>} - true if subscribed successfully
 */
export async function subscribeToPush(driverId, backendUrl) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Web Push not supported in this browser.');
    return false;
  }

  try {
    // 1. Register / reuse service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('[Push] Service worker ready.');

    // 2. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission denied.');
      return false;
    }

    // 3. Fetch VAPID public key from backend
    const keyRes = await fetch(`${backendUrl}/api/push/vapid-key`);
    const { publicKey } = await keyRes.json();
    if (!publicKey) throw new Error('No VAPID public key from backend');

    // 4. Create or reuse PushSubscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    // 5. Register subscription with backend
    const res = await fetch(`${backendUrl}/api/push/subscribe`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ driverId, subscription: subscription.toJSON() })
    });
    const data = await res.json();

    if (data.success) {
      console.log('[Push] ✅ Driver subscribed to background ride alerts!');
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Push] subscribeToPush error:', err);
    return false;
  }
}

/**
 * Unsubscribe this driver from Web Push (call on logout).
 *
 * @param {string} driverId
 * @param {string} backendUrl
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

/**
 * Listen for messages from the Service Worker (e.g. RIDE_INCOMING when
 * the driver taps the notification while a tab is already open).
 *
 * @param {function} onRideIncoming  - callback({ rideId })
 * @returns {function} cleanup — call to remove the listener
 */
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
