// ========================================
// 🔥 FIX: Withdrawal Amount Precision Handler
// Handles decimal precision issues for different blockchain networks
// ========================================

/**
 * Fix decimal precision for blockchain transactions
 * Different networks support different decimal precision:
 * - EVM chains (Ethereum, Base, BSC, Polygon): 18 decimals max
 * - Bitcoin: 8 decimals max
 * - Solana: 9 decimals max
 * - Tron: 6 decimals max
 * 
 * @param {number|string} amount - The amount to format
 * @param {string} network - The blockchain network
 * @param {string} currency - The currency/token being sent
 * @returns {string} Properly formatted amount
 */
export const fixWithdrawalPrecision = (amount, network, currency = '') => {
  if (!amount || amount === 0 || amount === '0') {
    return '0';
  }

  // Convert to string and parse as float
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return '0';
  }

  // Define max decimals for each network type
  const networkPrecision = {
    // EVM chains - 18 decimals
    'ethereum': 18,
    'base': 18,
    'binance': 18,
    'bsc': 18,
    'polygon': 18,
    'avalanche': 18,
    'arbitrum': 18,
    'optimism': 18,
    
    // Bitcoin networks - 8 decimals
    'bitcoin': 8,
    'lightning': 8,
    
    // Other networks
    'solana': 9,
    'tron': 6,
  };

  // Get max decimals for this network (default to 18 for EVM)
  const maxDecimals = networkPrecision[network?.toLowerCase()] || 18;
  
  // 🔥 CRITICAL FIX: Use toFixed to limit decimals, then remove trailing zeros
  let formattedAmount = numAmount.toFixed(maxDecimals);
  
  // Remove trailing zeros after decimal point
  formattedAmount = formattedAmount.replace(/\.?0+$/, '');
  
  // If the result is empty or just a decimal point, return '0'
  if (!formattedAmount || formattedAmount === '.' || formattedAmount === '') {
    return '0';
  }

  console.log('🔧 Fixed withdrawal precision:', {
    original: amount,
    network,
    maxDecimals,
    formatted: formattedAmount
  });

  return formattedAmount;
};

/**
 * Validate withdrawal amount before sending
 * Returns { valid: boolean, error?: string, formattedAmount?: string }
 */
export const validateWithdrawalAmount = (amount, network, currency, balance) => {
  // Check if amount exists
  if (!amount || amount === 0 || amount === '0') {
    return {
      valid: false,
      error: 'Please enter an amount to withdraw'
    };
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if valid number
  if (isNaN(numAmount) || numAmount <= 0) {
    return {
      valid: false,
      error: 'Please enter a valid amount'
    };
  }

  // Check against balance
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (numAmount > numBalance) {
    return {
      valid: false,
      error: 'Insufficient balance'
    };
  }

  // Fix precision
  const formattedAmount = fixWithdrawalPrecision(numAmount, network, currency);
  
  // Verify the formatted amount is still valid
  const finalAmount = parseFloat(formattedAmount);
  if (isNaN(finalAmount) || finalAmount <= 0) {
    return {
      valid: false,
      error: 'Amount too small for this network'
    };
  }

  return {
    valid: true,
    formattedAmount: formattedAmount
  };
};

/**
 * Calculate network-appropriate minimum withdrawal amount
 */
export const getMinimumWithdrawal = (network, currency) => {
  const minimums = {
    // EVM chains
    'ethereum': 0.001,
    'base': 0.0001,
    'binance': 0.0001,
    
    // Bitcoin
    'bitcoin': 0.00001,
    'lightning': 0.000001,
    
    // Others
    'solana': 0.001,
    'tron': 0.1,
  };

  return minimums[network?.toLowerCase()] || 0.00001;
};

export default {
  fixWithdrawalPrecision,
  validateWithdrawalAmount,
  getMinimumWithdrawal
};