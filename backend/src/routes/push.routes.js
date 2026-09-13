import express from 'express';
import { getVapidPublicKey } from '../services/push.service.js';
import { db } from '../db/index.js';

const router = express.Router();

// GET /api/push/vapid-key — frontend fetches this to subscribe to Web Push
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// POST /api/push/register-fcm — mobile device registers its FCM token
// Body: { driverId, fcmToken, platform }
router.post('/register-fcm', (req, res) => {
  const { driverId, fcmToken, platform } = req.body;

  if (!driverId || !fcmToken) {
    return res.status(400).json({ success: false, error: 'driverId and fcmToken are required' });
  }

  // 1. Update driver record directly
  const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);
  if (driver) {
    db.update('drivers', driver.id, {
      fcm_token: fcmToken,
      device_platform: platform || 'android',
      fcm_updated_at: new Date().toISOString()
    });
  }

  // 2. Upsert into fcm_tokens collection
  const existing = db.find('fcm_tokens', t => t.driver_id === driverId);
  if (existing) {
    db.update('fcm_tokens', existing.id, {
      token: fcmToken,
      platform: platform || 'android',
      updated_at: new Date().toISOString()
    });
  } else {
    db.insert('fcm_tokens', {
      id: `fcm_${driverId}`,
      driver_id: driverId,
      token: fcmToken,
      platform: platform || 'android',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  console.log(`🔥 [FCM] Driver ${driverId} registered mobile FCM token: ${fcmToken.slice(0, 15)}...`);
  return res.json({ success: true, message: 'FCM token registered successfully' });
});

// POST /api/push/subscribe — driver registers their Web PushSubscription
// Body: { driverId, subscription }
router.post('/subscribe', (req, res) => {
  const { driverId, subscription } = req.body;

  if (!driverId || !subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, error: 'driverId and subscription are required' });
  }

  // Upsert: one active subscription per driver
  const existing = db.find('push_subscriptions', s => s.driver_id === driverId);
  if (existing) {
    db.update('push_subscriptions', existing.id, {
      subscription,
      updated_at: new Date().toISOString()
    });
  } else {
    db.insert('push_subscriptions', {
      id:           `psub_${driverId}`,
      driver_id:    driverId,
      subscription,
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString()
    });
  }

  console.log(`📋 [Push] Driver ${driverId} subscribed to web push notifications`);
  return res.json({ success: true });
});

// DELETE /api/push/unsubscribe — driver logs out / uninstalls
router.delete('/unsubscribe', (req, res) => {
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ success: false });

  const existingWeb = db.find('push_subscriptions', s => s.driver_id === driverId);
  if (existingWeb) {
    db.delete('push_subscriptions', existingWeb.id);
  }

  const existingFcm = db.find('fcm_tokens', t => t.driver_id === driverId);
  if (existingFcm) {
    db.delete('fcm_tokens', existingFcm.id);
  }

  const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);
  if (driver) {
    db.update('drivers', driver.id, { fcm_token: null });
  }

  return res.json({ success: true });
});

export default router;
