import React, { useState, useEffect } from "react";
import { X, ChevronRight, Edit2, Save, AlertCircle, ArrowLeft } from "lucide-react";
import marketplaceService from "../../services/marketplaceService";

// Import social media icons
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
import rumble from "../../assets/rumble.png";
import qoura from "../../assets/qoura.svg";
import twitch from "../../assets/twitch.svg";
import tumblr from "../../assets/tumblr.svg";
import steam from "../../assets/steam.png";
import arr from "../../assets/ar.svg";

// Import UPDATE forms from updateUploadAccount folder
import { FacebookMetricForm as FacebookMetricUpdateForm, FacebookFilterForm as FacebookFilterUpdateForm } from '../updateUploadAccount/facebook';
import { TwitterMetricForm as TwitterMetricUpdateForm, TwitterFilterForm as TwitterFilterUpdateForm } from '../updateUploadAccount/twitter';
import { InstagramMetricForm as InstagramMetricUpdateForm, InstagramFilterForm as InstagramFilterUpdateForm } from '../updateUploadAccount/instagram';
import { TiktokMetricForm as TiktokMetricUpdateForm, TiktokFilterForm as TiktokFilterUpdateForm } from '../updateUploadAccount/tiktok';
import { LinkedinMetricForm as LinkedinMetricUpdateForm, LinkedinFilterForm as LinkedinFilterUpdateForm } from '../updateUploadAccount/linkedin';
import { SnapchatMetricForm as SnapchatMetricUpdateForm, SnapchatFilterForm as SnapchatFilterUpdateForm } from '../updateUploadAccount/snapchat';
import { YoutubeMetricForm as YoutubeMetricUpdateForm, YoutubeFilterForm as YoutubeFilterUpdateForm } from '../updateUploadAccount/youtube';
import { TelegramMetricForm as TelegramMetricUpdateForm, TelegramFilterForm as TelegramFilterUpdateForm } from '../updateUploadAccount/telegram';
import { DiscordMetricForm as DiscordMetricUpdateForm, DiscordFilterForm as DiscordFilterUpdateForm } from '../updateUploadAccount/discord';
import { PinterestMetricForm as PinterestMetricUpdateForm, PinterestFilterForm as PinterestFilterUpdateForm } from '../updateUploadAccount/pinterest';
import { RedditMetricForm as RedditMetricUpdateForm, RedditFilterForm as RedditFilterUpdateForm } from '../updateUploadAccount/reddit';
import { WechatMetricForm as WechatMetricUpdateForm, WechatFilterForm as WechatFilterUpdateForm } from '../updateUploadAccount/wechat';
import { OnlyfansMetricForm as OnlyfansMetricUpdateForm, OnlyfansFilterForm as OnlyfansFilterUpdateForm } from '../updateUploadAccount/onlyfans';
import { FlickrMetricForm as FlickrMetricUpdateForm, FlickrFilterForm as FlickrFilterUpdateForm } from '../updateUploadAccount/flickr';
import { VimeoMetricForm as VimeoMetricUpdateForm, VimeoFilterForm as VimeoFilterUpdateForm } from '../updateUploadAccount/vimeo';
import { RumbleMetricForm as RumbleMetricUpdateForm, RumbleFilterForm as RumbleFilterUpdateForm } from '../updateUploadAccount/rumble';
import { QouraMetricForm as QouraMetricUpdateForm, QouraFilterForm as QouraFilterUpdateForm } from '../updateUploadAccount/qoura';
import { TwitchMetricForm as TwitchMetricUpdateForm, TwitchFilterForm as TwitchFilterUpdateForm } from '../updateUploadAccount/twitch';
import { TumblrMetricForm as TumblrMetricUpdateForm, TumblrFilterForm as TumblrFilterUpdateForm } from '../updateUploadAccount/tumblr';
import { SteamMetricForm as SteamMetricUpdateForm, SteamFilterForm as SteamFilterUpdateForm } from '../updateUploadAccount/steam';

const ManageListedAccounts = ({ isOpen, onClose }) => {
  const [section, setSection] = useState('main');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [platformAccounts, setPlatformAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showMetricsUpdateForm, setShowMetricsUpdateForm] = useState(false);
  const [showFiltersUpdateForm, setShowFiltersUpdateForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteResponse, setDeleteResponse] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [alertModal, setAlertModal] = useState({ show: false, type: '', message: '' });
  const [priceData, setPriceData] = useState({
    price: '',
    currency: 'usdt',
    description: '',
    quantity: 1,
    isFeatured: false,
    accountType: ''
  });
  const [saving, setSaving] = useState(false);

  // Platform icons mapping
  const platformIcons = {
    facebook: face,
    instagram: ig,
    twitter: twitter,
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
    rumble: rumble,
    quora: qoura,
    qoura: qoura,
    twitch: twitch,
    tumblr: tumblr,
    steam: steam
  };



const fetchUserAccounts = async () => {
  setLoading(true);
  setError(null);
  
  try {
    console.log('🔄 ============ FETCHING FRESH DATA ============');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const response = await marketplaceService.getUserSellOrders();
    
    console.log('📥 Raw Response:', response);
    console.log('📋 Response Type:', typeof response);
    console.log('📊 Response Keys:', Object.keys(response || {}));
    
    let freshAccounts = [];
    
    // Handle different response formats
    if (response && response.data && Array.isArray(response.data)) {
      freshAccounts = response.data;
      console.log('✅ Format: response.data (array)');
    } else if (response && response.orders && Array.isArray(response.orders)) {
      freshAccounts = response.orders;
      console.log('✅ Format: response.orders (array)');
    } else if (Array.isArray(response)) {
      freshAccounts = response;
      console.log('✅ Format: direct array');
    } else {
      console.warn('⚠️ Unexpected response format:', response);
      freshAccounts = [];
    }
    
    // ===== CRITICAL: FILTER OUT CANCELLED/DELETED ACCOUNTS =====
    const activeAccounts = freshAccounts.filter(account => {
      const status = account.status?.toLowerCase();
      return status !== 'cancelled' && status !== 'deleted';
    });
    
    console.log('📊 Total Accounts from Server:', freshAccounts.length);
    console.log('✅ Active Accounts (filtered):', activeAccounts.length);
    console.log('🚫 Cancelled/Deleted (filtered out):', freshAccounts.length - activeAccounts.length);
    console.log('📝 Active Accounts Data:', activeAccounts);
    
    // Force a new array reference to trigger re-render
    setAccounts([...activeAccounts]);
    
    console.log('✅ ============ FETCH COMPLETE ============');
    
  } catch (err) {
    console.error('❌ ============ FETCH FAILED ============');
    console.error('Error:', err);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    
    setError(err.message || 'Failed to load accounts');
    setAccounts([]);
  } finally {
    setLoading(false);
  }
};



  // Fetch user's sell orders
  useEffect(() => {
    if (isOpen && section === 'main') {
      fetchUserAccounts();
    }
  }, [isOpen, section]);


useEffect(() => {
  if (isOpen) {
    console.log('🚀 Modal opened - clearing cache and fetching fresh data');
    // Clear everything first
    setAccounts([]);
    setError(null);
    setSection('main');
    setSelectedPlatform(null);
    setPlatformAccounts([]);
    setSelectedAccount(null);
    
    // Then fetch fresh
    fetchUserAccounts();
  }
}, [isOpen]);


  // Group accounts by platform
  const groupAccountsByPlatform = (accountsList) => {
    const grouped = {};
    accountsList.forEach(account => {
      const platform = account.platform?.toLowerCase() || 'other';
      if (!grouped[platform]) {
        grouped[platform] = [];
      }
      grouped[platform].push(account);
    });
    return grouped;
  };

  // Calculate completion score based on metrics and filters
  const calculateScore = (account) => {
    let metricsScore = 0;
    let filtersScore = 0;

    if (account.metrics && Array.isArray(account.metrics)) {
      const filledMetrics = account.metrics.filter(m => 
        m.value !== null && m.value !== undefined && m.value !== ''
      ).length;
      metricsScore = account.metrics.length > 0 
        ? Math.round((filledMetrics / account.metrics.length) * 100) 
        : 0;
    }

    if (account.filters && Array.isArray(account.filters)) {
      const filledFilters = account.filters.filter(f => 
        f.value !== null && f.value !== undefined && f.value !== ''
      ).length;
      filtersScore = account.filters.length > 0 
        ? Math.round((filledFilters / account.filters.length) * 100) 
        : 0;
    }

    return Math.round((metricsScore + filtersScore) / 2);
  };

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

  const handlePlatformClick = (platform, account) => {
    console.log('🎯 Platform clicked:', platform, 'Single Account:', account);
    setSelectedPlatform(platform);
    setPlatformAccounts([account]);
    setSelectedAccount(account);
    setSection('platform-list');
  };

  const handleAccountClick = (account) => {
    console.log('🎯 Account clicked:', account);
    setSelectedAccount(account);
    setSection('detail');
  };

const handleBackToMain = async () => {
  console.log('⬅️ ============ BACK TO MAIN ============');
  
  // Reset all state
  setSection('main');
  setSelectedPlatform(null);
  setPlatformAccounts([]);
  setSelectedAccount(null);
  setShowMetricsUpdateForm(false);
  setShowFiltersUpdateForm(false);
  setShowPriceForm(false);
  setShowDeleteModal(false);
  setDeleteResponse(null);
  
  // Force refresh
  console.log('🔄 Refreshing accounts list...');
  setAccounts([]);
  await fetchUserAccounts();
};



  const handleBackToPlatformList = () => {
    setSection('platform-list');
    setSelectedAccount(null);
    setShowMetricsUpdateForm(false);
    setShowFiltersUpdateForm(false);
    setShowPriceForm(false);
    setShowDeleteModal(false);
    setDeleteResponse(null);
  };

const handleModalClose = () => {
  console.log('❌ ============ CLOSING MODAL ============');
  
  // Reset everything
  setAccounts([]);
  setSection('main');
  setSelectedPlatform(null);
  setPlatformAccounts([]);
  setSelectedAccount(null);
  setShowMetricsUpdateForm(false);
  setShowFiltersUpdateForm(false);
  setShowPriceForm(false);
  setShowDeleteModal(false);
  setDeleteResponse(null);
  setError(null);
  setLoading(false);
  
  // Call parent close
  onClose();
};

  // Handle opening metrics update form
  const handleMetricsClick = (account, e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log('🔵 Opening metrics form for account:', account);
    console.log('🟡 Setting showMetricsUpdateForm to TRUE');
    setSelectedAccount(account);
    setShowMetricsUpdateForm(true);
    setShowFiltersUpdateForm(false);
    setShowPriceForm(false);
    
    setTimeout(() => {
      console.log('⏱️ State should be updated now - checking showMetricsUpdateForm:', true);
    }, 100);
  };

  // Handle opening filters update form
  const handleFiltersClick = (account, e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log('🔵 Opening filters form for account:', account);
    console.log('🟡 Setting showFiltersUpdateForm to TRUE');
    setSelectedAccount(account);
    setShowFiltersUpdateForm(true);
    setShowMetricsUpdateForm(false);
    setShowPriceForm(false);
    
    setTimeout(() => {
      console.log('⏱️ State should be updated now - checking showFiltersUpdateForm:', true);
    }, 100);
  };

  // Handle form submission from update forms
  const handleUpdateFormSubmit = async (newScore, formType, data) => {
    try {
      console.log('📝 Updating account:', selectedAccount._id || selectedAccount.id);
      console.log('Form type:', formType);
      console.log('New data:', data);

      const updatePayload = {
        [formType]: data
      };

      const response = await marketplaceService.updateSellOrder(
        selectedAccount._id || selectedAccount.id,
        updatePayload
      );

      if (response.status) {
        console.log('✅ Account updated successfully');
        setShowMetricsUpdateForm(false);
        setShowFiltersUpdateForm(false);
        await fetchUserAccounts();
        setAlertModal({ 
          show: true, 
          type: 'success', 
          message: 'Account updated successfully!' 
        });
      }
    } catch (error) {
      console.error('❌ Error updating account:', error);
      setAlertModal({ 
        show: true, 
        type: 'error', 
        message: error.message || 'Failed to update account' 
      });
    }
  };

  // Handle price form submission
  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatePayload = {
        price: parseFloat(priceData.price),
        currency: priceData.currency,
        description: priceData.description,
        quantity: parseInt(priceData.quantity),
        isFeatured: priceData.isFeatured,
        accountType: priceData.accountType
      };

      const response = await marketplaceService.updateSellOrder(
        selectedAccount._id || selectedAccount.id,
        updatePayload
      );

      if (response.status) {
        setShowPriceForm(false);
        await fetchUserAccounts();
        setAlertModal({ 
          show: true, 
          type: 'success', 
          message: 'Pricing updated successfully!' 
        });
      }
    } catch (error) {
      console.error('❌ Error updating pricing:', error);
      setAlertModal({ 
        show: true, 
        type: 'error', 
        message: error.message || 'Failed to update pricing' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
const handleDelete = async () => {
  setDeleting(true);
  setDeleteResponse(null);

  try {
    console.log('🗑️ ============ DELETING ACCOUNT ============');
    console.log('Account ID:', selectedAccount._id || selectedAccount.id);
    console.log('Account Platform:', selectedAccount.platform);
    console.log('Account Username:', selectedAccount.filters?.find(f => f.key === 'username')?.value);
    
    const accountId = selectedAccount._id || selectedAccount.id;
    const response = await marketplaceService.deleteSellOrder(accountId);
    
    console.log('✅ Delete API Response:', response);
    
    setDeleteResponse({
      success: true,
      message: response.message || 'Account deleted successfully!'
    });

    // Show success for 2 seconds
    setTimeout(async () => {
      console.log('🔄 ============ POST-DELETE REFRESH ============');
      
      // Reset delete modal state
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteResponse(null);
      
      // Clear selection state
      setSelectedAccount(null);
      setSelectedPlatform(null);
      setPlatformAccounts([]);
      
      // Navigate to main FIRST
      setSection('main');
      
      // Wait a moment for navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear current accounts to force refresh
      setAccounts([]);
      
      // Wait another moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch fresh data
      console.log('📡 Fetching fresh accounts after delete...');
      await fetchUserAccounts();
      
      console.log('✅ ============ REFRESH COMPLETE ============');
    }, 2000);
    
  } catch (err) {
    console.error('❌ ============ DELETE FAILED ============');
    console.error('Error:', err);
    console.error('Error Message:', err.message);
    
    setDeleteResponse({
      success: false,
      message: err.message || 'Failed to delete account'
    });
    setDeleting(false);
  }
};

  if (!isOpen) return null;

  // Alert Modal Component
  if (alertModal.show) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 rounded-md flex items-center justify-center overflow-y-auto z-[10005]">
        <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-md shadow-2xl">
          <div className="text-center py-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              alertModal.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {alertModal.type === 'success' ? (
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <AlertCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <p className={`text-lg font-medium mb-2 ${
              alertModal.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {alertModal.type === 'success' ? 'Success!' : 'Error'}
            </p>
            <p className="text-gray-300 text-sm mb-6">
              {alertModal.message}
            </p>
            <button
              onClick={() => setAlertModal({ show: false, type: '', message: '' })}
              className="px-6 py-3 bg-[#613cd0] hover:bg-[#7050d5] text-white rounded-full transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Delete Confirmation Modal
  if (showDeleteModal) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 rounded-md flex items-center justify-center overflow-y-auto z-[10004]">
        <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-md shadow-2xl">
          <div className="w-full flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Delete Account</h3>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteResponse(null);
              }}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={deleting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!deleteResponse ? (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-gray-300">
                    Are you sure you want to permanently delete this account listing? This action cannot be undone.
                  </p>
                </div>

                <div className="p-4 bg-neutral-900 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Account Details:</p>
                  <p className="text-white font-medium">
                    {selectedAccount?.filters?.find(f => f.key === 'username')?.value || 'N/A'}
                  </p>
                  <p className="text-gray-400 text-sm capitalize mt-1">
                    {selectedAccount?.platform}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteResponse(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                deleteResponse.success ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {deleteResponse.success ? (
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-400" />
                )}
              </div>
              <p className={`text-lg font-medium mb-2 ${
                deleteResponse.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {deleteResponse.success ? 'Success!' : 'Error'}
              </p>
              <p className="text-gray-300 text-sm">
                {deleteResponse.message}
              </p>
              {deleteResponse.success && (
                <p className="text-gray-400 text-xs mt-2">
                  Closing in a moment...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER UPDATE FORMS FIRST - This is critical!
  // Metrics Update Forms
  if (showMetricsUpdateForm && selectedAccount) {
    console.log('🟢 RENDERING METRICS FORM - Form is now visible!', selectedAccount.platform);
    
    const platform = selectedAccount.platform?.toLowerCase();
    
    if (platform === 'qoura' || platform === 'quora') {
      return (
        <QouraMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'facebook') {
      return (
        <FacebookMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'twitter') {
      return (
        <TwitterMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'instagram') {
      return (
        <InstagramMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'tiktok') {
      return (
        <TiktokMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'linkedin') {
      return (
        <LinkedinMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'snapchat') {
      return (
        <SnapchatMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'youtube') {
      return (
        <YoutubeMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'telegram') {
      return (
        <TelegramMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'discord') {
      return (
        <DiscordMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'pinterest') {
      return (
        <PinterestMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'reddit') {
      return (
        <RedditMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'wechat') {
      return (
        <WechatMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'onlyfans') {
      return (
        <OnlyfansMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'flickr') {
      return (
        <FlickrMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'vimeo') {
      return (
        <VimeoMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'rumble') {
      return (
        <RumbleMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'twitch') {
      return (
        <TwitchMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'tumblr') {
      return (
        <TumblrMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'steam') {
      return (
        <SteamMetricUpdateForm 
          isOpen={showMetricsUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING METRICS FORM');
            setShowMetricsUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.metrics}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
  }

  // Filters Update Forms
  if (showFiltersUpdateForm && selectedAccount) {
    console.log('🟢 RENDERING FILTERS FORM - Form is now visible!', selectedAccount.platform);
    
    const platform = selectedAccount.platform?.toLowerCase();
    
    if (platform === 'qoura' || platform === 'quora') {
      return (
        <QouraFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'facebook') {
      return (
        <FacebookFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'twitter') {
      return (
        <TwitterFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'instagram') {
      return (
        <InstagramFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'tiktok') {
      return (
        <TiktokFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'linkedin') {
      return (
        <LinkedinFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'snapchat') {
      return (
        <SnapchatFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'youtube') {
      return (
        <YoutubeFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'telegram') {
      return (
        <TelegramFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'discord') {
      return (
        <DiscordFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'pinterest') {
      return (
        <PinterestFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'reddit') {
      return (
        <RedditFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'wechat') {
      return (
        <WechatFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'onlyfans') {
      return (
        <OnlyfansFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'flickr') {
      return (
        <FlickrFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'vimeo') {
      return (
        <VimeoFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'rumble') {
      return (
        <RumbleFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'twitch') {
      return (
        <TwitchFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'tumblr') {
      return (
        <TumblrFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
    if (platform === 'steam') {
      return (
        <SteamFilterUpdateForm 
          isOpen={showFiltersUpdateForm} 
          onClose={() => {
            console.log('🔴 CLOSING FILTERS FORM');
            setShowFiltersUpdateForm(false);
          }}
          onSubmit={handleUpdateFormSubmit}
          existingData={selectedAccount.filters}
          accountId={selectedAccount._id || selectedAccount.id}
        />
      );
    }
  }

  // Price Form Modal
  if (showPriceForm && selectedAccount) {
    console.log('🟢 RENDERING PRICE FORM - Form is now visible!');
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90 rounded-md flex items-center justify-center overflow-y-auto z-[10003]">
        <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-lg shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="w-full flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Update Pricing & Details</h3>
            <button
              onClick={() => {
                console.log('🔴 CLOSING PRICE FORM');
                setShowPriceForm(false);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handlePriceSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                value={priceData.accountType}
                onChange={(e) => setPriceData(prev => ({ ...prev, accountType: e.target.value }))}
                required
                className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
              >
                <option value="">Select Account Type</option>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="creator">Creator</option>
                <option value="verified">Verified</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={priceData.price}
                onChange={(e) => setPriceData(prev => ({ ...prev, price: e.target.value }))}
                step="0.01"
                required
                className="w-full px-3 py-4 bg-[rgba(255,255,255,0.1)] text-xs rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#613cd0]"
                placeholder="Enter Price"
              />
            </div>

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
                <option value="usdt">USDT</option>
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </select>
            </div>

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
                placeholder="Describe your account..."
              />
            </div>

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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={priceData.isFeatured}
                onChange={(e) => setPriceData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="featured" className="text-sm cursor-pointer">
                Make this a featured listing
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 px-4 py-3 text-white rounded-full transition-colors ${
                  saving
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-[#613cd0] hover:bg-[#7050d5]'
                }`}
              >
                {saving ? 'Updating...' : 'Update Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main Platform List View
  if (section === 'main') {
    const groupedAccounts = groupAccountsByPlatform(accounts);

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90  flex items-center justify-center overflow-y-auto">
        <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-2xl shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="w-full flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-semibold">
              Social Accounts
            </h2>
            <button
onClick={handleModalClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-400 mt-4">Loading accounts...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No accounts listed yet</p>
              <button 
                onClick={onClose}
                className="text-sm py-3 px-8 rounded-full bg-[#dcd0ff] text-primary font-semibold hover:bg-[#dcd0ff]/80"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAccounts).map(([platform, platformAccounts]) => (
                <div key={platform} className="rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/20">
                        {platformIcons[platform] && (
                          <img src={platformIcons[platform]} alt={platform} className="w-6 h-6" />
                        )}
                      </div>
                      <h3 className="text-white font-medium capitalize">
                        {platform}
                      </h3>
                    </div>
                      
                    <span className="text-gray-400 text-sm">
                      {platformAccounts.length} Account{platformAccounts.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="bg-neutral-900 rounded-lg">
                    {platformAccounts.map((account, index) => (
                      <div
                        key={account._id || account.id}
                        className={`flex items-center justify-between p-2 lg:p-3 hover:bg-neutral-800 transition-colors cursor-pointer ${
                          index !== platformAccounts.length - 1 ? 'border-b border-gray-500/20' : ''
                        }`}
                        onClick={() => handlePlatformClick(platform, account)}
                      >
                        <div className="flex items-center lg:gap-3">
                          <div className="flex flex-col lg:flex-row">
                            <div className="flex items-center gap-1 lg:gap-2 ml-2 lg:ml-5">
                              <div className="flex flex-col gap-1">
                                <span className="text-white font-bold text-sm">Account Username</span>
                                <span className={`text-md rounded-full text-gray-400`}>
                                  {account.filters?.find(f => f.key === 'username')?.value || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <svg 
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              className="text-gray-400"
                            >
                              <path 
                                d="M9 18l6-6-6-6" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Platform Accounts List View - Now showing ONLY the selected account
  if (section === 'platform-list' && platformAccounts.length > 0) {
    const account = platformAccounts[0];
    const score = calculateScore(account);

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90  flex items-center justify-center overflow-y-auto z-[10002]">
        <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBackToMain}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-white text-lg font-semibold">
              Manage Social Account
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg p-2">
              <div className="flex items-center justify-between mb-6 rounded-lg">
                <div className="relative w-20 h-20">
                  <div className={`w-full h-full border-4 ${getBorderColor(score)} rounded-full shadow-inner shadow-lg flex justify-center items-center bg-transparent`}>
                    <div className="text-md font-bold text-center">
                      <span className={getScoreColor(score)}>{score}</span>
                      <span className="text-white drop-shadow-sm">/100</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 ml-3">
                  <h3 className="text-md font-semibold mb-2">Account Credibility</h3>
                  <p className="text-[#868686] text-xs">
                    {score === 100 
                      ? 'Perfect! Your account has maximum credibility.' 
                      : 'Add more metrics and filters to enhance authenticity and attract better trades.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <div className="rounded-full flex items-center w-fit px-5 py-2 gap-2 justify-center bg-primary/50">
                  {platformIcons[selectedPlatform] && (
                    <img src={platformIcons[selectedPlatform]} alt={selectedPlatform} className="w-6 h-6" />
                  )}
                  <p className="text-[#868686] font-semibold text-sm">
                    {selectedPlatform?.charAt(0).toUpperCase() + selectedPlatform?.slice(1)}
                  </p>
                </div>
                <h3 className="text-white mt-3 font-medium capitalize">
                  Upload {selectedPlatform} Account Metrics & Filters
                </h3>
              </div>

              <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
                <div 
                  className="flex items-center justify-between p-3 border-b border-gray-500 w-full hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                  onClick={(e) => handleMetricsClick(account, e)}
                >
                  <div className="text-left w-full">
                    <h4 className="mb-3 flex items-center gap-2">
                      <span className="flex flex-col">
                        <span className="text-gray-400 text-base font-bold">
                          Account Metrics
                        </span>
                        <span className="mt-2 text-md font-extralight">Add at least three key metrics to upload your account and boost its credibility.</span>
                      </span>
                      {account.metrics && account.metrics.length > 0 && (
                        <span className="text-base text-green-500">✓</span>
                      )}
                    </h4>
                    
                    {account.metrics && account.metrics.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {account.metrics.slice(0, 6).map((metric, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="text-gray-400">{metric.key}</span>
                            <p className="text-white font-semibold">{metric.value || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-normal text-[rgba(255,255,255,0.7)]">
                        No metrics added yet
                      </p>
                    )}
                  </div>
                  <img src={arr} alt="" className="ml-3" />
                </div>

                <div 
                  className="flex items-center justify-between p-3 w-full hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                  onClick={(e) => handleFiltersClick(account, e)}
                >
                  <div className="text-left w-full">
                    <h4 className="text-xs font-bold mb-3 flex items-center gap-2">
                      <span className="flex flex-col">
                        <span className="text-gray-400 text-base font-bold">
                          Account Filter
                        </span>
                        <span className="mt-2 text-base font-extralight">Select at least three filters to help buyers find your account easily.</span>
                      </span>
                      {account.filters && account.filters.length > 0 && (
                        <span className="text-base text-green-500">✓</span>
                      )}
                    </h4>
                    
                    {account.filters && account.filters.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {account.filters.slice(0, 6).map((filter, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="text-gray-400">{filter.key}</span>
                            <p className="text-white font-semibold">{filter.value || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-normal text-[rgba(255,255,255,0.7)]">
                        No filters added yet
                      </p>
                    )}
                  </div>
                  <img src={arr} alt="" className="ml-3" />
                </div>
              </div>

              {/* Delete Button */}
              <div className="mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAccount(account);
                    setShowDeleteModal(true);
                  }}
                  className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ManageListedAccounts;