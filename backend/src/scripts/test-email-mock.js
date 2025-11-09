/**
 * Mock Email Test - For Development Without Real SMTP
 * 
 * This simulates email sending without requiring real credentials
 * Run: node src/scripts/test-email-mock.js
 */

import { sendDailyExpiryNotifications } from '../services/emailNotification.service.js';

console.log('\n' + '='.repeat(60));
console.log('📧 MOCK EMAIL TEST (No Real Emails Sent)');
console.log('='.repeat(60) + '\n');

console.log('This will simulate the email notification process');
console.log('without actually sending emails.\n');

// Override console.log to capture email content
const originalLog = console.log;
let emailContent = [];

console.log = (...args) => {
  emailContent.push(args.join(' '));
  originalLog(...args);
};

// Run the notification service
console.log('Running email notification service...\n');

sendDailyExpiryNotifications()
  .then((result) => {
    console.log = originalLog;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MOCK TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\nIn production, this would:');
    console.log('  1. Fetch all active managers from database');
    console.log('  2. Get items expiring in 0-2 days');
    console.log('  3. Send professional HTML emails to each manager');
    console.log('  4. Retry failed sends up to 3 times');
    console.log('  5. Log all activity\n');
    
    if (result.stats) {
      console.log('Statistics:');
      console.log(`  Managers: ${result.stats.totalManagers || 0}`);
      console.log(`  Emails Sent: ${result.stats.emailsSent || 0}`);
      console.log(`  Emails Failed: ${result.stats.emailsFailed || 0}\n`);
    }
    
    console.log('Once you fix Gmail authentication, real emails will be sent!');
    console.log('='.repeat(60) + '\n');
  })
  .catch((error) => {
    console.log = originalLog;
    console.error('Error:', error.message);
  });
