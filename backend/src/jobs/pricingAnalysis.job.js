import cron from 'node-cron';
import { analyzePricingAndSuggestDiscounts } from '../services/pricingAlgorithm.service.js';

/**
 * PMS-T-073: Create cron job for daily pricing analysis
 * 
 * Pricing Analysis Cron Job
 * Runs daily at 7:00 AM to analyze pricing and suggest discounts
 */

let cronJob = null;

/**
 * Start the pricing analysis cron job
 */
export const startPricingAnalysisJob = () => {
  // Schedule: Run every day at 7:00 AM
  // Cron format: minute hour day month weekday
  // '0 7 * * *' = At 7:00 AM every day
  
  cronJob = cron.schedule('0 7 * * *', async () => {
    console.log('\n🕐 Scheduled Pricing Analysis Job Triggered');
    await analyzePricingAndSuggestDiscounts();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  console.log('✅ Pricing Analysis Cron Job scheduled (Daily at 7:00 AM)');
  return cronJob;
};

/**
 * Stop the pricing analysis cron job
 */
export const stopPricingAnalysisJob = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('🛑 Pricing Analysis Cron Job stopped');
  }
};

/**
 * Run the job immediately (for testing)
 */
export const runPricingAnalysisNow = async () => {
  console.log('🚀 Running Pricing Analysis Job immediately...');
  return await analyzePricingAndSuggestDiscounts();
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
