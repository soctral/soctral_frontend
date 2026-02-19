// ========================================
// services/adminService.js - Admin Service
// ========================================

import apiService from './api.js';

class AdminService {
  constructor() {
    this.storage = this.getStorageMethod();
  }

  // Detect available storage method (same as other services)
  getStorageMethod() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return {
        setItem: (key, value) => localStorage.setItem(key, value),
        getItem: (key) => localStorage.getItem(key),
        removeItem: (key) => localStorage.removeItem(key),
        isAvailable: true
      };
    } catch (e) {
      console.warn('⚠️ localStorage not available, using memory storage');
      const memoryStorage = {};
      return {
        setItem: (key, value) => { memoryStorage[key] = value; },
        getItem: (key) => memoryStorage[key] || null,
        removeItem: (key) => { delete memoryStorage[key]; },
        isAvailable: false
      };
    }
  }

  // Check if user is authenticated and has admin role
  isAdminAuthenticated() {
    const token = this.storage.getItem('authToken');
    const userData = this.storage.getItem('userData');
    
    if (!token || !userData) return false;
    
    try {
      const user = JSON.parse(userData);
      return user.role === 'admin' || user.role === 'super_admin';
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      return false;
    }
  }

  // Get stored user data
  getUserData() {
    try {
      const userData = this.storage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      this.storage.removeItem('userData');
      return null;
    }
  }

  // API request with retry logic
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (i > 0) {
      return response;
    } catch (error) {
      console.error('❌ Reject verification failed:', error.message);
      throw error;
    }
  }

  // Get verification history
  async getVerificationHistory(userId) {
    try {
      console.log(`📈 Fetching verification history for user ${userId}...`);

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await this.requestWithRetry(`/admin/verifications/history/${userId}`);

      return response;
    } catch (error) {
      console.error('❌ Get verification history failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // MARKETPLACE MANAGEMENT
  // ========================================

  // Get all sell orders (admin view)
  async getAllSellOrdersAdmin(filters = {}) {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.platform) queryParams.append('platform', filters.platform);
      if (filters.sellerId) queryParams.append('sellerId', filters.sellerId);
      if (filters.reported) queryParams.append('reported', filters.reported);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/admin/marketplace/sell-orders?${queryString}` : '/admin/marketplace/sell-orders';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get all sell orders failed:', error.message);
      throw error;
    }
  }

  // Get all buy orders (admin view)
  async getAllBuyOrdersAdmin(filters = {}) {
    try {
      console.log('🛒 Fetching all buy orders (admin)...');

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.buyerId) queryParams.append('buyerId', filters.buyerId);
      if (filters.sellerId) queryParams.append('sellerId', filters.sellerId);
      if (filters.reported) queryParams.append('reported', filters.reported);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/admin/marketplace/buy-orders?${queryString}` : '/admin/marketplace/buy-orders';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get all buy orders failed:', error.message);
      throw error;
    }
  }

  // Suspend sell order
  async suspendSellOrder(orderId, reason) {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!orderId || !reason) {
        throw new Error('Order ID and reason are required');
      }

      const response = await this.requestWithRetry(`/admin/marketplace/sell-orders/${orderId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      return response;
    } catch (error) {
      console.error('❌ Suspend sell order failed:', error.message);
      throw error;
    }
  }

  // Unsuspend sell order
  async unsuspendSellOrder(orderId, reason = '') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/admin/marketplace/sell-orders/${orderId}/unsuspend`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      return response;
    } catch (error) {
      console.error('❌ Unsuspend sell order failed:', error.message);
      throw error;
    }
  }

  // Force complete transaction
  async forceCompleteTransaction(transactionId, reason) {
    try {
      console.log(`🔨 Force completing transaction ${transactionId}...`);

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!transactionId || !reason) {
        throw new Error('Transaction ID and reason are required');
      }

      const response = await this.requestWithRetry(`/admin/marketplace/transactions/${transactionId}/force-complete`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      return response;
    } catch (error) {
      console.error('❌ Force complete transaction failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // REPORTS MANAGEMENT
  // ========================================

  // Get all reports
  async getAllReports(filters = {}) {
    try {
      console.log('🚨 Fetching all reports...');

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.reporterId) queryParams.append('reporterId', filters.reporterId);
      if (filters.targetId) queryParams.append('targetId', filters.targetId);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/admin/reports?${queryString}` : '/admin/reports';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get all reports failed:', error.message);
      throw error;
    }
  }

  // Handle report
  async handleReport(reportId, action, notes = '') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!reportId || !action) {
        throw new Error('Report ID and action are required');
      }

      const response = await this.requestWithRetry(`/admin/reports/${reportId}/handle`, {
        method: 'POST',
        body: JSON.stringify({ action, notes })
      });

      return response;
    } catch (error) {
      console.error('❌ Handle report failed:', error.message);
      throw error;
    }
  }

  // Close report
  async closeReport(reportId, resolution, notes = '') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!reportId || !resolution) {
        throw new Error('Report ID and resolution are required');
      }

      const response = await this.requestWithRetry(`/admin/reports/${reportId}/close`, {
        method: 'POST',
        body: JSON.stringify({ resolution, notes })
      });

      return response;
    } catch (error) {
      console.error('❌ Close report failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // SYSTEM ANALYTICS
  // ========================================

  // Get platform statistics
  async getPlatformStatistics(timeRange = '30d') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry(`/admin/analytics/platform?timeRange=${timeRange}`);

      return response;
    } catch (error) {
      console.error('❌ Get platform statistics failed:', error.message);
      throw error;
    }
  }

  // Get user analytics
  async getUserAnalytics(timeRange = '30d') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry(`/admin/analytics/users?timeRange=${timeRange}`);

      return response;
    } catch (error) {
      console.error('❌ Get user analytics failed:', error.message);
      throw error;
    }
  }

  // Get marketplace analytics
  async getMarketplaceAnalytics(timeRange = '30d') {
    try {
      console.log('📈 Fetching marketplace analytics...');

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry(`/admin/analytics/marketplace?timeRange=${timeRange}`);

      return response;
    } catch (error) {
      console.error('❌ Get marketplace analytics failed:', error.message);
      throw error;
    }
  }

  // Get revenue analytics
  async getRevenueAnalytics(timeRange = '30d') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry(`/admin/analytics/revenue?timeRange=${timeRange}`);

      return response;
    } catch (error) {
      console.error('❌ Get revenue analytics failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // SYSTEM CONFIGURATION
  // ========================================

  // Get system configuration
  async getSystemConfiguration() {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry('/admin/system/config');

      return response;
    } catch (error) {
      console.error('❌ Get system configuration failed:', error.message);
      throw error;
    }
  }

  // Update system configuration
  async updateSystemConfiguration(configData) {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry('/admin/system/config', {
        method: 'PUT',
        body: JSON.stringify(configData)
      });

      return response;
    } catch (error) {
      console.error('❌ Update system configuration failed:', error.message);
      throw error;
    }
  }

  // Get platform fees configuration
  async getPlatformFeesConfig() {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry('/admin/system/fees');

      return response;
    } catch (error) {
      console.error('❌ Get platform fees config failed:', error.message);
      throw error;
    }
  }

  // Update platform fees configuration
  async updatePlatformFeesConfig(feesData) {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry('/admin/system/fees', {
        method: 'PUT',
        body: JSON.stringify(feesData)
      });

      return response;
    } catch (error) {
      console.error('❌ Update platform fees config failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // AUDIT LOGS
  // ========================================

  // Get audit logs
  async getAuditLogs(filters = {}) {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.adminId) queryParams.append('adminId', filters.adminId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/admin/audit-logs?${queryString}` : '/admin/audit-logs';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get audit logs failed:', error.message);
      throw error;
    }
  }

  // Export audit logs
  async exportAuditLogs(filters = {}, format = 'csv') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.adminId) queryParams.append('adminId', filters.adminId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('format', format);

      const queryString = queryParams.toString();
      const endpoint = `/admin/audit-logs/export?${queryString}`;

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Export audit logs failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // ADMIN UTILITIES
  // ========================================

  // Send system notification to all users
  async sendSystemNotification(notificationData) {
    try {
      console.log('📢 Sending system notification...');

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!notificationData.title || !notificationData.message) {
        throw new Error('Notification title and message are required');
      }

      const response = await this.requestWithRetry('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(notificationData)
      });

      return response;
    } catch (error) {
      console.error('❌ Send system notification failed:', error.message);
      throw error;
    }
  }

  // Backup system data
  async backupSystemData() {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry('/admin/system/backup', {
        method: 'POST'
      });

      return response;
    } catch (error) {
      console.error('❌ Create system backup failed:', error.message);
      throw error;
    }
  }

  // Get system health status
  async getSystemHealth() {
    try {
      console.log('💊 Checking system health...');

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const response = await this.requestWithRetry('/admin/system/health');

      return response;
    } catch (error) {
      console.error('❌ Get system health failed:', error.message);
      throw error;
    }
  }
}

export default new AdminService();(`🔄 Retry attempt ${i + 1} for ${endpoint}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
        
        return await apiService.request(endpoint, options);
      } catch (error) {
        lastError = error;
        console.warn(`❌ Attempt ${i + 1} failed:`, error.message);
        
        // Don't retry on authentication errors
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  // ========================================
  // USER MANAGEMENT
  // ========================================

  // Get all users
  async getAllUsers(filters = {}) {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.verified) queryParams.append('verified', filters.verified);
      if (filters.tier) queryParams.append('tier', filters.tier);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.search) queryParams.append('search', filters.search);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get all users failed:', error.message);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await this.requestWithRetry(`/admin/users/${userId}`);

      return response;
    } catch (error) {
      console.error('❌ Get user failed:', error.message);
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(userId, status, reason = '') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!userId || !status) {
        throw new Error('User ID and status are required');
      }

      const response = await this.requestWithRetry(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      });

      return response;
    } catch (error) {
      console.error('❌ Update user status failed:', error.message);
      throw error;
    }
  }

  // Ban user
  async banUser(userId, reason, duration = 'permanent') {
    try {
      console.log(`🚫 Banning user ${userId}...`);

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!userId || !reason) {
        throw new Error('User ID and reason are required');
      }

      const response = await this.requestWithRetry(`/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason, duration })
      });

      return response;
    } catch (error) {
      console.error('❌ Ban user failed:', error.message);
      throw error;
    }
  }

  // Unban user
  async unbanUser(userId, reason = '') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await this.requestWithRetry(`/admin/users/${userId}/unban`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      return response;
    } catch (error) {
      console.error('❌ Unban user failed:', error.message);
      throw error;
    }
  }

  // Update user tier
  async updateUserTier(userId, tier, reason = '') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!userId || !tier) {
        throw new Error('User ID and tier are required');
      }

      const response = await this.requestWithRetry(`/admin/users/${userId}/tier`, {
        method: 'PUT',
        body: JSON.stringify({ tier, reason })
      });

      return response;
    } catch (error) {
      console.error('❌ Update user tier failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // VERIFICATION MANAGEMENT
  // ========================================

  // Get pending verifications
  async getPendingVerifications(filters = {}) {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/admin/verifications/pending?${queryString}` : '/admin/verifications/pending';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get pending verifications failed:', error.message);
      throw error;
    }
  }

  // Approve verification
  async approveVerification(verificationId, notes = '') {
    try {

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!verificationId) {
        throw new Error('Verification ID is required');
      }

      const response = await this.requestWithRetry(`/admin/verifications/${verificationId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes })
      });

      return response;
    } catch (error) {
      console.error('❌ Approve verification failed:', error.message);
      throw error;
    }
  }

  // Reject verification
  async rejectVerification(verificationId, reason, notes = '') {
    try {
      console.log(`❌ Rejecting verification ${verificationId}...`);

      if (!this.isAdminAuthenticated()) {
        throw new Error('Admin authentication required');
      }

      if (!verificationId || !reason) {
        throw new Error('Verification ID and reason are required');
      }

      const response = await this.requestWithRetry(`/admin/verifications/${verificationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason, notes })
      });

      console.log