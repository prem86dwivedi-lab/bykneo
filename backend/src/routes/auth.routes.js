import express from 'express';
import {
  sendOtp,
  resendOtp,
  verifyOtp,
  completeProfile,
  quickDemoLogin,
  switchRole,
  getDemoAccounts
} from '../controllers/auth.controller.js';

const router = express.Router();

// Real MSG91 OTP Authentication Flow
router.post('/send-otp', sendOtp);
router.post('/resend-otp', resendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-profile', completeProfile);

// Demo / Instant Login
router.post('/login', quickDemoLogin);
router.post('/demo-login', quickDemoLogin);
router.post('/switch-role', switchRole);
router.get('/demo-accounts', getDemoAccounts);

export default router;
