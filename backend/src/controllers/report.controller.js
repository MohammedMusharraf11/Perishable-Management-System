import { supabase } from '../config/supabaseClient.js';

/**
 * [PMS-T-087] GET /api/reports/waste
 * Generate waste report for a selected date range
 * Query params: startDate, endDate
 */
export const getWasteReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Both startDate and endDate are required' 
      });
    }

    // [PMS-T-088] Query waste_logs table within date range
    let query = supabase
      .from('waste_logs')
      .select(`
        *,
        stock_batches (
          id,
          expiry_date,
          delivery_date
        ),
        items (
          id,
          sku,
          name,
          category,
          base_price
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    const { data: wasteTransactions, error } = await query;

    if (error) {
      console.error('Error fetching waste transactions:', error);
      throw error;
    }

    // [PMS-T-089] Calculate waste aggregations and summaries
    const detailedItems = [];
    let totalItemsWasted = 0;
    let totalQuantity = 0;
    let totalEstimatedLoss = 0;
    const wasteReasons = {};
    const categoryBreakdown = {};
    const dailyWaste = {};

    wasteTransactions.forEach(wasteLog => {
      const item = wasteLog.items;
      const quantity = wasteLog.quantity;
      const loss = wasteLog.estimated_loss || (item ? quantity * item.base_price : 0);
      const reason = wasteLog.waste_reason || 'OTHER';
      const category = item?.category || 'Uncategorized';
      const date = new Date(wasteLog.created_at).toISOString().split('T')[0];

      totalItemsWasted += 1;
      totalQuantity += quantity;
      totalEstimatedLoss += loss;

      // Aggregate by reason
      if (!wasteReasons[reason]) {
        wasteReasons[reason] = { count: 0, quantity: 0, loss: 0 };
      }
      wasteReasons[reason].count += 1;
      wasteReasons[reason].quantity += quantity;
      wasteReasons[reason].loss += loss;

      // Aggregate by category
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, quantity: 0, loss: 0 };
      }
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].quantity += quantity;
      categoryBreakdown[category].loss += loss;

      // Aggregate by date
      if (!dailyWaste[date]) {
        dailyWaste[date] = { count: 0, quantity: 0, loss: 0 };
      }
      dailyWaste[date].count += 1;
      dailyWaste[date].quantity += quantity;
      dailyWaste[date].loss += loss;

      // Add to detailed items list
      detailedItems.push({
        id: wasteLog.id,
        date: wasteLog.created_at,
        sku: item?.sku || 'N/A',
        name: item?.name || 'Unknown Item',
        category: category,
        quantity: quantity,
        reason: reason,
        loss: loss,
        notes: wasteLog.notes,
        batchId: wasteLog.batch_id,
        expiryDate: wasteLog.stock_batches?.expiry_date
      });
    });

    // Convert aggregations to arrays for charts
    const wasteByReason = Object.entries(wasteReasons).map(([reason, data]) => ({
      reason,
      count: data.count,
      quantity: data.quantity,
      loss: data.loss,
      percentage: totalItemsWasted > 0 ? ((data.count / totalItemsWasted) * 100).toFixed(1) : 0
    }));

    const wasteByCategory = Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      count: data.count,
      quantity: data.quantity,
      loss: data.loss,
      percentage: totalItemsWasted > 0 ? ((data.count / totalItemsWasted) * 100).toFixed(1) : 0
    }));

    const wasteTrend = Object.entries(dailyWaste)
      .map(([date, data]) => ({
        date,
        count: data.count,
        quantity: data.quantity,
        loss: data.loss
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Response structure
    res.status(200).json({
      success: true,
      dateRange: {
        startDate,
        endDate
      },
      summary: {
        totalItemsWasted,
        totalQuantity,
        totalEstimatedLoss: parseFloat(totalEstimatedLoss.toFixed(2))
      },
      breakdowns: {
        byReason: wasteByReason,
        byCategory: wasteByCategory,
        trend: wasteTrend
      },
      detailedItems
    });

  } catch (error) {
    console.error('Error generating waste report:', error);
    res.status(500).json({ 
      message: 'Error generating waste report', 
      error: error.message 
    });
  }
};

/**
 * GET /api/reports/summary
 * Get overall summary statistics
 */
export const getSummaryReport = async (req, res) => {
  try {
    // Get total inventory value
    const { data: inventory, error: invError } = await supabase
      .from('v_active_inventory')
      .select('quantity, base_price');

    if (invError) throw invError;

    const totalInventoryValue = inventory.reduce((sum, item) => 
      sum + (item.quantity * item.base_price), 0
    );

    // Get waste stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentWaste, error: wasteError } = await supabase
      .from('waste_logs')
      .select(`
        quantity,
        estimated_loss,
        items (
          base_price
        )
      `)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (wasteError) throw wasteError;

    const wasteValue = recentWaste.reduce((sum, w) => {
      const loss = w.estimated_loss || (w.items?.base_price ? w.quantity * w.items.base_price : 0);
      return sum + loss;
    }, 0);

    res.status(200).json({
      success: true,
      totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
      last30DaysWaste: {
        count: recentWaste.length,
        value: parseFloat(wasteValue.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Error generating summary report:', error);
    res.status(500).json({ 
      message: 'Error generating summary report', 
      error: error.message 
    });
  }
};
