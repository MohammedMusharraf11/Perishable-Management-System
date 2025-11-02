import cron from 'node-cron';
import { monitorExpiringItems } from '../services/expiryMonitor.service.js';

/**
 * PMS-T-037: Set up node-cron for scheduled jobs
 * PMS-T-041: Add logging for cron job execution
 * 
 * Expiry Monitor Cron Job
 * Runs daily at 6:00 AM to check for expiring items
 */

let cronJob = null;

/**
 * Start the expiry monitor cron job
 */
export const startExpiryMonitorJob = () => {
  // Schedule: Run every day at 6:00 AM
  // Cron format: minute hour day month weekday
  // '0 6 * * *' = At 6:00 AM every day
  
  cronJob = cron.schedule('0 6 * * *', async () => {
    console.log('\n🕐 Scheduled Expiry Monitor Job Triggered');
    await monitorExpiringItems();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  console.log('✅ Expiry Monitor Cron Job scheduled (Daily at 6:00 AM)');
  return cronJob;
};

/**
 * Stop the expiry monitor cron job
 */
export const stopExpiryMonitorJob = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('🛑 Expiry Monitor Cron Job stopped');
  }
};

/**
 * Run the job immediately (for testing)
 */
export const runExpiryMonitorNow = async () => {
  console.log('🚀 Running Expiry Monitor Job immediately...');
  return await monitorExpiringItems();
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
