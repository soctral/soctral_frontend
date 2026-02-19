// ========================================
// services/authService.js - Improved Auth Service
// ========================================

import apiService from './api.js';

class AuthService {
  constructor() {
    this.storage = this.getStorageMethod();
    this.initializeAuth();
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
      // Fallback to memory storage
      const memoryStorage = {};
      return {
        setItem: (key, value) => { memoryStorage[key] = value; },
        getItem: (key) => memoryStorage[key] || null,
        removeItem: (key) => { delete memoryStorage[key]; },
        isAvailable: false
      };
    }
  }

  // Initialize authentication state
  initializeAuth() {
    const token = this.storage.getItem('authToken');
    const userData = this.storage.getItem('userData');
    // console.log('🔄 Auth Service initialized:', {
    //   hasToken: !!token,
    //   hasUserData: !!userData,
    //   storageAvailable: this.storage.isAvailable
    // });
  }

  // Unified token storage method
  async ensureTokenStorage(token, userData) {
    try {
      if (!token || !userData) {
        throw new Error('Token and user data are required');
      }

      this.storage.setItem('authToken', token);
      this.storage.setItem('userData', JSON.stringify(userData));
      this.storage.setItem('hasCompletedSignup', 'true');
      this.storage.setItem('skipOnboarding', 'true');

      // Verify storage worked
      const storedToken = this.storage.getItem('authToken');
      if (!storedToken) {
        throw new Error('Failed to store authentication token');
      }

      // console.log('💾 Token and user data stored successfully');
      return true;
    } catch (error) {
      console.error('❌ Token storage failed:', error);
      throw new Error('Failed to save authentication session');
    }
  }

  // API request with retry logic
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        if (i > 0) {
          // console.log(`🔄 Retry attempt ${i + 1} for ${endpoint}`);
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

  // Helper method to determine credential type
  getCredentialType(identifier) {
    if (!identifier) return null;

    const trimmedIdentifier = identifier.trim();

    // Check for phone number pattern first (more specific)
    // Matches: +234..., 234..., 08..., or any sequence of digits with optional +, -, (), spaces
    if (/^[\+]?[\d\-\(\)\s]{7,}$/.test(trimmedIdentifier) && /\d{7,}/.test(trimmedIdentifier.replace(/[\+\-\(\)\s]/g, ''))) {
      return 'phone';
    }

    // Check for email pattern
    if (trimmedIdentifier.includes('@') && trimmedIdentifier.includes('.') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)) {
      return 'email';
    }

    return null; // Return null if format can't be determined
  }

  // Create user account
  async createUser(userData) {
    try {
      console.log('📝 Creating user account...');

      // Validate required fields
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      console.log('📦 Create user payload being sent:', {
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        displayName: userData.displayName,
        hasPassword: !!userData.password
      });

      const response = await this.requestWithRetry('/auth/create', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      console.log('📥 Create user response received:', response);

      // 🔥 CRITICAL FIX: Handle both encrypted and unencrypted responses
      let processedResponse = response;

      // Check if response is still encrypted (backend bug)
      if (response && typeof response === 'object' && response.data && typeof response.data === 'string') {
        console.warn('⚠️ Backend returned encrypted create user response - attempting to decrypt');
        try {
          const encryptionService = (await import('./encryption.service.js')).default;
          processedResponse = encryptionService.decrypt(response.data);
          console.log('✅ Create user response decrypted successfully:', processedResponse);
        } catch (decryptError) {
          console.error('❌ Failed to decrypt create user response:', decryptError);
          throw new Error('Invalid response format from server');
        }
      }

      // Validate response structure
      if (!processedResponse) {
        throw new Error('No response received from server');
      }

      // Check for success indicators
      const isSuccess = processedResponse.status === true ||
        processedResponse.success === true ||
        (processedResponse.token && processedResponse.user);

      console.log('🔍 Response validation:', {
        hasStatus: !!processedResponse.status,
        hasSuccess: !!processedResponse.success,
        hasToken: !!processedResponse.token,
        hasUser: !!processedResponse.user,
        isSuccess: isSuccess
      });

      if (isSuccess && processedResponse.token && processedResponse.user) {
        await this.ensureTokenStorage(processedResponse.token, processedResponse.user);
        console.log('✅ User created and authenticated successfully');

        return {
          status: true,
          success: true,
          token: processedResponse.token,
          user: processedResponse.user,
          message: processedResponse.message || 'Account created successfully'
        };
      }

      // If we got here, account creation failed
      const errorMessage = processedResponse.message ||
        processedResponse.error ||
        'Failed to create account';

      console.error('❌ Account creation failed:', errorMessage);
      throw new Error(errorMessage);

    } catch (error) {
      console.error('❌ Create user failed:', error.message);
      throw error;
    }
  }

  // Login user (NEW METHOD)
  async loginUser(credentials) {
    try {
      // console.log('🔐 Logging in user...');

      // Validate required fields
      if (!credentials.password) {
        throw new Error('Password is required');
      }

      const loginPayload = { password: credentials.password };

      // Determine login method
      if (credentials.identifier) {
        const credentialType = this.getCredentialType(credentials.identifier);
        console.log('🔍 Credential type detected:', credentialType, 'for identifier:', credentials.identifier);

        if (credentialType === 'email') {
          loginPayload.email = credentials.identifier.trim();
        } else if (credentialType === 'phone') {
          loginPayload.phoneNumber = credentials.identifier.replace(/[\s\-\(\)]/g, '');
        } else {
          throw new Error('Please enter a valid email address or phone number');
        }
      } else if (credentials.email) {
        loginPayload.email = credentials.email.trim();
      } else if (credentials.phoneNumber) {
        loginPayload.phoneNumber = credentials.phoneNumber.replace(/[\s\-\(\)]/g, '');
      } else {
        throw new Error('Email, phone number, or identifier is required');
      }

      console.log('📦 Login payload being sent:', JSON.stringify(loginPayload, null, 2));

      const response = await this.requestWithRetry('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginPayload)
      });

      if (response.status && response.token) {
        await this.ensureTokenStorage(response.token, response.user);
        console.log('✅ User logged in successfully');
      }

      return response;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  // Unified sign in method
  async signInUser(credentials) {
    try {
      console.log('🔑 Signing in user...');

      // Validate required fields
      if (!credentials.password) {
        throw new Error('Password is required');
      }

      const loginPayload = { password: credentials.password };

      // Determine login method
      if (credentials.identifier) {
        const credentialType = this.getCredentialType(credentials.identifier);
        console.log('🔍 Credential type detected:', credentialType, 'for identifier:', credentials.identifier);

        if (credentialType === 'email') {
          loginPayload.email = credentials.identifier.trim();
        } else if (credentialType === 'phone') {
          loginPayload.phoneNumber = credentials.identifier.replace(/[\s\-\(\)]/g, '');
        } else {
          throw new Error('Please enter a valid email address or phone number');
        }
      } else if (credentials.email) {
        loginPayload.email = credentials.email.trim();
      } else if (credentials.phoneNumber) {
        loginPayload.phoneNumber = credentials.phoneNumber.replace(/[\s\-\(\)]/g, '');
      } else {
        throw new Error('Email, phone number, or identifier is required');
      }

      console.log('📦 Login payload being sent:', JSON.stringify(loginPayload, null, 2));

      const response = await this.requestWithRetry('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginPayload)
      });

      console.log('📥 Login response received:', response);

      // 🔥 CRITICAL FIX: Handle both encrypted and unencrypted responses
      let processedResponse = response;

      // Check if response is still encrypted (backend bug)
      if (response && typeof response === 'object' && response.data && typeof response.data === 'string') {
        console.warn('⚠️ Backend returned encrypted login response - attempting to decrypt');
        try {
          const encryptionService = (await import('./encryption.service.js')).default;
          processedResponse = encryptionService.decrypt(response.data);
          console.log('✅ Login response decrypted successfully:', processedResponse);
        } catch (decryptError) {
          console.error('❌ Failed to decrypt login response:', decryptError);
          throw new Error('Invalid login response format');
        }
      }

      // Validate response structure
      if (!processedResponse) {
        throw new Error('No response received from server');
      }

      // Check for success indicators
      const isSuccess = processedResponse.status === true ||
        processedResponse.success === true ||
        (processedResponse.token && processedResponse.user);

      console.log('🔍 Response validation:', {
        hasStatus: !!processedResponse.status,
        hasSuccess: !!processedResponse.success,
        hasToken: !!processedResponse.token,
        hasUser: !!processedResponse.user,
        isSuccess: isSuccess
      });

      if (isSuccess && processedResponse.token && processedResponse.user) {
        await this.ensureTokenStorage(processedResponse.token, processedResponse.user);
        console.log('✅ User signed in successfully');

        return {
          status: true,
          success: true,
          token: processedResponse.token,
          user: processedResponse.user,
          message: processedResponse.message || 'Login successful'
        };
      }

      // If we got here, login failed
      const errorMessage = processedResponse.message ||
        processedResponse.error ||
        'Login failed - please check your credentials';

      console.error('❌ Login failed:', errorMessage);
      throw new Error(errorMessage);

    } catch (error) {
      console.error('❌ Sign in failed:', error.message);
      throw error;
    }
  }




  // ===========================================
  // TRANSACTION PIN METHODS (NEW)
  // ===========================================

  /**
   * Create transaction PIN
   * @param {string} pin - 4-digit PIN
   * @returns {Promise<Object>} API response
   */
  async createTransactionPin(pin) {
    try {
      console.log('🔐 Creating transaction PIN...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!pin) {
        throw new Error('Transaction PIN is required');
      }

      // Validate PIN format
      const cleanPin = pin.toString().trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        throw new Error('Transaction PIN must be exactly 4 digits');
      }

      const response = await this.requestWithRetry('/transaction/pin/create', {
        method: 'POST',
        body: JSON.stringify({ pin: cleanPin })
      });

      if (response.status) {
        // Store a flag indicating PIN has been set
        this.storage.setItem('hasTransactionPin', 'true');
        console.log('✅ Transaction PIN created successfully');
      }

      return response;
    } catch (error) {
      console.error('❌ Create transaction PIN failed:', error.message);
      throw error;
    }
  }


  /**
 * Update transaction PIN
 * @param {string} oldPin - Current 4-digit PIN
 * @param {string} newPin - New 4-digit PIN
 * @returns {Promise<Object>} API response
 */
  async updateTransactionPin(oldPin, newPin) {
    try {
      console.log('🔄 Updating transaction PIN...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!oldPin || !newPin) {
        throw new Error('Both old and new PINs are required');
      }

      // Validate PIN format
      const cleanOldPin = oldPin.toString().trim();
      const cleanNewPin = newPin.toString().trim();

      if (!/^\d{4}$/.test(cleanOldPin)) {
        throw new Error('Old PIN must be exactly 4 digits');
      }

      if (!/^\d{4}$/.test(cleanNewPin)) {
        throw new Error('New PIN must be exactly 4 digits');
      }

      if (cleanOldPin === cleanNewPin) {
        throw new Error('New PIN must be different from old PIN');
      }

      const response = await this.requestWithRetry('/user/pin/update', {
        method: 'PUT',
        body: JSON.stringify({
          oldPin: cleanOldPin,
          newPin: cleanNewPin
        })
      });

      console.log('✅ Transaction PIN updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Update transaction PIN failed:', error.message);
      throw error;
    }
  }



  /**
   * Check if transaction PIN exists for the user
   * @returns {Promise<Object>} API response with exists boolean
   */
  async checkTransactionPinExists() {
    try {
      console.log('🔍 Checking if transaction PIN exists...');

      if (!this.isAuthenticated()) {
        return {
          status: false,
          exists: false,
          message: 'User not authenticated'
        };
      }

      const response = await this.requestWithRetry('/user/has-transaction-pin', {
        method: 'GET'
      });

      console.log('✅ Transaction PIN check completed:', response);

      // Update local flag based on server response
      if (response.status && response.exists) {
        this.storage.setItem('hasTransactionPin', 'true');
      } else {
        this.storage.removeItem('hasTransactionPin');
      }

      return response;
    } catch (error) {
      console.error('❌ Check transaction PIN failed:', error.message);

      // If API call fails, check local storage as fallback
      const hasLocalPin = this.hasTransactionPin();

      return {
        status: false,
        exists: hasLocalPin,
        cached: true,
        message: error.message
      };
    }
  }
  /**
   * Verify transaction PIN
   * @param {string} pin - 4-digit PIN to verify
   * @returns {Promise<Object>} API response
   */
  async verifyTransactionPin(pin) {
    try {
      console.log('🔍 Verifying transaction PIN...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!pin) {
        throw new Error('Transaction PIN is required');
      }

      // Validate PIN format
      const cleanPin = pin.toString().trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        throw new Error('Transaction PIN must be exactly 4 digits');
      }

      const response = await this.requestWithRetry('/transaction/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin: cleanPin })
      });

      console.log('✅ Transaction PIN verified successfully');
      return response;
    } catch (error) {
      console.error('❌ Verify transaction PIN failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if user has set a transaction PIN
   * @returns {boolean}
   */
  hasTransactionPin() {
    return this.storage.getItem('hasTransactionPin') === 'true';
  }

  /**
   * Clear transaction PIN flag (call this on logout)
   */
  clearTransactionPinFlag() {
    this.storage.removeItem('hasTransactionPin');
  }

  // ===========================================
  // END TRANSACTION PIN METHODS
  // ===========================================





  // Send OTP for phone verification
  async sendOTP(phoneNumber, purpose = 'verification') {
    try {
      console.log('📱 Sending OTP...');

      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const response = await this.requestWithRetry('/otp/send', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          purpose: purpose
        })
      });

      console.log('✅ OTP sent successfully');
      return response;
    } catch (error) {
      console.error('❌ Send OTP failed:', error.message);
      throw error;
    }
  }

  // Send OTP with email support (NEW METHOD)
  async sendOTPWithEmail(emailOrPhone, purpose = 'verification') {
    try {
      console.log('📧 Sending OTP with email support...');

      if (!emailOrPhone) {
        throw new Error('Email or phone number is required');
      }

      const credentialType = this.getCredentialType(emailOrPhone);
      const payload = { purpose: purpose };

      if (credentialType === 'email') {
        payload.email = emailOrPhone.trim();
      } else if (credentialType === 'phone') {
        payload.phoneNumber = emailOrPhone.replace(/[\s\-\(\)]/g, '');
      } else {
        throw new Error('Please enter a valid email address or phone number');
      }

      const response = await this.requestWithRetry('/otp/send', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log('✅ OTP sent successfully');
      return response;
    } catch (error) {
      console.error('❌ Send OTP failed:', error.message);
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber, otp, purpose = 'verification') {
    try {
      console.log('🔍 Verifying OTP...');

      if (!phoneNumber || !otp) {
        throw new Error('Phone number and OTP are required');
      }

      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const cleanOTP = otp.toString().trim();

      const response = await this.requestWithRetry('/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          otp: cleanOTP,
          purpose: purpose
        })
      });

      console.log('✅ OTP verified successfully');
      return response;
    } catch (error) {
      console.error('❌ Verify OTP failed:', error.message);
      throw error;
    }
  }

  // Verify OTP with email support (NEW METHOD)
  async verifyOTPWithEmail(emailOrPhone, otp, purpose = 'verification') {
    try {
      console.log('🔍 Verifying OTP with email support...');

      if (!emailOrPhone || !otp) {
        throw new Error('Email/phone number and OTP are required');
      }

      const credentialType = this.getCredentialType(emailOrPhone);
      const payload = {
        otp: otp.toString().trim(),
        purpose: purpose
      };

      if (credentialType === 'email') {
        payload.email = emailOrPhone.trim();
      } else if (credentialType === 'phone') {
        payload.phoneNumber = emailOrPhone.replace(/[\s\-\(\)]/g, '');
      } else {
        throw new Error('Please enter a valid email address or phone number');
      }

      const response = await this.requestWithRetry('/otp/verify', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log('✅ OTP verified successfully');
      return response;
    } catch (error) {
      console.error('❌ Verify OTP failed:', error.message);
      throw error;
    }
  }

  // Resend OTP
  async resendOTP(phoneNumber, purpose = 'verification') {
    try {
      console.log('🔄 Resending OTP...');

      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const response = await this.requestWithRetry('/otp/send', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          purpose: purpose
        })
      });

      console.log('✅ OTP resent successfully');
      return response;
    } catch (error) {
      console.error('❌ Resend OTP failed:', error.message);
      throw error;
    }
  }

  // Get current user profile - Updated to use correct endpoint
  async getCurrentUser() {
    try {
      // console.log('👤 Fetching current user profile...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const userData = this.getUserData();
      if (!userData || !userData._id) {
        throw new Error('User ID not found in stored data');
      }

      const response = await this.requestWithRetry(`/user?id=${userData._id}`);

      if (response.user || response._id) {
        // Handle both possible response formats
        const userObject = response.user || response;
        this.storage.setItem('userData', JSON.stringify(userObject));
        // console.log('✅ User profile updated');
        return { user: userObject, status: true };
      }

      return response;
    } catch (error) {
      console.error('❌ Get current user failed:', error.message);

      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        this.clearStorage();
      }

      throw error;
    }
  }

  // Add this new method for the UserContext to use
  async getUserByToken() {
    try {
      // console.log('🔍 Getting user by token...');
      return await this.getCurrentUser();
    } catch (error) {
      console.error('❌ Get user by token failed:', error.message);
      throw error;
    }
  }

  // NEW METHOD: Get user wallet info
  async getUserWalletInfo() {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/user/wallet-info');

      if (response.walletAddresses && response.walletBalances) {
        // Store wallet info in localStorage for caching
        this.storage.setItem('walletInfo', JSON.stringify({
          walletAddresses: response.walletAddresses,
          walletBalances: response.walletBalances,
          lastUpdated: new Date().toISOString()
        }));

        return {
          status: true,
          walletAddresses: response.walletAddresses,
          walletBalances: response.walletBalances,
          message: 'Wallet info retrieved successfully'
        };
      }

      throw new Error('Invalid wallet info response format');
    } catch (error) {
      // 🔥 SILENT: Don't log 503/CORS errors - expected when endpoint is unavailable
      const is503Error = error.message.includes('503') ||
        error.message.includes('Service Unavailable') ||
        error.message.includes('CORS') ||
        error.message.includes('Failed to fetch');

      if (!is503Error) {
        console.error('❌ Get wallet info failed:', error.message);
      }

      // Try to return cached data if available
      try {
        const cachedWalletInfo = this.storage.getItem('walletInfo');
        if (cachedWalletInfo) {
          const parsed = JSON.parse(cachedWalletInfo);
          return {
            status: true,
            walletAddresses: parsed.walletAddresses,
            walletBalances: parsed.walletBalances,
            message: 'Cached wallet info retrieved (API unavailable)',
            cached: true
          };
        }
      } catch (cacheError) {
        // Silent
      }

      throw error;
    }
  }


  async getUserWalletInfoById(userId) {
    try {
      console.log('💰 Fetching wallet info for user:', userId);

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Validate ObjectId format
      if (!/^[a-f\d]{24}$/i.test(userId)) {
        throw new Error('Invalid user ID format');
      }

      const response = await this.requestWithRetry(`/user/wallet-info?userId=${userId}`);

      if (response.walletAddresses && response.walletBalances) {
        console.log('✅ Wallet info retrieved successfully for user:', userId);

        return {
          status: true,
          walletAddresses: response.walletAddresses,
          walletBalances: response.walletBalances,
          message: 'Wallet info retrieved successfully'
        };
      }

      throw new Error('Invalid wallet info response format');
    } catch (error) {
      console.error('❌ Get wallet info failed for user:', userId, error.message);
      throw error;
    }
  }

  // Update user profile - Enhanced with immediate data refresh
  async updateUserProfile(updateData) {
    try {
      // console.log('🔧 Updating user profile...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await this.requestWithRetry('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.status && response.user) {
        // Store the updated user data immediately
        this.storage.setItem('userData', JSON.stringify(response.user));
        // console.log('✅ Profile updated successfully');

        // Also fetch the latest user data from server to ensure consistency
        try {
          const latestUserData = await this.getCurrentUser();
          if (latestUserData.user) {
            return { ...response, user: latestUserData.user };
          }
        } catch (fetchError) {
          console.warn('Warning: Could not fetch latest user data after update:', fetchError);
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Update profile failed:', error.message);
      throw error;
    }
  }

  // Change user password
  async changePassword(passwordData) {
    try {
      // console.log('🔐 Changing user password...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!passwordData.newPassword) {
        throw new Error('New password is required');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      const userData = this.getUserData();
      const changePasswordPayload = {
        newPassword: passwordData.newPassword,
        email: passwordData.email || userData?.email || '',
        phoneNumber: passwordData.phoneNumber || userData?.phoneNumber || ''
      };

      const response = await this.requestWithRetry('/user/change-password', {
        method: 'PUT',
        body: JSON.stringify(changePasswordPayload)
      });

      // console.log('✅ Password changed successfully');
      return response;
    } catch (error) {
      console.error('❌ Change password failed:', error.message);
      throw error;
    }
  }

  // Update display name - Enhanced with immediate data refresh
  async updateDisplayName(displayNameData) {
    try {
      // console.log('✏️ Updating display name...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!displayNameData.newDisplayName) {
        throw new Error('New display name is required');
      }

      if (displayNameData.newDisplayName.trim().length === 0) {
        throw new Error('Display name cannot be empty');
      }

      const userData = this.getUserData();
      const updateDisplayNamePayload = {
        newDisplayName: displayNameData.newDisplayName.trim(),
        email: displayNameData.email || userData?.email || '',
        phoneNumber: displayNameData.phoneNumber || userData?.phoneNumber || ''
      };

      const response = await this.requestWithRetry('/user/update-display-name', {
        method: 'PUT',
        body: JSON.stringify(updateDisplayNamePayload)
      });

      if (response.status) {
        // Immediately fetch the latest user data to get the updated info
        try {
          const latestUserData = await this.getCurrentUser();
          if (latestUserData.user) {
            // console.log('✅ Display name updated and refreshed successfully');
            return { ...response, user: latestUserData.user };
          }
        } catch (fetchError) {
          console.warn('Warning: Could not fetch latest user data after display name update:', fetchError);
          // Fallback: update local storage with what we know
          if (userData) {
            const updatedUserData = { ...userData, displayName: displayNameData.newDisplayName.trim() };
            this.storage.setItem('userData', JSON.stringify(updatedUserData));
            return { ...response, user: updatedUserData };
          }
        }
      }

      // console.log('✅ Display name updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Update display name failed:', error.message);
      throw error;
    }
  }

  // Get user wallet balances (UPDATED METHOD)
  async getUserWalletBalances() {
    try {
      // console.log('💰 Fetching user wallet balances...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Use the new wallet info endpoint
      const walletInfo = await this.getUserWalletInfo();
      if (walletInfo.walletBalances) {
        return {
          status: true,
          walletBalances: walletInfo.walletBalances,
          message: 'Wallet balances retrieved successfully',
          cached: walletInfo.cached || false
        };
      }

      throw new Error('Wallet balances not available');
    } catch (error) {
      console.error('❌ Get wallet balances failed:', error.message);
      throw error;
    }
  }

  // Get user wallet addresses (UPDATED METHOD)
  async getUserWalletAddresses() {
    try {
      // console.log('🏦 Fetching user wallet addresses...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Use the new wallet info endpoint
      const walletInfo = await this.getUserWalletInfo();
      if (walletInfo.walletAddresses) {
        return {
          status: true,
          walletAddress: walletInfo.walletAddresses,
          message: 'Wallet addresses retrieved successfully',
          cached: walletInfo.cached || false
        };
      }

      throw new Error('Wallet addresses not available');
    } catch (error) {
      console.error('❌ Get wallet addresses failed:', error.message);
      throw error;
    }
  }

  // Update phone number (NEW METHOD)
  async updatePhoneNumber(phoneNumberData) {
    try {
      // console.log('📱 Updating phone number...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!phoneNumberData.newPhoneNumber) {
        throw new Error('New phone number is required');
      }

      const userData = this.getUserData();
      const updatePhonePayload = {
        newPhoneNumber: phoneNumberData.newPhoneNumber.replace(/[\s\-\(\)]/g, ''),
        email: phoneNumberData.email || userData?.email || '',
        currentPhoneNumber: phoneNumberData.currentPhoneNumber || userData?.phoneNumber || ''
      };

      const response = await this.requestWithRetry('/user/update-phone-number', {
        method: 'PUT',
        body: JSON.stringify(updatePhonePayload)
      });

      if (response.status) {
        // Immediately fetch the latest user data to get the updated info
        try {
          const latestUserData = await this.getCurrentUser();
          if (latestUserData.user) {
            // console.log('✅ Phone number updated and refreshed successfully');
            return { ...response, user: latestUserData.user };
          }
        } catch (fetchError) {
          console.warn('Warning: Could not fetch latest user data after phone number update:', fetchError);
        }
      }

      // console.log('✅ Phone number updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Update phone number failed:', error.message);
      throw error;
    }
  }

  // Get user verification status (NEW METHOD)
  getUserVerificationStatus() {
    try {
      const userData = this.getUserData();
      if (!userData) {
        throw new Error('User data not available');
      }

      return {
        status: true,
        verificationStatus: {
          emailVerified: userData.emailVerified || false,
          phoneVerified: userData.phoneVerified || false,
          biometricsEnabled: userData.biometricsEnabled || false,
          faceVerified: userData.faceVerified || false,
          addressVerified: userData.addressVerified || false,
          nationalDocumentVerified: userData.nationalDocumentVerified || false,
          bankStatementVerified: userData.bankStatementVerified || false,
          socialAccount: userData.socialAccount || false,
          currentTier: userData.currentTier || 1
        },
        message: 'Verification status retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Get verification status failed:', error.message);
      throw error;
    }
  }

  // Send OTP for display name update (NEW METHOD)
  async sendOTPForDisplayName(emailOrPhone) {
    return await this.sendOTPWithEmail(emailOrPhone, 'update_display_name');
  }

  // Verify OTP for display name update (NEW METHOD)
  async verifyOTPForDisplayName(emailOrPhone, otp) {
    return await this.verifyOTPWithEmail(emailOrPhone, otp, 'update_display_name');
  }

  // Send OTP for phone verification (NEW METHOD)
  async sendPhoneVerificationOTP(phoneNumber) {
    return await this.sendOTP(phoneNumber, 'phone_verification');
  }

  // Verify phone verification OTP (NEW METHOD)
  async verifyPhoneVerificationOTP(phoneNumber, otp) {
    return await this.verifyOTP(phoneNumber, otp, 'phone_verification');
  }

  // Send OTP for email verification (NEW METHOD)
  async sendEmailVerificationOTP(email) {
    return await this.sendOTPWithEmail(email, 'email_verification');
  }

  // Verify email verification OTP (NEW METHOD)
  async verifyEmailVerificationOTP(email, otp) {
    return await this.verifyOTPWithEmail(email, otp, 'email_verification');
  }

  // Logout user
  async logout() {
    try {
      // console.log('🚪 Logging out user...');

      // Since the API doesn't have a logout endpoint, we'll just clear local storage
      // Most token-based authentication systems don't require server-side logout
      // as tokens have expiration times and become invalid automatically

      // console.log('ℹ️ Performing client-side logout (no server endpoint available)');

    } catch (error) {
      console.error('❌ Logout process error:', error.message);
      // Continue with local cleanup even if there are any unexpected errors
    } finally {
      // Always clear local storage regardless of any errors
      this.clearStorage();
      // console.log('✅ Logout completed - local storage cleared');
    }
  }

  // Clear storage
  clearStorage() {
    const keysToRemove = [
      'authToken',
      'userData',
      'hasCompletedSignup',
      'skipOnboarding',
      'walletInfo',
      'hasTransactionPin'
    ];

    keysToRemove.forEach(key => {
      this.storage.removeItem(key);
    });

    // console.log('🧹 Storage cleared');
  }

  // Alias for clearStorage to match UserContext expectations
  clearLocalStorage() {
    this.clearStorage();
  }

  // Check authentication status
  isAuthenticated() {
    const token = this.storage.getItem('authToken');
    const userData = this.storage.getItem('userData');
    return !!(token && userData);
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

  // Get auth token
  getAuthToken() {
    return this.storage.getItem('authToken');
  }

  // Alias for getAuthToken to match UserContext expectations
  getToken() {
    return this.getAuthToken();
  }

  // Check signup completion
  hasCompletedSignup() {
    return this.storage.getItem('hasCompletedSignup') === 'true';
  }

  // Check onboarding skip status
  shouldSkipOnboarding() {
    return this.storage.getItem('skipOnboarding') === 'true';
  }

  // Refresh auth token
  async refreshToken() {
    try {
      // console.log('🔄 Refreshing token...');
      const response = await this.requestWithRetry('/auth/refresh', {
        method: 'POST'
      });

      if (response.token) {
        this.storage.setItem('authToken', response.token);
        // console.log('✅ Token refreshed successfully');
        return response.token;
      }

      throw new Error('No token received from refresh');
    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
      this.clearStorage();
      throw error;
    }
  }

  // Validate token format
  isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3; // JWT format
  }

  // Get user role
  getUserRole() {
    const userData = this.getUserData();
    return userData?.role || 'user';
  }

  // Check user permission
  hasPermission(permission) {
    const userData = this.getUserData();
    const userPermissions = userData?.permissions || [];
    return userPermissions.includes(permission);
  }

  // Method to manually update stored user data (helper for UserContext)
  // updateStoredUserData(userData) {
  //   try {
  //     this.storage.setItem('userData', JSON.stringify(userData));
  //     console.log('✅ Stored user data updated manually');
  //   } catch (error) {
  //     console.error('❌ Failed to update stored user data:', error);
  //   }
  // }


  // Method to manually update stored user data (helper for UserContext)
  updateStoredUserData(userData) {
    try {
      this.storage.setItem('userData', JSON.stringify(userData));
      // console.log('✅ Stored user data updated manually');
    } catch (error) {
      console.error('❌ Failed to update stored user data:', error);
    }
  }

  // Verify transaction PIN (NEW METHOD)
  // async verifyTransactionPin(pin) {
  //   try {
  //     console.log('🔐 Verifying transaction PIN...');

  //     if (!this.isAuthenticated()) {
  //       throw new Error('User not authenticated');
  //     }

  //     if (!pin) {
  //       throw new Error('Transaction PIN is required');
  //     }

  //     const response = await this.requestWithRetry('/transaction/pin/verify', {
  //       method: 'POST',
  //       body: JSON.stringify({ pin: pin.toString() })
  //     });

  //     console.log('✅ Transaction PIN verified successfully');
  //     return response;
  //   } catch (error) {
  //     console.error('❌ Verify transaction PIN failed:', error.message);
  //     throw error;
  //   }
  // }

  // Send native token (NEW METHOD)
  async sendNativeToken(transactionData) {
    try {
      // console.log('💸 Sending native token...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!transactionData.email) {
        throw new Error('Recipient email is required');
      }

      if (!transactionData.password) {
        throw new Error('Password is required');
      }

      const response = await this.requestWithRetry('/transaction/send-token', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

      // console.log('✅ Native token sent successfully');
      return response;
    } catch (error) {
      console.error('❌ Send native token failed:', error.message);
      throw error;
    }
  }


  /**
   * Update user avatar/bitmoji URL
   * @param {string} avatarUrl - URL of the avatar/bitmoji
   * @returns {Promise} API response
   */
  async updateAvatar(avatarUrl) {
    try {
      // console.log('🎨 Updating user avatar...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!avatarUrl) {
        throw new Error('Avatar URL is required');
      }

      const updateData = {
        avatar: avatarUrl,
        bitmojiUrl: avatarUrl
      };

      const response = await this.updateUserProfile(updateData);

      if (response.status && response.user) {
        // console.log('✅ Avatar updated successfully');
        return response;
      }

      throw new Error('Failed to update avatar');
    } catch (error) {
      console.error('❌ Update avatar failed:', error.message);
      throw error;
    }
  }

  // Updated uploadBitmoji method with detailed logging
  async uploadBitmoji(file) {
    try {
      console.log('🎨 Uploading bitmoji/avatar...');

      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!file) {
        throw new Error('File is required');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images only.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB');
      }

      console.log('📦 Uploading file:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });

      const formData = new FormData();
      formData.append('bitmoji', file);

      const headers = {};
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await apiService.request('/user/upload-bitmoji', {
        method: 'POST',
        body: formData,
        headers
      });

      console.log('📥 Upload response received:', JSON.stringify(response, null, 2));
      console.log('🔍 Checking response properties:', {
        status: response.status,
        success: response.success,
        hasUser: !!response.user,
        hasMessage: !!response.message,
        allKeys: Object.keys(response)
      });

      // Update local storage with new avatar URL if provided
      if (response.user) {
        console.log('💾 Updating localStorage with user data');
        console.log('👤 User avatar fields:', {
          avatar: response.user.avatar,
          avatarUrl: response.user.avatarUrl,
          bitmojiUrl: response.user.bitmojiUrl
        });

        this.storage.setItem('userData', JSON.stringify(response.user));
        console.log('✅ User data updated in storage');

        // Verify it was stored correctly
        const storedData = this.storage.getItem('userData');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          console.log('✅ Verified stored avatar:', {
            avatar: parsed.avatar,
            avatarUrl: parsed.avatarUrl,
            bitmojiUrl: parsed.bitmojiUrl
          });
        }
      } else {
        console.warn('⚠️ No user object in upload response');
      }

      // Return success response
      return {
        status: true,
        success: true,
        ...response
      };
    } catch (error) {
      console.error('❌ Upload bitmoji failed:', error.message);
      console.error('❌ Error details:', error);
      throw error;
    }
  }

}


export default new AuthService();