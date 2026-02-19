import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/userContext";
import Warning from "../assets/warning.png";
import GoogleIcon from "../assets/google.png";
import AppleIcon from "../assets/apple.png";

const SignUp = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    signupStep,
    signupData,
    createUser,
    sendOTP,
    verifyOTP,
    resendOTP,
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

  // Countdown timer for OTP
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

  // Reset countdown when moving to step 3
  useEffect(() => {
    if (signupStep === 3) {
      setCountdown(30);
      setCanResend(false);
    }
  }, [signupStep]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
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

  // Function to mask phone number for OTP display
  const getMaskedPhoneNumber = () => {
    const fullNumber = signupData.countryCode + signupData.phoneNumber;
    if (fullNumber.length < 2) return fullNumber;
    const lastTwo = fullNumber.slice(-2);
    const masked = fullNumber.slice(0, -2).replace(/./g, 'x');
    return masked + lastTwo;
  };

  // Enhanced validation functions
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^\d{10,11}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
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
    return signupData.password.length >= 8 && 
           signupData.confirmPassword.length >= 8 && 
           signupData.password === signupData.confirmPassword &&
           passwordStrength >= 5;
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

  // Password strength indicator component
  const PasswordStrengthIndicator = () => {
    const requirements = [
      { met: signupData.password.length >= 8, text: "Minimum Of 8 Characters" },
      { met: /[A-Z]/.test(signupData.password), text: "At least One Uppercase" },
      { met: /[a-z]/.test(signupData.password), text: "At least One Lowercase" },
      { met: /[!@#$%^&*(),.?":{}|<>]/.test(signupData.password), text: "At least One Special Character" },
      { met: /[0-9]/.test(signupData.password), text: "At least One Number" }
    ];

    if (!signupData.password) return null;

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

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    if (!isStep1Valid()) return;
    
    // Move to next step - no API call needed for email validation
    transitionToStep(2);
  };

const handleSubmitStep2 = async (e) => {
  e.preventDefault();
  if (!isStep2Valid()) return;
  
  try {
    const fullPhoneNumber = signupData.countryCode + signupData.phoneNumber;
    
    // Add debugging logs
    console.log('Country Code:', signupData.countryCode);
    console.log('Phone Number:', signupData.phoneNumber);
    console.log('Full Phone Number:', fullPhoneNumber);
    console.log('Full Phone Number length:', fullPhoneNumber.length);
    console.log('Full Phone Number type:', typeof fullPhoneNumber);
    
    // Log the exact payload that will be sent
    const payload = { phoneNumber: fullPhoneNumber };
    console.log('Payload being sent:', JSON.stringify(payload));
    
    await sendOTP(fullPhoneNumber);
    transitionToStep(3);
  } catch (error) {
    console.error('Send OTP error:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      console.error('Error headers:', error.response.headers);
    }
  }
};


  // Continuing from where your code left off...

  const handleSubmitStep3 = async (e) => {
    e.preventDefault();
    if (!isStep3Valid()) return;
    
    try {
      const fullPhoneNumber = signupData.countryCode + signupData.phoneNumber;
      await verifyOTP(fullPhoneNumber, signupData.otp);
      transitionToStep(4);
    } catch (error) {
      console.error('Verify OTP error:', error);
    }
  };

  const handleSubmitStep4 = async (e) => {
    e.preventDefault();
    if (!isStep4Valid()) return;
    
    // Move to next step - password will be used in final signup
    transitionToStep(5);
  };

  const handleSubmitStep5 = async (e) => {
    e.preventDefault();
    if (!isStep5Valid()) return;
    
    try {
      const userData = {
        email: signupData.email,
        phoneNumber: signupData.countryCode + signupData.phoneNumber,
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
      const fullPhoneNumber = signupData.countryCode + signupData.phoneNumber;
      await resendOTP(fullPhoneNumber);
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
                 signupStep === 2 ? "Verify Your Phone Number" :
                 signupStep === 3 ?  `Enter The 6-Digit Code we Texted to +${getMaskedPhoneNumber()}` : 
                 signupStep === 4 ? "Set Your Password" : "Enter Your Display Name"}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {signupStep === 1
                  ? "Create an Account to Buy and Sell Social Media Accounts Securely.."
                  : signupStep === 2
                  ? "Enter your phone number to receive a verification code."
                  : signupStep === 3
                  ? "This helps us keep your account secure by ensuring it's really you."
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
                    <button type="button" onClick={() => {}}>
                      <img src={GoogleIcon} alt="Google" className="w-8 h-8" />
                    </button>
                    <button type="button" onClick={() => {}}>
                      <img src={AppleIcon} alt="Apple" className="w-8 h-8" />
                    </button>
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
                <div className="flex items-center justify-center">
                  <div className="w-full">
                    <label className="block text-sm mb-2 font-medium">
                      Phone Number
                    </label>
                    <div className="flex items-center border border-gray-400 rounded-full bg-black overflow-hidden focus-within:border-white transition-colors">
                      <select
                        name="countryCode"
                        value={signupData.countryCode}
                        onChange={handleInputChange}
                        className="bg-black text-white pl-3 pr-2 py-2 outline-none appearance-none text-sm"
                        style={{ fontSize: '16px' }}
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
                        value={signupData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Phone number"
                        className="bg-black text-white placeholder-gray-400 outline-none py-4 flex-1 text-sm"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    {signupData.phoneNumber && !isValidPhoneNumber(signupData.phoneNumber) && (
                      <p className="text-red-400 text-xs mt-1">Please enter a valid phone number</p>
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
                        value={signupData.password}
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
                    <PasswordStrengthIndicator />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 font-medium">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={signupData.confirmPassword}
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
                    {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                    {signupData.confirmPassword && signupData.password === signupData.confirmPassword && signupData.password && (
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
                      isLoading || !isStep4Valid() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ backgroundColor: 'rgba(96, 60, 208, 1)' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating...
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