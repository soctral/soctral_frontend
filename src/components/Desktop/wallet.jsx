import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Plus, ChevronDown } from 'lucide-react';
import { Link } from "react-router-dom";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import withdraw from "../../assets/withdrawal.svg";
import btc from "../../assets/btc.svg";
import usdt from "../../assets/usdt.svg";
import eth from "../../assets/eth.svg";
import base from "../../assets/base-logo.jpg";
import tron from "../../assets/trx.svg";
import bnb from "../../assets/bnb.svg";
import solana from "../../assets/sol.svg";
import authService from "../../services/authService";
import { useUser } from "../../context/userContext";
import { io } from 'socket.io-client';

const WalletBalance = ({ setShowFundModal, onWithdrawClick }) => {
  const [showBalance, setShowBalance] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showSlideMenu, setShowSlideMenu] = useState(false);

  // Wallet data states
  const [walletData, setWalletData] = useState({
    balances: {},
    addresses: {},
    isLoading: false,
    error: null
  });

  const socketRef = useRef(null);
  const { user: userData, isAuthenticated } = useUser();

  // Socket.IO connection setup
  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect socket if user is not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = authService.getAuthToken();
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io('https://soctra-api-6bcecb2e8189.herokuapp.com', {
      path: '/wallet-balance/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Listen for wallet balance updates
    socketRef.current.on('walletUpdate', (data) => {
      
      if (data && data.walletBalances) {
        setWalletData(prev => ({
          ...prev,
          balances: data.walletBalances,
          addresses: data.walletAddresses || prev.addresses,
          isLoading: false,
          error: null
        }));
      }
    });

    // Listen for errors
    socketRef.current.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    socketRef.current.on('disconnect', (reason) => {
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  // Fetch wallet data function
  const fetchWalletData = async () => {
    if (!isAuthenticated) {
      setWalletData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: null 
      }));
      return;
    }

    try {
      const walletInfo = await authService.getUserWalletInfo();
      
      if (walletInfo.status) {
        setWalletData({
          balances: walletInfo.walletBalances,
          addresses: walletInfo.walletAddresses,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('❌ Error fetching wallet data:', error);
      setWalletData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: null 
      }));
    }
  };

  // Initial wallet data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletData();
    } else {
      setWalletData({
        balances: {},
        addresses: {},
        isLoading: false,
        error: null
      });
    }
  }, [isAuthenticated]);

  // Get dynamic wallet balance
  const getWalletBalance = () => {
    if (!isAuthenticated) return "0.00";
    if (walletData.error) return "0.00";
    
    const portfolio = walletData.balances?.portfolio;
    if (portfolio && portfolio.totalValueUSD) {
      return parseFloat(portfolio.totalValueUSD).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    // If no portfolio data, calculate from individual balances
    const balances = walletData.balances;
    let totalUSD = 0;
    
    Object.entries(balances).forEach(([key, data]) => {
      if (key !== 'total' && key !== 'portfolio' && data?.valueUSD) {
        totalUSD += parseFloat(data.valueUSD);
      }
    });
    
    return totalUSD.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Enhanced crypto image mapping
  const getCryptoImage = (currencyKey, currencyName) => {
    const imageMap = {
      bitcoin: btc,
      ethereum: eth,
      usdt: usdt,
      tether: usdt,
      solana: solana,
      binance: bnb, 
      base: base,
      tron: tron,
      BTC: btc,
      ETH: eth,
      USDT: usdt,
      SOL: solana,
      BNB: bnb,
      TRX: tron,
      BASE: base,
      Bitcoin: btc,
      Ethereum: eth,
      Tether: usdt
    };

    return imageMap[currencyKey] || imageMap[currencyName] || btc;
  };

  // Get dynamic currencies from API data
  const getDynamicCurrencies = () => {
    if (!isAuthenticated || !walletData.balances || Object.keys(walletData.balances).length === 0) {
      return [
        { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", priceUSD: 0, changePercent: 0, currencyKey: "usdt" },
        { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", priceUSD: 0, changePercent: 0, currencyKey: "bitcoin" },
        { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", priceUSD: 0, changePercent: 0, currencyKey: "ethereum" }
      ];
    }

    const currencies = [];
    const balances = walletData.balances;

    const currencyMapping = {
      usdt: { name: "USDT", symbol: "$" },
      tether: { name: "USDT", symbol: "$" },
      bitcoin: { name: "BTC", symbol: "₿" },
      ethereum: { name: "ETH", symbol: "Ξ" },
      solana: { name: "SOL", symbol: "SOL" },
      binance: { name: "BNB", symbol: "BNB" },
      base: { name: "BASE", symbol: "ETH" },
      tron: { name: "TRX", symbol: "TRX" }
    };

    Object.entries(balances).forEach(([key, data]) => {
      if (key === 'total' || key === 'portfolio') return;
      
      const mapping = currencyMapping[key.toLowerCase()];
      if (mapping && data && typeof data === 'object' && data.priceUSD !== undefined) {
        const priceUSD = parseFloat(data.priceUSD || '0');
        const changePercent = parseFloat(data.percentageChange24h || '0');
        
        currencies.push({
          name: mapping.name,
          rate: priceUSD.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: priceUSD < 1 ? 6 : 2
          }),
          change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
          symbol: mapping.symbol,
          priceUSD: priceUSD,
          changePercent: changePercent,
          currencyKey: key
        });
      }
    });

    const priorityOrder = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'BASE', 'TRX'];
    currencies.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.name);
      const bIndex = priorityOrder.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return currencies.length > 0 ? currencies : [
      { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", priceUSD: 0, changePercent: 0, currencyKey: "usdt" },
      { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", priceUSD: 0, changePercent: 0, currencyKey: "bitcoin" },
      { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", priceUSD: 0, changePercent: 0, currencyKey: "ethereum" }
    ];
  };

  // Get dynamic crypto currencies
  const getDynamicCryptoCurrencies = () => {
    if (!isAuthenticated || !walletData.balances || Object.keys(walletData.balances).length === 0) {
      return [
        { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "bitcoin" },
        { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "usdt" },
        { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "ethereum" }
      ];
    }

    const cryptoCurrencies = [];
    const balances = walletData.balances;

    const currencyMapping = {
      bitcoin: { name: "BTC", symbol: "₿" },
      ethereum: { name: "ETH", symbol: "Ξ" },
      usdt: { name: "USDT", symbol: "$" },
      tether: { name: "USDT", symbol: "$" },
      solana: { name: "SOL", symbol: "SOL" },
      binance: { name: "BNB", symbol: "BNB" },
      base: { name: "BASE", symbol: "ETH" },
      tron: { name: "TRX", symbol: "TRX" }
    };

    Object.entries(balances).forEach(([key, data]) => {
      if (key === 'total' || key === 'portfolio') return;
      
      const mapping = currencyMapping[key.toLowerCase()];
      if (mapping && data && typeof data === 'object') {
        const priceUSD = parseFloat(data.priceUSD || '0');
        const changePercent = parseFloat(data.percentageChange24h || '0');
        const balance = data.balance || '0';
        const valueUSD = data.valueUSD || '0.00';
        
        cryptoCurrencies.push({
          name: mapping.name,
          rate: priceUSD.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: priceUSD < 1 ? 6 : 2
          }),
          change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
          symbol: mapping.symbol,
          balance: parseFloat(balance).toFixed(4),
          valueUSD: parseFloat(valueUSD).toFixed(2),
          priceUSD: priceUSD,
          changePercent: changePercent,
          rawBalance: balance,
          currencyKey: key
        });
      }
    });

    const priorityOrder = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'BASE', 'TRX'];
    cryptoCurrencies.sort((a, b) => {
      const aValue = parseFloat(a.valueUSD);
      const bValue = parseFloat(b.valueUSD);
      
      if (Math.abs(aValue - bValue) > 0.01) {
        return bValue - aValue;
      }
      
      const aIndex = priorityOrder.indexOf(a.name);
      const bIndex = priorityOrder.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return cryptoCurrencies.length > 0 ? cryptoCurrencies : [
      { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "bitcoin" },
      { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "usdt" },
      { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "ethereum" }
    ];
  };

  // Get current currency with enhanced error handling
  const getCurrentCurrency = () => {
    const dynamicCurrencies = getDynamicCurrencies();
    
    if (dynamicCurrencies.length === 0) {
      return { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", priceUSD: 0, changePercent: 0 };
    }
    
    const found = dynamicCurrencies.find((c) => c.name === selectedCurrency);
    
    if (found) {
      return found;
    }
    
    const fallback = dynamicCurrencies[0];
    
    if (fallback && !found) {
      setSelectedCurrency(fallback.name);
    }
    
    return fallback;
  };

  // Update selected currency when dynamic currencies change
  useEffect(() => {
    const dynamicCurrencies = getDynamicCurrencies();
    
    if (dynamicCurrencies.length > 0) {
      const hasSelectedCurrency = dynamicCurrencies.some(c => c.name === selectedCurrency);
      
      if (!hasSelectedCurrency) {
        setSelectedCurrency(dynamicCurrencies[0].name);
      }
    }
  }, [walletData, selectedCurrency]);

  return (
    <div className="flex max-w-7xl mx-auto gap-6 !h-[calc(100vh-88px-48px)]">
      <aside className="w-[22rem] shrink-0">
        <div className="bg-[#181818] h-full rounded-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

          <div className="relative z-10">
            <div className="p-6">
              <h3 className="font-semibold text-base mb-[1.5rem]">
                Wallet Balance
              </h3>

              <div className="flex items-center text-[11px] justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-centers gap-1">
                    <p className="text-white/80 text-xs">Currency:</p>
                    {/* Currency Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowCurrencyDropdown(!showCurrencyDropdown)
                        }
                        className="flex items-center gap-1"
                      >
                        <span className="text-xs font-medium">
                          {selectedCurrency}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            showCurrencyDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {showCurrencyDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] rounded-lg border border-white/10 z-20 min-w-[120px]">
                          {getDynamicCurrencies().map((currency) => (
                            <button
                              key={currency.name}
                              onClick={() => {
                                setSelectedCurrency(currency.name);
                                setShowCurrencyDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              <div className="font-medium">
                                {currency.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Currency Rate Display */}
                <div className="flex items-center gap-2">
                  <span className="text-white pt-[1px] font-medium">
                    ${getCurrentCurrency().rate}
                  </span>
                  <span
                    className={`text-xs ${
                      getCurrentCurrency().changePercent >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {getCurrentCurrency().change}
                  </span>
                </div>
              </div>

              {/* Balance Display */}
              <div className="flex items-center justify-center gap-3 mb-5 py-[1.2rem]">
                <span className="text-md font-bold text-white">
                  {getCurrentCurrency().symbol}
                  {showBalance ? getWalletBalance() : "••••••"}
                </span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {showBalance ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFundModal(true)} 
                  className="flex items-center text-[11px] justify-center gap-2 w-full py-[.7rem] whitespace-nowrap px-4 bg-primary rounded-full text-white font-medium hover:bg-opacity-70 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Fund Wallet
                </button>
                <button 
                  onClick={() => onWithdrawClick()} 
                  className="flex items-center text-[11px] justify-center gap-2 w-full py-[.7rem] px-2 bg-purple-100 rounded-full text-purple-600 font-medium hover:bg-purple-200 transition-colors"
                >
                  <img src={withdraw} className="h-4 w-4" alt="" />
                  Withdraw
                </button>
              </div>
            </div>

            <div className="pb-[5rem]">
              {getDynamicCryptoCurrencies().map((crypto) => (
                <div key={crypto.name} className="">
                  <div className="flex items-center border-t border-gray-700 justify-between">
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <img
                          className="text-xs font-bold w-full h-full object-contain"
                          src={getCryptoImage(crypto.currencyKey, crypto.name)}
                          alt={`${crypto.name} logo`}
                          onError={(e) => { e.target.src = btc; }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {crypto.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          Balance: {crypto.balance}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col p-2 items-end gap-1">
                      <span className="text-white text-sm font-medium">
                        ${crypto.rate}
                      </span>
                      <span
                        className={`text-xs ${
                          crypto.changePercent >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {crypto.change}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default WalletBalance;