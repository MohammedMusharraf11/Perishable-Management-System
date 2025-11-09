# 🕐 Cron Jobs Setup Guide

## ✅ What Changed

All cron endpoints now respond **immediately** (within 1 second) and process tasks in the background. This prevents timeout issues with cron-job.org's 30-second limit.

---

## 📋 Complete Cron Job Configuration

### Job 1: Keep Backend Alive ⭐ CRITICAL

```
Title: Keep Backend Alive
URL: https://perishable-management-system.onrender.com/health
Schedule: Every 14 minutes
Request Method: GET
Timeout: 30 seconds
```

**Purpose**: Prevents free-tier backend from spinning down after 15 minutes of inactivity.

---

### Job 2: Pricing Analysis 📊

```
Title: Pricing Analysis Daily
URL: https://perishable-management-system.onrender.com/api/cron/pricing-analysis/run
Schedule: Daily at 07:00 (IST - Asia/Kolkata)
Request Method: GET
Timeout: 30 seconds
```

**Purpose**: 
- Analyzes items expiring in 0-3 days
- Calculates optimal discount percentages
- Creates discount suggestions for managers

**Response** (immediate):
```json
{
  "success": true,
  "message": "Pricing analysis job started",
  "status": "processing"
}
```

**Actual processing**: Happens in background, check backend logs for results.

---

### Job 3: Email Notifications 📧

```
Title: Email Notifications Daily
URL: https://perishable-management-system.onrender.com/api/cron/email-notification/run
Schedule: Daily at 06:30 (IST - Asia/Kolkata)
Request Method: GET
Timeout: 30 seconds
```

**Purpose**:
- Fetches items expiring today, tomorrow, and in 2 days
- Sends HTML email to all managers
- Includes item details, quantities, and expiry dates

**Response** (immediate):
```json
{
  "success": true,
  "message": "Email notification job started",
  "status": "processing"
}
```

**Actual processing**: Emails sent in background, check backend logs for results.

---

### Job 4: Expiry Monitor 🔍 (Optional)

```
Title: Expiry Monitor
URL: https://perishable-management-system.onrender.com/api/cron/expiry-monitor/run
Schedule: Every 6 hours (0 */6 * * *)
Request Method: GET
Timeout: 30 seconds
```

**Purpose**: Monitors inventory and updates item statuses every 6 hours.

---

## 🎯 Cron-Job.org Setup Steps

### Step 1: Sign Up
1. Go to https://cron-job.org
2. Sign up with email
3. Verify email

### Step 2: Create Jobs

For each job above:

1. Click "Create Cron Job"
2. Fill in:
   - **Title**: Copy from above
   - **URL**: Copy exact URL from above
   - **Schedule**: Set as specified
   - **Request Method**: GET
   - **Timeout**: 30 seconds
3. Advanced Settings:
   - **Follow Redirects**: Yes
   - **Save Responses**: Yes (helps with debugging)
4. Click "Create"

### Step 3: Test Each Job

1. Click on the job
2. Click "Run now"
3. Check "Execution History"
4. Should see:
   ```
   Status: 200 OK
   Response: {"success":true,"message":"...job started",...}
   ```

---

## 🧪 Testing

### Test Manually First

```bash
# Test keep-alive
curl https://perishable-management-system.onrender.com/health

# Test pricing analysis
curl https://perishable-management-system.onrender.com/api/cron/pricing-analysis/run

# Test email notifications
curl https://perishable-management-system.onrender.com/api/cron/email-notification/run

# Test expiry monitor
curl https://perishable-management-system.onrender.com/api/cron/expiry-monitor/run
```

### Expected Responses

**Keep-Alive**:
```json
{
  "status": "OK",
  "message": "Server is running smoothly 🚀",
  "timestamp": "2025-11-09T..."
}
```

**All Other Jobs**:
```json
{
  "success": true,
  "message": "Job started",
  "status": "processing"
}
```

---

## 📊 Monitoring

### Check Backend Logs on Render

1. Go to Render Dashboard
2. Click your Backend Service
3. Click "Logs"
4. Look for:
   ```
   📡 Manual pricing analysis trigger received
   ✅ Pricing analysis job completed: {...}
   ```

### Check Cron-Job.org Execution History

1. Click on a cron job
2. Click "Execution History"
3. See all past executions
4. Check response times and status codes

---

## ⏰ Schedule Explanation

### Keep-Alive: `*/14 * * * *`
- Runs every 14 minutes
- Keeps backend warm (free tier spins down after 15 min)
- Critical for fast response times

### Pricing Analysis: `0 7 * * *`
- Runs daily at 7:00 AM IST
- Analyzes inventory for discount opportunities
- Creates suggestions for managers to review

### Email Notifications: `30 6 * * *`
- Runs daily at 6:30 AM IST
- Sends before pricing analysis
- Managers get yesterday's alerts first

### Expiry Monitor: `0 */6 * * *`
- Runs every 6 hours (12 AM, 6 AM, 12 PM, 6 PM)
- Continuous monitoring of inventory
- Updates item statuses

---

## 🚨 Troubleshooting

### Issue: Job shows "Timeout"

**Solution**: 
- This shouldn't happen anymore (jobs respond in <1 second)
- If it does, check if backend is running
- Test URL manually with curl

### Issue: Job shows "404 Not Found"

**Solution**:
- Check URL is correct (copy-paste from this document)
- Make sure `/run` is at the end
- Verify backend is deployed

### Issue: Job shows "500 Internal Server Error"

**Solution**:
- Check backend logs on Render
- Verify environment variables are set
- Test endpoint manually

### Issue: Emails not being sent

**Check**:
1. Backend environment variables:
   - `EMAIL_USER` = your Gmail
   - `EMAIL_PASSWORD` = Gmail app password (not regular password)
   - `EMAIL_HOST` = smtp.gmail.com
   - `EMAIL_PORT` = 587
2. Backend logs for email errors
3. Gmail app password is correct

---

## 💡 Pro Tips

### 1. Stagger Job Times
Current setup:
- 6:30 AM: Email notifications
- 7:00 AM: Pricing analysis
- Every 6 hours: Expiry monitor
- Every 14 min: Keep-alive

This prevents all jobs from running at once.

### 2. Enable Email Alerts
In cron-job.org:
- Settings → Notifications
- Add your email
- Get notified if jobs fail

### 3. Save Responses
Enable "Save Responses" in job settings to see what backend returns. Helps with debugging!

### 4. Check Logs Regularly
First few days:
- Check backend logs daily
- Verify jobs are running
- Confirm emails are being sent
- Check discount suggestions are created

---

## 📈 Success Metrics

After setup, you should see:

### Daily (6:30 AM)
- ✅ Email sent to all managers
- ✅ Email contains expiring items
- ✅ Managers receive notification

### Daily (7:00 AM)
- ✅ Pricing analysis completes
- ✅ Discount suggestions created
- ✅ Suggestions appear in Pricing page

### Every 14 Minutes
- ✅ Backend stays warm
- ✅ Fast response times (<1 second)
- ✅ No cold starts for users

### Every 6 Hours
- ✅ Inventory monitored
- ✅ Item statuses updated
- ✅ Alerts generated

---

## 🎉 Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Environment variables set (EMAIL_*, SUPABASE_*)
- [ ] Signed up for cron-job.org
- [ ] Created "Keep Backend Alive" job (every 14 min)
- [ ] Created "Pricing Analysis" job (daily 7:00 AM)
- [ ] Created "Email Notifications" job (daily 6:30 AM)
- [ ] Created "Expiry Monitor" job (every 6 hours) - Optional
- [ ] Tested all jobs manually
- [ ] Checked execution history
- [ ] Verified backend logs
- [ ] Confirmed emails are being sent
- [ ] Set up email alerts for job failures

---

## 📞 Support

### If Jobs Fail
1. Check cron-job.org execution history
2. Check Render backend logs
3. Test endpoints manually with curl
4. Verify environment variables

### If Emails Don't Send
1. Check Gmail app password
2. Check backend logs for email errors
3. Test email endpoint manually
4. Verify EMAIL_* environment variables

---

## 🚀 You're All Set!

Your automated system is now running 24/7:
- ✅ Backend stays alive
- ✅ Daily pricing analysis
- ✅ Daily email notifications
- ✅ Continuous inventory monitoring

**Last Updated**: November 9, 2025  
**Status**: ✅ Production Ready
