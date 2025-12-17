import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import {
    listDiscounts,
    createDiscount,
    validateDiscount,
    updateDiscount,
    deleteDiscount
} from '../controllers/discountController.js';

const router = express.Router();

router.get('/', authJwt.verifyToken, listDiscounts);
router.post('/', authJwt.verifyToken, createDiscount);
router.get('/validate/:code', authJwt.verifyToken, validateDiscount);
router.put('/:id', authJwt.verifyToken, updateDiscount);
router.delete('/:id', authJwt.verifyToken, deleteDiscount);

export default router;
