import express from 'express';
import cityController from '../controllers/cityController.js';

const router = express.Router();

// Get all cities
router.get('/', cityController.getAllCities);

export default router;
