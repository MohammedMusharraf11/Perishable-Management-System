import { supabase } from '../config/supabaseClient.js';

/**
 * Expiry Monitoring Service
 * Checks for items nearing expiration and creates alerts
 */

/**
 * Calculate expiry status based on days until expiry
 */
const getExpiryAlertType = (daysUntilExpiry) => {
  if (daysUntilExpiry < 0) return 'EXPIRED';
  if (daysUntilExpiry === 0) return 'EXPIRING_TODAY';
  if (daysUntilExpiry === 1) return 'EXPIRING_1_DAY';
  if (daysUntilExpiry === 2) return 'EXPIRING_2_DAYS';
  return null; // No alert needed
};

/**
 * Get alert message based on type
 */
const getAlertMessage = (alertType, productName, sku, expiryDate) => {
  const messages = {
    'EXPIRED': `${productName} (${sku}) has expired on ${expiryDate}`,
    'EXPIRING_TODAY': `${productName} (${sku}) expires today (${expiryDate})`,
    'EXPIRING_1_DAY': `${productName} (${sku}) expires in 1 day (${expiryDate})`,
    'EXPIRING_2_DAYS': `${productName} (${sku}) expires in 2 days (${expiryDate})`
  };
  return messages[alertType] || 'Unknown alert';
};

/**
 * Update stock batch status based on expiry
 */
const updateBatchStatus = async (batchId, daysUntilExpiry) => {
  let newStatus;
  
  if (daysUntilExpiry < 0) {
    newStatus = 'EXPIRED';
  } else if (daysUntilExpiry <= 3) {
    newStatus = 'EXPIRING_SOON';
  } else {
    newStatus = 'ACTIVE';
  }

  const { error } = await supabase
    .from('stock_batches')
    .update({ status: newStatus })
    .eq('id', batchId);

  if (error) {
    console.error(`Failed to update batch ${batchId} status:`, error);
    return false;
  }

  return true;
};

/**
 * Create alert for expiring item
 */
const createAlert = async (batch, alertType, message) => {
  try {
    // Check if alert already exists for this batch and type today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: existingAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('batch_id', batch.id)
      .eq('alert_type', alertType)
      .gte('created_at', today.toISOString())
      .single();

    // Don't create duplicate alerts for the same day
    if (existingAlert) {
      return { created: false, reason: 'duplicate' };
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert({
        batch_id: batch.id,
        alert_type: alertType,
        message: message,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return { created: true, data };
  } catch (error) {
    console.error('Failed to create alert:', error);
    return { created: false, error: error.message };
  }
};

/**
 * Main function to monitor expiring items
 * PMS-T-038: Expiry monitoring service
 * PMS-T-039: Database query to find expiring items
 */
export const monitorExpiringItems = async () => {
  const startTime = new Date();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Expiry Monitor Job Started: ${startTime.toISOString()}`);
  console.log('='.repeat(60));

  const stats = {
    totalChecked: 0,
    expired: 0,
    expiringToday: 0,
    expiring1Day: 0,
    expiring2Days: 0,
    alertsCreated: 0,
    statusUpdated: 0,
    errors: 0
  };

  try {
    // Query all active batches with quantity > 0
    const { data: batches, error } = await supabase
      .from('stock_batches')
      .select(`
        id,
        quantity,
        expiry_date,
        status,
        items (
          sku,
          name
        )
      `)
      .gt('quantity', 0)
      .in('status', ['ACTIVE', 'EXPIRING_SOON']);

    if (error) throw error;

    if (!batches || batches.length === 0) {
      console.log('ℹ️  No active batches found to monitor');
      return { success: true, stats };
    }

    stats.totalChecked = batches.length;
    console.log(`📊 Checking ${batches.length} active batches...`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each batch
    for (const batch of batches) {
      try {
        const expiryDate = new Date(batch.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);

        // Calculate days until expiry
        const diffTime = expiryDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Update batch status
        const statusUpdated = await updateBatchStatus(batch.id, daysUntilExpiry);
        if (statusUpdated) stats.statusUpdated++;

        // Check if alert is needed (expired or expiring within 2 days)
        if (daysUntilExpiry <= 2) {
          const alertType = getExpiryAlertType(daysUntilExpiry);
          
          if (alertType) {
            const message = getAlertMessage(
              alertType,
              batch.items.name,
              batch.items.sku,
              batch.expiry_date
            );

            const result = await createAlert(batch, alertType, message);
            
            if (result.created) {
              stats.alertsCreated++;
              
              // Update category stats
              if (alertType === 'EXPIRED') stats.expired++;
              else if (alertType === 'EXPIRING_TODAY') stats.expiringToday++;
              else if (alertType === 'EXPIRING_1_DAY') stats.expiring1Day++;
              else if (alertType === 'EXPIRING_2_DAYS') stats.expiring2Days++;

              console.log(`  ⚠️  Alert created: ${alertType} - ${batch.items.name} (${batch.items.sku})`);
            }
          }
        }
      } catch (batchError) {
        console.error(`  ❌ Error processing batch ${batch.id}:`, batchError.message);
        stats.errors++;
      }
    }

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📈 Expiry Monitor Job Summary:');
    console.log('-'.repeat(60));
    console.log(`  Total Batches Checked: ${stats.totalChecked}`);
    console.log(`  Status Updates: ${stats.statusUpdated}`);
    console.log(`  Alerts Created: ${stats.alertsCreated}`);
    console.log(`    - Expired: ${stats.expired}`);
    console.log(`    - Expiring Today: ${stats.expiringToday}`);
    console.log(`    - Expiring in 1 Day: ${stats.expiring1Day}`);
    console.log(`    - Expiring in 2 Days: ${stats.expiring2Days}`);
    console.log(`  Errors: ${stats.errors}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Completed: ${endTime.toISOString()}`);
    console.log('='.repeat(60) + '\n');

    return { success: true, stats, duration };
  } catch (error) {
    console.error('❌ Expiry Monitor Job Failed:', error.message);
    console.log('='.repeat(60) + '\n');
    return { success: false, error: error.message, stats };
  }
};

/**
 * Test function to run monitor manually
 */
export const testExpiryMonitor = async () => {
  console.log('🧪 Running Expiry Monitor Test...\n');
  const result = await monitorExpiringItems();
  return result;
};
