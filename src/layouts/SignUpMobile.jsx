import { useState, useEffect } from "react";
import countryCodeOptions from "../data/countryCodeOptions";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useUser } from "../context/userContext";
import Warning from "../assets/warning.png";
import GoogleIcon from "../assets/google.png";

// Defined outside to avoid new component identity on every render (fixes input lag)
const PasswordStrengthIndicator = ({ password, passwordStrength }) => {
  if (!password) return null;
  const requirements = [
    { met: password.length >= 8, text: "Minimum Of 8 Characters" },
    { met: /[A-Z]/.test(password), text: "At least One Uppercase" },
    { met: /[a-z]/.test(password), text: "At least One Lowercase" },
    { met: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: "At least One Special Character" },
    { met: /[0-9]/.test(password), text: "At least One Number" }
  ];
  const percentage = (passwordStrength / 5) * 100;
  return (
    <div className="mt-2">
      <div className="w-full bg-black rounded-full h-2 mb-2 border-2 border-purple-600">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${
            passwordStrength < 2 ? "bg-red-500" :
            passwordStrength < 4 ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-500'}`} />
            <p className={`text-xs ${req.met ? 'text-green-400' : 'text-gray-400'}`}>
              {req.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SignUp = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    signupStep,
    signupData,
    createUser,
    signUpWithGoogle,
    sendOTPToEmail,
    verifyOTPToEmail,
    resendOTPToEmail,
    setSignupStep,
    updateSignupData,
    clearSignupData,
    clearError,
  } = useUser();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  // Local state for step 4 only — avoids context dispatch on every keystroke (fixes lag)
  const [localPassword, setLocalPassword] = useState("");
  const [localConfirmPassword, setLocalConfirmPassword] = useState("");

  // Countdown timer for OTP (step 3)
  useEffect(() => {
    let timer;
    if (signupStep === 3 && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (signupStep === 3 && countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [signupStep, countdown]);

  // Reset countdown when moving to OTP step
  useEffect(() => {
    if (signupStep === 3) {
      setCountdown(30);
      setCanResend(false);
    }
  }, [signupStep]);

  // Sync local password state when entering step 4
  useEffect(() => {
    if (signupStep === 4) {
      setLocalPassword(signupData.password);
      setLocalConfirmPassword(signupData.confirmPassword);
      evaluatePasswordStrength(signupData.password);
    }
  }, [signupStep]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    // Step 4: keep password/confirmPassword in local state only to avoid context lag
    if (signupStep === 4 && (name === "password" || name === "confirmPassword")) {
      if (name === "password") {
        setLocalPassword(value);
        evaluatePasswordStrength(value);
      } else {
        setLocalConfirmPassword(value);
      }
      if (error) clearError();
      return;
    }
    updateSignupData({ [name]: newValue });
    if (name === "password") {
      evaluatePasswordStrength(value);
    }
    if (error) {
      clearError();
    }
  };

  const evaluatePasswordStrength = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = [minLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar];
    const strength = requirements.filter(Boolean).length;

    setPasswordStrength(strength);
  };

  const getMaskedEmail = () => {
    const email = signupData.email || '';
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}${local[local.length - 1]}@${domain}`;
  };

  // Enhanced validation functions
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^\d{10,11}$/;
    return phoneRegex.test((phone || '').replace(/\s+/g, ''));
  };

  const isStep1Valid = () => {
    return isValidEmail(signupData.email) && signupData.termsAccepted;
  };

  const isStep2Valid = () => {
    return isValidPhoneNumber(signupData.phoneNumber);
  };

  const isStep3Valid = () => {
    return signupData.otp.length === 6 && /^\d{6}$/.test(signupData.otp);
  };

  const isStep4Valid = () => {
    const pwd = signupStep === 4 ? localPassword : signupData.password;
    const conf = signupStep === 4 ? localConfirmPassword : signupData.confirmPassword;
    return pwd.length >= 8 && conf.length >= 8 && pwd === conf && passwordStrength >= 5;
  };

  const isStep5Valid = () => {
    return signupData.displayName.trim().length >= 2;
  };

  // OTP handling functions
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const otpArray = signupData.otp.padEnd(6, ' ').split('');
    otpArray[index] = value;
    const newOtp = otpArray.join('').replace(/ /g, '');
    
    updateSignupData({ otp: newOtp });
    
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  // Smooth step transition
  const transitionToStep = (newStep) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSignupStep(newStep);
      setIsTransitioning(false);
    }, 200);
  };

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    if (!isStep1Valid()) return;
    transitionToStep(2);
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    if (!isStep2Valid()) return;
    
    try {
      await sendOTPToEmail(signupData.email);
      transitionToStep(3);
    } catch (error) {
      console.error('Send OTP error:', error);
    }
  };

  const handleSubmitStep3 = async (e) => {
    e.preventDefault();
    if (!isStep3Valid()) return;
    
    try {
      await verifyOTPToEmail(signupData.email, signupData.otp);
      transitionToStep(4);
    } catch (error) {
      console.error('Verify OTP error:', error);
    }
  };

  const handleSubmitStep4 = async (e) => {
    e.preventDefault();
    if (!isStep4Valid()) return;
    updateSignupData({ password: localPassword, confirmPassword: localConfirmPassword });
    transitionToStep(5);
  };

  const handleSubmitStep5 = async (e) => {
    e.preventDefault();
    if (!isStep5Valid()) return;
    
    try {
      const fullPhone = signupData.countryCode + (signupData.phoneNumber || '').replace(/\s+/g, '');
      const userData = {
        email: signupData.email,
        phoneNumber: fullPhone,
        password: signupData.password,
        displayName: signupData.displayName,
      };
      
      await createUser(userData);
      
      // Set flag to skip onboarding and navigate to homepage
      localStorage.setItem('hasCompletedSignup', 'true');
      localStorage.setItem('skipOnboarding', 'true');
      
      // Clear signup data
      clearSignupData();
      
      navigate("/homepage");
    } catch (error) {
      console.error('Create user error:', error);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('skipOnboarding', 'true');
    clearSignupData();
    navigate('/homepage');
  };

  const handleSignIn = () => {
    clearSignupData();
    navigate('/sign-in');
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    try {
      await resendOTPToEmail(signupData.email);
      setCountdown(30);
      setCanResend(false);
    } catch (error) {
      console.error('Resend OTP error:', error);
    }
  };

  const handleGoBack = () => {
    if (signupStep > 1) {
      transitionToStep(signupStep - 1);
      clearError();
    }
  };

  return (
    <>
      <style jsx>{`
        /* Prevent zoom on input focus for mobile devices */
        input[type="email"],
        input[type="tel"],
        input[type="text"],
        input[type="password"],
        select {
          font-size: 16px !important;
          background-color: black !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: white !important;
        }
        
        /* Override autofill styles */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px black inset !important;
          -webkit-text-fill-color: white !important;
          background-color: black !important;
        }

        /* Override paste background */
        input::selection {
          background-color: rgba(96, 60, 208, 0.3) !important;
        }
        
        input::-moz-selection {
          background-color: rgba(96, 60, 208, 0.3) !important;
        }
      `}</style>
      
      <section className="bg-black text-white h-screen flex flex-col overflow-hidden">
        {/* Black status bar */}
        <div className="w-full h-1 bg-black"></div>
        
        <div className="flex flex-col h-full px-4 py-3">
          {/* Header section */}
          <div className="flex-shrink-0">
            <div className="flex justify-between items-center w-full mb-[44px] mt-[24px]">
              {signupStep > 1 ? (
                <button
                  onClick={handleGoBack}
                  className="text-white cursor-pointer font-normal text-sm flex items-center hover:opacity-80 transition-opacity"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-4 h-4"></div>
              )}
              {signupStep === 1 && (
                <p
                  onClick={handleSkip}
                  className="text-white cursor-pointer font-normal text-sm hover:opacity-80 transition-opacity"
                >
                  Skip
                </p>
              )}
              {signupStep > 1 && <div className="w-4 h-4"></div>}
            </div>

            <div className={`transition-all duration-200 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              <h3 className="text-[33px] leading-[38px] font-bold mb-[16px]">
                {signupStep === 1 ? "Get Started with Soctral and Experience Secure Social Media Trading" :
                 signupStep === 2 ? "Enter Your Phone Number" :
                 signupStep === 3 ? `Enter the 6-digit code we emailed to ${getMaskedEmail()}` :
                 signupStep === 4 ? "Set Your Password" : "Enter Your Display Name"}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {signupStep === 1
                  ? "Create an Account to Buy and Sell Social Media Accounts Securely."
                  : signupStep === 2
                  ? "We'll use this to stay in touch. OTP is sent to your email for verification."
                  : signupStep === 3
                  ? "Check your email for the verification code."
                  : signupStep === 4
                  ? "Create a strong password for your account."
                  : "Enter a Display Name to Represent You on Soctral."}
              </p>
            </div>
          </div>

          {/* Dynamic form content with animation */}
          <div className={`flex flex-col h-full transition-all duration-300 ${
            isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          }`}>
            {signupStep === 1 ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={signupData.email}
                      onChange={handleInputChange}
                      placeholder="Email address"
                      className="w-full py-4 rounded-full pl-4 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white text-sm transition-colors"
                      style={{ fontSize: '16px' }}
                    />
                    {signupData.email && !isValidEmail(signupData.email) && (
                      <p className="text-red-400 text-xs mt-1">Please enter a valid email</p>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center mb-4">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                      <p className="text-red-500 text-sm ml-2">{error}</p>
                    </div>
                  )}

                  <div className="text-center my-3">
                    <p className="text-xs">Or With</p>
                  </div>

                  <div className="flex justify-center space-x-8 mb-6">
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        if (!credentialResponse?.credential) return;
                        try {
                          await signUpWithGoogle(credentialResponse.credential);
                          navigate("/google-onboarding");
                        } catch (err) {}
                      }}
                      onError={() => clearError()}
                      useOneTap={false}
                      theme="filled_black"
                      size="medium"
                      type="icon"
                      shape="circle"
                      customButton={(renderProps) => (
                        <button
                          type="button"
                          onClick={renderProps.onClick}
                          disabled={renderProps.disabled || isLoading}
                          className="disabled:opacity-50"
                        >
                          <img src={GoogleIcon} alt="Google" className="w-8 h-8" />
                        </button>
                      )}
                    />
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={signupData.termsAccepted}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 appearance-none border border-gray-400 rounded bg-black checked:border-purple-700 relative after:content-['✓'] after:text-white after:text-xs after:absolute after:top-0 after:left-0.5 after:opacity-0 checked:after:opacity-100 transition-all"
                      style={{ 
                        accentColor: 'rgba(96, 60, 208, 1)',
                        backgroundColor: signupData.termsAccepted ? 'rgba(96, 60, 208, 1)' : 'black'
                      }}
                    />
                    <label className="text-xs text-gray-400">
                      I have read and agree to Soctral's{" "}
                      <span className="text-white underline">Terms of Service & Privacy Policy</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <button
                    onClick={handleSubmitStep1}
                    disabled={isLoading || !isStep1Valid()}
                    className={`w-full py-4 rounded-full text-white font-semibold transition-all text-sm flex items-center justify-center transform hover:scale-105 ${
                      isLoading || !isStep1Valid() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ backgroundColor: 'rgba(96, 60, 208, 1)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Signing Up...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                  <button
                    onClick={handleSignIn}
                    className="w-full py-4 rounded-full bg-black text-white font-semibold text-sm transition-all transform hover:scale-105"
                    style={{ border: '1px solid rgba(96, 60, 208, 1)' }}
                  >
                    Sign In
                  </button>
                </div>
              </>
            ) : signupStep === 2 ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 font-medium">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="countryCode"
                        value={signupData.countryCode}
                        onChange={handleInputChange}
                        className="w-24 py-4 rounded-full border border-gray-400 bg-black text-white focus:border-white outline-none text-sm"
                        style={{ fontSize: '16px' }}
                      >
                        {countryCodeOptions.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.flag} {opt.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={signupData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Phone number"
                        className="flex-1 py-4 rounded-full pl-4 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white text-sm transition-colors"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    {signupData.phoneNumber && !isValidPhoneNumber(signupData.phoneNumber) && (
                      <p className="text-red-400 text-xs mt-1">Please enter a valid 10–11 digit phone number</p>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center mb-4">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                      <p className="text-red-500 text-sm ml-2">{error}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <button
                    onClick={handleSubmitStep2}
                    disabled={isLoading || !isStep2Valid()}
                    className={`w-full py-4 rounded-full text-white font-semibold transition-all text-sm flex items-center justify-center transform hover:scale-105 ${
                      isLoading || !isStep2Valid() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ backgroundColor: 'rgba(96, 60, 208, 1)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending Code...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
              </>
            ) : signupStep === 3 ? (
              <>
                <div className="flex items-center justify-center">
                  <div className="w-full">
                    <label className="block text-sm mb-3 font-medium text-left">
                      Enter the Code
                    </label>
                    <div className="flex justify-center space-x-2 mb-4">
                      {[...Array(6)].map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength="1"
                          data-index={index}
                          value={signupData.otp[index] || ''}
                          className="w-10 h-12 text-center bg-black text-white text-lg outline-none border-b-2 border-gray-400 focus:border-white transition-colors"
                          style={{ fontSize: '16px' }}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        />
                      ))}
                    </div>
                    {error && (
                      <div className="flex items-center p-2 bg-red-900/30 border border-red-500/50 rounded mb-4 animate-pulse">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                        <p className="text-red-400 text-xs ml-2">{error}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <button
                    onClick={handleSubmitStep3}
                    disabled={isLoading || !isStep3Valid()}
                    className={`w-full py-4 rounded-full text-white font-semibold transition-all text-sm flex items-center justify-center transform hover:scale-105 ${
                      isLoading || !isStep3Valid() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ backgroundColor: 'rgba(96, 60, 208, 1)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                  
                  <div className="text-center">
                    {!canResend ? (
                      <p className="text-gray-400 text-sm">
                        Resending code in {countdown} seconds
                      </p>
                    ) : (
                      <button 
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="underline hover:opacity-80 flex items-center justify-center mx-auto transition-opacity"
                        style={{ color: 'rgba(96, 60, 208, 1)' }}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Sending...
                          </>
                        ) : (
                          "Resend Code"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : signupStep === 4 ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2 font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={localPassword}
                        onChange={handleInputChange}
                        placeholder="Create a password"
                        className="w-full py-4 rounded-full pl-4 pr-10 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white text-sm transition-colors"
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform"
                      >
                        {showPassword ? 
                          <EyeOff className="w-4 h-4 text-gray-400 hover:text-white transition-colors" /> : 
                          <Eye className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                        }
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={localPassword} passwordStrength={passwordStrength} />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 font-medium">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={localConfirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        className="w-full py-4 rounded-full pl-4 pr-10 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white text-sm transition-colors"
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform"
                      >
                        {showConfirmPassword ? 
                          <EyeOff className="w-4 h-4 text-gray-400 hover:text-white transition-colors" /> : 
                          <Eye className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                        }
                      </button>
                    </div>
                    {localConfirmPassword && localPassword !== localConfirmPassword && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                    {localConfirmPassword && localPassword === localConfirmPassword && localPassword && (
                      <p className="text-green-400 text-xs mt-1">Passwords match</p>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center p-2 bg-red-900/30 border border-red-500/50 rounded animate-pulse">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                      <p className="text-red-400 text-xs ml-2">{error}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleSubmitStep4}
                    disabled={isLoading || !isStep4Valid()}
                    className={`w-full py-4 rounded-full text-white font-semibold transition-all text-sm flex items-center justify-center transform hover:scale-105 ${
                      isLoading || !isStep3Valid() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ backgroundColor: 'rgba(96, 60, 208, 1)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <div className="w-full">
                    <label className="block text-sm mb-2 font-medium">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={signupData.displayName}
                      onChange={handleInputChange}
                      placeholder="Enter your display name"
                      className="w-full py-4 rounded-full pl-4 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white text-sm transition-colors"
                      style={{ fontSize: '16px' }}
                    />
                    {signupData.displayName && signupData.displayName.trim().length < 2 && (
                      <p className="text-red-400 text-xs mt-1">Display name must be at least 2 characters</p>
                    )}
                    {error && (
                      <div className="flex items-center p-2 bg-red-900/30 border border-red-500/50 rounded mt-2 animate-pulse">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                        <p className="text-red-400 text-xs ml-2">{error}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleSubmitStep5}
                    disabled={isLoading || !isStep5Valid()}
                    className={`w-full py-4 rounded-full text-white font-semibold transition-all text-sm flex items-center justify-center transform hover:scale-105 ${
                      isLoading || !isStep5Valid() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ backgroundColor: 'rgba(96, 60, 208, 1)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      "Complete Sign Up"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default SignUp;