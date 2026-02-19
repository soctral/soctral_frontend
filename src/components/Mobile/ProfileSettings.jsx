import React, { useState, useRef } from 'react';
import { Star, Info, Check } from "lucide-react";
import badge from "../../assets/verifiedstar.svg";
import profile from "../../assets/profile.svg";
import backarr from '../../assets/backarr.svg'
import rightarrow from '../../assets/arrowright.svg'
import checkmark from '../../assets/checkmark.svg'
import ProfileUpdateModal from '../../components/Desktop/profileModel';
import authService from '../../services/authService';
import { useUser } from '../../context/userContext';
import purpleBadge from '../../assets/purpleverified.svg';

// 🎨 ADD THESE IMPORTS FOR DICEBEAR
import { createAvatar } from '@dicebear/core';
import { avataaars, bigSmile, bottts, funEmoji, lorelei, personas } from '@dicebear/collection';

// 🎨 GENERATE AVATAR URLs
const generateAvatarUrl = (style, seed) => {
  const avatar = createAvatar(style, { seed });
  return avatar.toDataUri();
};

// 🎨 UPDATED: Extended Avatar options using DiceBear (24 avatars for scrollable grid)
const BITMOJI_AVATARS = [
  // Avataaars style
  generateAvatarUrl(avataaars, 'Felix'),
  generateAvatarUrl(avataaars, 'Aneka'),
  generateAvatarUrl(avataaars, 'Luna'),
  generateAvatarUrl(avataaars, 'Max'),
  // BigSmile style
  generateAvatarUrl(bigSmile, 'Happy'),
  generateAvatarUrl(bigSmile, 'Joy'),
  generateAvatarUrl(bigSmile, 'Sunny'),
  generateAvatarUrl(bigSmile, 'Cheerful'),
  // Personas style
  generateAvatarUrl(personas, 'Alex'),
  generateAvatarUrl(personas, 'Sam'),
  generateAvatarUrl(personas, 'Jordan'),
  generateAvatarUrl(personas, 'Taylor'),
  // FunEmoji style
  generateAvatarUrl(funEmoji, 'Cool'),
  generateAvatarUrl(funEmoji, 'Wave'),
  generateAvatarUrl(funEmoji, 'Party'),
  generateAvatarUrl(funEmoji, 'Love'),
  // Lorelei style
  generateAvatarUrl(lorelei, 'Star'),
  generateAvatarUrl(lorelei, 'Moon'),
  generateAvatarUrl(lorelei, 'Sun'),
  generateAvatarUrl(lorelei, 'Cloud'),
  // Bottts style
  generateAvatarUrl(bottts, 'Bot1'),
  generateAvatarUrl(bottts, 'Bot2'),
];



const MobileProfileSettings = ({
  userData,
  section = 'aside',
  isAuthenticated,
  getUserInitial,
  getVerificationProgress,
  getVerificationFraction,
  getUserTier,
  onNavigateHome,
  onUpdateProfile,
}) => {
  // Modal state
  const { updateUserProfile, user } = useUser();

  // 🎨 Avatar state
  const [showBitmojiSelector, setShowBitmojiSelector] = useState(false);
  const [selectedBitmoji, setSelectedBitmoji] = useState(
    user?.avatar || user?.bitmojiUrl || userData?.avatar || userData?.bitmojiUrl || BITMOJI_AVATARS[0]
  );
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [uploadingCustomImage, setUploadingCustomImage] = useState(false);
  const fileInputRef = useRef(null);

  // 🔥 NEW: Avatar upload feedback modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [modalState, setModalState] = useState({
    isOpen: false,
    updateType: null,
    currentValue: '',
    isLoading: false
  });

  // Open modal function
  const openModal = (updateType, currentValue) => {
    setModalState({
      isOpen: true,
      updateType,
      currentValue,
      isLoading: false
    });
  };

  // Close modal function
  const closeModal = () => {
    setModalState({
      isOpen: false,
      updateType: null,
      currentValue: '',
      isLoading: false
    });
  };


  // Helper function to convert SVG data URI to PNG File
  const dataURItoPNGFile = (dataURI, filename) => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;

          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }

            const file = new File([blob], filename, { type: 'image/png' });
            resolve(file);
          }, 'image/png', 0.95);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = dataURI;
      } catch (error) {
        reject(error);
      }
    });
  };


  const handleBitmojiSelect = async (bitmojiUrl) => {
    try {
      setIsUpdatingAvatar(true);
      setSelectedBitmoji(bitmojiUrl);

      console.log('🎨 Converting avatar to PNG format...');

      const avatarFile = await dataURItoPNGFile(bitmojiUrl, `avatar-${Date.now()}.png`);

      console.log('📤 Uploading avatar file:', {
        name: avatarFile.name,
        type: avatarFile.type,
        size: `${(avatarFile.size / 1024).toFixed(2)} KB`
      });

      const response = await authService.uploadBitmoji(avatarFile);

      console.log('🔥 Full upload response:', JSON.stringify(response, null, 2));

      // 🔥 FIX: Use profileUrl directly from response instead of calling getCurrentUser
      if (response && response.data && response.data.profileUrl) {
        const newAvatarUrl = response.data.profileUrl;
        console.log('✅ Using profileUrl from response:', newAvatarUrl);

        // Update user context with the new avatar URL
        await updateUserProfile({
          avatarUrl: newAvatarUrl,
          avatar: newAvatarUrl,
          bitmojiUrl: newAvatarUrl
        });

        // Clear loading state and close modal IMMEDIATELY
        setIsUpdatingAvatar(false);
        setShowBitmojiSelector(false);

        // 🔥 Show success modal
        setSuccessMessage('Avatar updated successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);

      } else if (response && response.user) {
        await updateUserProfile(response.user);
        setIsUpdatingAvatar(false);
        setShowBitmojiSelector(false);

        setSuccessMessage('Avatar updated successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        throw new Error(response?.message || 'Failed to save avatar to server');
      }
    } catch (error) {
      console.error('❌ Failed to update Bitmoji avatar:', error);

      // 🔥 Show error modal instead of alert
      setErrorMessage(error.message || 'Failed to update avatar. Please try again.');
      setShowErrorModal(true);

      setSelectedBitmoji(user?.avatar || user?.bitmojiUrl || userData?.avatar || userData?.bitmojiUrl || BITMOJI_AVATARS[0]);
      setIsUpdatingAvatar(false);
    }
  };


  const handleProfileUpdate = async (action, data) => {
    setModalState(prev => ({ ...prev, isLoading: true }));

    try {
      if (action === 'sendOTP') {
        // Handle OTP sending for different update types
        if (data.type === 'displayName') {
          const userEmail = userData?.email;
          if (!userEmail) {
            throw new Error('User email not found');
          }

          const response = await authService.sendOTPForDisplayName(userEmail);
          return response;

        } else if (data.type === 'password') {
          const userEmail = userData?.email;
          if (!userEmail) {
            throw new Error('User email not found');
          }

          const response = await authService.sendOTPWithEmail(userEmail, 'change_password');
          return response;

        } else if (data.type === 'phoneNumber') {
          const response = await authService.sendOTP(data.newValue);
          return response;

        } else if (data.type === 'email') {
          const response = await authService.sendOTPWithEmail(data.newValue, 'email_change');
          return response;
        }

      } else if (action === 'update') {
        // Handle the actual updates with OTP verification
        if (data.type === 'displayName') {
          const updateData = {
            newDisplayName: data.newValue,
            email: userData?.email || '',
            phoneNumber: userData?.phoneNumber || ''
          };

          const response = await authService.updateDisplayName(updateData);

          // Update UserContext instead of calling onUpdateProfile
          if (response.user) {
            await updateUserProfile(response.user);
          }

          return response;

        } else if (data.type === 'password') {
          const updateData = {
            newPassword: data.newValue,
            email: userData?.email || '',
            phoneNumber: userData?.phoneNumber || ''
          };

          const response = await authService.changePassword(updateData);
          return response;

        } else if (data.type === 'phoneNumber') {
          await authService.verifyOTP(data.newValue, data.otp);

          const updateData = {
            newPhoneNumber: data.newValue,
            email: userData?.email || '',
            currentPhoneNumber: userData?.phoneNumber || ''
          };

          const response = await authService.updatePhoneNumber(updateData);

          // Update UserContext instead of calling onUpdateProfile
          if (response.user) {
            await updateUserProfile(response.user);
          }

          return response;

        } else if (data.type === 'email') {
          await authService.verifyOTPWithEmail(data.newValue, data.otp, 'email_change');

          const profileData = { email: data.newValue };
          const updateResponse = await authService.updateUserProfile(profileData);

          // Update UserContext instead of calling onUpdateProfile
          if (updateResponse.user) {
            await updateUserProfile(updateResponse.user);
          }

          return updateResponse;
        }
      }

      throw new Error('Invalid action or update type');

    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 🎨 Helper function to get avatar from context
  const getUserAvatar = () => {
    return user?.avatarUrl || user?.avatar || user?.bitmojiUrl || userData?.avatarUrl || userData?.avatar || userData?.bitmojiUrl || selectedBitmoji;
  };

  // Helper function to safely get user initial
  const safeGetUserInitial = () => {
    if (typeof getUserInitial === 'function') {
      try {
        return getUserInitial();
      } catch (error) {
        console.error('Error calling getUserInitial:', error);
      }
    }

    // Fallback: generate initial from displayName or email
    if (userData?.displayName) {
      return userData.displayName.charAt(0).toUpperCase();
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'G'; // Guest
  };

  // Helper function to get display name
  const getDisplayName = () => {
    // If we have user data, show the user's name regardless of auth status
    if (userData) {
      return userData?.displayName ||
        userData?.name ||
        userData?.firstName ||
        userData?.username ||
        (userData?.email ? userData.email.split('@')[0] : 'Guest');
    }
    return 'Guest';
  };

  // Safe function to get verification progress with fallback
  const safeGetVerificationProgress = () => {
    if (typeof getVerificationProgress === 'function') {
      try {
        return getVerificationProgress() || 0;
      } catch (error) {
        console.error('Error calling getVerificationProgress:', error);
        return 0;
      }
    }
    return 0; // Default fallback
  };

  // Safe function to get verification fraction with fallback
  const safeGetVerificationFraction = () => {
    if (typeof getVerificationFraction === 'function') {
      try {
        return getVerificationFraction();
      } catch (error) {
        console.error('Error calling getVerificationFraction:', error);
        return '1/3';
      }
    }
    return '1/3';
  };

  // Safe function to get user tier
  const safeGetUserTier = () => {
    if (typeof getUserTier === 'function') {
      try {
        return getUserTier();
      } catch (error) {
        console.error('Error calling getUserTier:', error);
        return 1;
      }
    }
    return 1; // Default to tier 1
  };



  // Handle navigation back to homepage
  const handleNavigateBack = () => {
    if (typeof onNavigateHome === 'function') {
      onNavigateHome();
    } else {
      // Fallback: navigate directly to homepage
      window.location.href = '/homepage';
    }
  };

  // Check verification status for each step
  const getVerificationSteps = () => {
    const currentTier = safeGetUserTier();

    return {
      signup: {
        completed: currentTier >= 1,
        title: 'Account Creation',
        description: 'Your account has been successfully created and you can now access basic features.',
        buttonText: currentTier >= 1 ? 'Completed' : 'Complete Signup'
      },
      email: {
        completed: currentTier >= 2,
        title: 'Email Verification',
        description: 'You will receive a verification link via email. Clicking the link confirms ownership of the email address and secures account recovery options.',
        buttonText: currentTier >= 2 ? 'Verified' : 'Verify Now'
      },
      facial: {
        completed: currentTier >= 3,
        title: 'Facial Verification',
        description: 'Capture a live facial image using your device\'s camera. This step ensures identity verification and prevents fraudulent activities.',
        buttonText: currentTier >= 3 ? 'Verified' : 'Verify Now'
      }
    };
  };

  // Check if we should show user info (either authenticated OR we have user data)
  const shouldShowUserInfo = isAuthenticated || userData;

  // Get current tier for display
  const currentTier = safeGetUserTier();
  const verificationSteps = getVerificationSteps();

  // Render aside content (replaces wallet component)
  if (section === 'aside') {
    return (
      <>


        {/* Profile Update Modal */}
        <ProfileUpdateModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          updateType={modalState.updateType}
          currentValue={modalState.currentValue}
          onUpdate={handleProfileUpdate}
          isLoading={modalState.isLoading}
        />
      </>
    );
  }

  // Render main content (replaces table section)
  if (section === 'main') {
    return (
      <>
        <div className="flex mt-[30px] flex-col h-full gap-4">
          <div className="flex mx-auto gap-6">
            <div className="w-[22rem] rounded-md relative overflow-hidden">
              <div className="relative z-10 mx-[10px]">
                {/* Profile Header - Updated with navigation */}
                <div
                  className='flex gap-2 mb-6 cursor-pointer items-center hover:opacity-80 transition-opacity'
                  onClick={handleNavigateBack}
                >
                  <img src={backarr} alt="Go back" />
                  <span className="text-gray-100 text-center mx-auto font-bold text-xl pr-7">Profile Details</span>
                </div>

                {/* 🎨 UPDATED: Profile Header with Avatar Upload */}
                <div className="flex flex-col mt-[64px] mb-6 items-center">
                  <div
                    className="w-20 h-20 rounded-full flex bg-[rgba(220,208,255,0.1)] items-center justify-center mb-3 cursor-pointer hover:opacity-80 transition-opacity relative"
                    onClick={() => !isUpdatingAvatar && setShowBitmojiSelector(true)}
                  >
                    {shouldShowUserInfo ? (
                      <>
                        <img
                          src={getUserAvatar()}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div
                          className="hidden w-full h-full text-purple-600 font-bold text-2xl items-center justify-center"
                        >
                          {safeGetUserInitial()}
                        </div>
                      </>
                    ) : (
                      <img src={profile} className="w-20 h-20 rounded-full" alt="Profile" />
                    )}

                    {/* Edit indicator */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 z-50 bg-primary rounded-full flex items-center justify-center border-2 border-[#181818]">
                      {isUpdatingAvatar ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span className="text-white text-xs">✏️</span>
                      )}
                    </div>
                  </div>
                  <span className="text-white font-medium text-center">
                    {getDisplayName()}
                  </span>
                </div>

                {/* Verification Status */}
                {shouldShowUserInfo && (
                  <div className="mb-6 p-4 bg-[#181818] rounded-lg">
                    <div className="flex gap-1 items-center mb-3">
                      <img src={badge} className="w-4 h-4" alt="verified" />
                      <h3 className="font-medium text-sm flex-1">Verification Level</h3>
                    </div>

                    {(() => {
                      const currentProgress = safeGetVerificationProgress();

                      return (
                        <div className="relative flex items-center w-[100%]">
                          {/* Step indicators container */}
                          <div className="flex items-start justify-between w-full relative">
                            {/* Connecting lines background - positioned relative to circles only */}
                            <div className="absolute top-3 left-3 right-3 h-[2px] bg-gray-300 z-0"></div>

                            {/* Progress line overlay */}
                            <div
                              className="absolute top-3 left-3 h-[2px] bg-purple-600 z-10 transition-all duration-500 ease-out"
                              style={{ width: `${Math.min((currentProgress / 100) * 270, 200)}%` }}
                            ></div>

                            {/* Step 1 - Account Creation */}
                            <div className="relative z-20 flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full border-2 border-white bg-white flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full border-2 border-purple-600 bg-white flex items-center justify-center">
                                  {verificationSteps.signup.completed ? (
                                    <img src={checkmark} className="w-16 h-16" alt="verified" />
                                  ) : null}
                                </div>
                              </div>
                              <span className="text-xs text-gray-100 mt-1">Tier 1</span>
                            </div>

                            {/* Step 2 - Email Verification */}
                            <div className="relative z-20 flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full border-2 border-white bg-white flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full border-2 border-purple-600 bg-white flex items-center justify-center">
                                  {verificationSteps.email.completed ? (
                                    <img src={checkmark} className="w-16 h-16" alt="verified" />
                                  ) : currentTier >= 1 ? (
                                    <span className="text-xs font-medium text-primary"></span>
                                  ) : null}
                                </div>
                              </div>
                              <span className={`text-xs mt-1 ${currentTier === 1 && !verificationSteps.email.completed ? 'text-primary font-medium' : 'text-gray-100'}`}>Tier 2</span>
                            </div>


                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-white md:bg-[#181818] rounded-md mb-2 py-5">


                  <div>

                    <div className="flex items-center mb-4">
                      <h3 className="md:font-semibold text-black md:text-white text-[14px] pr-[5px]">
                        Complete Your Verification
                      </h3>
                      <img src={badge} className='hidden md:block' alt="" />
                      <img src={purpleBadge} className='block md:hidden' alt="" />

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
                    <div className="hidden md:flex">
                      <button
                        className="text-sm bg-primary text-white py-3 px-6 rounded-full hover:bg-opacity-80 transition-colors"
                        onClick={() => {
                          if (!isAuthenticated) {

                            return;
                          }
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

              </div>
            </div>
          </div>


          <div className='px-[24px]'>
            {/* Personal Information */}
            <h2 className='text-base pb-3'>Personal Information</h2>

            <div className="bg-[#181818] flex-1 rounded-md space-y-7 p-4">

              <div
                className='flex items-center justify-between px-2 cursor-pointer hover:bg-white/5 rounded-md py-2 transition-colors'
                onClick={() => openModal('displayName', getDisplayName())}
              >
                <div>
                  <label className="block text-sm text-gray-400 pb-3">Display Name</label>
                  <span>{getDisplayName() !== 'Guest' ? getDisplayName() : ''}</span>
                </div>
                <img src={rightarrow} alt="" />
              </div>

              <div
                className='flex items-center justify-between px-2 cursor-pointer hover:bg-white/5 rounded-md py-2 transition-colors'
                onClick={() => openModal('phoneNumber', userData?.phone || userData?.phoneNumber || '')}
              >
                <div>
                  <label className="block text-sm text-gray-400 pb-3">Phone Number</label>
                  <span>{userData?.phone || userData?.phoneNumber || ''}</span>
                </div>
                <img src={rightarrow} alt="" />
              </div>

              <div
                className='flex items-center justify-between px-2 cursor-pointer hover:bg-white/5 rounded-md py-2 transition-colors'
                onClick={() => openModal('email', userData?.email || '')}
              >
                <div>
                  <label className="block text-sm text-gray-400 pb-3">Email Address</label>
                  <span>{userData?.email || ''}</span>
                </div>
                <img src={rightarrow} alt="" />
              </div>
            </div>


          </div>

          {/* Security & Privacy */}

          <div className='px-[24px]'>
            <h2 className='text-base pb-3'>Security & Privacy</h2>

            <div className="bg-[#181818] flex-1 rounded-md space-y-7 p-4">

              <div
                className='flex items-center justify-between px-2 cursor-pointer hover:bg-white/5 rounded-md py-2 transition-colors'
                onClick={() => openModal('password', '')}
              >
                <div>
                  <label className="block text-sm text-gray-400 pb-3">Password</label>
                  <span className='text-white'>Change Password</span>
                </div>
                <img src={rightarrow} alt="" />
              </div>

              <div className='flex items-center justify-between px-2'>
                <div>
                  <label className="block text-sm text-gray-400 pb-3">Transaction PIN</label>
                  <span>Reset Transaction PIN</span>
                </div>
                <img src={rightarrow} alt="" />
              </div>
            </div>

          </div>


        </div>

        {/* 🎨 Avatar Selector Modal - UPDATED with scroll indicator */}
        {showBitmojiSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Choose Your Avatar</h3>
                <button
                  onClick={() => setShowBitmojiSelector(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  disabled={isUpdatingAvatar || uploadingCustomImage}
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* Avatar count and instructions */}
              <div className="mb-3">
                <p className="text-sm text-gray-400">Select an avatar ({BITMOJI_AVATARS.length} options)</p>
              </div>

              {/* DiceBear Avatar Grid - Scrollable */}
              <div className="relative">
                <div className="max-h-[300px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-3 gap-3">
                    {BITMOJI_AVATARS.map((bitmojiUrl, index) => (
                      <div
                        key={index}
                        onClick={() => !isUpdatingAvatar && !uploadingCustomImage && handleBitmojiSelect(bitmojiUrl)}
                        className={`cursor-pointer rounded-lg p-2 transition-all hover:bg-white/10 ${getUserAvatar() === bitmojiUrl ? 'bg-primary/20 ring-2 ring-primary' : ''
                          } ${isUpdatingAvatar || uploadingCustomImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <img
                          src={bitmojiUrl}
                          alt={`Avatar ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 🔥 Scroll Indicator */}
                <div className="flex flex-col items-center mt-3 animate-bounce">
                  <span className="text-xs text-gray-400 mb-1">Scroll for more</span>
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>

              {(isUpdatingAvatar || uploadingCustomImage) && (
                <div className="mt-4 text-center text-sm text-gray-400">
                  {uploadingCustomImage ? 'Uploading custom image...' : 'Updating avatar...'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🔥 Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-[#181818] rounded-xl p-6 w-full max-w-sm text-center border border-green-500/30">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Success!</h3>
              <p className="text-gray-400">{successMessage}</p>
            </div>
          </div>
        )}

        {/* 🔥 Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-[#181818] rounded-xl p-6 w-full max-w-sm text-center border border-red-500/30">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-3xl text-red-500">✕</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Error</h3>
              <p className="text-gray-400 mb-4">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 bg-primary text-white rounded-full hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Profile Update Modal */}
        <ProfileUpdateModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          updateType={modalState.updateType}
          currentValue={modalState.currentValue}
          onUpdate={handleProfileUpdate}
          isLoading={modalState.isLoading}
        />
      </>
    );
  }

  // Default fallback
  return null;
};

export default MobileProfileSettings;