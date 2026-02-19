import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useUser } from '../../context/userContext'; 

const ProfileUpdateModal = ({ 
  isOpen, 
  onClose, 
  updateType, 
  currentValue, 
  onUpdate,
  isLoading,
  // New customizable props
  modalContent = {}
}) => {
   const { updateUserProfile } = useUser();
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    newValue: '',
    otp: '',
    currentPassword: '', // For password change
    countryCode: '+234' // For phone number
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpSentToPhone, setOtpSentToPhone] = useState(false); 

  

  // Reset modal state when it opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({ newValue: '', otp: '', currentPassword: '', countryCode: '+234' });
      setError('');
      setSuccess('');
      setSendingOtp(false);
      setVerifying(false);
      setResending(false);
      setOtpSentToPhone(false); // Reset OTP delivery method
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper function to mask email
  const maskEmail = (email) => {
    if (!email) return 'your email';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `${localPart}${'x'.repeat(5)}@${domain}`;
    }
    const firstThree = localPart.substring(0, 3);
    const maskedPart = 'x'.repeat(localPart.length - 3);
    return `${firstThree}${maskedPart}@${domain}`;
  };

  // Helper function to mask phone number
  const maskPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'your phone number';
    // Remove any non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length >= 4) {
      const lastFour = cleanPhone.slice(-4);
      const masked = 'x'.repeat(cleanPhone.length - 4);
      return `${masked}${lastFour}`;
    }
    return phoneNumber;
  };

  // Default content with fallbacks
  const getModalTitle = () => {
    if (modalContent.title) return modalContent.title;
    
    switch (updateType) {
      case 'displayName':
        return 'Update Display Name';
      case 'phoneNumber':
        return 'Update Phone Number';
      case 'email':
        return 'Update Email Address';
      case 'password':
        return 'Change Password';
      default:
        return 'Update Information';
    }
  };

  const getModalSubTitle = () => {
    if (modalContent.subTitle) return modalContent.subTitle;
    
    switch (updateType) {
      case 'displayName':
        return 'Display Name';
      case 'phoneNumber':
        return 'Phone Number';
      case 'email':
        return 'Email Address';
      case 'password':
        return 'Password';
      default:
        return 'Account Settings';
    }
  };

  const getModalDescription = () => {
    if (modalContent.description) return modalContent.description;
    
    switch (updateType) {
      case 'displayName':
        return '';
      case 'phoneNumber':
        return '';
      case 'email':
        return '';
      case 'password':
        return '';
      default:
        return 'Update your account information';
    }
  };

  const getInputPlaceholder = () => {
    if (modalContent.inputPlaceholder) return modalContent.inputPlaceholder;
    
    switch (updateType) {
      case 'displayName':
        return 'Enter new display name';
      case 'phoneNumber':
        return 'Enter new phone number';
      case 'email':
        return 'Enter new email address';
      case 'password':
        return 'Enter new password';
      default:
        return 'Enter new value';
    }
  };

  const getCurrentPasswordLabel = () => {
    return modalContent.currentPasswordLabel || 'Enter Current Password';
  };

  const getNewValueLabel = () => {
    if (modalContent.newValueLabel) return modalContent.newValueLabel;
    
    switch (updateType) {
      case 'displayName':
        return 'Enter New Display Name';
      case 'phoneNumber':
        return 'Enter New Phone Number';
      case 'email':
        return 'Enter New Email Address';
      case 'password':
        return 'Enter New Password';
      default:
        return 'Enter New Value';
    }
  };

  const getCurrentPasswordPlaceholder = () => {
    return modalContent.currentPasswordPlaceholder || 'Enter current password';
  };

  const getOtpDescription = () => {
    if (modalContent.otpDescription) return modalContent.otpDescription;
    return "We've sent a verification code to your email address.";
  };

  const getOtpLabel = () => {
    return modalContent.otpLabel || 'Enter OTP Code';
  };

  const getInputType = () => {
    if (updateType === 'email') return 'email';
    if (updateType === 'phoneNumber') return 'tel';
    if (updateType === 'password') return showPassword ? 'text' : 'password';
    return 'text';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Check if step 1 form is valid
  const isStep1Valid = () => {
    const hasNewValue = formData.newValue.trim().length > 0;
    const hasCurrentPassword = updateType === 'password' ? formData.currentPassword.trim().length > 0 : true;
    return hasNewValue && hasCurrentPassword;
  };

  // Check if step 2 form is valid
  const isStep2Valid = () => {
    return formData.otp.length === 6;
  };

  // Send OTP for display name or password updates
  const sendOTPForUpdate = async () => {
    try {
      setError('');
      setSendingOtp(true);
      
      // Get user data from storage or props (you can modify this based on your setup)
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      let purpose = '';
      switch (updateType) {
        case 'displayName':
          purpose = 'update_display_name';
          break;
        case 'password':
          purpose = 'change_password';
          break;
        default:
          purpose = 'verification';
      }

      // Prepare OTP request payload - send to email for these updates
      const otpPayload = {
        email: userData.email,
        purpose: purpose
      };

      const response = await fetch('https://soctral-api.onrender.com/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpPayload)
      });

      const data = await response.json();

      if (data.status) {
        setSuccess('OTP sent to your email address successfully!');
        setOtpSentToPhone(false); // Mark as sent to email
        setTimeout(() => {
          setStep(2);
          setSuccess(''); // Clear success message when moving to step 2
        }, 1000);
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP before proceeding with update
  const verifyOTPBeforeUpdate = async () => {
    try {
      setError('');
      setVerifying(true);
      
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      let purpose = '';
      switch (updateType) {
        case 'displayName':
          purpose = 'update_display_name';
          break;
        case 'password':
          purpose = 'change_password';
          break;
        case 'phoneNumber':
          purpose = 'update_phone_number';
          break;
        case 'email':
          purpose = 'email_change';
          break;
        default:
          purpose = 'verification';
      }

      // Build the correct payload based on update type
      const verifyPayload = {
        otp: formData.otp,
        purpose: purpose
      };

      // Add email or phoneNumber based on the update type or the last OTP method used
      if (updateType === 'phoneNumber') {
        verifyPayload.phoneNumber = formData.newValue;
      } else {
        // Use phone number if OTP was sent to phone, otherwise use email
        if (otpSentToPhone) {
          verifyPayload.phoneNumber = userData.phoneNumber;
        } else {
          verifyPayload.email = userData.email;
        }
      }

      const response = await fetch('https://soctral-api.onrender.com/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyPayload)
      });

      const data = await response.json();

      if (data.status) {
        // Now proceed with the actual update
        await performActualUpdate();
      } else {
        throw new Error(data.message || 'Invalid OTP code');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError(error.message || 'OTP verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Perform the actual update after OTP verification
  const performActualUpdate = async () => {
    try {
      setError('');
      
      // Get user data and auth token
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const authToken = localStorage.getItem('authToken');

      if (!authToken) {
        throw new Error('Authentication token not found. Please login again.');
      }

      let updateResponse;

      if (updateType === 'displayName') {
        // Call display name update API
        const updatePayload = {
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          newDisplayName: formData.newValue
        };

        updateResponse = await fetch('https://soctral-api-52c4e830bc6f.herokuapp.com/user/update-display-name', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(updatePayload)
        });

      } else if (updateType === 'password') {
        // Call password change API
        const updatePayload = {
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          newPassword: formData.newValue
        };

        updateResponse = await fetch('https://soctral-api-52c4e830bc6f.herokuapp.com/user/change-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(updatePayload)
        });

      } else if (updateType === 'phoneNumber') {
        // Call phone number update API
        const updatePayload = {
          email: userData.email || '',
          currentPhoneNumber: userData.phoneNumber || '',
          newPhoneNumber: formData.newValue
        };

        updateResponse = await fetch('https://soctral-api-52c4e830bc6f.herokuapp.com/user/update-phone-number', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(updatePayload)
        });

      } else {
        // For other update types, use the existing onUpdate method
        const updateData = {
          type: updateType,
          newValue: formData.newValue,
          ...(formData.otp && { otp: formData.otp }),
          ...(formData.currentPassword && { currentPassword: formData.currentPassword })
        };

        await onUpdate('update', updateData);
        setSuccess('Updated successfully!');
        
        setTimeout(() => {
          onClose();
        }, 1500);
        return;
      }

      // Handle API response for display name, password, and phone updates
      const responseData = await updateResponse.json();

      if (responseData.status) {
        const updateTypeText = updateType === 'displayName' ? 'Display name' : 
                             updateType === 'password' ? 'Password' : 
                             updateType === 'phoneNumber' ? 'Phone number' : updateType;
        
        setSuccess(`${updateTypeText} updated successfully!`);
        
        // IMPORTANT: Update UserContext instead of just localStorage
        if (responseData.user) {
          // Update UserContext with new user data
          await updateUserProfile(responseData.user);
        }
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(responseData.message || `Failed to update ${updateType}`);
      }

    } catch (error) {
      console.error('Update error:', error);
      setError(error.message || 'Update failed. Please try again.');
    }
  };


  const handleProceedToOTP = async () => {
    if (!formData.newValue.trim()) {
      setError(`Please enter a valid ${updateType.replace('Name', ' name')}`);
      return;
    }

    // For password change, we need current password
    if (updateType === 'password' && !formData.currentPassword.trim()) {
      setError('Please enter your current password');
      return;
    }

    try {
      setError('');
      
      // For display name and password updates, send OTP
      if (updateType === 'displayName' || updateType === 'password') {
        await sendOTPForUpdate();
      } else if (updateType === 'phoneNumber' || updateType === 'email') {
        // For phone number or email updates, use existing logic
        setSendingOtp(true);
        await onUpdate('sendOTP', {
          type: updateType,
          newValue: formData.newValue,
          ...(updateType === 'phoneNumber' && { phoneNumber: formData.newValue })
        });
        setSuccess('OTP sent successfully!');
        setTimeout(() => {
          setStep(2);
          setSuccess(''); // Clear success message when moving to step 2
        }, 1000);
        setSendingOtp(false);
      } else {
        // For other types, proceed directly
        await handleFinalUpdate();
      }
    } catch (error) {
      setError(error.message || 'Failed to proceed. Please try again.');
      setSendingOtp(false);
    }
  };

  const handleFinalUpdate = async () => {
    if ((updateType === 'displayName' || updateType === 'password') && !formData.otp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    if ((updateType === 'phoneNumber' || updateType === 'email') && !formData.otp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    try {
      setError('');
      
      // For display name and password updates, verify OTP first then update
      if (updateType === 'displayName' || updateType === 'password') {
        await verifyOTPBeforeUpdate();
      } else {
        // For other update types, use the existing onUpdate method
        setVerifying(true);
        const updateData = {
          type: updateType,
          newValue: formData.newValue,
          ...(formData.otp && { otp: formData.otp }),
          ...(formData.currentPassword && { currentPassword: formData.currentPassword })
        };

        await onUpdate('update', updateData);
        setSuccess('Updated successfully!');
        
        // Close modal after success
        setTimeout(() => {
          onClose();
        }, 1500);
        setVerifying(false);
      }

    } catch (error) {
      console.error('Update error:', error);
      setError(error.message || 'Update failed. Please try again.');
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setError('');
      setResending(true);
      
      if (updateType === 'displayName' || updateType === 'password') {
        await sendOTPForUpdate();
        setSuccess('OTP resent to your email successfully!');
      } else {
        await onUpdate('sendOTP', {
          type: updateType,
          newValue: formData.newValue,
          ...(updateType === 'phoneNumber' && { phoneNumber: formData.newValue })
        });
        setSuccess('OTP resent successfully!');
      }
    } catch (error) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyWithPhone = async () => {
    try {
      setError('');
      setResending(true);
      
      // Get user data from storage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (!userData.phoneNumber) {
        setError('No phone number found in your account');
        setResending(false);
        return;
      }

      let purpose = '';
      switch (updateType) {
        case 'displayName':
          purpose = 'update_display_name';
          break;
        case 'password':
          purpose = 'change_password';
          break;
        case 'phoneNumber':
          purpose = 'update_phone_number';
          break;
        case 'email':
          purpose = 'email_change';
          break;
        default:
          purpose = 'verification';
      }

      // Send OTP to phone number instead of email
      const otpPayload = {
        phoneNumber: userData.phoneNumber,
        purpose: purpose
      };

      const response = await fetch('https://soctral-api-52c4e830bc6f.herokuapp.com/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpPayload)
      });

      const data = await response.json();

      if (data.status) {
        setSuccess('OTP sent to your phone number successfully!');
        setOtpSentToPhone(true); // Mark as sent to phone
      } else {
        throw new Error(data.message || 'Failed to send OTP to phone');
      }
    } catch (error) {
      console.error('Send OTP to phone error:', error);
      setError(error.message || 'Failed to send OTP to phone. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black  lg:bg-[#181818] rounded-xl p-6 w-full max-w-xl h-screen lg:h-fit lg:mx-4 lg:mt-0">

        <div className='flex mt-[2rem] lg:mt-0 w-full items-end justify-end'>
          <button
            onClick={onClose}
            className="text-gray-400  hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            disabled={isLoading || sendingOtp || verifying || resending}
          >
            <X size={20} />
          </button>
        </div>
  
        {/* Header with centered title for OTP step - HIDDEN */}
        {step === 2 ? (
          <div className="flex items-center justify-center mb-4" style={{ display: '' }}>
            <h1 className="text-xl w-full text-center font-bold text-white">Update Display Name</h1>
          </div>
        ) : (
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-xl w-full text-center font-bold text-white">{getModalSubTitle()}</h1>
          </div>
        )}


        

        <div className="flex items-center justify-center">
          <h1 className="text-xl w-full text-left font-bold text-white" style={{ display: 'none' }}>{getModalTitle()}</h1>
        </div>

        {/* Description */}
        <div className="text-left mb-2">
          <p className="text-gray-400 text-sm">{getModalDescription()}</p>
        </div>

        {/* Error Message - Only show in step 1 */}
        {error && step === 1 && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message - Only show in step 1 */}
        {success && step === 1 && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-md">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Step 1: Input Form */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Current Password (for password change) */}
            {updateType === 'password' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  {getCurrentPasswordLabel()}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className="w-full p-3 bg-gray-700/30 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 pr-10"
                    placeholder={getCurrentPasswordPlaceholder()}
                    disabled={isLoading || sendingOtp}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white rounded-full p-1 hover:bg-gray-600/30"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* New Value Input */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                {getNewValueLabel()}
              </label>
              {updateType === 'phoneNumber' ? (
                <div className="flex items-center border border-gray-400 rounded-full bg-black overflow-hidden focus-within:border-white transition-colors">
                  <select
                    name="countryCode"
                    value={formData.countryCode || '+234'}
                    onChange={(e) => handleInputChange('countryCode', e.target.value)}
                    className="bg-black text-white pl-3 pr-2 py-2 outline-none appearance-none text-sm"
                    disabled={isLoading || sendingOtp}
                  >
                    <option value="+234">🇳🇬 (+234)</option>
                    <option value="+1">🇺🇸 (+1)</option>
                    <option value="+44">🇬🇧 (+44)</option>
                    <option value="+91">🇮🇳 (+91)</option>
                    <option value="+27">🇿🇦 (+27)</option>
                  </select>
                  <div className="h-4 w-px bg-white/30 mx-2" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.newValue}
                    onChange={(e) => handleInputChange('newValue', e.target.value)}
                    placeholder="Phone number"
                    className="bg-black text-white placeholder-gray-400 outline-none py-3 flex-1 text-sm"
                    disabled={isLoading || sendingOtp}
                  />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type={getInputType()}
                    value={formData.newValue}
                    onChange={(e) => handleInputChange('newValue', e.target.value)}
                    className="w-full p-3 bg-gray-700/30 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-primary pr-10"
                    placeholder={getInputPlaceholder()}
                    disabled={isLoading || sendingOtp}
                  />
                  {updateType === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white rounded-full p-1 hover:bg-gray-600/30"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleProceedToOTP}
                className={`w-full py-3 px-6 rounded-full text-white font-medium transition-all ${
                  isLoading || sendingOtp || !isStep1Valid()
                    ? 'bg-primary/50 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary hover:scale-105'
                }`}
                disabled={isLoading || sendingOtp || !isStep1Valid()}
              >
                {sendingOtp ? 'Updating...' : 
                 (updateType === 'displayName' || updateType === 'password') ? 'Update' : 
                 (updateType === 'phoneNumber' || updateType === 'email') ? 'Update' : 'Update'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Custom OTP Header */}
            <div className="mb-6 text-left">
              <h1 className="text-lg font-bold text-white mb-2">
                {otpSentToPhone ? (
                  <>Enter The 6-Digit Code we Texted to {maskPhoneNumber(JSON.parse(localStorage.getItem('userData') || '{}').phoneNumber)}</>
                ) : (
                  <>Enter The 6-Digit Code we Texted to {maskEmail(JSON.parse(localStorage.getItem('userData') || '{}').email)}</>
                )}
              </h1>
              <p className="text-gray-400 text-sm mb-4">
                Enter the 6 digit code OTP sent to your {otpSentToPhone ? 'phone number' : 'email address'} to proceed to updating your {updateType === 'displayName' ? 'display name' : updateType}
              </p>
              <h2 className="text-lg font-semibold text-white">
                Enter the Code
              </h2>
            </div>

    {/* Dash-style OTP Input */}
            <div className="mb-4">
              <div className="flex justify-center space-x-2">
                {[...Array(6)].map((_, index) => (
                  <input
                    key={index}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={formData.otp[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const newOtp = formData.otp.split('');
                      newOtp[index] = value;
                      const updatedOtp = newOtp.join('').slice(0, 6);
                      handleInputChange('otp', updatedOtp);
                      
                      // Auto-focus next input
                      if (value && index < 5) {
                        const nextInput = e.target.parentElement.children[index + 1];
                        if (nextInput) nextInput.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      handleInputChange('otp', pastedText);
                      
                      // Focus the last filled input or the next empty one
                      const targetIndex = Math.min(pastedText.length - 1, 5);
                      setTimeout(() => {
                        const targetInput = e.target.parentElement.children[targetIndex];
                        if (targetInput) targetInput.focus();
                      }, 0);
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace to go to previous input
                      if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
                        const prevInput = e.target.parentElement.children[index - 1];
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-white text-xl font-bold bg-transparent border-b-2 border-gray-600 focus:border-primary focus:outline-none"
                    disabled={isLoading || verifying}
                  />
                ))}
              </div>
            </div>

            {/* Error Message - Below dash inputs */}
            {error && (
              <div className="mb-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Success Message - Below dash inputs */}
            {success && (
              <div className="mb-4">
                <p className="text-green-400 text-sm text-center">{success}</p>
              </div>
            )}

       
            {/* Back Button (small) and Action Button */}
            <div className="space-y-3">
        
              
              <div className="flex justify-center">
                <button
                  onClick={handleFinalUpdate}
                  className={`w-full py-3 px-6 rounded-full text-white font-medium transition-all ${
                    isLoading || verifying || !isStep2Valid()
                      ? 'bg-primary/50 cursor-not-allowed' 
                      : 'bg-primary hover:bg-primary hover:scale-105'
                  }`}
                  disabled={isLoading || verifying || !isStep2Valid()}
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>

                   {/* Resend OTP */}
      <div className="text-center mb-6">
  <button
    onClick={handleResendOTP}
    className="text-gray-400 text-sm transition-colors rounded-full px-4 py-2 hover:bg-primary/10"
    disabled={isLoading || verifying || resending}
  >
    {resending ? (
      'Resending...'
    ) : (
      <>
        Didn't receive code?{' '}
        <span className="text-white hover:text-primary font-semibold">
          Resend Code
        </span>
      </>
    )}
  </button>
</div>

{/* Verify with Phone Number */}
<div className="text-center mb-6">
  <button
    onClick={handleVerifyWithPhone}
    className="text-gray-400 text-sm transition-colors rounded-full px-4 py-2 hover:bg-primary/10"
    disabled={isLoading || verifying || resending}
  >
    or{' '}
    <span className="text-white hover:text-primary font-semibold">
      verify with phone number
    </span>
  </button>
</div>




                    <div className="flex justify-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-400 hover:text-white text-sm transition-colors rounded-full px-4 py-2 hover:bg-gray-700/30"
                  disabled={isLoading || verifying}
                >
                  ← Back to previous step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileUpdateModal;