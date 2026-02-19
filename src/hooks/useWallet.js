import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import walletService from '../services/walletService';

/**
 * Get current user's wallet balance
 * NOTE: Wallet balances are managed via Socket.IO in Homepage/UserContext
 * This hook is deprecated - use walletData directly from props or context
 */
export function useWalletBalance(options = {}) {
    console.warn('useWalletBalance is deprecated - wallet balance comes from Socket.IO via props');
    return useQuery({
        queryKey: queryKeys.wallet.balance(),
        queryFn: () => Promise.resolve(null), // No-op function since balance comes from Socket.IO
        enabled: false, // Disable the query
        ...options,
    });
}

/**
 * Get wallet addresses for a specific user
 * @param {string} userId - User ID to fetch wallet for
 * @param {object} options - Additional React Query options
 */
export function useWalletAddresses(userId, options = {}) {
    return useQuery({
        queryKey: queryKeys.wallet.addresses(userId),
        queryFn: () => walletService.getUserWalletAddresses(userId),
        enabled: !!userId, // Only fetch if userId provided
        staleTime: 5 * 60 * 1000, // 5 minutes - addresses don't change often
        gcTime: 10 * 60 * 1000,
        ...options,
    });
}

/**
 * Get wallet address for specific currency  
 * @param {string} userId - User ID
 * @param {string} currency - Currency code (btc, eth, usdt, etc.)
 * @param {object} options - Additional React Query options
 */
export function useWalletAddressForCurrency(userId, currency, options = {}) {
    return useQuery({
        queryKey: queryKeys.wallet.addressForCurrency(userId, currency),
        queryFn: () => walletService.getWalletAddressForCurrency(userId, currency),
        enabled: !!userId && !!currency,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        ...options,
    });
}

/**
 * Prefetch wallets for trade (both buyer and seller for multiple currencies)
 * Replaces manual prefetch logic in chat.jsx
 * @param {string} buyerId - Buyer user ID
 * @param {string} sellerId - Seller user ID
 * @param {array} currencies - Array of currency codes to prefetch
 */
export function usePrefetchTradeWallets(buyerId, sellerId, currencies = ['btc', 'eth', 'usdt']) {
    const enabled = !!buyerId && !!sellerId;

    return useQueries({
        queries: currencies.flatMap((currency) => [
            {
                queryKey: queryKeys.wallet.addressForCurrency(buyerId, currency),
                queryFn: () => walletService.getWalletAddressForCurrency(buyerId, currency),
                enabled,
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 2,
            },
            {
                queryKey: queryKeys.wallet.addressForCurrency(sellerId, currency),
                queryFn: () => walletService.getWalletAddressForCurrency(sellerId, currency),
                enabled,
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 2,
            },
        ]),
    });
}

/**
 * Validate trade wallets (checks both buyer and seller have addresses)
 * @param {string} buyerId - Buyer user ID
 * @param {string} sellerId - Seller user ID
 * @param {string} currency - Currency to validate for
 * @param {object} options - Additional React Query options
 */
export function useValidateTradeWallets(buyerId, sellerId, currency, options = {}) {
    return useQuery({
        queryKey: queryKeys.wallet.validate(buyerId, sellerId, currency),
        queryFn: () => walletService.validateTradeWallets(buyerId, sellerId, currency),
        enabled: !!buyerId && !!sellerId && !!currency,
        staleTime: 1 * 60 * 1000, // 1 minute - validation should be relatively fresh
        gcTime: 5 * 60 * 1000,
        retry: 2,
        ...options,
    });
}

/**
 * Update wallet context (called when Socket.IO sends wallet updates)
 * @param {object} walletData - Wallet data from Socket.IO
 */
export function useUpdateWalletContext() {
    const queryClient = useQueryClient();

    return (walletData) => {
        if (walletData && walletData.walletAddresses) {
            // Update wallet service cache (preserve existing behavior)
            walletService.setUserContextWallets(walletData);

            // Also update React Query cache
            queryClient.setQueryData(queryKeys.wallet.balance(), (old) => ({
                ...old,
                ...walletData,
            }));

        }
    };
}
