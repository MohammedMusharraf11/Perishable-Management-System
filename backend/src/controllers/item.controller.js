import { supabase } from '../config/database.js';

/**
 * Create a new item/product
 */
export const createItem = async (req, res) => {
  try {
    const { sku, name, category, base_price, description, unit } = req.body;

    // Validation
    if (!sku || !name || !base_price) {
      return res.status(400).json({
        success: false,
        message: 'SKU, name, and base_price are required'
      });
    }

    // Insert into database
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          sku,
          name,
          category: category || null,
          base_price,
          description: description || null,
          unit: unit || 'kg'
        }
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all items/products
 */
export const getAllItems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get item by ID
 */
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update item
 */
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, category, base_price, description, unit } = req.body;

    const { data, error } = await supabase
      .from('items')
      .update({
        sku,
        name,
        category,
        base_price,
        description,
        unit
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete item
 */
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
