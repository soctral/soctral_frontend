import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/SoctralbgLogo.png";
import Card from "../components/OnboardingDesktopCard";
import one from "../assets/1.svg";
import two from "../assets/2.svg";
import three from "../assets/3.svg";
import SignIn from "../layouts/SignInDesktop";
import SignUp from "../layouts/SignUpDesktop";
import authService from "../services/authService";

export default function DesktopOnboardingSteps() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const navigate = useNavigate();

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
          {/* Top Row */}
          <div className="flex justify-between items-center w-full mb-2">
            <img src={logo} alt="Soctra Logo" className="w-8 h-8 object-contain" />
            <p className="text-white cursor-pointer text-xs font-normal" onClick={handleSkip}>Skip</p>
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