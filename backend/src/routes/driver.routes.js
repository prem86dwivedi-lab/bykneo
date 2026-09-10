import express from 'express';
import {
  toggleOnline,
  updateLocation,
  getEarnings,
  getOnlineDrivers,
  updateKyc,
  getSubscriptionStatus,
  createSubscriptionOrder,
  getOrderStatus,
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/driver.controller.js';

const router = express.Router();

router.post('/toggle-online', toggleOnline);
router.post('/update-location', updateLocation);
router.get('/earnings/:driverId', getEarnings);
router.get('/online', getOnlineDrivers);
router.post('/kyc', updateKyc);
router.post('/kyc/submit', updateKyc);
router.get('/subscription/:driverId', getSubscriptionStatus);
router.post('/subscription/create-order', createSubscriptionOrder);
router.get('/subscription/order-status/:orderId', getOrderStatus);
router.post('/subscription/create-razorpay-order', createRazorpayOrder);
router.post('/subscription/verify-payment', verifyRazorpayPayment);

export default router;

