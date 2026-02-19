/**
 * Query Keys Factory
 * Centralized management of all React Query keys
 * Ensures consistency and prevents typos
 */
export const queryKeys = {
    // Wallet queries
    wallet: {
        all: ['wallet'],
        balance: () => [...queryKeys.wallet.all, 'balance'],
        addresses: (userId) => [...queryKeys.wallet.all, 'addresses', userId],
        addressForCurrency: (userId, currency) => [...queryKeys.wallet.addresses(userId), currency],
        userWallet: (userId) => [...queryKeys.wallet.all, 'user', userId],
        validate: (buyerId, sellerId, currency) => [
            ...queryKeys.wallet.all,
            'validate',
            buyerId,
            sellerId,
            currency,
        ],
    },

    // Chat queries
    chat: {
        all: ['chat'],
        channels: () => [...queryKeys.chat.all, 'channels'],
        messages: (channelId) => [...queryKeys.chat.all, 'messages', channelId],
        metadata: (channelId) => [...queryKeys.chat.all, 'metadata', channelId],
    },

    // Order queries
    orders: {
        all: ['orders'],
        buy: (filters) => [...queryKeys.orders.all, 'buy', filters],
        sell: (filters) => [...queryKeys.orders.all, 'sell', filters],
        byId: (orderId) => [...queryKeys.orders.all, orderId],
    },

    // Transaction queries
    transactions: {
        all: ['transactions'],
        current: () => [...queryKeys.transactions.all, 'current'],
        byId: (txId) => [...queryKeys.transactions.all, txId],
        credentials: (txId) => [...queryKeys.transactions.all, txId, 'credentials'],
    },

    // User queries
    user: {
        all: ['user'],
        profile: (userId) => [...queryKeys.user.all, 'profile', userId],
        current: () => [...queryKeys.user.all, 'current'],
    },

    // Social accounts
    accounts: {
        all: ['accounts'],
        list: (filters) => [...queryKeys.accounts.all, 'list', filters],
        byId: (accountId) => [...queryKeys.accounts.all, accountId],
    },
};
