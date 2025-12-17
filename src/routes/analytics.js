import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import {
    getOverview,
    getSalesTrend,
    getTopProducts,
    getPaymentMethods,
    getSalesHeatmap,
    getLowStock
} from '../controllers/analyticsController.js';

const router = express.Router();

// All routes require authentication
router.use(authJwt.verifyToken);

// GET /api/analytics/overview - General statistics
router.get('/overview', getOverview);

// GET /api/analytics/sales-trend?period=day|week|month - Sales trend
router.get('/sales-trend', getSalesTrend);

// GET /api/analytics/top-products?limit=10 - Top selling products
router.get('/top-products', getTopProducts);

// GET /api/analytics/payment-methods - Payment methods distribution
router.get('/payment-methods', getPaymentMethods);

// GET /api/analytics/sales-heatmap - Sales by hour heatmap
router.get('/sales-heatmap', getSalesHeatmap);

// GET /api/analytics/low-stock - Low stock products
router.get('/low-stock', getLowStock);

export default router;
