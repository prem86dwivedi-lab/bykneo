/**
 * Bykneo Web Push Notification Service
 * Uses VAPID (Voluntary Application Server Identification) protocol.
 *
 * VAPID keys are auto-generated once on first run and stored in .env.
 * Drivers subscribe their browser to push; we store those subscriptions
 * and send push payloads whenever a new ride is dispatched to them.
 */

import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ENV_FILE   = path.join(__dirname, '../../.env');

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

// Initialise webpush VAPID config — call once at server startup
export function initPush() {
  const { publicKey, privateKey } = ensureVapidKeys();
  webpush.setVapidDetails(
    'mailto:support@bykneo.com',
    publicKey,
    privateKey
  );
  console.log('✅ [Push] Web Push service ready.');
}

export function getVapidPublicKey() {
  const { publicKey } = ensureVapidKeys();
  return publicKey;
}

// ── Send a push notification to one driver subscription ───────────────────
/**
 * @param {object} subscription  PushSubscription JSON from driver browser
 * @param {object} payload       { title, body, rideId, fare, distance, pickup }
 * @returns {Promise<boolean|'stale'>}
 */
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
    tag:      `ride-${payload.rideId}`,  // collapses duplicate alerts
    requireInteraction: true,            // stays visible until tapped
    vibrate:  [200, 100, 200, 100, 400],
    actions: [
      { action: 'accept', title: '✅ Accept' },
      { action: 'ignore', title: '❌ Ignore'  }
    ]
  });

  try {
    await webpush.sendNotification(subscription, data);
    console.log(`📲 [Push] Sent to …${subscription.endpoint.slice(-20)}`);
    return true;
  } catch (err) {
    // 410 Gone / 404 = subscription expired — caller should purge it
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.warn(`🗑️  [Push] Stale subscription (${err.statusCode})`);
      return 'stale';
    }
    console.error('❌ [Push] sendNotification error:', err.message);
    return false;
  }
}
