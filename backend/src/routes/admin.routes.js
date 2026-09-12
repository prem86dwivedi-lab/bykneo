import express from 'express';
import {
  getOverview,
  getDrivers,
  updateDriverKyc,
  deleteDriver,
  getPassengers,
  deletePassenger,
  purgeDemoData,
  getPayments,
  getComplaints,
  updateComplaintStatus,
  updateSettings,
  getCities,
  addCity,
  updateCity,
  deleteCity,
  adminLogin,
  sendAdminResetOtp,
  verifyAdminResetOtp,
  updateAdminPin
} from '../controllers/admin.controller.js';

const router = express.Router();

// Admin Authentication & SMS Recovery Routes
router.post('/login', adminLogin);
router.post('/send-reset-otp', sendAdminResetOtp);
router.post('/verify-reset-otp', verifyAdminResetOtp);
router.post('/update-pin', updateAdminPin);

router.get('/overview', getOverview);
router.get('/drivers', getDrivers);
router.post('/drivers/kyc', updateDriverKyc);
router.delete('/drivers/:id', deleteDriver);
router.get('/passengers', getPassengers);
router.delete('/passengers/:id', deletePassenger);
router.post('/purge-demo-data', purgeDemoData);
router.get('/payments', getPayments);
router.get('/complaints', getComplaints);
router.post('/complaints/status', updateComplaintStatus);
router.post('/settings', updateSettings);

// City Geofencing & Serviceable Zones
router.get('/cities', getCities);
router.post('/cities', addCity);
router.patch('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);

export default router;


