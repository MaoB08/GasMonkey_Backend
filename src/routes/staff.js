import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import { listStaff } from '../controllers/staffController.js';

const router = express.Router();

router.get('/', authJwt.verifyToken, listStaff);

export default router;
