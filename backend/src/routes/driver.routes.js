import express from 'express';
import {
  toggleOnline,
  updateLocation,
  getEarnings,
  getOnlineDrivers,
  updateKyc
} from '../controllers/driver.controller.js';

const router = express.Router();

router.post('/toggle-online', toggleOnline);
router.post('/update-location', updateLocation);
router.get('/earnings/:driverId', getEarnings);
router.get('/online', getOnlineDrivers);
router.post('/kyc', updateKyc);
router.post('/kyc/submit', updateKyc);

export default router;
