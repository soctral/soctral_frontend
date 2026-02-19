import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Eye,
  EyeOff,
  ChevronLeft,
  Star,
  ArrowLeft,
  X,
  ChevronRight,
  ChevronDown,
  Gift,
  Bell,
  Shield
} from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import withdraw from "../assets/withdrawal.svg";
import btc from "../assets/btc.svg";
import usdt from "../assets/usdt.svg";
import eth from "../assets/eth.svg";

import base from "../assets/base-logo.png";
import tron from "../assets/trx.svg";
import bnb from "../assets/bnb.svg";
import solana from "../assets/sol.svg";
import usdc from "../assets/usdc.svg";


import frame0 from "../assets/frame1.svg";
import frame00 from "../assets/frame2.svg";
import frame000 from "../assets/frame3.svg";
import badge from "../assets/verifiedstar.svg";
import ig from "../assets/ig.svg";
import linkedin from "../assets/linkedin.svg";
import tik from "../assets/tik.svg";
import ig2 from "../assets/socialicon.svg";
import ug1 from "../assets/ug1.png";
import ug2 from "../assets/ug2.png";
import ug3 from "../assets/ug3.png";
import ug4 from "../assets/ug4.jpg";
import shield from "../assets/Shield.svg";
import authService from "../services/authService";
import Navbar from "../components/Desktop/Navbar";
import Menu from "../components/Menu";
import RenderWalletContent from '../components/Desktop/wallet'
import ProfileSettings from '../components/Desktop/ProfileSettings';
import Tables from '../components/Desktop/table';
import BuySellTable from '../components/Desktop/buysellTable';
import Chat from '../components/Desktop/chat';
import SignIn from "../layouts/SignInDesktop";
import SignUp from "../layouts/SignUpDesktop";
import { useUser } from "../context/userContext";
import WalletTransactionModal from '../components/Desktop/WalletTransaction';
import HistoryTable from '../components/Desktop/HistoryTable';
import WalletSetupModal from '../components/Desktop/WalletModal';
import UploadAccountListed from '../components/Desktop/UploadAccountListed';
import walletService from '../services/walletService';
import chatService from '../services/chatService';
import { RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';



const HomePage = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [tableHeight, setTableHeight] = useState(320);
  const [showSlideMenu, setShowSlideMenu] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [showVerificationCard, setShowVerificationCard] = useState(true);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState('');
  const [walletModalType, setWalletModalType] = useState(null);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [showWalletSetupModal, setShowWalletSetupModal] = useState(false);
  const [isCheckingWalletPin, setIsCheckingWalletPin] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewAccountData, setViewAccountData] = useState(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0); // Track chat unread count for navbar badge

  // Authentication states
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Wallet data states - SIMPLIFIED
  const [walletData, setWalletData] = useState({
    balances: {},
    addresses: {},
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  const tableContainerRef = useRef(null);
  const mainContentRef = useRef(null);
  const tableBodyRef = useRef(null);
  const bodyRef = useRef(null);
  const [activeMenuSection, setActiveMenuSection] = useState('wallet');
  const socketRef = useRef(null);
  const pollingIntervalRef = useRef(null); // 🔥 NEW: For polling

  const {
    user: userData,
    isAuthenticated,
    isLoading: isLoadingUser
  } = useUser();

  const { logout } = useUser();




  // Socket.IO connection setup
  useEffect(() => {
    if (!isAuthenticated) {
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
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10, // ⭐ Increased for better reliability
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {

      // Subscribe to wallet balance updates
      socketRef.current.emit('subscribe', { action: 'subscribe' });

      // ⭐ NEW: Request immediate wallet data on connect
      socketRef.current.emit('request-wallet-update', {
        userId: userData?._id || userData?.id
      });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    // 🔥 PRIMARY: Listen for wallet-balance-update event
    socketRef.current.on('wallet-balance-update', async (data) => {

      if (data && data.walletBalances) {
        // Force a new object reference to trigger React re-render
        setWalletData({
          balances: { ...data.walletBalances }, // Create new object reference
          addresses: data.walletAddresses ? { ...data.walletAddresses } : { ...walletData.addresses },
          isLoading: false,
          error: null,
          lastUpdated: Date.now() // Add timestamp to force re-render
        });

        // Pass wallet addresses to WalletService
        if (data.walletAddresses) {
          try {
            const { default: walletService } = await import('../services/walletService');
            walletService.setUserContextWallets({
              walletAddresses: data.walletAddresses,
              walletBalances: data.walletBalances
            });
          } catch (error) {
            console.error('❌ Failed to import walletService:', error);
          }
        }

      }
    });

    // 🔥 BACKUP: Listen for alternative update events
    socketRef.current.on('balance-updated', (data) => {
      if (data && data.walletBalances) {
        socketRef.current.emit('request-wallet-update', {
          userId: userData?._id || userData?.id
        });
      }
    });

    socketRef.current.on('transaction-completed', (data) => {
      // Request fresh wallet data when transaction completes
      socketRef.current.emit('request-wallet-update', {
        userId: userData?._id || userData?.id
      });
    });

    // Listen for errors
    socketRef.current.on('error', (error) => {
      console.error('❌ Socket error:', error.message);
    });

    socketRef.current.on('disconnect', (reason) => {

      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        socketRef.current.connect();
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, userData]);

 

  const refreshWalletBalance = async () => {

    setWalletData(prev => ({ ...prev, isLoading: true }));

    try {
      // Try socket first
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('request-wallet-update', {
          userId: userData?._id || userData?.id
        });

        // Wait for response (with timeout)
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            // Reset loading state on timeout
            setWalletData(prev => ({ ...prev, isLoading: false }));
            resolve();
          }, 5000);

          const handler = (data) => {
            clearTimeout(timeout);
            // 🔥 FIX: Reset loading state when response received
            if (data && data.walletBalances) {
              setWalletData({
                balances: { ...data.walletBalances },
                addresses: data.walletAddresses ? { ...data.walletAddresses } : walletData.addresses,
                isLoading: false,
                error: null,
                lastUpdated: Date.now()
              });
            } else {
              setWalletData(prev => ({ ...prev, isLoading: false }));
            }
            resolve();
          };
          socketRef.current.once('wallet-balance-update', handler);
        });
      } else {
        // Fallback to API
        const walletInfo = await authService.getUserWalletInfo();
        if (walletInfo.status) {
          setWalletData({
            balances: walletInfo.walletBalances,
            addresses: walletInfo.walletAddresses,
            isLoading: false,
            error: null,
            lastUpdated: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      setWalletData(prev => ({ ...prev, isLoading: false }));
    }
  };






  const handleViewAccountMetrics = (accountData) => {
    console.log('Viewing account metrics:', {
      platform: accountData.platform,
      hasMetrics: !!accountData.metrics,
      hasFilters: !!accountData.filters,
      accountId: accountData.accountId
    });

    // Set the account data for viewing
    setViewAccountData(accountData);

    // Open the upload modal
    setShowUploadModal(true);

  };


  // Fetch wallet data function - UPDATED
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
      // 🔥 SILENT: Don't show loading state since Socket.IO provides real-time data
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
      // 🔥 SILENT: Don't log CORS/503 errors - Socket.IO will provide data
      // Just use empty state until Socket.IO connects
      setWalletData(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
    }
  };


  // Get dynamic wallet balance - UPDATED FOR NEW STRUCTURE
  const getWalletBalance = () => {
    if (!isAuthenticated) return "0.00";
    if (walletData.error) return "0.00";

    // Try portfolio data first (new structure)
    const portfolio = walletData.balances?.portfolio;
    if (portfolio && portfolio.totalValueUSD) {
      return parseFloat(portfolio.totalValueUSD).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    // Calculate from currencies with networks (new structure)
    const currencies = walletData.balances?.currencies;
    if (currencies && typeof currencies === 'object') {
      let totalUSD = 0;
      Object.values(currencies).forEach(currency => {
        if (currency?.networks) {
          Object.values(currency.networks).forEach(network => {
            if (network?.valueUSD) {
              totalUSD += parseFloat(network.valueUSD);
            }
          });
        }
      });
      if (totalUSD > 0) {
        return totalUSD.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    }

    // Fallback: calculate from individual balances (old structure)
    const balances = walletData.balances;
    let totalUSD = 0;

    Object.entries(balances || {}).forEach(([key, data]) => {
      if (key !== 'total' && key !== 'portfolio' && key !== 'currencies' && data?.valueUSD) {
        totalUSD += parseFloat(data.valueUSD);
      }
    });

    return totalUSD.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };



  useEffect(() => {
    const handleInitiateTradeEvent = (event) => {
      const sellerData = event.detail;

      // Set the selected chat user
      setSelectedChatUser(sellerData);

      // Switch to chat section
      setActiveMenuSection('chat');
      setActiveTab('chat');

    };

    // Add event listener
    window.addEventListener('initiateTrade', handleInitiateTradeEvent);

    // Cleanup
    return () => {
      window.removeEventListener('initiateTrade', handleInitiateTradeEvent);
    };
  }, []);

  // 🔥 Listen for navigate-to-history event from Chat's success modals
  useEffect(() => {
    const handleNavigateToHistory = () => {
      setActiveTab('history');
      setActiveMenuSection('wallet');
    };

    window.addEventListener('navigate-to-history', handleNavigateToHistory);
    return () => {
      window.removeEventListener('navigate-to-history', handleNavigateToHistory);
    };
  }, []);

  // Listen for chat unread count updates from Chat component
  useEffect(() => {
    const handleChatUnreadUpdate = (event) => {
      const { totalUnread } = event.detail || {};
      if (typeof totalUnread === 'number') {
        setChatUnreadCount(totalUnread);
      }
    };

    window.addEventListener('chatUnreadCountUpdate', handleChatUnreadUpdate);

    return () => {
      window.removeEventListener('chatUnreadCountUpdate', handleChatUnreadUpdate);
    };
  }, []);

  // Enhanced crypto image mapping with fallbacks
  const getCryptoImage = (currencyKey, currencyName) => {
    const imageMap = {
      // Primary mappings by API key (new structure)
      eth: eth,
      btc: btc,
      sol: solana,
      bnb: bnb,
      trx: tron,
      usdt: usdt,
      usdc: usdc,
      
      // Legacy mappings by API key (old structure)
      bitcoin: btc,
      ethereum: eth,
      tether: usdt,
      solana: solana,
      binance: bnb,
      tron: tron,
      base: base,

      // Fallbacks by display name
      BTC: btc,
      ETH: eth,
      USDT: usdt,
      SOL: solana,
      BNB: bnb,
      TRX: tron,
      BASE: base,
      USDC: usdc,

      // Alternative names
      Bitcoin: btc,
      Ethereum: eth,
      Tether: usdt,
      USDCoin: usdc,
    };

    return imageMap[currencyKey] || imageMap[currencyName] || btc;
  };

  // Get dynamic currencies from API data - UPDATED FOR NEW STRUCTURE
  const getDynamicCurrencies = () => {
    // Return default data if not authenticated or no wallet data
    if (!isAuthenticated || !walletData.balances || Object.keys(walletData.balances).length === 0) {
      return [
        { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", priceUSD: 0, changePercent: 0, currencyKey: "usdt" },
        { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", priceUSD: 0, changePercent: 0, currencyKey: "btc" },
        { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", priceUSD: 0, changePercent: 0, currencyKey: "eth" },
        { name: "BASE", rate: "0.00", change: "+0.00%", symbol: "BASE", priceUSD: 0, changePercent: 0, currencyKey: "base" },
        { name: "USDC", rate: "0.00", change: "+0.00%", symbol: "USDC", priceUSD: 0, changePercent: 0, currencyKey: "usdc" }
      ];
    }

    const currencies = [];
    
    // Currency mapping for display
    const currencyMapping = {
      eth: { name: "ETH", symbol: "Ξ" },
      btc: { name: "BTC", symbol: "₿" },
      usdt: { name: "USDT", symbol: "$" },
      usdc: { name: "USDC", symbol: "USDC" },
      sol: { name: "SOL", symbol: "SOL" },
      bnb: { name: "BNB", symbol: "BNB" },
      trx: { name: "TRX", symbol: "TRX" }
    };

    // NEW STRUCTURE: Process currencies from walletBalances.currencies
    const currenciesData = walletData.balances?.currencies;
    if (currenciesData && typeof currenciesData === 'object') {
      Object.entries(currenciesData).forEach(([key, currencyData]) => {
        const mapping = currencyMapping[key.toLowerCase()];
        if (mapping && currencyData?.networks) {
          // Get price data from first available network
          const firstNetwork = Object.values(currencyData.networks)[0];
          if (firstNetwork) {
            const priceUSD = parseFloat(firstNetwork.priceUSD || '0');
            const changePercent = parseFloat(firstNetwork.percentageChange24h || '0');

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
        }
      });
    }

    // FALLBACK: Old structure - process balances directly
    if (currencies.length === 0) {
      const balances = walletData.balances;
      const oldCurrencyMapping = {
        usdt: { name: "USDT", symbol: "$" },
        tether: { name: "USDT", symbol: "$" },
        bitcoin: { name: "BTC", symbol: "₿" },
        ethereum: { name: "ETH", symbol: "Ξ" },
        solana: { name: "SOL", symbol: "SOL" },
        binance: { name: "BNB", symbol: "BNB" },
        tron: { name: "TRX", symbol: "TRX" },
        base: { name: "BASE", symbol: "BASE" },
        usdc: { name: "USDC", symbol: "USDC" }
      };

      Object.entries(balances || {}).forEach(([key, data]) => {
        if (key === 'total' || key === 'portfolio' || key === 'currencies') return;

        const mapping = oldCurrencyMapping[key.toLowerCase()];
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
    }

    // Sort by priority and market importance
    const priorityOrder = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'TRX', 'BASE', 'USDC'];
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
      { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", priceUSD: 0, changePercent: 0, currencyKey: "btc" },
      { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", priceUSD: 0, changePercent: 0, currencyKey: "eth" },
      { name: "BASE", rate: "0.00", change: "+0.00%", symbol: "BASE", priceUSD: 0, changePercent: 0, currencyKey: "base" }
    ];
  };


  const getUserAvatar = () => {
    return userData?.avatar || userData?.bitmojiUrl || null;
  };

  // Get dynamic crypto currencies - UPDATED FOR NEW STRUCTURE
  const getDynamicCryptoCurrencies = () => {
    // Return default data if not authenticated or no wallet data
    if (!isAuthenticated || !walletData.balances || Object.keys(walletData.balances).length === 0) {
      return [
        { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "btc" },
        { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "usdt" },
        { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "eth" }
      ];
    }

    const cryptoCurrencies = [];

    // Currency mapping for display
    const currencyMapping = {
      eth: { name: "ETH", symbol: "Ξ" },
      btc: { name: "BTC", symbol: "₿" },
      usdt: { name: "USDT", symbol: "$" },
      usdc: { name: "USDC", symbol: "USDC" },
      sol: { name: "SOL", symbol: "SOL" },
      bnb: { name: "BNB", symbol: "BNB" },
      trx: { name: "TRX", symbol: "TRX" }
    };

    // NEW STRUCTURE: Process currencies from walletBalances.currencies
    const currenciesData = walletData.balances?.currencies;
    if (currenciesData && typeof currenciesData === 'object') {
      Object.entries(currenciesData).forEach(([key, currencyData]) => {
        const mapping = currencyMapping[key.toLowerCase()];
        if (mapping && currencyData?.networks) {
          // Aggregate balances from all networks
          let totalBalance = 0;
          let totalValueUSD = 0;
          let priceUSD = 0;
          let changePercent = 0;

          Object.values(currencyData.networks).forEach(network => {
            totalBalance += parseFloat(network.balance || '0');
            totalValueUSD += parseFloat(network.valueUSD || '0');
            // Use price from any network (they should be same for same currency)
            if (!priceUSD && network.priceUSD) {
              priceUSD = parseFloat(network.priceUSD);
              changePercent = parseFloat(network.percentageChange24h || '0');
            }
          });

          cryptoCurrencies.push({
            name: mapping.name,
            rate: priceUSD.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: priceUSD < 1 ? 6 : 2
            }),
            change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            symbol: mapping.symbol,
            balance: totalBalance.toFixed(6),
            valueUSD: totalValueUSD.toFixed(2),
            priceUSD: priceUSD,
            changePercent: changePercent,
            rawBalance: totalBalance.toString(),
            currencyKey: key
          });
        }
      });
    }

    // FALLBACK: Old structure - process balances directly
    if (cryptoCurrencies.length === 0) {
      const balances = walletData.balances;
      const oldCurrencyMapping = {
        bitcoin: { name: "BTC", symbol: "₿" },
        ethereum: { name: "ETH", symbol: "Ξ" },
        usdt: { name: "USDT", symbol: "$" },
        tether: { name: "USDT", symbol: "$" },
        solana: { name: "SOL", symbol: "SOL" },
        binance: { name: "BNB", symbol: "BNB" },
        tron: { name: "TRX", symbol: "TRX" },
        base: { name: "BASE", symbol: "BASE" },
        usdc: { name: "USDC", symbol: "USDC" }
      };

      Object.entries(balances || {}).forEach(([key, data]) => {
        if (key === 'total' || key === 'portfolio' || key === 'currencies') return;

        const mapping = oldCurrencyMapping[key.toLowerCase()];
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
    }

    // Sort by USD value (highest first) then by priority
    const priorityOrder = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'TRX', 'BASE', 'USDC'];
    cryptoCurrencies.sort((a, b) => {
      const aValue = parseFloat(a.valueUSD);
      const bValue = parseFloat(b.valueUSD);

      // First sort by value if significant difference
      if (Math.abs(aValue - bValue) > 0.01) {
        return bValue - aValue;
      }

      // Then by priority
      const aIndex = priorityOrder.indexOf(a.name);
      const bIndex = priorityOrder.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return cryptoCurrencies.length > 0 ? cryptoCurrencies : [
      { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "btc" },
      { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "usdt" },
      { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "eth" },
      { name: "BASE", rate: "0.00", change: "+0.00%", symbol: "BASE", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "base" },
      { name: "USDC", rate: "0.00", change: "+0.00%", symbol: "USDC", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "usdc" }
    ];
  };

  // Enhanced crypto images object
  const cryptoImages = {
    // Only define mapping for available icons
    bitcoin: btc,
    ethereum: eth,
    usdt: usdt,
    tether: usdt,

    // Display name mappings
    Bitcoin: btc,
    Ethereum: eth,
    Tether: usdt,
    USDT: usdt,

    // Symbol mappings
    BTC: btc,
    ETH: eth
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

    // Fallback to first available currency from API
    const fallback = dynamicCurrencies[0];

    // Update selected currency to match available API data
    if (fallback && !found) {
      setSelectedCurrency(fallback.name);
    }

    return fallback;
  };

  const renderLeftAside = () => {
    switch (activeMenuSection) {
      case 'wallet':
        return (
          <div className="bg-[#181818] rounded-lg relative p-5 h-full w-[22rem] shrink-0 overflow-hidden" key={walletData.lastUpdated}>
            {/* Wallet Balance Section */}
            <div className="mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

              <div className="flex items-center justify-between mb-[1.5rem] relative z-20">
                <h3 className="font-semibold text-base">
                  Wallet Balance
                </h3>

                {/* 🔥 NEW: Manual Refresh Button */}
                <button
                  onClick={refreshWalletBalance}
                  disabled={walletData.isLoading}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 z-10 cursor-pointer"
                  title="Refresh balance"
                >
                  <RefreshCw
                    size={16}
                    className={`${walletData.isLoading ? 'animate-spin' : ''} text-gray-400 hover:text-white`}
                  />
                </button>
              </div>

              {/* Currency Selection */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1 items-center">
                  <span className="text-sm text-gray-400">Currency:</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className="flex items-center gap-2 text-sm"
                    >
                      {getCurrentCurrency()?.name || "Select Currency"}
                      <ChevronDown size={16} />
                    </button>
                    {showCurrencyDropdown && (
                      <div className="absolute z-10 bg-[#181818] border border-white/10 rounded-lg mt-2 w-56">
                        {getDynamicCryptoCurrencies().map((currency) => (
                          <div
                            key={currency.name}
                            onClick={() => {
                              setSelectedCurrency(currency.name);
                              setShowCurrencyDropdown(false);
                            }}
                            className={`px-4 py-2 hover:bg-white/10 cursor-pointer flex justify-between items-center ${selectedCurrency === currency.name ? 'bg-primary/20' : ''
                              }`}
                          >
                            <span className="font-medium">{currency.name}</span>
                            <span className="text-gray-400 text-sm">{currency.balance}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Currency Rate Display */}
                {getCurrentCurrency() && (
                  <div className="">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 items-center ml-auto text-right">
                        <div className="font-medium">${getCurrentCurrency()?.rate}</div>
                        <div className={`text-sm ${getCurrentCurrency()?.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {getCurrentCurrency()?.change}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Token Balance Display */}
              <div className="flex flex-col gap-1 items-center justify-center mb-4">
                {/* USD Value - Primary Display */}
                <div className="flex gap-3 items-center text-2xl font-bold">
                  {showBalance ? (
                    <span>${getDynamicCryptoCurrencies().find(c => c.name === selectedCurrency)?.valueUSD || '0.00'}</span>
                  ) : "****"}

                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Token Balance - Secondary Display */}
                {showBalance && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <span>{getDynamicCryptoCurrencies().find(c => c.name === selectedCurrency)?.balance || '0.0000'}</span>
                    <span>{selectedCurrency}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => {
                  setWalletModalType('fund');
                  setShowFundModal(true);
                }}
                className="flex items-center text-[11px] justify-center gap-2 w-full py-[.7rem] whitespace-nowrap px-4 bg-primary rounded-full text-white font-medium hover:bg-opacity-70 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Fund Wallet
              </button>
              <button
                onClick={() => {
                  setWalletModalType('withdraw');
                  setShowFundModal(true);
                }}
                className="flex items-center text-[11px] justify-center gap-2 w-full py-[.7rem] px-2 bg-purple-100 rounded-full text-purple-600 font-medium hover:bg-purple-200 transition-colors"
              >
                <img src={withdraw} className="h-4 w-4" alt="" />
                Withdraw
              </button>
            </div>

            {/* Crypto Currencies List */}
            <div className="">
              {getDynamicCryptoCurrencies().map((crypto) => (
                <div key={crypto.name} className="flex items-center border-t border-gray-700 py-3 gap-3">
                  <img
                    src={getCryptoImage(crypto.currencyKey, crypto.name)}
                    alt={`${crypto.name} logo`}
                    className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.src = btc; }}
                  />
                  <div>
                    <div className="font-medium">{crypto.name}</div>
                    <div className="text-sm text-gray-400">Balance: {crypto.balance}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-medium">${crypto.rate}</div>
                    <div className={`text-sm ${crypto.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {crypto.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div >
        );
      case 'profile':
        return (
          <ProfileSettings
            userData={userData}
            section="aside"
            isAuthenticated={isAuthenticated}
            getUserInitial={getUserInitial}
            getVerificationProgress={getVerificationProgress}
            getVerificationFraction={getVerificationFraction}
            getUserTier={getUserTier}
            onNavigateHome={() => {
              setActiveTab('home');
              setActiveMenuSection('wallet');
            }}
          />
        );
      case 'chat':
        return (
          <Chat
            section="aside"
            selectedUser={selectedChatUser}
            onSelectUser={setSelectedChatUser}
            walletData={walletData}
          />
        );
      case 'manage':
      case 'support':
      default:
        return (
          <div className="bg-[#181818] rounded-lg p-5 h-full">
            {/* Wallet Balance Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Wallet Balance</h3>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-gray-400 hover:text-white"
                >
                  {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-2xl font-bold">
                {showBalance ? `$${getWalletBalance()}` : "****"}
              </div>
            </div>

            {/* Currency Selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Currency:</span>
                <div className="relative">
                  <button
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className="flex items-center gap-2 text-sm"
                  >
                    {getCurrentCurrency()?.name || "Select Currency"}
                    <ChevronDown size={16} />
                  </button>
                  {showCurrencyDropdown && (
                    <div className="absolute z-10 bg-[#181818] border border-white/10 rounded-lg mt-2 w-48">
                      {getDynamicCurrencies().map((currency) => (
                        <div
                          key={currency.name}
                          onClick={() => {
                            setSelectedCurrency(currency.name);
                            setShowCurrencyDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-white/10 cursor-pointer"
                        >
                          {currency.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Currency Display */}
            {getCurrentCurrency() && (
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src={getCryptoImage(getCurrentCurrency()?.currencyKey, getCurrentCurrency()?.name)}
                    alt={`${getCurrentCurrency()?.name} logo`}
                    className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.src = btc; }}
                  />
                  <div>
                    <div className="font-medium">{getCurrentCurrency()?.name}</div>
                    <div className="text-sm text-gray-400">Balance: 0.0</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-medium">${getCurrentCurrency()?.rate}</div>
                    <div className={`text-sm ${getCurrentCurrency()?.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {getCurrentCurrency()?.change}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => {
                  setWalletModalType('fund');
                  setShowFundModal(true);
                }}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-full hover:bg-opacity-80 transition-colors"
              >
                Fund Wallet
              </button>
              <button
                onClick={() => {
                  setWalletModalType('withdraw');
                  setShowFundModal(true);
                }}
                className="flex-1 py-2 px-4 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
              >
                Withdraw
              </button>
            </div>

            {/* Crypto Currencies List */}
            <div className="space-y-4">
              {getDynamicCryptoCurrencies().map((crypto) => (
                <div key={crypto.name} className="flex items-center gap-3">
                  <img
                    src={getCryptoImage(crypto.currencyKey, crypto.name)}
                    alt={`${crypto.name} logo`}
                    className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.src = btc; }}
                  />
                  <div>
                    <div className="font-medium">{crypto.name}</div>
                    <div className="text-sm text-gray-400">Balance: {crypto.balance}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-medium">${crypto.rate}</div>
                    <div className={`text-sm ${crypto.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {crypto.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  // Update your renderMainContent function:
  const renderMainContent = () => {
    switch (activeTab) {

      case 'wallet':
        return (
          <Tables
            onSelectChatUser={(user) => {
              setSelectedChatUser(user);
              setActiveMenuSection('chat');
              setActiveTab('chat');
            }}
            setActiveMenuSection={(section) => {
              setActiveMenuSection(section);
              if (section === 'chat') {
                setActiveTab('chat');
              }
            }}
            onViewAccountMetrics={handleViewAccountMetrics}
            handleTableScroll={handleTableScroll}
            scrollTableLeft={scrollTableLeft}
            scrollTableRight={scrollTableRight}
            showLeftScroll={showLeftScroll}
            showRightScroll={showRightScroll}
            tableHeight={tableHeight}
            tableBodyRef={tableBodyRef}
            bodyRef={bodyRef}
            tableContainerRef={tableContainerRef}
            renderStars={renderStars}
            slideImages={slideImages}
            tableData={tableData}
            slickSettings={slickSettings}
          />
        );

      case 'profile':
        return (
          <ProfileSettings
            userData={userData}
            section="main"
            isAuthenticated={isAuthenticated}
            getUserInitial={getUserInitial}
            getVerificationProgress={getVerificationProgress}
            getVerificationFraction={getVerificationFraction}
            getUserTier={getUserTier}
            onNavigateHome={() => {
              setActiveTab('home');
              setActiveMenuSection('wallet');
            }}
          />
        );
      case 'trade':
        return (
          <BuySellTable
            section="main"
            isOpen={true}
            onClose={() => setActiveTab('home')}
            isAuthenticated={isAuthenticated}
            setShowAuthModal={setShowAuthModal}
            setAuthModalType={setAuthModalType}
            setActiveMenuSection={setActiveMenuSection}
            setActiveTab={setActiveTab}
            onSelectChatUser={(user) => {
              setSelectedChatUser(user);
              setActiveMenuSection('chat');
              setActiveTab('chat');
            }}
            onViewAccountMetrics={handleViewAccountMetrics}
          />
        );
      case 'history':
        return (
          <HistoryTable
            section="main"
            isAuthenticated={isAuthenticated}
            setShowAuthModal={setShowAuthModal}
            setAuthModalType={setAuthModalType}
            setActiveMenuSection={setActiveMenuSection}
            setActiveTab={setActiveTab}
            onClose={() => setActiveTab('home')}
          />
        );
      case 'chat':
        return (
          <Chat
            section="main"
            selectedUser={selectedChatUser}
            onSelectUser={setSelectedChatUser}
            onBackToList={() => setSelectedChatUser(null)}
            showChat={true}
            walletData={walletData}
          />
        );
      default:
        return (
          <Tables
            onViewAccountMetrics={handleViewAccountMetrics}
            handleTableScroll={handleTableScroll}
            scrollTableLeft={scrollTableLeft}
            scrollTableRight={scrollTableRight}
            showLeftScroll={showLeftScroll}
            showRightScroll={showRightScroll}
            tableHeight={tableHeight}
            tableBodyRef={tableBodyRef}
            bodyRef={bodyRef}
            tableContainerRef={tableContainerRef}
            renderStars={renderStars}
            slideImages={slideImages}
            tableData={tableData}
            slickSettings={slickSettings}
          />
        );
    }
  };

  // Placeholder images for slides
  const slideImages = [frame0, frame00, frame000];

  const tableData = [
    {
      id: 1,
      seller: {
        image: ug1,
        name: "UB.greatilx",
        verified: true,
      },
      item: {
        image: ig,
        name: "Instagram",
      },
      followers: "1.3k",
      rating: 4.5,
    },
    {
      id: 2,
      seller: {
        image: ug2,
        name: "ug.jimmy",
        verified: true,
      },
      item: {
        image: tik,
        name: "TikTok",
      },
      followers: "8.3k",
      rating: 5.0,
    },
    {
      id: 3,
      seller: {
        image: ug3,
        name: "ug.wilson",
        verified: false,
      },
      item: {
        image: linkedin,
        name: "Linkedin",
      },
      followers: "4.2k",
      rating: 3.8,
    },
    {
      id: 4,
      seller: {
        image: ug4,
        name: "ug.jones",
        verified: true,
      },
      item: {
        image: ig2,
        name: "facebook",
      },
      followers: "2.1k",
      rating: 4.7,
    },
    {
      id: 5,
      seller: {
        image: ug1,
        name: "UB.greatilx",
        verified: true,
      },
      item: {
        image: ig,
        name: "Instagram",
      },
      followers: "1.3k",
      rating: 4.5,
    },
    {
      id: 6,
      seller: {
        image: ug2,
        name: "ug.jimmy",
        verified: true,
      },
      item: {
        image: tik,
        name: "TikTok",
      },
      followers: "8.3k",
      rating: 5.0,
    },
    {
      id: 7,
      seller: {
        image: ug3,
        name: "ug.wilson",
        verified: false,
      },
      item: {
        image: linkedin,
        name: "Linkedin",
      },
      followers: "4.2k",
      rating: 3.8,
    },
    {
      id: 8,
      seller: {
        image: ug4,
        name: "ug.jones",
        verified: true,
      },
      item: {
        image: ig2,
        name: "facebook",
      },
      followers: "2.1k",
      rating: 4.7,
    },
  ];

  // Hide scroll hint after user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (showScrollHint) {
        setShowScrollHint(false);
      }
    };

    const scrollContainer = bodyRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [showScrollHint]);



  useEffect(() => {
    const handleWheel = (e) => {
      const container = bodyRef.current;
      if (container && e.shiftKey) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    const container = bodyRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);

  const handleTableScroll = (e) => {
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    setShowLeftScroll(scrollLeft > 10);
    setShowRightScroll(scrollLeft < maxScrollLeft - 10);
  };

  const scrollTableLeft = () => {
    if (tableBodyRef.current) {
      tableBodyRef.current.scrollLeft -= 200;
    }
  };

  const scrollTableRight = () => {
    if (tableBodyRef.current) {
      tableBodyRef.current.scrollLeft += 200;
    }
  };

  // Fetch wallet data when user authentication status changes - UPDATED
  useEffect(() => {
    if (isAuthenticated && !isLoadingUser) {
      // 🔥 OPTIONAL: Try to fetch once, but don't block on failure
      // Socket.IO will provide real-time updates regardless
      fetchWalletData().catch(() => {
        // Silent - Socket.IO will handle wallet updates
      });

      // Note: Socket.IO will handle real-time updates
      // No need for periodic polling anymore
    } else if (!isAuthenticated) {
      // Clear wallet data when user logs out
      setWalletData({
        balances: {},
        addresses: {},
        isLoading: false,
        error: null
      });
    }
  }, [isAuthenticated, isLoadingUser]);


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


  useEffect(() => {
    const fetchUserDetails = async () => {
      // User details are handled by the UserContext
    };

    fetchUserDetails();
  }, []);

  // Add this function with your other helper functions
  const getUserTier = () => {
    if (!userData) return 1;

    // Check different possible property names
    const tier =
      userData.currentTier ||
      userData.tier ||
      userData.verificationTier ||
      userData.verification_tier;

    if (typeof tier === "number") return tier;

    const tierMap = {
      unverified: 1,
      basic: 1,
      verified: 2,
      premium: 3,
    };

    return tierMap[tier] || 1;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowSlideMenu(false);
      // Clear wallet data on logout
      setWalletData({
        balances: {},
        addresses: {},
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Calculate verification progress based on currentTier
  const getVerificationProgress = () => {
    const currentTier = getUserTier();
    return (currentTier / 3) * 100;
  };

  // Get verification progress as fraction
  const getVerificationFraction = () => {
    const currentTier = getUserTier();
    return `${currentTier}/3`;
  };

  // Get user's first initial for avatar
  const getUserInitial = () => {
    if (!userData) return "G";

    // Check different possible property names for user's name
    const name = userData.displayName || userData.name || userData.username || userData.email;

    if (!name) return "G";

    return name.charAt(0).toUpperCase();
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={7}
          className={
            i <= rating ? "fill-orange-600 text-orange-600" : "text-gray-600"
          }
        />
      );
    }
    return stars;
  };

  // Calculate dynamic table height based on available space
  useEffect(() => {
    const calculateTableHeight = () => {
      if (tableContainerRef.current && mainContentRef.current) {
        const mainContentRect = mainContentRef.current.getBoundingClientRect();
        const tableContainerRect =
          tableContainerRef.current.getBoundingClientRect();

        // Get the viewport height
        const viewportHeight = window.innerHeight;

        // Calculate available space from table container to bottom of viewport
        const availableSpace = viewportHeight - tableContainerRect.top - 100;

        // Get height of other content above the table
        const exploreSection = document.querySelector(
          '[data-section="explore"]'
        );
        const tableTitleSection = document.querySelector(
          '[data-section="table-title"]'
        );

        let otherContentHeight = 0;
        if (exploreSection) otherContentHeight += exploreSection.offsetHeight;
        if (tableTitleSection)
          otherContentHeight += tableTitleSection.offsetHeight;
        if (tableTitleSection)
          otherContentHeight += tableTitleSection.offsetHeight;

        // Calculate table body height (subtract header height ~60px and some padding)
        const maxTableHeight = Math.max(
          200,
          availableSpace - otherContentHeight - 120
        );

        setTableHeight(Math.min(maxTableHeight, 500)); // Cap at 500px max
      }
    };

    // Initial calculation
    calculateTableHeight();

    // Recalculate on window resize
    window.addEventListener("resize", calculateTableHeight);

    // Cleanup
    return () => window.removeEventListener("resize", calculateTableHeight);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSlideMenu &&
        !event.target.closest(".slide-menu") &&
        !event.target.closest(".dot-menu")
      ) {
        setShowSlideMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Slick carousel settings for desktop
  const slickSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    gap: 5,
    swipeToSlide: true,
  };

  return (
    <>
      <div className="bg-black text-white min-h-screen relative">

        {/* Overlay for slide menu */}
        {showSlideMenu && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300" />
        )}

        {/* Navbar Component */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showSlideMenu={showSlideMenu}
          setActiveMenuSection={setActiveMenuSection}
          setShowSlideMenu={setShowSlideMenu}
          isAuthenticated={isAuthenticated}
          userData={userData}
          getUserInitial={getUserInitial}
          onShowSignIn={() => setShowSignInModal(true)}
          onShowSignUp={() => setShowSignUpModal(true)}
          chatUnreadCount={chatUnreadCount}
          walletData={walletData}
        />

        {/* Menu Component */}
        <Menu
          showSlideMenu={showSlideMenu}
          setShowSlideMenu={setShowSlideMenu}
          isAuthenticated={isAuthenticated}
          userData={userData}
          getUserInitial={getUserInitial}
          handleLogout={handleLogout}
          getVerificationProgress={getVerificationProgress}
          getVerificationFraction={getVerificationFraction}
          activeMenuSection={activeMenuSection}
          setActiveMenuSection={setActiveMenuSection}
          setActiveTab={setActiveTab}
          onShowSignIn={() => setShowSignInModal(true)}
          onShowSignUp={() => setShowSignUpModal(true)}
        />



        {/* Main Desktop Layout */}
        <div className="flex max-w-7xl mx-auto p-6 gap-6 min-h-[calc(100vh-88px)]">
          {/* Left Aside - Dynamic Content */}
          <aside className="w-100 flex-shrink-0">
            {renderLeftAside()}
          </aside>

          {/* Main Content Area - Dynamic Content */}
          <main className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar" ref={mainContentRef}>
            {showVerificationCard && activeTab === 'trade' && (
              <BuySellTable
                section="verification-card"
                onClose={() => setShowVerificationCard(false)}
                onBack={() => setActiveMenuSection('profile')}
                isAuthenticated={isAuthenticated}
                setShowAuthModal={setShowAuthModal}
                setAuthModalType={setAuthModalType}
                setActiveMenuSection={setActiveMenuSection}
                setActiveTab={setActiveTab}
              />
            )}

            {showVerificationCard && activeTab === 'history' && (
              <HistoryTable
                section="verification-card"
                onClose={() => setShowVerificationCard(false)}
                onBack={() => setActiveMenuSection('profile')}
                isAuthenticated={isAuthenticated}
                setShowAuthModal={setShowAuthModal}
                setAuthModalType={setAuthModalType}
                setActiveMenuSection={setActiveMenuSection}
                setActiveTab={setActiveTab}
              />
            )}

            {showVerificationCard && activeTab !== 'trade' && activeTab !== 'history' && activeTab !== 'chat' && (
              /* Complete Verification Card */
              <div className="bg-[rgba(24,24,24,1)] p-5 rounded-lg text-[#fff] relative">
                {/* Cancel Button */}
                <button
                  onClick={() => setShowVerificationCard(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="text-white w-5 h-5" />
                </button>

                <div className="flex gap-4 items-center">
                  <div>
                    <img src={shield} alt="" />
                  </div>

                  <div className="max-w-full">
                    <div className="flex items-ends gap-5 justify-end">
                      <div>
                        <h3 className="font-semibold text-[24px] pb-1 pr-8">
                          Complete Verification
                        </h3>
                        <p className="font-normal text-base">
                          You are currently in Tier 1, complete Tier 2
                          verification to start trading.
                        </p>
                      </div>

                      <div className="mt-7">
                        <button
                          className="text-sm bg-primary text-white py-3 px-6 rounded-full hover:bg-opacity-80 transition-colors"
                          onClick={() => {
                            // Check if user is authenticated before allowing access to verification
                            if (!isAuthenticated) {
                              // Show the same authentication modal as navbar
                              setShowAuthModal(true);
                              setAuthModalType('profile');
                              return;
                            }

                            // If authenticated, proceed to profile section
                            setActiveMenuSection('profile');
                            setActiveTab('profile');
                          }}
                        >
                          Verify Now
                        </button>
                      </div>
                    </div>

                    {/* Verification Progress Bar */}
                    <div className="">
                      <div className="flex justify-between items-center mb-2"></div>
                      <div className="relative flex w-[20%] bg-white rounded-full h-[5px]">
                        <div
                          className="relative bg-primary h-[5px] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${getVerificationProgress()}%` }}
                        ></div>
                        <span className="text-sm absolute top-[-10px] right-[-29px] font-medium text-white">
                          {getVerificationFraction()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Main Content */}
            {renderMainContent()}

          </main>
        </div>

        {showSignInModal && (
          <SignIn
            apiUrl={import.meta.env.VITE_API_URL || ""}
            onClose={() => setShowSignInModal(false)}
            onShowSignUp={() => {
              setShowSignInModal(false);
              setShowSignUpModal(true);
            }}
          />
        )}

        {showSignUpModal && (
          <SignUp
            apiUrl={import.meta.env.VITE_API_URL || ""}
            onClose={() => setShowSignUpModal(false)}
            onShowSignIn={() => {
              setShowSignUpModal(false);
              setShowSignInModal(true);
            }}
          />
        )}

        {showFundModal && (
          <WalletTransactionModal
            isOpen={showFundModal}
            onClose={() => setShowFundModal(false)}
            onBack={() => setShowFundModal(false)}
            walletData={walletData}
          />
        )}

        {showAuthModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
              onClick={() => setShowAuthModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#181818] rounded-lg p-8 max-w-md w-full mx-4 relative">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>

                  <h3 className="text-white font-semibold text-xl mb-2">Sign In Required</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Please sign in to access verification and upgrade your account tier for trading.
                  </p>

                  <div className="flex gap-3 justify-center">
                    <button
                      className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:opacity-70 transition-colors"
                      onClick={() => {
                        setShowAuthModal(false);
                        setShowSignInModal(true);
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      className="px-6 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                      onClick={() => {
                        setShowAuthModal(false);
                        setShowSignUpModal(true);
                      }}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <UploadAccountListed
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setViewAccountData(null);
          }}
          viewAccountData={viewAccountData}
          walletData={walletData}
        />

      </div>
    </>
  );
};

export default HomePage;