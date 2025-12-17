import express from 'express';
import invoiceController from '../controllers/invoiceController.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// Todas las rutas requieren autenticación
// router.use(authJwt.verifyToken);

// CRUD de facturas
router.post('/', invoiceController.create);
router.get('/', invoiceController.list);
router.get('/:id', invoiceController.getById);

// Acciones sobre facturas
router.post('/:id/send-to-dian', invoiceController.sendToDIAN);
router.post('/:id/cancel', invoiceController.cancel);
router.post('/:id/validate', invoiceController.validate);

// Descargas
router.get('/:id/pdf', invoiceController.downloadPDF);
router.get('/:id/xml', invoiceController.downloadXML);

export default router;