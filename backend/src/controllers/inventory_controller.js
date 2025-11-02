import { supabase } from '../config/supabaseClient.js';
import Joi from 'joi';

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

// Helper function to create audit log
const createAuditLog = async (userId, action, entityType, entityId, oldValues, newValues, ipAddress = null) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// [PMS-T-017] Joi validation schema for adding stock
const addStockSchema = Joi.object({
  sku: Joi.string().required().trim(),
  name: Joi.string().required().trim(),
  category: Joi.string().allow('', null).trim(),
  base_price: Joi.number().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  deliveryDate: Joi.date().iso().required(),
  expiryDate: Joi.date().iso().greater(Joi.ref('deliveryDate')).required(),
  supplier_batch_number: Joi.string().allow('', null).trim()
});

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
 * Adds a new item/batch with validation and audit logging
 */
export const addInventoryBatch = async (req, res) => {
  // [PMS-T-017] Validate request body
  const { error: validationError, value } = addStockSchema.validate(req.body);
  
  if (validationError) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: validationError.details[0].message 
    });
  }

  const { 
    sku, name, category, base_price,
    quantity, deliveryDate, expiryDate, supplier_batch_number 
  } = value;

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
        supplier_batch_number: supplier_batch_number || null,
        status: status,
        created_by: req.user?.id || null
      })
      .select()
      .single();
    
    if (batchError) throw batchError;

    // [PMS-T-021] Create audit log entry
    await createAuditLog(
      req.user?.id,
      'STOCK_ADDED',
      'stock_batches',
      batchData.id,
      null,
      { sku, name, quantity, delivery_date: deliveryDate, expiry_date: expiryDate },
      req.ip
    );

    res.status(201).json(batchData);
  } catch (error) {
    console.error('Supabase error:', error.message);
    res.status(500).json({ message: 'Error adding new item/batch', error: error.message });
  }
};

/**
 * [PMS-T-032] PUT /api/inventory/stock/:batchId
 * Updates quantity with transaction logging
 */
export const updateInventoryQuantity = async (req, res) => {
  const { batchId } = req.params;
  const { quantityChange, reason, notes } = req.body;

  // Validation
  if (!quantityChange || !reason) {
    return res.status(400).json({ message: 'quantityChange and reason are required' });
  }

  const validReasons = ['SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER', 'WASTE'];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({ message: 'Invalid reason. Must be one of: ' + validReasons.join(', ') });
  }

  try {
    // Step 1: Get current batch
    const { data: batch, error: fetchError } = await supabase
      .from('stock_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (fetchError || !batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const previousQuantity = batch.quantity;
    const newQuantity = previousQuantity + parseInt(quantityChange, 10);

    // [PMS-T-034] Validate new quantity doesn't go negative
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    // Step 2: Update stock_batches quantity
    const { data: updatedBatch, error: updateError } = await supabase
      .from('stock_batches')
      .update({ 
        quantity: newQuantity,
        status: newQuantity === 0 ? 'DEPLETED' : batch.status
      })
      .eq('id', batchId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Step 3: [PMS-T-033] Log transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        batch_id: batchId,
        transaction_type: reason,
        quantity_change: parseInt(quantityChange, 10),
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason: reason,
        notes: notes || null,
        created_by: req.user?.id || null
      });

    if (transactionError) throw transactionError;

    // Create audit log
    await createAuditLog(
      req.user?.id,
      'QUANTITY_UPDATED',
      'stock_batches',
      batchId,
      { quantity: previousQuantity },
      { quantity: newQuantity, reason, quantityChange },
      req.ip
    );

    res.status(200).json({
      message: 'Quantity updated successfully',
      data: updatedBatch,
      transaction: {
        previousQuantity,
        newQuantity,
        change: quantityChange
      }
    });
  } catch (error) {
    console.error('Supabase error:', error.message);
    res.status(500).json({ message: 'Error updating quantity', error: error.message });
  }
};

/**
 * DELETE /api/inventory/stock/:id
 * Deletes a stock_batch with audit logging
 */
export const deleteInventoryBatch = async (req, res) => {
  const { id } = req.params; // stock_batches.id (UUID)

  try {
    // Get batch info before deleting for audit log
    const { data: batch } = await supabase
      .from('stock_batches')
      .select('*, items(*)')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('stock_batches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Create audit log
    if (batch) {
      await createAuditLog(
        req.user?.id,
        'STOCK_DELETED',
        'stock_batches',
        id,
        { sku: batch.items?.sku, quantity: batch.quantity },
        null,
        req.ip
      );
    }

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Supabase error:', error.message);
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
};