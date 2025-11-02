import express from 'express';
import { runExpiryMonitorNow, getJobStatus } from '../jobs/expiryMonitor.job.js';

const router = express.Router();

/**
 * GET /api/cron/expiry-monitor/run
 * Manually trigger the expiry monitor job
 */
router.get('/expiry-monitor/run', async (req, res) => {
  try {
    console.log('📡 Manual expiry monitor trigger received');
    const result = await runExpiryMonitorNow();
    
    res.status(200).json({
      success: true,
      message: 'Expiry monitor job executed',
      result
    });
  } catch (error) {
    console.error('Error running expiry monitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run expiry monitor',
      error: error.message
    });
  }
});

/**
 * GET /api/cron/expiry-monitor/status
 * Get the status of the cron job
 */
router.get('/expiry-monitor/status', (req, res) => {
  const status = getJobStatus();
  res.status(200).json({
    success: true,
    ...status
  });
});

export default router;
