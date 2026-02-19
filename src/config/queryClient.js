import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient configuration for the application
 * Optimized for wallet fetching, chat, and marketplace data
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Preserve current behavior - data available immediately if cached
            staleTime: 5 * 60 * 1000, // 5 minutes (matches walletService cache)
            gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)

            // Retry configuration (matches current walletService)
            retry: 2, // Same as current MAX_RETRIES
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s...

            // Refetch configuration
            refetchOnWindowFocus: true, // Refetch when user returns to window
            refetchOnReconnect: true, // Refetch when internet reconnects
            refetchOnMount: false, // Don't refetch if data is fresh

            // Network mode
            networkMode: 'online', // Only run queries when online
        },
        mutations: {
            retry: 1, // Retry mutations once on failure
            networkMode: 'online',
        },
    },
});
