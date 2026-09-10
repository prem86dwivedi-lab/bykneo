import express from 'express';
import { getVapidPublicKey } from '../services/push.service.js';
import { db } from '../db/index.js';

const router = express.Router();

// GET /api/push/vapid-key  — frontend fetches this to subscribe
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// POST /api/push/subscribe  — driver registers their PushSubscription
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

  console.log(`📋 [Push] Driver ${driverId} subscribed to push notifications`);
  return res.json({ success: true });
});

// DELETE /api/push/unsubscribe — driver logs out / uninstalls
router.delete('/unsubscribe', (req, res) => {
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ success: false });

  const existing = db.find('push_subscriptions', s => s.driver_id === driverId);
  if (existing) {
    db.delete('push_subscriptions', existing.id);
  }
  return res.json({ success: true });
});

export default router;
