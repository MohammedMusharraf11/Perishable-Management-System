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

/**
 * [PMS-T-093, PMS-T-094] GET /api/reports/dashboard
 * Get KPI metrics for Manager Dashboard
 * Query params: startDate, endDate (optional, defaults to last 7 days)
 */
export const getDashboardKPIs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 7 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    // KPI 1: Total waste value (this week/selected period)
    const { data: wasteData, error: wasteError } = await supabase
      .from('waste_logs')
      .select(`
        quantity,
        estimated_loss,
        created_at,
        items (
          base_price
        )
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (wasteError) throw wasteError;

    const totalWasteValue = wasteData.reduce((sum, w) => {
      const loss = w.estimated_loss || (w.items?.base_price ? w.quantity * w.items.base_price : 0);
      return sum + loss;
    }, 0);

    // Calculate daily waste trend for charts
    const dailyWasteTrend = {};
    wasteData.forEach(w => {
      const date = new Date(w.created_at).toISOString().split('T')[0];
      const loss = w.estimated_loss || (w.items?.base_price ? w.quantity * w.items.base_price : 0);
      
      if (!dailyWasteTrend[date]) {
        dailyWasteTrend[date] = { date, value: 0, count: 0 };
      }
      dailyWasteTrend[date].value += loss;
      dailyWasteTrend[date].count += 1;
    });

    const wasteTrendArray = Object.values(dailyWasteTrend).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // KPI 2: Items expiring today
    const today = new Date().toISOString().split('T')[0];
    const { data: expiringToday, error: expiringError } = await supabase
      .from('stock_batches')
      .select('id, quantity, item_id')
      .eq('expiry_date', today)
      .in('status', ['ACTIVE', 'EXPIRING_SOON'])
      .gt('quantity', 0);

    if (expiringError) throw expiringError;

    const itemsExpiringToday = expiringToday.length;

    // KPI 3: Active discounts
    const { data: activeDiscounts, error: discountError } = await supabase
      .from('stock_batches')
      .select('id, current_discount_percentage')
      .in('status', ['ACTIVE', 'EXPIRING_SOON'])
      .gt('current_discount_percentage', 0)
      .gt('quantity', 0);

    if (discountError) throw discountError;

    const activeDiscountsCount = activeDiscounts.length;

    // KPI 4: Inventory turnover rate
    // Calculate as: (Cost of Goods Sold / Average Inventory Value)
    // Simplified: Total sales in period / Current inventory value
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('quantity_change, created_at')
      .eq('transaction_type', 'SALE')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (transError) throw transError;

    const totalSalesQuantity = transactions.reduce((sum, t) => 
      sum + Math.abs(t.quantity_change), 0
    );

    const { data: currentInventory, error: invError } = await supabase
      .from('stock_batches')
      .select('quantity')
      .in('status', ['ACTIVE', 'EXPIRING_SOON'])
      .gt('quantity', 0);

    if (invError) throw invError;

    const totalInventoryQuantity = currentInventory.reduce((sum, i) => 
      sum + i.quantity, 0
    );

    const inventoryTurnoverRate = totalInventoryQuantity > 0 
      ? ((totalSalesQuantity / totalInventoryQuantity) * 100).toFixed(1)
      : 0;

    // KPI 5: Revenue from discounts
    // Calculate revenue from discounted items sold
    const { data: discountedSales, error: discSalesError } = await supabase
      .from('transactions')
      .select(`
        quantity_change,
        batch_id,
        stock_batches (
          current_discount_percentage,
          item_id,
          items (
            base_price
          )
        )
      `)
      .eq('transaction_type', 'SALE')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (discSalesError) throw discSalesError;

    const revenueFromDiscounts = discountedSales.reduce((sum, t) => {
      const batch = t.stock_batches;
      if (batch && batch.current_discount_percentage > 0 && batch.items) {
        const discountedPrice = batch.items.base_price * (1 - batch.current_discount_percentage / 100);
        const revenue = Math.abs(t.quantity_change) * discountedPrice;
        return sum + revenue;
      }
      return sum;
    }, 0);

    // Response with all KPIs
    res.status(200).json({
      success: true,
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      kpis: {
        totalWasteValue: parseFloat(totalWasteValue.toFixed(2)),
        itemsExpiringToday,
        activeDiscounts: activeDiscountsCount,
        inventoryTurnoverRate: parseFloat(inventoryTurnoverRate),
        revenueFromDiscounts: parseFloat(revenueFromDiscounts.toFixed(2))
      },
      trends: {
        dailyWaste: wasteTrendArray
      }
    });

  } catch (error) {
    console.error('Error generating dashboard KPIs:', error);
    res.status(500).json({ 
      message: 'Error generating dashboard KPIs', 
      error: error.message 
    });
  }
};
