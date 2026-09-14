import express from 'express';
import {
  estimateFare,
  requestRide,
  getActiveRideForUser,
  getPendingRequestsForDriver,
  getUserRides,
  rateRide,
  cancelRide,
  acceptRide,
  getRideById,
  getRideMessages,
  sendRideMessage
} from '../controllers/ride.controller.js';

const router = express.Router();

router.post('/estimate', estimateFare);
router.post('/request', requestRide);
router.post('/accept', acceptRide);
router.get('/active', getActiveRideForUser);
router.get('/pending-request', getPendingRequestsForDriver);
router.get('/history', getUserRides);
router.post('/rate', rateRide);
router.post('/cancel', cancelRide);
router.get('/:id/messages', getRideMessages);
router.post('/:id/messages', sendRideMessage);
router.get('/:id', getRideById);

export default router;
