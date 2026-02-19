// ========================================
// services/walletService.js - FIXED: Use Socket.IO wallet addresses
// ========================================

import apiService from '../services/api.js';
import authService from '../services/authService.js';

class WalletService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.userContextWallets = null;
  }

  /**
   * Set wallet data from user context (called from UserContext or HomePage Socket.IO)
   * @param {Object} walletData - Wallet addresses and balances
   */
  setUserContextWallets(walletData) {
    if (walletData && walletData.walletAddresses) {
      this.userContextWallets = walletData;
      // Silent cache
    }
  }

  /**
   * Get wallet addresses for a user with caching and deduplication
   * @param {string} userId - User ID to fetch wallet for
   * @returns {Promise<Object>} Wallet addresses object
   */
  async getUserWalletAddresses(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check cache first
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      // Using cached wallet
      return cached.data;
    }

    // Check if there's already a pending request for this user
    if (this.pendingRequests.has(userId)) {
      // Wait for existing request
      return await this.pendingRequests.get(userId);
    }

    // Create new request
    const requestPromise = this._fetchWalletAddresses(userId);
    this.pendingRequests.set(userId, requestPromise);

    try {
      const walletAddresses = await requestPromise;

      // Cache the result
      this.cache.set(userId, {
        data: walletAddresses,
        timestamp: Date.now()
      });

      return walletAddresses;
    } finally {
      this.pendingRequests.delete(userId);
    }
  }

  /**
   * Internal method to fetch wallet addresses with multiple fallback strategies
   * @private
   */
  async _fetchWalletAddresses(userId) {
    // Fetching wallet addresses

    // 🔥 PRIORITY 1: Check if this is the current user - use Socket.IO data
    try {
      const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      const currentUserId = currentUserData._id || currentUserData.id;

      if (currentUserId === userId) {
        // Try Socket.IO wallet addresses first (from userContextWallets)
        if (this.userContextWallets && this.userContextWallets.walletAddresses) {
          console.log('✅ Using Socket.IO wallet addresses (Priority 1 - Current User)');
          console.log('📋 Available addresses:', Object.keys(this.userContextWallets.walletAddresses));
          return this.userContextWallets.walletAddresses;
        }

        // Try localStorage walletInfo cache (from previous Socket.IO updates)
        try {
          const cachedWalletInfo = localStorage.getItem('walletInfo');
          if (cachedWalletInfo) {
            const parsed = JSON.parse(cachedWalletInfo);
            if (parsed.walletAddresses && typeof parsed.walletAddresses === 'object') {
              const hasRealAddress = Object.values(parsed.walletAddresses).some(addr =>
                typeof addr === 'string' && addr.length > 10
              );

              if (hasRealAddress) {
                console.log('✅ Using cached walletInfo from localStorage (Priority 1b - Current User)');
                return parsed.walletAddresses;
              }
            }
          }
        } catch (cacheError) {
          console.warn('⚠️ Could not parse cached walletInfo:', cacheError.message);
        }
      }
    } catch (error) {
      console.warn('⚠️ Priority 1 failed (Socket.IO/localStorage):', error.message);
    }

    // 🔥 PRIORITY 2: Try AuthService getUserWalletInfo (for current user)
    try {
      const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      const currentUserId = currentUserData._id || currentUserData.id;

      if (currentUserId === userId) {
        console.log('🔄 Trying Priority 2: AuthService getUserWalletInfo (Current User)');
        const walletInfo = await Promise.race([
          authService.getUserWalletInfo(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
          )
        ]);

        if (walletInfo.status && walletInfo.walletAddresses) {
          console.log('✅ Wallet addresses from AuthService getUserWalletInfo');
          return walletInfo.walletAddresses;
        }
      }
    } catch (error) {
      console.warn('⚠️ Priority 2 failed (AuthService getUserWalletInfo):', error.message);
    }

    // 🔥 PRIORITY 3: Try dedicated /user/wallet-info endpoint
    try {
      console.log('🔄 Trying Priority 3: /user/wallet-info?userId=', userId);
      const response = await Promise.race([
        apiService.get(`/user/wallet-info?userId=${userId}`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
        )
      ]);

      if (response && response.walletAddresses && typeof response.walletAddresses === 'object') {
        const walletAddresses = response.walletAddresses;

        const hasRealAddress = Object.values(walletAddresses).some(addr =>
          typeof addr === 'string' &&
          addr.length > 10 &&
          !addr.includes('encrypted')
        );

        if (hasRealAddress) {
          console.log('✅ Wallet addresses from /user/wallet-info endpoint');
          return walletAddresses;
        }
      }
    } catch (error) {
      console.warn('⚠️ Priority 3 failed (/user/wallet-info):', error.message);
    }

    // 🔥 PRIORITY 4: Try /user?id= endpoint
    try {
      console.log('🔄 Trying Priority 4: /user?id=', userId);
      const response = await Promise.race([
        apiService.get(`/user?id=${userId}`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
        )
      ]);

      const user = response.user || response.data || response;

      // Check if user.wallet contains actual addresses (not encrypted)
      if (user && user.wallet && typeof user.wallet === 'object') {
        const wallet = user.wallet;

        const hasEncryptedData = wallet.encryptedSeed || wallet.mekEncryptedWithPin;
        const hasAddresses = Object.keys(wallet).some(key =>
          typeof wallet[key] === 'string' &&
          wallet[key].length > 10 &&
          !key.includes('encrypted')
        );

        if (hasAddresses && !hasEncryptedData) {
          console.log('✅ Wallet addresses found in user.wallet (unencrypted)');
          return wallet;
        } else {
          console.warn('⚠️ Priority 4: user.wallet contains encrypted data, not addresses');
        }
      }

      // Try walletAddresses field
      if (user && user.walletAddresses) {
        console.log('✅ Wallet addresses from user.walletAddresses');
        return user.walletAddresses;
      }
    } catch (error) {
      console.warn('⚠️ Priority 4 failed (/user?id=):', error.message);
    }

    // All strategies failed
    console.error('❌ All wallet fetch strategies failed for user:', userId);
    console.error('💡 SOLUTION: User needs to ensure Socket.IO is connected or wallet is set up');
    throw new Error('Could not fetch wallet addresses. Please refresh the page or check your connection.');
  }

  /**
   * Get a specific wallet address for a currency
   * @param {string} userId - User ID
   * @param {string} currency - Currency code (btc, eth, usdt, etc.)
   * @returns {Promise<string>} Wallet address
   */
  async getWalletAddressForCurrency(userId, currency) {
    const walletAddresses = await this.getUserWalletAddresses(userId);

    if (!walletAddresses) {
      throw new Error('No wallet addresses found for user');
    }

    console.log('🔍 Looking for currency:', currency, 'in wallet:', walletAddresses);

    const currencyLower = currency.toLowerCase();
    const currencyUpper = currency.toUpperCase();

    // Try many possible field name variations
    const possibleFieldNames = [
      currencyLower,           // btc
      currencyUpper,           // BTC
      currency,                // original case
      `${currencyLower}Address`, // btcAddress
      `${currencyUpper}Address`, // BTCAddress
      `${currencyLower}_address`, // btc_address
      `${currencyUpper}_address`, // BTC_address
      currencyLower === 'btc' ? 'bitcoin' : null,
      currencyLower === 'btc' ? 'Bitcoin' : null,
      currencyLower === 'btc' ? 'BITCOIN' : null,
      currencyLower === 'eth' ? 'ethereum' : null,
      currencyLower === 'eth' ? 'Ethereum' : null,
      currencyLower === 'usdt' ? 'tether' : null,
      currencyLower === 'usdt' ? 'Tether' : null,
      currencyLower === 'usdt' ? 'usdt' : null,
      currencyLower === 'sol' ? 'solana' : null,
      currencyLower === 'sol' ? 'Solana' : null,
      currencyLower === 'bnb' ? 'binance' : null,
      currencyLower === 'bnb' ? 'Binance' : null,
      currencyLower === 'trx' ? 'tron' : null,
      currencyLower === 'trx' ? 'Tron' : null,
      currencyLower === 'trx' ? 'TRON' : null,
    ].filter(Boolean);

    // Try each possible field name
    for (const fieldName of possibleFieldNames) {
      const address = walletAddresses[fieldName];
      if (address && address !== 'N/A' && address !== '') {
        console.log(`✅ Found ${currency} address in field: ${fieldName} = ${address}`);
        return address;
      }
    }

    // If still not found, log detailed error
    console.error('❌ Wallet address not found after trying all variations:', {
      userId,
      currency,
      currencyLower,
      currencyUpper,
      triedFieldNames: possibleFieldNames,
      availableFields: Object.keys(walletAddresses),
      walletAddresses: walletAddresses
    });

    throw new Error(`No ${currency.toUpperCase()} wallet address found. Please ensure wallet is set up.`);
  }

  /**
   * Validate that both buyer and seller have wallet addresses for a currency
   * @param {string} buyerId - Buyer user ID
   * @param {string} sellerId - Seller user ID
   * @param {string} currency - Currency code
   * @returns {Promise<Object>} Object with buyer and seller addresses
   */
  async validateTradeWallets(buyerId, sellerId, currency) {
    console.log('🔍 Validating trade wallets:', { buyerId, sellerId, currency });

    const errors = [];
    let buyerAddress = null;
    let sellerAddress = null;

    // Fetch both wallets in parallel
    try {
      [buyerAddress, sellerAddress] = await Promise.all([
        this.getWalletAddressForCurrency(buyerId, currency).catch(err => {
          errors.push(`Buyer: ${err.message}`);
          return null;
        }),
        this.getWalletAddressForCurrency(sellerId, currency).catch(err => {
          errors.push(`Seller: ${err.message}`);
          return null;
        })
      ]);
    } catch (error) {
      console.error('❌ Error fetching wallets:', error);
      throw new Error('Failed to fetch wallet addresses');
    }

    console.log('📊 Wallet fetch results:', {
      buyerAddress,
      sellerAddress,
      errors
    });

    // Check for errors
    if (errors.length > 0) {
      const errorMessage = errors.join('; ');
      console.error('❌ Wallet validation failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Validate addresses
    if (!buyerAddress || buyerAddress === 'N/A') {
      throw new Error('Your wallet address not found. Please refresh the page.');
    }

    if (!sellerAddress || sellerAddress === 'N/A') {
      throw new Error('Seller wallet address not available. Please try again.');
    }

    console.log('✅ Trade wallets validated successfully');
    return {
      buyerAddress,
      sellerAddress
    };
  }

  /**
   * Clear cache for a specific user
   */
  clearCache(userId) {
    if (userId) {
      this.cache.delete(userId);
      console.log('🗑️ Cleared wallet cache for user:', userId);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all wallet cache');
    }
  }

  /**
   * Prefetch wallet addresses for multiple users
   * @param {Array<string>} userIds - Array of user IDs
   */
  async prefetchWallets(userIds) {
    console.log('🔄 Prefetching wallets for users:', userIds);

    const promises = userIds.map(userId =>
      this.getUserWalletAddresses(userId).catch(err => {
        console.warn(`⚠️ Failed to prefetch wallet for ${userId}:`, err.message);
        return null;
      })
    );

    await Promise.all(promises);
    console.log('✅ Wallet prefetch completed');
  }
}

export default new WalletService();