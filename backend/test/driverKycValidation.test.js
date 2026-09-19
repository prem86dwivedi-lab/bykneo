import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDriverKycPayload } from '../src/controllers/driver.controller.js';

test('valid driver KYC payload passes validation', () => {
  const result = validateDriverKycPayload({
    vehicle_number: 'MP04AB4589',
    license_number: 'MP0420230098765',
    rc_number: 'MP04RC998877',
    aadhaar_number: '987654321098',
    dl_photo: 'data:image/jpeg;base64,abc',
    rc_photo: 'data:image/jpeg;base64,abc',
    aadhaar_photo: 'data:image/jpeg;base64,abc',
    selfie_photo: 'data:image/jpeg;base64,abc'
  });

  assert.equal(result.valid, true);
  assert.equal(result.error, null);
});

test('missing or invalid government IDs are rejected', () => {
  const result = validateDriverKycPayload({
    vehicle_number: 'MP04AB4589',
    license_number: 'BAD',
    rc_number: 'MP04RC998877',
    aadhaar_number: '123',
    dl_photo: '',
    rc_photo: 'data:image/jpeg;base64,abc',
    aadhaar_photo: 'data:image/jpeg;base64,abc',
    selfie_photo: 'data:image/jpeg;base64,abc'
  });

  assert.equal(result.valid, false);
  assert.ok(result.error.includes('Driving License') || result.error.includes('Aadhaar') || result.error.includes('required'));
});
