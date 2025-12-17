import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import {
    listReturns,
    approveReturn,
    rejectReturn
} from '../controllers/saleReturnController.js';

const router = express.Router();

router.get('/', authJwt.verifyToken, listReturns);
router.put('/:id/approve', authJwt.verifyToken, approveReturn);
router.put('/:id/reject', authJwt.verifyToken, rejectReturn);

export default router;
