import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import {
    createSale,
    listSales,
    getSaleById,
    addPayment,
    generateInvoice
} from '../controllers/saleController.js';

const router = express.Router();

// Crear nueva venta
router.post('/', authJwt.verifyToken, createSale);

// Listar ventas con filtros
router.get('/', authJwt.verifyToken, listSales);

// Obtener detalle de venta
router.get('/:id', authJwt.verifyToken, getSaleById);

// Agregar pago a venta APARTADO/CREDIT
router.put('/:id/payment', authJwt.verifyToken, addPayment);

// Generar factura
router.get('/:id/invoice', authJwt.verifyToken, generateInvoice);

export default router;
