import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import {
    listPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
} from '../controllers/paymentMethodController.js';

const router = express.Router();

router.get('/', authJwt.verifyToken, listPaymentMethods);
router.post('/', authJwt.verifyToken, createPaymentMethod);
router.put('/:id', authJwt.verifyToken, updatePaymentMethod);
router.delete('/:id', authJwt.verifyToken, deletePaymentMethod);

export default router;
