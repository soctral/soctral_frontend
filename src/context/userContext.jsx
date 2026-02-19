import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import authService from '../services/authService.js';

// User action types
const USER_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_SIGNUP_STEP: 'SET_SIGNUP_STEP',
  UPDATE_SIGNUP_DATA: 'UPDATE_SIGNUP_DATA',
  CLEAR_SIGNUP_DATA: 'CLEAR_SIGNUP_DATA',
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signupStep: 1,
  signupData: {
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    countryCode: '+234',
    displayName: '',
    otp: '',
    termsAccepted: false,
  },
};

// User reducer
const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case USER_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };

    case USER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case USER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case USER_ACTIONS.LOGOUT:
      return {
        ...initialState,
      };

    case USER_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case USER_ACTIONS.SET_SIGNUP_STEP:
      return {
        ...state,
        signupStep: action.payload,
      };

    case USER_ACTIONS.UPDATE_SIGNUP_DATA:
      return {
        ...state,
        signupData: { ...state.signupData, ...action.payload },
      };

    case USER_ACTIONS.CLEAR_SIGNUP_DATA:
      return {
        ...state,
        signupData: initialState.signupData,
        signupStep: 1,
      };

    default:
      return state;
  }
};

// Create context
const UserContext = createContext();

// User context provider
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const initializeRef = useRef(false);
  const updateCountRef = useRef(0);

  // Initialize user from storage on app start - ONLY ONCE
  useEffect(() => {
    if (initializeRef.current) return;

    const initializeUser = () => {
      try {
        initializeRef.current = true;

        if (authService.isAuthenticated()) {
          const userData = authService.getUserData();
          if (userData) {
            dispatch({ type: USER_ACTIONS.SET_USER, payload: userData });
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        authService.clearLocalStorage();
      }
    };

    initializeUser();
  }, []);

  // Helper functions
  const setLoading = (loading) => {
    dispatch({ type: USER_ACTIONS.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';
    dispatch({ type: USER_ACTIONS.SET_ERROR, payload: errorMessage });
  };

  const clearError = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_ERROR });
  };

  // Authentication functions
  const createUser = async (userData) => {
    try {
      setLoading(true);
      clearError();

      console.log('UserContext: Creating user with data:', {
        hasEmail: !!userData.email,
        hasPhone: !!userData.phoneNumber,
        hasPassword: !!userData.password,
        hasDisplayName: !!userData.displayName
      });

      const response = await authService.createUser(userData);

      console.log('UserContext: Create user response:', {
        status: response.status,
        success: response.success,
        hasToken: !!response.token,
        hasUser: !!response.user
      });

      // Validate we have the required data
      if (!response.user) {
        throw new Error('No user data received from server');
      }

      if (!response.token) {
        throw new Error('No authentication token received');
      }

      // Update context state and clear signup data
      dispatch({ type: USER_ACTIONS.SET_USER, payload: response.user });
      dispatch({ type: USER_ACTIONS.CLEAR_SIGNUP_DATA });


      return {
        status: true,
        success: true,
        user: response.user,
        token: response.token,
        message: response.message || 'Account created successfully'
      };

    } catch (error) {
      console.error('UserContext: Create user error:', error);
      const errorMessage = error.message || 'Failed to create account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  // Update the signInUser method in userContext.jsx

  const signInUser = async (credentials) => {
    try {
      setLoading(true);
      clearError();

      console.log('UserContext: Attempting sign in with:', {
        hasIdentifier: !!credentials.identifier,
        hasEmail: !!credentials.email,
        hasPhone: !!credentials.phoneNumber,
        hasPassword: !!credentials.password
      });

      const response = await authService.signInUser(credentials);

      console.log('UserContext: Sign in response:', {
        status: response.status,
        success: response.success,
        hasToken: !!response.token,
        hasUser: !!response.user
      });

      // Validate we have the required data
      if (!response.user) {
        throw new Error('No user data received from server');
      }

      if (!response.token) {
        throw new Error('No authentication token received');
      }

      // Update context state
      dispatch({ type: USER_ACTIONS.SET_USER, payload: response.user });


      return {
        status: true,
        success: true,
        user: response.user,
        token: response.token,
        message: response.message || 'Login successful'
      };

    } catch (error) {
      console.error('UserContext: Sign in error:', error);
      const errorMessage = error.message || 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getUserByToken = async () => {
    try {
      setLoading(true);
      clearError();

      console.log('UserContext: Getting user by token...');

      const response = await authService.getUserByToken();
      console.log('UserContext: Get user by token response:', response);

      if (response.user) {
        dispatch({ type: USER_ACTIONS.SET_USER, payload: response.user });
        return response;
      } else {
        throw new Error(response.message || 'Failed to get user details');
      }
    } catch (error) {
      console.error('UserContext: Get user by token error:', error);
      setError(error.message || 'Failed to get user details');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (phoneNumber) => {
    try {
      setLoading(true);
      clearError();

      console.log('UserContext: Sending OTP to:', phoneNumber);

      const response = await authService.sendOTP(phoneNumber);
      console.log('UserContext: Send OTP response:', response);

      if (response.message && response.message.toLowerCase().includes('sent successfully')) {
        return response;
      } else if (response.success || response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('UserContext: Send OTP error:', error);
      setError(error.message || 'Failed to send OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (phoneNumber, otp) => {
    try {
      setLoading(true);
      clearError();

      console.log('UserContext: Verifying OTP for:', phoneNumber, 'OTP:', otp);

      const response = await authService.verifyOTP(phoneNumber, otp);
      console.log('UserContext: Verify OTP response:', response);

      if (response.message && response.message.toLowerCase().includes('verified successfully')) {
        return response;
      } else if (response.success || response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to verify OTP');
      }
    } catch (error) {
      console.error('UserContext: Verify OTP error:', error);
      setError(error.message || 'Failed to verify OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async (phoneNumber) => {
    try {
      setLoading(true);
      clearError();

      console.log('UserContext: Resending OTP to:', phoneNumber);

      const response = await authService.resendOTP(phoneNumber);
      console.log('UserContext: Resend OTP response:', response);

      if (response.message && response.message.toLowerCase().includes('sent successfully')) {
        return response;
      } else if (response.success || response.status) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('UserContext: Resend OTP error:', error);
      setError(error.message || 'Failed to resend OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (newUserData) => {
    try {
      // Merge with existing user data to get complete user object
      const updatedUser = { ...state.user, ...newUserData };

      // Update the context state
      dispatch({ type: USER_ACTIONS.UPDATE_USER, payload: newUserData });

      // Update localStorage with complete user object
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      // Update authData if it exists
      const existingAuthData = localStorage.getItem('authData');
      if (existingAuthData) {
        const authData = JSON.parse(existingAuthData);
        authData.user = updatedUser;
        localStorage.setItem('authData', JSON.stringify(authData));
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error updating user profile in context:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      dispatch({ type: USER_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('UserContext: Logout error:', error);
      dispatch({ type: USER_ACTIONS.LOGOUT });
    } finally {
      setLoading(false);
    }
  };

  // Signup flow functions with anti-loop protection
  const setSignupStep = (step) => {
    if (state.signupStep !== step) {
      dispatch({ type: USER_ACTIONS.SET_SIGNUP_STEP, payload: step });
    }
  };

  const updateSignupData = (data) => {
    updateCountRef.current += 1;

    if (updateCountRef.current > 50) {
      console.error('INFINITE LOOP DETECTED in updateSignupData!');
      console.trace('Stack trace:');
      return;
    }

    if (!data || typeof data !== 'object') {
      console.warn('updateSignupData called with invalid data:', data);
      return;
    }

    const hasActualChanges = Object.keys(data).some(key => {
      const currentValue = state.signupData[key];
      const newValue = data[key];

      if (typeof currentValue === 'object' && typeof newValue === 'object') {
        return JSON.stringify(currentValue) !== JSON.stringify(newValue);
      }
      return currentValue !== newValue;
    });

    if (hasActualChanges) {
      dispatch({ type: USER_ACTIONS.UPDATE_SIGNUP_DATA, payload: data });
    } else {
    }
  };

  const clearSignupData = () => {
    console.log('UserContext: Clearing signup data');
    updateCountRef.current = 0;
    dispatch({ type: USER_ACTIONS.CLEAR_SIGNUP_DATA });
  };

  // Context value
  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    signupStep: state.signupStep,
    signupData: state.signupData,
    createUser,
    signInUser,
    sendOTP,
    verifyOTP,
    resendOTP,
    updateUserProfile,
    logout,
    setSignupStep,
    updateSignupData,
    clearSignupData,
    clearError,
    isLoggedIn: () => state.isAuthenticated,
    getUserId: () => state.user?._id || state.user?.id,
    getUserEmail: () => state.user?.email,
    getUserDisplayName: () => state.user?.displayName,
    getUserTier: () => state.user?.currentTier || 1,
    isEmailVerified: () => state.user?.emailVerified || false,
    isPhoneVerified: () => state.user?.phoneVerified || false,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};