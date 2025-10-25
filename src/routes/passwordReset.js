import express from 'express';
import passwordResetController from '../controllers/passwordReset.js';

const router = express.Router();

router.post('/request-reset', passwordResetController.requestReset);
router.post('/verify-code', passwordResetController.verifyCode);
router.post('/reset-password', passwordResetController.resetPassword);
router.post('/resend-code', passwordResetController.resendCode);

export default router;