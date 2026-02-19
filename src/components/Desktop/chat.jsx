import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Send, MoreVertical, ArrowLeft, X, Check, CheckCheck, Paperclip, Download, FileText, Image as ImageIcon, Flag, Trash2, Ban, MessageSquare, AlertCircle, CheckCircle, Lock, Unlock, Clock, Copy, Eye, EyeOff } from 'lucide-react';
import ug1 from "../../assets/ug1.png";
import ug2 from "../../assets/ug2.png";
import ug3 from "../../assets/ug3.png";
import ug4 from "../../assets/ug4.jpg";
import chatService from '../../services/chatService';
import { useUser } from '../../context/userContext';
import apiService from '../../services/api.js';
import authService from '../../services/authService.js';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import TradeStateManager from '../../services/tradeStateManager';
import warning from "../../assets/triangle.svg";
import btc from "../../assets/btc.svg";
import usdt from "../../assets/usdt.svg";
import eth from "../../assets/eth.svg";
import solana from "../../assets/sol.svg";
import bnb from "../../assets/bnb.svg";
import tron from "../../assets/trx.svg";
import success from "../../assets/suc.png";
import arrow1 from "../../assets/marrow.png"
import successcard from "../../assets/fram.svg"


// Add this function in chat.jsx after the imports
const migrateChannelMetadata = async (channel, defaultChatType = 'buy') => {
  try {
    // Check if channel already has metadata in custom data
    if (channel.data?.metadata && channel.data.metadata.chatType) {
      return;
    }

    // Create metadata from defaults
    const metadata = {
      chatType: defaultChatType,
      trade_price: 'N/A',
      accountId: undefined,
      migrated: true,
      timestamp: Date.now()
    };

    // Update the channel
    await channel.update({
      metadata: metadata
    });

  } catch (error) {
    console.error('❌ Failed to migrate channel:', channel.id, error);
  }
};

const extractChatTypeFromChannelId = (channelId) => {
  if (!channelId) return 'buy'; // default

  const parts = channelId.split('_');

  // If channel has 3 parts, the last one is chatType
  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'buy' || lastPart === 'sell') {
      return lastPart;
    }
  }

  // Legacy channels without chatType in ID, default to 'buy'
  return 'buy';
};




const Chat = ({ section = 'aside', selectedUser = null, onSelectUser, onBackToList, showChat, walletData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Buy');
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [messageOptionsMenu, setMessageOptionsMenu] = useState(null);


  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState(null);
  const [channelError, setChannelError] = useState(null); // Track channel loading errors
  const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false);
  const [showReleaseFundsModal, setShowReleaseFundsModal] = useState(false);
  const [tradeData, setTradeData] = useState(null);
  const [agreeVerified, setAgreeVerified] = useState(false);
  const [agreeLocked, setAgreeLocked] = useState(false);
  const [agreeFullAccess, setAgreeFullAccess] = useState(false);
  const [isProcessingTrade, setIsProcessingTrade] = useState(false);
  const [showTradeInitModal, setShowTradeInitModal] = useState(false);
  const [tradeInitData, setTradeInitData] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [transactionPin, setTransactionPin] = useState('');
  const [showPinDigits, setShowPinDigits] = useState(false);
  const [showAcceptanceNotification, setShowAcceptanceNotification] = useState(false);
  const [acceptanceData, setAcceptanceData] = useState(null);
  const [showAccountReviewModal, setShowAccountReviewModal] = useState(false);
  const [accountReviewData, setAccountReviewData] = useState(null);
  const [showAccountInfoModal, setShowAccountInfoModal] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);

  // 🔥 Credential Modal States (shown to buyer after clicking Proceed)
  // Loaded per-channel when the channel loads — NOT eagerly from a global key
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [credentialData, setCredentialData] = useState(null);

  // 🔥 NEW: Transaction Banner States
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [transactionTimer, setTransactionTimer] = useState(null);
  const [showCancelTradeModal, setShowCancelTradeModal] = useState(false);
  const [showAppealMenu, setShowAppealMenu] = useState(false);
  const [copiedChannelId, setCopiedChannelId] = useState(false);
  const [isReleasingFunds, setIsReleasingFunds] = useState(false);
  
  // 🔥 NEW: Full-screen transaction success modal
  const [showTransactionSuccessModal, setShowTransactionSuccessModal] = useState(false);
  const [transactionSuccessData, setTransactionSuccessData] = useState(null);

  const [channelMetadata, setChannelMetadata] = useState({
    platform: 'Unknown',
    accountUsername: 'N/A'
  });
  // 🔥 NEW: Sell Flow States
  const [showSellerTradePrompt, setShowSellerTradePrompt] = useState(false);
  const [showSellerInitiateModal, setShowSellerInitiateModal] = useState(false);
  const [showBuyerInterestNotification, setShowBuyerInterestNotification] = useState(false);
  const [sellerTradeTimer, setSellerTradeTimer] = useState(900); // 15 minutes = 900 seconds
  const [isTradeTimerActive, setIsTradeTimerActive] = useState(false); // 🔥 NEW: Track if trade timer is active (after buyer initiates)
  const [sellerTradeData, setSellerTradeData] = useState({
    accountEmail: '',
    emailPassword: '',
    accountPassword: '',
    paymentMethod: 'BTC',
    paymentNetwork: '',
    offerPrice: ''
  });

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentChannelRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // 🔥 FIX: Throttle fetchChannels to prevent frequent re-renders during typing
  const fetchChannelsThrottleRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const messagesContainerRef = useRef(null); // 🔥 FIX: Track scroll container for position preservation

  const { user: userData, isAuthenticated } = useUser();

  const stableSetSellerTradeData = useCallback((updater) => {
    setSellerTradeData(updater);
  }, []);

  // 🔥 FIX: Memoized handlers to prevent re-creation on every render
  const handleSellerModalClose = useCallback(() => {
    setShowSellerInitiateModal(false);
    setShowSellerTradePrompt(true);
  }, []);


  // Debounce search query
  // 🔥 FIXED: Removed searchQuery -> debouncedSearchQuery sync
  // Now using fully uncontrolled input that updates debouncedSearchQuery directly with debounce

  // 🔥 REMOVED: Automatic tab switching based on chatType
  // Tab now only changes when user explicitly clicks Buy/Sell tab buttons
  // This ensures clicking a chat from Sell tab keeps user in Sell tab
  // Previous logic caused issues where chatType didn't reflect the current tab context

  const profileImages = [ug1, ug2, ug3, ug4];

  //   useEffect(() => {
  //   console.log('🔍 MODAL STATE:', {
  //     showRequestModal,
  //     hasPendingRequest: !!pendingRequest,
  //     pendingRequestDetails: pendingRequest
  //   });
  // }, [showRequestModal, pendingRequest]);

  // useEffect(() => {
  //   console.log('🔔 MODAL STATE CHANGED:', {
  //     showRequestModal,
  //     hasPendingRequest: !!pendingRequest,
  //     pendingRequestUser: pendingRequest?.user?.name,
  //     pendingRequestPrice: pendingRequest?.user?.price
  //   });
  // }, [showRequestModal, pendingRequest]);




  const dangerIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L1 14h14L8 1z" stroke="#f59e0b" strokeWidth="2" fill="none" />
      <path d="M8 6v3M8 11h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const getUserImage = (user) => {
    // 🔥 ENHANCED: Check multiple image property variations
    // Stream Chat and channel data may have different property names
    const imageUrl =
      user?.bitmojiUrl ||
      user?.avatar ||
      user?.avatarUrl ||
      user?.profileImage ||
      user?.image ||
      user?.profile_image ||
      user?.picture ||
      // Check for nested user object (some channel data structures)
      user?.user?.bitmojiUrl ||
      user?.user?.avatar ||
      user?.user?.avatarUrl ||
      user?.user?.image;

    // Return the found URL or fallback
    return imageUrl || ug1;
  };

  const getSocialIcon = (platform) => {
    const platformLower = (platform || '').toLowerCase();
    const iconMap = {
      'instagram': '📷',
      'twitter': '🐦',
      'x': '🐦',
      'facebook': '👥',
      'tiktok': '🎵',
      'youtube': '📺',
      'rumble': '🎬',
      'snapchat': '👻',
      'linkedin': '💼',
      'pinterest': '📌',
      'reddit': '🔴',
      'discord': '💬',
      'telegram': '✈️',
      'whatsapp': '💬'
    };
    return iconMap[platformLower] || '📱';
  };

  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);


  const fetchChannels = async () => {
    try {
      const userChannels = await chatService.getUserChannels();

      // 🔥 CRITICAL: Triple-check hidden channels are filtered
      const currentUserId = userData?._id || userData?.id;

      const visibleChannels = userChannels.filter(channel => {
        const channelId = channel.id || (channel.cid ? channel.cid.split(':')[1] : null);
        const membership = channel.state?.membership;
        const members = channel.state?.members || {};

        // Check if hidden for current user
        const isHidden = membership?.hidden === true;

        // Check if user is still a member
        const isMember = members[currentUserId] !== undefined;

        // Additional check: verify channel state is valid
        const hasValidState = channel.state &&
          typeof channel.state === 'object' &&
          channel.state.messages !== undefined;

        // 🔥 NEW: Check if this is a recently deleted channel (within 5 seconds)
        const recentlyUpdated = membership?.updated_at &&
          (Date.now() - new Date(membership.updated_at).getTime()) < 5000;

        const hasNoMessages = (channel.state?.messages || []).length === 0;
        const looksDeleted = hasNoMessages && recentlyUpdated;

        const shouldInclude = !isHidden && !looksDeleted && isMember && hasValidState;

        if (!shouldInclude) {
          console.log(`🚫 Excluding channel ${channelId}:`, {
            isHidden,
            looksDeleted,
            hasNoMessages,
            recentlyUpdated,
            isMember,
            hasValidState,
            membershipUpdated: membership?.updated_at
          });
        }

        return shouldInclude;
      });

      console.log('✅ Fetched channels:', visibleChannels.length, '(filtered from', userChannels.length, 'total)');
      console.log('📋 Visible channel IDs:', visibleChannels.map(c => c.id || c.cid));

      // 🔥 NEW: Migrate old channels to have metadata
      for (const channel of visibleChannels) {
        await migrateChannelMetadata(channel);
      }

      // 🔥 NEW: Annotate each channel with _tradeCompleted flag
      // This lets the sidebar distinguish active vs completed trade channels
      for (const channel of visibleChannels) {
        const msgs = channel.state.messages || [];
        const lastFundsReleased = [...msgs].reverse().find(msg =>
          msg.funds_released_data || msg.funds_released === true
        );
        const lastSellerReady = [...msgs].reverse().find(msg =>
          msg.seller_ready === true
        );
        const lastTradeInit = [...msgs].reverse().find(msg =>
          msg.trade_init_data
        );

        let tradeCompleted = false;
        if (lastFundsReleased) {
          const releasedTime = new Date(lastFundsReleased.created_at).getTime();
          const lastInitTime = Math.max(
            lastSellerReady ? new Date(lastSellerReady.created_at).getTime() : 0,
            lastTradeInit ? new Date(lastTradeInit.created_at).getTime() : 0
          );
          tradeCompleted = releasedTime > lastInitTime;
        }
        channel._tradeCompleted = tradeCompleted;
      }

      // 🔥 NEW: Sort so active-trade channels appear BEFORE completed-trade channels
      // Within each group, sort by last_message_at (most recent first)
      visibleChannels.sort((a, b) => {
        // Active trades first
        if (a._tradeCompleted !== b._tradeCompleted) {
          return a._tradeCompleted ? 1 : -1;
        }
        // Then by most recent message
        const aTime = new Date(a.state.last_message_at || a.data?.last_message_at || 0).getTime();
        const bTime = new Date(b.state.last_message_at || b.data?.last_message_at || 0).getTime();
        return bTime - aTime;
      });

      setChannels(visibleChannels);
    } catch (error) {
      console.error('❌ Error fetching channels:', error);
    }
  };

  // 🔥 FIX: Throttled version of fetchChannels to prevent focus loss during typing
  // Only allows one fetch per 2 seconds to reduce re-renders
  const throttledFetchChannels = () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    // If we fetched recently, schedule a delayed fetch instead
    if (timeSinceLastFetch < 2000) {
      if (fetchChannelsThrottleRef.current) {
        clearTimeout(fetchChannelsThrottleRef.current);
      }
      fetchChannelsThrottleRef.current = setTimeout(() => {
        lastFetchTimeRef.current = Date.now();
        fetchChannels();
      }, 2000 - timeSinceLastFetch);
      return;
    }

    // Otherwise fetch immediately
    lastFetchTimeRef.current = now;
    fetchChannels();
  };

  useEffect(() => {
    const initChat = async () => {
      if (!isAuthenticated || !userData) {
        return;
      }

      try {
        setIsLoading(true);
        const userId = userData._id || userData.id;
        const userName = userData.displayName || userData.name || userData.email;
        const userImage = getUserImage(userData);

        await chatService.initializeChat(userId, userName, userImage);
        setIsInitialized(true);

        await fetchChannels();

        // 🔥 NEW: Check for active transactions on chat initialization
        // If buyer has an active transaction, show the release funds modal
        console.log('🔍 Checking for active transactions on chat initialization...');
        try {
          let activeTxn = null;
          
          // First try /transaction/current
          const transactionResult = await transactionService.getCurrentTransaction();
          
          if (transactionResult?.transaction) {
            activeTxn = transactionResult.transaction;
            console.log('💰 Found active transaction via /current:', activeTxn._id || activeTxn.id);
          } else {
            console.log('⚠️ /transaction/current returned null, trying /my-transactions...');
            
            // Fallback: Try to get transactions from my-transactions endpoint
            try {
              const myTransactionsResult = await transactionService.getUserTransactions({ status: 'pending' });
              
              if (myTransactionsResult?.transactions && myTransactionsResult.transactions.length > 0) {
                // Find the first pending transaction where user is the buyer
                const pendingAsBuyer = myTransactionsResult.transactions.find(txn => {
                  const txnBuyerId = txn.buyer?.userId || txn.buyer?._id || txn.buyerId;
                  const isPending = ['pending', 'active', 'escrowed'].includes(txn.status?.toLowerCase());
                  return (txnBuyerId === userId || String(txnBuyerId) === String(userId)) && isPending;
                });
                
                if (pendingAsBuyer) {
                  activeTxn = pendingAsBuyer;
                  console.log('💰 Found active transaction via /my-transactions:', activeTxn._id || activeTxn.id);
                }
              }
            } catch (fallbackError) {
              console.warn('⚠️ Fallback my-transactions also failed:', fallbackError.message);
            }
          }
          
          if (activeTxn) {
            const currentUserId = userId;
            const buyerId = activeTxn.buyer?.userId || activeTxn.buyer?._id || activeTxn.buyerId;
            const sellerId = activeTxn.seller?.userId || activeTxn.seller?._id || activeTxn.sellerId;
            
            console.log('💰 Active transaction found on init:', {
              transactionId: activeTxn._id || activeTxn.id,
              status: activeTxn.status,
              amount: activeTxn.amount,
              currency: activeTxn.currency,
              buyerId,
              sellerId,
              currentUserId,
              isBuyer: buyerId === currentUserId || String(buyerId) === String(currentUserId)
            });
            
            // If current user is the buyer and transaction is pending/active, show TradeInitModal
            const isBuyer = buyerId === currentUserId || String(buyerId) === String(currentUserId);
            const isPendingOrActive = ['pending', 'active', 'escrowed'].includes(activeTxn.status?.toLowerCase());
            
            if (isBuyer && isPendingOrActive) {
              console.log('🔔 BUYER: Has active transaction - showing release funds modal');
              
              // Prepare trade init data for TradeInitModal
              const tradeInitDataForBuyer = {
                transactionId: activeTxn._id || activeTxn.id,
                sellerId: sellerId,
                buyerId: buyerId,
                accountPrice: parseFloat(activeTxn.amountUSD || activeTxn.amount || 0),
                paymentMethod: (activeTxn.currency || 'BTC').toUpperCase(),
                paymentNetwork: activeTxn.network || 'bitcoin',
                initiatedAt: activeTxn.createdAt,
                sellOrderId: activeTxn.sellOrderId,
                accountId: activeTxn.socialAccountId,
                socialAccount: activeTxn.platform || 'Unknown',
                accountUsername: activeTxn.accountUsername || 'N/A',
                seller: {
                  id: sellerId,
                  name: activeTxn.seller?.displayName || activeTxn.seller?.name || 'Seller',
                  image: activeTxn.seller?.avatar || activeTxn.seller?.bitmojiUrl || ug1,
                  ratings: '⭐ 4.5 (New)'
                },
                // Flag to indicate this is from active transaction check
                isFromActiveCheck: true
              };
              
              // Calculate transaction fee (2.5% of account price)
              const transactionFee = tradeInitDataForBuyer.accountPrice * 0.025;
              tradeInitDataForBuyer.transactionFee = transactionFee;
              tradeInitDataForBuyer.totalAmount = tradeInitDataForBuyer.accountPrice + transactionFee;
              
              console.log('✅ BUYER: Opening TradeInitModal for active transaction:', tradeInitDataForBuyer);
              
              // Set the trade init data and show the TradeInitModal
              setTradeInitData(tradeInitDataForBuyer);
              setActiveTransaction(activeTxn);
              setShowTradeInitModal(true);
              
              console.log('✅ TradeInitModal opened for buyer to release funds on init');
            }
          } else {
            console.log('✅ No active transaction found on init');
          }
        } catch (txnError) {
          // Silent fail - don't block chat initialization
          console.warn('⚠️ Could not check for active transactions:', txnError.message);
        }

        const client = chatService.client;
        if (client) {
          const handleGlobalMessage = async (event) => {
            const message = event.message;
            const currentUserId = userId;
            
            console.log('🌐 Global message received:', {
              text: message.text,
              type: message.type,
              trade_init_data: message.trade_init_data,
              cancel_request_data: message.cancel_request_data,
              hasCustomData: !!message.trade_init_data,
              hasCancelRequest: !!message.cancel_request_data,
              messageKeys: Object.keys(message),
              currentUserId: currentUserId
            });

            // 🔥 Check if this is a cancel request message (using JSON string like trade_init_data)
            if (message.cancel_request_data) {
              try {
                const cancelData = JSON.parse(message.cancel_request_data);
                
                console.log('📤 Cancel request received:', {
                  active_transaction_id: cancelData.active_transaction_id,
                  buyer_id: cancelData.buyer_id,
                  requester_id: cancelData.requester_id,
                  currentUserId: currentUserId
                });
                
                // Check if current user is the buyer who needs to complete the transaction
                if (cancelData.buyer_id === currentUserId && cancelData.requester_id !== currentUserId) {
                  console.log('🔔 BUYER: Received request to complete active transaction:', cancelData.active_transaction_id);
                  
                  // 🔥 FIXED: Use getTransactionById with the active_transaction_id instead of getCurrentTransaction
                  try {
                    console.log('📡 Fetching active transaction details:', cancelData.active_transaction_id);
                    const transactionResult = await transactionService.getTransactionById(cancelData.active_transaction_id);
                    
                    // Handle both response formats
                    const activeTxn = transactionResult?.transaction || transactionResult;
                    
                    if (activeTxn && (activeTxn._id || activeTxn.id)) {
                      const buyerId = activeTxn.buyer?.userId || activeTxn.buyer?._id || activeTxn.buyerId;
                      const sellerId = activeTxn.seller?.userId || activeTxn.seller?._id || activeTxn.sellerId;
                      
                      console.log('💰 Active transaction fetched:', {
                        transactionId: activeTxn._id || activeTxn.id,
                        status: activeTxn.status,
                        amount: activeTxn.amount,
                        currency: activeTxn.currency
                      });
                      
                      // Get seller image
                      const sellerImage = activeTxn.seller?.avatar || activeTxn.seller?.bitmojiUrl || 
                                         selectedUser?.image || selectedUser?.bitmojiUrl || selectedUser?.avatar || '';
                      
                      // Prepare trade init data for TradeInitModal
                      const tradeInitDataForBuyer = {
                        transactionId: activeTxn._id || activeTxn.id || cancelData.active_transaction_id,
                        sellerId: sellerId,
                        buyerId: buyerId,
                        accountPrice: parseFloat(activeTxn.amountUSD || activeTxn.amount || 0),
                        paymentMethod: (activeTxn.currency || 'BTC').toUpperCase(),
                        paymentNetwork: activeTxn.network || 'bitcoin',
                        initiatedAt: activeTxn.createdAt,
                        sellOrderId: activeTxn.sellOrderId,
                        accountId: activeTxn.socialAccountId,
                        socialAccount: activeTxn.platform || 'Unknown',
                        accountUsername: activeTxn.accountUsername || 'N/A',
                        seller: {
                          id: sellerId,
                          name: activeTxn.seller?.displayName || activeTxn.seller?.name || selectedUser?.name || 'Seller',
                          image: sellerImage,
                          ratings: '⭐ 4.5 (New)'
                        },
                        // Flag to indicate this is from a cancel request
                        isFromCancelRequest: true
                      };
                      
                      // Calculate transaction fee
                      const transactionFee = tradeInitDataForBuyer.accountPrice * 0.025;
                      tradeInitDataForBuyer.transactionFee = transactionFee;
                      tradeInitDataForBuyer.totalAmount = tradeInitDataForBuyer.accountPrice + transactionFee;
                      
                      console.log('✅ BUYER: Opening TradeInitModal for active transaction:', tradeInitDataForBuyer);
                      
                      // Set the trade init data and show the TradeInitModal (release fund modal)
                      setTradeInitData(tradeInitDataForBuyer);
                      setActiveTransaction(activeTxn);
                      setShowTradeInitModal(true);
                      
                      // Don't show cancel modal - show release fund modal instead
                      setShowCancelTradeModal(false);
                      
                      console.log('✅ TradeInitModal opened for buyer to release funds');
                    } else {
                      console.warn('⚠️ Could not fetch active transaction despite having ID');
                      // Fallback: show informational message
                      setActiveTransaction({
                        id: cancelData.active_transaction_id,
                        _id: cancelData.active_transaction_id,
                        status: 'pending',
                        isCancelRequest: true
                      });
                      setShowCancelTradeModal(true);
                    }
                  } catch (txnError) {
                    console.error('❌ Failed to fetch active transaction:', txnError);
                    // Fallback to cancel modal
                    setActiveTransaction({
                      id: cancelData.active_transaction_id,
                      _id: cancelData.active_transaction_id,
                      status: 'pending',
                      isCancelRequest: true
                    });
                    setShowCancelTradeModal(true);
                  }
                }
              } catch (parseError) {
                console.error('❌ Failed to parse cancel_request_data:', parseError);
              }
            }

            // 🔥 Check if message has trade_init_data in custom field
            if (message.trade_init_data) {
              try {
                const tradeData = JSON.parse(message.trade_init_data);
                
                console.log('📦 Parsed trade init data:', tradeData);
                console.log('🔍 Checking if for current user:', {
                  buyer_id: tradeData.buyer_id,
                  currentUserId: currentUserId,
                  isForMe: tradeData.buyer_id === currentUserId,
                  seller_id: tradeData.seller_id,
                  isFromOther: tradeData.seller_id !== currentUserId
                });
                
                // Check if this is a trade initiation message for the current user (buyer)
                if (tradeData.trade_initiated === true && 
                    tradeData.buyer_id === currentUserId &&
                    tradeData.seller_id !== currentUserId) {
                  
                  console.log('🔔 BUYER: Received trade initiation (GLOBAL LISTENER)!', tradeData);
                  
                  // Get the channel to fetch additional data
                  const channelId = event.cid?.split(':')[1];
                  if (channelId) {
                    console.log('📡 Fetching channel:', channelId);
                    
                    // Fetch the full channel data
                    client.channel('messaging', channelId).watch().then(channel => {
                      console.log('📡 Fetched channel for trade init:', channel);
                      console.log('📋 Channel metadata:', channel.data?.metadata);
                      
                      // Get seller info from channel members
                      const sellerMember = channel.state?.members?.[tradeData.seller_id];
                      const sellerUser = sellerMember?.user || message.user;
                      
                      // 🔥 FIXED: Store trade data with credentials for later use
                      const tradeInitDataForBuyer = {
                        transactionId: tradeData.transaction_id,
                        sellerId: tradeData.seller_id,
                        buyerId: tradeData.buyer_id,
                        accountPrice: tradeData.offer_amount,
                        paymentMethod: tradeData.payment_method?.toUpperCase() || 'BTC',
                        paymentNetwork: tradeData.payment_network,
                        initiatedAt: tradeData.initiated_at,
                        // Get data from channel metadata or trade data
                        sellOrderId: channel.data?.metadata?.sellOrderId || channel.data?.metadata?.accountId,
                        accountId: channel.data?.metadata?.accountId,
                        socialAccount: tradeData.platform || channel.data?.metadata?.platform || 'Unknown',
                        accountUsername: tradeData.account_username || channel.data?.metadata?.accountUsername || 'N/A',
                        // 🔥 NEW: Include credentials from trade data
                        accountOriginalEmail: tradeData.account_original_email || '',
                        originalEmailPassword: tradeData.original_email_password || '',
                        socialAccountPassword: tradeData.social_account_password || '',
                        seller: {
                          id: tradeData.seller_id,
                          name: tradeData.seller_name || sellerUser?.name || sellerUser?.displayName || 'Seller',
                          image: sellerUser?.image || sellerUser?.avatar || sellerUser?.bitmojiUrl || ug1,
                          social: getSocialIcon(tradeData.platform || channel.data?.metadata?.platform || 'Unknown'),
                          ratings: '⭐ 4.5 (New)',
                          price: tradeData.offer_amount,
                          currency: tradeData.payment_method?.toUpperCase() || 'BTC',
                          platform: tradeData.platform || channel.data?.metadata?.platform || 'Unknown',
                          accountUsername: tradeData.account_username || channel.data?.metadata?.accountUsername || 'N/A',
                          accountId: channel.data?.metadata?.accountId
                        }
                      };
                      
                      // Calculate transaction fee (2.5% of account price)
                      const transactionFee = tradeInitDataForBuyer.accountPrice * 0.025;
                      tradeInitDataForBuyer.transactionFee = transactionFee;
                      tradeInitDataForBuyer.totalAmount = tradeInitDataForBuyer.accountPrice + transactionFee;
                      
                      console.log('✅ BUYER: Showing Accept/Decline with data:', tradeInitDataForBuyer);
                      
                      // 🔥 FIXED: Show Accept/Decline FIRST instead of directly opening TradeInitModal
                      // Store the trade data for when buyer accepts
                      setTradeInitData(tradeInitDataForBuyer);
                      
                      // Set pending request to show Accept/Decline buttons
                      setPendingRequest({
                        user: tradeInitDataForBuyer.seller,
                        channel: channel,
                        tradeData: tradeInitDataForBuyer, // Store full trade data
                        isNewAccount: false,
                        wasDeleted: false
                      });
                      setShowRequestModal(true);
                      
                      console.log('✅ BUYER: Accept/Decline UI shown!');
                    }).catch(err => {
                      console.error('❌ Failed to fetch channel for trade init:', err);
                    });
                  } else {
                    console.error('❌ No channel ID found in event:', event);
                  }
                } else {
                  console.log('ℹ️ Trade init message not for current user or already processed');
                }
              } catch (parseError) {
                console.error('❌ Failed to parse trade_init_data:', parseError);
              }
            }

            // 🔥 NEW: Handle buyer_initiated message to start seller's timer
            if (message.buyer_initiated === true) {
              const sellerId = message.seller_id;
              console.log('📦 Received buyer_initiated message:', {
                sellerId,
                currentUserId,
                isForMe: sellerId === currentUserId,
                transactionId: message.transaction_id
              });
              
              // If current user is the seller, activate their timer
              if (sellerId === currentUserId) {
                console.log('🔥 SELLER: Buyer has initiated trade! Starting timer...');
                setSellerTradeTimer(message.timer_duration || 300);
                setIsTradeTimerActive(true);
                
                // Persist timer state
                const transactionId = message.transaction_id;
                if (transactionId) {
                  TradeStateManager.setTimerState(transactionId, true, message.timer_duration || 300);
                }
                console.log('✅ SELLER: Timer activated successfully');
              }
            }

            // 🔥 NEW: Handle funds_released_data message to show seller's "Funds Received" modal
            if (message.funds_released_data) {
              try {
                const releaseData = JSON.parse(message.funds_released_data);
                console.log('📦 Funds released data received:', releaseData);

                // Only show to the seller (not the buyer who sent it)
                if (releaseData.seller_id === currentUserId && releaseData.buyer_id !== currentUserId) {
                  console.log('🔔 SELLER: Buyer has released funds! Showing success modal...');

                  // Deactivate trade timer for seller
                  setIsTradeTimerActive(false);
                  setSellerTradeTimer(300);

                  // Mark transaction as completed
                  if (releaseData.transaction_id) {
                    TradeStateManager.markCompleted(releaseData.transaction_id);
                    // 🔥 Credentials persist after completion — buyer purchased the account
                  }

                  // Clear trade states
                  setShowSellerTradePrompt(false);
                  setPendingTransaction(null);
                  setPendingRequest(null);
                  setActiveTransaction(null);
                  setShowRequestModal(false);

                  // Show seller's Funds Received modal
                  setTransactionSuccessData({
                    role: 'seller',
                    amount: releaseData.amount || '0.00',
                    recipientName: releaseData.buyer_name || 'Buyer',
                    transactionId: releaseData.transaction_id,
                    currency: releaseData.currency || 'BTC'
                  });
                  setShowTransactionSuccessModal(true);

                  console.log('✅ SELLER: Funds Received modal shown!');
                }
              } catch (parseError) {
                console.error('❌ Failed to parse funds_released_data:', parseError);
              }
            }

            // 🔥 NEW: Handle trade_cancelled message to clear buyer's state
            if (message.trade_cancelled) {
              const senderId = message.user?.id || message.user_id;
              if (senderId !== currentUserId) {
                console.log('🚫 Trade cancelled by other party, clearing trade state...');
                setPendingTransaction(null);
                setActiveTransaction(null);
                setPendingRequest(null);
                setShowRequestModal(false);
                setShowTradeInitModal(false);
                setShowReleaseFundsModal(false);
                setShowSellerTradePrompt(false);
                setIsTradeTimerActive(false);
                setSellerTradeTimer(300);
                TradeStateManager.clear();
                console.log('✅ Trade state cleared after cancellation by other party');
              }
            }
          };

          // Listen to all message.new events globally
          client.on('message.new', handleGlobalMessage);
          console.log('✅ Global trade initiation listener set up');

          // Cleanup function
          return () => {
            client.off('message.new', handleGlobalMessage);
            console.log('🧹 Global trade initiation listener cleaned up');
          };
        }

      } catch (error) {
        console.error('❌ Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      if (isInitialized) {
        chatService.disconnect();
      }
    };
  }, [isAuthenticated, userData]);


  // Wallet data effect (silent)
  useEffect(() => {
    // Debug wallet updates silently if needed
  }, [walletData]);

  // 🔥 NEW: Restore trade state from TradeStateManager on mount
  useEffect(() => {
    const restoreTradeState = async () => {
      try {
        const restoredState = await TradeStateManager.restore();
        if (!restoredState) return;

        const { backendTransaction, timerState, transactionId } = restoredState;

        // Skip completed/stale transactions
        if (TradeStateManager.isCompleted(transactionId)) return;

        // 🔥 FIX: Verify the transaction is still active before restoring
        try {
          const activeCheck = await checkActiveTransactions();
          if (!activeCheck?.hasActiveTransaction) {
            console.log('🚫 TradeStateManager restore: No active transaction found from API, clearing stale state');
            TradeStateManager.clear();
            return;
          }
        } catch (verifyErr) {
          console.warn('⚠️ Could not verify transaction on restore, proceeding with caution:', verifyErr.message);
        }

        if (backendTransaction) {
          console.log('🔄 Restoring pending transaction from TradeStateManager:', transactionId);
          setPendingTransaction(backendTransaction);

          // 🔥 FIX: Also restore tradeData so handlePinSubmit can find the transactionId
          const restoredTradeData = restoredState.tradeData || {};
          setTradeData(prev => ({
            ...prev,
            ...restoredTradeData,
            transactionId: transactionId || backendTransaction._id || backendTransaction.id,
            accountPrice: backendTransaction.amount || restoredTradeData.accountPrice || 0,
            totalAmount: backendTransaction.amount || restoredTradeData.totalAmount || 0,
            paymentMethod: backendTransaction.currency || restoredTradeData.paymentMethod || 'BTC',
            sellOrderId: backendTransaction.sellOrderId || restoredTradeData.sellOrderId,
            sellerId: backendTransaction.sellerId || backendTransaction.seller?.userId || restoredTradeData.sellerId,
          }));
          console.log('🔄 Restored tradeData with transactionId:', transactionId);
        }

        // Restore timer state
        if (timerState && timerState.isActive && timerState.remainingTime > 0) {
          setSellerTradeTimer(timerState.remainingTime);
          setIsTradeTimerActive(true);
          console.log('🔄 Restored timer state:', timerState.remainingTime, 'seconds remaining');
        }
      } catch (error) {
        console.error('Failed to restore trade state:', error);
      }
    };

    restoreTradeState();
  }, []); // Run once on mount


  useEffect(() => {
    const handleInitiateTradeEvent = (event) => {
      const sellerData = event.detail;

      if (sellerData && onSelectUser) {
        onSelectUser(sellerData);
      }
    };

    const checkPendingChat = () => {
      try {
        const pendingChat = localStorage.getItem('selectedChatUser');
        if (pendingChat) {
          const sellerData = JSON.parse(pendingChat);

          if (onSelectUser) {
            onSelectUser(sellerData);
          }

          localStorage.removeItem('selectedChatUser');
        }
      } catch (error) {
        console.error('❌ Error processing pending chat:', error);
      }
    };

    window.addEventListener('initiateTrade', handleInitiateTradeEvent);
    checkPendingChat();

    return () => {
      window.removeEventListener('initiateTrade', handleInitiateTradeEvent);
    };
  }, [onSelectUser]);



  useEffect(() => {
    if (!selectedUser || !isInitialized) {
      return;
    }

    // Clear any previous error
    setChannelError(null);

    let mounted = true;
    let messageListener = null;
    let readListener = null;
    let updateListener = null;

    const loadChannel = async () => {
      try {
        setIsLoading(true);
        const otherUserId = selectedUser.id || selectedUser._id;
        const otherUserName = selectedUser.name || selectedUser.displayName;
        const currentUserId = userData?._id || userData?.id;

        if (otherUserId === currentUserId) {
          setIsLoading(false);
          return;
        }

        const chatType = selectedUser.chatType || 'buy';
        const tradePrice = selectedUser.price || selectedUser.maxPrice || 'N/A';
        const accountId = selectedUser.accountId || selectedUser.id;



        console.log('🔍 DEBUG selectedUser in chat.jsx:', {
          selectedUser,
          accountUsername: selectedUser.accountUsername,
          username: selectedUser.username,
          handle: selectedUser.handle,
          filters: selectedUser.filters,
          platform: selectedUser.platform
        });

        // 🔥 STEP 1: Initialize metadata from selectedUser (temporary until channel loads)
        let tempMetadata = {
          platform: selectedUser.platform || 'Unknown',
          accountUsername: selectedUser.filters?.find(f => f.key === 'username')?.value ||
            selectedUser.accountUsername ||
            selectedUser.username ||
            selectedUser.handle ||
            'N/A'
        };

        console.log('🔍 Loading channel with initial data:', {
          chatType,
          tradePrice,
          accountId,
          otherUserId,
          currentUserId,
          tempMetadata
        });

        // 🔥 CRITICAL: Detect if this is a NEW trade initiation vs opening existing chat
        // If selectedUser has _channel, they clicked from chat list (DON'T update initiator)
        // If selectedUser has NO _channel, they clicked "Initiate Trade" (DO update initiator)
        const isNewInitiation = !selectedUser._channel;
        console.log('🔍 Is new initiation:', isNewInitiation, 'hasChannel:', !!selectedUser._channel);

        // Create/get channel WITH the metadata
        const result = await chatService.createOrGetChannel(
          otherUserId,
          otherUserName,
          chatType,
          'messaging',
          {
            price: tradePrice,
            accountId: accountId,
            platform: tempMetadata.platform,           // ✅ Pass to channel
            accountUsername: tempMetadata.accountUsername, // ✅ Pass to channel
            isNewInitiation: isNewInitiation           // 🔥 NEW: Flag to control initiator update
          }
        );

        const channel = result.channel || result;
        const isNewTradeRequest = result.isNewTradeRequest === true;

        if (!mounted) return;

        const channelMessages = channel.state.messages || [];

        // 🔥 STEP 2: Extract PERSISTENT metadata from channel (THIS SURVIVES RELOAD)
        let persistedMetadata = {
          platform: 'Unknown',
          accountUsername: 'N/A'
        };


        // Try to get from channel.data.metadata first (most reliable)
        if (selectedUser?.platform && selectedUser.platform !== 'Unknown') {
          persistedMetadata.platform = selectedUser.platform;
          console.log('✅ Platform from selectedUser:', persistedMetadata.platform);
        }

        if (selectedUser?.accountUsername && selectedUser.accountUsername !== 'N/A') {
          persistedMetadata.accountUsername = selectedUser.accountUsername;
          console.log('✅ Username from selectedUser:', persistedMetadata.accountUsername);
        }
        if (channel.data?.metadata && typeof channel.data.metadata === 'object') {
          if (persistedMetadata.platform === 'Unknown' && channel.data.metadata.platform) {
            persistedMetadata.platform = channel.data.metadata.platform;
            console.log('✅ Platform from channel.data.metadata:', persistedMetadata.platform);
          }
          if (persistedMetadata.accountUsername === 'N/A' && channel.data.metadata.accountUsername) {
            persistedMetadata.accountUsername = channel.data.metadata.accountUsername;
            console.log('✅ Username from channel.data.metadata:', persistedMetadata.accountUsername);
          }
        }
        else {
          try {
            const channelName = channel.data?.name || '';
            const parts = channelName.split('|');
            if (parts.length > 1) {
              const parsed = JSON.parse(parts[1]);
              persistedMetadata.platform = parsed.platform || 'Unknown';
              persistedMetadata.accountUsername = parsed.accountUsername || parsed.username || 'N/A';
              console.log('✅ Metadata loaded from channel name (Strategy 2):', persistedMetadata);
            }
          } catch (e) {
            console.warn('⚠️ Could not parse channel metadata from name');
          }
        }

        if (persistedMetadata.platform === 'Unknown' || persistedMetadata.accountUsername === 'N/A') {
          try {
            const channelName = channel.data?.name || '';
            const parts = channelName.split('|');
            if (parts.length > 1) {
              const parsed = JSON.parse(parts[1]);
              if (persistedMetadata.platform === 'Unknown' && parsed.platform) {
                persistedMetadata.platform = parsed.platform;
                console.log('✅ Platform from channel name:', persistedMetadata.platform);
              }
              if (persistedMetadata.accountUsername === 'N/A' && (parsed.accountUsername || parsed.username)) {
                persistedMetadata.accountUsername = parsed.accountUsername || parsed.username;
                console.log('✅ Username from channel name:', persistedMetadata.accountUsername);
              }
            }
          } catch (e) {
            console.warn('⚠️ Could not parse channel metadata from name');
          }
        }

        // 🔥 PRIORITY 4: Check first message as last resort
        if (persistedMetadata.platform === 'Unknown' || persistedMetadata.accountUsername === 'N/A') {
          const firstMessage = channelMessages[0];
          if (firstMessage) {
            if (persistedMetadata.platform === 'Unknown' && firstMessage.platform) {
              persistedMetadata.platform = firstMessage.platform;
              console.log('✅ Platform from first message:', persistedMetadata.platform);
            }
            if (persistedMetadata.accountUsername === 'N/A' && firstMessage.accountUsername) {
              persistedMetadata.accountUsername = firstMessage.accountUsername;
              console.log('✅ Username from first message:', persistedMetadata.accountUsername);
            }
          }
        }



        // 🔥 STEP 3: Update component state with PERSISTENT metadata
        setChannelMetadata(persistedMetadata);
        console.log('📊 Final metadata set in component:', persistedMetadata);

        // 🔥 CRITICAL: ALWAYS update channel if we have better data from selectedUser
        if (selectedUser && (
          (selectedUser.platform && selectedUser.platform !== 'Unknown') ||
          (selectedUser.accountUsername && selectedUser.accountUsername !== 'N/A')
        )) {
          try {
            // Get existing metadata
            const existingMetadata = channel.data?.metadata || {};

            // Merge with priority to selectedUser data
            const improvedMetadata = {
              ...existingMetadata,
              platform: selectedUser.platform || persistedMetadata.platform,
              accountUsername: selectedUser.accountUsername || persistedMetadata.accountUsername,
              updated_at: Date.now()
            };

            console.log('🔄 Updating channel with selectedUser metadata:', improvedMetadata);

            // Update channel
            await channel.update({
              metadata: improvedMetadata
            });

            // Update local state immediately
            setChannelMetadata({
              platform: improvedMetadata.platform,
              accountUsername: improvedMetadata.accountUsername
            });

            console.log('✅ Channel metadata updated and persisted:', improvedMetadata);
          } catch (updateError) {
            console.warn('⚠️ Could not update channel metadata:', updateError);
          }
        }


        let channelCreatorId = null;
        let extractedMetadata = {};
        let actualTradePrice = tradePrice;

        if (channel.data?.metadata && typeof channel.data.metadata === 'object') {
          channelCreatorId = channel.data.metadata.initiator_id;
          extractedMetadata = channel.data.metadata;
          actualTradePrice = channel.data.metadata.trade_price ||
            channel.data.metadata.price ||
            tradePrice;
        }

        if (!channelCreatorId) {
          try {
            const channelName = channel.data?.name || '';
            const parts = channelName.split('|');
            if (parts.length > 1) {
              const parsed = JSON.parse(parts[1]);
              channelCreatorId = parsed.initiator_id;
              extractedMetadata = parsed;
              actualTradePrice = parsed.trade_price || parsed.price || tradePrice;
            }
          } catch (e) {
            console.warn('⚠️ Could not parse channel metadata from name');
          }
        }

        if (!channelCreatorId) {
          channelCreatorId = channel.data?.created_by_id || channel.data?.created_by?.id;
        }

        if (!channelCreatorId && chatType === 'buy') {
          const channelMembers = Object.values(channel.state?.members || {});
          const sortedMembers = channelMembers.sort((a, b) => {
            const aTime = new Date(a.created_at || 0).getTime();
            const bTime = new Date(b.created_at || 0).getTime();
            return aTime - bTime;
          });

          if (sortedMembers.length > 0) {
            channelCreatorId = sortedMembers[0].user_id;
          }
        }

        if (!actualTradePrice || actualTradePrice === 'N/A') {
          actualTradePrice = selectedUser?.price || selectedUser?.maxPrice || 'N/A';
        }

        const storedAccountId = channel.data?.metadata?.accountId || channel.data?.accountId;
        const finalPrice = actualTradePrice !== 'N/A' ? actualTradePrice : tradePrice;

        const isCreator = channelCreatorId ?
          (channelCreatorId === currentUserId || channelCreatorId === String(currentUserId)) :
          false;

        const isReceiver = channelCreatorId ?
          (channelCreatorId !== currentUserId && channelCreatorId !== String(currentUserId)) :
          false;

        console.log('🎭 User Role:', {
          isCreator,
          isReceiver,
          channelCreatorId,
          currentUserId,
          chatType,
          persistedMetadata
        });

        // Set channel and messages
        setCurrentChannel(channel);
        currentChannelRef.current = channel;

        // 🔥 NEW: Only show messages from the LATEST trade (after last funds_released)
        // This prevents old completed trade messages from polluting the chat view
        const latestTradeMsgCutoffIdx = channelMessages.map((msg, i) =>
          (msg.funds_released_data || msg.funds_released === true) ? i : -1
        ).filter(i => i !== -1).pop() ?? -1;

        const latestTradeMessages = latestTradeMsgCutoffIdx >= 0
          ? channelMessages.slice(latestTradeMsgCutoffIdx + 1)
          : channelMessages;

        console.log('📝 Message filtering: total=', channelMessages.length, ', showing latest trade=', latestTradeMessages.length, ', cutoff idx=', latestTradeMsgCutoffIdx);
        setMessages(latestTradeMessages);

        // 🔥 Load per-channel credential data from localStorage
        // 🔥 FIX: Only restore if the credentials belong to the CURRENT trade, not a previous one
        const chId = channel.id || channel.cid?.split(':')[1] || '';
        if (chId) {
          try {
            const savedCred = localStorage.getItem(`soctra_cred_${chId}`);
            if (savedCred) {
              // Check if a NEW trade has started after the last funds_released
              // If so, these credentials belong to the OLD trade and should be cleared
              const lastFundsReleasedMsg = [...channelMessages].reverse().find(msg =>
                msg.funds_released_data || msg.funds_released === true
              );
              const lastNewTradeMsg = [...channelMessages].reverse().find(msg =>
                msg.seller_ready === true || msg.trade_init_data
              );

              let isNewTradeAfterCompletion = false;
              if (lastFundsReleasedMsg && lastNewTradeMsg) {
                const releasedTime = new Date(lastFundsReleasedMsg.created_at).getTime();
                const newTradeTime = new Date(lastNewTradeMsg.created_at).getTime();
                isNewTradeAfterCompletion = newTradeTime > releasedTime;
              }

              if (isNewTradeAfterCompletion) {
                console.log('🧹 New trade started after completion — clearing old credentials from localStorage');
                localStorage.removeItem(`soctra_cred_${chId}`);
                setCredentialData(null);
                setShowCredentialModal(false);
              } else {
                setCredentialData(JSON.parse(savedCred));
                setShowCredentialModal(true);
                console.log('✅ Restored credential data for channel:', chId);
              }
            } else {
              // Clear stale credential UI from previous channel
              setCredentialData(null);
              setShowCredentialModal(false);
            }
          } catch { 
            setCredentialData(null);
            setShowCredentialModal(false);
          }
        }

        await chatService.markAsRead(channel);

        // Set up listeners
        messageListener = async (event) => {
          const newMessage = event.message;
          
          // 🔥 FIX: Deduplicate messages by ID to prevent duplicates
          setMessages((prev) => {
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Mark as read if from another user
          if (event.user?.id !== currentUserId) {
            chatService.markAsRead(channel);
          }
          
          console.log('💬 Channel message received:', {
            text: newMessage.text,
            trade_init_data: newMessage.trade_init_data,
            hasTradeData: !!newMessage.trade_init_data
          });
          
          // 🔥 SKIP: trade_init_data is handled by the GLOBAL message listener to prevent duplicates
          if (newMessage.trade_init_data) {
            console.log('💬 Channel: Skipping trade_init_data - handled by global listener');
          }
          
          // 🔥 SKIP: cancel_request_data is handled by the GLOBAL message listener to prevent duplicates
          if (newMessage.cancel_request_data) {
            console.log('💬 Channel: Skipping cancel_request_data - handled by global listener');
          }
          
          // 🔥 FIX: Decouple fetchChannels from listener to prevent selectedUser remount
          // Using setTimeout breaks the synchronous dependency chain that causes listener teardown
          setTimeout(() => throttledFetchChannels(), 0);
          setTimeout(scrollToBottom, 100);
        };

        channel.on('message.new', messageListener);

        readListener = (event) => {
          if (event.user?.id !== currentUserId) {
            setMessages((prev) => prev.map(msg => {
              if (msg.user?.id === currentUserId) {
                return {
                  ...msg,
                  read_by: {
                    ...(msg.read_by || {}),
                    [event.user.id]: {
                      last_read: new Date().toISOString(),
                      user: event.user
                    }
                  },
                  status: 'read'
                };
              }
              return msg;
            }));
          }
          throttledFetchChannels(); // 🔥 Use throttled version to prevent focus loss
        };

        channel.on('message.read', readListener);

        const updateListener = (event) => {
          setMessages((prev) => prev.map(msg => {
            if (msg.id === event.message.id) {
              return { ...msg, ...event.message };
            }
            return msg;
          }));
        };

        channel.on('message.updated', updateListener);

        setTimeout(scrollToBottom, 100);

        // 🔥 FIX: Scope trade state to CURRENT trade only
        // Find the last funds_released message — everything before it belongs to a completed trade
        const lastFundsReleasedIdx = channelMessages.map((msg, i) =>
          (msg.funds_released_data || msg.funds_released === true) ? i : -1
        ).filter(i => i !== -1).pop() ?? -1;

        const currentTradeMessages = lastFundsReleasedIdx >= 0
          ? channelMessages.slice(lastFundsReleasedIdx + 1)
          : channelMessages;

        console.log('🔍 Trade scoping:', {
          totalMessages: channelMessages.length,
          lastFundsReleasedIdx,
          currentTradeMessages: currentTradeMessages.length
        });

        // 🔥 FIX: Check for seller_ready message in CURRENT trade only
        const sellerReadyMessage = currentTradeMessages.find(msg =>
          msg.seller_ready === true
        );

        // 🔥 FIX: Check for trade_accepted message in CURRENT trade only
        const tradeAcceptedMessage = currentTradeMessages.find(msg =>
          msg.trade_accepted === true
        );

        // 🔥 FIX: Check for trade_init_data message in CURRENT trade only
        // Find the LAST trade_init_data message intended for the current user (buyer)
        const tradeInitDataMessage = [...currentTradeMessages].reverse().find(msg => {
          if (!msg.trade_init_data) return false;
          try {
            const data = JSON.parse(msg.trade_init_data);
            return data.trade_initiated === true && data.buyer_id === currentUserId;
          } catch { return false; }
        });

        // 🔥 FIX: Only consider trade completed if the LATEST funds_released is AFTER the latest trade initiation
        // This allows new trades to start on the same channel after a previous trade completes
        const lastFundsReleased = [...channelMessages].reverse().find(msg =>
          msg.funds_released_data || msg.funds_released === true
        );
        const lastSellerReady = [...channelMessages].reverse().find(msg =>
          msg.seller_ready === true
        );
        const lastTradeInit = [...channelMessages].reverse().find(msg =>
          msg.trade_init_data
        );

        let tradeCompleted = false;
        if (lastFundsReleased) {
          const releasedTime = new Date(lastFundsReleased.created_at).getTime();
          const lastInitTime = Math.max(
            lastSellerReady ? new Date(lastSellerReady.created_at).getTime() : 0,
            lastTradeInit ? new Date(lastTradeInit.created_at).getTime() : 0
          );
          // Trade is only "completed" if no new trade was started after the last completion
          tradeCompleted = releasedTime > lastInitTime;
        }

        // 🔥 FIX: If this is a new trade request (different accountId on the same channel),
        // override tradeCompleted so the seller can initiate a fresh trade
        if (isNewTradeRequest && tradeCompleted) {
          console.log('🆕 New trade request on same channel — overriding tradeCompleted to false');
          tradeCompleted = false;
        }

        // Only show unprocessed trade init if trade is NOT completed
        const hasUnprocessedTradeInit = !!tradeInitDataMessage && !tradeAcceptedMessage && !tradeCompleted;

        // 🔥 Use message data for trade status
        const tradeInitiated = channel.data?.trade_initiated === true;
        const sellerReady = !!sellerReadyMessage;
        const tradeAccepted = !!tradeAcceptedMessage;
        const acceptedBy = tradeAcceptedMessage?.accepted_by;

        console.log('📊 Trade Status:', {
          tradeInitiated,
          sellerReady,
          tradeAccepted,
          acceptedBy,
          tradeCompleted,
          currentUserId,
          hasSellerReadyMsg: !!sellerReadyMessage,
          hasAcceptedMsg: !!tradeAcceptedMessage,
          hasFundsReleasedMsg: !!lastFundsReleased
        });

        // 🔥 CLEAR ALL STATES FIRST
        setShowSellerTradePrompt(false);
        setShowRequestModal(false);
        setPendingRequest(null);
        setShowAcceptanceNotification(false);
        setAcceptanceData(null);
        setPendingTransaction(null);

        // 🔥 REMOVED: Duplicate active transaction check was here causing TradeInitModal to show twice
        // The active transaction check in initChat (lines ~352-455) already handles this case
        // Keeping this comment for future reference - do NOT re-add modal trigger here

        // Extract account info from channel metadata
        if (channel.data?.metadata) {
          const metadata = channel.data.metadata;
          if (metadata.accountId && metadata.trade_price !== 'N/A') {
            // Get account info from selectedUser
            const accountInfoData = {
              buyerName: chatType === 'buy' && isReceiver ? selectedUser?.name || 'Buyer' : null,
              platform: selectedUser?.platform || 'Unknown',
              username: selectedUser?.accountUsername || 'N/A'
            };

            // Show modal only for seller (receiver in buy chat)
            if (chatType === 'buy' && isReceiver) {
              setAccountInfo(accountInfoData);
              setShowAccountInfoModal(true);
            }
          }
        }

        // 🔥 TRADE COMPLETED GUARD: If trade is completed on this channel, skip ALL trade prompts
        if (tradeCompleted) {
          console.log('✅ Trade COMPLETED on this channel — skipping all trade prompts');
          // Don't show any trade prompts for completed trades
          // Credential card persistence is handled separately
        }

        // 🔥 PRIORITY 1: Check for active transactions FIRST (only if trade NOT completed)
        const { hasActiveTransaction, activeTransaction } = tradeCompleted
          ? { hasActiveTransaction: false, activeTransaction: null }
          : await checkActiveTransactions();

        if (hasActiveTransaction) {
          const txnSellOrderId = activeTransaction.sellOrderId;
          const txnAccountId = activeTransaction.accountId || txnSellOrderId;
          const buyerId = activeTransaction.buyer?.userId || activeTransaction.buyer?._id || activeTransaction.buyerId;

          const matchesBySellOrder = txnSellOrderId === accountId || txnSellOrderId === storedAccountId;
          const matchesByAccountId = txnAccountId === accountId || txnAccountId === storedAccountId;
          const matches = matchesBySellOrder || matchesByAccountId;
          const isBuyer = buyerId === currentUserId || buyerId === String(currentUserId);
          const isSeller = !isBuyer;

          console.log('💰 Active Transaction Check:', {
            hasActiveTransaction,
            matches,
            isBuyer,
            txnSellOrderId,
            accountId,
            storedAccountId,
            buyerId,
            currentUserId
          });

          // 🔥 FIX: Show Release Funds for buyer even if matches fails
          // A buyer can only have ONE active transaction at a time, so if they have one, show it
          if (isBuyer && mounted) {
            console.log('✅ BUYER with active transaction - showing Release Funds', matches ? '(matched)' : '(no match, but buyer has only 1 active txn)');

            setPendingTransaction(activeTransaction);
            setTradeData({
              seller: selectedUser,
              socialAccount: selectedUser.platform || 'Unknown',
              accountUsername: selectedUser.accountUsername || 'N/A',
              paymentMethod: activeTransaction.currency || 'BTC',
              accountPrice: activeTransaction.amountUSD || activeTransaction.amount || 0,
              transactionFee: 0,
              sellOrderId: activeTransaction.sellOrderId,
              sellerId: activeTransaction.sellerId,
              transactionId: activeTransaction._id || activeTransaction.id,
              totalAmount: activeTransaction.amountUSD || activeTransaction.amount || 0
            });

            // 🔥 Restore timer from TradeStateManager
            const savedTimer = TradeStateManager.getTimerState();
            if (savedTimer && savedTimer.isActive && savedTimer.remainingTime > 0) {
              setSellerTradeTimer(savedTimer.remainingTime);
              setIsTradeTimerActive(true);
              console.log('🔄 Restored trade timer in loadChannel:', savedTimer.remainingTime, 's');
            }

            // 🔥 FIX: Save to TradeStateManager so trade data survives further reloads
            TradeStateManager.setPhase(TradeStateManager.PHASES.TRADE_CREATED, {
              transactionId: activeTransaction._id || activeTransaction.id,
              tradeData: {
                transactionId: activeTransaction._id || activeTransaction.id,
                accountPrice: activeTransaction.amountUSD || activeTransaction.amount || 0,
                totalAmount: activeTransaction.amountUSD || activeTransaction.amount || 0,
                paymentMethod: activeTransaction.currency || 'BTC',
                sellOrderId: activeTransaction.sellOrderId,
                sellerId: activeTransaction.sellerId,
              },
            });
          } else if (isSeller && mounted) {
            // 🔥 FIX: Check if buyer already initiated the trade (buyer_initiated message exists)
            // If so, restore the trade timer instead of showing "waiting" state
            const buyerInitiatedMsg = [...currentTradeMessages].reverse().find(msg =>
              msg.buyer_initiated === true || msg.transaction_created === true
            );

            if (buyerInitiatedMsg) {
              console.log('⏱️ PRIORITY 1 SELLER: buyer already initiated trade, restoring trade timer');
              const timerDuration = buyerInitiatedMsg.timer_duration || 300;
              const initiatedAt = new Date(buyerInitiatedMsg.created_at).getTime();
              const elapsed = Math.floor((Date.now() - initiatedAt) / 1000);
              const remainingTime = Math.max(0, timerDuration - elapsed);

              if (remainingTime > 0) {
                setActiveTransaction({
                  ...activeTransaction,
                  id: activeTransaction._id || activeTransaction.id,
                  _id: activeTransaction._id || activeTransaction.id,
                  status: 'pending',
                  role: 'seller',
                  sellerId: currentUserId,
                  createdAt: buyerInitiatedMsg.created_at
                });
                setSellerTradeTimer(remainingTime);
                setIsTradeTimerActive(true);
                console.log('✅ PRIORITY 1 SELLER: Trade timer restored:', remainingTime, 's remaining');
              } else {
                console.log('⏰ PRIORITY 1 SELLER: Trade timer expired');
                setShowAcceptanceNotification(true);
                setAcceptanceData({
                  acceptedBy: 'You',
                  message: 'Trade timer has expired.',
                  isWaiting: true,
                  amount: activeTransaction.amount || 0,
                  currency: activeTransaction.currency || 'BTC'
                });
              }
            } else {
              console.log('⏳ SELLER - transaction exists, showing waiting state');
              setShowAcceptanceNotification(true);
              setAcceptanceData({
                acceptedBy: 'You',
                message: 'Trade accepted! Waiting for buyer confirmation...',
                isWaiting: true,
                amount: activeTransaction.amount || 0,
                currency: activeTransaction.currency || 'BTC'
              });
            }
          }
        }
        // 🔥 PRIORITY 1.5: BUYER - Seller submitted trade (trade_init_data exists, not yet accepted)
        // This handles the case where buyer was on another page when seller submitted SellerInitiateModal
        else if (hasUnprocessedTradeInit && mounted) {
          console.log('🎯 BUYER: Found unprocessed trade_init_data in channel history - showing Accept/Decline');
          try {
            const parsedTradeData = JSON.parse(tradeInitDataMessage.trade_init_data);

            // 🔥 FIX: Get seller name from channel members as reliable fallback
            // selectedUser.name is often undefined when buyer navigates back
            const sellerMember = channel.state?.members?.[parsedTradeData.seller_id];
            const sellerMemberUser = sellerMember?.user;
            const resolvedSellerName = parsedTradeData.seller_name ||
              sellerMemberUser?.name || sellerMemberUser?.displayName ||
              selectedUser?.name || selectedUser?.displayName || 'Seller';
            const resolvedSellerImage = sellerMemberUser?.image || sellerMemberUser?.avatar ||
              selectedUser?.image || selectedUser?.avatar || selectedUser?.bitmojiUrl || ug1;

            console.log('👤 Resolved seller info:', { resolvedSellerName, hasChannelMember: !!sellerMemberUser });

            const tradeInitDataForBuyer = {
              transactionId: parsedTradeData.transaction_id,
              sellerId: parsedTradeData.seller_id,
              buyerId: parsedTradeData.buyer_id,
              accountPrice: parsedTradeData.offer_amount,
              paymentMethod: parsedTradeData.payment_method?.toUpperCase() || 'BTC',
              paymentNetwork: parsedTradeData.payment_network,
              initiatedAt: parsedTradeData.initiated_at,
              sellOrderId: channel.data?.metadata?.sellOrderId || channel.data?.metadata?.accountId,
              accountId: channel.data?.metadata?.accountId,
              socialAccount: parsedTradeData.platform || persistedMetadata.platform || 'Unknown',
              accountUsername: parsedTradeData.account_username || persistedMetadata.accountUsername || 'N/A',
              accountOriginalEmail: parsedTradeData.account_original_email || '',
              originalEmailPassword: parsedTradeData.original_email_password || '',
              socialAccountPassword: parsedTradeData.social_account_password || '',
              seller: {
                id: parsedTradeData.seller_id,
                name: resolvedSellerName,
                image: resolvedSellerImage,
                social: getSocialIcon(parsedTradeData.platform || persistedMetadata.platform || 'Unknown'),
                ratings: '⭐ 4.5 (New)',
                price: parsedTradeData.offer_amount,
                currency: parsedTradeData.payment_method?.toUpperCase() || 'BTC',
                platform: parsedTradeData.platform || persistedMetadata.platform || 'Unknown',
                accountUsername: parsedTradeData.account_username || persistedMetadata.accountUsername || 'N/A',
                accountId: channel.data?.metadata?.accountId
              }
            };

            const transactionFee = tradeInitDataForBuyer.accountPrice * 0.025;
            tradeInitDataForBuyer.transactionFee = transactionFee;
            tradeInitDataForBuyer.totalAmount = tradeInitDataForBuyer.accountPrice + transactionFee;

            console.log('✅ BUYER: Showing Accept/Decline from channel history:', tradeInitDataForBuyer);

            setTradeInitData(tradeInitDataForBuyer);
            setPendingRequest({
              user: tradeInitDataForBuyer.seller,
              channel: channel,
              tradeData: tradeInitDataForBuyer,
              isNewAccount: false,
              wasDeleted: false
            });
            setShowRequestModal(true);
          } catch (parseError) {
            console.error('❌ Failed to parse stored trade_init_data:', parseError);
          }
        }
        // 🔥 PRIORITY 2: SELLER - Show "Ready to Initiate Trade" button
        // 🔥 FIX: NEVER show for completed trades
        else if (chatType === 'buy' && isReceiver && !sellerReady && !tradeInitiated && !tradeCompleted && mounted) {
          console.log('🎯 SELLER (User2/RECEIVER) - Show "Ready to Initiate Trade" button');

          setShowSellerTradePrompt(true);
        }
        // 🔥 PRIORITY 2S: SELL TAB - Creator is the seller responding to buy order
        else if (chatType === 'sell' && isCreator && !sellerReady && !tradeInitiated && !tradeCompleted && mounted) {
          console.log('🎯 SELL TAB: SELLER (User2/CREATOR) - Show "Ready to Initiate Trade" button');
          setShowSellerTradePrompt(true);
        }
        // 🔥 PRIORITY 3: BUYER - Show Accept/Decline after SELLER clicks ready
        // 🔥 FIX: NEVER show for completed trades
        else if (chatType === 'buy' && isCreator && sellerReady && !tradeAccepted && !tradeCompleted && mounted) {
          console.log('🎯 BUYER (User1/CREATOR) - Seller ready, show Accept/Decline');

          // 🔥 FIX: Prefer seller_name from the sellerReady message over selectedUser.name
          // selectedUser.name may be missing on reload, but the message always has seller_name
          const sellerName = sellerReadyMessage?.seller_name || selectedUser?.name || selectedUser?.displayName || 'Seller';

          const requestData = {
            user: {
              ...selectedUser,
              name: sellerName,
              displayName: sellerName,
              price: finalPrice,
              accountId: accountId
            },
            channel: channel,
            isNewAccount: false,
            wasDeleted: false
          };

          setPendingRequest(requestData);
          setShowRequestModal(true);
        }
        // 🔥 PRIORITY 3S: SELL TAB - Receiver (buyer/uploader) sees Accept/Decline
        else if (chatType === 'sell' && isReceiver && sellerReady && !tradeAccepted && !tradeCompleted && mounted) {
          console.log('🎯 SELL TAB: BUYER (User1/RECEIVER) - Seller ready, show Accept/Decline');

          const sellerName = sellerReadyMessage?.seller_name || selectedUser?.name || selectedUser?.displayName || 'Seller';

          const requestData = {
            user: {
              ...selectedUser,
              name: sellerName,
              displayName: sellerName,
              price: finalPrice,
              accountId: accountId
            },
            channel: channel,
            isNewAccount: false,
            wasDeleted: false
          };

          setPendingRequest(requestData);
          setShowRequestModal(true);
        }
        // 🔥 PRIORITY 4: After buyer accepts - SELLER waits or sees trade timer
        // 🔥 FIX: NEVER show for completed trades
        else if (chatType === 'buy' && isReceiver && tradeAccepted && acceptedBy !== currentUserId && !tradeCompleted && mounted) {
          // 🔥 FIX: Check if buyer already initiated the trade (buyer_initiated message exists)
          const buyerInitiatedMsg = [...currentTradeMessages].reverse().find(msg =>
            msg.buyer_initiated === true || msg.transaction_created === true
          );

          if (buyerInitiatedMsg) {
            // Transaction was created - seller should see the trade timer, not "waiting"
            console.log('⏱️ SELLER - buyer already initiated trade, restoring trade timer');
            const txnId = buyerInitiatedMsg.transaction_id;
            const timerDuration = buyerInitiatedMsg.timer_duration || 300;

            // Calculate remaining time from when buyer_initiated was sent
            const initiatedAt = new Date(buyerInitiatedMsg.created_at).getTime();
            const elapsed = Math.floor((Date.now() - initiatedAt) / 1000);
            const remainingTime = Math.max(0, timerDuration - elapsed);

            if (remainingTime > 0) {
              setActiveTransaction({
                id: txnId,
                _id: txnId,
                status: 'pending',
                role: 'seller',
                sellerId: currentUserId,
                buyerId: acceptedBy,
                createdAt: buyerInitiatedMsg.created_at
              });
              setSellerTradeTimer(remainingTime);
              setIsTradeTimerActive(true);
              console.log('✅ SELLER: Trade timer restored from message history:', remainingTime, 's remaining');
            } else {
              console.log('⏰ SELLER: Trade timer expired, showing waiting state');
              setShowAcceptanceNotification(true);
              setAcceptanceData({
                acceptedBy: selectedUser?.name || 'Buyer',
                message: 'Trade timer has expired.',
                isWaiting: true,
                amount: finalPrice,
                currency: selectedUser?.currency || 'BTC'
              });
            }
          } else {
            console.log('⏳ SELLER - buyer accepted, showing waiting state');
            setShowAcceptanceNotification(true);
            setAcceptanceData({
              acceptedBy: selectedUser?.name || 'Buyer',
              message: 'Buyer accepted! Waiting for transaction creation...',
              isWaiting: true,
              amount: finalPrice,
              currency: selectedUser?.currency || 'BTC'
            });
          }
        }
        // 🔥 PRIORITY 4S: SELL TAB - Creator (seller) waits after receiver (buyer) accepts
        else if (chatType === 'sell' && isCreator && tradeAccepted && acceptedBy !== currentUserId && !tradeCompleted && mounted) {
          // 🔥 FIX: Check if buyer already initiated the trade (buyer_initiated message exists)
          const buyerInitiatedMsg = [...currentTradeMessages].reverse().find(msg =>
            msg.buyer_initiated === true || msg.transaction_created === true
          );

          if (buyerInitiatedMsg) {
            console.log('⏱️ SELL TAB: SELLER - buyer already initiated trade, restoring trade timer');
            const txnId = buyerInitiatedMsg.transaction_id;
            const timerDuration = buyerInitiatedMsg.timer_duration || 300;

            const initiatedAt = new Date(buyerInitiatedMsg.created_at).getTime();
            const elapsed = Math.floor((Date.now() - initiatedAt) / 1000);
            const remainingTime = Math.max(0, timerDuration - elapsed);

            if (remainingTime > 0) {
              setActiveTransaction({
                id: txnId,
                _id: txnId,
                status: 'pending',
                role: 'seller',
                sellerId: currentUserId,
                buyerId: acceptedBy,
                createdAt: buyerInitiatedMsg.created_at
              });
              setSellerTradeTimer(remainingTime);
              setIsTradeTimerActive(true);
              console.log('✅ SELL TAB: SELLER: Trade timer restored:', remainingTime, 's remaining');
            } else {
              setShowAcceptanceNotification(true);
              setAcceptanceData({
                acceptedBy: selectedUser?.name || 'Buyer',
                message: 'Trade timer has expired.',
                isWaiting: true,
                amount: finalPrice,
                currency: selectedUser?.currency || 'BTC'
              });
            }
          } else {
            console.log('⏳ SELL TAB: SELLER (CREATOR) - buyer accepted, showing waiting state');
            setShowAcceptanceNotification(true);
            setAcceptanceData({
              acceptedBy: selectedUser?.name || 'Buyer',
              message: 'Buyer accepted! Waiting for transaction creation...',
              isWaiting: true,
              amount: finalPrice,
              currency: selectedUser?.currency || 'BTC'
            });
          }
        }
        // 🔥 PRIORITY 5: After buyer accepts - BUYER waits OR shows Release Funds
        // 🔥 FIX: NEVER show for completed trades
        else if (chatType === 'buy' && isCreator && tradeAccepted && acceptedBy === currentUserId && !tradeCompleted && mounted) {
          // 🔥 FIX: Check if transaction was already created (transaction_created or buyer_initiated msg exists)
          const transactionCreatedMsg = [...currentTradeMessages].reverse().find(msg =>
            msg.transaction_created === true || msg.buyer_initiated === true
          );

          if (transactionCreatedMsg) {
            let txnId = transactionCreatedMsg.transaction_id;
            console.log('🎯 BUYER: Transaction/Invoice already created (from msg history), txnId:', txnId);

            // 🔥 FIX: The transaction_id in chat messages is often the INVOICE ID, not the real TRANSACTION ID.
            // Fetch the real transaction ID from the API to be safe.
            // 🔥 ALSO: If no active transaction exists, skip showing Release Funds entirely.
            let skipReleaseFunds = false;
            try {
              const activeCheck = await checkActiveTransactions();
              if (activeCheck?.hasActiveTransaction && activeCheck?.activeTransaction) {
                const realTxnId = activeCheck.activeTransaction._id || activeCheck.activeTransaction.id;
                if (realTxnId && realTxnId !== txnId) {
                  console.log('🔑 PRIORITY 5: Replacing message txnId (invoice ID) with REAL transactionId from API:', realTxnId, '(was:', txnId, ')');
                  txnId = realTxnId;
                }
              } else {
                console.log('🚫 PRIORITY 5: No active transaction found from API — trade was cancelled, skipping Release Funds');
                skipReleaseFunds = true;
              }
            } catch (apiErr) {
              console.warn('⚠️ Could not fetch active transaction for ID verification:', apiErr.message);
            }

            if (skipReleaseFunds) {
              console.log('🚫 PRIORITY 5: Skipping Release Funds display for cancelled transaction');
              TradeStateManager.clear();
              return;
            }

            if (txnId) {
              // 🔥 FIX: Build pending transaction from chat message data instead of fetching
              // The old /transaction/{id} endpoint no longer works since we use invoices now
              let parsedInitData = null;
              if (tradeInitDataMessage?.trade_init_data) {
                try {
                  parsedInitData = JSON.parse(tradeInitDataMessage.trade_init_data);
                } catch (e) {
                  console.warn('⚠️ Could not parse trade_init_data:', e);
                }
              }

              const offerAmount = parsedInitData?.offer_amount || 
                parseFloat(channelMetadata?.trade_price || channelMetadata?.offer_amount) || 
                finalPrice || 0;
              const paymentMethod = parsedInitData?.payment_method?.toUpperCase() || 
                channelMetadata?.paymentMethod || 'BTC';
              const sellOrderId = parsedInitData?.sell_order_id || 
                channelMetadata?.sellOrderId || channelMetadata?.accountId;
              const sellerId = parsedInitData?.seller_id || channelMetadata?.sellerId;

              const txnData = {
                _id: txnId,
                id: txnId,
                amount: offerAmount,
                amountUSD: offerAmount,
                currency: paymentMethod,
                status: 'pending',
                sellOrderId: sellOrderId,
                sellerId: sellerId,
                buyerId: currentUserId
              };

              console.log('✅ BUYER: Constructed transaction from message data, showing Release Funds:', txnData);
              setPendingTransaction(txnData);
              setTradeData({
                seller: selectedUser,
                socialAccount: selectedUser?.platform || channelMetadata?.platform || parsedInitData?.platform || 'Unknown',
                accountUsername: selectedUser?.accountUsername || channelMetadata?.accountUsername || parsedInitData?.account_username || 'N/A',
                paymentMethod: paymentMethod,
                accountPrice: offerAmount,
                transactionFee: 0,
                sellOrderId: sellOrderId,
                sellerId: sellerId,
                transactionId: txnId,
                totalAmount: offerAmount
              });

              // Restore timer from TradeStateManager
              const savedTimer = TradeStateManager.getTimerState();
              if (savedTimer && savedTimer.isActive && savedTimer.remainingTime > 0) {
                setSellerTradeTimer(savedTimer.remainingTime);
                setIsTradeTimerActive(true);
                console.log('🔄 Restored trade timer in Priority 5 fallback:', savedTimer.remainingTime, 's');
              }

              // 🔥 FIX: Save to TradeStateManager so data survives further reloads
              TradeStateManager.setPhase(TradeStateManager.PHASES.TRADE_CREATED, {
                transactionId: txnId,
                tradeData: {
                  transactionId: txnId,
                  accountPrice: offerAmount,
                  totalAmount: offerAmount,
                  paymentMethod: paymentMethod,
                  sellOrderId: sellOrderId,
                  sellerId: sellerId,
                },
              });
            } else {
              // No txn ID in the message, show waiting
              setShowAcceptanceNotification(true);
              setAcceptanceData({
                acceptedBy: 'You',
                message: 'Trade accepted! Waiting for transaction to be created...',
                isWaiting: true,
                amount: finalPrice,
                currency: selectedUser?.currency || 'BTC'
              });
            }
          } else {
            // 🔥 FIX: No transaction_created msg — accept may have failed (e.g. insufficient funds)
            // Re-show TradeInitModal so buyer can retry instead of showing "waiting" forever
            if (tradeInitDataMessage?.trade_init_data) {
              console.log('🔄 BUYER - trade_accepted but no transaction created yet — re-showing TradeInitModal');
              try {
                const parsedTradeData = JSON.parse(tradeInitDataMessage.trade_init_data);

                // Build the same data structure as Priority 2 so TradeInitModal shows correct amounts
                const sellerMember = channel.state?.members?.[parsedTradeData.seller_id];
                const sellerMemberUser = sellerMember?.user;
                const resolvedSellerName = parsedTradeData.seller_name ||
                  sellerMemberUser?.name || sellerMemberUser?.displayName ||
                  selectedUser?.name || selectedUser?.displayName || 'Seller';
                const resolvedSellerImage = sellerMemberUser?.image || sellerMemberUser?.avatar ||
                  selectedUser?.image || selectedUser?.avatar || selectedUser?.bitmojiUrl;

                const tradeInitDataForBuyer = {
                  transactionId: parsedTradeData.transaction_id,
                  sellerId: parsedTradeData.seller_id,
                  buyerId: parsedTradeData.buyer_id,
                  accountPrice: parsedTradeData.offer_amount,
                  paymentMethod: parsedTradeData.payment_method?.toUpperCase() || 'BTC',
                  paymentNetwork: parsedTradeData.payment_network,
                  initiatedAt: parsedTradeData.initiated_at,
                  sellOrderId: channel.data?.metadata?.sellOrderId || channel.data?.metadata?.accountId,
                  accountId: channel.data?.metadata?.accountId,
                  socialAccount: parsedTradeData.platform || channelMetadata?.platform || 'Unknown',
                  accountUsername: parsedTradeData.account_username || channelMetadata?.accountUsername || 'N/A',
                  accountOriginalEmail: parsedTradeData.account_original_email || '',
                  originalEmailPassword: parsedTradeData.original_email_password || '',
                  socialAccountPassword: parsedTradeData.social_account_password || '',
                  seller: {
                    id: parsedTradeData.seller_id,
                    name: resolvedSellerName,
                    image: resolvedSellerImage,
                    social: getSocialIcon(parsedTradeData.platform || channelMetadata?.platform || 'Unknown'),
                    ratings: '⭐ 4.5 (New)',
                    price: parsedTradeData.offer_amount,
                    currency: parsedTradeData.payment_method?.toUpperCase() || 'BTC',
                    platform: parsedTradeData.platform || channelMetadata?.platform || 'Unknown',
                    accountUsername: parsedTradeData.account_username || channelMetadata?.accountUsername || 'N/A',
                    accountId: channel.data?.metadata?.accountId
                  }
                };

                const transactionFee = tradeInitDataForBuyer.accountPrice * 0.025;
                tradeInitDataForBuyer.transactionFee = transactionFee;
                tradeInitDataForBuyer.totalAmount = tradeInitDataForBuyer.accountPrice + transactionFee;

                console.log('✅ BUYER RETRY: Constructed tradeInitData:', tradeInitDataForBuyer);

                setTradeInitData(tradeInitDataForBuyer);
                setShowTradeInitModal(true);
              } catch (e) {
                console.error('❌ Failed to parse trade_init_data for retry:', e);
                setShowAcceptanceNotification(true);
                setAcceptanceData({
                  acceptedBy: 'You',
                  message: 'Trade accepted! Waiting for transaction to be created...',
                  isWaiting: true,
                  amount: finalPrice,
                  currency: selectedUser?.currency || 'BTC'
                });
              }
            } else {
              console.log('⏳ BUYER - accepted, no transaction_created and no trade_init_data, showing waiting');
              setShowAcceptanceNotification(true);
              setAcceptanceData({
                acceptedBy: 'You',
                message: 'Trade accepted! Waiting for transaction to be created...',
                isWaiting: true,
                amount: finalPrice,
                currency: selectedUser?.currency || 'BTC'
              });
            }
          }
        }
        // 🔥 PRIORITY 5S: SELL TAB - Receiver (buyer/uploader) waits OR shows Release Funds
        else if (chatType === 'sell' && isReceiver && tradeAccepted && acceptedBy === currentUserId && !tradeCompleted && mounted) {
          const transactionCreatedMsg = [...currentTradeMessages].reverse().find(msg =>
            msg.transaction_created === true || msg.buyer_initiated === true
          );

          if (transactionCreatedMsg) {
            let txnId = transactionCreatedMsg.transaction_id;
            console.log('🎯 SELL TAB: BUYER (RECEIVER): Transaction/Invoice already created, txnId:', txnId);

            // 🔥 FIX: The transaction_id in chat messages is often the INVOICE ID, not the real TRANSACTION ID.
            // 🔥 ALSO: If no active transaction exists, skip showing Release Funds entirely.
            let skipReleaseFunds5S = false;
            try {
              const activeCheck = await checkActiveTransactions();
              if (activeCheck?.hasActiveTransaction && activeCheck?.activeTransaction) {
                const realTxnId = activeCheck.activeTransaction._id || activeCheck.activeTransaction.id;
                if (realTxnId && realTxnId !== txnId) {
                  console.log('🔑 SELL TAB PRIORITY 5S: Replacing message txnId (invoice ID) with REAL transactionId from API:', realTxnId, '(was:', txnId, ')');
                  txnId = realTxnId;
                }
              } else {
                console.log('🚫 SELL TAB PRIORITY 5S: No active transaction found from API — trade was cancelled, skipping Release Funds');
                skipReleaseFunds5S = true;
              }
            } catch (apiErr) {
              console.warn('⚠️ Could not fetch active transaction for ID verification:', apiErr.message);
            }

            if (skipReleaseFunds5S) {
              console.log('🚫 SELL TAB PRIORITY 5S: Skipping Release Funds display for cancelled transaction');
              TradeStateManager.clear();
              return;
            }

            if (txnId) {
              // 🔥 FIX: Build pending transaction from chat message data instead of fetching
              // The old /transaction/{id} endpoint no longer works since we use invoices now
              let parsedInitData = null;
              if (tradeInitDataMessage?.trade_init_data) {
                try {
                  parsedInitData = JSON.parse(tradeInitDataMessage.trade_init_data);
                } catch (e) {
                  console.warn('⚠️ SELL TAB: Could not parse trade_init_data:', e);
                }
              }

              const offerAmount = parsedInitData?.offer_amount || 
                parseFloat(channelMetadata?.trade_price || channelMetadata?.offer_amount) || 
                finalPrice || 0;
              const paymentMethod = parsedInitData?.payment_method?.toUpperCase() || 
                channelMetadata?.paymentMethod || 'BTC';
              const sellOrderId = parsedInitData?.sell_order_id || 
                channelMetadata?.sellOrderId || channelMetadata?.accountId;
              const sellerId = parsedInitData?.seller_id || channelMetadata?.sellerId;

              const txnData = {
                _id: txnId,
                id: txnId,
                amount: offerAmount,
                amountUSD: offerAmount,
                currency: paymentMethod,
                status: 'pending',
                sellOrderId: sellOrderId,
                sellerId: sellerId,
                buyerId: currentUserId
              };

              console.log('✅ SELL TAB: BUYER (RECEIVER): Constructed transaction from message data, showing Release Funds:', txnData);
              setPendingTransaction(txnData);
              setTradeData({
                seller: selectedUser,
                socialAccount: selectedUser?.platform || channelMetadata?.platform || parsedInitData?.platform || 'Unknown',
                accountUsername: selectedUser?.accountUsername || channelMetadata?.accountUsername || parsedInitData?.account_username || 'N/A',
                paymentMethod: paymentMethod,
                accountPrice: offerAmount,
                transactionFee: 0,
                sellOrderId: sellOrderId,
                sellerId: sellerId,
                transactionId: txnId,
                totalAmount: offerAmount
              });

              const savedTimer = TradeStateManager.getTimerState();
              if (savedTimer && savedTimer.isActive && savedTimer.remainingTime > 0) {
                setSellerTradeTimer(savedTimer.remainingTime);
                setIsTradeTimerActive(true);
                console.log('🔄 SELL TAB: Restored trade timer:', savedTimer.remainingTime, 's');
              }

              TradeStateManager.setPhase(TradeStateManager.PHASES.TRADE_CREATED, {
                transactionId: txnId,
                tradeData: {
                  transactionId: txnId,
                  accountPrice: offerAmount,
                  totalAmount: offerAmount,
                  paymentMethod: paymentMethod,
                  sellOrderId: sellOrderId,
                  sellerId: sellerId,
                },
              });
            } else {
              setShowAcceptanceNotification(true);
              setAcceptanceData({
                acceptedBy: 'You',
                message: 'Trade accepted! Waiting for transaction to be created...',
                isWaiting: true,
                amount: finalPrice,
                currency: selectedUser?.currency || 'BTC'
              });
            }
          } else {
            // 🔥 FIX: No transaction_created msg — accept may have failed (e.g. insufficient funds)
            // Re-show TradeInitModal so buyer can retry
            if (tradeInitDataMessage?.trade_init_data) {
              console.log('🔄 SELL TAB: BUYER - trade_accepted but no transaction created — re-showing TradeInitModal');
              try {
                const parsedTradeData = JSON.parse(tradeInitDataMessage.trade_init_data);

                const sellerMember = channel.state?.members?.[parsedTradeData.seller_id];
                const sellerMemberUser = sellerMember?.user;
                const resolvedSellerName = parsedTradeData.seller_name ||
                  sellerMemberUser?.name || sellerMemberUser?.displayName ||
                  selectedUser?.name || selectedUser?.displayName || 'Seller';
                const resolvedSellerImage = sellerMemberUser?.image || sellerMemberUser?.avatar ||
                  selectedUser?.image || selectedUser?.avatar || selectedUser?.bitmojiUrl;

                const tradeInitDataForBuyer = {
                  transactionId: parsedTradeData.transaction_id,
                  sellerId: parsedTradeData.seller_id,
                  buyerId: parsedTradeData.buyer_id,
                  accountPrice: parsedTradeData.offer_amount,
                  paymentMethod: parsedTradeData.payment_method?.toUpperCase() || 'BTC',
                  paymentNetwork: parsedTradeData.payment_network,
                  initiatedAt: parsedTradeData.initiated_at,
                  sellOrderId: channel.data?.metadata?.sellOrderId || channel.data?.metadata?.accountId,
                  accountId: channel.data?.metadata?.accountId,
                  socialAccount: parsedTradeData.platform || channelMetadata?.platform || 'Unknown',
                  accountUsername: parsedTradeData.account_username || channelMetadata?.accountUsername || 'N/A',
                  accountOriginalEmail: parsedTradeData.account_original_email || '',
                  originalEmailPassword: parsedTradeData.original_email_password || '',
                  socialAccountPassword: parsedTradeData.social_account_password || '',
                  seller: {
                    id: parsedTradeData.seller_id,
                    name: resolvedSellerName,
                    image: resolvedSellerImage,
                    social: getSocialIcon(parsedTradeData.platform || channelMetadata?.platform || 'Unknown'),
                    ratings: '⭐ 4.5 (New)',
                    price: parsedTradeData.offer_amount,
                    currency: parsedTradeData.payment_method?.toUpperCase() || 'BTC',
                    platform: parsedTradeData.platform || channelMetadata?.platform || 'Unknown',
                    accountUsername: parsedTradeData.account_username || channelMetadata?.accountUsername || 'N/A',
                    accountId: channel.data?.metadata?.accountId
                  }
                };

                const transactionFee = tradeInitDataForBuyer.accountPrice * 0.025;
                tradeInitDataForBuyer.transactionFee = transactionFee;
                tradeInitDataForBuyer.totalAmount = tradeInitDataForBuyer.accountPrice + transactionFee;

                console.log('✅ SELL TAB: BUYER RETRY: Constructed tradeInitData:', tradeInitDataForBuyer);

                setTradeInitData(tradeInitDataForBuyer);
                setShowTradeInitModal(true);
              } catch (e) {
                console.error('❌ SELL TAB: Failed to parse trade_init_data for retry:', e);
                setShowAcceptanceNotification(true);
                setAcceptanceData({
                  acceptedBy: 'You',
                  message: 'Trade accepted! Waiting for transaction to be created...',
                  isWaiting: true,
                  amount: finalPrice,
                  currency: selectedUser?.currency || 'BTC'
                });
              }
            } else {
              console.log('⏳ SELL TAB: BUYER (RECEIVER) - accepted, no transaction_created and no trade_init_data');
              setShowAcceptanceNotification(true);
              setAcceptanceData({
                acceptedBy: 'You',
                message: 'Trade accepted! Waiting for transaction to be created...',
                isWaiting: true,
                amount: finalPrice,
                currency: selectedUser?.currency || 'BTC'
              });
            }
          }
        }

        console.log('📊 Final Modal States:', {
          showSellerTradePrompt,
          showRequestModal,
          showAcceptanceNotification,
          hasPendingTransaction: !!pendingTransaction,
          hasPendingRequest: !!pendingRequest,
          hasAcceptanceData: !!acceptanceData
        });

        console.log('🔄 Channel load complete');

      } catch (error) {
        console.error('❌ loadChannel error:', error);
        // Set channel error for user feedback
        const errorMessage = error.message?.includes('timeout')
          ? 'Connection timed out. Please check your internet connection.'
          : 'Failed to load chat. Please try again.';
        setChannelError(errorMessage);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadChannel();

    return () => {
      mounted = false;

      if (currentChannelRef.current) {
        if (messageListener) {
          currentChannelRef.current.off('message.new', messageListener);
        }
        if (readListener) {
          currentChannelRef.current.off('message.read', readListener);
        }
        if (updateListener) {
          currentChannelRef.current.off('message.updated', updateListener);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id || selectedUser?._id, isInitialized, userData?._id || userData?.id]);




  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!currentChannel || !messages.length || showRequestModal) {
      return;
    }

    const markMessagesAsRead = async () => {
      try {
        // Check if there are unread messages from other users
        const hasUnreadFromOthers = messages.some(msg =>
          msg.user?.id !== userData?._id &&
          msg.user?.id !== userData?.id
        );

        if (hasUnreadFromOthers) {
          await chatService.markAsRead(currentChannel);
          // 🔥 FIX: Removed fetchChannels() call here
          // Calling fetchChannels->setChannels on every messages.length change
          // caused a full component re-render that reset scroll position.
          // The channel sidebar will update naturally via throttledFetchChannels
          // from the message.new listener.
        }
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    };

    // Mark as read immediately when messages appear
    const timeoutId = setTimeout(markMessagesAsRead, 300);

    return () => clearTimeout(timeoutId);
  }, [messages.length, currentChannel, showRequestModal, userData]);

  // CRITICAL: Also mark as read on visibility change
  useEffect(() => {
    if (!currentChannel || showRequestModal) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && currentChannel) {
        // console.log('👁️ Page visible - marking messages as read');
        chatService.markAsRead(currentChannel);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentChannel, showRequestModal]);




  // 🔥 FIXED: Uses /transaction/current endpoint with fallback to /my-transactions
  const checkActiveTransactions = async () => {
    try {
      console.log('🔍 Checking for active transactions...');

      let response = null;

      // 🔥 FIXED: Use correct endpoint - GET /transaction/current
      try {
        response = await Promise.race([
          transactionService.getCurrentTransaction(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 8000)
          )
        ]);

        console.log('📊 Current transaction response:', response);
      } catch (error) {
        console.warn('⚠️ Transaction API failed:', error.message);
        return {
          hasActiveTransaction: false,
          activeTransaction: null,
          checkFailed: true
        };
      }

      if (!response || !response.transaction) {
        console.log('⚠️ /transaction/current returned null, trying /my-transactions fallback...');
        
        // 🔥 FALLBACK: Try to get from my-transactions
        try {
          const currentUserId = userData?._id || userData?.id;
          const myTransactionsResult = await Promise.race([
            transactionService.getUserTransactions({ status: 'pending' }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 8000)
            )
          ]);
          
          if (myTransactionsResult?.transactions && myTransactionsResult.transactions.length > 0) {
            // Find the first pending transaction where user is the buyer
            const pendingAsBuyer = myTransactionsResult.transactions.find(txn => {
              const txnBuyerId = txn.buyer?.userId || txn.buyer?._id || txn.buyerId;
              const isPending = ['pending', 'active', 'escrowed'].includes(txn.status?.toLowerCase());
              return (txnBuyerId === currentUserId || String(txnBuyerId) === String(currentUserId)) && isPending;
            });
            
            if (pendingAsBuyer) {
              console.log('💰 Found active transaction via /my-transactions fallback:', pendingAsBuyer._id || pendingAsBuyer.id);
              return {
                hasActiveTransaction: true,
                activeTransaction: pendingAsBuyer
              };
            }
          }
        } catch (fallbackError) {
          console.warn('⚠️ Fallback my-transactions also failed:', fallbackError.message);
        }
        
        console.log('✅ No active transaction found');
        return {
          hasActiveTransaction: false,
          activeTransaction: null
        };
      }

      const activeTxn = response.transaction;
      console.log('⚠️ User has active transaction:', {
        id: activeTxn._id || activeTxn.id,
        status: activeTxn.status,
        amount: activeTxn.amount,
        currency: activeTxn.currency
      });

      return {
        hasActiveTransaction: true,
        activeTransaction: activeTxn
      };

    } catch (error) {
      console.warn('⚠️ Error checking transactions (non-critical):', error.message);
      return {
        hasActiveTransaction: false,
        activeTransaction: null,
        checkFailed: true
      };
    }
  };


  const handleAcceptRequest = async () => {
    try {
      console.log('✅ User2 accepting trade request...');

      const { hasActiveTransaction, activeTransaction } = await checkActiveTransactions();

      if (hasActiveTransaction) {
        // ... existing transaction check code ...
        const channelAccountId = pendingRequest.user.accountId;
        const txnSellOrderId = activeTransaction.sellOrderId;
        const txnAccountId = activeTransaction.accountId || txnSellOrderId;
        const buyerId = activeTransaction.buyer?.userId || activeTransaction.buyer?._id || activeTransaction.buyerId;
        const currentUserId = userData?._id || userData?.id;

        const matchesBySellOrder = txnSellOrderId === channelAccountId;
        const matchesByAccountId = txnAccountId === channelAccountId;
        const matches = matchesBySellOrder || matchesByAccountId;
        const isBuyer = buyerId === currentUserId || buyerId === String(currentUserId);

        if (matches && isBuyer) {
          console.log('💰 Active transaction matches - switching to Release Funds');

          setShowRequestModal(false);
          setPendingRequest(null);

          setPendingTransaction(activeTransaction);
          setTradeData({
            seller: pendingRequest.user,
            socialAccount: pendingRequest.user.platform || currentChannel?.data?.metadata?.platform || channelMetadata?.platform || 'Unknown',
            accountUsername: pendingRequest.user.accountUsername || currentChannel?.data?.metadata?.accountUsername || channelMetadata?.accountUsername || 'N/A',
            paymentMethod: activeTransaction.currency || 'BTC',
            accountPrice: parseFloat(activeTransaction.amount) || 0,
            transactionFee: 0,
            sellOrderId: activeTransaction.sellOrderId,
            sellerId: activeTransaction.sellerId,
            transactionId: activeTransaction._id || activeTransaction.id,
            totalAmount: parseFloat(activeTransaction.amount) || 0
          });

          return;
        } else {
          setErrorModalData({
            message: `You already have an active transaction for a different account. Please complete or cancel it before starting a new trade.`,
            details: {
              transactionId: activeTransaction._id || activeTransaction.id,
              amount: activeTransaction.amount,
              currency: activeTransaction.currency,
              status: activeTransaction.status
            }
          });
          setShowErrorModal(true);
          setShowRequestModal(false);
          return;
        }
      }

      // 🔥 FIXED: Use stored tradeData if available (contains credentials from seller)
      // Preserve the seller object if it already exists in tradeData
      const trade = pendingRequest.tradeData ? {
        ...pendingRequest.tradeData,
        // Only override seller if tradeData doesn't already have a proper seller object
        ...(!pendingRequest.tradeData.seller || typeof pendingRequest.tradeData.seller !== 'object' ? { seller: pendingRequest.user } : {}),
      } : {
        seller: pendingRequest.user,
        socialAccount: pendingRequest.user.platform || currentChannel?.data?.metadata?.platform || channelMetadata?.platform || 'Unknown',
        accountUsername: pendingRequest.user.accountUsername || currentChannel?.data?.metadata?.accountUsername || channelMetadata?.accountUsername || 'N/A',
        paymentMethod: pendingRequest.user.currency || 'BTC',
        accountPrice: parseFloat(pendingRequest.user.price) || 0,
        transactionFee: (parseFloat(pendingRequest.user.price) || 0) * 0.025,
        sellOrderId: pendingRequest.user.accountId || currentChannel?.data?.metadata?.sellOrderId || currentChannel?.data?.metadata?.accountId,
        sellerId: pendingRequest.user.id || pendingRequest.user._id,
        platform: pendingRequest.user.platform || currentChannel?.data?.metadata?.platform || channelMetadata?.platform || 'Unknown',
      };

      // Ensure totalAmount is calculated
      if (!trade.totalAmount) {
        trade.totalAmount = (trade.accountPrice || 0) + (trade.transactionFee || 0);
      }

      // 🔥 FIXED: Send acceptance message as regular message with custom data
      if (currentChannel) {
        try {
          const currentUserId = userData?._id || userData?.id;
          const acceptorName = userData?.displayName || userData?.name || 'User';

          console.log('📝 Sending acceptance custom message');

          await currentChannel.sendMessage({
            text: `✅ Trade accepted! Waiting for transaction to be created...`,
            user_id: currentUserId,
            // 🔥 REMOVED: type: 'system' - this causes the error
            // 🔥 ADDED: Use custom fields to track acceptance
            trade_accepted: true,
            accepted_by: currentUserId,
            acceptor_name: acceptorName,
            accepted_at: new Date().toISOString(),
            silent: true
          });

          console.log('✅ Acceptance message sent successfully');

        } catch (msgError) {
          console.warn('⚠️ Could not send acceptance message:', msgError);
        }
      }

      setTradeInitData(trade);
      setShowRequestModal(false);
      setShowTradeInitModal(true);

    } catch (error) {
      console.error('❌ Error accepting trade request:', error);

      setErrorModalData({
        message: error.message || 'Failed to accept trade request. Please try again.'
      });
      setShowErrorModal(true);
    }
  };


  // Wallet data is already managed via Socket.IO and passed as prop - no need to fetch here



  const handleProceedWithTradeInit = async () => {
    if (!agreeVerified || !agreeLocked) {
      alert('Please agree to both terms before proceeding');
      return;
    }

    try {
      console.log('🔍 Final check: Verifying no duplicate transactions...');
      setIsProcessingTrade(true);

      // 🔥 CRITICAL: Triple-check for active transactions before creating
      const { hasActiveTransaction, activeTransaction } = await checkActiveTransactions();

      if (hasActiveTransaction) {
        console.log('⚠️ Active transaction detected during final check');

        // Check if it matches this channel
        const sellOrderId = String(tradeInitData.sellOrderId || tradeInitData.accountId || '').trim();
        const txnSellOrderId = activeTransaction.sellOrderId;
        const txnAccountId = activeTransaction.accountId || txnSellOrderId;
        const buyerId = activeTransaction.buyer?.userId || activeTransaction.buyer?._id || activeTransaction.buyerId;
        const currentUserId = userData?._id || userData?.id;

        const matchesBySellOrder = txnSellOrderId === sellOrderId;
        const matchesByAccountId = txnAccountId === sellOrderId;
        const matches = matchesBySellOrder || matchesByAccountId;
        const isBuyer = buyerId === currentUserId || buyerId === String(currentUserId);

        if (matches && isBuyer) {
          console.log('💰 Active transaction matches - switching to Release Funds');

          setShowTradeInitModal(false);
          setAgreeVerified(false);
          setAgreeLocked(false);

          setPendingTransaction(activeTransaction);
          setTradeData({
            ...tradeInitData,
            transactionId: activeTransaction._id || activeTransaction.id,
            totalAmount: parseFloat(activeTransaction.amount) || 0
          });

          return; // Exit - don't create new transaction
        } else {
          // Transaction exists but doesn't match
          setShowTradeInitModal(false);
          setAgreeVerified(false);
          setAgreeLocked(false);

          setErrorModalData({
            message: `You have an active transaction for a different account. Please complete or cancel it before starting a new trade.`,
            details: {
              transactionId: activeTransaction._id || activeTransaction.id,
              amount: activeTransaction.amount,
              currency: activeTransaction.currency,
              status: activeTransaction.status
            }
          });
          setShowErrorModal(true);
          return;
        }
      }

      // No active transaction - proceed with creation
      console.log('📋 Processing trade...');

      // Get current user info
      const currentUserId = userData?._id || userData?.id;

      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      console.log('📊 Trade Init Data:', {
        sellOrderId: tradeInitData.sellOrderId,
        sellerId: tradeInitData.sellerId,
        buyerId: currentUserId,
        accountPrice: tradeInitData.accountPrice,
        paymentMethod: tradeInitData.paymentMethod,
        seller: tradeInitData.seller
      });

      // Validate IDs
      const sellerId = String(tradeInitData.sellerId || tradeInitData.seller?.id || tradeInitData.seller?._id || '').trim();
      const buyerId = String(currentUserId).trim();
      const sellOrderId = String(tradeInitData.sellOrderId || tradeInitData.accountId || '').trim();

      const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

      if (!isValidObjectId(sellOrderId)) {
        throw new Error(`Invalid sell order ID format: ${sellOrderId}`);
      }

      if (!isValidObjectId(sellerId)) {
        throw new Error(`Invalid seller ID format: ${sellerId}`);
      }

      if (!isValidObjectId(buyerId)) {
        throw new Error(`Invalid buyer ID format: ${buyerId}`);
      }

      // Validate amount
      const amount = parseFloat(tradeInitData.accountPrice);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount: ${tradeInitData.accountPrice}`);
      }

      // Validate currency
      const validCurrencies = ['btc', 'eth', 'usdt', 'sol', 'bnb', 'trx', 'base'];
      const currency = tradeInitData.paymentMethod.toLowerCase();

      if (!validCurrencies.includes(currency)) {
        throw new Error(`Invalid currency: ${currency}. Must be one of: ${validCurrencies.join(', ')}`);
      }

      console.log('💰 Fetching wallet addresses...');

      const { buyerAddress, sellerAddress } = await walletService.validateTradeWallets(
        buyerId,
        sellerId,
        currency
      );

      console.log('✅ Wallet addresses validated');

      // Prepare transaction payload
      const transactionPayload = {
        sellOrderId: sellOrderId,
        sellerId: sellerId,
        buyerId: buyerId,
        amount: amount,
        currency: currency,
        sellerWalletAddress: sellerAddress,
        buyerWalletAddress: buyerAddress,
        notes: `Trade for ${tradeInitData.socialAccount} account - ${tradeInitData.accountUsername}`
      };

      console.log('📦 Final Transaction Payload:', {
        ...transactionPayload,
        sellerWalletAddress: sellerAddress.substring(0, 10) + '...',
        buyerWalletAddress: buyerAddress.substring(0, 10) + '...',
      });

      console.log('📤 Submitting transaction to API...');

      // Submit transaction
      const result = await apiService.post('/transaction', transactionPayload);

      console.log('✅ Transaction created successfully:', result);

      // Close trade init modal
      setShowTradeInitModal(false);
      setAgreeVerified(false);
      setAgreeLocked(false);

      // Store transaction data and show pending transaction in header
      const newTransaction = {
        _id: result.transactionId || result._id || result.data?._id,
        id: result.transactionId || result._id || result.data?._id,
        amount: amount,
        currency: currency,
        status: 'pending',
        sellOrderId: sellOrderId,
        sellerId: sellerId,
        buyerId: buyerId
      };

      setPendingTransaction(newTransaction);
      setTradeData({
        ...tradeInitData,
        transactionId: newTransaction._id,
        totalAmount: amount
      });

      // 🔥 NEW: Set active transaction for buyer banner
      setActiveTransaction({
        id: newTransaction._id,
        status: 'locked', // Buyer has locked funds
        role: 'buyer', // Current user is buyer
        amount: amount,
        currency: currency.toUpperCase(),
        createdAt: new Date().toISOString(),
        buyerId: buyerId,
        sellerId: sellerId
      });


      if (currentChannel) {
        try {
          // Update channel metadata
          await currentChannel.update({
            trade_initiated: true,
            trade_accepted: true,
            trade_id: newTransaction._id,
            accepted_at: new Date().toISOString(),
            accepted_by: currentUserId,
            acceptor_name: userData?.displayName || userData?.name || 'User'
          });

          // 🔥 FIXED: Send as regular message with custom data
          await currentChannel.sendMessage({
            text: `✅ Trade accepted! Transaction created successfully.`,
            user_id: currentUserId,
            // 🔥 REMOVED: type: 'system'
            // 🔥 ADDED: Custom fields to identify this message
            transaction_created: true,
            transaction_id: newTransaction._id,
            created_at: new Date().toISOString(),
            silent: true
          });

          console.log('✅ Transaction confirmation message sent');

          // 🔥 FIX: Send buyer_initiated message so the seller's timer starts
          // Without this, the seller's global listener never receives the signal to start the timer
          await currentChannel.sendMessage({
            text: '🔒 Trade funds locked! Timer started.',
            buyer_initiated: true,
            transaction_id: newTransaction._id,
            seller_id: sellerId,
            initiated_at: new Date().toISOString(),
            timer_duration: 300, // 5 minutes
            silent: true
          });
          console.log('📤 Sent buyer_initiated message to seller (from handleProceedWithTradeInit)');
        } catch (msgError) {
          console.warn('⚠️ Could not send transaction message:', msgError);
        }
      }

      setSuccessModalData({
        title: 'Trade Accepted',
        message: 'You have successfully accepted the trade! The buyer can now proceed to release funds once they verify the account.'
      });
      setShowSuccessModal(true);

      // Update channel
      if (currentChannel) {
        await currentChannel.update({
          trade_initiated: true,
          trade_id: newTransaction._id,
          initiated_at: new Date().toISOString()
        });
      }

      // Show success message
      setSuccessModalData({
        title: 'Trade Initiated',
        message: 'Transaction created successfully! You can now proceed to release funds once you verify the account.'
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('❌ Error creating transaction:', error);

      let errorMessage = error.message || 'Failed to initiate trade';

      // Check for specific error messages from backend
      if (errorMessage.includes('active transaction') ||
        errorMessage.includes('Buyer has an active transaction')) {
        errorMessage =
          'You have an active transaction. Please complete or cancel your existing transaction before starting a new one. You can release funds for the active transaction from the chat header.';
      } else if (errorMessage.includes('wallet')) {
        errorMessage = 'Wallet address issue: ' + errorMessage;
      } else if (errorMessage.includes('Invalid')) {
        errorMessage = 'Validation error: ' + errorMessage;
      }



      // Show error in a modal instead of alert for better UX
      setShowTradeInitModal(false);
      setAgreeVerified(false);
      setAgreeLocked(false);

      setErrorModalData({
        message: errorMessage,
        canRetry: !errorMessage.includes('active transaction')
      });
      setShowErrorModal(true);

    } finally {
      setIsProcessingTrade(false);
    }


  };






  const handleReleaseFunds = async () => {
    if (!agreeFullAccess) {
      alert('Please confirm that you have secured the account');
      return;
    }

    setShowPinModal(true);
  };


  const handlePinSubmit = async () => {
    if (!transactionPin || transactionPin.length !== 4) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      console.log('💰 Releasing funds with PIN...');
      setIsProcessingTrade(true);

      // 🔥 FIX: The stored transactionId is often the INVOICE ID, not the real TRANSACTION ID.
      // Always fetch the real transaction ID from the API first.
      let transactionId = tradeData.transactionId || pendingTransaction?._id || pendingTransaction?.id;
      
      try {
        const activeCheck = await checkActiveTransactions();
        if (activeCheck?.hasActiveTransaction && activeCheck?.activeTransaction) {
          const realTxnId = activeCheck.activeTransaction._id || activeCheck.activeTransaction.id;
          if (realTxnId) {
            if (realTxnId !== transactionId) {
              console.log('🔑 handlePinSubmit: Replacing stored ID (invoice) with REAL transactionId from API:', realTxnId, '(was:', transactionId, ')');
            }
            transactionId = realTxnId;
            // Also update state so future calls use the correct ID
            setTradeData(prev => ({ ...prev, transactionId: realTxnId }));
            setPendingTransaction(prev => prev ? { ...prev, _id: realTxnId, id: realTxnId } : prev);
          }
        }
      } catch (apiErr) {
        console.warn('⚠️ Could not verify transaction ID from API, using stored ID:', apiErr.message);
      }
      
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      console.log('📦 Release payload:', {
        transactionId: transactionId,
        hasPin: !!transactionPin
      });

      // Use PUT /transaction/{id}/release-payment
      const result = await apiService.put(`/transaction/${transactionId}/release-payment`, {
        buyerPin: transactionPin
      });

      console.log('✅ Funds released successfully:', result);

      // 🔥 NEW: Mark transaction as completed to disable all trade UI permanently
      TradeStateManager.markCompleted(transactionId);
      // 🔥 Credentials persist after completion — buyer purchased the account

      // 🔥 Dispatch tradeCompleted event so tables can invalidate their caches
      const completedSellOrderId = tradeData?.sellOrderId || pendingTransaction?.sellOrderId;
      window.dispatchEvent(new CustomEvent('tradeCompleted', {
        detail: { transactionId, sellOrderId: completedSellOrderId }
      }));
      
      // 🔥 Deactivate trade timer
      setIsTradeTimerActive(false);
      setSellerTradeTimer(300);

      // Close all modals
      setShowReleaseFundsModal(false);
      setShowPinModal(false);
      setAgreeFullAccess(false);
      setTransactionPin('');
      setPendingTransaction(null);
      setPendingRequest(null);
      setActiveTransaction(null);
      setShowRequestModal(false);
      setShowSellerTradePrompt(false);

      // 🔥 NEW: Show full-screen transaction success modal for buyer
      const releasedAmount = pendingTransaction?.amountUSD || tradeData?.accountPrice || tradeData?.totalAmount || pendingTransaction?.amount || 0;
      const sellerName = selectedUser?.name || selectedUser?.displayName || tradeData?.seller?.name || 'Seller';
      const currency = pendingTransaction?.currency || tradeData?.paymentMethod || 'BTC';
      
      setTransactionSuccessData({
        role: 'buyer',
        amount: parseFloat(releasedAmount).toFixed(2),
        recipientName: sellerName,
        transactionId: transactionId,
        currency: currency
      });
      setShowTransactionSuccessModal(true);

    // 🔥 NEW: Send real-time notification to seller via chat channel
    try {
      if (currentChannel) {
        const sellerId = tradeData?.sellerId || pendingTransaction?.seller?.userId || pendingTransaction?.sellerId;
        const buyerName = userData?.displayName || userData?.name || userData?.username || 'Buyer';

        const fundsReleasedData = JSON.stringify({
          funds_released: true,
          transaction_id: transactionId,
          buyer_id: userData?._id || userData?.id,
          seller_id: sellerId,
          amount: parseFloat(releasedAmount).toFixed(2),
          currency: currency,
          buyer_name: buyerName,
          released_at: new Date().toISOString()
        });

        await currentChannel.sendMessage({
          text: `✅ Funds have been released successfully! Transaction completed.`,
          funds_released_data: fundsReleasedData
        });

        console.log('📨 Funds released notification sent to seller via chat');
      }
    } catch (notifyError) {
      console.error('⚠️ Failed to send funds released notification to seller:', notifyError);
      // Non-critical: buyer's release was successful even if notification fails
    }

      // Refresh channels
      await fetchChannels();

    } catch (error) {
      console.error('❌ Error releasing funds:', error);

      setShowPinModal(false);
      setTransactionPin('');

      setErrorModalData({
        message: error.message || 'Failed to release funds. Please try again.',
        details: {
          transactionId: tradeData?.transactionId
        }
      });
      setShowErrorModal(true);
    } finally {
      setIsProcessingTrade(false);
    }
  };


  const handleRejectRequest = async () => {
    // 🔥 FIX: Cancel the backend transaction so the sell order resets to 'active'
    // Without this, the seller gets "Sell order is not active" when trying to re-initiate
    const txnId = pendingRequest?.tradeData?.transactionId || tradeInitData?.transactionId;
    if (txnId) {
      try {
        console.log('❌ Cancelling transaction on decline:', txnId);
        await transactionService.cancelTransaction(txnId, 'Buyer declined the trade request');
        console.log('✅ Transaction cancelled, sell order should be active again');
        
        // Clear TradeStateManager as well
        TradeStateManager.clear();
      } catch (cancelError) {
        // Non-critical: still clear UI even if cancel fails
        console.warn('⚠️ Failed to cancel transaction on decline (non-critical):', cancelError.message);
      }
    }

    setShowRequestModal(false);
    setPendingRequest(null);
    setTradeInitData(null);
    // 🔥 Clear credential data on trade cancel/decline (per-channel)
    setShowCredentialModal(false);
    setCredentialData(null);
    const cancelChId = currentChannelRef.current?.id || currentChannelRef.current?.cid?.split(':')[1] || '';
    if (cancelChId) {
      localStorage.removeItem(`soctra_cred_${cancelChId}`);
    }
    setCurrentChannel(null);
    currentChannelRef.current = null;
    if (onBackToList) {
      onBackToList();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const fileObjects = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setSelectedFiles(prev => [...prev, ...fileObjects]);
    e.target.value = '';
  };

  const removeSelectedFile = (fileId) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const removed = prev.find(f => f.id !== fileId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const sendFilesAndMessage = async () => {
    const channel = currentChannelRef.current;
    const messageText = messageInputRef.current?.value?.trim();

    if (!channel) {
      console.log('❌ No channel available');
      return;
    }

    if (selectedFiles.length === 0 && !messageText) {
      console.log('❌ No files or message to send');
      return;
    }

    try {
      for (const fileObj of selectedFiles) {
        console.log('📤 Uploading file:', fileObj.name, fileObj.type);

        let uploadResponse;

        if (fileObj.type.startsWith('image/')) {
          uploadResponse = await chatService.uploadImage(channel, fileObj.file);
        } else {
          uploadResponse = await chatService.uploadFile(channel, fileObj.file);
        }

        console.log('✅ Upload response:', uploadResponse);

        const attachment = {
          type: fileObj.type.startsWith('image/') ? 'image' : 'file',
          asset_url: uploadResponse.file,
          title: fileObj.name,
          file_size: fileObj.size,
          mime_type: fileObj.type,
        };

        if (fileObj.type.startsWith('image/')) {
          attachment.image_url = uploadResponse.file;
          attachment.thumb_url = uploadResponse.file;
        }

        await chatService.sendMessage(channel, fileObj.type.startsWith('image/') ? messageText || '' : fileObj.name, [attachment]);
        console.log('✅ File message sent:', fileObj.name);
      }

      if (selectedFiles.length === 0 && messageText) {
        await chatService.sendMessage(channel, messageText);
      }

      if (messageInputRef.current) {
        messageInputRef.current.value = '';
      }

      selectedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setSelectedFiles([]);

      if (showRequestModal) {
        setShowRequestModal(false);
        setPendingRequest(null);
      }

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('❌ Error sending:', error);
      showError('Failed to send message. Please try again.');
    }
  };

  const handleSendMessage = useCallback(async () => {
    console.log('🔍 [SEND MESSAGE] handleSendMessage triggered');
    console.log('🔍 [SEND MESSAGE] Current input value:', messageInputRef.current?.value);
    console.log('🔍 [SEND MESSAGE] selectedFiles:', selectedFiles.length);
    console.log('🔍 [SEND MESSAGE] currentChannel:', !!currentChannel);
    await sendFilesAndMessage();
    console.log('🔍 [SEND MESSAGE] sendFilesAndMessage completed');
  }, [selectedFiles, currentChannel]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('🔍 [KEY PRESS] Enter key pressed, sending message');
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);



  const handleBackToList = () => {
    selectedFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setSelectedFiles([]);

    if (onBackToList) {
      onBackToList();
    }
  };

  const handleUserSelect = (user) => {
    // console.log('👤 Chat: User selected:', user);

    const currentUserId = userData?._id || userData?.id;
    const selectedUserId = user.id || user._id;

    if (selectedUserId === currentUserId) {
      console.error('❌ Cannot chat with yourself');
      return;
    }

    if (onSelectUser) {
      onSelectUser(user);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu && !event.target.closest('.options-menu-container')) {
        setShowOptionsMenu(false);
      }
      if (messageOptionsMenu && !event.target.closest('.message-options-container')) {
        setMessageOptionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptionsMenu, messageOptionsMenu]);

  // Modal Helper Functions
  const showConfirm = (title, message, onConfirm, type = 'danger') => {
    setConfirmModalData({
      title,
      message,
      onConfirm,
      type
    });
    setShowConfirmModal(true);
  };

  const showSuccess = (title, message) => {
    setSuccessModalData({ title, message });
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const showError = (message) => {
    setErrorModalData({ message });
    setShowErrorModal(true);
    setTimeout(() => setShowErrorModal(false), 3000);
  };

  const handleDeleteMessage = async (messageId) => {
    showConfirm(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      async () => {
        try {
          await chatService.deleteMessage(messageId);
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
          console.log('✅ Message deleted:', messageId);
          setMessageOptionsMenu(null);
          showSuccess('Message Deleted', 'The message has been successfully deleted.');
        } catch (error) {
          console.error('❌ Error deleting message:', error);
          showError('Failed to delete message. Please try again.');
        }
      }
    );
  };

  useEffect(() => {
    // Mark messages as read when user is viewing the channel
    if (currentChannel && messages.length > 0 && !showRequestModal) {
      const markMessagesAsRead = async () => {
        try {
          await chatService.markAsRead(currentChannel);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };

      // Mark as read after a short delay to ensure messages are visible
      const timeoutId = setTimeout(markMessagesAsRead, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, currentChannel, showRequestModal]);



  // 🔥 Timer Effect for Trade Timer (shared between buyer and seller)
  useEffect(() => {
    // ✅ FIXED: Timer only starts when isTradeTimerActive is true AND timer is < 300
    if (isTradeTimerActive && sellerTradeTimer > 0 && sellerTradeTimer < 300) {
      timerIntervalRef.current = setInterval(() => {
        setSellerTradeTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            // Timer expired - reset states
            setIsTradeTimerActive(false);
            setShowSellerTradePrompt(true); // Show button again
            return 300; // Reset timer
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [sellerTradeTimer, isTradeTimerActive]);


  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  const timerIntervalRef = useRef(null);


  const handleReportUser = () => {
    setShowOptionsMenu(false);
    showConfirm(
      'Report User',
      `Are you sure you want to report ${selectedUser.name || selectedUser.displayName}? Our team will review this report.`,
      () => {
        console.log('Reporting user:', selectedUser);
        showSuccess('User Reported', 'User has been reported. Our team will review this report.');
      },
      'warning'
    );
  };

  const handleClearChat = async () => {
    setShowOptionsMenu(false);
    showConfirm(
      'Clear Chat',
      'Are you sure you want to clear this chat? This will remove all messages but keep the conversation.',
      async () => {
        try {
          const channel = currentChannelRef.current;
          if (channel) {
            await chatService.clearChannel(channel);
            setMessages([]);
            await fetchChannels();
            console.log('✅ Chat cleared successfully');
            showSuccess('Chat Cleared', 'All messages have been successfully cleared.');
          }
        } catch (error) {
          console.error('❌ Error clearing chat:', error);
          showError('Failed to clear chat. Please try again.');
        }
      },
      'warning'
    );
  };





  const handleDeleteChat = async () => {
    setShowOptionsMenu(false);

    // 🔥 FIX: Get channel from currentChannelRef OR find it in channels array
    let channelToDelete = currentChannelRef.current || currentChannel;

    // If still no channel, try to find it from selectedUser
    if (!channelToDelete && selectedUser) {
      const chatUser = getChatUsersFromChannels().find(
        user => (user.id === selectedUser.id || user._id === selectedUser._id)
      );
      channelToDelete = chatUser?._channel;
    }

    if (!channelToDelete) {
      console.error('❌ No channel to delete');
      showError('No active chat to delete.');
      return;
    }

    console.log('🔍 Channel to delete found:', {
      id: channelToDelete.id,
      cid: channelToDelete.cid,
      source: currentChannelRef.current ? 'ref' : currentChannel ? 'state' : 'channels array'
    });

    const channelId = channelToDelete.id;
    const channelCid = channelToDelete.cid;
    const channelCidId = channelCid ? channelCid.split(':')[1] : null;
    const channel_Id = channelToDelete._id;

    // Extract base channel ID (without timestamp if present)
    const baseChannelId = channelId.split('_').slice(0, 3).join('_');

    console.log('🗑️ Channel identification:', {
      channelId,
      baseChannelId,
      cid: channelCid,
      cidParsed: channelCidId,
      _id: channel_Id,
      selectedUser: selectedUser?.name,
      selectedUserId: selectedUser?.id
    });

    showConfirm(
      'Delete Chat',
      'Are you sure you want to delete this chat? This will permanently remove the entire conversation from your view.',
      async () => {
        try {
          console.log('🗑️ Starting delete process for channel:', channelId);

          // 🔥 CRITICAL: Mark channel as deleted in localStorage
          const deletedChannels = JSON.parse(localStorage.getItem('deletedChannels') || '{}');
          deletedChannels[baseChannelId] = Date.now();
          localStorage.setItem('deletedChannels', JSON.stringify(deletedChannels));
          console.log('📝 Marked channel as deleted in localStorage:', baseChannelId);

          const result = await chatService.deleteChannel(channelToDelete);

          console.log('✅ Delete result:', result);

          // Immediate UI update - clear current view
          setMessages([]);
          setCurrentChannel(null);
          currentChannelRef.current = null;
          setPendingRequest(null);
          setShowRequestModal(false);
          setPendingTransaction(null);
          setShowAcceptanceNotification(false);

          console.log('🧹 Cleared current channel state');

          // Filter out the deleted channel from all possible matches
          setChannels(prevChannels => {
            const filtered = prevChannels.filter(c => {
              const cId = c.id;
              const cCid = c.cid;
              const cCidId = cCid ? cCid.split(':')[1] : null;
              const c_Id = c._id;

              // Check all possible ID variations
              const matchesById = cId === channelId ||
                cId === channelCidId ||
                cId === channel_Id ||
                cId === baseChannelId;

              const matchesByCid = cCidId === channelId ||
                cCidId === channelCidId ||
                cCidId === channel_Id ||
                cCidId === baseChannelId;

              const matchesBy_Id = c_Id === channelId ||
                c_Id === channelCidId ||
                c_Id === channel_Id ||
                c_Id === baseChannelId;

              const matchesByCidFull = cCid === channelCid;

              const isChannelToDelete = matchesById ||
                matchesByCid ||
                matchesBy_Id ||
                matchesByCidFull;

              if (isChannelToDelete) {
                console.log('🚫 Removing channel from list:', {
                  cId,
                  matched: matchesById ? 'byId' : matchesByCid ? 'byCid' : matchesBy_Id ? 'by_Id' : 'byCidFull'
                });
              }

              return !isChannelToDelete;
            });

            console.log('📊 Channels after deletion:', {
              before: prevChannels.length,
              after: filtered.length,
              removed: prevChannels.length - filtered.length
            });

            return filtered;
          });

          // Navigate back to list
          if (onBackToList) {
            console.log('⬅️ Navigating back to list');
            onBackToList();
          }

          // Refresh from server after delay
          setTimeout(async () => {
            try {
              console.log('🔄 Refreshing channels from server...');
              await fetchChannels();
              console.log('✅ Channels refreshed after deletion');
            } catch (error) {
              console.warn('⚠️ Error refreshing channels:', error);
            }
          }, 1000);

          const message = result.hidden
            ? 'Chat removed from your view successfully. A fresh chat will be created if you message this user again.'
            : 'Chat deleted successfully.';
          showSuccess('Chat Deleted', message);
        } catch (error) {
          console.error('❌ Error deleting chat:', error);
          showError('Failed to delete chat. Please try again.');
        }
      }
    );
  };



  const handleSellerInitiateTrade = async () => {
    try {
      console.log('🎯 Seller (User2) clicking "Ready to Initiate Trade"...');

      if (!currentChannel) {
        throw new Error('No active channel');
      }

      const currentUserId = userData?._id || userData?.id;
      const sellerName = userData?.displayName || userData?.name || 'Seller';

      // 🔥 FIXED: Send as regular message with custom data instead of system message
      await currentChannel.sendMessage({
        text: `📢 ${sellerName} is ready to initiate the trade. Please review and accept to proceed.`,
        user_id: currentUserId,
        // 🔥 REMOVED: type: 'system' - this causes the error
        // 🔥 ADDED: Use custom fields to track this as a special message
        seller_ready: true,
        seller_initiator_id: currentUserId,
        seller_name: sellerName,
        seller_ready_at: new Date().toISOString(),
        trade_price: selectedUser?.price || 'N/A',
        // 🔥 NEW: Mark as silent to prevent notification spam
        silent: true
      });

      console.log('✅ Seller marked as ready via custom message');

      setShowSellerTradePrompt(false);

      setSuccessModalData({
        title: 'Ready to Trade',
        message: 'You are ready! Waiting for buyer to accept the trade.'
      });
      setShowSuccessModal(true);

      await fetchChannels();

    } catch (error) {
      console.error('❌ Error marking seller as ready:', error);
      setErrorModalData({
        message: error.message || 'Failed to initiate trade. Please try again.'
      });
      setShowErrorModal(true);
    }
  };


  /**
   * FIXED: handleSellerTradeSubmit - Supports BOTH buy order and sell order flows
   * Uses walletService for better reliability and wallet address fetching
   * @param {Object} formData - Form data passed directly from modal (fixes race condition)
   */
  const handleSellerTradeSubmit = async (formData = null) => {
    try {
      console.log('💰 ============ STARTING TRANSACTION INITIATION ============');

      // 🔥 FIX: Use passed formData instead of stale state
      // This fixes the race condition where setSellerTradeData hasn't completed yet
      const tradeData = formData || sellerTradeData;

      // Update parent state for consistency (but don't rely on it for validation)
      if (formData) {
        setSellerTradeData(formData);
      }

      console.log('Form Data:', tradeData);

      // Step 1: Validate all required fields are filled (using passed data)
      if (!tradeData.accountEmail ||
        !tradeData.emailPassword ||
        !tradeData.accountPassword ||
        !tradeData.paymentMethod ||
        !tradeData.paymentNetwork ||
        !tradeData.offerPrice) {
        setErrorModalData({
          message: 'Please fill in all required fields'
        });
        setShowErrorModal(true);
        return;
      }

      setIsProcessingTrade(true);

      // 🔥 FIXED: Determine if this is a new trade initiation (no _channel means came from buysellTable)
      const isNewInitiation = !selectedUser?._channel;

      // 🔥 FIXED: Determine chat type - PRIORITIZE selectedUser.chatType for new initiations
      // Channel metadata chatType can be STALE from old deleted chats with reversed roles
      let chatType;
      if (isNewInitiation && selectedUser?.chatType) {
        // For new initiations, ALWAYS use the chatType from selectedUser (fresh from buysellTable)
        chatType = selectedUser.chatType;
        console.log('📊 Using FRESH chatType from new initiation:', chatType);
      } else {
        // For existing chats, try to get from channel metadata but fall back to selectedUser
        chatType = selectedUser?.chatType ||
          currentChannel?.data?.metadata?.chatType ||
          'buy';
        console.log('📊 Using chatType from existing context:', chatType);
      }

      console.log('📊 Final Chat Type:', chatType, '(isNewInitiation:', isNewInitiation, ')');

      // Step 3: Get order ID from selectedUser or channel metadata
      let orderId, buyerId, sellerId;

      if (chatType === 'sell') {
        // SELL ORDER: Current user is buyer, other user is seller
        orderId = selectedUser?.sellOrderId ||
          currentChannel?.data?.metadata?.sellOrderId ||
          currentChannel?.data?.metadata?.accountId;

        sellerId = selectedUser?.sellerId ||
          selectedUser?.id ||
          selectedUser?._id;

        buyerId = currentUserId; // Current user is the buyer

        console.log('🔍 Sell Order Context:', { orderId, sellerId, buyerId });

        if (!orderId) {
          throw new Error('Sell order ID not found. Please try reopening the chat.');
        }

      } else {
        // BUY ORDER: Current user is seller, other user is buyer
        orderId = selectedUser?.buyOrderId ||
          currentChannel?.data?.metadata?.buyOrderId ||
          currentChannel?.data?.metadata?.accountId;

        buyerId = selectedUser?.buyerId ||
          selectedUser?.id ||
          selectedUser?._id;

        sellerId = currentUserId; // Current user is the seller

        console.log('🔍 Buy Order Context:', { orderId, buyerId, sellerId });

        if (!orderId) {
          throw new Error('Buy order ID not found. Please try reopening the chat.');
        }
      }

      console.log(`📋 ${chatType === 'sell' ? 'Sell' : 'Buy'} Order ID:`, orderId);
      console.log('👥 User IDs - Buyer:', buyerId, 'Seller:', sellerId);

      // Step 5: Convert payment method to standardized currency code
      const currencyMap = {
        'BTC': 'btc',
        'ETH': 'eth',
        'USDT': 'usdt',
        'SOL': 'sol',
        'BNB': 'bnb',
        'TRX': 'trx'
      };
      const currency = currencyMap[tradeData.paymentMethod] ||
        tradeData.paymentMethod.toLowerCase();

      // Step 6: Convert payment network to API-compatible format
      const networkMap = {
        'Bitcoin': 'bitcoin',
        'Lightning Network': 'bitcoin',
        'Ethereum (ERC20)': 'ethereum',
        'Base': 'base',
        'Tron (TRC20)': 'tron',
        'Solana': 'solana',
        'BNB Smart Chain': 'binance'
      };
      const paymentNetwork = networkMap[tradeData.paymentNetwork] ||
        tradeData.paymentNetwork.toLowerCase();

      console.log('💳 Payment details - Currency:', currency, 'Network:', paymentNetwork);

      // ========================================
      // 🔥 FIXED: Only fetch CURRENT USER's wallet address
      // - For /sell-orders/initiate-transaction: buyerWalletAddress is auto-derived by backend
      // - For /buy-orders/initiate-transaction: buyerAddress comes from buy order, sellerAddress from current user
      // ========================================

      console.log('📡 Fetching current user wallet address...');

      let buyerAddress = null;
      let sellerAddress = null;

      try {
        // Only fetch the CURRENT user's wallet address for the selected currency
        const currentUserWalletAddress = await walletService.getWalletAddressForCurrency(
          currentUserId,
          currency
        );

        console.log('✅ Current user wallet address fetched:', currentUserWalletAddress);

        // Assign based on role
        if (chatType === 'sell') {
          // chatType='sell' → Current user responds to buy order → Current user is SELLER
          sellerAddress = currentUserWalletAddress;
          // buyerAddress will come from buy order response or be fetched separately if needed
          // For now, we'll try to get it but backend may have it
          try {
            buyerAddress = await walletService.getWalletAddressForCurrency(buyerId, currency);
          } catch (e) {
            console.log('📝 Buyer address will be derived by backend from buy order');
            buyerAddress = null;
          }
        } else {
          // chatType='buy' → Current user initiates from their sell order → Current user is SELLER
          sellerAddress = currentUserWalletAddress;
          // buyerWalletAddress is NOT required for /sell-orders/initiate-transaction
          // It's automatically derived from buyer's wallet using MEK decryption
          buyerAddress = null; // Backend derives this
        }

        console.log('✅ Wallet addresses assigned:', {
          buyerAddress: buyerAddress || '(to be derived by backend)',
          sellerAddress
        });

      } catch (walletError) {
        console.error('❌ Failed to fetch wallet address:', walletError);

        throw new Error(
          'Could not fetch your wallet address. Please ensure:\n' +
          '1. Your wallet is set up\n' +
          '2. You are connected to the internet\n' +
          '3. Try refreshing the page\n\n' +
          `Details: ${walletError.message}`
        );
      }

      // Validate current user's address (required)
      if (!sellerAddress) {
        throw new Error(
          'Your wallet address is missing. Please ensure your wallet is set up.'
        );
      }

      console.log('📡 Preparing transaction data...');

      // Step 7: Call invoice endpoint - /invoices/from-sell-order
      let response;

      // 🔥 Get the order ID based on chat type
      let invoiceOrderId;
      if (chatType === 'sell') {
        invoiceOrderId = currentChannel?.data?.metadata?.accountId ||
          currentChannel?.data?.metadata?.buyOrderId ||
          selectedUser?.buyOrderId ||
          orderId;
        console.log('🔍 BuyOrderId for invoice:', invoiceOrderId);
      } else {
        invoiceOrderId = currentChannel?.data?.metadata?.accountId ||
          currentChannel?.data?.metadata?.sellOrderId ||
          selectedUser?.sellOrderId ||
          selectedUser?._id ||
          orderId;
        console.log('🔍 SellOrderId for invoice:', invoiceOrderId);

        if (!invoiceOrderId || invoiceOrderId === 'undefined') {
          throw new Error('Sell order ID not found. Please ensure you have selected a valid sell order.');
        }
      }

      const invoicePayload = {
        sellOrderId: chatType === 'buy' ? invoiceOrderId : undefined,
        buyOrderId: chatType === 'sell' ? invoiceOrderId : undefined,
        buyerId: buyerId,
        sellerId: sellerId,
        accountOriginalEmail: tradeData.accountEmail,
        originalEmailPassword: tradeData.emailPassword,
        socialAccountPassword: tradeData.accountPassword,
        sellerWalletAddress: sellerAddress,
        buyerWalletAddress: buyerAddress,
        offerAmount: parseFloat(tradeData.offerPrice),
        amountUSD: parseFloat(tradeData.offerPrice),
        paymentMethod: currency,
        paymentNetwork: paymentNetwork
      };

      // Remove undefined keys
      Object.keys(invoicePayload).forEach(key => invoicePayload[key] === undefined && delete invoicePayload[key]);

      console.log('📦 Invoice Payload (/invoices/from-sell-order):', invoicePayload);

      // 🔥 NEW: Use /invoices/from-sell-order endpoint
      response = await apiService.post('/invoices/from-sell-order', invoicePayload);

      console.log('✅ Transaction initiated successfully:', response);

      // 🔥 Check if response indicates buyer has active transaction
      if (response && response.status === false && response.activeTransactionId) {
        console.log('🔄 Buyer has active transaction:', response.activeTransactionId);
        
        // 🔥 Send silent message with cancel request data to trigger modal on buyer's side
        if (currentChannel) {
          try {
            const currentUserId = userData?._id || userData?.id;
            // 🔥 Send as regular message with cancel_request_data JSON (similar to trade_init_data)
            const cancelRequestData = JSON.stringify({
              cancel_request: true,
              active_transaction_id: response.activeTransactionId,
              requester_id: currentUserId,
              buyer_id: buyerId,
              requested_at: new Date().toISOString()
            });
            
            await currentChannel.sendMessage({
              text: '🔔 A seller is requesting to trade with you. Please cancel or complete your active transaction.',
              cancel_request_data: cancelRequestData
            });
            console.log('📤 Sent cancel request to buyer');
          } catch (msgError) {
            console.error('❌ Failed to send cancel request:', msgError);
          }
        }
        
        // Close the seller initiate modal
        setShowSellerInitiateModal(false);
        
        // 🔥 Show informational modal to seller
        setErrorModalData({
          title: 'Buyer Has Active Transaction',
          message: `This buyer has an active transaction that must be completed or cancelled first.\n\nA cancel request has been sent to the buyer.`
        });
        setShowErrorModal(true);
        
        setIsProcessingTrade(false);
        return; // Exit early
      }

      // Step 9: Send notification message to the chat WITH TRADE INITIATION DATA
      if (currentChannel) {
        try {
          console.log('📤 Preparing to send trade initiation message...');
          console.log('📋 Channel ID:', currentChannel.id);
          console.log('📋 Channel CID:', currentChannel.cid);
          console.log('👥 Members:', Object.keys(currentChannel.state?.members || {}));
          console.log('👥 Member IDs:', Object.keys(currentChannel.state?.members || {}).join(', '));
          console.log('🔑 Current User ID:', currentUserId);
          console.log('🔑 Seller ID:', sellerId);
          console.log('🔑 Buyer ID:', buyerId);
          
          // 🔥 CRITICAL: Use custom field to store trade data (Stream Chat preserves this)
          const tradeInitData = {
            trade_initiated: true,
            transaction_id: response.transaction?._id || response.data?._id,
            seller_id: sellerId,
            buyer_id: buyerId,
            offer_amount: parseFloat(tradeData.offerPrice),
            payment_method: currency,
            payment_network: paymentNetwork,
            initiated_at: new Date().toISOString(),
            // 🔥 NEW: Include credentials for buyer
            account_original_email: tradeData.accountEmail,
            original_email_password: tradeData.emailPassword,
            social_account_password: tradeData.accountPassword,
            // 🔥 NEW: Include platform info 
            platform: channelMetadata?.platform || currentChannel?.data?.metadata?.platform || 'Unknown',
            account_username: channelMetadata?.accountUsername || currentChannel?.data?.metadata?.accountUsername || 'N/A',
            seller_name: userData?.displayName || userData?.name || userData?.username || 'Seller'
          };
          
          console.log('📦 Trade init data object:', tradeInitData);
          
          const tradeInitDataString = JSON.stringify(tradeInitData);
          console.log('📦 Trade init data (stringified):', tradeInitDataString);
          
          const messageData = {
            text: `🎉 Trade initiated! Seller has made an offer of $${tradeData.offerPrice} in ${tradeData.paymentMethod.toUpperCase()}`,
            // 🔥 Store custom data in a custom field that Stream Chat preserves
            trade_init_data: tradeInitDataString
          };
          
          console.log('📨 Sending message with data:', messageData);
          console.log('📨 Message text:', messageData.text);
          console.log('📨 Message has trade_init_data:', !!messageData.trade_init_data);
          
          const sentMessage = await currentChannel.sendMessage(messageData);
          
          console.log('✅ Trade initiation message sent successfully!');
          console.log('📬 Message ID:', sentMessage.message?.id);
          
          // 🔥 FIX: Update channel metadata with the actual offer price so both parties see it
          try {
            const existingMetadata = currentChannel.data?.metadata || {};
            await currentChannel.update({
              metadata: {
                ...existingMetadata,
                trade_price: String(tradeData.offerPrice),
                offer_amount: String(tradeData.offerPrice)
              }
            });
            console.log('✅ Channel trade_price updated to:', tradeData.offerPrice);
          } catch (metaError) {
            console.warn('⚠️ Could not update channel trade_price:', metaError);
          }
          
        } catch (msgError) {
          console.error('❌ CRITICAL: Could not send chat notification:', msgError);
          console.error('❌ Error details:', {
            message: msgError.message,
            stack: msgError.stack,
            channelId: currentChannel?.id,
            currentUserId,
            sellerId,
            buyerId
          });
          
          // Show error to seller
          setErrorModalData({
            message: 'Trade initiated but buyer notification failed. Please contact support with transaction ID: ' + 
                     (response.transaction?._id || response.data?._id || 'N/A')
          });
          setShowErrorModal(true);
        }
      } else {
        console.error('❌ CRITICAL: No current channel available to send message!');
        setErrorModalData({
          message: 'Trade initiated but notification system unavailable. Transaction ID: ' + 
                   (response.transaction?._id || response.data?._id || 'N/A')
        });
        setShowErrorModal(true);
      }

      // Step 10: Close modal and reset UI state
      setShowSellerInitiateModal(false);
      setShowSellerTradePrompt(false);
      setSellerTradeTimer(300);
      // 🔥 Trade timer is NOT activated here - it will be activated when buyer clicks "Initiate Trade" in TradeInitModal

      // Reset form data
      setSellerTradeData({
        accountEmail: '',
        emailPassword: '',
        accountPassword: '',
        paymentMethod: 'BTC',
        paymentNetwork: '',
        offerPrice: ''
      });

      // 🔥 NEW: Set active transaction for seller banner
      const transactionData = response.transaction || response.data;
      const transactionId = transactionData._id || transactionData.id;
      
      // 🔥 NEW: Set trade phase to 'seller_submitted' so buyer can see request
      TradeStateManager.setPhase(TradeStateManager.PHASES.SELLER_READY, {
        transactionId,
        tradeData: { ...tradeData },
      });
      
      setActiveTransaction({
        id: transactionId,
        status: 'pending',
        role: 'seller', // Current user is seller
        amount: parseFloat(tradeData.offerPrice),
        currency: tradeData.paymentMethod,
        createdAt: new Date().toISOString(),
        buyerId: buyerId,
        sellerId: sellerId
      });

      // 🔥 REMOVED: Success modal - only banner should show now
      // The transaction banner will be visible instead

    } catch (error) {
      console.error('❌ Transaction initiation failed:', error);

      // 🔥 Check if response is about buyer's active transaction
      // The error object may contain the API response data OR be in the error message
      const errorResponse = error.response?.data || error.data || null;
      
      // 🔥 Extract activeTransactionId from error message if not in response object
      let activeTransactionId = errorResponse?.activeTransactionId;
      
      // Also try to extract from error message string (e.g., "...activeTransactionId: 697dfdd98a28b49a6d94be96")
      if (!activeTransactionId && error.message?.includes('active transaction')) {
        // Try to parse the error message for activeTransactionId
        const idMatch = error.message?.match(/activeTransactionId[:\s]+["']?([a-f0-9]{24})["']?/i);
        if (idMatch) {
          activeTransactionId = idMatch[1];
        }
      }
      
      // Check if this is the "buyer has active transaction" error
      const isActiveTransactionError = (
        (errorResponse?.status === false && activeTransactionId) ||
        (error.message?.includes('active transaction') && activeTransactionId) ||
        (error.message?.includes('Buyer has an active transaction'))
      );
      
      if (isActiveTransactionError || activeTransactionId) {
        console.log('🔄 Buyer has active transaction:', activeTransactionId);
        
        // 🔥 Get buyer ID from selectedUser (fix undefined buyerId issue)
        const theBuyerId = selectedUser?.buyerId || selectedUser?.id || selectedUser?._id;
        
        // 🔥 Send message with cancel request data to trigger modal on buyer's side
        if (currentChannel) {
          try {
            const currentUserId = userData?._id || userData?.id;
            const cancelRequestData = JSON.stringify({
              cancel_request: true,
              active_transaction_id: activeTransactionId,
              requester_id: currentUserId,
              buyer_id: theBuyerId,
              requested_at: new Date().toISOString()
            });
            
            await currentChannel.sendMessage({
              text: '🔔 A seller is requesting to trade with you. Please cancel or complete your active transaction.',
              cancel_request_data: cancelRequestData
            });
            console.log('📤 Sent cancel request to buyer');
          } catch (msgError) {
            console.error('❌ Failed to send cancel request:', msgError);
          }
        }
        
        // 🔥 NEW: Fetch the active transaction details using getTransactionById
        // This allows the buyer to see the release funds modal when they return
        if (activeTransactionId) {
          try {
            console.log('📡 Fetching active transaction details:', activeTransactionId);
            const txnDetails = await transactionService.getTransactionById(activeTransactionId);
            
            if (txnDetails?.data || txnDetails?.transaction || txnDetails) {
              const activeTxn = txnDetails.data || txnDetails.transaction || txnDetails;
              const txnBuyerId = activeTxn.buyer?.userId || activeTxn.buyer?._id || activeTxn.buyerId;
              const txnSellerId = activeTxn.seller?.userId || activeTxn.seller?._id || activeTxn.sellerId;
              const currentUserId = userData?._id || userData?.id;
              
              console.log('💰 Active transaction fetched:', {
                transactionId: activeTxn._id || activeTxn.id,
                status: activeTxn.status,
                amount: activeTxn.amount,
                currency: activeTxn.currency,
                buyerId: txnBuyerId,
                sellerId: txnSellerId, 
                currentUserId,
                currentUserIsBuyer: txnBuyerId === currentUserId || String(txnBuyerId) === String(currentUserId)
              });
              
              // If current user is actually the buyer, show the release funds modal
              const currentUserIsBuyer = txnBuyerId === currentUserId || String(txnBuyerId) === String(currentUserId);
              
              if (currentUserIsBuyer) {
                console.log('🔔 Current user is buyer - showing release funds modal');
                
                // Prepare trade init data for TradeInitModal
                const tradeInitDataForBuyer = {
                  transactionId: activeTxn._id || activeTxn.id || activeTransactionId,
                  sellerId: txnSellerId,
                  buyerId: txnBuyerId,
                  accountPrice: parseFloat(activeTxn.amountUSD || activeTxn.amount || 0),
                  paymentMethod: (activeTxn.currency || 'BTC').toUpperCase(),
                  paymentNetwork: activeTxn.network || 'bitcoin',
                  initiatedAt: activeTxn.createdAt,
                  sellOrderId: activeTxn.sellOrderId,
                  accountId: activeTxn.socialAccountId,
                  socialAccount: activeTxn.platform || 'Unknown',
                  accountUsername: activeTxn.accountUsername || 'N/A',
                  seller: {
                    id: txnSellerId,
                    name: activeTxn.seller?.displayName || activeTxn.seller?.name || selectedUser?.name || 'Seller',
                    image: activeTxn.seller?.avatar || activeTxn.seller?.bitmojiUrl || selectedUser?.image || ug1,
                    ratings: '⭐ 4.5 (New)'
                  },
                  isFromActiveCheck: true
                };
                
                // Calculate transaction fee
                const transactionFee = tradeInitDataForBuyer.accountPrice * 0.025;
                tradeInitDataForBuyer.transactionFee = transactionFee;
                tradeInitDataForBuyer.totalAmount = tradeInitDataForBuyer.accountPrice + transactionFee;
                
                // Close seller initiate modal and show trade init modal
                setShowSellerInitiateModal(false);
                setTradeInitData(tradeInitDataForBuyer);
                setActiveTransaction(activeTxn);
                setShowTradeInitModal(true);
                
                console.log('✅ TradeInitModal opened for buyer to release funds');
                setIsProcessingTrade(false);
                return; // Exit early
              }
            }
          } catch (txnError) {
            console.warn('⚠️ Could not fetch active transaction details:', txnError.message);
          }
        }
        
        // Close the seller initiate modal
        setShowSellerInitiateModal(false);
        
        // 🔥 Show informational modal to seller
        setErrorModalData({
          title: 'Buyer Has Active Transaction',
          message: `This buyer has an active transaction that must be completed or cancelled first.\n\nA cancel request has been sent to the buyer.`
        });
        setShowErrorModal(true);
        
        setIsProcessingTrade(false);
        return; // Exit early
      }

      // Provide more helpful error messages based on error type
      let errorMessage = error.message || 'Failed to initiate trade. Please try again.';

      // Check for specific error types
      if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (error.message?.includes('wallet address') || (error.message?.includes('No') && error.message?.includes('wallet'))) {
        errorMessage = 'Wallet address not found. Please ensure both you and the buyer have set up wallets. You may need to refresh the page.';
      } else if (error.message?.includes('insufficient balance')) {
        errorMessage = 'Buyer has insufficient balance to complete this transaction.';
      } else if (error.message?.includes('Sell order is not active') || error.message?.includes('not active')) {
        // 🔥 Handle "Sell order is not active" - show cancel trade modal for seller
        setShowSellerInitiateModal(false);
        setErrorModalData({
          title: 'Sell Order Not Active',
          message: 'This sell order is no longer active. This may be because the order has been cancelled, sold, or expired.\n\nPlease refresh the page or check your listings.',
          canRetry: false,
          showCancelOption: true
        });
        setShowErrorModal(true);
        setIsProcessingTrade(false);
        return;
      } else if (error.message?.includes('active transaction')) {
        errorMessage = 'One of the parties already has an active transaction. Please complete or cancel it first.';
      } else if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
        errorMessage = 'Server is temporarily unavailable. Please try again in a few moments.';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'Connection blocked by browser. Please contact support if this persists.';
      }

      setErrorModalData({
        message: errorMessage
      });
      setShowErrorModal(true);
    } finally {
      setIsProcessingTrade(false);
    }
  };





  const handleBlockUser = () => {
    setShowOptionsMenu(false);
    showConfirm(
      'Block User',
      `Are you sure you want to block ${selectedUser.name || selectedUser.displayName}? You won't be able to receive messages from this user.`,
      () => {
        console.log('Blocking user:', selectedUser);
        showSuccess('User Blocked', 'User has been blocked successfully.');
        if (onBackToList) {
          onBackToList();
        }
      }
    );
  };


  const handleCancelTrade = async () => {
    try {
      console.log('🚫 Cancelling trade...');
      setIsProcessingTrade(true);

      // 🔥 FIX: Fetch the real transaction _id from /transaction/current
      let transactionId = tradeData?.transactionId || pendingTransaction?._id || pendingTransaction?.id;
      try {
        const activeCheck = await checkActiveTransactions();
        if (activeCheck?.hasActiveTransaction && activeCheck?.activeTransaction) {
          const realTxnId = activeCheck.activeTransaction._id || activeCheck.activeTransaction.id;
          if (realTxnId) {
            if (realTxnId !== transactionId) {
              console.log('🔑 handleCancelTrade: Replacing stored ID (invoice) with REAL transactionId from API:', realTxnId, '(was:', transactionId, ')');
            }
            transactionId = realTxnId;
          }
        }
      } catch (apiErr) {
        console.warn('⚠️ Could not verify transaction ID from API for cancel, using stored ID:', apiErr.message);
      }

      // Cancel the transaction via API
      if (transactionId) {
        try {
          await apiService.put(`/transaction/${transactionId}/cancel`);
          console.log('✅ Transaction cancelled via API:', transactionId);
        } catch (cancelErr) {
          console.warn('⚠️ Failed to cancel transaction via API:', cancelErr.message);
        }
      }

      // Stop the timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Reset timer and hide prompt
      setSellerTradeTimer(900);
      setIsTradeTimerActive(false); // 🔥 NEW: Deactivate trade timer
      setShowSellerTradePrompt(false);

      // Optional: Send cancellation message to channel
      if (currentChannel) {
        const currentUserId = userData?._id || userData?.id;
        await currentChannel.sendMessage({
          text: `❌ Trade cancelled by seller.`,
          user_id: currentUserId,
          trade_cancelled: true,
          cancelled_at: new Date().toISOString(),
          silent: true
        });
      }

      // 🔥 FIX: Clear all trade state so Release Funds button disappears
      setPendingTransaction(null);
      setActiveTransaction(null);
      setPendingRequest(null);
      setShowRequestModal(false);
      setShowReleaseFundsModal(false);
      TradeStateManager.clear();

      setSuccessModalData({
        title: 'Trade Cancelled',
        message: 'The trade has been cancelled successfully.'
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('❌ Error cancelling trade:', error);
      setErrorModalData({
        message: error.message || 'Failed to cancel trade. Please try again.'
      });
      setShowErrorModal(true);
    } finally {
      setIsProcessingTrade(false);
    }
  };



  const getChatUsersFromChannels = () => {
    const currentUserId = userData?._id || userData?.id;

    // 🔥 FIXED: Only filter channels that THIS user specifically deleted
    const visibleChannels = channels.filter(channel => {
      const channelId = channel.id || (channel.cid ? channel.cid.split(':')[1] : null);

      // Extract base channel ID for deletion marker lookup
      const idParts = channelId?.split('_') || [];
      const baseChannelId = idParts.length >= 3 ? idParts.slice(0, 3).join('_') : channelId;

      // Check if channel is hidden for current user via Stream API
      const membership = channel.state?.membership;
      const isHidden = membership?.hidden === true;

      // 🔥 ONLY check user-specific deletion marker (for immediate UI update after delete)
      const userDeletionKey = `deletedChannel_${currentUserId}_${baseChannelId}`;
      const wasDeletedByUser = localStorage.getItem(userDeletionKey) !== null;

      // Only exclude if: hidden by Stream OR specifically deleted by THIS user
      const shouldExclude = isHidden || wasDeletedByUser;

      return !shouldExclude;
    });

    return visibleChannels.map((channel) => {
      const otherMembers = Object.values(channel.state.members).filter(
        (member) => member.user_id !== currentUserId
      );

      const otherUser = otherMembers[0]?.user;
      const lastMessage = channel.state.messages[channel.state.messages.length - 1];
      const unreadCount = chatService.getUnreadCount(channel);

      const isOutgoing = lastMessage?.user?.id === currentUserId;

      let messageStatus = null;
      if (isOutgoing && lastMessage) {
        const hasReadBy = lastMessage.read_by && typeof lastMessage.read_by === 'object';
        const readByOthers = hasReadBy ?
          Object.keys(lastMessage.read_by).some(userId => userId !== currentUserId && userId !== String(currentUserId)) : false;

        const isDelivered = lastMessage.status === 'received' ||
          lastMessage.status === 'delivered' ||
          lastMessage.status === 'read';

        if (readByOthers) {
          messageStatus = 'read';
        } else if (isDelivered) {
          messageStatus = 'delivered';
        } else {
          messageStatus = 'sent';
        }
      }

      const userImage = getUserImage(otherUser);

      // Extract chatType from channel ID
      const channelId = channel.id || channel.cid?.split(':')[1] || '';
      let chatType = extractChatTypeFromChannelId(channelId);

      if (!chatType || (chatType !== 'buy' && chatType !== 'sell')) {
        if (channel.data?.metadata && typeof channel.data.metadata === 'object') {
          chatType = channel.data.metadata.chatType || 'buy';
        } else {
          try {
            const channelName = channel.data?.name || '';
            const parts = channelName.split('|');

            if (parts.length > 1) {
              const parsed = JSON.parse(parts[1]);
              chatType = parsed.chatType || 'buy';
            } else {
              chatType = 'buy';
            }
          } catch (e) {
            chatType = 'buy';
          }
        }
      }

      let trade_price = 'N/A';
      let accountId = undefined;

      if (channel.data?.metadata) {
        trade_price = channel.data.metadata.trade_price || 'N/A';
        accountId = channel.data.metadata.accountId;
      } else {
        try {
          const channelName = channel.data?.name || '';
          const parts = channelName.split('|');
          if (parts.length > 1) {
            const parsed = JSON.parse(parts[1]);
            trade_price = parsed.trade_price || 'N/A';
            accountId = parsed.accountId;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      return {
        id: otherUser?.id || 'unknown',
        _id: otherUser?.id || 'unknown',
        name: otherUser?.name || 'Unknown User',
        displayName: otherUser?.name || 'Unknown User',
        price: trade_price,
        lastMessage: lastMessage?.text || 'No messages yet',
        time: lastMessage ? formatTime(new Date(lastMessage.created_at)) : '',
        unreadCount: unreadCount,
        avatar: userImage,
        profileImage: userImage,
        bitmojiUrl: otherUser?.image,
        avatarUrl: otherUser?.image,
        image: userImage,
        status: otherUser?.online ? 'online' : 'offline',
        isOutgoing: isOutgoing,
        messageStatus: messageStatus,
        chatType: chatType,
        accountId: accountId,
        _channel: channel,
        _tradeCompleted: channel._tradeCompleted || false,
      };
    });
  };





  useEffect(() => {
    if (!currentChannel) {
      return;
    }

    // Ensure channel is being watched
    const ensureWatching = async () => {
      try {
        await currentChannel.watch();
        console.log('👀 Channel is being watched:', currentChannel.id);
      } catch (error) {
        console.error('❌ Error watching channel:', error);
      }
    };

    ensureWatching();

    // Set up interval to periodically check connection
    const intervalId = setInterval(() => {
      if (currentChannel && currentChannelRef.current) {
        console.log('🔄 Channel still active:', {
          id: currentChannel.id,
          messagesCount: messages.length
        });
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [currentChannel]);



  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes}${ampm}`;
  };
  const chatUsers = getChatUsersFromChannels();
  const currentUserId = userData?._id || userData?.id;

  // 🔥 NEW LOGIC: Determine user's role in each channel
  const filteredUsers = chatUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

    const channel = user._channel;
    const channelMetadata = channel?.data?.metadata || {};
    let channelCreatorId = channelMetadata.initiator_id;

    // Fallback: Try parsing from channel name if metadata not available
    if (!channelCreatorId) {
      try {
        const channelName = channel?.data?.name || '';
        const parts = channelName.split('|');
        if (parts.length > 1) {
          const parsed = JSON.parse(parts[1]);
          channelCreatorId = parsed.initiator_id;
        }
      } catch (e) {
        // Fallback to created_by_id
        channelCreatorId = channel?.data?.created_by_id;
      }
    }

    // Determine if current user is the initiator
    const isInitiator = channelCreatorId === currentUserId ||
      channelCreatorId === String(currentUserId);

    // Get the channel's base chatType from the channel ID or metadata
    const baseChatType = user.chatType; // This is the stored chatType ('buy' or 'sell')

    // 🔥 ROLE-BASED DISPLAY:
    // - If user is INITIATOR of a 'buy' channel → show in "Buy" tab
    // - If user is RECEIVER of a 'buy' channel → show in "Sell" tab
    // - If user is INITIATOR of a 'sell' channel → show in "Sell" tab
    // - If user is RECEIVER of a 'sell' channel → show in "Buy" tab

    // 🔥 SIMPLIFIED LOGIC: Always show based on who initiated
    // - INITIATOR → Always sees it in "Buy" tab (they initiated the trade)
    // - RECEIVER → Always sees it in "Sell" tab (they received the trade request)
    // This ensures consistent behavior after chat deletion when roles may swap
    const shouldShowInBuyTab = isInitiator;
    const shouldShowInSellTab = !isInitiator;

    const matchesTab = activeTab === 'Buy' ? shouldShowInBuyTab : shouldShowInSellTab;

    return matchesSearch && matchesTab;
  });

  // 🔥 ROLE-BASED: Calculate unread counts
  const buyUnreadCount = chatUsers
    .filter(user => {
      const channel = user._channel;
      const channelMetadata = channel?.data?.metadata || {};
      let channelCreatorId = channelMetadata.initiator_id;

      if (!channelCreatorId) {
        try {
          const channelName = channel?.data?.name || '';
          const parts = channelName.split('|');
          if (parts.length > 1) {
            const parsed = JSON.parse(parts[1]);
            channelCreatorId = parsed.initiator_id;
          }
        } catch (e) {
          channelCreatorId = channel?.data?.created_by_id;
        }
      }

      const isInitiator = channelCreatorId === currentUserId ||
        channelCreatorId === String(currentUserId);

      // 🔥 SIMPLIFIED: Initiator always Buy tab
      return isInitiator;
    })
    .reduce((total, user) => total + user.unreadCount, 0);

  const sellUnreadCount = chatUsers
    .filter(user => {
      const channel = user._channel;
      const channelMetadata = channel?.data?.metadata || {};
      let channelCreatorId = channelMetadata.initiator_id;

      if (!channelCreatorId) {
        try {
          const channelName = channel?.data?.name || '';
          const parts = channelName.split('|');
          if (parts.length > 1) {
            const parsed = JSON.parse(parts[1]);
            channelCreatorId = parsed.initiator_id;
          }
        } catch (e) {
          channelCreatorId = channel?.data?.created_by_id;
        }
      }

      const isInitiator = channelCreatorId === currentUserId ||
        channelCreatorId === String(currentUserId);

      // 🔥 SIMPLIFIED: Receiver always Sell tab
      return !isInitiator;
    })
    .reduce((total, user) => total + user.unreadCount, 0);

  // Emit total unread count for navbar badge
  useEffect(() => {
    const totalUnread = buyUnreadCount + sellUnreadCount;
    window.dispatchEvent(new CustomEvent('chatUnreadCountUpdate', {
      detail: { totalUnread }
    }));
  }, [buyUnreadCount, sellUnreadCount]);

  // 🔥 NEW: Transaction Countdown Banner Component with 15-minute timer
  const TransactionCountdownBanner = ({ 
    activeTransaction, 
    setActiveTransaction, 
    setPendingTransaction,
    setSuccessModalData,
    setShowSuccessModal,
    setErrorModalData,
    setShowErrorModal,
    setShowCancelTradeModal,
    setShowAppealMenu,
    showAppealMenu,
    handleReportUser
  }) => {
    const [timeRemaining, setTimeRemaining] = React.useState(900); // 15 minutes = 900 seconds
    const timerRef = React.useRef(null);

    // Calculate time remaining from createdAt
    React.useEffect(() => {
      if (!activeTransaction?.createdAt) {
        setTimeRemaining(900); // Default 15 minutes
        return;
      }

      const initiatedTime = new Date(activeTransaction.createdAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - initiatedTime) / 1000);
      const remainingSeconds = Math.max(0, 900 - elapsedSeconds); // 15 mins = 900 seconds
      
      setTimeRemaining(remainingSeconds);

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer expired - auto cancel trade
            clearInterval(timerRef.current);
            handleAutoCancel();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [activeTransaction?.createdAt]);

    // Auto-cancel function when timer expires
    const handleAutoCancel = async () => {
      // 🔥 FIX: Fetch real transaction _id from /transaction/current
      let transactionId = activeTransaction?.id || activeTransaction?._id;
      try {
        const activeCheck = await checkActiveTransactions();
        if (activeCheck?.hasActiveTransaction && activeCheck?.activeTransaction) {
          const realTxnId = activeCheck.activeTransaction._id || activeCheck.activeTransaction.id;
          if (realTxnId) {
            if (realTxnId !== transactionId) {
              console.log('🔑 handleAutoCancel: Replacing stored ID with REAL transactionId from API:', realTxnId, '(was:', transactionId, ')');
            }
            transactionId = realTxnId;
          }
        }
      } catch (apiErr) {
        console.warn('⚠️ Could not verify transaction ID from API for auto-cancel, using stored ID:', apiErr.message);
      }
      if (transactionId) {
        try {
          console.log('⏰ Trade timer expired - auto cancelling transaction:', transactionId);
          const response = await apiService.put(`/transaction/${transactionId}/cancel`);
          if (response.status) {
            setSuccessModalData({
              title: 'Trade Expired',
              message: 'The trade has been automatically cancelled due to timeout (15 minutes).'
            });
            setShowSuccessModal(true);
            setActiveTransaction(null);
            setPendingTransaction(null);
          }
        } catch (error) {
          console.error('Error auto-cancelling trade:', error);
          setErrorModalData({
            message: error.message || 'Failed to auto-cancel trade'
          });
          setShowErrorModal(true);
        }
      }
    };

    // Format time remaining as MM:SS
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="flex items-center justify-center w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-extralight text-xs">Trade has been Initiated</h3>
          </div>
          <div className={`flex items-center gap-1 text-white bg-[#222125] text-xs py-2 px-3 rounded-full font-mono ml-2 ${timeRemaining <= 60 ? 'border border-red-500/50' : timeRemaining <= 300 ? 'border border-yellow-500/50' : ''}`}>
            <div className='flex items-center gap-1 text-xs'>
              <Clock className={`w-5 h-5 ${timeRemaining <= 60 ? 'text-red-400 animate-pulse' : timeRemaining <= 300 ? 'text-yellow-400' : 'text-purple-400'}`} />
              <p className='text-xs'>Time Left</p>
            </div>
            <span className={`font-bold ${timeRemaining <= 60 ? 'text-red-400' : timeRemaining <= 300 ? 'text-yellow-400' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-3">
            <button
              onClick={() => setShowCancelTradeModal(true)}
              className="flex-1 px-3 rounded-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
            >
              Cancel Trade
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  // Open Zendesk chat widget for appeal
                  if (window.zE) {
                    window.zE('messenger', 'open');
                  } else {
                    window.open('https://soctraltechnologyhelp.zendesk.com', '_blank');
                  }
                }}
                className="flex ml-0 items-end justify-end gap-2 px-4 py-2  hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Appeal
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Modal Components
  const ConfirmModal = () => {
    if (!showConfirmModal || !confirmModalData) return null;

    const typeColors = {
      danger: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full border border-white/10 shadow-2xl animate-scale-in">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full ${typeColors[confirmModalData.type] || typeColors.danger} bg-opacity-20 flex items-center justify-center`}>
                <AlertCircle className={`w-6 h-6 ${confirmModalData.type === 'danger' ? 'text-red-500' : confirmModalData.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
              </div>
              <h3 className="text-xl font-bold text-white">{confirmModalData.title}</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">{confirmModalData.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmModalData(null);
                }}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModalData.onConfirm();
                  setShowConfirmModal(false);
                  setConfirmModalData(null);
                }}
                className={`flex-1 px-4 py-3 ${confirmModalData.type === 'danger' ? 'bg-red-500 hover:bg-red-600' : confirmModalData.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors font-medium`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const TradeInitModal = () => {
    if (!showTradeInitModal || !tradeInitData) return null;

    // 🔥 FIX: Get currency image mapping
    const getCurrencyImage = (currency) => {
      const imageMap = {
        'BTC': btc,
        'ETH': eth,
        'USDT': usdt,
        'SOL': solana,
        'BNB': bnb,
        'TRX': tron,
        'btc': btc,
        'eth': eth,
        'usdt': usdt,
        'sol': solana,
        'bnb': bnb,
        'trx': tron
      };
      return imageMap[currency] || btc;
    };

    // 🔥 Format amount to show proper decimal places for small crypto values
    const formatAmount = (amount) => {
      if (!amount || amount === 0) return '0.00';
      // For very small amounts (< 0.01), show more decimal places
      if (amount < 0.01) {
        return amount.toFixed(6);
      } else if (amount < 1) {
        return amount.toFixed(4);
      }
      return amount.toFixed(2);
    };

    // 🔥 FIX: Get fee from feeUSD field (primary) or transactionFee (fallback)
    const feeUSD = tradeInitData.feeUSD || tradeInitData.company?.feeUSD || tradeInitData.transactionFee || 0;
    const currencyImage = getCurrencyImage(tradeInitData.paymentMethod);
    
    // 🔥 FIX: Get platform/social account info - use channelMetadata as fallback
    const platformName = tradeInitData.socialAccount || tradeInitData.platform || channelMetadata?.platform || 'Unknown';
    const platformIcon = tradeInitData.seller?.social || getSocialIcon(platformName);
    // 🔥 FIX: accountUsername should come from channelMetadata (not user's name)
    const accountUsername = channelMetadata?.accountUsername || tradeInitData.accountUsername || 'N/A';

    console.log('🔍 TradeInitModal Data:', {
      platformName,
      platformIcon,
      accountUsername,
      feeUSD,
      currencyImage,
      paymentMethod: tradeInitData.paymentMethod,
      tradeInitData,
      channelMetadata
    });

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
        <div className="bg-[rgba(13,13,13,1)] rounded-2xl max-w-lg w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">

            <div className='bg-[#1a1a1a] p-5 rounded-xl'>
              {/* Trade Details Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md font-bold text-white">Trade Details</h2>
              </div>

              <div className="flex items-center py-2 gap-2">
                <span className="text-gray-400 text-sm">Seller</span>
                <span><img src={tradeInitData.seller?.image} alt="" className='h-8 w-8 rounded-full' onError={(e) => e.target.style.display = 'none'} /></span>
                <span className="text-white font-medium text-sm">{tradeInitData.seller?.name || 'Seller'}</span>
                <span className="text-white font-medium text-sm">{tradeInitData.seller?.ratings || ''}</span>
              </div>


              <div className="flex items-center py-2 gap-2">
                <span className="text-gray-400 text-sm">Social Account</span>
                <img src={currencyImage} alt={tradeInitData.paymentMethod} className="w-6 h-6" />
                <span className="text-white font-medium text-sm capitalize">
                  {platformName !== 'Unknown' ? platformName : (tradeInitData.paymentNetwork || tradeInitData.paymentMethod || 'N/A')}
                </span>
              </div>




              <div className="flex items-center py-2 gap-2">
                <span className="text-gray-400 text-sm">Account Username</span>
                <span className="text-white font-medium text-sm">
                  {accountUsername !== 'N/A' ? accountUsername : (tradeInitData.seller?.name || 'N/A')}
                </span>
              </div>


              <div className="flex items-center py-2 gap-2">
                <span className="text-gray-400 text-sm">Payment Method</span>
                <div className="flex items-center gap-2">
                  <img src={currencyImage} alt={tradeInitData.paymentMethod} className="w-6 h-6" />
                  <span className="text-white font-medium text-sm">{tradeInitData.paymentMethod}</span>
                </div>
              </div>

              <div className='flex border-t items-center border-b border-white/10'>

                <div className="flex items-center py-2 gap-2 pr-[1.5rem] border-r border-white/10">
                  <span className="text-gray-400 text-sm">Account Price</span>
                  <span className="text-white font-medium text-sm">${formatAmount(tradeInitData.accountPrice)}</span>
                </div>



                <div className="flex items-center py-2 gap-2 py-6 pl-[1.5rem]">
                  <span className="text-gray-400 text-sm">Transaction Fee</span>
                  <span className="text-white font-medium text-sm">${formatAmount(feeUSD)}</span>
                </div>

              </div>

              <div className="flex flex-col items-center py-3 rounded-lg px-4">
                <span className="text-gray-400 font-semibold text-sm">Total Amount</span>
                <span className="text-white font-bold text-sm">${formatAmount(tradeInitData.totalAmount)}</span>
              </div>

            </div>

            <div className="bg-[#1a1a1a] rounded-xl mt-5 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-sm mb-2">DISCLAIMER!</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Before proceeding, ensure you have thoroughly verified the account you intend to purchase from <span className='font-black text-white'>{tradeInitData.seller?.name || 'the seller'}</span>. By clicking "Proceed", you acknowledge that the trade amount of <span className='font-black text-white'>${formatAmount(tradeInitData.totalAmount)} </span> will be locked in your <span className='font-black text-white'>{tradeInitData.paymentMethod} wallet</span> for the duration of the trade and can only be released upon completion of the trade or dispute resolution.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeVerified}
                  onChange={(e) => setAgreeVerified(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  I agree that I have confirmed the account and I'm satisfied with my findings
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeLocked}
                  onChange={(e) => setAgreeLocked(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  I accept that the trade amount should be locked in my account to initiate this trade
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  // 🔥 NEW: Accept invoice via /invoices/accept endpoint
                  const invoiceId = tradeInitData.invoiceId || tradeInitData.transactionId || tradeInitData._id;
                  if (invoiceId) {
                    try {
                      setIsProcessingTrade(true);
                      console.log('📡 Accepting invoice:', invoiceId);
                      const acceptResponse = await apiService.post('/invoices/accept', { invoiceId });
                      console.log('✅ Invoice accepted:', acceptResponse);

                      // 🔥 FIX: Capture real transactionId from accept response (NOT the invoiceId)
                      const realTransactionId = acceptResponse?.transactionId || acceptResponse?.transaction?.id || acceptResponse?.transaction?._id || acceptResponse?.data?.transactionId || acceptResponse?.data?.transaction?.id || acceptResponse?.data?.transaction?._id;
                      if (realTransactionId) {
                        console.log('🔑 Got REAL transactionId from accept response:', realTransactionId, '(invoiceId was:', invoiceId, ')');
                        // Update tradeInitData so downstream code uses the real transaction ID
                        tradeInitData.transactionId = realTransactionId;
                        tradeInitData._id = realTransactionId;
                      } else {
                        console.warn('⚠️ /invoices/accept response did not contain transactionId. Response:', JSON.stringify(acceptResponse));
                      }
                    } catch (acceptError) {
                      console.error('❌ Failed to accept invoice:', acceptError);
                      
                      // 🔥 Check for insufficient balance error specifically
                      const errorData = acceptError.data || acceptError.response?.data;
                      const isInsufficientFunds = acceptError.message?.toLowerCase().includes('insufficient balance') || 
                        acceptError.message?.toLowerCase().includes('insufficient fund');
                      
                      if (isInsufficientFunds && errorData) {
                        const availableBalance = parseFloat(errorData.availableBalance || 0);
                        const requiredAmount = parseFloat(errorData.requiredAmount || 0);
                        const frozenAmount = parseFloat(errorData.frozenAmount || 0);
                        const currency = (tradeInitData.paymentMethod || 'ETH').toUpperCase();
                        
                        setErrorModalData({
                          title: 'Insufficient Funds',
                          message: `You don't have enough ${currency} to complete this trade. Please fund your wallet with at least ${requiredAmount.toFixed(6)} ${currency} (includes ~$0.2 for gas fees) before accepting.`,
                          details: {
                            'Available Balance': `${availableBalance.toFixed(6)} ${currency}`,
                            'Required Amount': `${requiredAmount.toFixed(6)} ${currency}`,
                            'Shortfall': `${(requiredAmount - availableBalance).toFixed(6)} ${currency}`,
                            ...(frozenAmount > 0 ? { 'Frozen Amount': `${parseFloat(frozenAmount).toFixed(6)} ${currency}` } : {}),
                            'Payment Network': tradeInitData.paymentNetwork || 'N/A'
                          },
                          isInsufficientFunds: true,
                          canRetry: true
                        });
                      } else {
                        setErrorModalData({
                          title: 'Trade Failed',
                          message: acceptError.message || 'Failed to accept invoice. Please try again.',
                          canRetry: true
                        });
                      }
                      setShowErrorModal(true);
                      setIsProcessingTrade(false);
                      return;
                    } finally {
                      setIsProcessingTrade(false);
                    }
                  }

                  setShowTradeInitModal(false);
                  setAgreeVerified(false);
                  setAgreeLocked(false);
                  
                  // Set up the pending transaction and trade data for release funds
                  const transactionId = tradeInitData.transactionId || tradeInitData._id;
                  if (transactionId) {
                    const pendingTxnData = {
                      _id: transactionId,
                      id: transactionId,
                      amount: tradeInitData.accountPrice || tradeInitData.amount || 0,
                      currency: (tradeInitData.paymentMethod || 'SOL').toUpperCase(),
                      status: 'pending'
                    };
                    
                    setPendingTransaction(pendingTxnData);
                    setTradeData({
                      ...tradeInitData,
                      transactionId: transactionId
                    });
                    setActiveTransaction({
                      id: transactionId,
                      status: 'locked',
                      role: 'buyer',
                      amount: tradeInitData.accountPrice || tradeInitData.amount || 0,
                      currency: (tradeInitData.paymentMethod || 'SOL').toUpperCase(),
                      createdAt: new Date().toISOString()
                    });
                    
                    // 🔥 NEW: Persist to TradeStateManager for reload persistence
                    TradeStateManager.setPhase(TradeStateManager.PHASES.TRADE_CREATED, {
                      transactionId,
                      tradeData: { ...pendingTxnData },
                      timerState: { isActive: true, remainingTime: 300 },
                    });
                    
                    // 🔥 Activate trade timer for BUYER after clicking Initiate Trade
                    setSellerTradeTimer(300); // 5 minutes countdown
                    setIsTradeTimerActive(true);
                    console.log('✅ Trade initiated by buyer, timer started, state persisted');
                    
                    // 🔥 FIXED: Use credentials from tradeInitData first (set by seller)
                    // Fallback to fetching from API if not available
                    const credentialsFromTrade = {
                      platform: tradeInitData.socialAccount || tradeInitData.platform || channelMetadata?.platform || 'Unknown',
                      accountUsername: tradeInitData.accountUsername || channelMetadata?.accountUsername || 'N/A',
                      accountOriginalEmail: tradeInitData.accountOriginalEmail || '',
                      originalEmailPassword: tradeInitData.originalEmailPassword || '',
                      socialAccountPassword: tradeInitData.socialAccountPassword || '',
                      transactionId: transactionId
                    };
                    
                    // Check if we have credentials from trade data
                    const hasCredentials = credentialsFromTrade.accountOriginalEmail || 
                                          credentialsFromTrade.originalEmailPassword || 
                                          credentialsFromTrade.socialAccountPassword;
                    
                    if (hasCredentials) {
                      console.log('✅ Using credentials from tradeInitData:', credentialsFromTrade);
                      setCredentialData(credentialsFromTrade);
                      // 🔥 Persist credential data to localStorage
                      try {
                        const credChId = currentChannelRef.current?.id || currentChannelRef.current?.cid?.split(':')[1] || '';
                        if (credChId) localStorage.setItem(`soctra_cred_${credChId}`, JSON.stringify(credentialsFromTrade));
                      } catch {}
                      setShowCredentialModal(true);
                      console.log('✅ Credential modal opened with trade init data');
                    } else {
                      // Fallback: Fetch from API
                      try {
                        console.log('📡 Fetching transaction credentials from API...');
                        const txnResult = await transactionService.getTransactionById(transactionId);
                        const txnData = txnResult?.data || txnResult?.transaction || txnResult;
                        
                        if (txnData) {
                          setCredentialData({
                            platform: txnData.platform || tradeInitData.socialAccount || channelMetadata?.platform || 'Unknown',
                            accountUsername: txnData.accountUsername || tradeInitData.accountUsername || channelMetadata?.accountUsername || 'N/A',
                            accountOriginalEmail: txnData.accountOriginalEmail || txnData.accountEmail || '',
                            originalEmailPassword: txnData.originalEmailPassword || txnData.emailPassword || '',
                            socialAccountPassword: txnData.socialAccountPassword || txnData.accountPassword || '',
                            transactionId: transactionId
                          });
                          setCredentialData(apiCreds);
                          // 🔥 Persist credential data to localStorage
                          try {
                            const credChId = currentChannelRef.current?.id || currentChannelRef.current?.cid?.split(':')[1] || '';
                            if (credChId) localStorage.setItem(`soctra_cred_${credChId}`, JSON.stringify(apiCreds));
                          } catch {}
                          setShowCredentialModal(true);
                        }
                      } catch (error) {
                        console.error('❌ Failed to fetch transaction credentials:', error);
                        // Still show modal with whatever data we have
                        setCredentialData(credentialsFromTrade);
                        // 🔥 Persist credential data to localStorage
                        try {
                          const credChId = currentChannelRef.current?.id || currentChannelRef.current?.cid?.split(':')[1] || '';
                          if (credChId) localStorage.setItem(`soctra_cred_${credChId}`, JSON.stringify(credentialsFromTrade));
                        } catch {}
                        setShowCredentialModal(true);
                      }
                    }
                      
                    // 🔥 Send message to notify seller that buyer has initiated trade (so seller timer starts)
                    if (currentChannel) {
                      const sellerId = tradeInitData.sellerId || tradeInitData.seller?.id;
                      await currentChannel.sendMessage({
                        text: '🔒 Trade funds locked! Timer started.',
                        buyer_initiated: true,
                        transaction_id: transactionId,
                        seller_id: sellerId,
                        initiated_at: new Date().toISOString(),
                        timer_duration: 300, // 5 minutes
                        silent: true
                      });
                      console.log('📤 Sent buyer_initiated message to seller');
                    }
                  } else {
                    // If no transaction ID, just proceed with normal trade init
                    handleProceedWithTradeInit();
                  }
                }}
                disabled={!agreeVerified || !agreeLocked || isProcessingTrade}
                className="flex-1 px-6 py-4 bg-primary text-white rounded-full hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingTrade ? 'Processing...' : 'Initiate Trade'}
              </button>
              <button
                onClick={async () => {
                  // Cancel trade using PUT /transaction/{id}/cancel
                  // 🔥 FIX: Always fetch the real transaction _id from /transaction/current
                  // The stored transactionId may be the invoice ID, not the real transaction ID
                  let transactionId = tradeInitData.transactionId || tradeInitData._id;
                  try {
                    const activeCheck = await checkActiveTransactions();
                    if (activeCheck?.hasActiveTransaction && activeCheck?.activeTransaction) {
                      const realTxnId = activeCheck.activeTransaction._id || activeCheck.activeTransaction.id;
                      if (realTxnId) {
                        if (realTxnId !== transactionId) {
                          console.log('🔑 Cancel: Replacing stored ID (invoice) with REAL transactionId from API:', realTxnId, '(was:', transactionId, ')');
                        }
                        transactionId = realTxnId;
                      }
                    }
                  } catch (apiErr) {
                    console.warn('⚠️ Could not verify transaction ID from API for cancel, using stored ID:', apiErr.message);
                  }
                  if (transactionId) {
                    try {
                      setIsProcessingTrade(true);
                      const response = await apiService.put(`/transaction/${transactionId}/cancel`);
                      if (response.status) {
                        setSuccessModalData({
                          title: 'Trade Cancelled',
                          message: 'Transaction has been cancelled successfully.'
                        });
                        setShowSuccessModal(true);
                        setActiveTransaction(null);
                        setPendingTransaction(null);
                      }
                    } catch (error) {
                      console.error('Error cancelling trade:', error);
                      setErrorModalData({
                        title: 'Cancel Failed',
                        message: error.message || 'Failed to cancel trade'
                      });
                      setShowErrorModal(true);
                    } finally {
                      setIsProcessingTrade(false);
                    }
                  }
                  setShowTradeInitModal(false);
                  setAgreeVerified(false);
                  setAgreeLocked(false);
                }}
                disabled={isProcessingTrade}
                className="flex-1 px-6 py-4 border border-primary text-white rounded-full hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AccountReviewModal = () => {
    if (!showAccountReviewModal || !accountReviewData) return null;

    const { seller, transaction, accountDetails } = accountReviewData;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
        <div className="bg-[rgba(13,13,13,1)] rounded-2xl max-w-lg w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Review Account Details</h2>

            <div className='bg-[#1a1a1a] p-5 rounded-xl mb-4'>
              <h3 className="text-md font-semibold text-white mb-4">Account Information</h3>

              {/* Seller Info */}
              <div className="flex items-center py-2 gap-2 border-b border-white/10">
                <span className="text-gray-400 text-sm w-32">Seller</span>
                <div className="flex items-center gap-2">
                  <img
                    src={seller?.image || seller?.avatar || seller?.bitmojiUrl}
                    alt=""
                    className='h-8 w-8 rounded-full'
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="text-white font-medium text-sm">
                    {seller?.name || seller?.displayName || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Platform */}
              <div className="flex items-center py-2 gap-2 border-b border-white/10">
                <span className="text-gray-400 text-sm w-32">Platform</span>
                <span className="text-white font-medium text-sm capitalize">
                  {accountDetails.platform}
                </span>
              </div>

              {/* Username */}
              <div className="flex items-center py-2 gap-2 border-b border-white/10">
                <span className="text-gray-400 text-sm w-32">Username</span>
                <span className="text-white font-medium text-sm">
                  {accountDetails.username}
                </span>
              </div>

              {/* Followers */}
              {accountDetails.followers !== 'N/A' && (
                <div className="flex items-center py-2 gap-2 border-b border-white/10">
                  <span className="text-gray-400 text-sm w-32">Followers</span>
                  <span className="text-white font-medium text-sm">
                    {accountDetails.followers}
                  </span>
                </div>
              )}

              {/* Transaction Details */}
              <div className='flex border-t mt-3 pt-3 items-center border-white/10'>
                <div className="flex items-center py-2 gap-2 pr-[1.5rem] border-r border-white/10">
                  <span className="text-gray-400 text-sm">Amount</span>
                  <span className="text-white font-medium text-sm">
                    ${accountDetails.price}
                  </span>
                </div>

                <div className="flex items-center py-2 gap-2 pl-[1.5rem]">
                  <span className="text-gray-400 text-sm">Currency</span>
                  <span className="text-white font-medium text-sm uppercase">
                    {accountDetails.currency}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center py-3 rounded-lg px-4 bg-primary/10 mt-3">
                <span className="text-gray-400 font-semibold text-sm">Total to Release</span>
                <span className="text-white font-bold text-lg">
                  {accountDetails.amount} {accountDetails.currency?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold text-sm mb-2">⚠️ IMPORTANT!</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Please verify that you have received full access to the account before
                    releasing funds. Once released, this transaction cannot be reversed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowAccountReviewModal(false);
                  setShowReleaseFundsModal(true);
                }}
                disabled={isProcessingTrade}
                className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                Continue to Release Funds
              </button>
              <button
                onClick={() => {
                  setShowAccountReviewModal(false);
                  setAccountReviewData(null);
                }}
                disabled={isProcessingTrade}
                className="px-6 py-3 border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔥 FIXED: Inline Credential Card - Displays IN the chat area (not as modal overlay)
  const CredentialCard = () => {
    if (!showCredentialModal || !credentialData) return null;

    const [copiedField, setCopiedField] = React.useState(null);

    const copyToClipboard = (text, field) => {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      console.log(`📋 Copied ${field} to clipboard`);
    };

    const CopyButton = ({ text, field }) => (
      <button
        onClick={() => copyToClipboard(text, field)}
        className="text-gray-400 hover:text-purple-400 p-0.5 transition-colors"
        title="Copy"
      >
        {copiedField === field ? (
          <span className="text-green-400 text-xs">Copied!</span>
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    );

    return (
      <div className="flex justify-center items-center mx-auto w-[480px] mb-4 px-2">
        <div className="bg-[#1a1a1a] rounded-md shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-gray-400 font-semibold text-sm">Account Info:</h3>
            </div>
          </div>

          {/* Credentials Content */}
          <div className="px-4">
            {/* Account Type */}
            <div className="flex items-center py-0.5">
              <span className="text-gray-400 text-xs">Account Type</span>
              <span className="text-white font-medium text-sm capitalize pl-3">
                {credentialData.platform || credentialData.socialAccount || 'Unknown'}
              </span>
            </div>

            {/* Username */}
            <div className="flex items-center py-0.5">
              <span className="text-gray-400 text-xs">Username</span>
              <span className="text-white font-medium text-sm pl-3">
                {credentialData.accountUsername || 'N/A'}
              </span>
              {credentialData.accountUsername && (
                <CopyButton text={credentialData.accountUsername} field="username" />
              )}
            </div>

            {/* Original Email */}
            <div className="flex items-center py-0.5">
              <span className="text-gray-400 text-xs">Original Email</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm pl-3">
                  {credentialData.accountOriginalEmail || credentialData.accountEmail || 'Not provided'}
                </span>
                {(credentialData.accountOriginalEmail || credentialData.accountEmail) && (
                  <CopyButton text={credentialData.accountOriginalEmail || credentialData.accountEmail} field="email" />
                )}
              </div>
            </div>

            {/* Email Password */}
            <div className="flex items-center py-0.5">
              <span className="text-gray-400 text-xs">Email Password</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm font-mono pl-3">
                  {credentialData.originalEmailPassword || credentialData.emailPassword || '••••••••'}
                </span>
                {(credentialData.originalEmailPassword || credentialData.emailPassword) && (
                  <CopyButton text={credentialData.originalEmailPassword || credentialData.emailPassword} field="emailPassword" />
                )}
              </div>
            </div>

            {/* Account Password */}
            <div className="flex items-center py-0.5">
              <span className="text-gray-400 text-xs">Account Password</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm font-mono pl-3">
                  {credentialData.socialAccountPassword || credentialData.accountPassword || '••••••••'}
                </span>
                {(credentialData.socialAccountPassword || credentialData.accountPassword) && (
                  <CopyButton text={credentialData.socialAccountPassword || credentialData.accountPassword} field="accountPassword" />
                )}
              </div>
            </div>
          </div>

          {/* Security Warning */}
          <div className="px-4 pb-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-0.5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-200/80 text-xs leading-relaxed">
                Change all passwords and enable 2FA immediately. <span className="font-semibold">Once funds are released.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };




  const ReleaseFundsModal = () => {
    if (!showReleaseFundsModal || !tradeData) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
        <div className="bg-[rgba(13,13,13,1)] rounded-2xl max-w-lg w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="bg-[#1a1a1a] border rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 bg-[#1a1a1a]">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-500 font-bold text-sm mb-2">DISCLAIMER!</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    Before releasing crypto, ensure you have full access to the account. Secure it by enabling 2FA, changing all login details, and verifying ownership. <span className='font-semibold'> Once crypto is released, Soctral cannot reverse the transaction.</span> </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeFullAccess}
                  onChange={(e) => setAgreeFullAccess(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  I confirm that I have secured the account and understand that this transaction is final and irreversible
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleReleaseFunds}
                disabled={!agreeFullAccess || isProcessingTrade}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingTrade ? 'Releasing...' : 'Release Funds'}
              </button>
              <button
                onClick={() => {
                  setShowReleaseFundsModal(false);
                  setAgreeFullAccess(false);
                }}
                disabled={isProcessingTrade}
                className="flex-1 px-6 py-3 border border-primary text-white rounded-full hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };




  const PinModal = () => {
    if (!showPinModal) return null;

    // showPinDigits state is at the Chat component level to prevent re-mount issues

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[70]">
        <div className="bg-[rgba(0,0,0,0.7)] rounded-xl p-6 h-full lg:h-[25rem] max-w-xl lg:mx-4">

          <div className='flex w-full items-center justify-between mb-5'>
            <div className="flex items-center justify-center">
              <h1 className="text-xl w-full text-center font-bold text-white">Enter Transaction PIN</h1>
            </div>

            <button
              onClick={() => {
                setShowPinModal(false);
                setTransactionPin('');
              }}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
              disabled={isProcessingTrade}
            >
              <X size={22} />
            </button>
          </div>

          {/* Description */}
          <div className="text-left mb-6">
            <p className="text-gray-400 text-sm">
              Please enter your 4-digit transaction PIN to authorize the release of funds. Once confirmed, this transaction cannot be reversed.
            </p>
          </div>

          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-md font-semibold text-white mb-4">
                Enter PIN
              </label>
              <div className="flex justify-center space-x-2 mb-4">
                {[...Array(4)].map((_, index) => (
                  <input
                    key={index}
                    type={showPinDigits ? 'text' : 'password'}
                    maxLength={1}
                    value={transactionPin[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const newPin = transactionPin.split('');
                      newPin[index] = value;
                      const updatedPin = newPin.join('').slice(0, 4);
                      setTransactionPin(updatedPin);

                      if (value && index < 3) {
                        const nextInput = e.target.parentElement.children[index + 1];
                        if (nextInput) nextInput.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                      setTransactionPin(pastedText);

                      const targetIndex = Math.min(pastedText.length - 1, 3);
                      setTimeout(() => {
                        const targetInput = e.target.parentElement.children[targetIndex];
                        if (targetInput) targetInput.focus();
                      }, 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !transactionPin[index] && index > 0) {
                        const prevInput = e.target.parentElement.children[index - 1];
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-white text-xl font-bold bg-transparent border-b-2 border-gray-600 focus:border-primary focus:outline-none"
                    disabled={isProcessingTrade}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowPinDigits(!showPinDigits)}
                  className="text-gray-400 hover:text-white text-sm transition-colors rounded-full px-4 py-2 hover:bg-gray-700/30"
                >
                  {showPinDigits ? (
                    <>
                      <EyeOff size={16} className="inline mr-2" />
                      Hide PIN
                    </>
                  ) : (
                    <>
                      <Eye size={16} className="inline mr-2" />
                      Show PIN
                    </>
                  )}
                </button>
              </div>
            </div>

            {isProcessingTrade && (
              <div className="mb-4">
                <p className="text-green-400 text-sm text-center">Releasing funds...</p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handlePinSubmit}
                className={`w-full py-3 px-6 rounded-full text-white font-medium transition-all ${
                  isProcessingTrade || transactionPin.length !== 4
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary hover:scale-105'
                }`}
                disabled={isProcessingTrade || transactionPin.length !== 4}
              >
                {isProcessingTrade ? 'Processing...' : 'Confirm Release'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };




  const SuccessModal = () => {
    if (!showSuccessModal || !successModalData) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full border border-green-500/30 shadow-2xl animate-slide-up pointer-events-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white">{successModalData.title}</h3>
              </div>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessModalData(null);
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            <p className="text-gray-300 leading-relaxed">{successModalData.message}</p>
          </div>
        </div>
      </div>
    );
  };

  // REPLACE the ErrorModal component in chat.jsx with this enhanced version:

  const ErrorModal = () => {
    if (!showErrorModal || !errorModalData) return null;

    const isInsufficientFunds = errorModalData.isInsufficientFunds;
    const borderColor = isInsufficientFunds ? 'border-amber-500/30' : 'border-red-500/30';
    const iconBgColor = isInsufficientFunds ? 'bg-amber-500/20' : 'bg-red-500/20';
    const iconColor = isInsufficientFunds ? 'text-amber-500' : 'text-red-500';
    const detailBgColor = isInsufficientFunds ? 'bg-amber-500/10' : 'bg-red-500/10';
    const detailBorderColor = isInsufficientFunds ? 'border-amber-500/20' : 'border-red-500/20';

    return (
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none">
        <div
          className={`bg-[#1a1a1a] rounded-2xl max-w-md w-full border ${borderColor} shadow-2xl animate-slide-up pointer-events-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
                {isInsufficientFunds ? (
                  <span className="text-2xl">💰</span>
                ) : (
                  <AlertCircle className={`w-6 h-6 ${iconColor}`} />
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{errorModalData.title || 'Error'}</h3>
            </div>

            <p className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">{errorModalData.message}</p>

            {errorModalData.details && (
              <div className={`${detailBgColor} border ${detailBorderColor} rounded-lg p-3 mb-4`}>
                <p className="text-sm text-gray-400 mb-2">{isInsufficientFunds ? 'Balance Details:' : 'Details:'}</p>
                <div className="space-y-1">
                  {Object.entries(errorModalData.details).map(([key, value]) => (
                    <p key={key} className="text-xs text-gray-300">
                      <span className="font-semibold">{key}:</span> {value}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Fund Wallet button for insufficient funds */}
              {isInsufficientFunds && (
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setErrorModalData(null);
                    setShowTradeInitModal(false);
                    // Navigate to wallet page
                    window.dispatchEvent(new CustomEvent('navigate-to-wallet'));
                  }}
                  className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  💳 Fund Wallet
                </button>
              )}

              {/* Retry button */}
              {errorModalData.canRetry && (
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setErrorModalData(null);
                    setShowTradeInitModal(true);
                  }}
                  className={`w-full px-4 py-3 ${isInsufficientFunds ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} rounded-lg transition-colors font-medium`}
                >
                  Try Again
                </button>
              )}

              {/* Close/Dismiss button */}
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setErrorModalData(null);
                }}
                className="w-full px-4 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
              >
                {errorModalData.showCancelOption ? 'Dismiss & Refresh' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔥 NEW: Full-screen Transaction Success Modal for Buyer
  const TransactionSuccessModal = () => {
    if (!showTransactionSuccessModal || !transactionSuccessData) return null;

    const { role, amount, recipientName, transactionId, currency } = transactionSuccessData;

    // Helper: Navigate to history tab via custom event
    const navigateToHistory = () => {
      setShowTransactionSuccessModal(false);
      setTransactionSuccessData(null);
      window.dispatchEvent(new CustomEvent('navigate-to-history', { detail: { transactionId } }));
    };

    // Buyer view - full-screen purple background
    if (role === 'buyer') {
      return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/70">
          <div className="flex flex-col items-center justify-center text-center px-6 py-12 max-w-md bg-primary rounded-2xl">
            {/* Success Icon */}
            <div className="w-24 h-24 mb-6 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center">
                <img src={success} className="" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-white mb-4">Transaction Successful</h1>

            {/* Message */}
            <p className="text-white text-sm mb-8">
              Congratulations! You have successfully released <span className="font-bold">${amount}</span> to <span className="font-bold">{recipientName}</span>
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={navigateToHistory}
                className="flex items-center justify-between w-full px-6 py-4 bg-[#5938be] text-white rounded-full font-semibold transition-colors"
              >
                <span>View Transaction Details</span>
                <span><img src={arrow1} /></span>
              </button>
              <button
                onClick={() => {
                  if (window.zE) {
                    window.zE('messenger', 'open');
                  } else {
                    window.open('https://soctraltechnologyhelp.zendesk.com', '_blank');
                  }
                }}
                className="w-full px-6 py-4 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
              >
                Appeal
              </button>
              <button
                onClick={() => {
                  setShowTransactionSuccessModal(false);
                  setTransactionSuccessData(null);
                }}
                className="w-full px-6 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-900 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Seller view - top notification card with successcard image
    return (
      <div className="fixed top-20 left-[24rem] inset-x-0 flex justify-center z-[100] pt-4 px-4">
        <div className="relative max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl">
          {/* Close (X) button */}
          <button
            onClick={() => {
              setShowTransactionSuccessModal(false);
              setTransactionSuccessData(null);
            }}
            className="absolute top-3 right-3 z-10 p-1.5 bg-black/40 hover:bg-black/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Successcard image as body background */}
          <div className="flex relative !w-full">
            <img src={successcard} alt="Success" className="w-full h-full" />
            
            {/* Overlay content on top of the image */}
            <div className="absolute inset-0 flex gap-2 items-center justify-center p-6 text-center">
              {/* Date */}
              <span className="text-white/70 text-xs">
                {new Date().toLocaleDateString('en-CA')}
              </span>

              {/* Title */}
              <h2 className="text-xl font-bold text-white">Funds Received</h2>

              {/* Success Icon */}
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>

              {/* Message */}
              <p className="text-white text-sm">
                You've received <span className="font-bold">${amount}</span> (≈ 0.0118 {currency}) in your {currency} wallet.
              </p>

              {/* View Transaction Button */}
              <button
                onClick={navigateToHistory}
                className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold text-sm transition-colors backdrop-blur-sm border border-white/20"
              >
                View Transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // 🔥 REMOVED: AccountInfoModal without price - using permanent banner with price instead (lines 3723-3759)

  // 🔥 FIXED: Using useMemo instead of function component to prevent recreation on every render
  const asideContent = useMemo(() => (
    <div className="lg:bg-[#181818] w-full h-full lg:w-[22rem] z-50 lg:rounded-md lg:p-4">
      <h2 className='flex items-center text-xl mb-2 mt-2 text-white font-bold'>Chats</h2>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search For chats"
          onChange={(e) => {
            e.stopPropagation();
            const value = e.target.value;
            // 🔥 FIXED: Update debouncedSearchQuery directly with longer delay
            // This prevents parent re-renders during typing
            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
              console.log('🔍 [SEARCH] Updating debouncedSearchQuery (500ms delay):', value);
              setDebouncedSearchQuery(value);
            }, 500);
          }}
          onFocus={(e) => e.stopPropagation()}
          onBlur={(e) => {
            // Immediately update on blur
            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }
            setDebouncedSearchQuery(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-white/5 border text-sm border-white/10 rounded-full pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          autoComplete="off"
        />
      </div>

      <div className="flex mb-4 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('Buy')}
          className={`text-sm font-medium transition-colors mr-6 pb-2 border-b-2 flex items-center gap-2 ${activeTab === 'Buy'
            ? 'border-purple-600 text-white'
            : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          Buy
          {buyUnreadCount > 0 && (
            <span className="bg-[#DCD0FF] text-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {buyUnreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('Sell')}
          className={`text-sm font-medium transition-colors pb-2 border-b-2 flex items-center gap-2 ${activeTab === 'Sell'
            ? 'border-purple-600 text-white'
            : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          Sell
          {sellUnreadCount > 0 && (
            <span className="bg-[#DCD0FF] text-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {sellUnreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        {isLoading && channels.length === 0 ? (
          <div className="text-center text-gray-400 py-4">Loading chats...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            {debouncedSearchQuery ? 'No chats found' : `No ${activeTab.toLowerCase()} chats yet`}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={`${user._channel?.id || user._channel?.cid || user.id}_${user.chatType}_${user.accountId || 'default'}`}
              onClick={() => handleUserSelect(user)}
              className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5 ${
                selectedUser?.id === user.id && (
                  // 🔥 FIX: Match by channel ID to avoid highlighting multiple channels with same user
                  !selectedUser?._channel || !user._channel ||
                  (selectedUser._channel?.id || selectedUser._channel?.cid) === (user._channel?.id || user._channel?.cid)
                ) ? 'bg-white/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={getUserImage(user)}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      // Silently fallback to default image
                      e.target.src = ug1;
                    }}
                  />
                  {user.status === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#181818]"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-medium text-sm truncate">{user.name}</h4>
                    <span className="text-gray-400 text-xs">{user.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isOutgoing && user.messageStatus && (
                      <div className="flex-shrink-0">
                        {user.messageStatus === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-400" title="Read" />
                        ) : user.messageStatus === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-gray-400" title="Delivered" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-400" title="Sent" />
                        )}
                      </div>
                    )}
                    <p className="text-gray-400 text-xs truncate flex-1">{user.lastMessage}</p>
                    {user._tradeCompleted && (
                      <span className="text-green-400 text-[10px] font-medium flex-shrink-0" title="Trade completed">
                        ✅ Completed
                      </span>
                    )}
                    {user.unreadCount > 0 && (
                      <span className="bg-[#DCD0FF] text-red-500 text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 flex-shrink-0">
                        {user.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  ), [filteredUsers, activeTab, buyUnreadCount, sellUnreadCount, isLoading, debouncedSearchQuery, selectedUser, channels]);

  const MainContent = () => {
    // Show channel error modal
    if (channelError && selectedUser) {
      return (
        <div className="flex-1 rounded-md flex z-30 items-center justify-center">
          <div className="text-center bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 max-w-md">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-medium mb-2">Connection Error</h3>
            <p className="text-gray-400 text-sm mb-6">{channelError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setChannelError(null);
                  if (onSelectUser) onSelectUser(null);
                }}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setChannelError(null);
                  // Re-trigger channel load by updating selectedUser reference
                  const user = { ...selectedUser };
                  if (onSelectUser) {
                    onSelectUser(null);
                    setTimeout(() => onSelectUser(user), 100);
                  }
                }}
                className="px-6 py-2 bg-primary hover:opacity-80 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedUser) {
      return (
        <div className="flex-1 rounded-md flex z-30 items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-white font-medium mb-2">No conversation selected</h3>
            <p className="text-gray-400 text-sm">Choose a conversation from the sidebar to start chatting</p>
          </div>
        </div>
      );
    }

    const currentUserId = userData?._id || userData?.id;
    const selectedUserImage = getUserImage(selectedUser);

    return (
      <div className="w-full h-full lg:flex-1 z-30 flex flex-col overflow-hidden lg:relative">
        <div className="fixed lg:absolute top-0 left-0 right-0 lg:bg-[#181818] bg-[#0a0a0a] z-30 flex items-center justify-between lg:p-4 p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>

            <div className="relative">
              <img
                src={selectedUserImage}
                alt={selectedUser.name}
                className="w-7 md:w-10 h-7 md:h-10 rounded-full object-cover"
                onError={(e) => {
                  // Silently fallback to default image
                  e.target.src = ug1;
                }}
              />
              {selectedUser.status === 'online' && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#181818]"></div>
              )}
            </div>
            <div>
              <h3 className="text-white text-xs md:text-sm font-medium">{selectedUser.name || selectedUser.displayName}</h3>
              <p className="text-gray-400 hidden md:block text-xs md:text-sm">
                {selectedUser.status === 'online' ? 'Online' : 'Last seen recently'}
              </p>
              {/* 🔥 Channel ID for complaint tracking */}
              {currentChannel && (
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-gray-500 text-[10px] font-mono truncate max-w-[80px] md:max-w-[120px]">
                    Channel ID: {currentChannel.id || currentChannel.cid?.split(':')[1] || 'N/A'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const channelId = currentChannel.id || currentChannel.cid?.split(':')[1] || '';
                      navigator.clipboard.writeText(channelId);
                      setCopiedChannelId(true);
                      setTimeout(() => setCopiedChannelId(false), 1500);
                    }}
                    className="text-gray-500 hover:text-white transition-colors p-0.5"
                    title="Copy Channel ID"
                  >
                    {copiedChannelId ? (
                      <span className="text-green-400 text-[10px]">Copied!</span>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>


 {/* 🔥 FIXED: Transaction Status Banner with 15-minute countdown - ONLY shows after buyer accepts */}
          {activeTransaction && activeTransaction.role === 'seller' && activeTransaction.status === 'pending' && isTradeTimerActive && (
            <TransactionCountdownBanner 
              activeTransaction={activeTransaction}
              setActiveTransaction={setActiveTransaction}
              setPendingTransaction={setPendingTransaction}
              setSuccessModalData={setSuccessModalData}
              setShowSuccessModal={setShowSuccessModal}
              setErrorModalData={setErrorModalData}
              setShowErrorModal={setShowErrorModal}
              setShowCancelTradeModal={setShowCancelTradeModal}
              setShowAppealMenu={setShowAppealMenu}
              showAppealMenu={showAppealMenu}
              handleReportUser={handleReportUser}
            />
          )}
{/* 
          {activeTransaction && activeTransaction.role === 'buyer' && activeTransaction.status === 'locked' && (
            <div className="mb-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm max-w-[28rem] mx-auto rounded-lg border border-green-500/30 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="text-white font-bold text-sm">Amount Locked</h3>
                    <p className="text-green-300 text-lg font-bold">${activeTransaction.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    // Handle release funds
                    setIsReleasingFunds(true);
                    try {
                      const pin = prompt('Enter your transaction PIN:');
                      if (!pin) {
                        setIsReleasingFunds(false);
                        return;
                      }
                      
                      const response = await apiService.post(`/transaction/${activeTransaction.id}/release-payment`, {
                        buyerPin: pin
                      });
                      
                      if (response.status) {
                        setActiveTransaction(null);
                        setSuccessModalData({
                          title: 'Funds Released',
                          message: 'Payment has been released successfully!'
                        });
                        setShowSuccessModal(true);
                      }
                    } catch (error) {
                      setErrorModalData({
                        message: error.message || 'Failed to release funds'
                      });
                      setShowErrorModal(true);
                    } finally {
                      setIsReleasingFunds(false);
                    }
                  }}
                  disabled={isReleasingFunds}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReleasingFunds ? 'Releasing...' : 'Release Funds'}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowAppealMenu(!showAppealMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Appeal Seller
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showAppealMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-30 overflow-hidden">
                      <button
                        onClick={() => {
                          // Navigate to seller profile
                          setShowAppealMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        View Seller Profile
                      </button>
                      <button
                        onClick={() => {
                          // Report seller
                          setShowAppealMenu(false);
                          handleReportUser();
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/10"
                      >
                        Report Seller
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )} */}


          {/* Priority 1: Trade Timer for SELLER is handled by TransactionCountdownBanner in header */}
          {!activeTransaction && showSellerTradePrompt ? (
            // Show "Ready to Initiate Trade" button only if no active transaction
            <div className="flex items-center justify-center z-[60] px-4">
              <div className="flex gap-3 items-center w-full">
                <p className="text-white md:font-medium text-xs md:text-sm">Ready to initiate Trade</p>
                <button
                  onClick={() => {
                    setShowSellerTradePrompt(false);
                    setShowSellerInitiateModal(true);
                  }}
                  disabled={isProcessingTrade}
                  className="px-2 md:px-4 py-1 md:py-2 bg-primary text-white rounded-full hover:bg-purple-700 transition-colors text-xs md:text-sm font-medium disabled:opacity-50"
                >
                  Initiate Trade
                </button>
              </div>
            </div>
          ) : pendingTransaction && pendingTransaction.status !== 'cancelled' ? (
            // Priority 2: Buyer with active transaction sees Release Funds (only if not cancelled)
            <div className="flex items-center justify-center z-[60] px-4">
              <div className="flex gap-2 items-center w-full">
                <div className="flex items-center gap-1">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  <div className="flex-1 flex items-center gap-1">
                    <p className="text-white text-sm">Locked Transaction:</p>
                    <p className="text-gray-400 text-sm">
                      ${pendingTransaction.amountUSD || tradeData?.accountPrice || pendingTransaction.amount || '0'} {(pendingTransaction.currency || tradeData?.paymentMethod || 'BTC').toUpperCase()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    // Fetch real backend transaction to get accurate token amount
                    let tokenAmount = pendingTransaction?.amount || 0;
                    let usdPrice = tradeData?.accountPrice || pendingTransaction?.amountUSD || pendingTransaction?.amount || 0;
                    let currency = pendingTransaction?.currency || 'BTC';

                    try {
                      const activeCheck = await checkActiveTransactions();
                      if (activeCheck?.hasActiveTransaction && activeCheck?.activeTransaction) {
                        const backendTxn = activeCheck.activeTransaction;
                        // Backend always has: amount = token value, amountUSD = USD price
                        tokenAmount = backendTxn.amount || tokenAmount;
                        usdPrice = backendTxn.amountUSD || usdPrice;
                        currency = backendTxn.currency || currency;
                        console.log('✅ Fetched real backend transaction for review modal:', { tokenAmount, usdPrice, currency });
                      }
                    } catch (err) {
                      console.warn('⚠️ Could not fetch backend transaction, using local data:', err.message);
                    }

                    setAccountReviewData({
                      seller: selectedUser,
                      transaction: pendingTransaction,
                      tradeData: tradeData,
                      accountDetails: {
                        platform: channelMetadata?.platform || tradeData?.socialAccount || selectedUser?.platform || 'Unknown',
                        username: channelMetadata?.accountUsername || tradeData?.accountUsername || selectedUser?.accountUsername || 'N/A',
                        followers: selectedUser?.followers || 'N/A',
                        price: usdPrice,
                        amount: tokenAmount,
                        currency: currency
                      }
                    });
                    setShowAccountReviewModal(true);
                  }}
                  disabled={isProcessingTrade}
                  className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/20 text-sm transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Release Funds
                </button>

                {/* 🔥 Appeal button for buyer - matches seller's appeal functionality */}
                <button
                  onClick={() => {
                    if (window.zE) {
                      window.zE('messenger', 'open');
                    } else {
                      window.open('https://soctraltechnologyhelp.zendesk.com', '_blank');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 hover:bg-white/10 text-white text-xs font-medium rounded-full transition-colors"
                >
                  Appeal
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : showRequestModal && pendingRequest ? (
            // Priority 3: BUYER (User1) sees Accept/Decline after SELLER initiates
            <div className="flex items-center justify-center z-[60] px-4">
              <div className="flex gap-2 items-center w-full">
                <div className="flex items-center gap-1">
                  <div className="flex-1 flex items-center gap-1">
                    <p className="text-white text-sm">
                      {pendingRequest.user.name || pendingRequest.user.displayName}
                    </p>
                    <p className="text-gray-400 text-sm">Initiated a Trade:</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">
                      {pendingRequest.user.price && pendingRequest.user.price !== 'N/A'
                        ? `$${pendingRequest.user.price}`
                        : 'Price not set'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAcceptRequest}
                    disabled={isProcessingTrade}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-full hover:bg-purple-700 text-sm transition-colors font-medium disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    disabled={isProcessingTrade}
                    className="flex-1 px-4 py-2 bg-red-700/20 text-red-600 rounded-full text-sm hover:bg-red-600/40 transition-colors font-medium disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ) : showAcceptanceNotification && acceptanceData ? (
            // Priority 4: Show waiting states
            <div className="flex items-center justify-center z-[60] px-4">
              {acceptanceData.isWaiting ? (
                <div className="flex gap-2 items-center w-full bg-blue-500/10 rounded-full px-4 py-2 border border-blue-500/30">
                  <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">
                      Trade Accepted
                    </p>
                    <p className="text-gray-400 text-xs">
                      {acceptanceData.message}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAcceptanceNotification(false);
                      setAcceptanceData(null);
                    }}
                    className="p-1 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center w-full bg-green-500/10 rounded-full px-4 py-2 border border-green-500/30">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-semibold">{acceptanceData.acceptedBy}</span> has accepted your trade initiation
                    </p>
                    <p className="text-gray-400 text-xs">
                      Amount: ${acceptanceData.amount} {acceptanceData.currency}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAcceptanceNotification(false);
                      setAcceptanceData(null);
                    }}
                    className="p-1 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          ) : null}





          {/* 🔥 MOVED: Seller Initiate Modal moved outside MainContent to prevent focus loss */}
          <div className="flex items-center gap-2">
            <div className="relative options-menu-container">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-30 overflow-hidden">
                  <button
                    onClick={handleReportUser}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <Flag className="w-4 h-4 text-red-400" />
                    Report User
                  </button>
                  <button
                    onClick={handleClearChat}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <MessageSquare className="w-4 h-4 text-yellow-400" />
                    Clear Chat
                  </button>
                  <button
                    onClick={handleDeleteChat}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <Trash2 className="w-4 h-4 text-orange-400" />
                    Delete Chat
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-3 border-t border-white/10"
                  >
                    <Ban className="w-4 h-4 text-red-500" />
                    Block User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          className="overflow-y-auto"
          style={{
            position: 'absolute',
            top: '72px',
            bottom: '88px',
            left: 0,
            right: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex items-center justify-center text-center mx-auto w-fit bg-[rgba(96,60,208,0.1)] rounded-lg p-3 mb-4">
            <p className="flex items-center justify-center gap-2 text-white text-xs text-center">
              {dangerIcon} For the safety of your assets, never trade outside the Soctral app.
            </p>
          </div>

         

          {/* 🔥 PERMANENT: Account Info Banner - Always visible when trading */}
          {/* 🔥 FIX: Sources data from channel metadata (persisted) so it survives refresh */}
          {selectedUser && (
            <div className="mb-4 bg-[#1a1a1a]/80 backdrop-blur-sm max-w-[28rem] mx-auto rounded-lg border border-white/5 p-3 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm mb-2">
                    {selectedUser.name || 'User'} <span className='text-sm font-medium text-gray-400'>has shown interest in purchasing your account </span>
                  </h3>

                  <div className="">
                    <p className="text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Account Info:</p>
                    <div className="space-y-1.5">
                      {(() => {
                        // 🔥 FIX: Pull from persisted channel metadata first (survives refresh),
                        // then component state, then selectedUser as fallback
                        const chMeta = currentChannel?.data?.metadata || {};
                        const platform = chMeta.platform || channelMetadata.platform || selectedUser?.platform || 'Unknown';
                        const username = chMeta.accountUsername || channelMetadata.accountUsername || selectedUser?.accountUsername || 'N/A';
                        const displayPrice = tradeData?.offerPrice || tradeData?.offer_amount ||
                          chMeta.trade_price || chMeta.offer_amount ||
                          selectedUser?.price;
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs">Platform:</span>
                              <span className="text-white font-medium text-xs capitalize">
                                {platform !== 'Unknown' ? platform : 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs">Username:</span>
                              <span className="text-white font-medium text-xs">
                                {username !== 'N/A' ? username : 'N/A'}
                              </span>
                            </div>
                            {displayPrice && displayPrice !== 'N/A' && (
                              <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                                <span className="text-gray-400 text-xs">Price:</span>
                                <span className="text-green-400 font-semibold text-xs">${displayPrice}</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🔥 INLINE Credential Card - Display IN the chat area */}
          <CredentialCard />

          {isLoading && messages.length === 0 ? (
            <div className="text-center text-gray-400 py-4">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 py-4">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user?.id === currentUserId;

              // Read receipt logic
              let messageStatus = 'sent';

              if (isOwn) {
                const readBy = message.read_by || {};
                const readByOthers = Object.keys(readBy).some(userId => {
                  const isOtherUser = userId !== currentUserId && userId !== String(currentUserId);
                  return isOtherUser;
                });

                if (readByOthers) {
                  messageStatus = 'read';
                } else if (message.status === 'received' || message.status === 'delivered' || message.status === 'pending') {
                  messageStatus = 'delivered';
                } else {
                  messageStatus = 'sent';
                }
              }

              const hasAttachments = message.attachments && message.attachments.length > 0;
              const attachment = hasAttachments ? message.attachments[0] : null;
              const isImage = attachment?.type === 'image';
              const isFile = attachment?.type === 'file';
              const isVideo = attachment?.mime_type?.startsWith('video/');
              const isAudio = attachment?.mime_type?.startsWith('audio/');

              const fileUrl = attachment?.asset_url || attachment?.image_url || attachment?.thumb_url;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
                >
                  <div className="relative message-options-container">
                    <div
                      className={`rounded-lg ${isOwn
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-white'
                        }`}
                    >
                      <div className="p-3">
                        {!isOwn && (
                          <p className="text-purple-400 text-xs font-medium mb-1">
                            {message.user?.name || 'Unknown'}
                          </p>
                        )}

                        {isImage && fileUrl && (
                          <div className="mb-2">
                            <img
                              src={fileUrl}
                              alt={attachment.title || 'Image'}
                              className="rounded-lg max-w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = fileUrl;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              onError={(e) => {
                                console.error('Image load error:', fileUrl);
                                e.target.style.display = 'none';
                              }}
                            />
                            {attachment.title && (
                              <p className="text-xs mt-1 opacity-75">{attachment.title}</p>
                            )}
                          </div>
                        )}

                        {isVideo && fileUrl && (
                          <div className="mb-2">
                            <video
                              src={fileUrl}
                              controls
                              className="rounded-lg max-w-full max-h-[300px] w-full"
                              onError={(e) => {
                                console.error('Video load error:', fileUrl);
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                            {attachment.title && (
                              <p className="text-xs mt-1 opacity-75">{attachment.title}</p>
                            )}
                          </div>
                        )}

                        {isAudio && fileUrl && (
                          <div className="mb-2">
                            <audio
                              src={fileUrl}
                              controls
                              className="w-full"
                              onError={(e) => {
                                console.error('Audio load error:', fileUrl);
                              }}
                            >
                              Your browser does not support the audio tag.
                            </audio>
                            {attachment.title && (
                              <p className="text-xs mt-1 opacity-75">{attachment.title}</p>
                            )}
                          </div>
                        )}
                        {/* 🔥 REMOVED: AccountInfoModal usage - using permanent banner instead */}

                        {isFile && !isVideo && !isAudio && fileUrl && (
                          <div className="mb-2">
                            <button
                              onClick={() => {
                                console.log('Opening file:', fileUrl);
                                const link = document.createElement('a');
                                link.href = fileUrl;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                link.download = attachment.title || 'download';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors w-full text-left"
                            >
                              <FileText className="w-5 h-5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.title || 'File'}</p>
                                {attachment.file_size && (
                                  <p className="text-xs opacity-75">
                                    {(attachment.file_size / 1024).toFixed(2)} KB
                                  </p>
                                )}
                              </div>
                              <Download className="w-4 h-4 flex-shrink-0" />
                            </button>
                          </div>
                        )}

                        {message.text && (
                          <p className="text-sm break-words">{message.text}</p>
                        )}

                        <div className="flex items-center justify-between mt-1 gap-2">
                          <p className={`text-xs ${isOwn ? 'text-purple-200' : 'text-gray-400'}`}>
                            {formatTime(new Date(message.created_at))}
                          </p>
                          {isOwn && (
                            <div className="flex items-center" title={
                              messageStatus === 'read' ? 'Read' :
                                messageStatus === 'delivered' ? 'Delivered' : 'Sent'
                            }>
                              {messageStatus === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                              ) : messageStatus === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-purple-200" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-purple-200 opacity-50" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwn && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setMessageOptionsMenu(messageOptionsMenu === message.id ? null : message.id)}
                          className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                          <MoreVertical className="w-3 h-3 text-white/70" />
                        </button>

                        {messageOptionsMenu === message.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-30 overflow-hidden">
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>


        <div className="fixed lg:absolute bottom-0 left-0 right-0 bg-[#0a0a0a] z-30 p-4 border-t border-white/10">
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
              {selectedFiles.map((fileObj) => (
                <div key={fileObj.id} className="relative flex-shrink-0">
                  {fileObj.preview ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5">
                      <img
                        src={fileObj.preview}
                        alt={fileObj.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeSelectedFile(fileObj.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-20 h-20 rounded-lg bg-white/5 flex flex-col items-center justify-center p-2">
                      <FileText className="w-6 h-6 text-purple-400 mb-1" />
                      <p className="text-[8px] text-white text-center truncate w-full">{fileObj.name}</p>
                      <button
                        onClick={() => removeSelectedFile(fileObj.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={messageInputRef}
                type="text"
                placeholder="Enter messages here"
                onKeyPress={handleKeyPress}
                onFocus={(e) => console.log('🔍 [MESSAGE INPUT] Focus gained', { value: e.target.value })}
                onBlur={(e) => console.log('🔍 [MESSAGE INPUT] Focus lost', { value: e.target.value })}
                onChange={(e) => console.log('🔍 [MESSAGE INPUT] Value changed:', e.target.value)}
                className="w-full bg-white/5 text-sm rounded-full pl-4 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={handleFileSelect}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'rgba(96, 60, 208, 0.1)' }}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="*/*"
              />
            </div>
            <button
              onClick={handleSendMessage}
              className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };



  if (section === 'aside') {
    return (
      <>
        {asideContent}
        <ConfirmModal />
        <SuccessModal />
        <ErrorModal />
        <TransactionSuccessModal />
        <TradeInitModal />
        <ReleaseFundsModal />
        {PinModal()}
        <AccountReviewModal />

        {/* 🔥 FIXED: SellerInitiateModal for aside section */}
        <SellerInitiateModal
          show={showSellerInitiateModal}
          onClose={handleSellerModalClose}
          selectedUser={selectedUser}
          channelMetadata={channelMetadata}
          sellerTradeData={sellerTradeData}
          setSellerTradeData={stableSetSellerTradeData}
          walletData={walletData}
          isProcessingTrade={isProcessingTrade}
          handleSubmit={handleSellerTradeSubmit}
        />
      </>
    );
  }

  if (section === 'main') {
    return (
      <>
        <div className="w-full h-full">
          <div className={`lg:hidden ${showChat && selectedUser ? 'hidden' : 'block'} w-full h-full`}>
            {asideContent}
          </div>
          <div className={`lg:block ${showChat && selectedUser ? 'block' : 'hidden lg:block'} w-full h-full`}>
            {MainContent()}

          </div>
        </div>
        <ConfirmModal />
        <SuccessModal />
        <ErrorModal />
        <TransactionSuccessModal />
        <TradeInitModal />
        <ReleaseFundsModal />
        {PinModal()}
        <AccountReviewModal />

        {/* 🔥 FIXED: SellerInitiateModal moved outside MainContent to prevent focus loss */}
        <SellerInitiateModal
          show={showSellerInitiateModal}
          onClose={handleSellerModalClose}
          selectedUser={selectedUser}
          channelMetadata={channelMetadata}
          sellerTradeData={sellerTradeData}
          setSellerTradeData={stableSetSellerTradeData}
          walletData={walletData}
          isProcessingTrade={isProcessingTrade}
          handleSubmit={handleSellerTradeSubmit}
        />

        {/* 🔥 NEW: Cancel Trade Modal */}
        <CancelTradeModal
          show={showCancelTradeModal}
          onClose={() => setShowCancelTradeModal(false)}
          onConfirm={async () => {
            try {
              // 🔥 FIX: Fetch real transaction _id from /transaction/current
              let transactionId = activeTransaction?.id || activeTransaction?._id;
              try {
                const activeCheck = await checkActiveTransactions();
                if (activeCheck?.hasActiveTransaction && activeCheck?.activeTransaction) {
                  const realTxnId = activeCheck.activeTransaction._id || activeCheck.activeTransaction.id;
                  if (realTxnId) {
                    if (realTxnId !== transactionId) {
                      console.log('🔑 CancelTradeModal: Replacing stored ID with REAL transactionId from API:', realTxnId, '(was:', transactionId, ')');
                    }
                    transactionId = realTxnId;
                  }
                }
              } catch (apiErr) {
                console.warn('⚠️ Could not verify transaction ID from API for cancel modal, using stored ID:', apiErr.message);
              }
              const response = await apiService.put(`/transaction/${transactionId}/cancel`);
              if (response.status) {
                // 🔥 FIX: Send trade_cancelled message so other party clears their state
                if (currentChannel) {
                  const currentUserId = userData?._id || userData?.id;
                  await currentChannel.sendMessage({
                    text: `❌ Trade cancelled.`,
                    user_id: currentUserId,
                    trade_cancelled: true,
                    cancelled_at: new Date().toISOString(),
                    silent: true
                  });
                }
                // 🔥 FIX: Clear all trade state
                setActiveTransaction(null);
                setPendingTransaction(null);
                setPendingRequest(null);
                setShowCancelTradeModal(false);
                setShowReleaseFundsModal(false);
                setIsTradeTimerActive(false);
                setSellerTradeTimer(300);
                TradeStateManager.clear();
                setSuccessModalData({
                  title: 'Trade Cancelled',
                  message: 'Transaction has been cancelled successfully.'
                });
                setShowSuccessModal(true);
              }
            } catch (error) {
              setErrorModalData({
                message: error.message || 'Failed to cancel trade'
              });
              setShowErrorModal(true);
            }
          }}
          isProcessing={false}
        />

      </>
    );
  }

  return null;
};

// 🔥 NEW: Cancel Trade Modal Component
const CancelTradeModal = ({ show, onClose, onConfirm, isProcessing }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-[rgba(13,13,13,1)] rounded-2xl max-w-md w-full border border-white/10 shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Cancel Trade?</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Are you sure you want to cancel this trade? This action cannot be undone and may affect your reputation.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Cancelling...' : 'Yes, Cancel Trade'}
            </button>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};




export default Chat;



const SellerInitiateModal = React.memo(({
  show,
  onClose,
  selectedUser,
  channelMetadata,
  sellerTradeData,
  setSellerTradeData,
  walletData,
  isProcessingTrade,
  handleSubmit
}) => {
  // 🔥 FIX: Use refs for values that change frequently but shouldn't cause re-renders
  const walletDataRef = React.useRef(walletData);
  const sellerTradeDataRef = React.useRef(sellerTradeData);

  // Update refs when props change (but don't trigger re-render)
  React.useEffect(() => {
    walletDataRef.current = walletData;
  }, [walletData]);

  React.useEffect(() => {
    sellerTradeDataRef.current = sellerTradeData;
  }, [sellerTradeData]);

  // 🔥 FIX: Local state initialized from ref, not prop
  const [localFormData, setLocalFormData] = React.useState(() => ({
    accountEmail: sellerTradeData?.accountEmail || '',
    emailPassword: sellerTradeData?.emailPassword || '',
    accountPassword: sellerTradeData?.accountPassword || '',
    paymentMethod: sellerTradeData?.paymentMethod || 'BTC',
    paymentNetwork: sellerTradeData?.paymentNetwork || '',
    offerPrice: sellerTradeData?.offerPrice || ''
  }));

  // 🔥 Validation state for empty fields
  const [fieldErrors, setFieldErrors] = React.useState({});

  // Update local state when parent state changes (e.g., modal re-opens)
  React.useEffect(() => {
    if (show) {
      setLocalFormData({
        accountEmail: sellerTradeData?.accountEmail || '',
        emailPassword: sellerTradeData?.emailPassword || '',
        accountPassword: sellerTradeData?.accountPassword || '',
        paymentMethod: sellerTradeData?.paymentMethod || 'BTC',
        paymentNetwork: sellerTradeData?.paymentNetwork || '',
        offerPrice: sellerTradeData?.offerPrice || ''
      });
      setFieldErrors({});
    }
  }, [show, sellerTradeData]);

  if (!show) {
    return null;
  }

  // 🔥 FIXED: Pass form data directly to parent handler with validation
  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    const errors = {};
    if (!localFormData.accountEmail?.trim()) errors.accountEmail = 'Account email is required';
    if (!localFormData.emailPassword?.trim()) errors.emailPassword = 'Email password is required';
    if (!localFormData.accountPassword?.trim()) errors.accountPassword = 'Account password is required';
    if (!localFormData.paymentNetwork?.trim()) errors.paymentNetwork = 'Payment network is required';
    if (!localFormData.offerPrice || parseFloat(localFormData.offerPrice) <= 0) errors.offerPrice = 'Offer amount is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    handleSubmit(localFormData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-black rounded-2xl max-w-lg w-full border border-white/10 shadow-2xl max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-md font-semibold mx-auto text-center text-white">Initiate Trade</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-[rgba(96,60,208,0.1)] border border-[rgba(96,60,208,0.1)] rounded-lg p-3 mb-6 flex items-start gap-1">
            <img src={warning} alt='' />
            <p className="text-gray-400 text-sm">
              <span className='text-white font-semibold'> Do not share your account logins</span> unless the trade has been initiated and the buyer has accepted, locking the trade amount.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">

            <div className="bg-[#1a1a1a] p-4 rounded-lg space-y-3">
              <h3 className="text-white font-semibold">Trade Details</h3>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Buyer:</span>
                <span className="text-white font-medium">{selectedUser?.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Social Account:</span>
                <span className="text-white font-medium capitalize">
                  {channelMetadata.platform !== 'Unknown' ? channelMetadata.platform : (selectedUser?.platform || 'Unknown')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Account Username:</span>
                <span className="text-white font-medium">
                  {channelMetadata.accountUsername !== 'N/A' ? channelMetadata.accountUsername : (selectedUser?.accountUsername || 'N/A')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {/* 🔥 FIXED: Use local state instead of parent state */}
              <div className='bg-[rgba(24,24,24,1)] rounded-xl p-5'>
                <label className="text-gray-400 text-sm">Account Original Email</label>
                <input
                  type="email"
                  placeholder="Enter Account Email"
                  value={localFormData.accountEmail}
                  onChange={(e) => {
                    setLocalFormData(prev => ({ ...prev, accountEmail: e.target.value }));
                    if (fieldErrors.accountEmail) setFieldErrors(prev => ({ ...prev, accountEmail: '' }));
                  }}
                  className={`w-full mt-1 bg-[#1a1a1a] border rounded-full px-4 py-4 text-white ${fieldErrors.accountEmail ? 'border-red-500' : 'border-white/10'}`}
                  autoComplete="off"
                />
                {fieldErrors.accountEmail && <p className="text-red-500 text-xs mt-1 ml-2">{fieldErrors.accountEmail}</p>}
              </div>

              <div className='bg-[rgba(24,24,24,1)] rounded-xl p-5'>
                <label className="text-gray-400 text-sm">Original Email Password</label>
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={localFormData.emailPassword}
                  onChange={(e) => {
                    setLocalFormData(prev => ({ ...prev, emailPassword: e.target.value }));
                    if (fieldErrors.emailPassword) setFieldErrors(prev => ({ ...prev, emailPassword: '' }));
                  }}
                  className={`w-full mt-1 bg-[#1a1a1a] border rounded-full px-4 py-4 text-white ${fieldErrors.emailPassword ? 'border-red-500' : 'border-white/10'}`}
                  autoComplete="off"
                />
                {fieldErrors.emailPassword && <p className="text-red-500 text-xs mt-1 ml-2">{fieldErrors.emailPassword}</p>}
              </div>

              <div className='bg-[rgba(24,24,24,1)] rounded-xl p-5'>
                <label className="text-gray-400 text-sm">Social Account Password</label>
                <input
                  type="password"
                  placeholder="Enter Account Password"
                  value={localFormData.accountPassword}
                  onChange={(e) => {
                    setLocalFormData(prev => ({ ...prev, accountPassword: e.target.value }));
                    if (fieldErrors.accountPassword) setFieldErrors(prev => ({ ...prev, accountPassword: '' }));
                  }}
                  className={`w-full mt-1 bg-[#1a1a1a] border rounded-full px-4 py-4 text-white ${fieldErrors.accountPassword ? 'border-red-500' : 'border-white/10'}`}
                  autoComplete="off"
                />
                {fieldErrors.accountPassword && <p className="text-red-500 text-xs mt-1 ml-2">{fieldErrors.accountPassword}</p>}
              </div>

              <div className='bg-[rgba(24,24,24,1)] rounded-xl p-5'>
                <label className="text-gray-400 text-sm mb-3 block">Select Payment Method</label>
                <div className="flex overflow-x-auto items-center gap-2">
                  {(() => {
                    // Build unique tokens from walletData.balances.currencies (new structure)
                    const currenciesData = walletDataRef.current?.balances?.currencies;
                    const tokenOptions = [];
                    const addedTokens = new Set();
                    
                    // Image mapping for tokens
                    const imageMap = {
                      btc: btc, eth: eth, usdt: usdt, usdc: usdt,
                      sol: solana, bnb: bnb, trx: tron,
                      bitcoin: btc, ethereum: eth, tether: usdt,
                      solana: solana, binance: bnb, tron: tron
                    };
                    
                    // Token symbol mapping
                    const tokenSymbolMap = {
                      btc: 'BTC', eth: 'ETH', usdt: 'USDT', usdc: 'USDC',
                      sol: 'SOL', bnb: 'BNB', trx: 'TRX',
                      bitcoin: 'BTC', ethereum: 'ETH', tether: 'USDT',
                      solana: 'SOL', binance: 'BNB', tron: 'TRX'
                    };
                    
                    if (currenciesData && typeof currenciesData === 'object') {
                      // New structure: currencies with networks - extract unique tokens
                      Object.entries(currenciesData).forEach(([currencyKey, currencyData]) => {
                        const tokenSymbol = tokenSymbolMap[currencyKey.toLowerCase()] || currencyKey.toUpperCase();
                        if (!addedTokens.has(tokenSymbol) && currencyData?.networks) {
                          addedTokens.add(tokenSymbol);
                          const tokenImage = imageMap[currencyKey.toLowerCase()] || btc;
                          tokenOptions.push({
                            token: tokenSymbol,
                            image: tokenImage,
                            networks: Object.keys(currencyData.networks)
                          });
                        }
                      });
                    }
                    
                    // Fallback: old structure (balances without networks)
                    if (tokenOptions.length === 0 && walletDataRef.current?.balances) {
                      const oldTokenMap = {
                        bitcoin: 'BTC', ethereum: 'ETH', usdt: 'USDT',
                        tether: 'USDT', solana: 'SOL', binance: 'BNB', tron: 'TRX'
                      };
                      
                      Object.entries(walletDataRef.current.balances)
                        .filter(([key]) => key !== 'total' && key !== 'portfolio' && key !== 'currencies')
                        .forEach(([key]) => {
                          const tokenSymbol = oldTokenMap[key.toLowerCase()];
                          if (tokenSymbol && !addedTokens.has(tokenSymbol)) {
                            addedTokens.add(tokenSymbol);
                            const tokenImage = imageMap[key.toLowerCase()] || btc;
                            tokenOptions.push({
                              token: tokenSymbol,
                              image: tokenImage
                            });
                          }
                        });
                    }
                    
                    // Default fallback options if no wallet data
                    if (tokenOptions.length === 0) {
                      tokenOptions.push(
                        { token: 'BTC', image: btc },
                        { token: 'ETH', image: eth },
                        { token: 'USDT', image: usdt },
                        { token: 'SOL', image: solana },
                        { token: 'BNB', image: bnb },
                        { token: 'TRX', image: tron }
                      );
                    }
                    
                    // Render token buttons
                    return tokenOptions.map((option) => (
                      <button
                        key={option.token}
                        type="button"
                        onClick={() => setLocalFormData(prev => ({ ...prev, paymentMethod: option.token, paymentNetwork: '' }))}
                        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${localFormData.paymentMethod === option.token
                          ? 'bg-primary text-white'
                          : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                          }`}
                      >
                        <img src={option.image} alt={option.token} className="w-7 h-7" />
                        {option.token}
                      </button>
                    ));
                  })()}
                </div>
              </div>

              <div className='bg-[rgba(24,24,24,1)] rounded-xl p-5'>
                <label className="text-gray-400 text-sm">Select Payment Network</label>
                <select
                  value={localFormData.paymentNetwork}
                  onChange={(e) => {
                    setLocalFormData(prev => ({ ...prev, paymentNetwork: e.target.value }));
                    if (fieldErrors.paymentNetwork) setFieldErrors(prev => ({ ...prev, paymentNetwork: '' }));
                  }}
                  className={`w-full mt-1 bg-[#1a1a1a] border rounded-full px-4 py-4 text-white ${fieldErrors.paymentNetwork ? 'border-red-500' : 'border-white/10'}`}
                >
                  <option value="">Select Network</option>
                  {(() => {
                    // Get available networks for the selected token from walletData.balances.currencies
                    const currenciesData = walletDataRef.current?.balances?.currencies;
                    const networkOptions = [];
                    
                    // Network display name mapping
                    const networkDisplayMap = {
                      'ethereum': 'Ethereum (ERC20)',
                      'base': 'Base',
                      'bitcoin': 'Bitcoin',
                      'solana': 'Solana',
                      'bsc': 'BNB Smart Chain',
                      'bnb': 'BNB Smart Chain',
                      'tron': 'Tron (TRC20)',
                      'trx': 'Tron (TRC20)',
                      'polygon': 'Polygon',
                      'arbitrum': 'Arbitrum',
                      'optimism': 'Optimism',
                      'lightning': 'Lightning Network'
                    };
                    
                    // Token to currency key mapping
                    const tokenToCurrencyKey = {
                      'BTC': ['btc', 'bitcoin'],
                      'ETH': ['eth', 'ethereum'],
                      'USDT': ['usdt', 'tether'],
                      'USDC': ['usdc'],
                      'SOL': ['sol', 'solana'],
                      'BNB': ['bnb', 'binance'],
                      'TRX': ['trx', 'tron']
                    };
                    
                    if (currenciesData && localFormData.paymentMethod) {
                      const currencyKeys = tokenToCurrencyKey[localFormData.paymentMethod] || [];
                      
                      for (const currencyKey of currencyKeys) {
                        const currencyData = currenciesData[currencyKey];
                        if (currencyData?.networks) {
                          Object.keys(currencyData.networks).forEach(networkKey => {
                            const networkName = networkDisplayMap[networkKey.toLowerCase()] || 
                              networkKey.charAt(0).toUpperCase() + networkKey.slice(1);
                            if (!networkOptions.find(n => n.value === networkName)) {
                              networkOptions.push({ value: networkName, label: networkName });
                            }
                          });
                        }
                      }
                    }
                    
                    // Fallback to static network options if no dynamic data
                    if (networkOptions.length === 0) {
                      if (localFormData.paymentMethod === 'BTC') {
                        networkOptions.push(
                          { value: 'Bitcoin', label: 'Bitcoin' },
                          { value: 'Lightning Network', label: 'Lightning Network' }
                        );
                      } else if (localFormData.paymentMethod === 'ETH') {
                        networkOptions.push(
                          { value: 'Ethereum (ERC20)', label: 'Ethereum (ERC20)' },
                          { value: 'Base', label: 'Base' }
                        );
                      } else if (localFormData.paymentMethod === 'USDT') {
                        networkOptions.push({ value: 'Tron (TRC20)', label: 'Tron (TRC20)' });
                      } else if (localFormData.paymentMethod === 'USDC') {
                        networkOptions.push(
                          { value: 'Ethereum (ERC20)', label: 'Ethereum (ERC20)' },
                          { value: 'Base', label: 'Base' }
                        );
                      } else if (localFormData.paymentMethod === 'SOL') {
                        networkOptions.push({ value: 'Solana', label: 'Solana' });
                      } else if (localFormData.paymentMethod === 'BNB') {
                        networkOptions.push({ value: 'BNB Smart Chain', label: 'BNB Smart Chain' });
                      } else if (localFormData.paymentMethod === 'TRX') {
                        networkOptions.push({ value: 'Tron (TRC20)', label: 'Tron (TRC20)' });
                      }
                    }
                    
                    return networkOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ));
                  })()}
                </select>
                {fieldErrors.paymentNetwork && <p className="text-red-500 text-xs mt-1 ml-2">{fieldErrors.paymentNetwork}</p>}
              </div>

              <div className='bg-[rgba(24,24,24,1)] rounded-xl p-5'>
                <label className="text-gray-400 text-sm">Make an Offer</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter Amount"
                  value={localFormData.offerPrice}
                  onChange={(e) => {
                    setLocalFormData(prev => ({ ...prev, offerPrice: e.target.value }));
                    if (fieldErrors.offerPrice) setFieldErrors(prev => ({ ...prev, offerPrice: '' }));
                  }}
                  className={`w-full mt-1 bg-[#1a1a1a] border rounded-full px-4 py-4 text-white ${fieldErrors.offerPrice ? 'border-red-500' : 'border-white/10'}`}
                  autoComplete="off"
                />
                {fieldErrors.offerPrice && <p className="text-red-500 text-xs mt-1 ml-2">{fieldErrors.offerPrice}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessingTrade}
              className="w-full py-3 bg-primary text-white rounded-full hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            >
              {isProcessingTrade ? 'Processing...' : 'Initiate Trade'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 🔥 FIX: Only compare props that MUST trigger re-render
  // Excluded walletData - it changes frequently from parent and we use ref instead
  return (
    prevProps.show === nextProps.show &&
    prevProps.isProcessingTrade === nextProps.isProcessingTrade
  );
});

SellerInitiateModal.displayName = 'SellerInitiateModal';