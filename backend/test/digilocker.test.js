import test from 'node:test';
import assert from 'node:assert/strict';
import { createDigiLockerBundle } from '../src/controllers/driver.controller.js';

test('DigiLocker bundle includes valid field mapping and trusted source metadata', () => {
  const bundle = createDigiLockerBundle({
    id: 'drv_123',
    name: 'Vikram Singh',
    phone: '+91 9876543210'
  });

  assert.equal(bundle.source, 'DIGILOCKER');
  assert.equal(bundle.consent, true);
  assert.equal(bundle.prefill.license_number, 'MP0420230098765');
  assert.equal(bundle.prefill.aadhaar_number, '987654321098');
  assert.equal(bundle.prefill.vehicle_number, 'MP04AB4589');
  assert.equal(bundle.prefill.rc_number, 'MP04RC998877');
});
