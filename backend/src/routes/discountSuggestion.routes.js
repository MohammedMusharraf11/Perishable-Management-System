import express from 'express';
import {
  getPendingSuggestions,
  getApprovedSuggestions,
  triggerPricingAnalysis,
  approveSuggestion,
  rejectSuggestion,
  getSuggestionStats
} from '../controllers/discountSuggestion.controller.js';

const router = express.Router();

/**
 * Discount Suggestion Routes
 * Base path: /api/discount-suggestions
 */

// GET /api/discount-suggestions/pending - Get all pending suggestions
router.get('/pending', getPendingSuggestions);

// GET /api/discount-suggestions/approved - Get all approved suggestions
router.get('/approved', getApprovedSuggestions);

// GET /api/discount-suggestions/stats - Get suggestion statistics
router.get('/stats', getSuggestionStats);

// POST /api/discount-suggestions/analyze - Trigger pricing analysis manually
router.post('/analyze', triggerPricingAnalysis);

// PUT /api/discount-suggestions/:id/approve - Approve a suggestion
router.put('/:id/approve', approveSuggestion);

// PUT /api/discount-suggestions/:id/reject - Reject a suggestion
router.put('/:id/reject', rejectSuggestion);

export default router;
