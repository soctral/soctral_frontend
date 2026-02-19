// ========================================
// services/marketplaceService.js - Marketplace Service
// ========================================

import apiService from './api.js';

class MarketplaceService {
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
  // SOCIAL ACCOUNT MANAGEMENT
  // ========================================

  // Save social account metrics
  async saveSocialAccountMetrics(metricsData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!metricsData.platform) {
        throw new Error('Platform is required');
      }
      if (!metricsData.metrics) {
        throw new Error('Metrics data is required');
      }

      const response = await this.requestWithRetry('/social-accounts/metrics', {
        method: 'POST',
        body: JSON.stringify(metricsData)
      });

      return response;
    } catch (error) {
      console.error('❌ Save metrics failed:', error.message);
      throw error;
    }
  }

  // Save social account filters
  async saveSocialAccountFilters(filterData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!filterData.platform) {
        throw new Error('Platform is required');
      }
      if (!filterData.filters) {
        throw new Error('Filters data is required');
      }

      const response = await this.requestWithRetry('/social-accounts/filters', {
        method: 'POST',
        body: JSON.stringify(filterData)
      });

      return response;
    } catch (error) {
      console.error('❌ Save filters failed:', error.message);
      throw error;
    }
  }

  // Create complete social account listing (metrics + filters combined)
  async createSocialAccountListing(accountData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!accountData.platform) {
        throw new Error('Platform is required');
      }
      if (!accountData.accountType) {
        throw new Error('Account type is required');
      }
      if (!accountData.price) {
        throw new Error('Price is required');
      }

      const response = await this.requestWithRetry('/social-accounts', {
        method: 'POST',
        body: JSON.stringify(accountData)
      });

      return response;
    } catch (error) {
      console.error('❌ Create social account listing failed:', error.message);
      throw error;
    }
  }

  // Get all social accounts
  async getAllSocialAccounts(filters = {}) {
    try {

      const queryParams = new URLSearchParams();

      // Add filter parameters
      if (filters.platform) queryParams.append('platform', filters.platform);
      if (filters.minFollowers) queryParams.append('minFollowers', filters.minFollowers);
      if (filters.maxFollowers) queryParams.append('maxFollowers', filters.maxFollowers);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.niche) queryParams.append('niche', filters.niche);
      if (filters.verified) queryParams.append('verified', filters.verified);
      if (filters.originalEmail) queryParams.append('originalEmail', filters.originalEmail);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/social-accounts?${queryString}` : '/social-accounts';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get social accounts failed:', error.message);
      throw error;
    }
  }

  // Get user's own social accounts
  async getUserSocialAccounts() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/social-accounts/my-accounts');

      return response;
    } catch (error) {
      console.error('❌ Get user social accounts failed:', error.message);
      throw error;
    }
  }

  // Get social account by ID
  async getSocialAccountById(accountId) {
    try {

      if (!accountId) {
        throw new Error('Account ID is required');
      }

      const response = await this.requestWithRetry(`/social-accounts/${accountId}`);

      return response;
    } catch (error) {
      console.error('❌ Get social account failed:', error.message);
      throw error;
    }
  }

  // Update social account
  async updateSocialAccount(accountId, updateData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!accountId) {
        throw new Error('Account ID is required');
      }

      const response = await this.requestWithRetry(`/social-accounts/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return response;
    } catch (error) {
      console.error('❌ Update social account failed:', error.message);
      throw error;
    }
  }

  // Delete social account
  async deleteSocialAccount(accountId) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!accountId) {
        throw new Error('Account ID is required');
      }

      const response = await this.requestWithRetry(`/social-accounts/${accountId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('❌ Delete social account failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // SELL ORDERS
  // ========================================

  async createSellOrder(sellOrderData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Sell Order Data Validation:', {
        platform: {
          exists: !!sellOrderData.platform,
          value: sellOrderData.platform,
          type: typeof sellOrderData.platform
        },
        price: {
          exists: !!sellOrderData.price,
          value: sellOrderData.price,
          type: typeof sellOrderData.price,
          isNumber: typeof sellOrderData.price === 'number'
        },
        currency: {
          exists: !!sellOrderData.currency,
          value: sellOrderData.currency,
          type: typeof sellOrderData.currency
        },
        accountType: {
          exists: !!sellOrderData.accountType,
          value: sellOrderData.accountType,
          type: typeof sellOrderData.accountType
        },
        description: {
          exists: !!sellOrderData.description,
          value: sellOrderData.description,
          type: typeof sellOrderData.description,
          length: sellOrderData.description?.length
        },
        quantity: {
          exists: sellOrderData.quantity !== undefined,
          value: sellOrderData.quantity,
          type: typeof sellOrderData.quantity,
          isNumber: typeof sellOrderData.quantity === 'number'
        },
        isFeatured: {
          exists: sellOrderData.isFeatured !== undefined,
          value: sellOrderData.isFeatured,
          type: typeof sellOrderData.isFeatured
        },
        metrics: {
          exists: !!sellOrderData.metrics,
          isArray: Array.isArray(sellOrderData.metrics),
          count: sellOrderData.metrics?.length,
          items: sellOrderData.metrics?.map(m => ({
            key: m.key,
            value: m.value,
            type: m.type,
            valueType: typeof m.value
          }))
        },
        filters: {
          exists: !!sellOrderData.filters,
          isArray: Array.isArray(sellOrderData.filters),
          count: sellOrderData.filters?.length,
          items: sellOrderData.filters?.map(f => ({
            key: f.key,
            value: f.value,
            type: f.type,
            valueType: typeof f.value
          }))
        }
      });

      // Validate required fields
      if (!sellOrderData.platform) {
        throw new Error('Platform is required');
      }

      if (!sellOrderData.accountType) {
        throw new Error('Account type is required');
      }

      if (!sellOrderData.price) {
        throw new Error('Price is required');
      }


      const response = await this.requestWithRetry('/sell-orders', {
        method: 'POST',
        body: JSON.stringify(sellOrderData)
      });

      return response;
    } catch (error) {
      console.error('❌ ============ SELL ORDER FAILED ============');
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Full Error:', error);
      throw error;
    }
  }

  // Get all sell orders
  async getAllSellOrders(filters = {}) {
    try {

      const queryParams = new URLSearchParams();

      // Add filter parameters
      if (filters.platform) queryParams.append('platform', filters.platform);
      if (filters.accountType) queryParams.append('accountType', filters.accountType);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.verified) queryParams.append('verified', filters.verified);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/sell-orders?${queryString}` : '/sell-orders';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get sell orders failed:', error.message);
      throw error;
    }
  }

  async getUserSellOrders() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Add cache-busting timestamp to URL (this works without CORS issues)
      const timestamp = Date.now();
      const endpoint = `/sell-orders/my-orders?_t=${timestamp}`;


      // DON'T send custom headers - they cause CORS errors
      const response = await this.requestWithRetry(endpoint);


      // Filter out cancelled accounts on the backend response level
      // This ensures only active accounts are returned
      if (response && response.data && Array.isArray(response.data)) {
        const activeAccounts = response.data.filter(account =>
          account.status !== 'cancelled' && account.status !== 'deleted'
        );
        response.data = activeAccounts;
      } else if (response && response.orders && Array.isArray(response.orders)) {
        const activeAccounts = response.orders.filter(account =>
          account.status !== 'cancelled' && account.status !== 'deleted'
        );
        response.orders = activeAccounts;
      } else if (Array.isArray(response)) {
        const activeAccounts = response.filter(account =>
          account.status !== 'cancelled' && account.status !== 'deleted'
        );
        return activeAccounts;
      }

      return response;
    } catch (error) {
      console.error('❌ Get user sell orders failed:', error.message);
      throw error;
    }
  }

  // Get sell order by ID
  async getSellOrderById(orderId) {
    try {

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/sell-orders/${orderId}`);

      return response;
    } catch (error) {
      console.error('❌ Get sell order failed:', error.message);
      throw error;
    }
  }

  // Update sell order
  async updateSellOrder(orderId, updateData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/sell-orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return response;
    } catch (error) {
      console.error('❌ Update sell order failed:', error.message);
      throw error;
    }
  }

  // Delete sell order
  async deleteSellOrder(orderId) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // DON'T send custom headers - they cause CORS errors
      const response = await this.requestWithRetry(`/sell-orders/${orderId}`, {
        method: 'DELETE'
      });


      return {
        status: true,
        message: response.message || 'Account deleted successfully',
        ...response
      };
    } catch (error) {
      console.error('❌ Delete sell order failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // SELL ORDER TRANSACTION - SELLER INITIATES (Flow 1B)
  // ========================================

  /**
   * 🔥 NEW: Seller initiates transaction from sell order
   * Flow 1B: Sell Order → Seller Initiates Transaction
   * 
   * @param {Object} transactionData - Transaction data
   * @param {string} transactionData.sellOrderId - Sell order ID (required)
   * @param {string} transactionData.buyerId - Buyer user ID (required)
   * @param {string} transactionData.accountOriginalEmail - Account email (required)
   * @param {string} transactionData.originalEmailPassword - Email password (required)
   * @param {string} transactionData.socialAccountPassword - Social account password (required)
   * @param {string} transactionData.buyerWalletAddress - Buyer wallet address (optional, backend can fetch)
   * @param {string} transactionData.sellerWalletAddress - Seller wallet address (optional, backend can fetch)
   * @param {number} transactionData.amount - Amount in USD (optional, defaults to sell order price)
   * @param {string} transactionData.paymentMethod - Payment method (optional, defaults to sell order currency)
   * @param {string} transactionData.paymentNetwork - Payment network (optional, defaults to derived network)
   * @param {string} transactionData.expiresAt - Expiration date (optional)
   * @param {string} transactionData.notes - Additional notes (optional)
   * @returns {Promise<Object>} Transaction response
   */
  async initiateSellOrderTransaction(transactionData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!transactionData.sellOrderId) {
        throw new Error('Sell order ID is required');
      }

      if (!transactionData.buyerId) {
        throw new Error('Buyer ID is required');
      }

      if (!transactionData.accountOriginalEmail) {
        throw new Error('Account original email is required');
      }

      if (!transactionData.originalEmailPassword) {
        throw new Error('Original email password is required');
      }

      if (!transactionData.socialAccountPassword) {
        throw new Error('Social account password is required');
      }

      // Wallet addresses are optional - backend can fetch from order if not provided

      if (!transactionData.buyerWalletAddress || !transactionData.sellerWalletAddress) {
      }


      // ========================================
      // API CALL - Seller initiates transaction from sell order
      // Endpoint: POST /sell-orders/initiate-transaction
      // ========================================

      const response = await this.requestWithRetry(
        '/sell-orders/initiate-transaction',
        {
          method: 'POST',
          body: JSON.stringify(transactionData)
        }
      );

      return response;

    } catch (error) {
      console.error('❌ ============ SELL ORDER TRANSACTION INITIATION FAILED ============');
      console.error('Error Message:', error.message);
      console.error('Full Error:', error);
      throw error;
    }
  }


  // ========================================
  // BUY ORDERS
  // ========================================

  // Create a new buy order
  async createBuyOrder(buyOrderData) {
    try {
      console.log('🛒 ============ CREATING BUY ORDER ============');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Buy Order Data Validation:', {
        platform: {
          exists: !!buyOrderData.platform,
          value: buyOrderData.platform,
          type: typeof buyOrderData.platform
        },
        maxPrice: {
          exists: !!buyOrderData.maxPrice,
          value: buyOrderData.maxPrice,
          type: typeof buyOrderData.maxPrice,
          isNumber: typeof buyOrderData.maxPrice === 'number'
        },
        currency: {
          exists: !!buyOrderData.currency,
          value: buyOrderData.currency,
          type: typeof buyOrderData.currency
        },
        description: {
          exists: !!buyOrderData.description,
          value: buyOrderData.description,
          type: typeof buyOrderData.description,
          length: buyOrderData.description?.length
        },
        quantity: {
          exists: buyOrderData.quantity !== undefined,
          value: buyOrderData.quantity,
          type: typeof buyOrderData.quantity,
          isNumber: typeof buyOrderData.quantity === 'number'
        },
        isUrgent: {
          exists: buyOrderData.isUrgent !== undefined,
          value: buyOrderData.isUrgent,
          type: typeof buyOrderData.isUrgent
        },
        requirements: {
          exists: !!buyOrderData.requirements,
          isArray: Array.isArray(buyOrderData.requirements),
          count: buyOrderData.requirements?.length,
          items: buyOrderData.requirements?.map(r => ({
            key: r.key,
            value: r.value,
            type: r.type,
            valueType: typeof r.value
          }))
        },
        filters: {
          exists: !!buyOrderData.filters,
          isArray: Array.isArray(buyOrderData.filters),
          count: buyOrderData.filters?.length,
          items: buyOrderData.filters?.map(f => ({
            key: f.key,
            value: f.value,
            type: f.type,
            valueType: typeof f.value
          }))
        }
      });

      // Validate required fields
      if (!buyOrderData.platform) {
        throw new Error('Platform is required');
      }

      if (!buyOrderData.maxPrice) {
        throw new Error('Maximum price/budget is required');
      }

      if (!buyOrderData.description) {
        throw new Error('Description is required');
      }


      const response = await this.requestWithRetry('/buy-orders', {
        method: 'POST',
        body: JSON.stringify(buyOrderData)
      });

      return response;
    } catch (error) {
      console.error('❌ ============ BUY ORDER FAILED ============');
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Full Error:', error);
      throw error;
    }
  }

  // Get all buy orders
  async getAllBuyOrders(filters = {}) {
    try {

      const queryParams = new URLSearchParams();

      // Add filter parameters
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.sellOrderId) queryParams.append('sellOrderId', filters.sellOrderId);
      if (filters.buyerId) queryParams.append('buyerId', filters.buyerId);
      if (filters.sellerId) queryParams.append('sellerId', filters.sellerId);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      // Add cache buster
      queryParams.append('_t', Date.now());

      const queryString = queryParams.toString();
      const endpoint = `/buy-orders?${queryString}`;

      const response = await this.requestWithRetry(endpoint);


      // If no status filter was specified, filter out inactive orders
      if (!filters.status) {
        if (response && response.data && Array.isArray(response.data)) {
          const activeOrders = response.data.filter(order => {
            const status = order.status?.toLowerCase();
            return status !== 'cancelled' &&
              status !== 'deleted' &&
              status !== 'completed' &&
              status !== 'rejected';
          });
          response.data = activeOrders;
        } else if (response && response.orders && Array.isArray(response.orders)) {
          const activeOrders = response.orders.filter(order => {
            const status = order.status?.toLowerCase();
            return status !== 'cancelled' &&
              status !== 'deleted' &&
              status !== 'completed' &&
              status !== 'rejected';
          });
          response.orders = activeOrders;
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Get buy orders failed:', error.message);
      throw error;
    }
  }

  // Get user's own buy orders

  async getUserBuyOrders() {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Add cache-busting timestamp
      const timestamp = Date.now();
      const endpoint = `/buy-orders/my-orders?_t=${timestamp}`;

      const response = await this.requestWithRetry(endpoint);


      // FILTER OUT CANCELLED/DELETED/COMPLETED BUY ORDERS
      // Keep only: 'active', 'pending', 'accepted' statuses
      if (response && response.data && Array.isArray(response.data)) {
        const activeOrders = response.data.filter(order => {
          const status = order.status?.toLowerCase();
          return status !== 'cancelled' &&
            status !== 'deleted' &&
            status !== 'completed' &&
            status !== 'rejected';
        });
        response.data = activeOrders;
      } else if (response && response.orders && Array.isArray(response.orders)) {
        const activeOrders = response.orders.filter(order => {
          const status = order.status?.toLowerCase();
          return status !== 'cancelled' &&
            status !== 'deleted' &&
            status !== 'completed' &&
            status !== 'rejected';
        });
        response.orders = activeOrders;
      } else if (Array.isArray(response)) {
        const activeOrders = response.filter(order => {
          const status = order.status?.toLowerCase();
          return status !== 'cancelled' &&
            status !== 'deleted' &&
            status !== 'completed' &&
            status !== 'rejected';
        });
        return activeOrders;
      }

      return response;
    } catch (error) {
      console.error('❌ Get user buy orders failed:', error.message);
      throw error;
    }
  }

  // Get buy order by ID
  async getBuyOrderById(orderId) {
    try {

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/buy-orders/${orderId}`);

      return response;
    } catch (error) {
      console.error('❌ Get buy order failed:', error.message);
      throw error;
    }
  }

  // Update buy order
  async updateBuyOrder(orderId, updateData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/buy-orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return response;
    } catch (error) {
      console.error('❌ Update buy order failed:', error.message);
      throw error;
    }
  }

  // Cancel buy order
  async cancelBuyOrder(orderId) {
    try {
      console.log(`❌ Cancelling buy order ${orderId}...`);

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/buy-orders/${orderId}/cancel`, {
        method: 'PUT'
      });

      return response;
    } catch (error) {
      console.error('❌ Cancel buy order failed:', error.message);
      throw error;
    }
  }






  /**
     * Initiate transaction on buy order (SELLER side)
     * Uses POST /buy-orders/initiate-transaction
     * @param {Object} transactionData - Transaction details including buyOrderId
     * @returns {Promise<Object>} Transaction response
     */
  async initiateBuyOrderTransaction(transactionData) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // ========================================
      // VALIDATION (as per documentation)
      // ========================================

      // Validate buyOrderId in payload
      if (!transactionData.buyOrderId) {
        throw new Error('buyOrderId is required in transaction data');
      }

      // Validate all required fields
      const requiredFields = [
        'buyOrderId',
        'accountOriginalEmail',
        'originalEmailPassword',
        'socialAccountPassword',
        'paymentMethod',
        'paymentNetwork',
        'offerAmount',
        'buyerWalletAddress',
        'sellerWalletAddress'
      ];

      for (const field of requiredFields) {
        if (!transactionData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      // Validate offerAmount is a number
      if (typeof transactionData.offerAmount !== 'number') {
        throw new Error('offerAmount must be a number');
      }

      // Validate paymentMethod
      const validPaymentMethods = ['btc', 'usdt', 'eth', 'sol', 'bnb', 'trx'];
      if (!validPaymentMethods.includes(transactionData.paymentMethod.toLowerCase())) {
        throw new Error(`paymentMethod must be one of: ${validPaymentMethods.join(', ')}`);
      }

      // Validate paymentNetwork
      const validPaymentNetworks = ['ethereum', 'bitcoin', 'binance', 'base', 'tron', 'solana'];
      if (!validPaymentNetworks.includes(transactionData.paymentNetwork.toLowerCase())) {
        throw new Error(`paymentNetwork must be one of: ${validPaymentNetworks.join(', ')}`);
      }

      // Validate payment method and network compatibility
      const compatibilityMap = {
        'btc': ['bitcoin'],
        'eth': ['ethereum', 'base'],
        'usdt': ['ethereum', 'binance', 'base', 'tron'],
        'sol': ['solana'],
        'bnb': ['binance'],
        'trx': ['tron']
      };

      const method = transactionData.paymentMethod.toLowerCase();
      const network = transactionData.paymentNetwork.toLowerCase();

      if (!compatibilityMap[method].includes(network)) {
        throw new Error(
          `Payment method ${method} is not compatible with network ${network}. ` +
          `Valid networks for ${method}: ${compatibilityMap[method].join(', ')}`
        );
      }


      // ========================================
      // 🔥 FIX: Send unencrypted data directly
      // Backend decryption is not working properly, so skip encryption
      // ========================================


      // ========================================
      // API CALL - Send data directly without encryption
      // ========================================

      const response = await this.requestWithRetry(
        '/buy-orders/initiate-transaction',  // 🔥 FIXED: Removed :id from endpoint
        {
          method: 'POST',
          body: JSON.stringify(transactionData) // Send plain JSON directly
        }
      );

      return response;

    } catch (error) {
      console.error('❌ ============ TRANSACTION INITIATION FAILED ============');
      console.error('Error Message:', error.message);
      console.error('Full Error:', error);
      throw error;
    }
  }





  // Accept buy order (for sellers)
  async acceptBuyOrder(orderId) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/buy-orders/${orderId}/accept`, {
        method: 'PUT'
      });

      return response;
    } catch (error) {
      console.error('❌ Accept buy order failed:', error.message);
      throw error;
    }
  }

  // Reject buy order (for sellers)
  async rejectBuyOrder(orderId, reason = '') {
    try {
      console.log(`❌ Rejecting buy order ${orderId}...`);

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/buy-orders/${orderId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });

      return response;
    } catch (error) {
      console.error('❌ Reject buy order failed:', error.message);
      throw error;
    }
  }

  // Complete buy order (for sellers)
  async completeBuyOrder(orderId) {
    try {

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/buy-orders/${orderId}/complete`, {
        method: 'PUT'
      });

      return response;
    } catch (error) {
      console.error('❌ Complete buy order failed:', error.message);
      throw error;
    }
  }

  // Update buy order
  async updateBuyOrder(orderId, updateData) {
    try {
      console.log(`✏️ Updating buy order ${orderId}...`);

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/buy-orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      console.log('✅ Buy order updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Update buy order failed:', error.message);
      throw error;
    }
  }

  // Delete buy order
  async deleteBuyOrder(orderId) {
    try {
      console.log(`🗑️ Deleting buy order ${orderId}...`);

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await this.requestWithRetry(`/buy-orders/${orderId}`, {
        method: 'DELETE'
      });

      console.log('✅ Buy order deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ Delete buy order failed:', error.message);
      throw error;
    }
  }

  // ========================================
  // MARKETPLACE UTILITIES
  // ========================================

  // Get marketplace statistics
  async getMarketplaceStats() {
    try {

      const response = await this.requestWithRetry('/stats');

      return response;
    } catch (error) {
      console.error('❌ Get marketplace stats failed:', error.message);
      throw error;
    }
  }

  // Search marketplace
  async searchMarketplace(searchQuery, filters = {}) {
    try {

      const queryParams = new URLSearchParams();

      if (searchQuery) queryParams.append('q', searchQuery);
      if (filters.platform) queryParams.append('platform', filters.platform);
      if (filters.accountType) queryParams.append('accountType', filters.accountType);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/search?${queryString}` : '/search';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Marketplace search failed:', error.message);
      throw error;
    }
  }

  // Get supported platforms
  async getSupportedPlatforms() {
    try {

      const response = await this.requestWithRetry('/platforms');

      return response;
    } catch (error) {
      console.error('❌ Get supported platforms failed:', error.message);
      throw error;
    }
  }

  // Get account types for a platform
  async getAccountTypes(platform) {
    try {

      if (!platform) {
        throw new Error('Platform is required');
      }

      const response = await this.requestWithRetry(`/platforms/${platform}/account-types`);

      return response;
    } catch (error) {
      console.error('❌ Get account types failed:', error.message);
      throw error;
    }
  }

  // Report a sell order
  async reportSellOrder(orderId, reportData) {
    try {
      console.log(`🚨 Reporting sell order ${orderId}...`);

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      if (!reportData.reason) {
        throw new Error('Report reason is required');
      }

      const response = await this.requestWithRetry(`/sell-orders/${orderId}/report`, {
        method: 'POST',
        body: JSON.stringify(reportData)
      });

      return response;
    } catch (error) {
      console.error('❌ Report sell order failed:', error.message);
      throw error;
    }
  }

  // Get user's transaction history
  async getTransactionHistory(filters = {}) {
    try {
      console.log('📈 Fetching transaction history...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const queryParams = new URLSearchParams();

      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';

      const response = await this.requestWithRetry(endpoint);

      return response;
    } catch (error) {
      console.error('❌ Get transaction history failed:', error.message);
      throw error;
    }
  }
}

export default new MarketplaceService();