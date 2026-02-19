/**
 * useCurrencyOptions Hook
 * 
 * Extracts available currencies from wallet data for dynamic currency selection.
 * Replaces hardcoded currency values with wallet-driven options.
 */

import { useMemo } from 'react';

/**
 * Currency display configuration
 */
const CURRENCY_CONFIG = {
    btc: { label: 'Bitcoin (BTC)', symbol: 'BTC' },
    eth: { label: 'Ethereum (ETH)', symbol: 'ETH' },
    usdt: { label: 'Tether (USDT)', symbol: 'USDT' },
    usdc: { label: 'USD Coin (USDC)', symbol: 'USDC' },
    bnb: { label: 'Binance Coin (BNB)', symbol: 'BNB' },
    sol: { label: 'Solana (SOL)', symbol: 'SOL' },
    trx: { label: 'Tron (TRX)', symbol: 'TRX' },
};

/**
 * Default currencies to show if wallet data is unavailable
 */
const DEFAULT_CURRENCIES = [
    { value: 'usdt', label: 'Tether (USDT)', symbol: 'USDT' },
    { value: 'btc', label: 'Bitcoin (BTC)', symbol: 'BTC' },
    { value: 'eth', label: 'Ethereum (ETH)', symbol: 'ETH' },
    { value: 'bnb', label: 'Binance Coin (BNB)', symbol: 'BNB' },
    { value: 'sol', label: 'Solana (SOL)', symbol: 'SOL' },
    { value: 'trx', label: 'Tron (TRX)', symbol: 'TRX' },
    { value: 'usdc', label: 'USD Coin (USDC)', symbol: 'USDC'},
];

/**
 * Extract currency options from wallet data
 * 
 * @param {Object} walletData - Wallet data from context or Socket.IO
 * @returns {Object} { currencies: Array, defaultCurrency: string, isLoading: boolean }
 */
export const useCurrencyOptions = (walletData) => {
    return useMemo(() => {
        // If no wallet data, return defaults
        if (!walletData || !walletData.walletAddresses) {
            return {
                currencies: DEFAULT_CURRENCIES,
                defaultCurrency: 'usdt',
                isLoading: false,
                hasWalletData: false,
            };
        }

        const { walletAddresses } = walletData;
        const currencies = [];

        // Extract currencies from wallet addresses
        Object.keys(walletAddresses).forEach(key => {
            const address = walletAddresses[key];

            // Skip empty or invalid addresses
            if (!address || address === 'N/A' || address === '') return;

            // Normalize key to lowercase
            const currencyKey = key.toLowerCase();

            // Get display config or create from key
            const config = CURRENCY_CONFIG[currencyKey] || {
                label: `${currencyKey.toUpperCase()}`,
                symbol: currencyKey.toUpperCase(),
            };

            currencies.push({
                value: currencyKey,
                label: config.label,
                symbol: config.symbol,
                address: address,
            });
        });

        // Sort currencies alphabetically by label
        currencies.sort((a, b) => a.label.localeCompare(b.label));

        // Determine default currency (prefer USDT, then first available)
        let defaultCurrency = 'usdt';
        if (currencies.length > 0) {
            const hasUsdt = currencies.find(c => c.value === 'usdt');
            defaultCurrency = hasUsdt ? 'usdt' : currencies[0].value;
        }

        return {
            currencies: currencies.length > 0 ? currencies : DEFAULT_CURRENCIES,
            defaultCurrency,
            isLoading: false,
            hasWalletData: currencies.length > 0,
        };
    }, [walletData]);
};

/**
 * Get currency label by value
 * @param {string} value - Currency code (e.g., 'btc', 'usdt')
 * @returns {string} Display label
 */
export const getCurrencyLabel = (value) => {
    if (!value) return '';
    const key = value.toLowerCase();
    const config = CURRENCY_CONFIG[key];
    return config ? config.label : value.toUpperCase();
};

/**
 * Get currency symbol by value
 * @param {string} value - Currency code (e.g., 'btc', 'usdt')
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (value) => {
    if (!value) return '';
    const key = value.toLowerCase();
    const config = CURRENCY_CONFIG[key];
    return config ? config.symbol : value.toUpperCase();
};

export default useCurrencyOptions;
