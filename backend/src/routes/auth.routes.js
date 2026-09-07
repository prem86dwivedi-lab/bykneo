import express from 'express';
import { login, switchRole, getDemoAccounts } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', login);
router.post('/switch-role', switchRole);
router.get('/demo-accounts', getDemoAccounts);

export default router;
