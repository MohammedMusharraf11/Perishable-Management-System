import { supabase } from '../config/supabaseClient.js';

// Helper function
const getStatus = (expiryDate) => {
  if (!expiryDate) return 'ACTIVE';
  const today = new Date();
  const expiry = new Date(expiryDate);
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 3) return 'EXPIRING_SOON';
  return 'ACTIVE';
};

/**
 * [PMS-T-022] GET /api/inventory/stock
 * Queries the 'v_active_inventory' view
 */
export const getInventory = async (req, res) => {
  const { search, status, startDate, endDate, page = 1, limit = 10 } = req.query;

  let query = supabase.from('v_active_inventory').select('*', { count: 'exact' });

  // 1. Search filter
  if (search) {
    query = query.or(`product_name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  // 2. Status filter
  if (status && status !== 'all') {
    const statusMap = {
      'active': 'ACTIVE',
      'expiring-soon': 'EXPIRING_SOON',
      'expired': 'EXPIRED',
    };
    const dbStatus = statusMap[status] || status.toUpperCase();
    query = query.eq('status', dbStatus);
  }

  // 3. Date range filter
  if (startDate) {
    query = query.gte('expiry_date', startDate);
  }
  if (endDate) {
    query = query.lte('expiry_date', endDate);
  }

  // 4. Pagination
  const pageNum = parseInt(page, 10);
  const size = parseInt(limit, 10);
  const from = (pageNum - 1) * size;
  const to = pageNum * size - 1;

  query = query.range(from, to);

  try {
    const { data, error, count } = await query;
    if (error) throw error;
    res.status(200).json({
      data,
      count,
      totalPages: Math.ceil(count / size),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error('Supabase error:', error.message);
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
};

/**
 * POST /api/inventory/stock
 * Adds a new item/batch
 */
export const addInventoryBatch = async (req, res) => {
  const { 
    sku, name, category, base_price,
    quantity, deliveryDate, expiryDate 
  } = req.body;

  if (!sku || !name || !expiryDate || !deliveryDate || !quantity || !base_price) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Step 1: Upsert item
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .upsert({ 
        sku, name, category, 
        base_price: parseFloat(base_price) 
      }, { onConflict: 'sku' })
      .select()
      .single();

    if (itemError) throw itemError;

    // Step 2: Insert batch
    const status = getStatus(expiryDate);
    
    const { data: batchData, error: batchError } = await supabase
      .from('stock_batches')
      .insert({
        item_id: itemData.id,
        quantity: parseInt(quantity, 10),
        delivery_date: deliveryDate,
        expiry_date: expiryDate,
        status: status
      })
      .select()
      .single();
    
    if (batchError) throw batchError;

    res.status(201).json(batchData);
  } catch (error) {
    console.error('Supabase error:', error.message);
    res.status(500).json({ message: 'Error adding new item/batch', error: error.message });
  }
};

/**
 * DELETE /api/inventory/stock/:id
 * Deletes a stock_batch
 */
export const deleteInventoryBatch = async (req, res) => {
  const { id } = req.params; // stock_batches.id (UUID)

  try {
    const { error } = await supabase
      .from('stock_batches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Supabase error:', error.message);
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
};