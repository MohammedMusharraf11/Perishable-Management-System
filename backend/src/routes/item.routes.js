import express from 'express';
import {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem
} from '../controllers/item.controller.js';

const router = express.Router();

// Item/Product routes
router.post('/', createItem);           // Create new item
router.get('/', getAllItems);           // Get all items
router.get('/:id', getItemById);        // Get item by ID
router.put('/:id', updateItem);         // Update item
router.delete('/:id', deleteItem);      // Delete item

export default router;
