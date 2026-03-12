import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import one from "../assets/1.svg";
import two from "../assets/2.svg";
import three from "../assets/3.svg";
import logo from "../assets/SoctralbgLogo.png";
import Card from "../components/OnboardingDesktopCard";
import SignIn from "../layouts/SignInDesktop";
import SignUp from "../layouts/SignUpDesktop";
import authService from "../services/authService";

export default function DesktopOnboardingSteps() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkAuthentication = () => {
      const isAuthenticated = authService.isAuthenticated();
      
      if (isAuthenticated) {
        navigate("/homepage", { replace: true });
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Open sign-in or sign-up modal when arriving via /login or /signup (for Google sitelinks)
  useEffect(() => {
    const open = searchParams.get("open");
    if (open === "login") {
      setShowSignIn(true);
      setShowSignUp(false);
    } else if (open === "signup") {
      setShowSignUp(true);
      setShowSignIn(false);
    }
  }, [searchParams]);

  // Set document title and meta description when sign-in/sign-up modal is open (for sitelink context)
  useEffect(() => {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (showSignIn) {
      document.title = "Login – Soctral";
      if (metaDesc) metaDesc.setAttribute("content", "Sign in to your Soctral account. Access your wallet, listings, and trade social media accounts securely with escrow protection.");
    } else if (showSignUp) {
      document.title = "Sign up – Soctral";
      if (metaDesc) metaDesc.setAttribute("content", "Create a Soctral account to buy and sell social media accounts securely. Wallet, escrow, and verified trading.");
    } else {
      document.title = "Soctral – Secure Social Media Trading";
      if (metaDesc) metaDesc.setAttribute("content", "Soctral is a secure platform for buying and selling social media accounts. Fund your wallet, browse listings, and trade with escrow protection.");
    }
  }, [showSignIn, showSignUp]);

  const openSignIn = () => {
    setShowSignIn(true);
    setShowSignUp(false);  // Close Sign Up when Sign In is opened
  };

  const openSignUp = () => {
    setShowSignUp(true);
    setShowSignIn(false);  // Close Sign In when Sign Up is opened
  };

  const handleSkip = () => {
    // Check authentication before redirecting
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      navigate("/homepage");
    } else {
      navigate("/homepage"); // Allow skip even if not authenticated
    }
  };

  const handleGetStarted = () => {
    // Check authentication before showing sign-in
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      navigate("/homepage");
    } else {
      openSignIn();
    }
  };

  return (
    <>
      <div className="bg-tertiary relative w-screen h-screen overflow-visible">
        <div className="flex flex-col justify-between h-full max-w-screen-xl mx-auto px-4 py-4">
          {/* Top Row: logo, sitelink-friendly Login/Sign up (crawlable), Skip */}
          <div className="flex justify-between items-center w-full mb-2">
            <img src={logo} alt="Soctral Logo" className="w-8 h-8 object-contain" />
            <nav className="flex items-center gap-3" aria-label="Account">
              <Link to="/login" className="text-white text-xs font-medium hover:underline" title="Sign in to your Soctral account" aria-label="Sign in to your Soctral account">Login</Link>
              <Link to="/signup" className="text-white text-xs font-medium hover:underline" title="Create a Soctral account to buy and sell social media securely" aria-label="Create a Soctral account">Sign up</Link>
              <p className="text-white cursor-pointer text-xs font-normal" onClick={handleSkip}>Skip</p>
            </nav>
          </div>

          {/* Welcome Text */}
          <div className="mt-2">
            <h1 className="text-white font-bold text-2xl sm:text-3xl mb-1">
              Welcome to Soctral
            </h1>
            <p className="text-xs leading-4 text-white max-w-sm">
              A Secure Marketplace for Buying and Selling Social Media Accounts,
              Built on Trust and Transparency.
            </p>
          </div>

          {/* Cards */}
          <div className="flex flex-wrap justify-between items-stretch gap-3 mt-3 w-full">
            <Card
              imageSrc={one}
              altText="Image 1"
              text="Buy and Sell Social Media Accounts Without The Fear of Scam"
            />
            <Card
              imageSrc={two}
              altText="Image 2"
              text="Your Payments Are Safely Held Until Satisfaction Is Guaranteed."
            />
            <Card
              imageSrc={three}
              altText="Image 3"
              text="Connect and Trade Directly with Sellers and Buyers."
            />
          </div>

          {/* Button */}
          <div className="flex justify-center w-full mt-4">
            <button
              className="h-11 w-full max-w-xs bg-primary text-white rounded-full text-xs font-semibold"
              onClick={handleGetStarted} 
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Show SignIn Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center px-4">
          <SignIn apiUrl="http://your-api-url" onClose={() => setShowSignIn(false)} />
        </div>
      )}

      {/* Show SignUp Modal */}
      {showSignUp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center px-4">
          <SignUp apiUrl="http://your-api-url" onClose={() => setShowSignUp(false)} />
        </div>
      )}
    </>
  );
}