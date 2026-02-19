import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Warning from "../assets/warning.png";
import { X } from "lucide-react";
import SignUp from "../layouts/SignUpDesktop";
import { useUser } from "../context/userContext"; 
import { useNavigate } from "react-router-dom"; 

const SignIn = ({ apiUrl, onClose, onShowSignUp }) => {
  const [method, setMethod] = useState("phone");
  const [formData, setFormData] = useState({
    phoneNumber: "",
    email: "",
    password: "",
    countryCode: "+234",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSignInVisible, setIsSignInVisible] = useState(true);

  // Use the UserContext for authentication
  const { signInUser, isLoading, error, clearError } = useUser();
  
  // Initialize navigate for redirection
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear any existing errors when user starts typing
    if (error) {
      clearError();
    }
  };


  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare credentials based on selected method
      const credentials = method === "phone" 
        ? {
            // Use identifier field for the authService to properly detect phone numbers
            identifier: `${formData.countryCode}${formData.phoneNumber}`,
            password: formData.password
          }
        : {
            // Use identifier field for emails too for consistency
            identifier: formData.email,
            password: formData.password
          };

      console.log("Attempting to sign in with method:", method);
      console.log("Credentials being sent:", credentials);
      
      // Use the signInUser function from UserContext
      const response = await signInUser(credentials);
      
      
      // Close the modal first
      if (onClose) {
        onClose();
      }
            navigate("/homepage");
      
    } catch (error) {
      console.error("Sign in failed:", error);
      // Error is already handled by UserContext, so we don't need to set it here
    }
  };

  const toggleModal = () => {
    setIsSignInVisible((prev) => !prev);
    // Clear any errors when switching between sign in and sign up
    if (error) {
      clearError();
    }
  };

 const handleShowSignUp = () => {
    if (onClose) {
      onClose();
    }
    setTimeout(() => {
      if (onShowSignUp) {
        onShowSignUp();
      }
    }, 100);
  };

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 flex justify-center items-center px-4 z-50 ">
        <section className="bg-[rgba(13,13,13,1)] w-[502px] rounded-[20px]">
          <div className="relative z-70 w-full bg-[#0F0F0F] rounded-2xl shadow-lg p-[24px]">
            <div className="mb-[0.8rem] text-left">
              <div className="flex w-full items-center justify-between">
                <h3 className="text-[16px] font-bold mb-[10px] text-white">
                  {isSignInVisible ? "Sign In to Soctral" : "Sign Up for Soctral"}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[12px] text-gray-300">
                {isSignInVisible
                  ? "Sign in with your phone number or email."
                  : "Sign up to create a new account."}
              </p>
            </div>

            <div className="flex justify-center space-x-8 mb-[1rem]">
              {["phone", "email"].map((type) => (
                <button
                  key={type}
                  onClick={() => setMethod(type)}
                  className={`relative pb-1 text-[12px] ${
                    method === type ? "font-semibold text-white" : "text-gray-400"
                  }`}
                >
                  {type === "phone" ? "Phone Number" : "Email Address"}
                  {method === type && (
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-12 h-[2px] bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={isSignInVisible ? "signIn" : "signUp"}
                className="space-y-5"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
              >
                {/* Phone or Email */}
                {method === "phone" ? (
                  <div>
                    <label className="block text-base text-white font-medium mb-2">Phone Number</label>
                    <div className="flex items-center text-base border border-gray-400 rounded-full bg-black overflow-hidden">
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        className="bg-black text-base text-white pl-4 pr-2 py-4 outline-none"
                        disabled={isLoading}
                      >
                        <option className="text-base" value="+234">🇳🇬 (+234)</option>
                        <option className="text-base" value="+1">🇺🇸 (+1)</option>
                        <option className="text-base" value="+44">🇬🇧 (+44)</option>
                        <option className="text-base" value="+91">🇮🇳 (+91)</option>
                        <option className="text-base" value="+27">🇿🇦 (+27)</option>
                      </select>
                      <div className="h-6 w-px bg-white/30 mx-3" />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Phone number"
                        className="flex-1 bg-black text-white py-3 placeholder-gray-400 outline-none"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="email" className="block text-base text-white font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email address"
                      className="w-full py-3 rounded-full pl-5 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white"
                      disabled={isLoading}
                      required
                    />
                  </div>
                )}

                {/* Password */}
                <div className="relative">
                  <label htmlFor="password" className="block text-base text-white font-medium mb-2">Password</label>
                  <div className="flex items-center border border-gray-400 rounded-full bg-black overflow-hidden">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="flex-1 py-3 pl-5 bg-black text-white placeholder-gray-400 outline-none"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="p-4 text-gray-300 hover:text-white disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center space-x-3 text-red-500 text-base">
                    <img src={Warning} alt="Warning" className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-full bg-primary text-white font-semibold transition-opacity ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Signing In..." : isSignInVisible ? "Continue" : "Sign Up"}
                </button>

                <p className="text-[rgba(255,255,255,0.5)] text-center text-base mt-6">
                  Don't have an account?
                  <button
                    type="button"
                    onClick={handleShowSignUp}
                    className="text-white font-normal text-base hover:underline ml-1"
                    disabled={isLoading}
                  >
                    Sign Up
                  </button>
                </p>
              </motion.form>
            </AnimatePresence>

            {/* Conditionally render SignUp Component */}
            {!isSignInVisible && <SignUp apiUrl={apiUrl} jsx={true} />}
          </div>
        </section>
      </div>
    </>
  );
};

export default SignIn;