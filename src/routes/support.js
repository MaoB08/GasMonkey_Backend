import express from 'express';
import { sendSupportMessage } from '../controllers/supportController.js';

const router = express.Router();

/**
 * POST /api/support/send
 * Envía un mensaje de soporte por email
 */
router.post('/send', sendSupportMessage);

export default router;
