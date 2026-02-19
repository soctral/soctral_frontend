import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import cryptoPriceService from '../../services/cryptoPriceService';

// Asset icon imports
import btc from '../../assets/btc.svg';
import usdt from '../../assets/usdt.svg';
import eth from '../../assets/eth.svg';
import sol from '../../assets/sol.svg';
import bnb from '../../assets/bnb.svg';
import trx from '../../assets/trx.svg';
import base from '../../assets/base-logo.png';

// Icon map for assets
const ASSET_ICONS = {
    BTC: btc,
    ETH: eth,
    USDT: usdt,
    BASE: base,
    SOL: sol,
    BNB: bnb,
    TRX: trx
};

// Time range options
const TIME_RANGES = [
    { label: '1D', days: 1 },
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: '1Y', days: 365 }
];

const CryptoPriceChart = ({
    asset,
    onBack,
    walletBalance = '0',
    isVisible = true
}) => {
    const [selectedRange, setSelectedRange] = useState(7); 
    const [priceData, setPriceData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch price data when asset or range changes
    useEffect(() => {
        if (!asset?.abbreviation || !isVisible) return;

        const fetchPriceData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await cryptoPriceService.getPriceHistory(
                    asset.abbreviation,
                    selectedRange
                );
                setPriceData(data);
            } catch (err) {
                console.error('Failed to fetch price data:', err);
                setError('Failed to load price data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPriceData();
    }, [asset?.abbreviation, selectedRange, isVisible]);

    // Handle refresh
    const handleRefresh = async () => {
        if (isRefreshing || !asset?.abbreviation) return;

        setIsRefreshing(true);
        setError(null);
        setIsLoading(true);
        cryptoPriceService.clearCache();

        try {
            const data = await cryptoPriceService.getPriceHistory(
                asset.abbreviation,
                selectedRange
            );
            setPriceData(data);
        } catch (err) {
            console.error('Refresh failed:', err);
            setError('Failed to refresh. Please try again.');
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    };

    // Chart colors based on price direction
    const chartColors = useMemo(() => {
        const isPositive = priceData?.isPositive ?? true;
        return {
            stroke: isPositive ? '#22c55e' : '#ef4444',
            gradientStart: isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            gradientEnd: isPositive ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'
        };
    }, [priceData?.isPositive]);

    // Format price for display
    const formatPrice = (price) => {
        if (!price) return '$0.00';
        if (price >= 1000) {
            return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (price >= 1) {
            return `$${price.toFixed(2)}`;
        }
        return `$${price.toFixed(6)}`;
    };

    // Custom tooltip for chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a2e] px-3 py-2 rounded-lg border border-white/10 shadow-lg">
                    <p className="text-gray-400 text-xs">{label}</p>
                    <p className="text-white font-semibold">
                        {formatPrice(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <RefreshCw
                        className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                </button>
            </div>

            {/* Asset Info */}
            <div className="flex justify-between items-center gap-4 mb-6">
          
                <div>
                    <h2 className="text-xl font-bold text-white">{asset?.name}</h2>
                    <p className="text-gray-400">{asset?.abbreviation}</p>
                </div>

                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <img
                        src={ASSET_ICONS[asset?.abbreviation] || btc}
                        alt={asset?.name}
                        className="w-8 h-8"
                    />
                </div>
            </div>

      

  
                <p className="text-white text-base font-semibold mb-1">{asset?.name} Balance</p>

                    {/* Your Balance */}
            <div className="bg-[#181818] mb-3 rounded-xl p-4  ">
                <p className="text-white text-xl font-bold mb-4">
                    {walletBalance} {asset?.abbreviation}
                </p>

<div className='flex items-center justify-between'>
      <span className='text-sm'>Total Value</span>
                {priceData && (
                    <p className="text-gray-400 text-sm">
                        ≈ {formatPrice(parseFloat(walletBalance || 0) * priceData.currentPrice)}
                    </p>
                )}
</div>
          
            </div>


<div className='bg-[#181818] rounded-xl p-4 mb-3'>

      {/* Market Value & Price */}
            <div className="mb-4">
                {isLoading ? (
                    <div className="animate-pulse">
                        <div className="h-10 bg-white/10 rounded w-40 mb-2"></div>
                        <div className="h-6 bg-white/10 rounded w-24"></div>
                    </div>
                ) : priceData ? (
                    <>
                    <p className='mb-3 text-gray-400 text-sm'>{asset?.abbreviation}'s Market Value</p>
                        <h1 className="text-xl font-bold text-white mb-1">
                            {formatPrice(priceData.currentPrice)}
                        </h1>
                        <div className="flex items-center gap-2">
                            {priceData.isPositive ? (
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-red-500" />
                            )}
                            <span className={`font-semibold ${priceData.isPositive ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {priceData.isPositive ? '+' : ''}
                                {priceData.percentChange.toFixed(2)}%
                            </span>
                            <span className="text-gray-400 text-sm">
                                Over the last {selectedRange === 1 ? 'day' : selectedRange === 7 ? 'week' : selectedRange === 30 ? 'month' : selectedRange === 90 ? '3 months' : 'year'}
                            </span>
                        </div>
                    </>
                ) : null}
            </div>



            {/* Chart */}
            <div className="h-[250px] mb-4">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-[#05B51C] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-400">Loading chart...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-red-400 mb-3">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-[#05B51C] rounded-lg text-white hover:bg-[#05B51C]/80 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : priceData?.chartData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={priceData.chartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColors.gradientStart} stopOpacity={1} />
                                    <stop offset="95%" stopColor={chartColors.gradientEnd} stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                interval="preserveStartEnd"
                                minTickGap={50}
                            />
                            <YAxis
                                domain={['dataMin', 'dataMax']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickFormatter={(value) => formatPrice(value).replace('$', '')}
                                width={80}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={chartColors.stroke}
                                strokeWidth={2}
                                fill="url(#priceGradient)"
                                animationDuration={500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : null}
            </div>

            {/* High/Low Stats */}
            {priceData && !isLoading && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1">
                            {TIME_RANGES.find(r => r.days === selectedRange)?.label} High
                        </p>
                        <p className="text-white font-semibold">{formatPrice(priceData.high)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1">
                            {TIME_RANGES.find(r => r.days === selectedRange)?.label} Low
                        </p>
                        <p className="text-white font-semibold">{formatPrice(priceData.low)}</p>
                    </div>
                </div>
            )}

                      {/* Time Range Selector */}
            <div className="flex items-center justify-between w-full gap-2 my-4">
                {TIME_RANGES.map((range) => (
                    <button
                        key={range.days}
                        onClick={() => setSelectedRange(range.days)}
                        className={`px-2 py-2 rounded-full text-sm font-medium transition-all ${selectedRange === range.days
                                ? 'bg-[#05B51C] text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>
</div>

    
        </motion.div>
    );
};

export default CryptoPriceChart;
