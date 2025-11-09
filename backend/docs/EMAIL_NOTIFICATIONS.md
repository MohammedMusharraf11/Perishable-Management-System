# Email Notification System - Complete Guide

## Overview
Automated daily email notifications sent to all managers at 6:30 AM with expiry alerts and actionable insights.

## User Story Implemented
**As a Store Manager**  
I want to receive daily email notifications about expiring items  
So that I'm proactively informed even when not logged in

---

## ✅ All Acceptance Criteria Met

| Criteria | Status | Implementation |
|----------|--------|----------------|
| Email sent to all managers at 6:30 AM daily | ✅ | Cron job scheduled |
| Email contains summary (expired, today, soon) | ✅ | Summary cards in email |
| Email lists specific items with details | ✅ | Full item list with SKU, name, qty, expiry |
| Email includes link to PMS dashboard | ✅ | CTA button + footer links |
| Email is formatted professionally with HTML | ✅ | Responsive HTML template |
| Email service failures are logged and retried | ✅ | 3 retries with exponential backoff |

---

## Technical Implementation

### Files Created

1. **`src/config/email.config.js`** (PMS-T-060)
   - Nodemailer SMTP configuration
   - Email transporter creation
   - Connection testing utility

2. **`src/templates/expiryNotificationEmail.js`** (PMS-T-061)
   - Professional HTML email template
   - Plain text fallback
   - Responsive design

3. **`src/services/emailNotification.service.js`** (PMS-T-062, PMS-T-064)
   - Email sending service
   - Retry logic (3 attempts with exponential backoff)
   - Manager email fetching
   - Expiring items data aggregation

4. **`src/jobs/emailNotification.job.js`** (PMS-T-063)
   - Cron job scheduler (6:30 AM daily)
   - Manual trigger support
   - Job status monitoring

---

## Email Configuration

### Step 1: Choose Email Provider

#### Option A: Gmail (Easiest for Development)

1. **Enable 2-Factor Authentication**
   - Go to Google Account → Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

3. **Add to `.env`:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

#### Option B: SendGrid (Recommended for Production)

1. **Sign up at SendGrid**
   - Visit: https://sendgrid.com/
   - Create free account (100 emails/day)

2. **Create API Key**
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permission
   - Copy the API key

3. **Add to `.env`:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### Option C: Other Providers

**Outlook/Office365:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Mailgun:**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

### Step 2: Update Environment Variables

Add to your `backend/.env` file:
```env
# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_REPLY_TO=your-email@gmail.com
```

### Step 3: Test Configuration

```bash
# Test email connection
curl -X POST http://localhost:5000/api/cron/email-notification/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@gmail.com", "name": "Test User"}'
```

---

## Email Template Features

### Professional Design
- ✅ Responsive HTML layout
- ✅ Mobile-friendly design
- ✅ Professional color scheme
- ✅ Clear visual hierarchy
- ✅ Branded header and footer

### Summary Cards
```
┌─────────────────────────────────────┐
│  🔴 Expired: 2                      │
│  🟠 Expiring Today: 5               │
│  🟡 Expiring Soon: 8                │
└─────────────────────────────────────┘
```

### Item Details
Each item shows:
- Product name (bold, prominent)
- SKU number
- Quantity with unit
- Expiry date (formatted)
- Category
- Urgency badge (color-coded)

### Call-to-Action
- Large "View Dashboard" button
- Links to Alerts and Pricing pages
- Professional footer with branding

---

## Cron Job Schedule

### Default Schedule
- **Time:** 6:30 AM daily
- **Timezone:** Asia/Kolkata
- **Cron Expression:** `30 6 * * *`

### Change Schedule

Edit `backend/src/jobs/emailNotification.job.js`:
```javascript
cron.schedule('30 6 * * *', async () => {
  // Change time here
  // Format: minute hour day month weekday
  // Examples:
  // '0 7 * * *'   = 7:00 AM daily
  // '30 8 * * 1'  = 8:30 AM every Monday
  // '0 9 * * 1-5' = 9:00 AM weekdays only
});
```

### Change Timezone
```javascript
{
  scheduled: true,
  timezone: "America/New_York" // Change timezone
}
```

---

## Retry Logic (PMS-T-064)

### How It Works
1. **First Attempt:** Immediate send
2. **Second Attempt:** Wait 5 seconds
3. **Third Attempt:** Wait 10 seconds
4. **Failure:** Log error and continue to next manager

### Configuration
Edit `backend/src/config/email.config.js`:
```javascript
export const emailConfig = {
  maxRetries: 3,        // Number of retry attempts
  retryDelay: 5000,     // Base delay in milliseconds
};
```

### Exponential Backoff
- Attempt 1: Immediate
- Attempt 2: 5 seconds delay
- Attempt 3: 10 seconds delay

---

## API Endpoints

### Manual Trigger
```bash
GET /api/cron/email-notification/run
```

**Response:**
```json
{
  "success": true,
  "message": "Email notification job executed",
  "result": {
    "success": true,
    "stats": {
      "totalManagers": 3,
      "emailsSent": 3,
      "emailsFailed": 0,
      "errors": []
    },
    "duration": "2.45"
  }
}
```

### Send Test Email
```bash
POST /api/cron/email-notification/test
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User"
}
```

### Check Job Status
```bash
GET /api/cron/email-notification/status
```

**Response:**
```json
{
  "success": true,
  "running": true,
  "message": "Job is running"
}
```

---

## Logging

### Job Execution Log
```
============================================================
📧 Daily Email Notification Job Started: 2025-11-08T06:30:00.000Z
============================================================
📋 Found 3 active manager(s)
📦 Found 15 items requiring attention
   - Expired: 2
   - Expiring Today: 5
   - Expiring Soon: 8

📧 Sending email to John Doe (john@example.com)...
✅ Email sent to john@example.com (attempt 1)

📧 Sending email to Jane Smith (jane@example.com)...
✅ Email sent to jane@example.com (attempt 1)

============================================================
📈 Email Notification Summary:
------------------------------------------------------------
  Total Managers: 3
  Emails Sent: 3
  Emails Failed: 0
  Duration: 2.45s
  Completed: 2025-11-08T06:30:02.450Z
============================================================
```

### Error Logging
```
❌ Email send attempt 1 failed: Connection timeout
⏳ Retrying in 5000ms...
❌ Email send attempt 2 failed: Connection timeout
⏳ Retrying in 10000ms...
❌ All 3 email send attempts failed

❌ Failed Emails:
  - manager@example.com: Connection timeout
```

---

## Testing

### Test Cases

**TC-NOTIF-01: Email Delivery**
```bash
# Test email sending
curl -X POST http://localhost:5000/api/cron/email-notification/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com", "name": "Test Manager"}'
```

**Expected Result:**
- ✅ Email received within 30 seconds
- ✅ HTML formatting displays correctly
- ✅ All links work
- ✅ Summary shows correct counts
- ✅ Items list displays properly

**TC-NOTIF-02: Retry Logic**
```bash
# Temporarily disable internet or use wrong credentials
# Run manual trigger
curl http://localhost:5000/api/cron/email-notification/run
```

**Expected Result:**
- ✅ 3 retry attempts logged
- ✅ Exponential backoff delays observed
- ✅ Error logged after all retries fail
- ✅ Job continues to next manager

### Manual Testing

1. **Test Email Configuration:**
```bash
node -e "require('./src/config/email.config.js').testEmailConnection()"
```

2. **Send Test Email:**
```bash
curl -X POST http://localhost:5000/api/cron/email-notification/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

3. **Trigger Manual Send:**
```bash
curl http://localhost:5000/api/cron/email-notification/run
```

---

## Troubleshooting

### Issue: "Email not configured"

**Solution:**
1. Check `.env` file has EMAIL_USER and EMAIL_PASSWORD
2. Restart server after adding credentials
3. Verify credentials are correct

### Issue: "Authentication failed"

**Gmail:**
- Use App Password, not regular password
- Enable 2-Factor Authentication first
- Generate new App Password

**SendGrid:**
- Verify API key is correct
- Check API key has "Mail Send" permission
- Use "apikey" as EMAIL_USER

### Issue: "Connection timeout"

**Solution:**
1. Check firewall settings
2. Verify SMTP port (587 or 465)
3. Try different EMAIL_PORT
4. Check internet connection

### Issue: "Emails not being sent"

**Check:**
1. Cron job is running: `GET /api/cron/email-notification/status`
2. Managers exist in database with valid emails
3. Email credentials are configured
4. Check server logs for errors

---

## Email Preview

### Desktop View
```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  🔔 Daily Expiry Alert                              │
│  Perishables Management System                      │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Hello John Doe,                                    │
│                                                      │
│  Here's your daily summary of items requiring       │
│  attention...                                       │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │    2     │ │    5     │ │    8     │           │
│  │ Expired  │ │  Today   │ │   Soon   │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                      │
│  📦 Items Requiring Attention (15)                  │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  Milk                            [EXPIRES TODAY]    │
│  SKU: MILK-001 • Qty: 20 liters • Exp: 08 Nov 2025│
│                                                      │
│  Ghosh                           [EXPIRED]          │
│  SKU: MEAT-001 • Qty: 10 kg • Exp: 07 Nov 2025    │
│                                                      │
│  ...                                                 │
│                                                      │
│           [View Dashboard →]                        │
│                                                      │
│  💡 Tip: Consider applying discounts to items       │
│  expiring soon to minimize waste.                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│  This is an automated notification from PMS         │
│  Dashboard • View All Alerts • Manage Discounts     │
│  © 2025 PMS. All rights reserved.                   │
└─────────────────────────────────────────────────────┘
```

---

## Production Checklist

- [ ] Email credentials configured in `.env`
- [ ] Test email sent successfully
- [ ] Cron job scheduled and running
- [ ] Manager emails verified in database
- [ ] FRONTEND_URL set correctly
- [ ] Email template tested on multiple clients
- [ ] Retry logic tested
- [ ] Logging verified
- [ ] Error handling tested
- [ ] Rate limiting considered (if high volume)

---

## Future Enhancements

1. **Email Preferences**
   - Allow managers to opt-in/opt-out
   - Choose notification frequency
   - Select notification types

2. **Advanced Features**
   - Digest emails (weekly summary)
   - Critical alerts (immediate)
   - Custom email templates per manager
   - Attachment support (PDF reports)

3. **Analytics**
   - Email open rates
   - Click-through rates
   - Action taken metrics

4. **Multi-language Support**
   - Localized email templates
   - Manager language preference

---

## Support

### Quick Commands

```bash
# Test email configuration
curl -X POST http://localhost:5000/api/cron/email-notification/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'

# Trigger manual send
curl http://localhost:5000/api/cron/email-notification/run

# Check job status
curl http://localhost:5000/api/cron/email-notification/status
```

### Documentation
- Email Config: `backend/src/config/email.config.js`
- Email Template: `backend/src/templates/expiryNotificationEmail.js`
- Email Service: `backend/src/services/emailNotification.service.js`
- Cron Job: `backend/src/jobs/emailNotification.job.js`

---

**Implementation Date:** November 8, 2025  
**Status:** ✅ Complete and Ready for Configuration  
**Next Step:** Add your email credentials to `.env` file
