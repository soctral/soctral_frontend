import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Onboarding from "./components/Onboarding";
import DesktopOnboardingSteps from "./components/StepOneDesktop";
import MobileOnboardingSteps from "./components/StepOneMobile";
import { UserProvider } from "./context/userContext";
import Homepage from "./layouts/Homepage";
import SignInDesktop from "./layouts/SignInDesktop";
import SignInMobile from "./layouts/SignInMobile";
import SignUpDesktop from "./layouts/SignUpDesktop";
import SignUpMobile from "./layouts/SignUpMobile";
import MobileHomepage from "./layouts/mobilehomepage";
import './services/tradeStateMigration';



// Enhanced responsive detection that accounts for user agent and viewport
const useResponsive = () => {
  const [isDesktop, setIsDesktop] = useState(() => {
    // Initialize with proper detection on first render
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
    
    if (isMobileDevice && !isTablet) {
      return false;
    } else {
      return window.innerWidth >= 1024;
    }
  });
  
  useEffect(() => {
    const detectDevice = () => {
      // Check user agent for mobile devices
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check if it's a tablet in landscape mode
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
      
      // Use a combination of screen width and user agent
      // If it's a mobile device, treat it as mobile regardless of viewport width
      // This prevents issues when "Request Desktop Site" is used
      if (isMobileDevice && !isTablet) {
        setIsDesktop(false);
      } else {
        // For actual desktop browsers or tablets, use width detection
        setIsDesktop(window.innerWidth >= 1024);
      }
    };
    
    // Only add resize listener, don't call detectDevice again since we already initialized properly
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, []);
  
  return { isDesktop, isMobile: !isDesktop };
};

// Responsive wrapper component
const ResponsiveComponent = ({ MobileComponent, DesktopComponent, ...props }) => {
  const { isDesktop } = useResponsive();
  
  return isDesktop ? 
    <DesktopComponent {...props} /> : 
    <MobileComponent {...props} />;
};

function App() {
  const [hasOnboarded, setHasOnboarded] = useState(null); // Start with null to prevent flash
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user should skip onboarding - run only once on app initialization
  useEffect(() => {
    const initializeOnboardingState = () => {
      const skipOnboarding = localStorage.getItem('skipOnboarding');
      const hasCompletedSignup = localStorage.getItem('hasCompletedSignup');
      
      if (skipOnboarding === 'true' || hasCompletedSignup === 'true') {
        setHasOnboarded(true);
      } else {
        setHasOnboarded(false);
      }
      setIsInitialized(true);
    };

    initializeOnboardingState();
  }, []); // Empty dependency array - runs only once

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setHasOnboarded(true);
    localStorage.setItem('skipOnboarding', 'true');
  };

  // Ensure status bar is black for all screens after onboarding
  useEffect(() => {
    if (hasOnboarded) {
      const setStatusBarColor = (color, style = 'default') => {
        // For iOS Safari
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
          metaThemeColor = document.createElement('meta');
          metaThemeColor.name = 'theme-color';
          document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = color;

        // For iOS Safari status bar style
        let metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!metaStatusBar) {
          metaStatusBar = document.createElement('meta');
          metaStatusBar.name = 'apple-mobile-web-app-status-bar-style';
          document.head.appendChild(metaStatusBar);
        }
        metaStatusBar.content = style;

        // For Android Chrome
        let metaAndroid = document.querySelector('meta[name="msapplication-navbutton-color"]');
        if (!metaAndroid) {
          metaAndroid = document.createElement('meta');
          metaAndroid.name = 'msapplication-navbutton-color';
          document.head.appendChild(metaAndroid);
        }
        metaAndroid.content = color;
      };

      // Set black status bar for all screens after onboarding
      setStatusBarColor('#000000', 'default');
    }
  }, [hasOnboarded]);

  // Don't render anything until initialization is complete
  if (!isInitialized) {
    return null; // or a loading spinner if you prefer
  }

  // Show onboarding only if user hasn't onboarded
  if (hasOnboarded === false) {
    return <Onboarding onDone={handleOnboardingComplete} />;
  }

  return (
    <UserProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="*" element={<Navigate to="/homepage" replace />} />
          <Route 
            path="/" 
            element={
              <ResponsiveComponent 
                MobileComponent={MobileOnboardingSteps}
                DesktopComponent={DesktopOnboardingSteps}
              />
            } 
          />

          <Route 
            path="/homepage" 
            element={
              <ResponsiveComponent 
                MobileComponent={MobileHomepage}
                DesktopComponent={Homepage}
              />
            } 
          />

          <Route 
            path="/sign-in" 
            element={
              <ResponsiveComponent 
                MobileComponent={SignInMobile}
                DesktopComponent={SignInDesktop}
              />
            } 
          />
          
          <Route 
            path="/sign-up" 
            element={
              <ResponsiveComponent 
                MobileComponent={SignUpMobile}
                DesktopComponent={SignUpDesktop}
              />
            } 
          />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;