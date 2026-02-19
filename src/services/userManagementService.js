// ========================================
// services/userManagementService.js - User Management Service
// ========================================

import apiService from './api.js';

class UserManagementService {
  constructor() {
    this.storage = this.getStorageMethod();
  }

  // Detect available storage method (same as AuthService)
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

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.storage.getItem('authToken');
    return !!token;
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
  // USER VERIFICATION
  // ========================================

  // Upload verification documents
  async uploadVerificationDocument(documentType, file, additionalData = {}) {
    try {
      console.log(`📄 Uploading ${documentType} verification document...`);

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!file) {
        throw new Error('File is required');
      }

      if (!documentType) {
        throw new Error('Document type is required');
      }

      const uploadData = {
        documentType: documentType,
        ...additionalData
      };

      const response = await apiService.uploadFile('/user/verification/documents', file, uploadData);

      return response;
    } catch (error) {
      console.error('❌ Upload verification document failed:', error.message);
      throw error;
    }
  }

  // Upload national ID/passport
  async uploadNationalDocument(file, documentType = 'national_id') {
    return await this.uploadVerificationDocument(documentType, file, { category: 'identity' });
  }

  // Upload address verification document
  async uploadAddressDocument(file, documentType = 'utility_bill') {
    return await this.uploadVerificationDocument(documentType, file, { category: 'address' });
  }

  // Upload bank statement
  async uploadBankStatement(file) {
    return await this.uploadVerificationDocument('bank_statement', file, { category: 'financial' });
  }

  // Upload face verification photo
  async uploadFaceVerification(file) {
    return await this.uploadVerificationDocument('face_photo', file, { category: 'biometric' });
  }

  // Get verification status
  async getVerificationStatus() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/verification/status');

      return response;
    } catch (error) {
      console.error('❌ Get verification status failed:', error.message);
      throw error;
    }
  }

  // Submit verification for review
  async submitVerificationForReview(verificationType) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!verificationType) {
        throw new Error('Verification type is required');
      }

      const response = await this.requestWithRetry('/user/verification/submit', {
        method: 'POST',
        body: JSON.stringify({ verificationType })
      });

      return response;
    } catch (error) {
      console.error('❌ Submit verification failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // USER TIER MANAGEMENT
  // ========================================

  // Get user tier information
  async getUserTierInfo() {
    try {
      console.log('🏆 Fetching user tier information...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/tier');

      return response;
    } catch (error) {
      console.error('❌ Get user tier failed:', error.message);
      throw error;
    }
  }

  // Get tier requirements
  async getTierRequirements(tier = null) {
    try {

      const endpoint = tier ? `/user/tier/requirements?tier=${tier}` : '/user/tier/requirements';
      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get tier requirements failed:', error.message);
      throw error;
    }
  }

  // Request tier upgrade
  async requestTierUpgrade(targetTier) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!targetTier) {
        throw new Error('Target tier is required');
      }

      const response = await this.requestWithRetry('/user/tier/upgrade', {
        method: 'POST',
        body: JSON.stringify({ targetTier })
      });

      return response;
    } catch (error) {
      console.error('❌ Request tier upgrade failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // BIOMETRIC AUTHENTICATION
  // ========================================

  // Enable biometric authentication
  async enableBiometrics(biometricData) {
    try {
      console.log('🔐 Enabling biometric authentication...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/biometrics/enable', {
        method: 'POST',
        body: JSON.stringify(biometricData)
      });

      return response;
    } catch (error) {
      console.error('❌ Enable biometrics failed:', error.message);
      throw error;
    }
  }

  // Disable biometric authentication
  async disableBiometrics() {
    try {
      console.log('🔓 Disabling biometric authentication...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/biometrics/disable', {
        method: 'POST'
      });

      return response;
    } catch (error) {
      console.error('❌ Disable biometrics failed:', error.message);
      throw error;
    }
  }

  // Verify biometric authentication
  async verifyBiometrics(biometricData) {
    try {
      console.log('👆 Verifying biometric authentication...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/biometrics/verify', {
        method: 'POST',
        body: JSON.stringify(biometricData)
      });

      return response;
    } catch (error) {
      console.error('❌ Biometric verification failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // SOCIAL ACCOUNT MANAGEMENT
  // ========================================

  // Connect social account
  async connectSocialAccount(platform, credentials) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!platform) {
        throw new Error('Platform is required');
      }

      const response = await this.requestWithRetry('/user/social/connect', {
        method: 'POST',
        body: JSON.stringify({ platform, credentials })
      });

      return response;
    } catch (error) {
      console.error('❌ Connect social account failed:', error.message);
      throw error;
    }
  }

  // Disconnect social account
  async disconnectSocialAccount(platform) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!platform) {
        throw new Error('Platform is required');
      }

      const response = await this.requestWithRetry('/user/social/disconnect', {
        method: 'POST',
        body: JSON.stringify({ platform })
      });

      return response;
    } catch (error) {
      console.error('❌ Disconnect social account failed:', error.message);
      throw error;
    }
  }

  // Get connected social accounts
  async getConnectedSocialAccounts() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/social/accounts');

      return response;
    } catch (error) {
      console.error('❌ Get connected social accounts failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // SECURITY SETTINGS
  // ========================================

  // Enable two-factor authentication
  async enableTwoFactorAuth() {
    try {
      console.log('🔐 Enabling two-factor authentication...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/security/2fa/enable', {
        method: 'POST'
      });

      return response;
    } catch (error) {
      console.error('❌ Enable 2FA failed:', error.message);
      throw error;
    }
  }

  // Disable two-factor authentication
  async disableTwoFactorAuth(verificationCode) {
    try {
      console.log('🔓 Disabling two-factor authentication...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/security/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ verificationCode })
      });

      return response;
    } catch (error) {
      console.error('❌ Disable 2FA failed:', error.message);
      throw error;
    }
  }

  // Get security settings
  async getSecuritySettings() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/security/settings');

      return response;
    } catch (error) {
      console.error('❌ Get security settings failed:', error.message);
      throw error;
    }
  }

  // Update security settings
  async updateSecuritySettings(securityData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/security/settings', {
        method: 'PUT',
        body: JSON.stringify(securityData)
      });

      return response;
    } catch (error) {
      console.error('❌ Update security settings failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // WALLET MANAGEMENT
  // ========================================

  // Update wallet address
  async updateWalletAddress(currency, address) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!currency || !address) {
        throw new Error('Currency and address are required');
      }

      const response = await this.requestWithRetry('/user/wallet/address', {
        method: 'PUT',
        body: JSON.stringify({ currency, address })
      });

      return response;
    } catch (error) {
      console.error('❌ Update wallet address failed:', error.message);
      throw error;
    }
  }

  // Refresh wallet balances
  async refreshWalletBalances() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/wallet/refresh', {
        method: 'POST'
      });

      return response;
    } catch (error) {
      console.error('❌ Refresh wallet balances failed:', error.message);
      throw error;
    }
  }

  // Get wallet transaction history
  async getWalletTransactionHistory(currency = null, filters = {}) {
    try {
      console.log('📈 Fetching wallet transaction history...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const queryParams = new URLSearchParams();
      
      if (currency) queryParams.append('currency', currency);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/user/wallet/transactions?${queryString}` : '/user/wallet/transactions';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get wallet transaction history failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // NOTIFICATION SETTINGS
  // ========================================

  // Get notification preferences
  async getNotificationPreferences() {
    try {
      console.log('🔔 Fetching notification preferences...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/notifications/preferences');

      return response;
    } catch (error) {
      console.error('❌ Get notification preferences failed:', error.message);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });

      return response;
    } catch (error) {
      console.error('❌ Update notification preferences failed:', error.message);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(filters = {}) {
    try {
      console.log('📨 Fetching user notifications...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.read !== undefined) queryParams.append('read', filters.read);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/user/notifications?${queryString}` : '/user/notifications';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get user notifications failed:', error.message);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      const response = await this.requestWithRetry(`/user/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      return response;
    } catch (error) {
      console.error('❌ Mark notification as read failed:', error.message);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      const response = await this.requestWithRetry(`/user/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('❌ Delete notification failed:', error.message);
      throw error;
    }
  }
}

export default new UserManagementService();