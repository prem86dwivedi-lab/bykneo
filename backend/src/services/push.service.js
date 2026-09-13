/**
 * RiderXO Push Notification Service
 * - Web Push (VAPID) for browsers
 * - Firebase Cloud Messaging (FCM) for High-Priority Mobile (Android / iOS) Background Wakeups
 */

import webpush from 'web-push';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ENV_FILE   = path.join(__dirname, '../../.env');

let firebaseApp = null;

// ── Firebase Admin SDK Initialization ─────────────────────────────────────
export function initFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    const backendRoot = path.join(__dirname, '../../');
    const files = fs.readdirSync(backendRoot);
    const serviceAccountFile = files.find(f => (f.includes('firebase-adminsdk') || f.includes('serviceAccountKey')) && f.endsWith('.json'));

    if (serviceAccountFile) {
      const serviceAccountPath = path.join(backendRoot, serviceAccountFile);
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

      if (getApps().length === 0) {
        firebaseApp = initializeApp({
          credential: cert(serviceAccount)
        });
      } else {
        firebaseApp = getApps()[0];
      }
      console.log(`🔥 [Firebase FCM] Initialized successfully with ${serviceAccountFile}`);
    } else {
      console.warn('⚠️  [Firebase FCM] No Firebase service account JSON key found in backend directory.');
    }
  } catch (e) {
    console.error('❌ [Firebase FCM] Initialization error:', e.message);
  }

  return firebaseApp;
}

// ── Auto-generate VAPID keys on first run ─────────────────────────────────
function ensureVapidKeys() {
  let publicKey  = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey  = keys.publicKey;
    privateKey = keys.privateKey;

    try {
      let envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8') : '';
      if (!envContent.includes('VAPID_PUBLIC_KEY')) {
        envContent += `\nVAPID_PUBLIC_KEY=${publicKey}`;
      }
      if (!envContent.includes('VAPID_PRIVATE_KEY')) {
        envContent += `\nVAPID_PRIVATE_KEY=${privateKey}`;
      }
      fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
      console.log('🔑 [Push] VAPID keys auto-generated and saved to .env');
    } catch (e) {
      console.warn('⚠️  [Push] Could not save VAPID keys to .env:', e.message);
    }

    process.env.VAPID_PUBLIC_KEY  = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
  }

  return { publicKey, privateKey };
}

// Initialise webpush VAPID config & Firebase — call once at server startup
export function initPush() {
  const { publicKey, privateKey } = ensureVapidKeys();
  webpush.setVapidDetails(
    'mailto:support@riderxo.in',
    publicKey,
    privateKey
  );
  console.log('✅ [Push] Web Push service ready.');

  initFirebase();
}

export function getVapidPublicKey() {
  const { publicKey } = ensureVapidKeys();
  return publicKey;
}

// ── Send High-Priority FCM Push Notification to Driver Mobile Device ──────
/**
 * @param {string} fcmToken  Driver device registration token
 * @param {object} payload   { title, body, rideId, fare, distance, pickup, drop }
 * @returns {Promise<boolean|'stale'>}
 */
export async function sendFcmPushToDriver(fcmToken, payload) {
  if (!firebaseApp || !fcmToken) return false;

  const title = payload.title || `🚨 NEW RIDE — ₹${payload.fare || 50}`;
  const body  = payload.body  || `📍 ${payload.pickup || 'Nearby'} ➔ 🎯 ${payload.drop || 'Destination'}`;

  const message = {
    token: fcmToken,
    // Android specific high-priority payload that bypasses Doze mode
    android: {
      priority: 'high',
      ttl: 60 * 1000, // 60 seconds TTL
      notification: {
        title: title,
        body: body,
        channelId: 'riderxo_ride_urgent_v3',
        priority: 'max',
        sound: 'default',
        defaultVibrateTimings: true,
        visibility: 'public'
      }
    },
    // Data payload received by MyFirebaseMessagingService in background
    data: {
      action: 'INCOMING_RIDE',
      rideId: String(payload.rideId || ''),
      fare: String(payload.fare || '0'),
      distance: String(payload.distance || '0'),
      pickup: String(payload.pickup || ''),
      drop: String(payload.drop || ''),
      title: String(title),
      body: String(body)
    }
  };

  try {
    const messaging = getMessaging(firebaseApp);
    const response = await messaging.send(message);
    console.log(`🔥 [FCM Push] Sent high-priority wakeup to device: ${response}`);
    return true;
  } catch (err) {
    console.error('❌ [FCM Push] Send failed:', err.message);
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      return 'stale';
    }
    return false;
  }
}

// ── Send Web Push notification to one driver browser subscription ─────────
export async function sendPushToDriver(subscription, payload) {
  if (!subscription || !subscription.endpoint) return false;

  const data = JSON.stringify({
    title:    payload.title    || '🏍️ New Ride Request!',
    body:     payload.body     || 'A rider is waiting nearby. Tap to accept.',
    rideId:   payload.rideId   || '',
    fare:     payload.fare     || 0,
    distance: payload.distance || 0,
    pickup:   payload.pickup   || '',
    icon:     '/favicon.ico',
    badge:    '/favicon.ico',
    tag:      `ride-${payload.rideId}`,
    requireInteraction: true,
    vibrate:  [200, 100, 200, 100, 400],
    actions: [
      { action: 'accept', title: '✅ Accept' },
      { action: 'ignore', title: '❌ Ignore'  }
    ]
  });

  try {
    await webpush.sendNotification(subscription, data);
    console.log(`📲 [Web Push] Sent to …${subscription.endpoint.slice(-20)}`);
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.warn(`🗑️  [Web Push] Stale subscription (${err.statusCode})`);
      return 'stale';
    }
    console.error('❌ [Web Push] sendNotification error:', err.message);
    return false;
  }
}
