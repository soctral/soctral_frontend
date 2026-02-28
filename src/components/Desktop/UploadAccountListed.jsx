/**
 * Upload Account Listed Component (Refactored)
 * 
 * Uses unified form components instead of 40+ individual platform imports.
 * Matches UploadSocialAccount.jsx pattern: steps, style, process, dynamic currency.
 * Uses createBuyOrder endpoint for buy requests.
 * No PIN verification step.
 */

import { X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// Platform icons
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
import qoura from "../../assets/qoura.svg";
import twitch from "../../assets/twitch.svg";
import tumblr from "../../assets/tumblr.svg";
import rumble from "../../assets/rumble.png";
import steam from "../../assets/steam.png";
import arr from "../../assets/ar.svg";
import star from "../../assets/newstar.svg";

// Unified Form Components (replaces 40+ individual imports)
import { UnifiedMetricForm, UnifiedFilterForm } from '../forms';

// Services
import marketplaceService from "../../services/marketplaceService";
import authService from "../../services/authService";
import walletService from "../../services/walletService";
import WalletSetupModal from '../Desktop/WalletModal';
import TransactionResultModal from './TransactionResultModal';

// Dynamic Currency Hook
import { useCurrencyOptions } from "../../hooks/useCurrencyOptions";

// Platform Configuration
import { getSupportedPlatforms } from "../../config/platformConfig";

// Platform button configuration with icons
const PLATFORM_BUTTONS = [
  { id: "facebook", label: "facebook", icon: face },
  { id: "twitter", label: "twitter", icon: twitter },
  { id: "tiktok", label: "tiktok", icon: tiktok },
  { id: "instagram", label: "instagram", icon: ig },
  { id: "linkedin", label: "linkedin", icon: linkedin },
  { id: "snapchat", label: "snapchat", icon: snap },
  { id: "youtube", label: "youtube", icon: youtube },
  { id: "telegram", label: "telegram", icon: telegram },
  { id: "discord", label: "discord", icon: discord },
  { id: "pinterest", label: "pinterest", icon: pinterest },
  { id: "reddit", label: "reddit", icon: reddit },
  { id: "wechat", label: "wechat", icon: wechat },
  { id: "onlyfans", label: "onlyfans", icon: onlyfans },
  { id: "flickr", label: "flickr", icon: flickr },
  { id: "vimeo", label: "vimeo", icon: vimeo },
  { id: "quora", label: "quora", icon: qoura },
  { id: "twitch", label: "twitch", icon: twitch },
  { id: "tumblr", label: "tumblr", icon: tumblr },
  { id: "rumble", label: "rumble", icon: rumble },
  { id: "steam", label: "steam", icon: steam },
];

const UploadAccountListed = ({ isOpen, onClose, viewAccountData, walletData = null }) => {
  // Platform selection state
  const [selectedButton, setSelectedButton] = useState(null);
  const [platformScores, setPlatformScores] = useState({});
  const [platformData, setPlatformData] = useState({});

  // Form modal states
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [showFiltersForm, setShowFiltersForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);

  // Account tracking
  const [currentAccountId, setCurrentAccountId] = useState(null);

  // Price form state
  const [priceData, setPriceData] = useState({
    price: '',
    currency: 'usdt',
    description: '',
    quantity: 1,
    isFeatured: false,
    accountType: ''
  });

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Wallet state (no PIN)
  const [hasTransactionPin, setHasTransactionPin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const [showWalletSetup, setShowWalletSetup] = useState(false);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState('success');
  const [resultMessage, setResultMessage] = useState('');

  // View mode state
  const [viewMode, setViewMode] = useState(false);

  // Dynamic currency options from wallet data
  const { currencies, defaultCurrency } = useCurrencyOptions(walletData);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedScores = localStorage.getItem('platformScores');
      const savedData = localStorage.getItem('platformData');
      if (savedScores) {
        setPlatformScores(JSON.parse(savedScores));
        console.log('📂 Loaded saved platform scores:', JSON.parse(savedScores));
      }
      if (savedData) {
        setPlatformData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('❌ Error loading saved data:', error);
    }
  }, []);

  // Persist scores to localStorage
  useEffect(() => {
    if (Object.keys(platformScores).length > 0) {
      try {
        localStorage.setItem('platformScores', JSON.stringify(platformScores));
      } catch (error) {
        console.error('❌ Error saving scores:', error);
      }
    }
  }, [platformScores]);

  // Persist platform data to localStorage
  useEffect(() => {
    if (Object.keys(platformData).length > 0) {
      try {
        localStorage.setItem('platformData', JSON.stringify(platformData));
      } catch (error) {
        console.error('❌ Error saving data:', error);
      }
    }
  }, [platformData]);

  // Check transaction PIN status when modal opens
  useEffect(() => {
    const checkTransactionPin = async () => {
      if (!isOpen) return;

      setCheckingPin(true);
      try {
        const response = await authService.checkTransactionPinExists();
        console.log('🔐 Transaction PIN check response:', response);

        if (response.status && response.hasTransactionPin) {
          setHasTransactionPin(true);
        } else {
          setHasTransactionPin(false);
        }
      } catch (error) {
        console.error('❌ Error checking transaction PIN:', error);
        setHasTransactionPin(false);
      } finally {
        setCheckingPin(false);
      }
    };

    checkTransactionPin();
  }, [isOpen]);

  // Load view account data when provided
  useEffect(() => {
    if (viewAccountData && isOpen) {
      console.log('👁️ UploadAccountListed: Loading account data for viewing:', viewAccountData);
      console.log('📊 Metrics data:', viewAccountData.metrics);
      console.log('🔍 Filters data:', viewAccountData.filters);

      setViewMode(true);
      setSelectedButton(viewAccountData.platform);
      setShowMetricsForm(false);
      setShowFiltersForm(false);
      setShowPriceForm(false);

      const tempAccountId = `${viewAccountData.platform}_view_${Date.now()}`;
      setCurrentAccountId(tempAccountId);

      setPlatformData(prev => {
        const newData = {
          ...prev,
          [tempAccountId]: {
            platform: viewAccountData.platform,
            metrics: viewAccountData.metrics,
            filters: viewAccountData.filters
          }
        };
        console.log('💾 Updated platformData:', newData[tempAccountId]);
        return newData;
      });

      setPlatformScores(prev => ({
        ...prev,
        [tempAccountId]: {
          metrics: 100,
          filters: 100,
          combined: 100,
          platform: viewAccountData.platform
        }
      }));

      console.log('✅ UploadAccountListed: View mode setup complete with accountId:', tempAccountId);
    }
  }, [viewAccountData, isOpen]);

  // Listen for viewAccountMetrics event
  useEffect(() => {
    const handleViewAccountMetrics = (event) => {
      if (event.detail && isOpen) {
        console.log('📡 Received viewAccountMetrics event:', event.detail);
        setViewMode(true);
        setSelectedButton(event.detail.platform);
        setShowMetricsForm(false);
        setShowFiltersForm(false);

        const tempAccountId = `${event.detail.platform}_view_${Date.now()}`;
        setCurrentAccountId(tempAccountId);

        setPlatformData(prev => ({
          ...prev,
          [tempAccountId]: {
            platform: event.detail.platform,
            metrics: event.detail.metrics,
            filters: event.detail.filters
          }
        }));

        // Set scores to 100 for viewing
        setPlatformScores(prev => ({
          ...prev,
          [tempAccountId]: {
            metrics: 100,
            filters: 100,
            combined: 100,
            platform: event.detail.platform
          }
        }));
      }
    };

    window.addEventListener('viewAccountMetrics', handleViewAccountMetrics);

    return () => {
      window.removeEventListener('viewAccountMetrics', handleViewAccountMetrics);
    };
  }, [isOpen]);

  // Set default currency when wallet data loads
  useEffect(() => {
    if (defaultCurrency && !priceData.currency) {
      setPriceData(prev => ({ ...prev, currency: defaultCurrency }));
    }
  }, [defaultCurrency]);

  const handleModalClose = () => {
    console.log('🚪 UploadAccountListed: Closing modal');
    setViewMode(false);
    setSelectedButton(null);
    setCurrentAccountId(null);
    setShowMetricsForm(false);
    setShowFiltersForm(false);
    setShowPriceForm(false);
    onClose();
  };

  // Handle platform button click
  const handleButtonClick = useCallback((buttonId) => {
    console.log('🔘 Button clicked:', buttonId);
    console.log('🔐 Has transaction PIN:', hasTransactionPin);

    setSelectedButton(buttonId);
    if (!currentAccountId) {
      setCurrentAccountId(`${buttonId}_${Date.now()}`);
    }

    if (!hasTransactionPin) {
      console.log('⚠️ No transaction PIN, but allowing platform selection');
    }
  }, [currentAccountId, hasTransactionPin]);

  // Score color helpers
  const getBorderColor = (score) => {
    if (score >= 0 && score < 20) return "border-red-500";
    if (score >= 20 && score < 50) return "border-yellow-500";
    if (score >= 50 && score < 80) return "border-green-500";
    if (score >= 80 && score <= 100) return "border-purple-500";
    return "border-white";
  };

  const getScoreColor = (score) => {
    if (score >= 0 && score < 20) return "text-red-500";
    if (score >= 20 && score < 50) return "text-yellow-500";
    if (score >= 50 && score < 80) return "text-green-500";
    if (score >= 80 && score <= 100) return "text-purple-500";
    return "text-orange-500";
  };

  // Form modal handlers
  const handleMetricsClick = useCallback(() => {
    if (!viewMode) {
      setShowMetricsForm(true);
    }
  }, [viewMode]);

  const handleFiltersClick = useCallback(() => {
    if (!viewMode) {
      setShowFiltersForm(true);
    }
  }, [viewMode]);

  // Handle form submission from unified forms
  const handleFormSubmit = useCallback((newScore, formType, data) => {
    const accountKey = currentAccountId || `${selectedButton}_${Date.now()}`;

    setPlatformScores(prev => {
      const platformScoreData = prev[accountKey] || { metrics: 0, filters: 0 };

      const updatedData = {
        ...platformScoreData,
        [formType]: newScore,
        platform: selectedButton
      };

      const metricsScore = updatedData.metrics || 0;
      const filtersScore = updatedData.filters || 0;
      const combinedScore = Math.round((metricsScore + filtersScore) / 2);

      console.log(`📊 Updated ${selectedButton} ${formType} score:`, {
        accountKey,
        metricsScore,
        filtersScore,
        combinedScore
      });

      return {
        ...prev,
        [accountKey]: {
          ...updatedData,
          combined: combinedScore
        }
      };
    });

    setPlatformData(prev => ({
      ...prev,
      [accountKey]: {
        ...prev[accountKey],
        platform: selectedButton,
        [formType]: data
      }
    }));

    setShowMetricsForm(false);
    setShowFiltersForm(false);

    const currentPlatformData = platformData[accountKey] || {};
    const hasMetrics = formType === 'metrics' || currentPlatformData.metrics;
    const hasFilters = formType === 'filters' || currentPlatformData.filters;

    if (hasMetrics && hasFilters) {
      setShowPriceForm(true);
    }
  }, [currentAccountId, selectedButton, platformData]);

  // Handle price form submission - direct submission without PIN
  const handlePriceSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setSubmitError('');

    try {
      const accountKey = currentAccountId || `${selectedButton}_${Date.now()}`;
      const currentPlatformData = platformData[accountKey];

      if (!currentPlatformData || !currentPlatformData.metrics || !currentPlatformData.filters) {
        throw new Error('Please complete both metrics and filters forms first');
      }

      // Get wallet address for the selected currency
      let walletAddress = null;
      try {
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userId = currentUserData._id || currentUserData.id;

        if (userId) {
          walletAddress = await walletService.getWalletAddressForCurrency(userId, priceData.currency);
          console.log('✅ Got wallet address:', walletAddress);
        }
      } catch (walletError) {
        console.warn('⚠️ Could not fetch wallet address:', walletError.message);
        // Try to get from walletData prop as fallback
        if (walletData?.walletAddresses) {
          const currency = priceData.currency.toLowerCase();
          walletAddress = walletData.walletAddresses[currency] ||
            walletData.walletAddresses[currency.toUpperCase()] ||
            walletData.walletAddresses[`${currency}Address`];
        }
      }

      if (!walletAddress) {
        throw new Error('Wallet address not found. Please set up your wallet first.');
      }

      const buyOrderPayload = {
        platform: selectedButton,
        maxPrice: parseFloat(priceData.price),
        currency: priceData.currency,
        description: priceData.description,
        quantity: parseInt(priceData.quantity),
        isUrgent: priceData.isFeatured,
        requirements: currentPlatformData.metrics,
        filters: currentPlatformData.filters,
        walletAddress: walletAddress
      };

      console.log('📤 Submitting buy order:', buyOrderPayload);

      const response = await marketplaceService.createBuyOrder(buyOrderPayload);

      console.log('✅ Buy order created successfully:', response);

      // Clear data after success
      setPlatformData(prev => {
        const newData = { ...prev };
        delete newData[accountKey];
        return newData;
      });

      setPlatformScores(prev => {
        const newScores = { ...prev };
        delete newScores[accountKey];
        return newScores;
      });

      setPriceData({
        price: '',
        currency: defaultCurrency || 'usdt',
        description: '',
        quantity: 1,
        isFeatured: false,
        accountType: ''
      });

      setCurrentAccountId(null);
      setSelectedButton(null);
      setShowPriceForm(false);

      // Show success modal
      setResultType('success');
      setResultMessage('Your buy request has been listed successfully! You can now add another request.');
      setShowResultModal(true);

    } catch (error) {
      console.error('❌ Error:', error);
      setSubmitError(error.message || 'An error occurred');

      // Show error modal
      setResultType('error');
      setResultMessage(error.message || 'Failed to create buy order. Please try again.');
      setShowResultModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Computed values
  const credibilityScore = currentAccountId ? (platformScores[currentAccountId]?.combined || 0) : 0;
  const hasMetrics = currentAccountId ? platformData[currentAccountId]?.metrics : false;
  const hasFilters = currentAccountId ? platformData[currentAccountId]?.filters : false;
  const canSubmit = hasMetrics && hasFilters;

  const platformAccounts = Object.keys(platformData).filter(key =>
    platformData[key]?.platform === selectedButton
  );

  if (!isOpen) return null;

  // Loading state
  if (checkingPin) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10000] rounded-md flex items-center justify-center">
        <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-gray-400 ml-4">Checking security status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10000] rounded-md flex items-center justify-center overflow-y-auto">
        <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="w-full flex items-center justify-between mb-6">
            <div className="">
              <h2 className="text-white text-lg text-center font-semibold">
                {viewMode ? 'View Account Details' : 'Request Social Account'}
              </h2>
            </div>

            <button
              onClick={handleModalClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[#868686] font-semibold text-sm mb-2">
            {viewMode ? 'Account Platform' : 'Select Social Account'}
          </p>

          <div className="rounded-lg p-2">
            <div>
              {selectedButton && (
                <>
                  {!viewMode && platformAccounts.length > 0 && (
                    <div className="mb-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
                      <h4 className="text-xs font-semibold mb-2">Saved {selectedButton.charAt(0).toUpperCase() + selectedButton.slice(1)} Requests ({platformAccounts.length})</h4>
                      <div className="space-y-2">
                        {platformAccounts.map(accountKey => (
                          <div key={accountKey} className="flex items-center justify-between p-2 bg-[rgba(255,255,255,0.03)] rounded">
                            <span className="text-xs text-gray-300">
                              Score: {platformScores[accountKey]?.combined || 0}/100
                            </span>
                            <button
                              onClick={() => {
                                setCurrentAccountId(accountKey);
                              }}
                              className="text-xs text-purple-400 hover:text-purple-300"
                            >
                              Continue Editing
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!viewMode && currentAccountId && (
                    <button
                      onClick={() => {
                        setCurrentAccountId(`${selectedButton}_${Date.now()}`);
                      }}
                      className="mb-4 w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white rounded-full transition-colors text-sm"
                    >
                      + Add Another {selectedButton.charAt(0).toUpperCase() + selectedButton.slice(1)} Request
                    </button>
                  )}

                  {!viewMode && (
                    <div className="flex items-center justify-between mb-4 p-3 rounded-lg">
                      <div className="relative w-20 h-20 lg:w-24 lg:h-24">
                          <div className={`w-full h-full border-4 ${getBorderColor(credibilityScore)} rounded-full shadow-lg flex justify-center items-center bg-transparent`}>
                          <div className="text-md lg:text-2xl font-bold text-center">
                            <span className={getScoreColor(credibilityScore)}>{credibilityScore}</span>
                            <span className="text-white drop-shadow-sm">/100</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 ml-3">
                        <h3 className="text-md font-semibold mb-4">Request Credibility</h3>
                        <p className="text-[#868686] text-xs">Add more metrics and filters to improve matching accuracy.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Platform Selection Grid */}
            {!viewMode && (
              <div className="w-full grid grid-cols-4 gap-1 items-center justify-between flex-wrap">
                {PLATFORM_BUTTONS.map((button) => (
                  <button
                    key={button.id}
                    onClick={() => handleButtonClick(button.id)}
                    className={`flex gap-2 items-center justify-center capitalize w-fit hover:bg-[#7050d5] rounded-full p-2 ${selectedButton === button.id ? "bg-[#613cd0]" : ""
                      }`}
                  >
                    <div
                      className={`rounded-full lg:p-2 ${selectedButton === button.id
                        ? "bg-[#7050d5]"
                        : "lg:bg-[rgba(255,255,255,0.1)]"
                        }`}
                    >
                      <img src={button.icon} className="w-10 lh-6 lg:w-6" alt="" />
                    </div>
                    <p className="text-[9px] lg:text-xs font-semibold">{button.label}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Metrics & Filters Section */}
            <div>
              {selectedButton && (
                <>
                  <h3 className="text-sm font-semibold mt-5">
                    {viewMode ? `${selectedButton.charAt(0).toUpperCase() + selectedButton.slice(1)} Account Details` : `Specify ${selectedButton.charAt(0).toUpperCase() + selectedButton.slice(1)} Account Requirements`}
                  </h3>

                  {/* Full Account Details Section (View Mode) */}
                  {viewMode && viewAccountData && (
                    <div className="mt-4 p-4 bg-[rgba(255,255,255,0.05)] rounded-lg space-y-3">
                      {/* Buyer / Seller Info */}
                      {viewAccountData.buyer && (
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-700/50">
                          <img
                            src={viewAccountData.buyer.image}
                            alt={viewAccountData.buyer.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div>
                            <p className="text-white text-sm font-semibold flex items-center gap-1">
                              {viewAccountData.buyer.name || 'Anonymous'}
                              {viewAccountData.buyer.verified && (
                                <span className="text-purple-400 text-xs">✓</span>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs">Buyer</p>
                          </div>
                        </div>
                      )}
                      {viewAccountData.seller && (
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-700/50">
                          <img
                            src={viewAccountData.seller.image}
                            alt={viewAccountData.seller.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div>
                            <p className="text-white text-sm font-semibold flex items-center gap-1">
                              {viewAccountData.seller.name || 'Anonymous'}
                              {viewAccountData.seller.verified && (
                                <span className="text-purple-400 text-xs">✓</span>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs">Seller</p>
                          </div>
                        </div>
                      )}

                      {/* Account Details Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Username */}
                        {viewAccountData.accountUsername && viewAccountData.accountUsername !== 'N/A' && (
                          <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Username</p>
                            <p className="text-white text-sm font-medium">@{viewAccountData.accountUsername}</p>
                          </div>
                        )}

                        {/* Max Budget / Price */}
                        {(viewAccountData.maxPrice || viewAccountData.price) && (
                          <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">
                              {viewAccountData.isBuyOrder ? 'Max Budget' : 'Price'}
                            </p>
                            <p className="text-white text-sm font-semibold">
                              ${viewAccountData.isBuyOrder ? viewAccountData.maxPrice : viewAccountData.price}
                            </p>
                          </div>
                        )}

                        {/* Token */}
                        {viewAccountData.currency && (
                          <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Token</p>
                            <p className="text-white text-sm font-semibold">{viewAccountData.currency.toUpperCase()}</p>
                          </div>
                        )}

                        {/* Followers */}
                        {viewAccountData.followers && viewAccountData.followers !== '0' && (
                          <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Followers</p>
                            <p className="text-white text-sm font-medium">{viewAccountData.followers}</p>
                          </div>
                        )}

                        {/* Platform */}
                        <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Platform</p>
                          <p className="text-white text-sm font-medium capitalize">{viewAccountData.platform}</p>
                        </div>

                        {/* Urgency */}
                        {viewAccountData.isUrgent && (
                          <div className="bg-[rgba(255,100,100,0.08)] rounded-lg p-3 border border-red-500/20">
                            <p className="text-red-400 text-[10px] uppercase tracking-wider mb-1">Priority</p>
                            <p className="text-red-300 text-sm font-semibold">🔥 Urgent</p>
                          </div>
                        )}

                        {/* Account Type */}
                        {viewAccountData.accountType && viewAccountData.accountType !== '0' && (
                          <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Account Type</p>
                            <p className="text-white text-sm font-medium capitalize">{viewAccountData.accountType}</p>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {viewAccountData.description && (
                        <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Description</p>
                          <p className="text-white text-sm leading-relaxed">{viewAccountData.description}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
                    {/* Metrics Section */}
                    <div className={`${viewMode ? '' : 'border-b border-gray-500'}`}>
                      {!viewMode && (
                        <button
                          onClick={handleMetricsClick}
                          className="flex items-center justify-between p-3 w-full hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                        >
                          <div className="text-left w-[252px]">
                            <h4 className="text-xs font-bold mb-3 flex items-center gap-2">
                              Account Metrics
                              {hasMetrics && <span className="text-green-500">✓</span>}
                            </h4>
                            <p className="text-xs font-normal text-[rgba(255,255,255,1)]">
                              Add at least three key metrics to specify your requirements.
                            </p>
                          </div>

                          <img src={arr} alt="" />
                        </button>
                      )}

                      {/* Display Metrics Data in View Mode */}
                      {viewMode && currentAccountId && platformData[currentAccountId]?.metrics && (
                        <div className="flex flex-wrap gap-2 px-3 rounded-lg">
                          {platformData[currentAccountId].metrics.map((metric, index) => (
                            <div key={index} className="flex items-center bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-2 gap-2">
                              <div className="flex items-center gap-1">
                                <img src={star} className="h-4 w-4 shrink-0" alt="" />

                                <div className="flex gap-1">
                                  <span className="text-xs text-gray-300 capitalize font-medium">
                                    {metric.key?.replace(/_/g, ' ') || 'N/A'}
                                  </span>
                                  <span className="text-xs text-white font-semibold">
                                    {metric.value !== undefined && metric.value !== null && metric.value !== ''
                                      ? (typeof metric.value === 'boolean'
                                        ? (metric.value ? 'Yes' : 'No')
                                        : metric.value)
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Filters Section */}
                    <div className="">
                      {!viewMode && (
                        <button
                          onClick={handleFiltersClick}
                          className="flex items-center justify-between p-3 w-full hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                        >
                          <div className="text-left w-[252px]">
                            <h4 className="text-xs font-bold mb-3 flex items-center gap-2">
                              Account Filters
                              {hasFilters && <span className="text-green-500">✓</span>}
                            </h4>
                            <p className="text-xs font-normal text-[rgba(255,255,255,1)]">
                              Select at least three filters to help sellers find your order.
                            </p>
                          </div>

                          <img src={arr} alt="" />
                        </button>
                      )}

                      {/* Display Filters Data in View Mode */}
                      {viewMode && currentAccountId && platformData[currentAccountId]?.filters && (
                        <div className="flex flex-wrap gap-2 px-3 rounded-lg mt-2">
                          {platformData[currentAccountId].filters.map((filter, index) => (
                            <div key={index} className="flex items-center bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-2 gap-2">
                              <div className="flex items-center gap-1">
                                <img src={star} className="h-4 w-4 shrink-0" alt="" />

                                <div className="flex gap-1">
                                  <span className="text-xs text-gray-300 capitalize font-medium">
                                    {filter.key?.replace(/_/g, ' ') || 'N/A'}
                                  </span>
                                  <span className="text-xs text-white font-semibold">
                                    {filter.value !== undefined && filter.value !== null && filter.value !== ''
                                      ? (typeof filter.value === 'boolean'
                                        ? (filter.value ? 'Yes' : 'No')
                                        : filter.value)
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hide "Continue to Budget" button in view mode */}
                  {!viewMode && canSubmit && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowPriceForm(true)}
                        className="w-full px-4 py-3 bg-[#613cd0] hover:bg-[#7050d5] text-white rounded-full transition-colors font-semibold"
                      >
                        Continue to Budget
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* UNIFIED METRICS FORM - Replaces 20 individual platform forms */}
        {showMetricsForm && selectedButton && (
          <UnifiedMetricForm
            platform={selectedButton}
            isOpen={showMetricsForm}
            onClose={() => setShowMetricsForm(false)}
            onSubmit={handleFormSubmit}
          />
        )}

        {/* UNIFIED FILTERS FORM - Replaces 20 individual platform forms */}
        {showFiltersForm && selectedButton && (
          <UnifiedFilterForm
            platform={selectedButton}
            isOpen={showFiltersForm}
            onClose={() => setShowFiltersForm(false)}
            onSubmit={handleFormSubmit}
          />
        )}

        {/* Price Form Modal */}
        {showPriceForm && (
          <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 z-[10002] rounded-md flex items-center justify-center overflow-y-auto">
            <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-lg shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="w-full flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Budget & Details</h3>
                <button
                  onClick={() => setShowPriceForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                  <p className="text-red-500 text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handlePriceSubmit} className="space-y-5">
                {/* Maximum Price */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Maximum Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={priceData.price}
                    onChange={(e) => setPriceData(prev => ({ ...prev, price: e.target.value }))}
                    step="0.01"
                    required
                    className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                    placeholder="Enter Maximum Price"
                  />
                </div>

                {/* Currency - DYNAMIC FROM WALLET DATA */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={priceData.currency}
                    onChange={(e) => setPriceData(prev => ({ ...prev, currency: e.target.value }))}
                    required
                    className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                  >
                    {currencies.map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={priceData.description}
                    onChange={(e) => setPriceData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={4}
                    className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0] resize-none"
                    placeholder="Describe what you're looking for..."
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={priceData.quantity}
                    onChange={(e) => setPriceData(prev => ({ ...prev, quantity: e.target.value }))}
                    min="1"
                    required
                    className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                    placeholder="Enter Quantity"
                  />
                </div>

                {/* Urgent */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={priceData.isFeatured}
                    onChange={(e) => setPriceData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="urgent" className="text-sm cursor-pointer">
                    Mark as urgent
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 px-4 py-3 text-white rounded-full transition-colors ${submitting
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-[#613cd0] hover:bg-[#7050d5]'
                      }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Buy Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Transaction Result Modal */}
      <TransactionResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          if (resultType === 'success') {
            // Close the main modal after successful submission
            onClose();
          }
        }}
        type={resultType}
        message={resultMessage}
      />

      <WalletSetupModal
        isOpen={showWalletSetup}
        onClose={() => {
          setShowWalletSetup(false);
        }}
      />
    </>
  );
};

export default UploadAccountListed;