import test from 'node:test';
import assert from 'node:assert/strict';
import { getSubscriptionStatus } from '../src/controllers/driver.controller.js';
import { db } from '../src/db/index.js';

test('real driver without a pass gets the welcome pass activated automatically', () => {
  const previousSetting = db.data.settings.welcome_offer_enabled;
  const previousDays = db.data.settings.welcome_offer_days;
  const driverId = `drv_test_${Date.now()}`;

  db.data.settings.welcome_offer_enabled = true;
  db.data.settings.welcome_offer_days = 60;

  db.insert('drivers', {
    id: driverId,
    user_id: `usr_test_${Date.now()}`,
    name: 'Test Real Driver',
    phone: '+91 90000 00000',
    vehicle_id: 'bike',
    vehicle_category: 'BIKE',
    vehicle_type_name: 'RiderXO Bike',
    vehicle_model: 'Honda Shine',
    vehicle_number: 'MP04AB1234',
    license_number: 'MP0420230098765',
    is_online: false,
    is_available: false,
    kyc_status: 'pending',
    subscription_expires_at: null,
    is_welcome_pass: false,
    welcome_pass_days: 0,
    rating: 5,
    total_rides: 0,
    today_earnings: 0
  });

  const req = { params: { driverId } };
  const res = {
    json(payload) {
      return payload;
    },
    status() {
      return this;
    }
  };

  const result = getSubscriptionStatus(req, res);

  assert.equal(result.success, true);
  assert.equal(result.is_active, true);
  assert.equal(result.is_welcome_pass, true);
  assert.ok(result.expires_at);
  assert.ok(result.welcome_days_remaining > 0);

  db.data.drivers = db.data.drivers.filter((d) => d.id !== driverId);
  db.data.settings.welcome_offer_enabled = previousSetting;
  db.data.settings.welcome_offer_days = previousDays;
});
