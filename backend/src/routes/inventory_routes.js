import express from 'express';
import {
  getInventory,
  addInventoryBatch,
  deleteInventoryBatch
} from '../controllers/inventory_controller.js'; // Import from the new controller

const router = express.Router();

// [PMS-T-022] GET /api/inventory/stock
router.get('/stock', getInventory);

// POST /api/inventory/stock
router.post('/stock', addInventoryBatch);

// DELETE /api/inventory/stock/:id
router.delete('/stock/:id', deleteInventoryBatch);

export default router;