import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import {
    getTaxConfigurations,
    createTaxConfig,
    updateTaxConfig
} from '../controllers/taxConfigurationController.js';

const router = express.Router();

router.get('/', authJwt.verifyToken, getTaxConfigurations);
router.post('/', authJwt.verifyToken, createTaxConfig);
router.put('/:id', authJwt.verifyToken, updateTaxConfig);

export default router;
