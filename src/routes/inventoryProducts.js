import express from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    previewProductCode
} from '../controllers/inventoryProductController.js';

const router = express.Router();

// Rutas de productos de inventario
router.get('/', getAllProducts);
router.get('/preview-code', previewProductCode); // Debe ir antes de /:id
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
