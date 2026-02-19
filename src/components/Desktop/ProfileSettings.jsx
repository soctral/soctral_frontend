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

// 🎨 ADD THESE IMPORTS FOR DICEBEAR
import { createAvatar } from '@dicebear/core';
import { avataaars, bigSmile, bottts, funEmoji, lorelei, personas } from '@dicebear/collection';

// 🎨 GENERATE AVATAR URLs (replaces your Bitmoji URLs)
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
  generateAvatarUrl(avataaars, 'Sophie'),
  generateAvatarUrl(avataaars, 'Jake'),
  // BigSmile style
  generateAvatarUrl(bigSmile, 'Happy'),
  generateAvatarUrl(bigSmile, 'Joy'),
  generateAvatarUrl(bigSmile, 'Smile'),
  generateAvatarUrl(bigSmile, 'Sunny'),
  // Personas style
  generateAvatarUrl(personas, 'Alex'),
  generateAvatarUrl(personas, 'Sam'),
  generateAvatarUrl(personas, 'Jordan'),
  generateAvatarUrl(personas, 'Taylor'),
  // FunEmoji style
  generateAvatarUrl(funEmoji, 'Cool'),
  generateAvatarUrl(funEmoji, 'Wave'),
  generateAvatarUrl(funEmoji, 'Party'),
  generateAvatarUrl(funEmoji, 'Star'),
  // Lorelei style
  generateAvatarUrl(lorelei, 'Star'),
  generateAvatarUrl(lorelei, 'Moon'),
  generateAvatarUrl(lorelei, 'Sun'),
  generateAvatarUrl(lorelei, 'Cloud'),
  // Bottts style
  generateAvatarUrl(bottts, 'Bot1'),
  generateAvatarUrl(bottts, 'Bot2'),
];


const ProfileSettings = ({
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
  const { updateUserProfile, user } = useUser();

  // 🎨 UPDATED: Use user context for avatar
  const [showBitmojiSelector, setShowBitmojiSelector] = useState(false);
  const [selectedBitmoji, setSelectedBitmoji] = useState(
    user?.avatar || user?.bitmojiUrl || userData?.avatar || userData?.bitmojiUrl || BITMOJI_AVATARS[0]
  );
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [uploadingCustomImage, setUploadingCustomImage] = useState(false);
  const fileInputRef = useRef(null);
  const [showPinUpdateModal, setShowPinUpdateModal] = useState(false);
  const [pinUpdateData, setPinUpdateData] = useState({
    oldPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [pinUpdateLoading, setPinUpdateLoading] = useState(false);
  const [pinUpdateError, setPinUpdateError] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // 🔥 NEW: Avatar upload feedback modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');



  // Modal state
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
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = 200; // Set desired width
          canvas.height = 200; // Set desired height

          const ctx = canvas.getContext('2d');

          // Draw white background (optional, for transparency support)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }

            // Convert blob to file
            const file = new File([blob], filename, { type: 'image/png' });
            resolve(file);
          }, 'image/png', 0.95); // High quality PNG
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

      // Convert data URI to PNG File (backend only accepts JPEG, PNG, GIF, WebP)
      const avatarFile = await dataURItoPNGFile(bitmojiUrl, `avatar-${Date.now()}.png`);

      console.log('📤 Uploading avatar file:', {
        name: avatarFile.name,
        type: avatarFile.type,
        size: `${(avatarFile.size / 1024).toFixed(2)} KB`
      });

      // Upload using the dedicated bitmoji upload endpoint
      const response = await authService.uploadBitmoji(avatarFile);

      // ADD DETAILED LOGGING HERE
      console.log('📥 Full upload response:', JSON.stringify(response, null, 2));
      console.log('📊 Response keys:', Object.keys(response));
      console.log('✓ response.status:', response.status);
      console.log('✓ response.success:', response.success);
      console.log('✓ response.data:', response.data);

      // Check if upload was successful
      if (response && (response.status || response.success)) {
        // 🔥 FIX: Get the profileUrl from response.data and update immediately
        const newAvatarUrl = response.data?.profileUrl || response.user?.avatar || response.user?.bitmojiUrl;

        if (newAvatarUrl) {
          console.log('✅ Using profileUrl from response:', newAvatarUrl);
          // Update local state immediately with the new URL
          setSelectedBitmoji(newAvatarUrl);

          // Update user context with the new avatar
          await updateUserProfile({
            avatar: newAvatarUrl,
            bitmojiUrl: newAvatarUrl,
            avatarUrl: newAvatarUrl
          });
          console.log('✅ Avatar updated in user context');
        } else if (response.user) {
          // If full user object is returned, use it
          await updateUserProfile(response.user);
          console.log('✅ Avatar uploaded and user profile updated');
        } else {
          // 🔥 FIX: Don't call getCurrentUser - just use the selected bitmoji
          console.log('ℹ️ No profileUrl or user in response, keeping selected avatar');
          // The avatar was already set at the start, so just proceed
        }

        // 🔥 Clear loading state and close modal immediately
        setIsUpdatingAvatar(false);
        setShowBitmojiSelector(false);

        // 🔥 Show success modal
        setSuccessMessage('Your profile picture has been updated successfully!');
        setShowSuccessModal(true);

        // Auto-hide success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
        }, 3000);

      } else {
        throw new Error(response?.message || 'Failed to save avatar to server');
      }
    } catch (error) {
      console.error('❌ Failed to update Bitmoji avatar:', error);

      // 🔥 Show error modal instead of alert()
      setErrorMessage(error.message || 'Failed to update avatar. Please try again.');
      setShowErrorModal(true);

      // Revert to previous avatar on error
      setSelectedBitmoji(user?.avatar || user?.bitmojiUrl || userData?.avatar || userData?.bitmojiUrl || BITMOJI_AVATARS[0]);
      setIsUpdatingAvatar(false);
    }
  };



  // // 🎨 NEW: Handle custom image upload
  // const handleCustomImageUpload = async (event) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   // Validate file type
  //   const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  //   if (!validTypes.includes(file.type)) {
  //     alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
  //     return;
  //   }

  //   // Validate file size (max 5MB)
  //   const maxSize = 5 * 1024 * 1024;
  //   if (file.size > maxSize) {
  //     alert('Image size must be less than 5MB');
  //     return;
  //   }

  //   try {
  //     setUploadingCustomImage(true);

  //     console.log('📤 Uploading custom image...');
  //     // Upload the file using the dedicated bitmoji upload endpoint
  //     const response = await authService.uploadBitmoji(file);

  //     if (response.status && response.user) {
  //       // Update the avatar with the uploaded image URL
  //       setSelectedBitmoji(response.user.avatar || response.user.bitmojiUrl);

  //       // Update user context
  //       await updateUserProfile(response.user);

  //       console.log('✅ Custom image uploaded successfully');
  //       setShowBitmojiSelector(false);
  //     }
  //   } catch (error) {
  //     console.error('❌ Failed to upload custom image:', error);
  //     alert(error.message || 'Failed to upload image. Please try again.');
  //   } finally {
  //     setUploadingCustomImage(false);
  //     // Reset file input
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = '';
  //     }
  //   }
  // };



  // Handle profile updates with correct API integration
  const handleProfileUpdate = async (action, data) => {
    setModalState(prev => ({ ...prev, isLoading: true }));

    try {
      if (action === 'sendOTP') {
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
        if (data.type === 'displayName') {
          const updateData = {
            newDisplayName: data.newValue,
            email: userData?.email || '',
            phoneNumber: userData?.phoneNumber || ''
          };

          const response = await authService.updateDisplayName(updateData);

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

          if (response.user) {
            await updateUserProfile(response.user);
          }

          return response;

        } else if (data.type === 'email') {
          await authService.verifyOTPWithEmail(data.newValue, data.otp, 'email_change');

          const profileData = { email: data.newValue };
          const updateResponse = await authService.updateUserProfile(profileData);

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




  // Add this handler function after handleProfileUpdate
  const handleUpdateTransactionPin = async () => {
    try {
      setPinUpdateLoading(true);
      setPinUpdateError('');

      // Validate inputs
      if (!pinUpdateData.oldPin || !pinUpdateData.newPin || !pinUpdateData.confirmPin) {
        setPinUpdateError('All fields are required');
        return;
      }

      if (pinUpdateData.newPin !== pinUpdateData.confirmPin) {
        setPinUpdateError('New PIN and confirmation do not match');
        return;
      }

      if (pinUpdateData.oldPin === pinUpdateData.newPin) {
        setPinUpdateError('New PIN must be different from old PIN');
        return;
      }

      if (!/^\d{4}$/.test(pinUpdateData.newPin)) {
        setPinUpdateError('PIN must be exactly 4 digits');
        return;
      }

      // Call the update API
      const response = await authService.updateTransactionPin(
        pinUpdateData.oldPin,
        pinUpdateData.newPin
      );

      if (response.status) {
        alert('Transaction PIN updated successfully!');
        setShowPinUpdateModal(false);
        setPinUpdateData({ oldPin: '', newPin: '', confirmPin: '' });
      }
    } catch (error) {
      console.error('PIN update error:', error);
      setPinUpdateError(error.message || 'Failed to update transaction PIN');
    } finally {
      setPinUpdateLoading(false);
    }
  };





  // 🎨 UPDATED: Helper function to get Bitmoji avatar from context
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

    if (userData?.displayName) {
      return userData.displayName.charAt(0).toUpperCase();
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'G';
  };

  // Helper function to get display name
  const getDisplayName = () => {
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
    return 0;
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
    return 1;
  };

  // Handle navigation back to homepage
  const handleNavigateBack = () => {
    if (typeof onNavigateHome === 'function') {
      onNavigateHome();
    } else {
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

  const shouldShowUserInfo = isAuthenticated || userData;
  const currentTier = safeGetUserTier();
  const verificationSteps = getVerificationSteps();

  // Render aside content (replaces wallet component)
  if (section === 'aside') {
    return (
      <>
        <div className="flex mx-auto gap-6 h-[]">
          <div className="bg-[#181818] w-[22rem] rounded-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10 p-4">
              <div
                className='flex gap-2 mb-6 cursor-pointer items-center hover:opacity-80 transition-opacity'
                onClick={handleNavigateBack}
              >
                <img src={backarr} alt="Go back" />
                <span className="text-gray-400 text-sm">Profile Settings</span>
              </div>

              {/* 🎨 UPDATED: Profile Header with Bitmoji */}
              <div className="flex flex-col mb-6 items-center relative">
                <div
                  className="w-20 h-20 rounded-full flex bg-[rgba(220,208,255,0.1)] items-center justify-center mb-3 cursor-pointer hover:opacity-80 transition-opacity relative "
                  onClick={() => !isUpdatingAvatar && !uploadingCustomImage && setShowBitmojiSelector(true)}
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
                    {isUpdatingAvatar || uploadingCustomImage ? (
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
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <div className="flex gap-1 items-center mb-3">
                    <img src={badge} className="w-4 h-4" alt="verified" />
                    <h3 className="font-medium text-sm flex-1">Verification Level</h3>
                  </div>

                  {(() => {
                    const currentProgress = safeGetVerificationProgress();

                    return (
                      <div className="relative flex items-center w-[100%]">
                        <div className="flex items-start justify-between w-full relative">
                          <div className="absolute top-3 left-3 right-3 h-[2px] bg-gray-300 z-0"></div>

                          <div
                            className="absolute top-3 left-3 h-[2px] bg-purple-600 z-10 transition-all duration-500 ease-out"
                            style={{ width: `${Math.min((currentProgress / 100) * 270, 200)}%` }}
                          ></div>

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

              <div>
                <h1 className='text-md font-semibold mb-2'>
                  {currentTier >= 3 ? 'Verification Complete!' : `Tier ${Math.min(currentTier + 1, 3)} Verification`}
                </h1>

                <span className='font-normal text-xs leading-6 mb-4 text-gray-400'>
                  {currentTier >= 3
                    ? 'Your account is fully verified and you can access all trading features.'
                    : `Upgrade your account level to Tier ${Math.min(currentTier + 1, 3)} and start trading on soctral.`
                  }
                </span>
              </div>

              <div className='bg-white/5 rounded-md p-3 h-[380px] overflow-y-auto'>
                <div className='flex flex-col items-start border-b border-gray-500 '>
                  <div className='flex items-center gap-2 mb-2'>
                    {verificationSteps.email.completed && (
                      <img src={checkmark} className="w-4 h-4" alt="verified" />
                    )}
                    <h3 className={`text-base tracking-[1px] mb-2 ${verificationSteps.email.completed ? 'text-green-500' : 'text-gray-400'
                      }`}>
                      {verificationSteps.email.title}
                    </h3>
                  </div>
                  <span className='text-sm mb-3 leading-5'>{verificationSteps.email.description}</span>
                  <button
                    className={`text-sm py-3 px-6 mb-5 rounded-full ${verificationSteps.email.completed
                      ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                      : 'bg-[#dcd0ff] text-primary hover:bg-[#dcd0ff]/80'
                      }`}
                    disabled={verificationSteps.email.completed}
                    onClick={() => {
                      if (!verificationSteps.email.completed) {
                        console.log('Starting email verification...');
                      }
                    }}
                  >
                    {verificationSteps.email.buttonText}
                  </button>
                </div>

                <div className='flex flex-col items-start pt-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    {verificationSteps.facial.completed && (
                      <img src={checkmark} className="w-4 h-4" alt="verified" />
                    )}
                    <h3 className={`text-base tracking-[1px] mb-2 ${verificationSteps.facial.completed ? 'text-green-500' : 'text-gray-400'
                      }`}>
                      {verificationSteps.facial.title}
                    </h3>
                  </div>
                  <span className='text-sm mb-3 leading-5'>{verificationSteps.facial.description}</span>
                  <button
                    className={`text-sm py-3 px-6 rounded-full ${verificationSteps.facial.completed
                      ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                      : currentTier < 2
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-[#dcd0ff] text-primary hover:bg-[#dcd0ff]/80'
                      }`}
                    disabled={verificationSteps.facial.completed || currentTier < 2}
                    onClick={() => {
                      if (!verificationSteps.facial.completed && currentTier >= 2) {
                        console.log('Starting facial verification...');
                      }
                    }}
                  >
                    {verificationSteps.facial.buttonText}
                  </button>
                  {currentTier < 2 && !verificationSteps.facial.completed && (
                    <span className="text-xs text-gray-500 mt-1 mb-4">
                      Complete email verification first
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🎨 UPDATED: Bitmoji Selector Modal with Custom Upload */}
        {showBitmojiSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Choose Your Avatar</h3>
                <button
                  onClick={() => setShowBitmojiSelector(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  disabled={isUpdatingAvatar || uploadingCustomImage}
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* Custom Upload Button */}
              {/* <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleCustomImageUpload}
                  className="hidden"
                  disabled={uploadingCustomImage || isUpdatingAvatar}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCustomImage || isUpdatingAvatar}
                  className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingCustomImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      <span>Upload Custom Image</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Max 5MB • JPEG, PNG, GIF, WebP
                </p>
              </div> */}

              {/* Divider */}
              {/* <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-sm text-gray-400">choose preset</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div> */}

              {/* DiceBear Avatar Grid - Scrollable */}
              <div className="mb-2">
                <p className="text-sm text-gray-400 mb-3">Select an avatar ({BITMOJI_AVATARS.length} options)</p>
              </div>
              <div className="relative">
                <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" id="avatar-scroll-container">
                  <div className="grid grid-cols-3 gap-4">
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

                {/* 🔥 Scroll Indicator with Bounce Animation */}
                <div className="flex flex-col items-center mt-3 animate-bounce">
                  <span className="text-xs text-gray-400 mb-1">Scroll for more</span>
                  <svg
                    className="w-5 h-5 text-primary"
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

        <ProfileUpdateModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          updateType={modalState.updateType}
          currentValue={modalState.currentValue}
          onUpdate={handleProfileUpdate}
          isLoading={modalState.isLoading}
        />

        {/* 🔥 Success Modal for Avatar Upload */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-[#181818] rounded-xl p-6 w-full max-w-sm shadow-2xl border border-green-500/30 animate-scale-in">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Success!</h3>
                <p className="text-gray-300 mb-4">{successMessage}</p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setSuccessMessage('');
                  }}
                  className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 Error Modal for Avatar Upload */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-[#181818] rounded-xl p-6 w-full max-w-sm shadow-2xl border border-red-500/30">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <span className="text-3xl">❌</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Upload Failed</h3>
                <p className="text-gray-300 mb-4">{errorMessage}</p>
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setErrorMessage('');
                  }}
                  className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Render main content (replaces table section)
  if (section === 'main') {
    return (
      <>
        <div className="flex h-full gap-4">
          <div className="bg-[#181818] flex-1 rounded-md space-y-7 p-4">
            <h2 className='text-base'>Personal Information</h2>

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

          <div className="bg-[#181818] flex-1 rounded-md space-y-7 p-4">
            <h2 className='text-base'>Security & Privacy</h2>

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

            <div
              className='flex items-center justify-between px-2 cursor-pointer hover:bg-white/5 rounded-md py-2 transition-colors'
              onClick={() => setShowPinUpdateModal(true)}
            >
              <div>
                <label className="block text-sm text-gray-400 pb-3">Transaction PIN</label>
                <span>Reset Transaction PIN</span>
              </div>
              <img src={rightarrow} alt="" />
            </div>
          </div>
          {/* Transaction PIN Update Modal */}
          {showPinUpdateModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#181818] rounded-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Update Transaction PIN</h3>
                  <button
                    onClick={() => {
                      setShowPinUpdateModal(false);
                      setPinUpdateData({ oldPin: '', newPin: '', confirmPin: '' });
                      setPinUpdateError('');
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    disabled={pinUpdateLoading}
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                {pinUpdateError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-full text-red-500 text-sm">
                    {pinUpdateError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Current PIN</label>
                    <div className="relative">
                      <input
                        type={showOldPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={4}
                        value={pinUpdateData.oldPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setPinUpdateData(prev => ({ ...prev, oldPin: value }));
                          setPinUpdateError('');
                        }}
                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-primary transition-colors text-center text-2xl tracking-widest"
                        placeholder="••••"
                        disabled={pinUpdateLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPin(!showOldPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        disabled={pinUpdateLoading}
                      >
                        {showOldPin ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">New PIN</label>
                    <div className="relative">
                      <input
                        type={showNewPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={4}
                        value={pinUpdateData.newPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setPinUpdateData(prev => ({ ...prev, newPin: value }));
                          setPinUpdateError('');
                        }}
                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-primary transition-colors text-center text-2xl tracking-widest"
                        placeholder="••••"
                        disabled={pinUpdateLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        disabled={pinUpdateLoading}
                      >
                        {showNewPin ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Confirm New PIN</label>
                    <div className="relative">
                      <input
                        type={showConfirmPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={4}
                        value={pinUpdateData.confirmPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setPinUpdateData(prev => ({ ...prev, confirmPin: value }));
                          setPinUpdateError('');
                        }}
                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-primary transition-colors text-center text-2xl tracking-widest"
                        placeholder="••••"
                        disabled={pinUpdateLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        disabled={pinUpdateLoading}
                      >
                        {showConfirmPin ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUpdateTransactionPin}
                  disabled={pinUpdateLoading || !pinUpdateData.oldPin || !pinUpdateData.newPin || !pinUpdateData.confirmPin}
                  className="w-full mt-6 py-3 bg-primary text-white rounded-full hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {pinUpdateLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update PIN</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

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

  return null;
};

export default ProfileSettings;