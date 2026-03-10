import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useUser } from "../context/userContext";
import authService from "../services/authService";
import countryCodeOptions from "../data/countryCodeOptions";
import Warning from "../assets/warning.png";

export default function GoogleOnboarding() {
  const navigate = useNavigate();
  const {
    user,
    setInitialPhone,
    completeGoogleSignup,
    getUserByToken,
    isLoading,
    error,
    clearError,
  } = useUser();

  const [countryCode, setCountryCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("");

  const hasToken = !!authService.getAuthToken();
  const isPendingGoogle = !user && hasToken;

  useEffect(() => {
    if (!user && !hasToken) {
      navigate("/", { replace: true });
      return;
    }
    if (user?.phoneNumber && !isPendingGoogle) {
      navigate("/homepage", { replace: true });
    }
  }, [user, hasToken, navigate, isPendingGoogle]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const full = `${countryCode}${phoneNumber.replace(/[\s\-\(\)]/g, "")}`;
    if (full.length < 10) return;
    try {
      if (isPendingGoogle) {
        await completeGoogleSignup(full);
      } else {
        await setInitialPhone(full);
        await getUserByToken();
      }
      navigate("/homepage", { replace: true });
    } catch (err) {
      // error set in context
    }
  };

  if (!user && !isPendingGoogle) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (user?.phoneNumber) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-xl font-semibold text-center">
          Add your phone number
        </h2>
        <p className="text-sm text-gray-400 text-center">
          We'll use this to stay in touch.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <img src={Warning} alt="" className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
          onSubmit={handlePhoneSubmit}
        >
          <div className="flex rounded-full border border-gray-400 bg-black overflow-hidden">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="bg-black text-white pl-4 pr-2 py-3 outline-none"
            >
              {countryCodeOptions.map((c) => (
                <option key={`${c.code}-${c.country}`} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <div className="w-px bg-gray-500" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number"
              className="flex-1 py-3 px-4 bg-black text-white placeholder-gray-400 outline-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full py-3 rounded-full font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "rgba(96, 60, 208, 1)" }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Continue"
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
