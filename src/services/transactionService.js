// ========================================
// services/transactionService.js - FIXED: Correct API Endpoints
// ========================================

import apiService from './api.js';

class TransactionService {
  constructor() {
    this.storage = this.getStorageMethod();
  }

  // Detect available storage method
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

  async requestWithRetry(endpoint, options = {}, maxRetries = 2) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
        
        return await apiService.request(endpoint, options);
      } catch (error) {
        lastError = error;
        
        // 🔥 SILENT: Don't retry or log "no data" errors
        const isNoDataError = error.message.includes('Failed to retrieve transaction');
        
        if (isNoDataError || 
            error.message.includes('401') || 
            error.message.includes('403')) {
          throw error;
        }
        
        // Only log retry attempts for real errors
        if (i > 0) {
          console.warn(`⚠️ Retry attempt ${i + 1} failed:`, error.message);
        }
      }
    }
    
    throw lastError;
  }

  // ========================================
  // TRANSACTION MANAGEMENT
  // ========================================

  /**
   * 🔥 NEW: Get current active transaction
   * @returns {Promise<Object>} Current transaction or null
   */
  async getCurrentTransaction() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/transaction/current');

      // 🔥 FIX: API returns data under response.data, not response.transaction
      if (response && (response.data || response.transaction)) {
        return { transaction: response.data || response.transaction };
      }

      return { transaction: null };
    } catch (error) {
      // Silent fail for "no active transaction" errors
      if (error.message.includes('No active transaction') || 
          error.message.includes('not found')) {
        return { transaction: null };
      }
      
      console.error('❌ Get current transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all user transactions (incoming and outgoing)
   * 🔥 FIXED: Uses correct endpoint /transaction/my-transactions
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Transaction data
   */
  async getUserTransactions(filters = {}) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.currency) queryParams.append('currency', filters.currency);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);
      
      // Add cache buster
      queryParams.append('_t', Date.now());

      const queryString = queryParams.toString();
      // 🔥 FIXED: Use correct endpoint
      const endpoint = queryString 
        ? `/transaction/my-transactions?${queryString}` 
        : '/transaction/my-transactions';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get user transactions failed:', error.message);
      throw error;
    }
  }

  /**
   * Get incoming transactions (received)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Transaction data
   */
  async getIncomingTransactions(filters = {}) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('direction', 'incoming');
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.currency) queryParams.append('currency', filters.currency);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);
      
      queryParams.append('_t', Date.now());

      // 🔥 FIXED: Use correct endpoint
      const endpoint = `/transaction/my-transactions?${queryParams.toString()}`;
      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      // 🔥 SILENT: Only log if NOT a "no data" error
      if (!error.message.includes('Failed to retrieve transaction')) {
        console.error('❌ Get incoming transactions failed:', error.message);
      }
      throw error;
    }
  }

  async getOutgoingTransactions(filters = {}) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('direction', 'outgoing');
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.currency) queryParams.append('currency', filters.currency);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);
      
      queryParams.append('_t', Date.now());

      // 🔥 FIXED: Use correct endpoint
      const endpoint = `/transaction/my-transactions?${queryParams.toString()}`;
      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      // 🔥 SILENT: Only log if NOT a "no data" error
      if (!error.message.includes('Failed to retrieve transaction')) {
        console.error('❌ Get outgoing transactions failed:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get transaction by ID
   * 🔥 FIXED: Uses correct endpoint format
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionById(transactionId) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      // 🔥 FIXED: Correct endpoint format
      const response = await this.requestWithRetry(`/transaction/${transactionId}`);

      return response;
    } catch (error) {
      console.error('❌ Get transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Release funds to buyer
   * @param {Object} releaseData - Release data
   * @returns {Promise<Object>} API response
   */
  async releaseFunds(releaseData) {
    try {
      console.log('💸 ============ RELEASING FUNDS ============');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!releaseData.transactionId) {
        throw new Error('Transaction ID is required');
      }

      if (!releaseData.pin) {
        throw new Error('Transaction PIN is required');
      }

      const response = await this.requestWithRetry('/transaction/release-funds', {
        method: 'POST',
        body: JSON.stringify(releaseData)
      });

      console.log('Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ ============ RELEASE FAILED ============');
      console.error('Error Message:', error.message);
      console.error('Full Error:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} API response
   */
  async createTransaction(transactionData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!transactionData.sellOrderId) {
        throw new Error('Sell order ID is required');
      }

      if (!transactionData.amount) {
        throw new Error('Amount is required');
      }

      if (!transactionData.currency) {
        throw new Error('Currency is required');
      }

      const response = await this.requestWithRetry('/transaction/create', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

      console.log('Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ ============ TRANSACTION CREATION FAILED ============');
      console.error('Error Message:', error.message);
      console.error('Full Error:', error);
      throw error;
    }
  }

  /**
   * Cancel a transaction
   * @param {string} transactionId - Transaction ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} API response
   */
  async cancelTransaction(transactionId, reason = '') {
    try {
      console.log(`❌ Cancelling transaction ${transactionId}...`);

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      const response = await this.requestWithRetry(`/transaction/${transactionId}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });

      return response;
    } catch (error) {
      console.error('❌ Cancel transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Dispute a transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} disputeData - Dispute data
   * @returns {Promise<Object>} API response
   */
  async disputeTransaction(transactionId, disputeData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      if (!disputeData.reason) {
        throw new Error('Dispute reason is required');
      }

      const response = await this.requestWithRetry(`/transaction/${transactionId}/dispute`, {
        method: 'POST',
        body: JSON.stringify(disputeData)
      });

      return response;
    } catch (error) {
      console.error('❌ Dispute transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   * @returns {Promise<Object>} Transaction statistics
   */
  async getTransactionStats() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/transaction/stats');

      return response;
    } catch (error) {
      console.error('❌ Get transaction stats failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify transaction hash on blockchain
   * @param {string} transactionHash - Transaction hash
   * @param {string} network - Network name
   * @returns {Promise<Object>} Verification result
   */
  async verifyTransactionHash(transactionHash, network) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!transactionHash || !network) {
        throw new Error('Transaction hash and network are required');
      }

      const response = await this.requestWithRetry('/transaction/verify-hash', {
        method: 'POST',
        body: JSON.stringify({ transactionHash, network })
      });

      return response;
    } catch (error) {
      console.error('❌ Verify transaction hash failed:', error.message);
      throw error;
    }
  }

  /**
   * Export transactions to CSV
   * @param {Object} filters - Filter options
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportTransactions(filters = {}) {
    try {
      console.log('📥 Exporting transactions...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);

      const endpoint = `/transaction/export?${queryParams.toString()}`;
      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Export transactions failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // WALLET TRANSACTION HISTORY (NEW API)
  // ========================================

  /**
   * Get wallet transaction history
   * @param {Object} filters - Filter options (ignored - no filters applied)
   * @returns {Promise<Object>} Wallet transaction history
   */
  async getWalletTransactionHistory(filters = {}) {
    try {
      console.log('📊 Fetching wallet transaction history (no filters)...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // 🔥 FIXED: No query parameters - clean endpoint only
      const endpoint = '/wallet-transaction/history';

      const response = await this.requestWithRetry(endpoint);

      console.log('✅ Wallet transaction history fetched:', {
        total: response.pagination?.total || 0,
        deposits: response.summary?.totalDeposits || 0,
        withdrawals: response.summary?.totalWithdrawals || 0
      });

      return response;
    } catch (error) {
      // Silent fail for "no data" errors
      if (error.message.includes('No transactions found') || 
          error.message.includes('not found')) {
        return { 
          status: true,
          data: [], 
          pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
          summary: {
            totalWithdrawals: 0,
            totalDeposits: 0,
            totalTrades: 0,
            totalVolume: 0
          }
        };
      }
      
      console.error('❌ Get wallet transaction history failed:', error.message);
      throw error;
    }
  }

  /**
   * Get incoming wallet transactions (deposits)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Incoming transactions
   */
  async getIncomingWalletTransactions(filters = {}) {
    return this.getWalletTransactionHistory({ ...filters, type: 'deposit' });
  }

  /**
   * Get outgoing wallet transactions (withdrawals)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Outgoing transactions
   */
  async getOutgoingWalletTransactions(filters = {}) {
    return this.getWalletTransactionHistory({ ...filters, type: 'withdrawal' });
  }
}

export default new TransactionService();