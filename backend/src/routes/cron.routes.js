import express from 'express';
import { runExpiryMonitorNow, getJobStatus } from '../jobs/expiryMonitor.job.js';
import {
  runPricingAnalysisNow,
  getJobStatus as getPricingJobStatus
} from '../jobs/pricingAnalysis.job.js';
import {
  runEmailNotificationNow,
  getJobStatus as getEmailJobStatus
} from '../jobs/emailNotification.job.js';
import { sendTestEmail } from '../services/emailNotification.service.js';

const router = express.Router();

/**
 * GET /api/cron/expiry-monitor/run
 * Manually trigger the expiry monitor job
 */
router.get('/expiry-monitor/run', async (req, res) => {
  try {
    console.log('📡 Manual expiry monitor trigger received');

    // Respond immediately to avoid timeout
    res.status(200).json({
      success: true,
      message: 'Expiry monitor job started',
      status: 'processing'
    });

    // Process monitoring in background (don't await)
    runExpiryMonitorNow()
      .then(result => {
        console.log('✅ Expiry monitor job completed:', result);
      })
      .catch(error => {
        console.error('❌ Expiry monitor job failed:', error);
      });

  } catch (error) {
    console.error('Error starting expiry monitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start expiry monitor',
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

/**
 * GET /api/cron/pricing-analysis/run
 * Manually trigger the pricing analysis job
 */
router.get('/pricing-analysis/run', async (req, res) => {
  try {
    console.log('📡 Manual pricing analysis trigger received');

    // Respond immediately to avoid timeout
    res.status(200).json({
      success: true,
      message: 'Pricing analysis job started',
      status: 'processing'
    });

    // Process analysis in background (don't await)
    runPricingAnalysisNow()
      .then(result => {
        console.log('✅ Pricing analysis job completed:', result);
      })
      .catch(error => {
        console.error('❌ Pricing analysis job failed:', error);
      });

  } catch (error) {
    console.error('Error starting pricing analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start pricing analysis',
      error: error.message
    });
  }
});

/**
 * GET /api/cron/pricing-analysis/status
 * Get the status of the pricing analysis cron job
 */
router.get('/pricing-analysis/status', (req, res) => {
  const status = getPricingJobStatus();
  res.status(200).json({
    success: true,
    ...status
  });
});

/**
 * GET /api/cron/email-notification/run
 * Manually trigger the email notification job
 */
router.get('/email-notification/run', async (req, res) => {
  try {
    console.log('📡 Manual email notification trigger received');

    // Respond immediately to avoid timeout
    res.status(200).json({
      success: true,
      message: 'Email notification job started',
      status: 'processing'
    });

    // Process emails in background (don't await)
    runEmailNotificationNow()
      .then(result => {
        console.log('✅ Email notification job completed:', result);
      })
      .catch(error => {
        console.error('❌ Email notification job failed:', error);
      });

  } catch (error) {
    console.error('Error starting email notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start email notification',
      error: error.message
    });
  }
});

/**
 * GET /api/cron/email-notification/status
 * Get the status of the email notification cron job
 */
router.get('/email-notification/status', (req, res) => {
  const status = getEmailJobStatus();
  res.status(200).json({
    success: true,
    ...status
  });
});

/**
 * POST /api/cron/email-notification/test
 * Send a test email
 */
router.post('/email-notification/test', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    console.log(`📧 Sending test email to ${email}...`);
    const result = await sendTestEmail(email, name || 'Test User');

    res.status(200).json({
      success: result.success,
      message: result.success
        ? 'Test email sent successfully'
        : 'Failed to send test email',
      result
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

export default router;
