import express from 'express';
import {
  estimateFare,
  requestRide,
  getActiveRideForUser,
  getUserRides,
  rateRide,
  cancelRide
} from '../controllers/ride.controller.js';

const router = express.Router();

router.post('/estimate', estimateFare);
router.post('/request', requestRide);
router.get('/active', getActiveRideForUser);
router.get('/history', getUserRides);
router.post('/rate', rateRide);
router.post('/cancel', cancelRide);

export default router;
