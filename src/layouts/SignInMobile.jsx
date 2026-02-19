import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Warning from "../assets/warning.png"
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/userContext'; // Use the context instead of direct service

const SignIn = () => {
  const navigate = useNavigate();
  const { signInUser, isLoading, error, clearError } = useUser(); // Use context methods
  
  const [method, setMethod] = useState("phone");
  const [formData, setFormData] = useState({
    phoneNumber: "",
    email: "",
    password: "",
    countryCode: "+234",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare credentials based on login method
      const credentials = {
        password: formData.password,
        ...(method === "phone" 
          ? { phoneNumber: `${formData.countryCode}${formData.phoneNumber}` }
          : { email: formData.email }
        )
      };

      
      // Use the context method instead of direct service call
      const response = await signInUser(credentials);
      
      
      // Navigate to dashboard or appropriate page
      navigate('/homepage');
      
    } catch (err) {
      console.error('❌ Sign in error:', err);
      // Error is already handled by the context, no need to set it here
    }
  };

  const validateForm = () => {
    if (method === "phone") {
      return formData.phoneNumber.trim() && formData.password.trim();
    } else {
      return formData.email.trim() && formData.password.trim();
    }
  };

  return (
    <section className="bg-black text-white h-screen flex flex-col overflow-hidden">
      <div className="flex flex-col h-full px-4 py-4">
        {/* Header - Fixed height */}
        <div className="pt-12 pb-6 flex-shrink-0">
          <h3 className="text-2xl font-bold mb-4">Sign In to Soctral</h3>
          <p className="text-sm text-gray-300">
            Sign in with your phone number or email.
          </p>
        </div>

        {/* Toggle Method - Fixed height */}
        <div className="flex justify-center space-x-8 mb-6 flex-shrink-0">
          {["phone", "email"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setMethod(type);
                clearError(); // Use context method
              }}
              className={`relative pb-1 text-base ${
                method === type ? "font-semibold" : "text-gray-400"
              }`}
            >
              {type === "phone" ? "Phone Number" : "Email Address"}
              {method === type && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-12 h-[2px] bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Form - Flexible container */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.form
              key={method}
              className="flex flex-col h-full"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
            >
              {/* Form Fields - Flexible */}
              <div className="flex-1 space-y-5">
                {/* Phone or Email Field */}
                {method === "phone" ? (
                  <div className="space-y-2">
                    <label className="block text-base mb-4 font-medium">Phone Number</label>
                    <div className="flex items-center border border-gray-400 rounded-[90px] bg-black overflow-hidden">
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        className="bg-black text-white pl-4 pr-2 py-5 outline-none appearance-none"
                      >
                        <option value="+234">🇳🇬 (+234)</option>
                        <option value="+1">🇺🇸 (+1)</option>
                        <option value="+44">🇬🇧 (+44)</option>
                        <option value="+91">🇮🇳 (+91)</option>
                        <option value="+27">🇿🇦 (+27)</option>
                      </select>
                      <div className="h-8 w-px bg-white/30 mx-3" />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Phone number"
                        className="flex-1 bg-black text-white placeholder-gray-400 outline-none py-5 pr-4"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-base mb-4 font-medium">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email address"
                      className="w-full py-5 rounded-[90px] pl-5 border border-gray-400 bg-black text-white placeholder-gray-400 outline-none focus:border-white"
                      required
                    />
                  </div>
                )}

                {/* Password Field with Eye Icon */}
                <div className="space-y-2 relative">
                  <label htmlFor="password" className="block text-base mb-4 font-medium">
                    Password
                  </label>
                  <div className="flex items-center border border-gray-400 rounded-[90px] bg-black overflow-hidden">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="flex-1 p-5 bg-black text-white placeholder-gray-400 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="p-5 text-gray-300 hover:text-white"
                    >
                      {showPassword ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center space-x-3">
                    <img src={Warning} alt="Warning" className="w-6 h-6" />
                    <p className="text-red-500 text-xl my-[2px] text-left">{error}</p>
                  </div>
                )}
              </div>

              {/* Bottom section - Fixed */}
              <div className="flex-shrink-0 mt-6 space-y-4">
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !validateForm()}
                  className={`w-full p-5 rounded-[90px] bg-primary text-white font-semibold transition-opacity ${
                    isLoading || !validateForm() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                  }`}
                >
                  {isLoading ? "Signing In..." : "Continue"}
                </button>
                
                <p className="text-[rgba(255,255,255,0.5)] text-center mx-auto">
                  Don't have an account? 
                  <span className="text-white font-normal text-base hover:underline">
                    <Link to="/sign-up"> Sign Up</Link>
                  </span>
                </p>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default SignIn;