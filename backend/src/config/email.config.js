import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PMS-T-060: Set up Nodemailer with SMTP configuration
 * 
 * Email Configuration for Daily Notifications
 */

// Create reusable transporter
export const createEmailTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // For development only
    },
  };

  // Validate configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email credentials not configured. Email notifications will be disabled.');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport(config);
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Test email configuration
export const testEmailConnection = async () => {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    return { success: false, message: 'Email not configured' };
  }

  try {
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return { success: true, message: 'Email server is ready' };
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return { success: false, message: error.message };
  }
};

// Email configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
};

export default {
  createEmailTransporter,
  testEmailConnection,
  emailConfig,
};
