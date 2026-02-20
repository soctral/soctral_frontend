import { useState, useMemo, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import withdraw from "../../assets/withdrawal.svg";
import btc from "../../assets/btc.svg";
import usdt from "../../assets/usdt.svg";
import eth from "../../assets/eth.svg";
import frame0 from "../../assets/frame1.svg";
import frame00 from "../../assets/frame2.svg";
import frame000 from "../../assets/frame3.svg";
import badge from "../../assets/verifiedstar.svg";
import ig from "../../assets/ig2.svg";
import linkedin from "../../assets/linkedin.svg";
import tik from "../../assets/tik.svg";
import ig2 from "../../assets/socialicon.svg";
import face from "../../assets/face.svg";
import twitter from "../../assets/twitter.svg";
import tiktok from "../../assets/tiktok.svg";
import linkedin2 from "../../assets/linkedin2.svg";
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
import rumble from "../../assets/rumble.png";
import ug1 from "../../assets/ug1.png";
import { useAllSellOrders } from "../../hooks/useOrders";
import { queryKeys } from "../../hooks/queryKeys";
import { useUser } from "../../context/userContext";
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
  qoura: qoura,
  twitch: twitch,
  tumblr: tumblr,
  steam: steam,
  rumble: rumble
};

const Tables = ({ onSelectChatUser, setActiveMenuSection: setMenuSection, onViewAccountMetrics }) => {
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
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [loadingRowId, setLoadingRowId] = useState(null); // Track which row is loading
  const [initiateConfirmPayload, setInitiateConfirmPayload] = useState(null); // { seller, accountData } for confirm dialog
  // React Query handles fetching, caching, retry, and polling
  const {
    data: ordersResponse,
    isLoading: isInitialLoad,
    error: queryError,
    isError
  } = useAllSellOrders();

  // Derive error message for display
  const error = isError ? (queryError?.message || 'Failed to load sell orders') : null;

  const tableContainerRef = useRef(null);
  const mainContentRef = useRef(null);
  const tableBodyRef = useRef(null);
  const bodyRef = useRef(null);
  // ✅ REMOVED: Local activeMenuSection state that was conflicting with prop

  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();

  // 🔥 Invalidate sell orders cache when a trade completes
  useEffect(() => {
    const handleTradeCompleted = () => {
      console.log('✅ Trade completed - refetching sell orders');
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.sell('all') });
    };
    window.addEventListener('tradeCompleted', handleTradeCompleted);
    return () => window.removeEventListener('tradeCompleted', handleTradeCompleted);
  }, [queryClient]);

  // FIXED: Helper function to get seller image - same as chat.jsx getUserImage
  const getSellerImage = (seller) => {
    // Priority order: bitmojiUrl > avatar > avatarUrl > profileImage > image
    const imageUrl = seller?.bitmojiUrl || seller?.avatar || seller?.avatarUrl || seller?.profileImage || seller?.image;

    //   sellerId: seller?.id || seller?._id,
    //   bitmojiUrl: seller?.bitmojiUrl,
    //   avatar: seller?.avatar,
    //   avatarUrl: seller?.avatarUrl,
    //   profileImage: seller?.profileImage,
    //   image: seller?.image,
    //   final: imageUrl
    // });

    return imageUrl;
  };

  // Function to fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('No auth token available');
        return null;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (response.ok) {
        const userData = await response.json();
        // Return the first available image property
        const avatarUrl = userData?.data?.bitmojiUrl || userData?.data?.avatar || userData?.data?.avatarUrl || userData?.data?.profileImage || userData?.bitmojiUrl || userData?.avatar || userData?.avatarUrl || userData?.profileImage;
        return avatarUrl;
      } else {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText, 'for user:', userId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', userId, error);
      return null;
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

  // Helper function to calculate rating from metrics
  const calculateRating = (seller) => {
    // Check if seller has user ratings
    if (seller?.averageRating !== undefined && seller?.totalRatings > 0) {
      // Return actual user rating (0-5 scale)
      return Math.min(5, Math.max(0, seller.averageRating));
    }

    // Default to 5 stars for new accounts with no ratings
    return 5;
  };

  // Transform API response data using useMemo for performance
  // React Query handles fetching, caching, retry, and polling automatically
  const tableData = useMemo(() => {
    if (!ordersResponse?.status || !ordersResponse?.data) return [];

    return ordersResponse.data.map((order) => {
      const seller = order.seller || {};
      const sellerId = seller._id;

      const sellerImageUrl = seller.bitmojiUrl || seller.avatar || seller.avatarUrl || seller.profileImage || seller.image || null;

      // Extract account username from order data
      const accountUsername = order.accountUsername ||
        order.username ||
        order.handle ||
        order.accountHandle ||
        'N/A';

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
          averageRating: seller.averageRating || undefined,
          totalRatings: seller.totalRatings || 0,
        },
        item: {
          image: PLATFORM_ICONS[order.platform?.toLowerCase()] || ig2,
          name: order.platform ? order.platform.charAt(0).toUpperCase() + order.platform.slice(1) : 'Unknown',
        },
        followers: getFollowerCount(order.metrics, order.filters),
        rating: calculateRating(seller),
        price: order.price,
        currency: order.currency,
        description: order.description,
        accountType: order.accountType,
        isFeatured: order.isFeatured,
        platform: order.platform?.toLowerCase(),
        metrics: order.metrics,
        filters: order.filters,
        // Add these fields for complete metadata
        accountUsername: accountUsername,
        username: accountUsername,
        handle: accountUsername
      };
    });
  }, [ordersResponse]);


  const slideImages = [frame0, frame00, frame000];

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





  const proceedWithInitiateTrade = async (seller, accountData) => {
    setLoadingRowId(accountData?.id);
    const extractedUsername = accountData?.filters?.find(f => f.key === 'username')?.value ||
      accountData?.accountUsername ||
      accountData?.username ||
      accountData?.handle ||
      'N/A';
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
      initiatorChatType: 'buy',
      price: accountData?.price || seller.price || 'N/A',
      accountId: accountData?.id || seller.accountId || seller.id,
      sellOrderId: accountData?.id || accountData?._id || seller.accountId,
      sellerId: seller.id || seller._id,
      walletAddresses: {},
      platform: accountData?.platform || accountData?.item?.name?.toLowerCase() || 'Unknown',
      accountUsername: extractedUsername,
      username: extractedUsername,
      handle: extractedUsername,
      filters: accountData?.filters || [],
      metrics: accountData?.metrics || []
    };
    localStorage.setItem('selectedChatUser', JSON.stringify(sellerForChat));
    if (setMenuSection) setMenuSection('chat');
    if (onSelectChatUser) onSelectChatUser(sellerForChat);
    window.dispatchEvent(new CustomEvent('initiateTrade', { detail: sellerForChat }));
    if (seller.id) {
      try {
        let walletResponse = await apiService.get(`/user?id=${seller.id}`).catch(() => apiService.get(`/api/users/${seller.id}`));
        if (walletResponse) {
          const sellerUser = walletResponse.user || walletResponse.data || walletResponse;
          if (sellerUser?.walletAddresses) {
            const updatedData = { ...sellerForChat, walletAddresses: sellerUser.walletAddresses };
            localStorage.setItem('selectedChatUser', JSON.stringify(updatedData));
            window.dispatchEvent(new CustomEvent('initiateTrade', { detail: updatedData }));
          }
        }
      } catch (error) {
        console.warn('⚠️ Background wallet fetch failed:', error);
      }
    }
    setLoadingRowId(null);
  };

  const handleInitiateTrade = (seller, accountData) => {
    setInitiateConfirmPayload({ seller, accountData });
  };

  const handleConfirmInitiateTrade = async () => {
    if (!initiateConfirmPayload) return;
    const { seller, accountData } = initiateConfirmPayload;
    setInitiateConfirmPayload(null);
    await proceedWithInitiateTrade(seller, accountData);
  };





  const handleViewAccountMetrics = (account) => {

    const accountData = {
      platform: account.platform,
      metrics: account.metrics,
      filters: account.filters,
      accountId: account.id
    };


    // Primary method: Use callback if provided
    if (onViewAccountMetrics) {
      onViewAccountMetrics(accountData);
    } else {
      console.warn('⚠️ onViewAccountMetrics callback not available, using event fallback');
      // Fallback: dispatch event
      window.dispatchEvent(new CustomEvent('viewAccountMetrics', {
        detail: accountData
      }));
    }
  };


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
      <section>
        <h3 className="mb-4 font-semibold text-base">Explore Soctral</h3>
        <div className="rounded-xl">
          <Slider {...slickSettings}>
            {slideImages.map((img, index) => (
              <div key={index} className="px-2">
                <img
                  src={img}
                  alt={`Explore Soctral ${index + 1}`}
                  className="w-full object-cover rounded-lg"
                />
              </div>
            ))}
          </Slider>
        </div>
      </section>

      <div className="relative rounded-xl h-fit shadow-2xl overflow-hidden flex flex-col">
        <div
          className="flex-1 overflow-auto"
          ref={bodyRef}
          onScroll={handleTableScroll}
          style={{
            scrollBehavior: "smooth",
          }}
        >
          <section
            ref={tableContainerRef}
            className="flex-1 flex flex-col min-h-0"
          >
            <div data-section="table-title" className="mb-4">
              <h3 className="font-semibold text-base text-white">
                Pick of the Week
              </h3>
            </div>

            <div className="relative rounded-xl h-fit bg-neutral-900 shadow-2xl overflow-hidden flex flex-col">
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
                ref={tableBodyRef}
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
                  <thead className="sticky top-0 z-10 bg-[#2c2a2f] border-b border-gray-700">
                    <tr>
                      <th
                        className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap"
                        style={{ width: "60px", minWidth: "60px" }}
                      ></th>
                      <th
                        className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap"
                        style={{ width: "200px", minWidth: "200px" }}
                      >
                        Seller
                      </th>
                      <th
                        className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap"
                        style={{ width: "250px", minWidth: "250px" }}
                      >
                        Items
                      </th>
                      <th
                        className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap"
                        style={{ width: "120px", minWidth: "120px" }}
                      >
                        Metric
                      </th>
                      <th
                        className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap"
                        style={{ width: "150px", minWidth: "150px" }}
                      >
                        Seller Rating
                      </th>
                      <th
                        className="text-left py-4 px-6 text-white font-semibold text-base whitespace-nowrap"
                        style={{ width: "180px", minWidth: "180px" }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-neutral-900">
                    {isInitialLoad ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
                          <LoadingSpinner />
                        </td>
                      </tr>
                    ) : error && tableData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-red-400">
                          {error}
                        </td>
                      </tr>
                    ) : tableData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-400">
                          No accounts available yet. Upload your first account!
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, index) => (
                        <tr
                          key={row.id}
                          className={`
                            border-b border-gray-800 last:border-b-0 
                            hover:bg-gray-800/30 transition-colors duration-150
                            ${index % 2 === 0 ? "bg-neutral-900/50" : "bg-neutral-900"}
                          `}
                        >
                          <td
                            className="py-4 px-6 whitespace-nowrap"
                            style={{ width: "60px", minWidth: "60px" }}
                          >
                            <span className="text-gray-400 font-normal text-xs">
                              {index + 1}.
                            </span>
                          </td>

                          <td
                            className="py-4 px-6 whitespace-nowrap text-sm !font-[400]"
                            style={{ width: "200px", minWidth: "200px" }}
                          >
                            <div className="flex items-center gap-3">
                              {getSellerImage(row.seller) ? (
                                <img
                                  src={getSellerImage(row.seller)}
                                  alt={row.seller.name}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-md"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error('Image load error for seller:', row.seller.id, getSellerImage(row.seller));
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-md">
                                  <span className="text-white text-xs">No Img</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-white font-medium truncate max-w-[120px]">
                                  {row.seller.name}
                                </span>
                                {row.seller.verified && (
                                  <img
                                    src={badge}
                                    alt="soctral badge"
                                    className=""
                                  />
                                )}
                              </div>
                            </div>
                          </td>

                          <td
                            className="py-4 px-6 whitespace-nowrap text-sm !font-[400]"
                            style={{ width: "250px", minWidth: "250px" }}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={row.item.image}
                                alt={row.item.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-md"
                                loading="lazy"
                              />
                              <span className="text-white font-medium truncate max-w-[160px]">
                                {row.item.name}
                              </span>
                            </div>
                          </td>

                          <td
                            className="py-4 px-6 whitespace-nowrap text-sm !font-[400]"
                            style={{ width: "120px", minWidth: "120px" }}
                          >
                            <div className="flex items-center gap-1 text-white">
                              <div className="flex items-center pb-[5px] font-semibold text-xs mt-1">
                                {row.followers}
                              </div>
                            </div>
                          </td>

                          <td
                            className="py-4 px-6 whitespace-nowrap text-sm !font-[400]"
                            style={{ width: "150px", minWidth: "150px" }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                {renderStars(row.rating)}
                              </div>
                            </div>
                          </td>

                          <td
                            className="py-4 px-6 whitespace-nowrap text-sm !font-[400]"
                            style={{ width: "180px", minWidth: "180px" }}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleInitiateTrade(row.seller, row)}
                                disabled={loadingRowId === row.id}
                                className={`py-[12px] px-[30px] font-medium bg-primary hover:bg-primary text-xs text-white rounded-full transition-all duration-200 flex-shrink-0 hover:shadow-lg transform hover:scale-105 ${loadingRowId === row.id ? 'opacity-70 cursor-wait' : ''}`}
                                aria-label="Initiate trade"
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
                              <button
                                onClick={() => handleViewAccountMetrics(row)}
                                className="py-[12px] px-[30px] font-medium bg-[#2c2a2f] rounded-full text-xs transition-all duration-200 flex-shrink-0 hover:shadow-lg transform hover:scale-105"
                                aria-label="View account metrics"
                              >
                                View Account Metrics
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Initiate Trade confirmation dialog (Pick of the Week / home) */}
      {initiateConfirmPayload && (() => {
        const { seller, accountData } = initiateConfirmPayload;
        const name = seller?.name || seller?.displayName || 'this seller';
        const platform = accountData?.platform || accountData?.item?.name || 'Unknown';
        const username = accountData?.filters?.find(f => f.key === 'username')?.value ||
          accountData?.accountUsername || accountData?.username || accountData?.handle || 'N/A';
        const price = accountData?.price || seller?.price;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setInitiateConfirmPayload(null)}>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-semibold text-lg mb-2">Initiate trade?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Are you sure you want to initiate a trade with <span className="text-white font-medium">{name}</span>?
              </p>
              <div className="bg-black/30 rounded-lg p-3 mb-5 text-sm">
                <p className="text-gray-400"><span className="text-gray-500">Platform:</span> <span className="text-white capitalize">{platform}</span></p>
                <p className="text-gray-400 mt-1"><span className="text-gray-500">Username:</span> <span className="text-white">{username}</span></p>
                {price != null && price !== '' && <p className="text-gray-400 mt-1"><span className="text-gray-500">Price:</span> <span className="text-green-400">${price}</span></p>}
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setInitiateConfirmPayload(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors">Cancel</button>
                <button type="button" onClick={handleConfirmInitiateTrade} className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity">Confirm</button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default Tables;