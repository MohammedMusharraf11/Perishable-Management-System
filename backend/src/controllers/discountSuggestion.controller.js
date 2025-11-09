import { 
  analyzePricingAndSuggestDiscounts, 
  getPendingDiscountSuggestions 
} from '../services/pricingAlgorithm.service.js';
import { supabase } from '../config/supabaseClient.js';

/**
 * Discount Suggestion Controller
 * Handles API endpoints for discount suggestions
 */

/**
 * GET /api/discount-suggestions/pending
 * Get all pending discount suggestions ranked by revenue impact
 */
export const getPendingSuggestions = async (req, res) => {
  try {
    const result = await getPendingDiscountSuggestions();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch discount suggestions',
        error: result.error
      });
    }

    return res.status(200).json({
      success: true,
      count: result.data?.length || 0,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching pending suggestions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * POST /api/discount-suggestions/analyze
 * Trigger pricing analysis manually
 */
export const triggerPricingAnalysis = async (req, res) => {
  try {
    const result = await analyzePricingAndSuggestDiscounts();
    
    return res.status(200).json({
      success: result.success,
      message: result.success 
        ? 'Pricing analysis completed successfully' 
        : 'Pricing analysis failed',
      stats: result.stats,
      duration: result.duration,
      error: result.error
    });
  } catch (error) {
    console.error('Error triggering pricing analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * PUT /api/discount-suggestions/:id/approve
 * Approve a discount suggestion and apply it to the batch
 */
export const approveSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_discount_percentage } = req.body;
    const userId = req.user?.id; // From auth middleware

    // Validate input
    if (approved_discount_percentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'approved_discount_percentage is required'
      });
    }

    if (approved_discount_percentage < 0 || approved_discount_percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount percentage must be between 0 and 100'
      });
    }

    // Get the suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('discount_suggestions')
      .select('*, stock_batches(*)')
      .eq('id', id)
      .single();

    if (fetchError || !suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Discount suggestion not found'
      });
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve suggestion with status: ${suggestion.status}`
      });
    }

    // Update the suggestion status
    const { error: updateSuggestionError } = await supabase
      .from('discount_suggestions')
      .update({
        status: 'approved',
        approved_discount_percentage,
        approved_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateSuggestionError) throw updateSuggestionError;

    // Apply discount to the batch
    const { error: updateBatchError } = await supabase
      .from('stock_batches')
      .update({
        current_discount_percentage: approved_discount_percentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', suggestion.batch_id);

    if (updateBatchError) throw updateBatchError;

    return res.status(200).json({
      success: true,
      message: 'Discount suggestion approved and applied',
      data: {
        suggestionId: id,
        batchId: suggestion.batch_id,
        approvedDiscount: approved_discount_percentage
      }
    });
  } catch (error) {
    console.error('Error approving suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * PUT /api/discount-suggestions/:id/reject
 * Reject a discount suggestion
 */
export const rejectSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'rejection_reason is required'
      });
    }

    // Get the suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('discount_suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Discount suggestion not found'
      });
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject suggestion with status: ${suggestion.status}`
      });
    }

    // Update the suggestion status
    const { error: updateError } = await supabase
      .from('discount_suggestions')
      .update({
        status: 'rejected',
        rejection_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: 'Discount suggestion rejected',
      data: {
        suggestionId: id,
        rejectionReason: rejection_reason
      }
    });
  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * GET /api/discount-suggestions/stats
 * Get statistics about discount suggestions
 */
export const getSuggestionStats = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('discount_suggestions')
      .select('status, suggested_discount_percentage, estimated_revenue');

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter(s => s.status === 'pending').length,
      approved: data.filter(s => s.status === 'approved').length,
      rejected: data.filter(s => s.status === 'rejected').length,
      expired: data.filter(s => s.status === 'expired').length,
      totalPotentialRevenue: data
        .filter(s => s.status === 'pending')
        .reduce((sum, s) => sum + parseFloat(s.estimated_revenue || 0), 0)
    };

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching suggestion stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
