import express from 'express';
import customerController from '../controllers/customerController.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// Todas las rutas requieren autenticación (comentado por ahora)
// router.use(authJwt.verifyToken);

// Búsqueda de clientes
router.get('/search', customerController.searchByDocument);

export default router;
