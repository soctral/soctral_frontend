import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight, Star, ArrowLeft, Filter } from "lucide-react";
import badge from "../../assets/verifiedstar.svg";
import ug1 from "../../assets/ug1.png";
import btcs from "../../assets/btcicon.svg";
import solar from "../../assets/solar.svg";
import notice from "../../assets/notice.svg";
import filter2 from "../../assets/filter2.svg";
import face from "../../assets/face.svg";
import twitter from "../../assets/twitter.svg";
import ig from "../../assets/ig2.svg";
import tiktok from "../../assets/tiktok.svg";
import linkedin from "../../assets/linkedin2.svg";
import snap from "../../assets/snapchat.svg";
import youtube from "../../assets/youtube.svg";
import telegram from "../../assets/telegram.svg";
import discord from "../../assets/discord.svg";
import pinterest from "../../assets/pinterest.svg";
import reddit from "../../assets/reddit.svg";
import wechat from "../../assets/wechat.svg";
import onlyfans from "../../assets/onlyfans.svg";
import flickr from "../../assets/flickr.svg";
import vimeo from "../../assets/vimeo.svg";
import steam from "../../assets/steam.png";
import qoura from "../../assets/qoura.svg";
import twitch from "../../assets/twitch.svg";
import tumblr from "../../assets/tumblr.svg";
import btc from "../../assets/btc.svg";
import usdt from "../../assets/usdt.svg";
import eth from "../../assets/eth.svg";
import base from "../../assets/base-logo.jpg";
import tron from "../../assets/trx.svg";
import bnb from "../../assets/bnb.svg";
import solana from "../../assets/sol.svg";
import rumble from "../../assets/rumble.png";
import Filters from "../../components/Desktop/Filter";
import { useAllSellOrders, useAllBuyOrders } from "../../hooks/useOrders";
import { queryKeys } from "../../hooks/queryKeys";
import logo from "../../assets/SoctralbgLogo.png";
import apiService from "../../services/api"


const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-8">
    <style>{`
      @keyframes heartbeat {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.15);
        }
      }
      .heartbeat-animation {
        animation: heartbeat 1.5s ease-in-out infinite;
      }
    `}</style>

    <div className="relative">
      {/* Heartbeat logo with inline animation */}
      <div className="heartbeat-animation">
        <img
          src={logo}
          alt="Loading"
          className="w-16 h-16 rounded-full object-contain"
        />
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-primary/10 blur-xl animate-pulse"></div>
    </div>

    <span className="text-gray-400 text-sm font-medium animate-pulse">
      Loading accounts...
    </span>
  </div>
);

// Platform icon mapping - MOVED OUTSIDE COMPONENT to avoid recreation on every render
const PLATFORM_ICONS = {
  facebook: face,
  twitter: twitter,
  instagram: ig,
  tiktok: tiktok,
  linkedin: linkedin,
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
  steam: steam,
  rumble: rumble,
  qoura: qoura,
  twitch: twitch,
  tumblr: tumblr,
};

// Currency icon mapping - MOVED OUTSIDE COMPONENT
const CURRENCY_ICONS = {
  BTC: btcs,
  BITCOIN: btcs,
  USDT: usdt,
  TETHER: usdt,
  ETH: eth,
  ETHEREUM: eth,
  BASE: base,
  TRON: tron,
  TRX: tron,
  BNB: bnb,
  BINANCE: bnb,
  SOL: solana,
  SOLANA: solana
};


const BuySellTable = ({
  isOpen,
  onClose,
  onBack,
  section = 'modal',
  isAuthenticated,
  setShowAuthModal,
  setAuthModalType,
  setActiveMenuSection,
  setActiveTab,
  onSelectChatUser,
  onViewAccountMetrics
}) => {
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTabState] = useState('buy');
  const [tableHeight, setTableHeight] = useState(530);
  const [activeFilters, setActiveFilters] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState(null); // Track which row is loading
  const queryClient = useQueryClient();

  // 🔥 Invalidate order caches when a trade completes
  useEffect(() => {
    const handleTradeCompleted = () => {
      console.log('✅ Trade completed - refetching orders');
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.sell('all') });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.buy('all') });
    };
    window.addEventListener('tradeCompleted', handleTradeCompleted);
    return () => window.removeEventListener('tradeCompleted', handleTradeCompleted);
  }, [queryClient]);

  // React Query: Fetch both order types, enable based on activeTab
  // "buy" tab shows sell orders (user wants to buy), "sell" tab shows buy orders (user wants to sell)
  const sellOrdersQuery = useAllSellOrders({ enabled: activeTab === 'buy' });
  const buyOrdersQuery = useAllBuyOrders({ enabled: activeTab === 'sell' });

  // Select the active query based on current tab
  const activeQuery = activeTab === 'buy' ? sellOrdersQuery : buyOrdersQuery;
  const { data: ordersResponse, isLoading, error: queryError, isError } = activeQuery;

  // Derive error message for display
  const error = isError ? (queryError?.message || `Failed to load ${activeTab} orders`) : null;

  const tableContainerRef = useRef(null);
  const bodyRef = useRef(null);
  const tableBodyRef = useRef(null);

  // Helper function to get seller/buyer image
  const getUserImage = (user) => {
    const imageUrl = user?.bitmojiUrl || user?.avatar || user?.avatarUrl || user?.profileImage || user?.image;
    return imageUrl;
  };


  const getCurrencyIcon = (currency) => {
    if (!currency) return btcs; // Default to BTC icon
    return CURRENCY_ICONS[currency.toUpperCase()] || btcs;
  };



  const handleViewAccountMetrics = (account) => {
    // console.log('👁️ BuySellTable: View Account Metrics clicked for:', account);

    const accountData = {
      platform: account.platform,
      metrics: account.metrics,
      filters: account.filters,
      accountId: account.id
    };

    // console.log('📦 BuySellTable: Prepared account data:', accountData);

    // Primary method: Use callback if provided
    if (onViewAccountMetrics) {
      // console.log('✅ BuySellTable: Calling onViewAccountMetrics callback');
      onViewAccountMetrics(accountData);
    } else {
      console.warn('⚠️ onViewAccountMetrics callback not available');
    }
  };










  // Helper to format counts (e.g., 1000 -> 1k, 1000000 -> 1M)
  const formatCount = (count) => {
    if (isNaN(count) || count === null || count === undefined) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  // Helper function to get follower count from metrics OR filters
  // Supports all platform-specific keys (followers, subscribers, members, connections)
  const getFollowerCount = (metrics, filters) => {
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

  const getRequirementCount = (requirements) => {
    if (!requirements || !Array.isArray(requirements)) return '0';

    const followerRequirement = requirements.find(r =>
      r.key === 'min_followers' ||
      r.key === 'followers_count' ||
      r.key === 'subscribers_count'
    );

    if (followerRequirement && followerRequirement.value) {
      const count = parseInt(followerRequirement.value);
      if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M+';
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k+';
      }
      return count.toString() + '+';
    }

    return '0';
  };

  const calculateRating = (user) => {
    if (user?.averageRating !== undefined && user?.totalRatings > 0) {
      return Math.min(5, Math.max(0, user.averageRating));
    }
    return 5; // Default 5 stars
  };

  // Transform API response data using useMemo for performance
  // React Query handles fetching, caching, retry, and polling automatically
  const tableData = useMemo(() => {
    if (!ordersResponse?.status || !ordersResponse?.data) return [];

    return ordersResponse.data
      .filter(order => {
        if (!order || !order._id) return false;

        // "buy" tab expects sell orders, "sell" tab expects buy orders
        if (activeTab === 'buy') {
          return order.platform && (order.seller || order.userId);
        }

        if (activeTab === 'sell') {
          return order.platform && (order.buyer || order.userId);
        }

        return false;
      })
      .map((order) => {
        try {
          // "buy" tab processes sell orders
          if (activeTab === 'buy') {
            const seller = order.seller || {};
            // 🔥 ENHANCED: Check more image properties matching Sell tab pattern
            let sellerImage = seller.bitmojiUrl ||
              seller.avatar ||
              seller.avatarUrl ||
              seller.profileImage ||
              seller.profile_image ||
              seller.picture ||
              seller.image;

            if (!sellerImage) {
              try {
                const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                if (currentUserData._id === seller._id) {
                  sellerImage = currentUserData.bitmojiUrl || currentUserData.avatar || currentUserData.avatarUrl || currentUserData.profileImage;
                }
              } catch (e) {
                console.warn('Failed to parse userData from localStorage');
              }
            }

            const accountUsername = order.accountUsername ||
              order.username ||
              order.handle ||
              order.accountHandle ||
              'N/A';

            return {
              id: order._id,
              seller: {
                id: seller._id,
                _id: seller._id,
                image: sellerImage || ug1,
                name: seller.displayName || seller.email?.split('@')[0] || 'Anonymous',
                displayName: seller.displayName || seller.email?.split('@')[0] || 'Anonymous',
                verified: seller.emailVerified || false,
                bitmojiUrl: sellerImage,
                avatar: sellerImage,
                avatarUrl: sellerImage,
                profileImage: sellerImage,
                averageRating: seller.averageRating || undefined,
                totalRatings: seller.totalRatings || 0,
              },
              item: {
                image: PLATFORM_ICONS[order.platform?.toLowerCase()] || ig,
                name: order.platform ? (order.platform.charAt(0).toUpperCase() + order.platform.slice(1)) : 'Unknown',
              },
              platform: order.platform?.toLowerCase(),
              followers: getFollowerCount(order.metrics, order.filters),
              rating: calculateRating(seller),
              price: order.price || 0,
              currency: order.currency || 'USD',
              description: order.description || '',
              accountType: order.accountType || '0',
              isFeatured: order.isFeatured || false,
              metrics: order.metrics || [],
              filters: order.filters || [],
              accountUsername: accountUsername,
              username: accountUsername,
              handle: accountUsername
            };
          } else {
            // "sell" tab processes buy orders
            const buyerData = order.buyer || order.user || order.userId || {};

            // 🔥 ENHANCED: Check multiple sources for buyer image
            // 1. Direct user object properties
            let buyerImage = buyerData.bitmojiUrl ||
              buyerData.avatar ||
              buyerData.avatarUrl ||
              buyerData.profileImage ||
              buyerData.profile_image ||
              buyerData.picture ||
              buyerData.image;

            // 2. Check if user object is nested differently
            if (!buyerImage && order.user) {
              buyerImage = order.user.bitmojiUrl || order.user.avatar || order.user.avatarUrl || order.user.profileImage;
            }

            // 3. Check if userId is populated with user data (mongoose populate)
            if (!buyerImage && order.userId && typeof order.userId === 'object') {
              buyerImage = order.userId.bitmojiUrl || order.userId.avatar || order.userId.avatarUrl || order.userId.profileImage;
            }

            // 4. Check order-level image properties
            if (!buyerImage) {
              buyerImage = order.buyerImage || order.userImage || order.profileImage;
            }

            // 5. Fallback to localStorage for current user
            if (!buyerImage) {
              try {
                const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                const buyerId = buyerData._id || buyerData.id || order.userId;
                if (currentUserData._id === buyerId || currentUserData.id === buyerId) {
                  buyerImage = currentUserData.bitmojiUrl || currentUserData.avatar || currentUserData.avatarUrl || currentUserData.profileImage;
                }
              } catch (e) {
                console.warn('Failed to parse userData from localStorage');
              }
            }

            // Debug logging to help identify the issue
            if (!buyerImage) {
              console.log('🔍 Sell tab: No buyer image found for order:', {
                orderId: order._id,
                buyerData: buyerData,
                orderUser: order.user,
                orderUserId: order.userId,
                orderBuyer: order.buyer
              });
            }

            const accountUsername = order.accountUsername ||
              order.username ||
              order.handle ||
              order.accountHandle ||
              'N/A';

            return {
              id: order._id,
              buyer: {
                id: buyerData._id || order.userId,
                _id: buyerData._id || order.userId,
                image: buyerImage || ug1,
                name: buyerData.displayName || buyerData.username || buyerData.email?.split('@')[0] || 'Anonymous',
                displayName: buyerData.displayName || buyerData.username || buyerData.email?.split('@')[0] || 'Anonymous',
                verified: buyerData.emailVerified || buyerData.verified || false,
                bitmojiUrl: buyerImage,
                avatar: buyerImage,
                avatarUrl: buyerImage,
                profileImage: buyerImage,
              },
              item: {
                image: PLATFORM_ICONS[order.platform?.toLowerCase()] || ig,
                name: order.platform ? (order.platform.charAt(0).toUpperCase() + order.platform.slice(1)) : 'Unknown',
              },
              platform: order.platform?.toLowerCase(),
              requirements: getRequirementCount(order.requirements),
              // 🔥 FIX: Add followers field for Sell tab to match Buy tab display
              followers: getFollowerCount(order.metrics, order.filters) || getRequirementCount(order.requirements),
              rating: calculateRating(buyerData),
              maxPrice: order.maxPrice || 0,
              currency: order.currency || 'USD',
              description: order.description || '',
              isUrgent: order.isUrgent || false,
              metrics: order.metrics || [],
              filters: order.filters || [],
              accountUsername: accountUsername,
              username: accountUsername,
              handle: accountUsername
            };
          }
        } catch (transformError) {
          console.error('Error transforming order:', transformError, order);
          return null;
        }
      })
      .filter(item => item !== null);
  }, [ordersResponse, activeTab]);


  // Apply filters using useMemo for stable references (avoids infinite loop)
  const filteredTableData = useMemo(() => {
    if (activeFilters.length === 0) {
      return tableData;
    }

    let filtered = [...tableData];

    activeFilters.forEach(filter => {
      // Filter by platform
      if (filter.type === 'platform' && filter.value) {
        filtered = filtered.filter(item =>
          item.platform?.toLowerCase() === filter.value.toLowerCase()
        );
      }

      // Filter by price range (for sell orders)
      if (filter.type === 'priceRange' && filter.min !== undefined) {
        filtered = filtered.filter(item => {
          const price = activeTab === 'sell' ? item.price : item.maxPrice;
          return price >= filter.min && (filter.max === undefined || price <= filter.max);
        });
      }

      // Filter by follower count (for sell orders)
      if (filter.type === 'followers' && filter.min !== undefined) {
        filtered = filtered.filter(item => {
          if (activeTab !== 'sell') return true;
          const followerStr = item.followers;
          let followerCount = 0;

          if (followerStr.includes('M')) {
            followerCount = parseFloat(followerStr) * 1000000;
          } else if (followerStr.includes('k')) {
            followerCount = parseFloat(followerStr) * 1000;
          } else {
            followerCount = parseInt(followerStr) || 0;
          }

          return followerCount >= filter.min;
        });
      }

      // Filter by rating
      if (filter.type === 'rating' && filter.min !== undefined) {
        filtered = filtered.filter(item => item.rating >= filter.min);
      }

      // Filter by verified sellers/buyers
      if (filter.type === 'verified' && filter.value === true) {
        filtered = filtered.filter(item => {
          if (activeTab === 'sell') {
            return item.seller?.verified === true;
          } else {
            return item.buyer?.verified === true;
          }
        });
      }
    });

    return filtered;
  }, [activeFilters, tableData, activeTab]);



  const handleInitiateTrade = async (user, accountData) => {
    // Set loading state immediately for visual feedback
    setLoadingRowId(accountData?.id);

    console.log('🔍 DEBUG handleInitiateTrade accountData:', {
      accountData,
      accountUsername: accountData?.accountUsername,
      username: accountData?.username,
      handle: accountData?.handle,
      filters: accountData?.filters
    });

    const extractedUsername = accountData?.filters?.find(f => f.key === 'username')?.value ||
      accountData?.accountUsername ||
      accountData?.username ||
      accountData?.handle ||
      'N/A';

    const userImage = getUserImage(user);
    const chatType = activeTab === 'buy' ? 'buy' : 'sell';

    const isSellTab = activeTab === 'sell';
    const buyOrderId = isSellTab ? (accountData?.id || accountData?._id) : null;
    const sellOrderId = !isSellTab ? (accountData?.id || accountData?._id) : null;

    // 🚀 OPTIMIZED: Build user data immediately without waiting for wallet
    // 🔥 Chat Tab Routing: 
    //   - Buy tab click: chatType='buy', User A sees Buy tab, User B (receiver) sees Sell tab
    //   - Sell tab click: chatType='sell', User A sees Sell tab, User B (receiver) sees Buy tab
    const userForChat = {
      id: user.id || user._id,
      _id: user.id || user._id,
      name: user.name || user.displayName,
      displayName: user.name || user.displayName,
      profileImage: userImage,
      avatar: userImage,
      bitmojiUrl: userImage,
      avatarUrl: userImage,
      image: userImage,
      status: 'online',
      chatType: chatType,
      initiatorChatType: chatType, // 🔥 Preserved for tab routing - determines which tab opens for initiator
      price: activeTab === 'buy' ? accountData?.price : accountData?.maxPrice,
      accountId: accountData?.id || accountData?.accountId || user.id,
      buyOrderId: buyOrderId,
      sellOrderId: sellOrderId,
      sellerId: activeTab === 'buy' ? (user.id || user._id) : null,
      buyerId: activeTab === 'sell' ? (user.id || user._id) : null,
      walletAddresses: {}, // Will be fetched in background
      platform: accountData?.platform || user.platform || 'Unknown',
      accountUsername: extractedUsername,
      username: extractedUsername,
      handle: extractedUsername,
      filters: accountData?.filters || [],
      metrics: accountData?.metrics || []
    };

    // 🚀 IMMEDIATE: Store and navigate right away
    localStorage.setItem('selectedChatUser', JSON.stringify(userForChat));

    if (setActiveMenuSection) {
      setActiveMenuSection('chat');
    }

    if (onSelectChatUser) {
      onSelectChatUser(userForChat);
    }

    window.dispatchEvent(new CustomEvent('initiateTrade', {
      detail: userForChat
    }));

    // 🔥 BACKGROUND: Fetch wallet addresses after navigation
    if (activeTab === 'buy' && user.id) {
      try {
        let walletResponse = null;
        try {
          walletResponse = await apiService.get(`/user?id=${user.id}`);
        } catch (e) {
          walletResponse = await apiService.get(`/api/users/${user.id}`);
        }

        if (walletResponse) {
          const sellerUser = walletResponse.user || walletResponse.data || walletResponse;
          if (sellerUser?.walletAddresses) {
            const updatedData = { ...userForChat, walletAddresses: sellerUser.walletAddresses };
            localStorage.setItem('selectedChatUser', JSON.stringify(updatedData));
            window.dispatchEvent(new CustomEvent('initiateTrade', { detail: updatedData }));
          }
        }
      } catch (error) {
        console.warn('⚠️ Background wallet fetch failed:', error);
      }
    }

    // Clear loading state
    setLoadingRowId(null);
  };





  const handleTabSwitch = (newTab) => {
    if (newTab === activeTab || isTransitioning) return;

    setIsTransitioning(true);

    setTimeout(() => {
      setActiveTabState(newTab);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }, 150);
  };

  const handleTableScroll = (e) => {
    if (!e || !e.target) return;

    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    setShowLeftScroll(scrollLeft > 10);
    setShowRightScroll(scrollLeft < maxScrollLeft - 10);
  };

  const scrollTableLeft = () => {
    if (tableContainerRef.current) {
      const scrollAmount = 200;
      tableContainerRef.current.scrollLeft -= scrollAmount;
    }
  };

  const scrollTableRight = () => {
    if (tableContainerRef.current) {
      const scrollAmount = 200;
      tableContainerRef.current.scrollLeft += scrollAmount;
    }
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

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter((filter, index) => index !== filterToRemove));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  useEffect(() => {
    const checkScrollButtons = () => {
      if (tableContainerRef.current) {
        const container = tableContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const maxScrollLeft = scrollWidth - clientWidth;

        setShowLeftScroll(scrollLeft > 10);
        setShowRightScroll(scrollLeft < maxScrollLeft - 10);
      }
    };

    checkScrollButtons();

    const handleResize = () => {
      checkScrollButtons();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (tableContainerRef.current) {
      const resetScroll = () => {
        tableContainerRef.current.scrollLeft = 0;

        setTimeout(() => {
          if (tableContainerRef.current) {
            const container = tableContainerRef.current;
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const maxScrollLeft = scrollWidth - clientWidth;

            setShowLeftScroll(scrollLeft > 10);
            setShowRightScroll(scrollLeft < maxScrollLeft - 10);
          }
        }, 10);
      };

      resetScroll();
    }
  }, [activeTab]);

  if (section === 'verification-card') {
    return (
      <div className="rounded-lg text-[#fff] relative">
        <div className="flex items-center">
          <div>
            <img />
          </div>

          <div className="w-full">
            <div className="flex w-full">
              <div className="w-full">
                <div className="flex items-center justify-between w-full pt-3">
                  <h3 className="font-semibold text-base pb-1">
                    Buy/Sell (P2P)
                  </h3>
                  <button >
                    <img src={solar} />
                  </button>
                </div>

                <div className="flex items-center justify-center bg-[#181818] p-1 rounded-md w-full mt-7">
                  <div>
                    <p className="flex items-center gap-2 font-normal text-sm text-[#6e6e6e]">
                      <span><img src={notice} /></span> You are yet to verify your account. upgrade your account to Tier 2 to start trading.
                    </p>
                  </div>

                  <button
                    className="text-sm  text-white py-3 px-1 rounded-full hover:bg-opacity-80 transition-colors"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowAuthModal(true);
                        setAuthModalType('profile');
                        return;
                      }

                      setActiveMenuSection('profile');
                      setActiveTab('profile');
                    }}
                  >
                    Verify Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'main') {
    const isActive = (tab) => activeTab === tab;
    const displayFilters = activeFilters.slice(0, 3);
    const remainingCount = activeFilters.length - 3;

    return (
      <>
        <div className="block lg:hidden rounded-lg text-[#fff] relative">
          <div className="flex items-center">
            <div>
              <img />
            </div>

            <div className="w-full">
              <div className="flex w-full">
                <div className="w-full">
                  <div className="flex items-center text-center justify-between w-full pt-3">
                    <h3 className="font-semibold mx-auto text-center text-base pb-1">
                      Buy/Sell (P2P)
                    </h3>
                    <button >
                      <img src={solar} />
                    </button>
                  </div>

                  <div className="flex items-center justify-center bg-[#181818] p-2 rounded-md w-full mt-3">
                    <div className="inline-flex">
                      <p className="flex items-center gap-1 font-normal text-xs text-[#6e6e6e]">
                        <span><img className="h-6 w-6 pb-3" src={notice} /></span>
                        <span>
                          You are yet to verify your account. upgrade your account to Tier 2 to start trading.
                          <button
                            className="text-xs  text-white pl-1 rounded-full hover:bg-opacity-80 transition-colors"
                            onClick={() => {
                              if (!isAuthenticated) {
                                setShowAuthModal(true);
                                setAuthModalType('profile');
                                return;
                              }

                              setActiveMenuSection('profile');
                              setActiveTab('profile');
                            }}
                          >
                            Verify Now
                          </button>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full max-w-[53rem] mt-3">
          <div className="flex-1 rounded-md max-w-[53rem]">
            <div className="mb-3 flex items-center justify-between max-w-[53rem]">
              <div>
                <div className="flex items-center gap-1 rounded-lg p-1 relative">
                  <div
                    className={`absolute top-1 bottom-1 rounded-md transition-all duration-300 ease-in-out ${activeTab === 'buy' ? 'left-1 w-[calc(50%-4px)]' : 'right-1 w-[calc(50%-4px)]'
                      }`}
                  />
                  <button
                    onClick={() => handleTabSwitch('buy')}
                    disabled={isTransitioning}
                    className={`relative z-10 rounded-md text-md font-medium transition-all duration-300 ease-in-out ${isActive('buy')
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                      } ${isTransitioning ? 'pointer-events-none' : ''}`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => handleTabSwitch('sell')}
                    disabled={isTransitioning}
                    className={`relative z-10 text-md pl-3 rounded-md  font-medium transition-all duration-300 ease-in-out ${isActive('sell')
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                      } ${isTransitioning ? 'pointer-events-none' : ''}`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {displayFilters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-1 bg-[#613cd0] text-white px-3 py-1 rounded-full text-xs">
                    {filter.icon && (
                      <img src={filter.icon} className="w-3 h-3" />
                    )}
                    <span>{filter.label}</span>
                    <button
                      onClick={() => removeFilter(index)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {remainingCount > 0 && (
                  <div className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs">
                    +{remainingCount}
                  </div>
                )}

                {activeFilters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-gray-400 hover:text-white text-xs underline transition-colors"
                  >
                    Clear all
                  </button>
                )}

                <button
                  onClick={() => setShowFilterModal(true)}
                  className="flex items-center gap-2 px-4 py-2  hover:bg-[#3c3a3f] text-white rounded-lg transition-all duration-200"
                >
                  <span className="text-sm font-medium">Filter</span>
                  <img src={filter2} />
                </button>
              </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
              }`}>
              {/* DESKTOP VIEW - Table */}
              <div className="hidden md:block relative rounded-xl bg-neutral-900 shadow-2xl overflow-hidden border border-gray-800 max-w-7xl mx-auto transition-all duration-500 ease-in-out">
                {showLeftScroll && (
                  <button
                    onClick={scrollTableLeft}
                    className="absolute left-2 top-14 transform -translate-y-1/2 z-20 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {showRightScroll && (
                  <button
                    onClick={scrollTableRight}
                    className="absolute right-2 top-14 transform -translate-y-1/2 z-20 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                <div
                  className="flex-1 overflow-auto"
                  ref={tableContainerRef}
                  onScroll={handleTableScroll}
                  style={{
                    maxHeight: `${tableHeight}px`,
                    scrollBehavior: "smooth",
                  }}
                >
                  <style jsx>{`
                    .flex-1.overflow-auto::-webkit-scrollbar {
                      width: 8px !important;
                      height: 8px !important;
                    }

                    .flex-1.overflow-auto::-webkit-scrollbar-track {
                      background: #1f1f1f !important;
                      border-radius: 4px !important;
                    }

                    .flex-1.overflow-auto::-webkit-scrollbar-thumb {
                      background: #555 !important;
                      border-radius: 4px !important;
                    }

                    .flex-1.overflow-auto::-webkit-scrollbar-thumb:hover {
                      background: #666 !important;
                    }

                    .flex-1.overflow-auto::-webkit-scrollbar-corner {
                      background: #1f1f1f !important;
                    }
                  `}</style>

                  <table className="w-full" style={{ minWidth: "970px" }}>
                    <thead className="sticky top-0 bg-[#2c2a2f] border-b border-gray-700 z-10">
                      <tr>
                        <th className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap" style={{ width: "60px", minWidth: "60px" }}></th>
                        <th className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap" style={{ width: "200px", minWidth: "200px" }}>
                          {activeTab === 'buy' ? 'Seller' : 'Buyer'}
                        </th>
                        <th className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap" style={{ width: "250px", minWidth: "250px" }}>
                          Social Account
                        </th>
                        <th className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap" style={{ width: "120px", minWidth: "120px" }}>
                          {activeTab === 'buy' ? 'Metric' : 'Metric'}
                        </th>
                        <th className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap" style={{ width: "150px", minWidth: "150px" }}>
                          {activeTab === 'buy' ? 'Seller Rating' : 'Buyer Rating'}
                        </th>
                        <th className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap" style={{ width: "180px", minWidth: "180px" }}>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-neutral-900">
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12">
                            <LoadingSpinner />
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-red-400">
                            <div className="flex flex-col items-center gap-2">
                              <span>{error}</span>
                              <button
                                onClick={() => window.location.reload()}
                                className="text-sm text-primary hover:underline"
                              >
                                Retry
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : filteredTableData.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-gray-400">
                            {activeFilters.length > 0 ? 'No results found for the selected filters.' : `No ${activeTab === 'buy' ? 'sell orders' : 'buy orders'} available yet.`}
                          </td>
                        </tr>
                      ) : (
                        filteredTableData.map((row, index) => (
                          <tr
                            key={row.id}
                            className={`border-b border-gray-800 last:border-b-0 hover:bg-gray-800/30 transition-all duration-300 ease-in-out ${index % 2 === 0 ? "bg-neutral-900/50" : "bg-neutral-900"
                              }`}
                          >
                            <td className="py-4 px-6 whitespace-nowrap" style={{ width: "60px", minWidth: "60px" }}>
                              <span className="text-gray-400 font-normal text-xs">{index + 1}.</span>
                            </td>

                            <td className="py-4 px-6 whitespace-nowrap text-sm !font-[400]" style={{ width: "200px", minWidth: "200px" }}>
                              <div className="flex items-center gap-3">
                                <img
                                  src={activeTab === 'buy' ? row.seller?.image : row.buyer?.image}
                                  alt={activeTab === 'buy' ? row.seller?.name : row.buyer?.name}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-md"
                                  loading="lazy"
                                  onError={(e) => { e.target.src = ug1; }}
                                />
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-white font-medium truncate max-w-[120px]">
                                    {activeTab === 'buy' ? row.seller?.name : row.buyer?.name}
                                  </span>
                                  {((activeTab === 'buy' && row.seller?.verified) || (activeTab === 'sell' && row.buyer?.verified)) && (
                                    <img
                                      src={badge}
                                      alt="soctral badge"

                                    />
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 whitespace-nowrap text-sm !font-[400]" style={{ width: "250px", minWidth: "250px" }}>
                              <div className="flex items-center gap-3">
                                <img
                                  src={row.item?.image || ig}
                                  alt={row.item?.name || 'Platform'}
                                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-md"
                                  loading="lazy"
                                />
                                <span className="text-white font-medium truncate max-w-[160px]">{row.item?.name || 'Unknown'}</span>
                              </div>
                            </td>

                            <td className="py-4 px-6 whitespace-nowrap text-sm !font-[400]" style={{ width: "120px", minWidth: "120px" }}>
                              <div className="flex items-center gap-1 text-white">
                                <div className="flex items-center pb-[5px] gap-2 font-semibold text-xs mt-1">
                                  <span className="text-xs font-normal text-gray-400">Follower Count </span> {row.followers}
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 whitespace-nowrap text-sm !font-[400]" style={{ width: "150px", minWidth: "150px" }}>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 flex-shrink-0">{renderStars(row.rating)}</div>
                              </div>
                            </td>

                            <td className="py-4 px-6 whitespace-nowrap text-sm !font-[400]" style={{ width: "180px", minWidth: "180px" }}>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleInitiateTrade(activeTab === 'buy' ? row.seller : row.buyer, row)}
                                  disabled={loadingRowId === row.id}
                                  className={`py-[12px] px-[30px] font-medium bg-[#DCD0FF] hover:opacity-60 text-xs text-primary rounded-full transition-all duration-200 flex-shrink-0 hover:shadow-lg transform hover:scale-105 ${loadingRowId === row.id ? 'opacity-70 cursor-wait' : ''}`}
                                  aria-label="View item"
                                >
                                  {loadingRowId === row.id ? (
                                    <span className="flex items-center gap-2">
                                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      Loading...
                                    </span>
                                  ) : 'Initiate Trade'}
                                </button>
                                {activeTab === 'buy' && (
                                  <button
                                    className="py-[12px] px-[30px] font-medium bg-[#2c2a2f] hover:bg-[#3c3a3f] text-white rounded-full text-xs transition-all duration-200 flex-shrink-0 hover:shadow-lg transform hover:scale-105"
                                    onClick={() => handleViewAccountMetrics(row)}
                                    aria-label="View metrics"
                                  >
                                    View Metrics
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE VIEW - Card Layout */}
              <div className="md:hidden">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner />
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-400">
                    {error}
                  </div>
                ) : filteredTableData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {activeFilters.length > 0 ? 'No results found for the selected filters.' : `No ${activeTab === 'buy' ? 'sell orders' : 'buy orders'} available yet.`}
                  </div>
                ) : (
                  filteredTableData.map((row, index) => (
                    <div
                      key={row.id}
                      className="flex justify-between bg-neutral-900 p-4 mb-3 border border-gray-800 hover:border-gray-700 rounded-lg transition-all duration-300"
                    >
                      <div className="flex flex-col space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={activeTab === 'buy' ? row.seller?.image : row.buyer?.image}
                              alt={activeTab === 'buy' ? row.seller?.name : row.buyer?.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-md"
                              loading="lazy"
                              onError={(e) => { e.target.src = ug1; }}
                            />
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium text-sm">
                                  {activeTab === 'buy' ? row.seller?.name : row.buyer?.name}
                                </span>
                                {((activeTab === 'buy' && row.seller?.verified) || (activeTab === 'sell' && row.buyer?.verified)) && (
                                  <img src={badge} alt="verified badge" className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {renderStars(row.rating)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <span className="text-gray-400 text-[11px] font-extralight w-20">Social Account</span>
                          <div className="flex items-center gap-2">
                            <img
                              src={row.item?.image || ig}
                              alt={row.item?.name || 'Platform'}
                              className="w-4 h-4 rounded-lg object-cover flex-shrink-0"
                              loading="lazy"
                            />
                            <span className="text-white font-medium text-sm">{row.item?.name || 'Unknown'}</span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <span className="text-gray-400 text-[11px] font-extralight w-20">
                            Follower Count
                          </span>
                          <span className="text-white font-semibold text-sm">
                            {row.followers}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-[11px] font-extralight whitespace-nowrap w-20">
                            {activeTab === 'buy' ? 'Payment Method' : 'Max Budget'}
                          </span>
                          <span className="flex items-center gap-1 text-white font-medium text-xs">
                            <img
                              src={getCurrencyIcon(activeTab === 'buy' ? row.currency : row.currency)}
                              alt={activeTab === 'buy' ? row.currency : row.currency}
                              className="w-3 h-3"
                            />
                            {activeTab === 'buy' ? row.currency : `${row.maxPrice} ${row.currency}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col pt-[6px] justify-between items-end ml-2">
                        {activeTab === 'buy' && (
                          <button
                            onClick={() => handleViewAccountMetrics(row)}
                            className="w-full py-2 px-3 font-medium bg-[#2c2a2f] hover:bg-[#3c3a3f] text-white rounded-full text-[10px] transition-all duration-200 mb-2 whitespace-nowrap"
                            aria-label="View metrics"
                          >
                            View Metrics
                          </button>
                        )}

                        {/* {activeTab === 'sell' && (
            <button
              className="w-full py-2 px-3 font-medium bg-[#2c2a2f] hover:bg-[#3c3a3f] text-white rounded-full text-[10px] transition-all duration-200 mb-2 whitespace-nowrap"
              aria-label="View details"
            >
              View Details
            </button>
          )} */}

                        <button
                          onClick={() => handleInitiateTrade(activeTab === 'buy' ? row.seller : row.buyer, row)}
                          className="w-full py-2 px-3 font-medium bg-[#DCD0FF] hover:opacity-80 text-[10px] text-primary rounded-full transition-all duration-200 whitespace-nowrap"
                          aria-label="Initiate trade"
                        >
                          {activeTab === 'buy' ? 'Initiate Trade' : 'Initiate Trade'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Filter Modal */}
          {showFilterModal && (
            <>
              <Filters
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApplyFilters={handleApplyFilters}
              />
            </>
          )}
        </div>
      </>
    );
  }

  if (!isOpen) return null;

  return null;
};

export default BuySellTable;