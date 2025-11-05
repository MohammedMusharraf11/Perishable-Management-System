import { supabase } from "../config/supabaseClient.js";
import Joi from "joi";

// --------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------

// [PMS-T-016] Status calculation
const getStatus = (expiryDate) => {
  if (!expiryDate) return "ACTIVE";
  const today = new Date();
  const expiry = new Date(expiryDate);
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= 3) return "EXPIRING_SOON";
  return "ACTIVE";
};

// [PMS-T-021] Helper for audit logging
const createAuditLog = async (
  userId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  ipAddress = null
) => {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to create audit log:", error.message);
  }
};

// --------------------------------------------
// [PMS-T-017] Joi validation for new stock
// --------------------------------------------
const addStockSchema = Joi.object({
  sku: Joi.string().required().trim(),
  name: Joi.string().required().trim(),
  category: Joi.string().allow("", null).trim(),
  base_price: Joi.number().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  deliveryDate: Joi.date().iso().required(),
  expiryDate: Joi.date().iso().greater(Joi.ref("deliveryDate")).required(),
  supplier_batch_number: Joi.string().allow("", null).trim(),
});

// --------------------------------------------
// [PMS-T-022] GET /api/inventory/stock
// --------------------------------------------
export const getInventory = async (req, res) => {
  const { search, status, startDate, endDate, page = 1, limit = 10 } = req.query;

  let query = supabase.from("v_active_inventory").select("*", { count: "exact" });

  if (search) query = query.or(`product_name.ilike.%${search}%,sku.ilike.%${search}%`);

  if (status && status !== "all") {
    const statusMap = {
      active: "ACTIVE",
      "expiring-soon": "EXPIRING_SOON",
      expired: "EXPIRED",
    };
    query = query.eq("status", statusMap[status] || status.toUpperCase());
  }

  if (startDate) query = query.gte("expiry_date", startDate);
  if (endDate) query = query.lte("expiry_date", endDate);

  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = parseInt(page) * parseInt(limit) - 1;
  query = query.range(from, to);

  try {
    const { data, error, count } = await query;
    if (error) throw error;
    res.status(200).json({
      data,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Supabase error:", error.message);
    res.status(500).json({ message: "Error fetching inventory", error: error.message });
  }
};

// --------------------------------------------
// [PMS-T-020] POST /api/inventory/stock
// --------------------------------------------
export const addInventoryBatch = async (req, res) => {
  const { error: validationError, value } = addStockSchema.validate(req.body);
  if (validationError)
    return res.status(400).json({ message: "Validation error", details: validationError.details[0].message });

  const { sku, name, category, base_price, quantity, deliveryDate, expiryDate, supplier_batch_number } = value;

  try {
    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .upsert({ sku, name, category, base_price: parseFloat(base_price) }, { onConflict: "sku" })
      .select()
      .single();
    if (itemError) throw itemError;

    const status = getStatus(expiryDate);

    const { data: batchData, error: batchError } = await supabase
      .from("stock_batches")
      .insert({
        item_id: itemData.id,
        quantity: parseInt(quantity, 10),
        delivery_date: deliveryDate,
        expiry_date: expiryDate,
        supplier_batch_number: supplier_batch_number || null,
        status,
        created_by: req.user?.id || null,
      })
      .select()
      .single();
    if (batchError) throw batchError;

    await createAuditLog(req.user?.id, "STOCK_ADDED", "stock_batches", batchData.id, null, value, req.ip);

    res.status(201).json(batchData);
  } catch (error) {
    console.error("Supabase error:", error.message);
    res.status(500).json({ message: "Error adding new item/batch", error: error.message });
  }
};

// --------------------------------------------
// [PMS-T-032] PUT /api/inventory/stock/:batchId
// --------------------------------------------
export const updateInventoryQuantity = async (req, res) => {
  const { batchId } = req.params;
  const { quantityChange, reason, notes } = req.body;

  if (!quantityChange || !reason)
    return res.status(400).json({ message: "quantityChange and reason are required" });

  const validReasons = ["SALE", "RETURN", "ADJUSTMENT", "TRANSFER", "WASTE"];
  if (!validReasons.includes(reason))
    return res.status(400).json({ message: "Invalid reason. Must be one of: " + validReasons.join(", ") });

  try {
    const { data: batch, error: fetchError } = await supabase
      .from("stock_batches")
      .select("*")
      .eq("id", batchId)
      .single();
    if (fetchError || !batch) return res.status(404).json({ message: "Batch not found" });

    const previousQuantity = batch.quantity;
    const newQuantity = previousQuantity + parseInt(quantityChange, 10);
    if (newQuantity < 0) return res.status(400).json({ message: "Quantity cannot be negative" });

    const { data: updatedBatch, error: updateError } = await supabase
      .from("stock_batches")
      .update({ quantity: newQuantity, status: newQuantity === 0 ? "DEPLETED" : batch.status })
      .eq("id", batchId)
      .select()
      .single();
    if (updateError) throw updateError;

    await supabase.from("transactions").insert({
      batch_id: batchId,
      transaction_type: reason,
      quantity_change: parseInt(quantityChange, 10),
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      reason,
      notes: notes || null,
      created_by: req.user?.id || null,
    });

    await createAuditLog(
      req.user?.id,
      "QUANTITY_UPDATED",
      "stock_batches",
      batchId,
      { quantity: previousQuantity },
      { quantity: newQuantity, reason, quantityChange },
      req.ip
    );

    res.status(200).json({
      message: "Quantity updated successfully",
      data: updatedBatch,
      transaction: { previousQuantity, newQuantity, change: quantityChange },
    });
  } catch (error) {
    console.error("Supabase error:", error.message);
    res.status(500).json({ message: "Error updating quantity", error: error.message });
  }
};

// --------------------------------------------
// [PMS-T-050] PUT /api/waste/:batchId
// --------------------------------------------
// ✅ REPLACE WITH THIS:
export const markAsWaste = async (req, res) => {
  console.log("=== BACKEND: markAsWaste called ===");
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  
  const { batchId } = req.params;
  const { reason, quantity, notes, user_id } = req.body;

  try {
    console.log("Step 1: Fetching batch...");
    const { data: batch, error: batchError } = await supabase
      .from("stock_batches")
      .select("id, item_id, quantity, status, items(base_price)")
      .eq("id", batchId)
      .single();
    
    console.log("Batch data:", batch);
    console.log("Batch error:", batchError);

    if (batchError || !batch) {
      console.log("Batch not found error");
      return res.status(404).json({ message: "Batch not found" });
    }

    console.log("Step 2: Checking quantity...");
    if (quantity > batch.quantity) {
      console.log("Quantity exceeds stock error");
      return res.status(400).json({ message: "Waste quantity cannot exceed current stock" });
    }

    console.log("Step 3: Updating stock...");
    const newQuantity = batch.quantity - quantity;
    const newStatus = newQuantity === 0 ? "DEPLETED" : batch.status;
    
    const { error: updateError } = await supabase
      .from("stock_batches")
      .update({ quantity: newQuantity, status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", batchId);
    
    console.log("Stock update error:", updateError);

    console.log("Step 4: Creating waste log...");
    
const wasteLogData = {
  batch_id: batchId,
  item_id: batch.item_id,
  quantity,
  waste_reason: reason,
  estimated_loss: (quantity * parseFloat(batch.items?.base_price || 0)).toFixed(2),
  notes: notes || null,
  created_by: null,
  user_reference: req.body.user_email || "Unknown",  // Use from request body
  user_role: req.body.user_role || "Unknown", // Store role information
};


console.log("Waste log data being inserted:", wasteLogData);

const { data: wasteLog, error: wasteError } = await supabase.from("waste_logs").insert([wasteLogData]).select();

console.log("Waste log insert result:", wasteLog);
console.log("Waste log insert error:", wasteError);
console.log("Waste log error details:", wasteError?.details);
console.log("Waste log error hint:", wasteError?.hint);
console.log("Waste log error code:", wasteError?.code);
    if (wasteError) {
      console.log("Waste log creation failed:", wasteError);
      return res.status(500).json({ message: "Failed to create waste log", error: wasteError.message });
    }

    console.log("Step 5: Success!");
    res.status(200).json({
      message: `Marked ${quantity} units as waste.`,
      batch_id: batchId,
      estimated_loss: (quantity * parseFloat(batch.items?.base_price || 0)).toFixed(2),
      newQuantity,
      newStatus,
    });

  } catch (error) {
    console.error("Unexpected error in markAsWaste:", error);
    res.status(500).json({ message: "Failed to mark as waste", error: error.message });
  }
};

// --------------------------------------------
// DELETE /api/inventory/stock/:id
// --------------------------------------------
export const deleteInventoryBatch = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: batch } = await supabase
      .from("stock_batches")
      .select("*, items(*)")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("stock_batches").delete().eq("id", id);
    if (error) throw error;

    if (batch) {
      await createAuditLog(
        req.user?.id,
        "STOCK_DELETED",
        "stock_batches",
        id,
        { sku: batch.items?.sku, quantity: batch.quantity },
        null,
        req.ip
      );
    }

    res.status(204).send();
  } catch (error) {
    console.error("Supabase error:", error.message);
    res.status(500).json({ message: "Error deleting item", error: error.message });
  }
};
