import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import marketplaceService from '../services/marketplaceService';

/**
 * Fetch buy orders with optional filters
 * @param {object} filters - Filter criteria for buy orders
 * @param {object} options - Additional React Query options
 */
export function useBuyOrders(filters = {}, options = {}) {
    return useQuery({
        queryKey: queryKeys.orders.buy(filters),
        queryFn: () => marketplaceService.getBuyOrders(filters),
        staleTime: 30 * 1000, // 30 seconds - orders update frequently
        gcTime: 2 * 60 * 1000, // 2 minutes
        ...options,
    });
}

/**
 * Fetch sell orders with optional filters
 * @param {object} filters - Filter criteria for sell orders
 * @param {object} options - Additional React Query options
 */
export function useSellOrders(filters = {}, options = {}) {
    return useQuery({
        queryKey: queryKeys.orders.sell(filters),
        queryFn: () => marketplaceService.getSellOrders(filters),
        staleTime: 30 * 1000,
        gcTime: 2 * 60 * 1000,
        ...options,
    });
}

/**
 * Fetch ALL sell orders for table.jsx
 * Includes automatic retry, polling, and error resilience
 * @param {object} options - Additional React Query options
 */
export function useAllSellOrders(options = {}) {
    return useQuery({
        queryKey: queryKeys.orders.sell('all'),
        queryFn: async () => {
            const response = await marketplaceService.getAllSellOrders();
            return response;
        },
        staleTime: 20 * 1000, // 20 seconds - slightly fresher than regular orders
        gcTime: 5 * 60 * 1000, // 5 minutes cache
        refetchInterval: 30 * 1000, // Poll every 30s (matching previous behavior)
        refetchIntervalInBackground: false, // Don't poll when tab is hidden
        retry: 3, // Retry 3 times on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // 1s, 2s, 4s max
        ...options,
    });
}

/**
 * Fetch ALL buy orders for buysellTable.jsx
 * Includes automatic retry, polling, and error resilience
 * @param {object} options - Additional React Query options
 */
export function useAllBuyOrders(options = {}) {
    return useQuery({
        queryKey: queryKeys.orders.buy('all'),
        queryFn: async () => {
            const response = await marketplaceService.getAllBuyOrders();
            return response;
        },
        staleTime: 20 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchInterval: 30 * 1000,
        refetchIntervalInBackground: false,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        ...options,
    });
}

/**
 * Get specific order by ID
 * @param {string} orderId - Order ID to fetch
 * @param {object} options - Additional React Query options
 */
export function useOrder(orderId, options = {}) {
    return useQuery({
        queryKey: queryKeys.orders.byId(orderId),
        queryFn: () => marketplaceService.getOrderById(orderId),
        enabled: !!orderId,
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        ...options,
    });
}

/**
 * Create sell order mutation
 */
export function useCreateSellOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderData) => marketplaceService.createSellOrder(orderData),
        onSuccess: () => {
            // Invalidate sell orders list to trigger refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.sell() });
        },
        onError: (error) => {
            console.error('❌ Failed to create sell order:', error);
        },
    });
}

/**
 * Create buy order mutation
 */
export function useCreateBuyOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderData) => marketplaceService.createBuyOrder(orderData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.buy() });
        },
        onError: (error) => {
            console.error('❌ Failed to create buy order:', error);
        },
    });
}

/**
 * Initiate transaction from sell order
 */
export function useInitiateFromSellOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (transactionData) => marketplaceService.initiateFromSellOrder(transactionData),
        onSuccess: (data) => {
            // Invalidate relevant queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });

        },
        onError: (error) => {
            console.error('❌ Failed to initiate transaction from sell order:', error);
        },
    });
}

/**
 * Initiate transaction from buy order
 */
export function useInitiateFromBuyOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, transactionData }) =>
            marketplaceService.initiateBuyOrderTransaction(orderId, transactionData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });

        },
        onError: (error) => {
            console.error('❌ Failed to initiate transaction from buy order:', error);
        },
    });
}
