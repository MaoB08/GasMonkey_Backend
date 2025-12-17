import express from 'express';
import clientController from '../controllers/clientController.js';

const router = express.Router();

// Client routes
router.get('/search', clientController.searchByDocument); // Must be before /:id
router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
