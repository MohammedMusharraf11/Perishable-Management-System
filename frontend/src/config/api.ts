// API Configuration
// This will use the environment variable in production, or localhost in development

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to build API URLs
export const getApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Export commonly used endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Admin
  PENDING_MANAGERS: `${API_BASE_URL}/api/admin/pending-managers`,
  APPROVE_MANAGER: `${API_BASE_URL}/api/admin/approve-manager`,
  USERS: `${API_BASE_URL}/api/admin/users`,
  AUDIT_LOGS: `${API_BASE_URL}/api/admin/audit-logs/user-management`,
  
  // Inventory
  INVENTORY: `${API_BASE_URL}/api/inventory`,
  
  // Alerts
  ALERTS: `${API_BASE_URL}/api/alerts`,
  
  // Audit Logs
  AUDIT_LOGS_BASE: `${API_BASE_URL}/api/audit-logs`,
  
  // Discount Suggestions
  DISCOUNT_SUGGESTIONS_PENDING: `${API_BASE_URL}/api/discount-suggestions/pending`,
  DISCOUNT_SUGGESTIONS_APPROVED: `${API_BASE_URL}/api/discount-suggestions/approved`,
  DISCOUNT_SUGGESTIONS_STATS: `${API_BASE_URL}/api/discount-suggestions/stats`,
  DISCOUNT_SUGGESTIONS_ANALYZE: `${API_BASE_URL}/api/discount-suggestions/analyze`,
  
  // Promotions
  PROMOTIONS_SUGGESTIONS: `${API_BASE_URL}/api/promotions/suggestions`,
  
  // Reports
  REPORTS_DASHBOARD: `${API_BASE_URL}/api/reports/dashboard`,
  
  // Cron
  CRON_EMAIL_NOTIFICATION: `${API_BASE_URL}/api/cron/email-notification/run`,
};
