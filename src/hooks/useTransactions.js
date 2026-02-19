import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import apiService from '../services/api';

/**
 * Get current active transaction for user
 * @param {object} options - Additional React Query options
 */
export function useCurrentTransaction(options = {}) {
    return useQuery({
        queryKey: queryKeys.transactions.current(),
        queryFn: async () => {
            const response = await apiService.get('/transaction/current');
            return response.transaction || null;
        },
        staleTime: 30 * 1000, // 30 seconds - transactions update frequently
        gcTime: 2 * 60 * 1000,
        ...options,
    });
}

/**
 * Get transaction by ID
 * @param {string} transactionId - Transaction ID to fetch
 * @param {object} options - Additional React Query options
 */
export function useTransaction(transactionId, options = {}) {
    return useQuery({
        queryKey: queryKeys.transactions.byId(transactionId),
        queryFn: async () => {
            const response = await apiService.get(`/transaction/${transactionId}`);
            return response.transaction;
        },
        enabled: !!transactionId,
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        ...options,
    });
}

/**
 * Get transaction credentials (account details)
 * @param {string} transactionId - Transaction ID
 * @param {object} options - Additional React Query options
 */
export function useTransactionCredentials(transactionId, options = {}) {
    return useQuery({
        queryKey: queryKeys.transactions.credentials(transactionId),
        queryFn: async () => {
            const response = await apiService.get(`/transaction/${transactionId}/credentials`);
            return response.data;
        },
        enabled: !!transactionId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        ...options,
    });
}

/**
 * Release payment mutation
 */
export function useReleasePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ transactionId, buyerPin }) =>
            apiService.put(`/transaction/${transactionId}/release-payment`, { buyerPin }),
        onSuccess: (data, variables) => {
            // Invalidate transaction queries
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });

        },
        onError: (error) => {
            console.error('❌ Failed to release payment:', error);
        },
    });
}

/**
 * Cancel transaction mutation
 */
export function useCancelTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (transactionId) =>
            apiService.put(`/transaction/${transactionId}/cancel`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

        },
        onError: (error) => {
            console.error('❌ Failed to cancel transaction:', error);
        },
    });
}

/**
 * Dispute transaction mutation
 */
export function useDisputeTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ transactionId, reason }) =>
            apiService.put(`/transaction/${transactionId}/dispute`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });

        },
        onError: (error) => {
            console.error('❌ Failed to dispute transaction:', error);
        },
    });
}
