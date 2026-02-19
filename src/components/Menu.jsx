import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, Star, Info, LogOut, HelpCircle } from "lucide-react";
import badge from "../assets/verifiedstar.svg";
import profile from "../assets/profile.svg";
import support from '../assets/icon2.svg';
import wallet from '../assets/icon1.svg';
import userprofile from '../assets/icon4.svg';
import manage from '../assets/icon3.svg';
import purpleBadge from '../assets/purpleverified.svg';
import arrowright from '../assets/arrowright.svg';
import starRate from '../assets/star-rate.svg'
import about from '../assets/about.svg'
import signout from '../assets/sign-out.svg'
import ManageAccountModal from '../components/Desktop/AccountManagement'
import SupportModal from '../components/Desktop/Support'
import AboutModal from '../components/Desktop/AboutUs'
import RateAppModal from '../components/Desktop/RateOurApp'
import WalletSetupModal from '../components/Desktop/WalletModal';
import WalletTransactionModal from '../components/Desktop/WalletTransaction';
import { useUser } from '../context/userContext';
import authService from '../services/authService';

const Menu = ({ 
  showSlideMenu, 
  setShowSlideMenu, 
  isAuthenticated, 
  userData, 
  getUserInitial, 
  getVerificationProgress, 
  getVerificationFraction, 
  handleLogout,
  activeMenuSection,
  setActiveMenuSection,
  onShowSignIn,
  setActiveTab,      
  onShowSignUp
}) => {
  const { user } = useUser();

  // Modal states
  const [showManageModal, setShowManageModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletTransactionModal, setShowWalletTransactionModal] = useState(false);
  const [previousPage, setPreviousPage] = useState(null);

  // 🎨 UPDATED: Helper to get user avatar from context with better error handling
  const getUserAvatar = () => {
    const avatarUrl = user?.avatarUrl || user?.avatar || user?.bitmojiUrl || 
                      userData?.avatarUrl || userData?.avatar || userData?.bitmojiUrl;
    
    // Add error logging
    // if (avatarUrl) {
    // } else {
    // }
    
    return avatarUrl || null;
  };

  // Handle menu item clicks
  const handleMenuClick = (sectionName) => {
    setActiveMenuSection(sectionName);
    setActiveTab(sectionName);    
    setShowSlideMenu(false); 
  };

  // Handle wallet click - matches Navbar behavior with PIN check
  const handleWalletClick = async () => {
    try {
      const pinCheckResponse = await authService.checkTransactionPinExists();
      
      // Check if PIN exists using the correct property
      if (pinCheckResponse.status && pinCheckResponse.hasTransactionPin) {
        // PIN exists, open transaction modal directly
        setShowWalletTransactionModal(true);
        setShowSlideMenu(false); // Close menu when modal opens
      } else {
        // PIN doesn't exist, open setup modal
        console.log('🔌 No PIN found, opening setup modal');
        setShowWalletModal(true);
        setShowSlideMenu(false); // Close menu when modal opens
      }
    } catch (error) {
      console.error('❌ Error checking PIN status:', error);
      // On error, default to setup modal
      setShowWalletModal(true);
      setShowSlideMenu(false);
    }
  };

  const handleWalletSetupComplete = () => {
    setShowWalletModal(false);
    
    // Small delay to ensure modal transition is smooth
    setTimeout(() => {
      setShowWalletTransactionModal(true);
    }, 100);
  };

  // Handle modal opening (store current page before opening)
  const handleModalOpen = (modalType) => {
    setPreviousPage(activeMenuSection); // Store current page
    
    switch(modalType) {
      case 'manage':
        setShowManageModal(true);
        break;
      case 'support':
        setShowSupportModal(true);
        break;
      case 'about':
        setShowAboutModal(true);
        break;
      case 'rate':
        setShowRateModal(true);
        break;
    }
    setShowSlideMenu(false); // Close menu when modal opens
  };

  // Handle modal closing (restore previous page if needed)
  const handleModalClose = (modalType) => {
    switch(modalType) {
      case 'manage':
        setShowManageModal(false);
        break;
      case 'support':
        setShowSupportModal(false);
        break;
      case 'about':
        setShowAboutModal(false);
        break;
      case 'rate':
        setShowRateModal(false);
        break;
    }
    // Optionally restore previous page
    // setActiveMenuSection(previousPage);
  };



  return (
    <>
      <div
        className={`slide-menu fixed top-0 left-0 w-full h-full md:w-[30rem] md:top-[88px] md:h-[calc(100vh-88px-48px)] z-50 transform transition-transform duration-300 ease-in-out ${
          showSlideMenu ? "translate-x-0 md:translate-x-5" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col w-full h-full bg-black md:bg-transparent rounded-md overflow-y-auto menu-scrollable">
          <style jsx>{`
            /* Custom scrollbar styles for the menu */
            .menu-scrollable::-webkit-scrollbar {
              width: 8px !important;
              height: 8px !important;
            }

            .menu-scrollable::-webkit-scrollbar-track {
              background: #1f1f1f !important;
              border-radius: 4px !important;
            }

            .menu-scrollable::-webkit-scrollbar-thumb {
              background: #555 !important;
              border-radius: 4px !important;
            }

            .menu-scrollable::-webkit-scrollbar-thumb:hover {
              background: #666 !important;
            }

            .menu-scrollable::-webkit-scrollbar-corner {
              background: #1f1f1f !important;
            }

            /* Firefox */
            .menu-scrollable {
              scrollbar-width: thin !important;
              scrollbar-color: #555 #1f1f1f !important;
            }
          `}</style>
          
          <div className="bg-[#181818] rounded-md mb-2">
            {/* Close Button */}
            <div className="flex bg-[#181818] justify-start items-center md:mb-4">
              <button
                onClick={() => setShowSlideMenu(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="flex md:flex-col items-center px-3 md:px-0 md:mb-6">
              <div className="w-24 h-24 rounded-full flex bg-[#181818] items-center justify-center mb-2">
                {isAuthenticated && userData ? (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-[rgba(220,208,255,0.1)] rounded-full flex items-center justify-center text-purple-600 font-bold text-2xl overflow-hidden">
                    {getUserAvatar() ? (
                      <>
                        <img 
                          src={getUserAvatar()} 
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onLoad={() => {
                          }}
                          onError={(e) => {
                            console.error('❌ Menu - Failed to load avatar:', e.target.src);
                            console.error('❌ Menu - Error details:', e);
                            // Hide broken image and show fallback
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
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
                ) : (
                  <img src={profile} className="w-20 h-20 rounded-full" />
                )}
              </div>

              <button className="flex w-full justify-between lg:justify-center items-center px-3 text-left"
                onClick={() => handleMenuClick('profile')}

              >

                <div className="w'full flex flex-col items-start">
            <p className="text-gray-300 font-[400] text-sm text-center">
                {isAuthenticated && userData && userData.displayName
                  ? userData.displayName
                  : "Guest"}
              </p>

              <p className="block md:hidden text-xs text-[#8b8b8b]">profile & settings</p>
                </div>
   <img src={arrowright} className="block lg:hidden" alt="" />

   
              </button>
   

            </div>
          </div>

          
          {isAuthenticated ? (
            <>
              {/* Verification Section */}
                 <div className="flex items-center justify-between p-3 bg-white md:bg-[#181818] rounded-md mb-2 py-5">
               

                <div>

   <div className="flex items-center mb-4">
                  <h3 className="md:font-semibold text-black md:text-white text-[14px] pr-[5px]">
                    Complete Your Verification
                  </h3>
                  <img src={badge} className='hidden md:block' alt=""/>
                  <img src={purpleBadge} className='block md:hidden' alt=""/>

                </div>
                
                <div className="relative flex w-[50%] bg-[#8b8b8b] lg:bg-white rounded-full h-[5px]">
                  <div 
                    className="relative bg-primary h-[5px] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${getVerificationProgress()}%` }}
                  ></div>
                  <span className="text-sm absolute top-[-10px] right-[-29px] lg:font-medium text-black  lg:text-white">
                    {getVerificationFraction()}
                  </span>


                </div>
<div className="hidden md:flex mt-5">
  <button 
    className="text-sm bg-primary text-white py-3 px-6 rounded-full hover:bg-opacity-80 transition-colors"
    onClick={() => {
      if (!isAuthenticated) {
        setShowSlideMenu(false);
        onShowSignIn();
        return;
      }
      handleMenuClick('profile'); // This will set both activeMenuSection and activeTab to 'profile'
    }}
  >
    Verify Now
  </button>
</div>
                </div>
                      <button className="text-sm block md:hidden text-primary">
                    Verify Now
                  </button>
              </div>

              <div className="space-y-2  ">
                {/* Account Section - UPDATED with click handlers */}
                <div className="bg-[#181818] rounded-md p-2 " >
                  <h3 className="text-xs font-semibold mb-1 px-2">Account</h3>
                  <div>
                    {/* Profile - UPDATED */}
                    <div 
                      className={`flex items-center gap-3 p-3 hover:bg-white/5  rounded-lg cursor-pointer transition-colors ${
                        activeMenuSection === 'profile' ? 'bg-primary/20 border-l-2 border-primary' : ''
                      }`}
                      onClick={() => handleMenuClick('profile')}
                    >
                      <img src={userprofile} className="w-5 h-5 text-gray-400" />
                      <span className="text-white text-xs">Profile & Settings</span>
                    </div>

                    {/* Wallet - UPDATED to match Navbar behavior */}
                    <div 
                      className={`flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors ${
                        activeMenuSection === 'wallet' ? 'bg-primary/20 border-l-2 border-primary' : ''
                      }`}
                      onClick={handleWalletClick}
                    >
                      <img src={wallet} className="w-5 h-5 text-gray-400" />
                      <span className="text-white text-xs">Wallet</span>
                    </div>

                    {/* Account Management - UPDATED to open modal */}
                    <div 
                      className={`flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors ${
                        activeMenuSection === 'manage' ? 'bg-primary/20 border-l-2 border-primary' : ''
                      }`}
                      onClick={() => handleModalOpen('manage')}
                    >
                      <img src={manage} className="w-5 h-5 text-gray-400" />
                      <span className="text-white text-xs">Manage Account</span>
                    </div>
                  </div>
                </div>

                {/* Support Section - UPDATED */}
                <div className="bg-[#181818] rounded-md p-2">
                  <h3 className="text-xs font-semibold mb-1 px-2">Support</h3>
                  <div>
                    {/* Help Center & Support - UPDATED to open modal */}
                    <div 
                      className={`flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors ${
                        activeMenuSection === 'support' ? 'bg-primary/20 border-l-2 border-primary' : ''
                      }`}
                      onClick={() => handleModalOpen('support')}
                    >
                      <img src={support} className="w-5 h-5 text-gray-400" />
                      <span className="text-white text-xs">Help Center & Support</span>
                    </div>

                    {/* About Us - UPDATED to open modal */}
                    <div 
                      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleModalOpen('about')}
                    >
                      <img src={about} className="w-5 h-5 text-gray-400" />
                      <span className="text-white text-xs">About Us</span>
                    </div>

                    {/* Rate Our App - UPDATED to open modal */}
                    <div 
                      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleModalOpen('rate')}
                    >
                      <img src={starRate} className="w-5 h-5 text-gray-400" />
                      <span className="text-white text-xs">Rate Our App</span>
                    </div>
                  </div>
                </div>

                {/* Sign Out Section */}
                <div className="flex items-center justify-center lg:bg-[#181818] rounded-md">
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors group"
                    onClick={handleLogout}
                  >
                    <img src={signout} className="w-5 h-5 text-red-500 group-hover:text-red-400" />
                    <span className="text-red-500 group-hover:text-red-400 font-medium text-xs">
                      Sign Out
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Non-authenticated User Menu
            
         <div className="space-y-2 bg-[#181818] py-[1rem]">
  <div className="flex gap-3 mb-3">
    <button 
      className="flex-1 py-2.5 bg-primary text-xs rounded-full text-white font-medium hover:bg-opacity-70 transition-colors"
      onClick={() => {
        setShowSlideMenu(false); // Close menu first
        onShowSignUp();
      }}
    >
      Sign Up
    </button>
    <button 
      className="flex-1 py-2.5 bg-purple-100 text-xs rounded-full text-purple-600 font-medium hover:bg-purple-200 transition-colors"
      onClick={() => {
        setShowSlideMenu(false); // Close menu first
        onShowSignIn();
      }}
    >
      Sign In
    </button>
  </div>
              
              {/* Support Section */}
              <div className="bg-[#181818] rounded-md p-2">
                <h3 className="text-xs font-semibold mb-1 px-2">Support</h3>
                <div className="">
                  {/* Help Center & Support - UPDATED to open modal */}
                  <div 
                    className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleModalOpen('support')}
                  >
                    <HelpCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-white text-xs">Help Center & Support</span>
                  </div>

                  {/* About Us - UPDATED to open modal */}
                  <div 
                    className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleModalOpen('about')}
                  >
                    <Info className="w-5 h-5 text-gray-400" />
                    <span className="text-white text-xs">About Us</span>
                  </div>

                  {/* Rate Our App - UPDATED to open modal */}
                  <div 
                    className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleModalOpen('rate')}
                  >
                    <Star className="w-5 h-5 text-gray-400" />
                    <span className="text-white text-xs">Rate Our App</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Components */}
      <WalletSetupModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)}
        onSetupComplete={handleWalletSetupComplete}
      />
      <WalletTransactionModal 
        isOpen={showWalletTransactionModal}
        onClose={() => setShowWalletTransactionModal(false)}
      />
      <ManageAccountModal 
        isOpen={showManageModal} 
        onClose={() => handleModalClose('manage')} 
      />
      <SupportModal 
        isOpen={showSupportModal} 
        onClose={() => handleModalClose('support')} 
      />
      <AboutModal 
        isOpen={showAboutModal} 
        onClose={() => handleModalClose('about')} 
      />
      <RateAppModal 
        isOpen={showRateModal} 
        onClose={() => handleModalClose('rate')} 
      />
    </>
  );
};

export default Menu;