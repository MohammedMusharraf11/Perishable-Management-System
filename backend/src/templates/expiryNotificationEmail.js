/**
 * PMS-T-061: Create email template with HTML/CSS
 * 
 * Professional HTML Email Template for Expiry Notifications
 */

export const generateExpiryEmailHTML = (data) => {
  const { managerName, summary, items, dashboardUrl } = data;
  const { expired, expiringToday, expiringSoon, total } = summary;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Expiry Alert - PMS</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      color: #333;
      margin-bottom: 20px;
    }
    .summary-cards {
      display: flex;
      gap: 10px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    .summary-card {
      flex: 1;
      min-width: 150px;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card.expired {
      background-color: #fee2e2;
      border-left: 4px solid #dc2626;
    }
    .summary-card.today {
      background-color: #fed7aa;
      border-left: 4px solid #ea580c;
    }
    .summary-card.soon {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
    }
    .summary-card h3 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .summary-card p {
      margin: 5px 0 0 0;
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .item-card {
      background-color: #f9fafb;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .item-card.expired {
      border-left-color: #dc2626;
      background-color: #fef2f2;
    }
    .item-card.today {
      border-left-color: #ea580c;
      background-color: #fff7ed;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .item-name {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    .item-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-expired {
      background-color: #dc2626;
      color: white;
    }
    .badge-today {
      background-color: #ea580c;
      color: white;
    }
    .badge-soon {
      background-color: #f59e0b;
      color: white;
    }
    .item-details {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
    .item-details span {
      margin-right: 15px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
    .no-items {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }
    .no-items-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    @media only screen and (max-width: 600px) {
      .summary-cards {
        flex-direction: column;
      }
      .summary-card {
        min-width: 100%;
      }
      .item-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .item-badge {
        margin-top: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🔔 Daily Expiry Alert</h1>
      <p>Perishables Management System</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Hello <strong>${managerName}</strong>,
      </div>
      <p style="color: #6b7280; line-height: 1.6;">
        Here's your daily summary of items requiring attention. Please review and take necessary action to minimize waste.
      </p>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card expired">
          <h3>${expired}</h3>
          <p>Expired</p>
        </div>
        <div class="summary-card today">
          <h3>${expiringToday}</h3>
          <p>Expiring Today</p>
        </div>
        <div class="summary-card soon">
          <h3>${expiringSoon}</h3>
          <p>Expiring Soon</p>
        </div>
      </div>

      ${items.length > 0 ? `
      <!-- Items List -->
      <div class="items-section">
        <div class="section-title">📦 Items Requiring Attention (${items.length})</div>
        ${items.map(item => `
        <div class="item-card ${item.urgency}">
          <div class="item-header">
            <div class="item-name">${item.name}</div>
            <span class="item-badge badge-${item.urgency}">${item.urgencyLabel}</span>
          </div>
          <div class="item-details">
            <span><strong>SKU:</strong> ${item.sku}</span>
            <span><strong>Quantity:</strong> ${item.quantity} ${item.unit || 'units'}</span>
            <span><strong>Expiry:</strong> ${item.expiryDate}</span>
            ${item.category ? `<span><strong>Category:</strong> ${item.category}</span>` : ''}
          </div>
        </div>
        `).join('')}
      </div>
      ` : `
      <div class="no-items">
        <div class="no-items-icon">🎉</div>
        <p><strong>Great news!</strong> No items requiring immediate attention.</p>
      </div>
      `}

      <!-- Call to Action -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="${dashboardUrl}" class="cta-button">
          View Dashboard →
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 13px; margin-top: 20px; line-height: 1.6;">
        <strong>💡 Tip:</strong> Consider applying discounts to items expiring soon to minimize waste and maximize revenue.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        This is an automated notification from <strong>Perishables Management System</strong><br>
        <a href="${dashboardUrl}">Dashboard</a> • 
        <a href="${dashboardUrl}/alerts">View All Alerts</a> • 
        <a href="${dashboardUrl}/pricing">Manage Discounts</a>
      </p>
      <p style="margin-top: 10px;">
        © ${new Date().getFullYear()} PMS. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

// Plain text version for email clients that don't support HTML
export const generateExpiryEmailText = (data) => {
  const { managerName, summary, items, dashboardUrl } = data;
  const { expired, expiringToday, expiringSoon } = summary;

  let text = `
DAILY EXPIRY ALERT - Perishables Management System
==================================================

Hello ${managerName},

Here's your daily summary of items requiring attention:

SUMMARY:
--------
🔴 Expired: ${expired}
🟠 Expiring Today: ${expiringToday}
🟡 Expiring Soon: ${expiringSoon}

`;

  if (items.length > 0) {
    text += `\nITEMS REQUIRING ATTENTION (${items.length}):\n`;
    text += '----------------------------------------\n\n';
    
    items.forEach((item, index) => {
      text += `${index + 1}. ${item.name} [${item.urgencyLabel}]\n`;
      text += `   SKU: ${item.sku}\n`;
      text += `   Quantity: ${item.quantity} ${item.unit || 'units'}\n`;
      text += `   Expiry: ${item.expiryDate}\n`;
      if (item.category) text += `   Category: ${item.category}\n`;
      text += '\n';
    });
  } else {
    text += '\n🎉 Great news! No items requiring immediate attention.\n\n';
  }

  text += `\nVIEW DASHBOARD: ${dashboardUrl}\n`;
  text += `\n💡 Tip: Consider applying discounts to items expiring soon.\n`;
  text += `\n--\nThis is an automated notification from PMS\n`;
  text += `© ${new Date().getFullYear()} Perishables Management System\n`;

  return text.trim();
};
