/**
 * Test Production Email System
 * 
 * This tests the actual production email flow:
 * 1. Fetches all managers from database
 * 2. Gets expiring items
 * 3. Sends emails to each manager
 * 
 * Run: node src/scripts/test-production-email.js
 */

import { sendDailyExpiryNotifications } from '../services/emailNotification.service.js';
import { supabase } from '../config/supabaseClient.js';

console.log('\n' + '='.repeat(60));
console.log('📧 PRODUCTION EMAIL SYSTEM TEST');
console.log('='.repeat(60) + '\n');

// First, let's check what managers are in the database
console.log('Step 1: Checking managers in database...\n');

const checkManagers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        is_active,
        roles (name)
      `)
      .eq('roles.name', 'Manager');

    if (error) throw error;

    console.log(`Found ${data.length} manager(s) in database:\n`);
    
    data.forEach((manager, index) => {
      console.log(`${index + 1}. ${manager.username}`);
      console.log(`   Email: ${manager.email}`);
      console.log(`   Active: ${manager.is_active ? 'Yes' : 'No'}`);
      console.log(`   Role: ${manager.roles?.name || 'N/A'}`);
      console.log('');
    });

    const activeManagers = data.filter(m => m.is_active);
    console.log(`Active managers who will receive emails: ${activeManagers.length}\n`);

    if (activeManagers.length === 0) {
      console.log('⚠️  No active managers found!');
      console.log('   Emails will not be sent.\n');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking managers:', error.message);
    return false;
  }
};

// Check expiring items
const checkExpiringItems = async () => {
  console.log('Step 2: Checking expiring items...\n');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const { data: batches, error } = await supabase
      .from('stock_batches')
      .select(`
        id,
        quantity,
        expiry_date,
        status,
        items (
          sku,
          name,
          category
        )
      `)
      .gt('quantity', 0)
      .in('status', ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'])
      .lte('expiry_date', twoDaysFromNow.toISOString().split('T')[0]);

    if (error) throw error;

    console.log(`Found ${batches.length} item(s) requiring attention:\n`);
    
    if (batches.length > 0) {
      batches.slice(0, 5).forEach((batch, index) => {
        const expiryDate = new Date(batch.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let urgency = daysUntilExpiry < 0 ? 'EXPIRED' : 
                      daysUntilExpiry === 0 ? 'TODAY' : 
                      `${daysUntilExpiry} DAYS`;
        
        console.log(`${index + 1}. ${batch.items.name} (${batch.items.sku})`);
        console.log(`   Quantity: ${batch.quantity}`);
        console.log(`   Expiry: ${batch.expiry_date} [${urgency}]`);
        console.log('');
      });
      
      if (batches.length > 5) {
        console.log(`   ... and ${batches.length - 5} more items\n`);
      }
    } else {
      console.log('✅ No items expiring soon. Email will show "No items requiring attention"\n');
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking items:', error.message);
    return false;
  }
};

// Main test
const runTest = async () => {
  const hasManagers = await checkManagers();
  
  if (!hasManagers) {
    console.log('='.repeat(60));
    console.log('⚠️  Cannot proceed: No active managers in database');
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }

  await checkExpiringItems();

  console.log('='.repeat(60));
  console.log('Step 3: Sending emails to all managers...\n');
  console.log('⚠️  This will send REAL emails to all active managers!');
  console.log('='.repeat(60) + '\n');

  // Ask for confirmation
  console.log('Do you want to proceed? (This will send actual emails)\n');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Proceeding with email send...\n');

  const result = await sendDailyExpiryNotifications();

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(60) + '\n');

  if (result.success) {
    console.log('📊 Results:');
    console.log(`   Total Managers: ${result.stats.totalManagers}`);
    console.log(`   Emails Sent: ${result.stats.emailsSent}`);
    console.log(`   Emails Failed: ${result.stats.emailsFailed}`);
    console.log(`   Duration: ${result.duration}s\n`);

    if (result.stats.emailsSent > 0) {
      console.log('✅ SUCCESS! Emails sent to all managers.');
      console.log('   Check their inboxes to verify.\n');
    }

    if (result.stats.errors && result.stats.errors.length > 0) {
      console.log('❌ Failed emails:');
      result.stats.errors.forEach(err => {
        console.log(`   - ${err.manager}: ${err.error}`);
      });
      console.log('');
    }
  } else {
    console.log('❌ Email sending failed:', result.message || result.error);
  }

  console.log('='.repeat(60) + '\n');
};

runTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
