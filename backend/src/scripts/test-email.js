/**
 * Email Configuration Test Script
 * 
 * This script tests your email credentials by sending a test email.
 * Run: node src/scripts/test-email.js
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');
dotenv.config({ path: join(projectRoot, '.env') });

console.log('\n' + '='.repeat(60));
console.log('📧 EMAIL CONFIGURATION TEST');
console.log('='.repeat(60) + '\n');

// Check if credentials are configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ Email credentials not found in .env file!');
  console.log('\nPlease add the following to your .env file:');
  console.log('EMAIL_HOST=smtp.gmail.com');
  console.log('EMAIL_PORT=587');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASSWORD=your-app-password');
  console.log('EMAIL_FROM=your-email@gmail.com\n');
  process.exit(1);
}

// Display configuration (hide password)
console.log('📋 Current Configuration:');
console.log('-'.repeat(60));
console.log(`  EMAIL_HOST: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
console.log(`  EMAIL_PORT: ${process.env.EMAIL_PORT || '587'}`);
console.log(`  EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`  EMAIL_PASSWORD: ${'*'.repeat(16)} (hidden)`);
console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);
console.log('-'.repeat(60) + '\n');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Test connection
console.log('🔌 Testing SMTP connection...\n');

transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection successful!\n');
    
    // Send test email
    console.log('📧 Sending test email...\n');
    
    const mailOptions = {
      from: `"PMS Test" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ PMS Email Configuration Test - Success!',
      text: `
Hello!

This is a test email from your Perishables Management System (PMS).

✅ Your email configuration is working correctly!

Configuration Details:
- SMTP Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}
- SMTP Port: ${process.env.EMAIL_PORT || '587'}
- Email User: ${process.env.EMAIL_USER}

Next Steps:
1. ✅ Email credentials verified
2. ⏭️  Ready to send daily notifications to managers
3. 🚀 System will automatically send emails at 6:30 AM daily

You can now use the email notification system in production!

---
Perishables Management System
Automated Email Notification Test
${new Date().toLocaleString()}
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .success-icon { font-size: 48px; margin-bottom: 10px; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
    .config-item { margin: 8px 0; font-size: 14px; }
    .next-steps { background: #e0f2fe; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1 style="margin: 0;">Email Test Successful!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">PMS Email Configuration Verified</p>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>This is a test email from your <strong>Perishables Management System (PMS)</strong>.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">✅ Your email configuration is working correctly!</h3>
        <div class="config-item"><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST || 'smtp.gmail.com'}</div>
        <div class="config-item"><strong>SMTP Port:</strong> ${process.env.EMAIL_PORT || '587'}</div>
        <div class="config-item"><strong>Email User:</strong> ${process.env.EMAIL_USER}</div>
      </div>

      <div class="next-steps">
        <h3 style="margin-top: 0;">🚀 Next Steps:</h3>
        <ol style="margin: 10px 0;">
          <li>✅ Email credentials verified</li>
          <li>⏭️  Ready to send daily notifications to managers</li>
          <li>🚀 System will automatically send emails at 6:30 AM daily</li>
        </ol>
      </div>

      <p><strong>You can now use the email notification system in production!</strong></p>

      <div class="footer">
        <p>Perishables Management System<br>
        Automated Email Notification Test<br>
        ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    return transporter.sendMail(mailOptions);
  })
  .then((info) => {
    console.log('✅ Test email sent successfully!\n');
    console.log('📬 Email Details:');
    console.log('-'.repeat(60));
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  To: ${process.env.EMAIL_USER}`);
    console.log(`  Subject: Email Configuration Test - Success!`);
    console.log('-'.repeat(60) + '\n');
    
    console.log('🎉 SUCCESS! Your email configuration is working!\n');
    console.log('Next Steps:');
    console.log('  1. Check your inbox for the test email');
    console.log('  2. If received, you\'re ready for production!');
    console.log('  3. The system will send daily emails to all managers at 6:30 AM\n');
    
    console.log('To test with actual data, run:');
    console.log('  curl -X POST http://localhost:5000/api/cron/email-notification/test \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log(`    -d '{"email": "${process.env.EMAIL_USER}", "name": "Test Manager"}'\n`);
    
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Email test failed!\n');
    console.error('Error Details:');
    console.error('-'.repeat(60));
    console.error(`  Error: ${error.message}`);
    console.error('-'.repeat(60) + '\n');
    
    console.log('💡 Troubleshooting Tips:\n');
    
    if (error.message.includes('Invalid login')) {
      console.log('  ❌ Authentication Failed');
      console.log('  → For Gmail: Use App Password, not regular password');
      console.log('  → Enable 2-Factor Authentication first');
      console.log('  → Generate App Password: https://myaccount.google.com/apppasswords');
      console.log('  → Remove spaces from App Password\n');
    } else if (error.message.includes('ECONNECTION') || error.message.includes('timeout')) {
      console.log('  ❌ Connection Failed');
      console.log('  → Check your internet connection');
      console.log('  → Verify SMTP host and port');
      console.log('  → Try EMAIL_PORT=465 instead of 587');
      console.log('  → Check firewall settings\n');
    } else if (error.message.includes('EAUTH')) {
      console.log('  ❌ Authentication Error');
      console.log('  → Verify EMAIL_USER is correct');
      console.log('  → Verify EMAIL_PASSWORD is correct');
      console.log('  → For Gmail: Must use App Password');
      console.log('  → For SendGrid: Use "apikey" as EMAIL_USER\n');
    } else {
      console.log('  → Check your .env file configuration');
      console.log('  → Verify all email settings are correct');
      console.log('  → Try a different SMTP provider\n');
    }
    
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  });
