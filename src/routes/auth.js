import express from 'express';
import authController from '../controllers/auth.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login); // Paso 1: Login inicial
router.post('/verify-2fa', authController.verify2FA); // Paso 2: Verificar código
router.post('/resend-code', authController.resendCode); // Reenviar código

// Rutas protegidas
router.get('/profile', authJwt.verifyToken, authController.profile);

export default router;