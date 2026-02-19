import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useUser } from "../context/userContext"; // Import your user context
import Warning from "../assets/warning.png";
import GoogleIcon from "../assets/google.png";
import AppleIcon from "../assets/apple.png";

const SignUp = ({ apiUrl, onClose, onShowSignIn }) => { 
  const navigate = useNavigate();
  const {
    createUser,
    sendOTP,
    verifyOTP,
    resendOTP,
    isLoading,
    error: contextError,
    clearError,
    signupStep,
    signupData,
    setSignupStep,
    updateSignupData,
    clearSignupData
  } = useUser();

  // Local state for UI-specific functionality
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Get the current error (either from context or local)
  const error = contextError || localError;

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

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
      setLocalError(null);
    };
  }, [clearError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateSignupData({ [name]: value });
    
    if (name === "password") {
      evaluatePasswordStrength(value);
    }
    
    // Clear errors when user starts typing
    clearError();
    setLocalError(null);
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

  // Step handlers with actual API calls
  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    if (!isStep1Valid()) {
      setLocalError("Please enter a valid email and accept the terms");
      return;
    }
    
    // Move to next step immediately for email validation
    // The actual account creation happens in the final step
    setSignupStep(2);
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    if (!isStep2Valid()) {
      setLocalError("Please enter a valid phone number");
      return;
    }

    try {
      // Send OTP to the phone number
      const fullPhoneNumber = signupData.countryCode + signupData.phoneNumber;
      await sendOTP(fullPhoneNumber);
      setSignupStep(3);
    } catch (error) {
      console.error("Failed to send OTP:", error);
      // Error is handled by context, but we can add additional handling if needed
    }
  };

  const handleSubmitStep3 = async (e) => {
    e.preventDefault();
    if (!isStep3Valid()) {
      setLocalError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      // Verify OTP
      const fullPhoneNumber = signupData.countryCode + signupData.phoneNumber;
      await verifyOTP(fullPhoneNumber, signupData.otp);
      setSignupStep(4);
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      // Error is handled by context
    }
  };

  const handleSubmitStep4 = async (e) => {
    e.preventDefault();
    if (!isStep4Valid()) {
      if (signupData.password !== signupData.confirmPassword) {
        setLocalError("Passwords do not match");
      } else if (passwordStrength < 5) {
        setLocalError("Please meet all password requirements");
      } else {
        setLocalError("Please check your password requirements");
      }
      return;
    }
    
    setSignupStep(5);
  };

  const handleSubmitStep5 = async (e) => {
    e.preventDefault();
    if (!isStep5Valid()) {
      setLocalError("Display name must be at least 2 characters long");
      return;
    }

    try {
      // Create the user account with all collected data
      const userData = {
        email: signupData.email,
        password: signupData.password,
        phoneNumber: signupData.countryCode + signupData.phoneNumber,
        displayName: signupData.displayName,
        countryCode: signupData.countryCode,
        termsAccepted: signupData.termsAccepted,
      };

      console.log("Creating user with data:", userData); 
      const result = await createUser(userData);
      console.log("User creation result:", result);
      
      // Clear signup data
      clearSignupData();
      
      // Close the modal first
      if (onClose) {
        onClose();
      }
      
      // Force navigation with window.location for guaranteed redirect
      setTimeout(() => {
        window.location.href = "/homepage";
      }, 100);
      
    } catch (error) {
      console.error("Failed to create user:", error);
      // Error is handled by context, but let's also log it
      setLocalError("Failed to create account. Please try again.");
    }
  };

  const handleSkip = () => {
    if (onClose) {
      onClose();
    }
    navigate("/homepage");
  };
  
const handleSignIn = () => {
    if (onClose) {
      onClose();
    }
    setTimeout(() => {
      if (onShowSignIn) {
        onShowSignIn();
      }
    }, 100);
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    try {
      const fullPhoneNumber = signupData.countryCode + signupData.phoneNumber;
      await resendOTP(fullPhoneNumber);
      setCountdown(30);
      setCanResend(false);
    } catch (error) {
      console.error("Failed to resend OTP:", error);
      // Error is handled by context
    }
  };

  const handleGoBack = () => {
    if (signupStep > 1) {
      setSignupStep(signupStep - 1);
      clearError();
      setLocalError(null);
    }
  };

  const getStepTitle = () => {
    switch (signupStep) {
      case 1: return "Get Started with Soctral";
      case 2: return "Verify Your Phone Number";
      case 3: return "Enter OTP";
      case 4: return "Set Your Password";
      case 5: return "Enter Your Display Name";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (signupStep) {
      case 1: return "Create an Account to Buy and Sell Social Media Accounts Securely.";
      case 2: return "Enter your phone number to receive a verification code.";
      case 3: return `Enter The 6-Digit Code we Texted to +${getMaskedPhoneNumber()}`;
      case 4: return "Create a strong password for your account.";
      case 5: return "Enter a Display Name to Represent You on Soctral.";
      default: return "";
    }
  };

  const renderStepForm = () => {
    const stepVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    };

    switch (signupStep) {
      case 1:
        return (
          <motion.form
            key="step1"
            className="space-y-4"
            onSubmit={handleSubmitStep1}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <div>
              <label className="block text-sm mb-2 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={signupData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                className="w-full p-4 rounded-full border border-gray-400 bg-black text-white placeholder-gray-400 focus:border-white outline-none transition-colors"
              />
              {signupData.email && !isValidEmail(signupData.email) && (
                <p className="text-red-400 text-xs mt-1">Please enter a valid email</p>
              )}
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-500">
                <img src={Warning} alt="Warning" className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="text-center text-sm">Or Sign up with</div>
            <div className="flex justify-center gap-6">
              <button type="button" className="text-white">
                <img src={GoogleIcon} alt="Google" className="w-8 h-8" />
              </button>
              <button type="button" className="text-white">
                <img src={AppleIcon} alt="Apple" className="w-8 h-8" />
              </button>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={signupData.termsAccepted}
                onChange={(e) =>
                  updateSignupData({ termsAccepted: e.target.checked })
                }
                className="mt-1 w-4 h-4 appearance-none border border-gray-400 rounded bg-black checked:border-purple-700 relative after:content-['✓'] after:text-white after:text-xs after:absolute after:top-0 after:left-0.5 after:opacity-0 checked:after:opacity-100 transition-all"
                style={{
                  accentColor: 'rgba(96, 60, 208, 1)',
                  backgroundColor: signupData.termsAccepted ? 'rgba(96, 60, 208, 1)' : 'black'
                }}
              />
              <label className="text-xs mt-1 text-gray-400">
                I have read and agree to Soctral's{" "}
                <span className="text-white underline">Terms of Service & Privacy Policy</span>
              </label>
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading || !isStep1Valid()}
                className={`w-full py-3 rounded-full text-white font-semibold transition-all flex items-center justify-center ${
                  isLoading || !isStep1Valid() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
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
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full py-3 rounded-full bg-black text-white font-semibold transition-all hover:opacity-90"
                style={{ border: '1px solid rgba(96, 60, 208, 1)' }}
              >
                Sign In
              </button>
            </div>
          </motion.form>
        );

      case 2:
        return (
          <motion.form
            key="step2"
            onSubmit={handleSubmitStep2}
            className="space-y-4"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <div>
              <label className="block text-sm mb-2 font-medium">Phone Number</label>
              <div className="flex items-center border border-gray-400 rounded-full bg-black overflow-hidden focus-within:border-white transition-colors">
                <select
                  name="countryCode"
                  value={signupData.countryCode}
                  onChange={handleInputChange}
                  className="bg-black text-white pl-3 pr-2 py-2 outline-none appearance-none text-sm"
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
                  className="bg-black text-white placeholder-gray-400 outline-none py-3 flex-1 text-sm"
                />
              </div>
              {signupData.phoneNumber && !isValidPhoneNumber(signupData.phoneNumber) && (
                <p className="text-red-400 text-xs mt-1">Please enter a valid phone number</p>
              )}
              {error && (
                <div className="flex items-center p-2 bg-red-900/30 border border-red-500/50 rounded mt-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                  <p className="text-red-400 text-xs ml-2">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isStep2Valid()}
              className={`w-full py-3 rounded-full text-white font-semibold transition-all flex items-center justify-center ${
                isLoading || !isStep2Valid() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
              }`}
              style={{ backgroundColor: 'rgba(96, 60, 208, 1)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </motion.form>
        );

      case 3:
        return (
          <motion.form
            key="step3"
            onSubmit={handleSubmitStep3}
            className="space-y-4"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <div>
              <label className="block text-sm mb-3 font-medium text-center">Enter OTP</label>
              <div className="flex justify-center space-x-2 mb-4">
                {[...Array(6)].map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    data-index={index}
                    value={signupData.otp[index] || ''}
                    className="w-10 h-12 text-center bg-black text-white text-lg outline-none border-b-2 border-gray-400 focus:border-white transition-colors"
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>
              {error && (
                <div className="flex items-center p-2 bg-red-900/30 border border-red-500/50 rounded mb-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                  <p className="text-red-400 text-xs ml-2">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading || !isStep3Valid()}
                className={`w-full py-3 rounded-full text-white font-semibold transition-all flex items-center justify-center ${
                  isLoading || !isStep3Valid() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                }`}
                style={{ backgroundColor: 'rgba(96, 60, 208, 1)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>

              <div className="text-center">
                {!canResend ? (
                  <p className="text-gray-400 text-sm">
                    Resend code in {countdown} seconds
                  </p>
                ) : (
                  <button
                    type="button"
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
          </motion.form>
        );

      case 4:
        return (
          <motion.form
            key="step4"
            onSubmit={handleSubmitStep4}
            className="space-y-4"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <div>
              <label className="block text-sm mb-2 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={signupData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  className="w-full py-3 rounded-full pl-4 pr-10 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white transition-colors"
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
              <label className="block text-sm mb-2 font-medium">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="w-full py-3 rounded-full pl-4 pr-10 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white transition-colors"
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
              <div className="flex items-center p-2 bg-red-900/30 border border-red-500/50 rounded">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                <p className="text-red-400 text-xs ml-2">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isStep4Valid()}
              className={`w-full py-3 rounded-full text-white font-semibold transition-all flex items-center justify-center ${
                isLoading || !isStep4Valid() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
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
          </motion.form>
        );

      case 5:
        return (
          <motion.form
            key="step5"
            onSubmit={handleSubmitStep5}
            className="space-y-4"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4 }}
          >
            <div>
              <label className="block text-sm mb-2 font-medium">Display Name</label>
              <input
                type="text"
                name="displayName"
                value={signupData.displayName}
                onChange={handleInputChange}
                placeholder="Enter your display name"
                className="w-full py-3 rounded-full pl-4 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white transition-colors"
              />
              {signupData.displayName && signupData.displayName.trim().length < 2 && (
                <p className="text-red-400 text-xs mt-1">Display name must be at least 2 characters</p>
              )}
              {error && (
                <div className="flex items-center p-2 bg-red-900/30 border border-red-500/50 rounded mt-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
                  <p className="text-red-400 text-xs ml-2">{error}</p>
                </div>
              )}
            </div>

         

            <button
              type="submit"
              disabled={isLoading || !isStep5Valid()}
              className={`w-full py-3 rounded-full text-white font-semibold transition-all flex items-center justify-center ${
                isLoading || !isStep5Valid() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
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
          </motion.form>
        );

      default:
        return null;
    }
  };


  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 flex justify-center items-center px-4 z-50">
      <div className="bg-[rgba(13,13,13,1)] w-[502px] text-white rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
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
          <div 
            className="text-sm text-gray-400 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={handleSkip}
          >
            Skip
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">{getStepTitle()}</h2>
          <p className="text-xs text-gray-400">{getStepDescription()}</p>
        </div>

        {/* Form Content with Animation */}
        <div className="min-h-[400px] relative">
          <AnimatePresence mode="wait">
            {renderStepForm()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SignUp;