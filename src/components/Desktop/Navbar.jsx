import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Bell, X, Wallet, TrendingUp, MessageCircle, History } from "lucide-react";
import dotmenu from "../../assets/menu.svg";
import WalletSetupModal from "../../components/Desktop/WalletModal";
import ReferralsModal from "../../components/Desktop/ReferralModal";
import Notification from "../../components/Desktop/notification";
import BuySellModal from "../../components/Desktop/buysellModal";
import BuySellTable from "../../components/Desktop/buysellTable";
import { useUser } from '../../context/userContext';
import authService from '../../services/authService';
import WalletTransactionModal from '../../components/Desktop/WalletTransaction';


const Navbar = ({
  showSlideMenu,
  setShowSlideMenu,
  activeTab,
  setActiveTab,
  isAuthenticated,
  userData,
  getUserInitial,
  onShowSignIn,
  onShowSignUp,
  onNavigateHome,
  setActiveMenuSection,
  chatUnreadCount = 0,
  walletData = null  // 🔥 NEW: Receive wallet data for WalletTransactionModal
}) => {
  const { user } = useUser();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBuySellModal, setShowBuySellModal] = useState(false);
  const [showBuySellOnboarding, setShowBuySellOnboarding] = useState(false);
  const [hasSeenBuySellOnboarding, setHasSeenBuySellOnboarding] = useState(false);
  const [authModalType, setAuthModalType] = useState('');
  const [showWalletTransactionModal, setShowWalletTransactionModal] = useState(false);

  // 🎨 UPDATED: Helper to get user avatar from context with better error handling
  const getUserAvatar = () => {
    const avatar = user?.avatarUrl || user?.avatar || user?.bitmojiUrl ||
      userData?.avatarUrl || userData?.avatar || userData?.bitmojiUrl;

    if (avatar) {
      // Check if it's a valid URL or data URI
      if (avatar.startsWith('http') || avatar.startsWith('data:')) {
        return avatar;
      } else {
        console.warn('⚠️ Navbar - Invalid avatar URL format:', avatar);
        return null;
      }
    }

    return null;
  };

  const handleNavigateHome = () => {
    if (typeof onNavigateHome === 'function') {
      onNavigateHome();
    } else {
      window.location.href = '/homepage';
    }
  };

  const handleTabClick = async (tabName) => {
    // Close wallet modals when switching to any other tab
    if (tabName !== 'wallet') {
      setShowWalletModal(false);
      setShowWalletTransactionModal(false);
    }

    if (tabName === 'home') {
      handleNavigateHome();
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
    } else if (tabName === 'wallet') {
      try {
        const pinCheckResponse = await authService.checkTransactionPinExists();

        // Check if PIN exists using the correct property
        if (pinCheckResponse.status && pinCheckResponse.hasTransactionPin) {
          // PIN exists, open transaction modal directly
          setShowWalletTransactionModal(true);
        } else {
          // PIN doesn't exist, open setup modal
          setShowWalletModal(true);
        }
      } catch (error) {
        console.error('❌ Error checking PIN status:', error);
        // On error, default to setup modal
        setShowWalletModal(true);
      }
    } else if (tabName === 'chat') {
      setActiveTab("chat");
      setActiveMenuSection("chat");
    } else if (tabName === 'history') {
      setActiveTab("history");
      setActiveMenuSection("wallet");
    } else {
      setActiveTab(tabName);
      setActiveMenuSection("wallet");
    }
  };

  const handleWalletSetupComplete = () => {
    setShowWalletModal(false);

    // Small delay to ensure modal transition is smooth
    setTimeout(() => {
      setShowWalletTransactionModal(true);
    }, 100);
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

  return (
    <>
      {showNotificationPanel && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setShowNotificationPanel(false)}
        />
      )}

      <nav className="bg-[#181818] border-b border-white/10 px-6 py-4 relative z-40">
        <div className="flex justify-between items-center max-w-7xl px-6 mx-auto">
          <div className="flex items-center gap-2">
            <button
              className="dot-menu"
              onClick={() => setShowSlideMenu(!showSlideMenu)}
            >
              <div className="h-[20px] w-[20px] cursor-pointer hover:opacity-80 transition-opacity">
                <img src={dotmenu} alt="" />
              </div>
            </button>

            <h1 className="text-base font-medium">
              {isAuthenticated && userData && userData.displayName
                ? `Hello, ${userData.displayName}`
                : "Welcome to Soctral"}
            </h1>

            <div className="flex items-center text-base gap-4">
              <button
                onClick={() => handleTabClick("home")}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${activeTab === "home"
                  ? "text-purple-300"
                  : "text-gray-300 hover:text-purple-300"
                  }`}
              >
                <span>Home</span>
              </button>

              <button
                onClick={() => handleTabClick("wallet")}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${activeTab === "wallet"
                  ? "text-purple-300"
                  : "text-gray-300 hover:text-purple-300"
                  }`}
              >
                <span>Wallet</span>
              </button>

              <button
                onClick={() => handleTabClick("trade")}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ${activeTab === "trade"
                  ? "text-purple-300"
                  : "text-gray-300 hover:text-purple-300"
                  }`}
              >
                <span>Buy/Sell</span>
              </button>

              <button
                onClick={() => handleTabClick("chat")}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 relative ${activeTab === "chat"
                  ? "text-purple-300"
                  : "text-gray-300 hover:text-purple-300"
                  }`}
              >
                <span>Chat</span>
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabClick("history")}
                className={`flex items-center gap-2 rounded-lg transition-all duration-200 ${activeTab === "history"
                  ? "text-purple-300"
                  : "text-gray-300 hover:text-purple-300"
                  }`}
              >
                <span>History</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-[rgba(255,255,255,0.1);] rounded-full p-2">
                <Gift
                  className="h-4 w-4 text-gray-300 hover:text-white cursor-pointer transition-colors"
                  onClick={handleReferralsClick}
                />
              </div>
              <div className="bg-[rgba(255,255,255,0.1);] rounded-full p-2">
                <Bell
                  className="h-4 w-4 text-gray-300 hover:text-white cursor-pointer transition-colors"
                  onClick={handleNotificationClick}
                />
              </div>
            </div>

            {/* 🎨 UPDATED: Avatar with better error handling and fallback */}
            {isAuthenticated && userData ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[rgba(220,208,255,0.1)] rounded-full flex items-center justify-center text-purple-600 font-medium text-sm overflow-hidden">
                  {getUserAvatar() ? (
                    <>
                      <img
                        src={getUserAvatar()}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('❌ Navbar - Failed to load avatar image:', e.target.src);
                          console.error('❌ Navbar - Error details:', e);
                          e.target.style.display = 'none';
                          // Show the fallback initial
                          const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                        onLoad={() => {
                        }}
                      />
                      <div
                        className="avatar-fallback hidden w-full h-full flex items-center justify-center"
                      >
                        {getUserInitial()}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getUserInitial()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 py-2 text-[12px] whitespace-nowrap bg-primary px-9 bg-p rounded-full text-white font-medium hover:opacity-70 transition-colors">
                  <button onClick={onShowSignIn}>Sign In</button>
                </div>
                <div className="flex-1 text-[12px] whitespace-nowrap py-2 px-9 bg-purple-100 rounded-full text-purple-600 font-medium hover:bg-purple-200 transition-colors">
                  <button onClick={onShowSignUp}>Sign Up</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <WalletSetupModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSetupComplete={handleWalletSetupComplete}
      />

      <WalletTransactionModal
        isOpen={showWalletTransactionModal}
        onClose={() => setShowWalletTransactionModal(false)}
        walletData={walletData}  // 🔥 Pass wallet data for real-time balances
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
                  <button className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:opacity-70 transition-colors">
                    <button onClick={onShowSignIn}>Sign In</button>
                  </button>
                  <button className="px-6 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors">
                    <button onClick={onShowSignUp}>Sign Up</button>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;