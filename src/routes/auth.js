import express from 'express';
import authController from '../controllers/auth.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas
router.get('/profile', authJwt.verifyToken, authController.profile);

export default router;