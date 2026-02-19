// ========================================
// services/cryptoPriceService.js - Crypto Price History API
// Uses CoinGecko free API for historical price data
// ========================================

// CoinGecko API base URL (free, no API key required)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map crypto symbols to CoinGecko coin IDs
const COIN_ID_MAP = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'TRX': 'tron',
    'XRP': 'ripple',
    'DOGE': 'dogecoin',
    'ADA': 'cardano',
    'DOT': 'polkadot'
};

// Cache for price data to prevent excessive API calls
const priceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

class CryptoPriceService {

    /**
     * Get the CoinGecko ID for a crypto symbol
     * @param {string} symbol - Crypto symbol (e.g., 'BTC', 'ETH')
     * @returns {string} CoinGecko coin ID
     */
    getCoinId(symbol) {
        return COIN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
    }

    /**
     * Check if cached data is still valid
     * @param {string} cacheKey - Cache key
     * @returns {Object|null} Cached data or null
     */
    getCachedData(cacheKey) {
        const cached = priceCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('📦 Using cached price data for:', cacheKey);
            return cached.data;
        }
        return null;
    }

    /**
     * Store data in cache
     * @param {string} cacheKey - Cache key
     * @param {Object} data - Data to cache
     */
    setCachedData(cacheKey, data) {
        priceCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Fetch historical price data for charting
     * @param {string} symbol - Crypto symbol (e.g., 'BTC', 'ETH')
     * @param {number} days - Number of days of history (1, 7, 30, 90, 365)
     * @returns {Promise<Object>} Price history data
     */
    async getPriceHistory(symbol, days = 7) {
        const coinId = this.getCoinId(symbol);
        const cacheKey = `history_${coinId}_${days}`;

        // Check cache first
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            console.log(`📈 Fetching ${days}-day price history for ${symbol}...`);

            const response = await fetch(
                `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
                {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Transform data for recharts
            const chartData = data.prices.map(([timestamp, price]) => ({
                time: timestamp,
                date: new Date(timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: days <= 1 ? 'numeric' : undefined,
                    minute: days <= 1 ? '2-digit' : undefined
                }),
                price: price
            }));

            // Calculate price change
            const startPrice = chartData[0]?.price || 0;
            const endPrice = chartData[chartData.length - 1]?.price || 0;
            const priceChange = endPrice - startPrice;
            const percentChange = startPrice > 0 ? (priceChange / startPrice) * 100 : 0;

            const result = {
                chartData,
                currentPrice: endPrice,
                priceChange,
                percentChange,
                isPositive: priceChange >= 0,
                high: Math.max(...chartData.map(d => d.price)),
                low: Math.min(...chartData.map(d => d.price)),
                coinId,
                symbol: symbol.toUpperCase(),
                days
            };

            // Cache the result
            this.setCachedData(cacheKey, result);

            console.log(`✅ Price history fetched for ${symbol}:`, {
                dataPoints: chartData.length,
                currentPrice: endPrice.toFixed(2),
                change: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`
            });

            return result;
        } catch (error) {
            console.error(`❌ Failed to fetch price history for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Fetch current price and basic info for a crypto
     * @param {string} symbol - Crypto symbol
     * @returns {Promise<Object>} Current price info
     */
    async getCurrentPrice(symbol) {
        const coinId = this.getCoinId(symbol);
        const cacheKey = `current_${coinId}`;

        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const coinData = data[coinId];

            if (!coinData) {
                throw new Error(`No data found for ${symbol}`);
            }

            const result = {
                price: coinData.usd,
                change24h: coinData.usd_24h_change || 0,
                volume24h: coinData.usd_24h_vol || 0,
                marketCap: coinData.usd_market_cap || 0,
                isPositive: (coinData.usd_24h_change || 0) >= 0,
                symbol: symbol.toUpperCase()
            };

            this.setCachedData(cacheKey, result);
            return result;
        } catch (error) {
            console.error(`❌ Failed to fetch current price for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Fetch price data for multiple coins
     * @param {Array<string>} symbols - Array of crypto symbols
     * @returns {Promise<Object>} Map of symbol to price data
     */
    async getMultiplePrices(symbols) {
        const coinIds = symbols.map(s => this.getCoinId(s)).join(',');

        try {
            const response = await fetch(
                `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const result = {};

            symbols.forEach(symbol => {
                const coinId = this.getCoinId(symbol);
                const coinData = data[coinId];
                if (coinData) {
                    result[symbol.toUpperCase()] = {
                        price: coinData.usd,
                        change24h: coinData.usd_24h_change || 0,
                        isPositive: (coinData.usd_24h_change || 0) >= 0
                    };
                }
            });

            return result;
        } catch (error) {
            console.error('❌ Failed to fetch multiple prices:', error);
            throw error;
        }
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        priceCache.clear();
        console.log('🗑️ Price cache cleared');
    }
}

export default new CryptoPriceService();
