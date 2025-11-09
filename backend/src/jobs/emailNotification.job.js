import cron from 'node-cron';
import { sendDailyExpiryNotifications } from '../services/emailNotification.service.js';

/**
 * PMS-T-063: Add cron job for daily email dispatch
 * 
 * Email Notification Cron Job
 * Runs daily at 6:30 AM to send expiry notifications to managers
 */

let cronJob = null;

/**
 * Start the email notification cron job
 */
export const startEmailNotificationJob = () => {
  // Schedule: Run every day at 6:30 AM
  // Cron format: minute hour day month weekday
  // '30 6 * * *' = At 6:30 AM every day
  
  cronJob = cron.schedule('30 6 * * *', async () => {
    console.log('\n🕐 Scheduled Email Notification Job Triggered');
    await sendDailyExpiryNotifications();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  console.log('✅ Email Notification Cron Job scheduled (Daily at 6:30 AM)');
  return cronJob;
};

/**
 * Stop the email notification cron job
 */
export const stopEmailNotificationJob = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('🛑 Email Notification Cron Job stopped');
  }
};

/**
 * Run the job immediately (for testing)
 */
export const runEmailNotificationNow = async () => {
  console.log('🚀 Running Email Notification Job immediately...');
  return await sendDailyExpiryNotifications();
};

/**
 * Get cron job status
 */
export const getJobStatus = () => {
  if (!cronJob) {
    return { running: false, message: 'Job not initialized' };
  }
  
  return {
    running: cronJob.running || false,
    message: cronJob.running ? 'Job is running' : 'Job is stopped'
  };
};
