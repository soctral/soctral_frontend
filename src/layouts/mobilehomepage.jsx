import { useState, useEffect, useRef } from "react";
import marketplaceService from '../services/marketplaceService';
import badge from "../assets/verifiedstar.svg";
import ig2 from "../assets/socialicon.svg";
import { useNavigate } from "react-router-dom";
import dotmenu from "../assets/menu.svg"
import gift from "../assets/gift.svg"
import notification from "../assets/notifications.svg"
import buy from "../assets/buy.svg"
import plus from "../assets/plus.svg"
import withdraw from "../assets/withdrawal.svg"
import frame1 from "../assets/frame1.svg"
import frame2 from "../assets/frame2.svg"
import frame3 from "../assets/frame3.svg"
import frame0 from "../assets/slide11.svg"
import frame00 from "../assets/slide1.svg"
import frame000 from "../assets/slide0.svg"
import shield from "../assets/Shield.svg"
import { Gift, Bell, Home, Wallet, MessageCircle, History, Plus, Eye, EyeOff, TrendingUp, Star, Users, Instagram, Twitter, Facebook, ChevronRight, ChevronDown, X, RefreshCw } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "react-router-dom";
import Menu from "../components/Menu";
import ReferralsModal from "../components/Desktop/ReferralModal";
import Notification from "../components/Desktop/notification";
import ProfileSettings from '../components/Mobile/ProfileSettings';
import WalletSetupModal from "../components/Desktop/WalletModal";
import BuySellModal from "../components/Desktop/buysellModal";
import BuySellTable from "../components/Desktop/buysellTable";
import Chat from '../components/Desktop/chat';
import HistoryTable from '../components/Desktop/HistoryTable';
import { useUser } from '../context/userContext';
import WalletTransactionModal from '../components/Desktop/WalletTransaction';
import authService from '../services/authService';
import face from "../assets/face.svg";
import twitter from "../assets/twitter.svg";
import ig from "../assets/ig2.svg";
import UploadAccountListed from '../components/Desktop/UploadAccountListed';
import walletService from '../services/walletService';
import { io } from 'socket.io-client';

import tiktok from "../assets/tiktok.svg";
import linkedin2 from "../assets/linkedin2.svg";
import snap from "../assets/snapchat.svg";
import youtube from "../assets/youtube.svg";
import telegram from "../assets/telegram.svg";
import discord from "../assets/discord.svg";
import pinterest from "../assets/pinterest.svg";
import reddit from "../assets/reddit.svg";
import wechat from "../assets/wechat.svg";
import onlyfans from "../assets/onlyfans.svg";
import flickr from "../assets/flickr.svg";
import vimeo from "../assets/vimeo.svg";
import qzone from "../assets/qzone.svg";
import qoura from "../assets/qoura.svg";
import twitch from "../assets/twitch.svg";
import tumblr from "../assets/tumblr.svg";
import mewe from "../assets/mewe.svg";
import btc from "../assets/btc.svg";
import usdt from "../assets/usdt.svg";
import eth from "../assets/eth.svg";
import usdc from "../assets/usdc.svg";

import base from "../assets/base-logo.jpg";
import tron from "../assets/trx.svg";
import bnb from "../assets/bnb.svg";
import solana from "../assets/sol.svg";


const MobileHomePage = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewAccountData, setViewAccountData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showVerificationCard, setShowVerificationCard] = useState(true);
  const [showSlideMenu, setShowSlideMenu] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState('');
  const [activeMenuSection, setActiveMenuSection] = useState('wallet');
  const [showBuySellModal, setShowBuySellModal] = useState(false);
  const [showBuySellOnboarding, setShowBuySellOnboarding] = useState(false);
  const [hasSeenBuySellOnboarding, setHasSeenBuySellOnboarding] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [showWalletTransactionModal, setShowWalletTransactionModal] = useState(false);
  const [pickOfWeekData, setPickOfWeekData] = useState([]);

  const [isLoadingPickOfWeek, setIsLoadingPickOfWeek] = useState(true);
  const [walletTransactionType, setWalletTransactionType] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Wallet data states - SIMPLIFIED (matching Homepage.jsx)
  const [walletData, setWalletData] = useState({
    balances: {},
    addresses: {},
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Socket ref for real-time updates
  const socketRef = useRef(null);

  const {
    user,
    isAuthenticated,
    isLoading,
    getUserByToken,
    getUserDisplayName,
    getUserTier,
    logout
  } = useUser();



  useEffect(() => {
    const fetchUserDetails = async () => {
      if (isAuthenticated && !user) {
        try {
          await getUserByToken();
        } catch (error) {
          console.error('Failed to fetch user details:', error);
        }
      }
    };

    fetchUserDetails();
  }, [isAuthenticated, user, getUserByToken]);

  // 🔥 NEW: Fetch wallet data function (matching Homepage.jsx)
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
          error: null,
          lastUpdated: Date.now()
        });
        console.log('✅ Mobile: Initial wallet data loaded');
      }
    } catch (error) {
      console.warn('⚠️ Mobile: Initial wallet fetch failed:', error.message);
      setWalletData(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
    }
  };

  // 🔥 NEW: Fetch wallet data when user authentication status changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Fetch wallet data immediately on auth
      fetchWalletData().catch(() => {
        // Silent - Socket.IO will handle wallet updates
      });
    } else if (!isAuthenticated) {
      // Clear wallet data when user logs out
      setWalletData({
        balances: {},
        addresses: {},
        isLoading: false,
        error: null
      });
    }
  }, [isAuthenticated, isLoading]);

  const getSellerImage = (seller) => {
    const imageUrl = seller?.bitmojiUrl || seller?.avatar || seller?.avatarUrl || seller?.profileImage || seller?.image;
    return imageUrl;
  };


  const platformIcons = {
    facebook: face,
    twitter: twitter,
    instagram: ig,
    tiktok: tiktok,
    linkedin: linkedin2,
    snapchat: snap,
    youtube: youtube,
    telegram: telegram,
    discord: discord,
    pinterest: pinterest,
    reddit: reddit,
    wechat: wechat,
    onlyfans: onlyfans,
    flickr: flickr,
    vimeo: vimeo,
    qzone: qzone,
    qoura: qoura,
    twitch: twitch,
    tumblr: tumblr,
    mewe: mewe
  };



  const currencyIcons = {
    BTC: btc,
    USDT: usdt,
    ETH: eth,
    BASE: base,
    TRON: tron,
    TRX: tron,
    BNB: bnb,
    SOL: solana,
    SOLANA: solana,
    USDC: usdc,
    USDCOIN: usdc
  };


  const getCurrencyIcon = (currency) => {
    return currencyIcons[currency?.toUpperCase()] || usdt;
  };



  // 🔥 UPDATED: Helper function to get follower count from metrics OR filters (matching Desktop/table.jsx)
  // Supports all platform-specific keys (followers, subscribers, members, connections)
  const getFollowerCount = (metrics, filters) => {
    // Helper to format counts
    const formatCount = (count) => {
      if (isNaN(count) || count === null || count === undefined) return '0';
      if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
      }
      return count.toString();
    };

    // 🔥 ENHANCED: Support all platform-specific follower keys
    const followerKeys = [
      'followers', 'followers_count', 'follower_count',
      'subscribers', 'subscribers_count', 'subscriber_count',
      'member_count', 'members', 'connections',
      'fans', 'fans_count', 'likes', 'likes_count'
    ];

    // First check metrics array
    if (metrics && Array.isArray(metrics)) {
      const followerMetric = metrics.find(m => followerKeys.includes(m.key));
      if (followerMetric && followerMetric.value !== undefined && followerMetric.value !== null) {
        return formatCount(parseInt(followerMetric.value));
      }
    }

    // Fallback: Check filters array (where upload forms store follower count)
    if (filters && Array.isArray(filters)) {
      const followerFilter = filters.find(f => followerKeys.includes(f.key));
      if (followerFilter && followerFilter.value !== undefined && followerFilter.value !== null) {
        return formatCount(parseInt(followerFilter.value));
      }
    }

    return '0';
  };


  const calculateRating = (seller) => {
    // Check if seller has user ratings
    if (seller?.averageRating !== undefined && seller?.totalRatings > 0) {
      // Return actual user rating (0-5 scale)
      return Math.min(5, Math.max(0, seller.averageRating));
    }

    // Default to 5 stars for new accounts with no ratings
    return 5;
  };



  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={7}
          className={
            i <= roundedRating ? "fill-orange-600 text-orange-600" : "text-gray-600"
          }
        />
      );
    }
    return stars;
  };



  // 🔥 Socket.IO Connection for real-time wallet updates (matching Homepage.jsx)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://soctralapi-production.up.railway.app'}`;

    if (!socketRef.current) {
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        auth: {
          token: localStorage.getItem('token')
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
    }

    const userData = user;

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected (Mobile):', socketRef.current.id);

      // Request immediate wallet data on connect
      socketRef.current.emit('request-wallet-update', {
        userId: userData?._id || userData?.id
      });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    // PRIMARY: Listen for wallet-balance-update event
    socketRef.current.on('wallet-balance-update', async (data) => {
      if (data && data.walletBalances) {
        setWalletData({
          balances: { ...data.walletBalances },
          addresses: data.walletAddresses ? { ...data.walletAddresses } : { ...walletData.addresses },
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
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

    // BACKUP: Listen for alternative update events
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

    socketRef.current.on('error', (error) => {
      console.error('❌ Socket error:', error.message);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected:', reason);

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
  }, [isAuthenticated, user]);

  // 🔥 REMOVED: 30s wallet polling - now uses socket.io for real-time updates only
  // This eliminates re-render triggers that caused form focus loss and step resets
  // Wallet data comes from: 1) Initial fetch on auth  2) Socket.io real-time updates  3) Manual refresh button

  useEffect(() => {
    const fetchPickOfWeek = async () => {
      try {
        const response = await marketplaceService.getAllSellOrders();

        if (response.status && response.data) {
          const transformedData = response.data.map((order) => {
            const seller = order.seller || {};
            const sellerId = seller._id;
            const sellerImageUrl = seller.bitmojiUrl || seller.avatar || seller.avatarUrl || seller.profileImage || seller.image || null;

            return {
              id: order._id,
              seller: {
                id: sellerId,
                name: seller.displayName || seller.email?.split('@')[0] || 'Anonymous',
                verified: seller.emailVerified || false,
                bitmojiUrl: sellerImageUrl,
                avatar: sellerImageUrl,
                avatarUrl: sellerImageUrl,
                profileImage: sellerImageUrl,
                image: sellerImageUrl,
              },
              item: {
                image: platformIcons[order.platform.toLowerCase()] || ig2,
                name: order.platform.charAt(0).toUpperCase() + order.platform.slice(1),
              },
              followers: getFollowerCount(order.metrics, order.filters),
              rating: calculateRating(order.metrics),
              price: order.price,
              currency: order.currency,
              description: order.description,
              accountType: order.accountType,
              isFeatured: order.isFeatured
            };
          });

          setPickOfWeekData(transformedData);
        } else {
          setPickOfWeekData([]);
        }
      } catch (err) {
        console.error('Error fetching pick of week:', err);
        setPickOfWeekData([]);
      } finally {
        setIsLoadingPickOfWeek(false);
      }
    };

    fetchPickOfWeek();
    const intervalId = setInterval(fetchPickOfWeek, 30000);
    return () => clearInterval(intervalId);
  }, []);



  useEffect(() => {
    const handleInitiateTradeEvent = (event) => {
      const userData = event.detail;
      console.log('🎯 MobileHomePage: Received initiateTrade event:', userData);

      // Set the selected chat user
      setSelectedChatUser(userData);

      // Switch to chat section
      setActiveTab('chat');
      setActiveMenuSection('chat');
      setShowChat(true);

      console.log('✅ MobileHomePage: Navigated to chat with user:', userData.name);
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


  const handleViewAccountMetrics = (accountData) => {
    console.log('📱 MobileHomePage: Received view account request:', accountData);
    console.log('🔍 MobileHomePage: Account details:', {
      platform: accountData.platform,
      hasMetrics: !!accountData.metrics,
      hasFilters: !!accountData.filters,
      accountId: accountData.accountId
    });

    // Set the account data for viewing
    setViewAccountData(accountData);

    // Open the upload modal
    setShowUploadModal(true);

    console.log('✅ MobileHomePage: Modal opened with account data');
  };


  const handlePickOfWeekClick = (seller) => {
    const sellerImage = getSellerImage(seller);

    const sellerForChat = {
      id: seller.id,
      _id: seller.id,
      name: seller.name,
      displayName: seller.name,
      profileImage: sellerImage,
      avatar: sellerImage,
      bitmojiUrl: sellerImage,
      avatarUrl: sellerImage,
      image: sellerImage,
      status: 'online',
      chatType: 'buy',
    };

    localStorage.setItem('selectedChatUser', JSON.stringify(sellerForChat));

    setActiveTab('chat');
    setActiveMenuSection('chat');
    setShowChat(true);
    setSelectedChatUser(sellerForChat);

    if (onSelectChatUser) {
      onSelectChatUser(sellerForChat);
    }

    window.dispatchEvent(new CustomEvent('initiateTrade', {
      detail: sellerForChat
    }));
  };

  const getVerificationProgress = () => {
    const currentTier = getUserTier();
    return (currentTier / 3) * 100;
  };

  const getVerificationFraction = () => {
    const currentTier = getUserTier();
    return `${currentTier}/3`;
  };

  const getUserInitial = () => {
    if (user && user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowSlideMenu(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // 🔥 UPDATED: Get dynamic currencies from API data - UPDATED FOR NEW STRUCTURE
  const getDynamicCurrencies = () => {
    // Return default data if not authenticated or no wallet data
    if (!isAuthenticated || !walletData.balances || Object.keys(walletData.balances).length === 0) {
      return [
        { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", priceUSD: 0, changePercent: 0, currencyKey: "usdt" },
        { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", priceUSD: 0, changePercent: 0, currencyKey: "btc" },
        { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", priceUSD: 0, changePercent: 0, currencyKey: "eth" }
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
    const priorityOrder = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'TRX', 'USDC'];
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
      { name: "USDC", rate: "0.00", change: "+0.00%", symbol: "$", priceUSD: 0, changePercent: 0, currencyKey: "usdc" }
    ];
  };

  // 🔥 UPDATED: Get dynamic crypto currencies with balance info - UPDATED FOR NEW STRUCTURE
  const getDynamicCryptoCurrencies = () => {
    if (!isAuthenticated || !walletData.balances || Object.keys(walletData.balances).length === 0) {
      return [
        { name: "BTC", rate: "0.00", change: "+0.00%", symbol: "₿", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "btc" },
        { name: "USDT", rate: "0.00", change: "+0.00%", symbol: "$", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "usdt" },
        { name: "ETH", rate: "0.00", change: "+0.00%", symbol: "Ξ", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "eth" },
        { name: "USDC", rate: "0.00", change: "+0.00%", symbol: "$", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "usdc" }
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

    const priorityOrder = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'TRX', 'USDC'];
    cryptoCurrencies.sort((a, b) => {
      const aValue = parseFloat(a.valueUSD);
      const bValue = parseFloat(b.valueUSD);
      if (Math.abs(aValue - bValue) > 0.01) return bValue - aValue;
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
      { name: "USDC", rate: "0.00", change: "+0.00%", symbol: "$", balance: "0.0000", valueUSD: "0.00", priceUSD: 0, changePercent: 0, rawBalance: "0", currencyKey: "usdc" }
    ];
  };

  // 🔥 UPDATED: Get current currency with enhanced error handling
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
    return dynamicCurrencies[0];
  };

  // 🔥 UPDATED: getWalletBalance to use dynamic wallet data - UPDATED FOR NEW STRUCTURE
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

  // 🔥 NEW: Refresh wallet balance function (matching Homepage.jsx)
  const refreshWalletBalance = async () => {
    setWalletData(prev => ({ ...prev, isLoading: true }));

    try {
      // Try socket first
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('request-wallet-update', {
          userId: user?._id || user?.id
        });

        // Wait for response (with timeout)
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            setWalletData(prev => ({ ...prev, isLoading: false }));
            resolve();
          }, 5000);

          const handler = (data) => {
            clearTimeout(timeout);
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



  const handleWalletSetupComplete = () => {
    console.log('🎉 Wallet setup completed, transitioning to transaction modal');
    setShowWalletModal(false);

    // Small delay to ensure modal transition is smooth
    setTimeout(() => {
      setShowWalletTransactionModal(true);
    }, 100);
  };




  useEffect(() => {
    const handleNavigation = () => {
      // Close wallet transaction modal when navigating on mobile
      if (showWalletTransactionModal) {
        setShowWalletTransactionModal(false);
        setWalletTransactionType(null);
      }
    };

    // This effect runs whenever activeTab changes
    handleNavigation();
  }, [activeTab]);

  const handleTabClick = async (tabName) => {
    // Close wallet transaction modal when any tab is clicked
    if (showWalletTransactionModal) {
      setShowWalletTransactionModal(false);
      setWalletTransactionType(null);
    }

    if (tabName === 'home') {
      setActiveTab('home');
      setActiveMenuSection('wallet');
      return;
    }

    if (!isAuthenticated && ['wallet', 'trade', 'chat', 'history'].includes(tabName)) {
      setAuthModalType(tabName);
      setShowAuthModal(true);
      return;
    }

    if (tabName === 'trade') {
      setActiveTab("trade");
      setActiveMenuSection("wallet");

      if (!hasSeenBuySellOnboarding) {
        setShowBuySellOnboarding(true);
        setHasSeenBuySellOnboarding(true);
      } else {
        setShowBuySellModal(true);
      }
      return;
    }

    if (tabName === 'wallet') {
      try {
        const pinCheckResponse = await authService.checkTransactionPinExists();
        console.log('✅ Transaction PIN check completed:', pinCheckResponse);

        if (pinCheckResponse.status && pinCheckResponse.hasTransactionPin) {
          console.log('✅ PIN exists, opening transaction modal');
          setShowWalletTransactionModal(true);
        } else {
          console.log('🔌 No PIN found, opening setup modal');
          setShowWalletModal(true);
        }
      } catch (error) {
        console.error('❌ Error checking PIN status:', error);
        setShowWalletModal(true);
      }
      return;
    }

    if (tabName === 'chat') {
      setActiveTab("chat");
      setActiveMenuSection("chat");
      setShowChat(false);
      setSelectedChatUser(null);
      return;
    }

    if (tabName === 'history') {
      setActiveTab("history");
      setActiveMenuSection("wallet");
      return;
    }

    setActiveTab(tabName);
    setActiveMenuSection("wallet");
  };


  const handleReferralsClick = () => {
    if (!isAuthenticated) {
      setAuthModalType('referrals');
      setShowAuthModal(true);
      return;
    }
    setShowReferralsModal(true);
  };

  const handleNotificationClick = () => {
    if (!isAuthenticated) {
      setAuthModalType('notifications');
      setShowAuthModal(true);
      return;
    }
    setShowNotificationPanel(!showNotificationPanel);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSlideMenu(false);
    }
  };

  const handleChatUserSelect = (user) => {
    setSelectedChatUser(user);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedChatUser(null);
  };





  const renderMainContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="pb-10">
            <ProfileSettings
              userData={user}
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
          </div>
        );

      case 'wallet':
        return null;

      case 'chat':
        return (
          <div className="px-4 pt-6 pb-3 lg:pb-20">
            <Chat
              section="main"
              selectedUser={selectedChatUser}
              onSelectUser={handleChatUserSelect}
              onBackToList={handleBackToList}
              showChat={showChat}
              walletData={walletData}
            />
          </div>
        );

      case 'history':
        return (
          <div className="px-4 pt-6 pb-10 lg:pb-20">
            <HistoryTable
              section="main"
              isAuthenticated={isAuthenticated}
              setShowAuthModal={setShowAuthModal}
              setAuthModalType={setAuthModalType}
              setActiveMenuSection={setActiveMenuSection}
              setActiveTab={setActiveTab}
              onClose={() => setActiveTab('home')}
            />
          </div>
        );

      case 'trade':
        return (
          <div className="px-4 pt-6 pb-10">
            <BuySellTable
              section="main"
              isAuthenticated={isAuthenticated}
              setShowAuthModal={setShowAuthModal}
              setAuthModalType={setAuthModalType}
              setActiveMenuSection={setActiveMenuSection}
              setActiveTab={setActiveTab}
              onSelectChatUser={handleChatUserSelect}
              onViewAccountMetrics={handleViewAccountMetrics}
            />
          </div>
        );

      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
      {/* Auth Section or Verification Section */}
      <div className="relative mb-2 px-4">
        {!isAuthenticated ? (
          <div className="bg-white p-5 rounded-lg text-[#3B3B3B]">
            <h3 className="font-semibold text-[20px] pb-1">Create Your Account Now</h3>
            <p className="font-normal text-[16px] pb-2">Create Your Soctral Account Now and Unlock Secure Social Media Trading Opportunities.</p>

            <div className="flex items-center justify-between text-[14px] whitespace-nowrap font-medium">
              <button
                onClick={() => navigate('/sign-up')}
                className="py-[7px] px-[50px] bg-primary rounded-full text-white"
              >
                Sign Up
              </button>
              <button
                onClick={() => navigate('/sign-in')}
                className="py-[7px] px-[50px] bg-[#DCD0FF] rounded-full text-primary"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : showVerificationCard ? (
          <div className="bg-[rgba(255,255,255,1)] p-5 rounded-lg text-[#fff] relative">
            <button
              onClick={() => setShowVerificationCard(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 transition-colors"
            >
              <X className="text-black w-5 h-5" />
            </button>

            <div className="flex items-center text-black">
              <div className="max-w-[200px]">
                <h3 className="font-semibold text-[17px] pb-1 pr-8">Complete Verification</h3>
                <p className="font-extralight text-base">You are currently in Tier 1, complete Tier 2 verification to start trading.</p>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                  </div>
                  <div className="relative flex w-[60%] bg-gray-300 rounded-full h-[6px]">
                    <div
                      className="relative bg-primary h-[6px] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${getVerificationProgress()}%` }}
                    ></div>
                    <span className="text-sm absolute top-[-10px] right-[-29px] font-medium text-white">{getVerificationFraction()}</span>
                  </div>
                </div>
              </div>

              <div>
                <img src={shield} alt="Shield" />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {renderWalletContent()}

      <div className="px-4 mb-6">
        <h3 className="mb-1 font-[600] text-[16px]">Pick of the Week</h3>
        <div className="w-full">
          {isLoadingPickOfWeek ? (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                  <div className="h-4 w-24 bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-gray-700 rounded-full"></div>
              </div>
              <div className="h-24 bg-black/30 rounded-xl mb-3"></div>
              <div className="h-6 bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-700 rounded mb-3"></div>
              <div className="h-10 bg-gray-700 rounded-lg"></div>
            </div>
          ) : pickOfWeekData.length === 0 ? (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm">No accounts available yet</p>
            </div>
          ) : (
            <SimpleSlider>
              {pickOfWeekData.map((item) => (
                <div key={item.id} className="px-1">
                  <div
                    onClick={() => handlePickOfWeekClick(item.seller)}
                    className="bg-gradient-to-br from-[#1a1a1a] to-[#181818] rounded-lg p-4 cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                  >

                    <div className="flex items-center justify-between">



                      <div className="flex items-center gap-1 mb-2">
                        {/* Platform icon and name */}
                        <div className="flex items-center justify-center w-fit p-2 bg-black/30 rounded-full">
                          <img
                            src={item.item.image}
                            alt={item.item.name}
                            className="w-5 h-5 object-contain"
                          />
                        </div>
                        {/* Platform name */}
                        <h4 className="text-white font-semibold text-md text-center">
                          {item.item.name}
                        </h4>

                      </div>





                      {/* Header with seller info */}
                      <div className="flex items-center">
                        <div className="flex items-center gap-2">
                          {getSellerImage(item.seller) ? (
                            <img
                              src={getSellerImage(item.seller)}
                              alt={item.seller.name}
                              className="order-3 w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="order-2 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                              <span className="text-white text-xs">
                                {item.seller.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex order-1 items-center gap-1">
                            <span className="text-white font-medium text-sm">
                              {item.seller.name}
                            </span>
                            {item.seller.verified && (
                              <img src={badge} alt="verified" className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                      </div>
                    </div>



                    <div className="flex items-center justify-between">
                      {/* Metrics row */}
                      <div className="flex flex-col justify-between px-2">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">Followers:</span>
                          <span className="text-white font-medium text-sm">{item.followers}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">Seller Rating:</span>
                          {renderStars(item.rating)}
                        </div>
                      </div>


                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1 font-semibold text-sm ">
                          <span className="text-gray-400 text-xs">Payment Method:</span>
                          <img
                            src={getCurrencyIcon(item.currency)}
                            alt={item.currency}
                            className="w-5 h-5 object-contain"
                          />
                          {item.currency}
                        </span>
                        <span className="text-[#6B46C1] font-semibold text-sm bg-[#6B46C1]/10 rounded-full">
                          ${item.price}
                        </span>
                      </div>


                    </div>



                    {/* Action button */}
                    {/* <button className="w-full py-2.5 bg-[#6B46C1] hover:bg-[#5a3aa3] text-white font-medium rounded-lg text-sm transition-colors duration-200">
                Initiate Trade
              </button> */}
                  </div>
                </div>
              ))}
            </SimpleSlider>
          )}
        </div>
      </div>

      <div className="px-4 mb-6">
        <h3 className="mb-1 font-[600] text-[16px]">Explore Soctral</h3>
        <div className="w-full">
          <SimpleSlider autoplaySpeed={4000}>
            <div><img src={frame3} alt="Frame 3" className="w-full" /></div>
            <div><img src={frame2} alt="Frame 2" className="w-full" /></div>
            <div><img src={frame1} alt="Frame 1" className="w-full" /></div>
          </SimpleSlider>
        </div>
      </div>

      <div className="h-6"></div>
    </>
  );

  const renderWalletContent = () => (
    <div className="px-4 mb-6">
      <h3 className="mb-1 font-[600] text-[16px]">Wallet Balance</h3>
      <div className="bg-[#181818] rounded-2xl p-6 relative overflow-visible">
        {/* <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div> */}
        <div className="relative z-10">
          <div className="flex flex-col justify-between items-center mb-4">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline relative">
                  <p className="text-white/80 text-sm mb-2">Currency:</p>

                  <div className="flex items-baseline relative mb-4">
                    <button
                      onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                      className="flex items-center justify-between w-full rounded-lg text-white transition-colors"
                    >
                      <span className="font-medium">{selectedCurrency}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showCurrencyDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[#2a2a2a] w-[200%] rounded-lg border border-white/10 z-40">
                        {getDynamicCryptoCurrencies().map((currency) => (
                          <button
                            key={currency.name}
                            onClick={() => {
                              setSelectedCurrency(currency.name);
                              setShowCurrencyDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg flex justify-between items-center ${selectedCurrency === currency.name ? 'bg-primary/20' : ''
                              }`}
                          >
                            <span className="font-medium">{currency.name}</span>
                            <span className="text-gray-400 text-sm">{currency.balance}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">${getCurrentCurrency().rate}</span>
                    <span className={`text-sm ${getCurrentCurrency()?.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {getCurrentCurrency().change}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Token Balance Display */}
              <div className="flex flex-col items-center justify-center space-y-1 mb-6 mt-5">
                {/* USD Value - Primary Display */}
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-white">
                    {showBalance ? (
                      `$${getDynamicCryptoCurrencies().find(c => c.name === selectedCurrency)?.valueUSD || '0.00'}`
                    ) : '••••••'}
                  </div>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-white/80 text-lg hover:text-white transition-colors"
                  >
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Token Balance - Secondary Display */}
                {showBalance && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{getDynamicCryptoCurrencies().find(c => c.name === selectedCurrency)?.balance || '0.0000'}</span>
                    <span className="text-gray-400 text-xs">{selectedCurrency}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setWalletTransactionType('fund');
                  setShowWalletTransactionModal(true);
                }}
                className="flex items-center justify-center gap-1 flex-1 py-[7px] whitespace-nowrap px-[40px] bg-primary text-xs rounded-full text-white font-medium hover:bg-purple-700 transition-colors"
              >
                <img src={plus} alt="Plus" />
                Fund Wallet
              </button>
              <button
                onClick={() => {
                  setWalletTransactionType('withdraw');
                  setShowWalletTransactionModal(true);
                }}
                className="flex items-center justify-center gap-1 flex-1 py-[7px] px-[40px] bg-[#DCD0FF] text-xs rounded-full text-primary  font-medium hover:bg-purple-100 transition-colors"
              >
                <img src={withdraw} alt="Withdraw" />
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SimpleSlider = ({ children, autoplaySpeed = 3000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === children.length - 1 ? 0 : prevIndex + 1
        );
      }, autoplaySpeed);

      return () => clearInterval(interval);
    }, [children.length, autoplaySpeed]);

    return (
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {children.map((child, index) => (
            <div key={index} className="w-full flex-shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-black text-white min-h-screen relative">
        {/* Overlay for slide menu */}
        {showSlideMenu && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleOverlayClick}
          />
        )}

        {/* Overlay for notification panel */}
        {showNotificationPanel && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setShowNotificationPanel(false)}
          />
        )}

        {/* Menu Component */}
        <Menu
          showSlideMenu={showSlideMenu}
          setShowSlideMenu={setShowSlideMenu}
          isAuthenticated={isAuthenticated}
          userData={user}
          getUserInitial={getUserInitial}
          getVerificationProgress={getVerificationProgress}
          getVerificationFraction={getVerificationFraction}
          handleLogout={handleLogout}
          activeMenuSection={activeMenuSection}
          setActiveMenuSection={setActiveMenuSection}
          setActiveTab={setActiveTab}
          onShowSignIn={() => navigate('/sign-in')}
          onShowSignUp={() => navigate('/sign-up')}
        />

        {/* Status bar */}
        <div className="w-full h-1 bg-black"></div>

        {/* Fixed Header - Only shown on 'home' tab */}
        {activeTab === 'home' && (
          <div className="fixed top-0 left-0 right-0 bg-black z-30 px-4 pt-6 pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSlideMenu(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <img src={dotmenu} alt="Menu" className="h-[20px] w-[20px]" />
                </button>
                <h1 className="text-[20px] font-normal">
                  {isAuthenticated && user
                    ? `Hello, ${getUserDisplayName()}`
                    : 'Welcome to Soctral'
                  }
                </h1>
              </div>
              <div className="flex gap-4 items-center justify-center">
                <Gift
                  onClick={handleReferralsClick}
                  className="h-[20px] w-[20px] cursor-pointer hover:text-white transition-colors"
                />
                <Bell
                  onClick={handleNotificationClick}
                  className="h-[20px] w-[20px] cursor-pointer hover:text-white transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main content - scrollable with conditional padding */}
        <div className={`${activeTab === 'home' ? 'pt-[80px]' : 'pt-0'} pb-[4rem] overflow-y-auto`}>
          {renderMainContent()}
        </div>

        {/* Bottom Navigation - Hidden only when viewing chat conversation */}
        {!(activeTab === 'chat' && showChat && selectedChatUser) && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#181818] z-30">
            <div className="flex items-center justify-around py-2 px-4">
              <button
                onClick={() => handleTabClick('home')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${activeTab === 'home'
                  ? 'text-primary '
                  : 'text-gray-400'
                  }`}
              >
                <Home className={`w-5 h-5 mb-1 transition-colors duration-200 ${activeTab === 'home'
                  ? 'text-primary '
                  : 'text-gray-400 hover:text-purple-300'
                  }`} />
                <span className={`text-xs transition-colors duration-200 ${activeTab === 'home'
                  ? 'text-primary '
                  : 'text-gray-400 hover:text-primary '
                  }`}>Home</span>
              </button>

              <button
                onClick={() => handleTabClick('wallet')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${activeTab === 'wallet'
                  ? 'text-primary'
                  : 'text-gray-400'
                  }`}
              >
                <Wallet className={`w-5 h-5 mb-1 transition-colors duration-200 ${activeTab === 'wallet'
                  ? 'text-primary '
                  : 'text-gray-400 hover:text-purple-300'
                  }`} />
                <span className={`text-xs transition-colors duration-200 ${activeTab === 'wallet'
                  ? 'text-primary '
                  : 'text-gray-400 hover:text-primary '
                  }`}>Wallet</span>
              </button>

              <button
                onClick={() => handleTabClick('trade')}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 absolute bg-black top-[-28px] rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200 mb-1">
                  <img src={buy} className="p-2" alt="Buy/Sell" />
                </div>
                <span className="text-xs text-gray-400 pt-[1.5rem] transition-colors duration-200 hover:text-primary ">Buy/Sell</span>
              </button>

              <button
                onClick={() => handleTabClick('chat')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${activeTab === 'chat'
                  ? 'text-primary '
                  : 'text-gray-400'
                  }`}
              >
                <MessageCircle className={`w-5 h-5 mb-1 transition-colors duration-200 ${activeTab === 'chat'
                  ? 'text-primary '
                  : 'text-gray-400 hover:text-primary '
                  }`} />
                <span className={`text-xs transition-colors duration-200 ${activeTab === 'chat'
                  ? 'text-primary '
                  : 'text-gray-400 hover:text-primary '
                  }`}>Chat</span>
              </button>

              <button
                onClick={() => handleTabClick('history')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${activeTab === 'history'
                  ? 'text-primary '
                  : 'text-gray-400'
                  }`}
              >
                <History className={`w-5 h-5 mb-1 transition-colors duration-200 ${activeTab === 'history'
                  ? 'text-primary '
                  : 'text-gray-400 hover:text-primary '
                  }`} />
                <span className={`text-xs transition-colors duration-200 ${activeTab === 'history'
                  ? 'text-primary '
                  : 'text-gray-400 hover:text-primary '
                  }`}>History</span>
              </button>
            </div>
          </div>
        )}

        <WalletSetupModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onSetupComplete={handleWalletSetupComplete}
        />

        <ReferralsModal
          isOpen={showReferralsModal}
          onClose={() => setShowReferralsModal(false)}
        />

        <BuySellModal
          isOpen={showBuySellOnboarding}
          onClose={() => setShowBuySellOnboarding(false)}
          onComplete={() => {
            setShowBuySellOnboarding(false);
          }}
        />

        <BuySellTable
          isOpen={showBuySellModal}
          onClose={() => setShowBuySellModal(false)}
          section="modal"
        />

        <Notification
          showNotificationPanel={showNotificationPanel}
          setShowNotificationPanel={setShowNotificationPanel}
          isAuthenticated={isAuthenticated}
        />

        <WalletTransactionModal
          isOpen={showWalletTransactionModal}
          onClose={() => {
            setShowWalletTransactionModal(false);
            setWalletTransactionType(null);
          }}
          onBack={() => setShowWalletTransactionModal(false)}
          walletData={walletData}
        />

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
                    {authModalType === 'wallet' && <Wallet className="w-8 h-8 text-primary" />}
                    {authModalType === 'referrals' && <Gift className="w-8 h-8 text-primary" />}
                    {authModalType === 'notifications' && <Bell className="w-8 h-8 text-primary" />}
                    {authModalType === 'trade' && <TrendingUp className="w-8 h-8 text-primary" />}
                    {authModalType === 'chat' && <MessageCircle className="w-8 h-8 text-primary" />}
                    {authModalType === 'history' && <History className="w-8 h-8 text-primary" />}
                  </div>

                  <h3 className="text-white font-semibold text-xl mb-2">Sign In Required</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {authModalType === 'wallet' && "Please sign in to access your wallet and manage your funds securely."}
                    {authModalType === 'referrals' && "Please sign in to access your referral program and earn rewards."}
                    {authModalType === 'notifications' && "Please sign in to view your notifications and stay updated with the latest activities."}
                    {authModalType === 'trade' && "Please sign in to access the trading platform and buy/sell accounts safely."}
                    {authModalType === 'chat' && "Please sign in to access chat features and communicate with other users."}
                    {authModalType === 'history' && "Please sign in to view your transaction history and account activities."}
                  </p>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setShowAuthModal(false);
                        navigate('/sign-in');
                      }}
                      className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:opacity-70 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setShowAuthModal(false);
                        navigate('/sign-up');
                      }}
                      className="px-6 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
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

export default MobileHomePage;