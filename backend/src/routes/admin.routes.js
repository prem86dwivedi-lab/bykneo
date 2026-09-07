import express from 'express';
import {
  getOverview,
  getDrivers,
  updateDriverKyc,
  getPassengers,
  getPayments,
  getComplaints,
  updateComplaintStatus,
  updateSettings,
  getCities,
  addCity,
  updateCity,
  deleteCity
} from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/overview', getOverview);
router.get('/drivers', getDrivers);
router.post('/drivers/kyc', updateDriverKyc);
router.get('/passengers', getPassengers);
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
