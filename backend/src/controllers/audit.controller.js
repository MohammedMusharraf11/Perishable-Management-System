import { supabase } from '../config/supabaseClient.js';

/**
 * GET /api/audit-logs
 * Fetches audit logs with optional filtering
 */
export const getAuditLogs = async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;

  try {
    let query = supabase
      .from('audit_logs')
      .select('*, users(username, email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Search filter
    if (search) {
      query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
    }

    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data || [],
      count: count || 0
    });
  } catch (error) {
    console.error('Audit logs error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching audit logs', 
      error: error.message 
    });
  }
};
