import { createEmailTransporter, emailConfig } from '../config/email.config.js';
import { generateExpiryEmailHTML, generateExpiryEmailText } from '../templates/expiryNotificationEmail.js';
import { supabase } from '../config/supabaseClient.js';

/**
 * PMS-T-062: Implement email sending service
 * PMS-T-064: Add retry logic for failed emails
 * 
 * Email Notification Service for Daily Expiry Alerts
 */

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send email with retry logic
 * PMS-T-064: Retry logic implementation
 */
const sendEmailWithRetry = async (transporter, mailOptions, retries = emailConfig.maxRetries) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully on attempt ${attempt}:`, info.messageId);
      return { success: true, messageId: info.messageId, attempt };
    } catch (error) {
      console.error(`❌ Email send attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = emailConfig.retryDelay * attempt; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        console.error(`❌ All ${retries} email send attempts failed`);
        return { success: false, error: error.message, attempts: retries };
      }
    }
  }
};

/**
 * Get all manager emails from database
 */
const getManagerEmails = async () => {
  try {
    const { data, error } = await supabase
      .from('pms_users')
      .select('id, name, email, role, is_active')
      .eq('is_active', true)
      .eq('role', 'Manager');

    if (error) throw error;

    // Filter out users without email addresses
    const managersWithEmail = data.filter(user => user.email && user.email.trim() !== '');

    return managersWithEmail.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
  } catch (error) {
    console.error('Error fetching manager emails:', error);
    return [];
  }
};

/**
 * Get expiring items data for email
 */
const getExpiringItemsData = async () => {
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
        items (
          sku,
          name,
          category,
          unit
        )
      `)
      .gt('quantity', 0)
      .in('status', ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'])
      .lte('expiry_date', twoDaysFromNow.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    // Categorize items
    const items = batches.map(batch => {
      const expiryDate = new Date(batch.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let urgency, urgencyLabel;
      if (daysUntilExpiry < 0) {
        urgency = 'expired';
        urgencyLabel = 'EXPIRED';
      } else if (daysUntilExpiry === 0) {
        urgency = 'today';
        urgencyLabel = 'EXPIRES TODAY';
      } else {
        urgency = 'soon';
        urgencyLabel = `${daysUntilExpiry} DAYS LEFT`;
      }

      return {
        sku: batch.items.sku,
        name: batch.items.name,
        category: batch.items.category,
        quantity: batch.quantity,
        unit: batch.items.unit,
        expiryDate: new Date(batch.expiry_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        urgency,
        urgencyLabel,
        daysUntilExpiry,
      };
    });

    // Calculate summary
    const summary = {
      expired: items.filter(i => i.urgency === 'expired').length,
      expiringToday: items.filter(i => i.urgency === 'today').length,
      expiringSoon: items.filter(i => i.urgency === 'soon').length,
      total: items.length,
    };

    return { items, summary };
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    return { items: [], summary: { expired: 0, expiringToday: 0, expiringSoon: 0, total: 0 } };
  }
};

/**
 * Send daily expiry notification to a single manager
 */
export const sendExpiryNotificationToManager = async (manager, itemsData) => {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    console.log('⚠️  Email not configured, skipping notification');
    return { success: false, reason: 'Email not configured' };
  }

  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const emailData = {
    managerName: manager.name,
    summary: itemsData.summary,
    items: itemsData.items.slice(0, 20), // Limit to top 20 items
    dashboardUrl,
  };

  const mailOptions = {
    from: `"PMS Notifications" <${emailConfig.from}>`,
    to: manager.email,
    subject: `🔔 Daily Expiry Alert - ${itemsData.summary.total} Items Require Attention`,
    text: generateExpiryEmailText(emailData),
    html: generateExpiryEmailHTML(emailData),
  };

  console.log(`📧 Sending email to ${manager.name} (${manager.email})...`);
  
  const result = await sendEmailWithRetry(transporter, mailOptions);
  
  // Log the result
  if (result.success) {
    console.log(`✅ Email sent to ${manager.email} (attempt ${result.attempt})`);
  } else {
    console.error(`❌ Failed to send email to ${manager.email} after ${result.attempts} attempts`);
  }

  return result;
};

/**
 * Send daily expiry notifications to all managers
 * PMS-T-063: Main function called by cron job
 */
export const sendDailyExpiryNotifications = async () => {
  const startTime = new Date();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📧 Daily Email Notification Job Started: ${startTime.toISOString()}`);
  console.log('='.repeat(60));

  const stats = {
    totalManagers: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
  };

  try {
    // Check if email is configured
    const transporter = createEmailTransporter();
    if (!transporter) {
      console.log('⚠️  Email not configured. Skipping email notifications.');
      console.log('💡 To enable emails, add EMAIL_USER and EMAIL_PASSWORD to .env');
      return { success: false, message: 'Email not configured', stats };
    }

    // Get managers
    const managers = await getManagerEmails();
    stats.totalManagers = managers.length;

    if (managers.length === 0) {
      console.log('ℹ️  No active managers found');
      return { success: true, message: 'No managers to notify', stats };
    }

    console.log(`📋 Found ${managers.length} active manager(s)`);

    // Get expiring items data
    const itemsData = await getExpiringItemsData();
    console.log(`📦 Found ${itemsData.summary.total} items requiring attention`);
    console.log(`   - Expired: ${itemsData.summary.expired}`);
    console.log(`   - Expiring Today: ${itemsData.summary.expiringToday}`);
    console.log(`   - Expiring Soon: ${itemsData.summary.expiringSoon}`);

    // Send emails to all managers
    for (const manager of managers) {
      const result = await sendExpiryNotificationToManager(manager, itemsData);
      
      if (result.success) {
        stats.emailsSent++;
      } else {
        stats.emailsFailed++;
        stats.errors.push({
          manager: manager.email,
          error: result.error || result.reason,
        });
      }

      // Small delay between emails to avoid rate limiting
      await sleep(1000);
    }

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📈 Email Notification Summary:');
    console.log('-'.repeat(60));
    console.log(`  Total Managers: ${stats.totalManagers}`);
    console.log(`  Emails Sent: ${stats.emailsSent}`);
    console.log(`  Emails Failed: ${stats.emailsFailed}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Completed: ${endTime.toISOString()}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Failed Emails:');
      stats.errors.forEach(err => {
        console.log(`  - ${err.manager}: ${err.error}`);
      });
    }
    
    console.log('='.repeat(60) + '\n');

    return { success: true, stats, duration };
  } catch (error) {
    console.error('❌ Email Notification Job Failed:', error.message);
    console.log('='.repeat(60) + '\n');
    return { success: false, error: error.message, stats };
  }
};

/**
 * Test function to send a test email
 */
export const sendTestEmail = async (recipientEmail, recipientName = 'Test User') => {
  console.log('🧪 Sending test email...');
  
  const itemsData = await getExpiringItemsData();
  
  const manager = {
    name: recipientName,
    email: recipientEmail,
  };

  return await sendExpiryNotificationToManager(manager, itemsData);
};
