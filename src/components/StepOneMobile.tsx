import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/soctraLogo.png";
import Card from "../components/OnboardingMobileCard";
import one from "../assets/1.svg";
import two from "../assets/2.svg";
import three from "../assets/3.svg";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const steps = [
  {
    headeer: "Welcome to Soctral",
    text: "A Secure Marketplace for Buying and Selling Social Media Accounts, Built on Trust and Transparency.",
    imageSrc: one,
    altText: "Image 1",
  },
  {
    headeer: "Secure Escrow Payments",
    imageSrc: two,
    altText: "Image 2",
    text: "Your Payments Are Safely Held Until Satisfaction Is Guaranteed.",
  },
  {
    headeer: "Seamless In-App Chat",
    imageSrc: three,
    altText: "Image 3",
    text: "Connect and Trade Directly with Sellers and Buyers.",
  },
];

export default function MobileOnboardingSteps() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkAuthentication = () => {
      const isAuthenticated = authService.isAuthenticated();
      
      if (isAuthenticated) {
        console.log('✅ User is authenticated, redirecting to homepage');
        navigate("/homepage", { replace: true });
      }
    };

    checkAuthentication();
  }, [navigate]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      // Check authentication before redirecting
      const isAuthenticated = authService.isAuthenticated();
      
      if (isAuthenticated) {
        navigate("/homepage");
      } else {
        navigate("/sign-in");
      }
    }
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

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="bg-tertiary min-h-screen h-[100dvh] overflow-hidden">
      <div className="flex flex-col items-center justify-between max-w-screen-md mx-auto h-full bg-tertiary p-5 relative">

        {/* Top Logo and Skip */}
        <div className="flex justify-end items-center w-full mb-6">
          <img src={logo} alt="Logo" className="w-[50px] hidden h-[50px]" />
          <p
            onClick={handleSkip}
            className="text-white cursor-pointer mb-[.6rem] mt-[.7rem] flex justify-end items-end font-normal"
          >
            Skip
          </p>
        </div>

        {/* AnimatePresence for Card */}
        <div className="flex items-center justify-center w-full h-[400px] relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", duration: 0.6 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(event, info) => {
                if (info.offset.x < -100 && currentStep < steps.length - 1) {
                  setDirection(1);
                  setCurrentStep((prev) => prev + 1);
                } else if (info.offset.x > 100 && currentStep > 0) {
                  setDirection(-1);
                  setCurrentStep((prev) => prev - 1);
                }
              }}
            >
              <Card
                headeer={steps[currentStep].headeer}
                text={steps[currentStep].text}
                imageSrc={steps[currentStep].imageSrc}
                altText={steps[currentStep].altText}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Dots */}
        <div className="flex mb-[3rem] mt-[.6rem] rounded-full">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-6 h-[4px] ${index === currentStep ? "bg-primary rounded-full" : "bg-newgray"}`}
            />
          ))}
        </div>

        {/* Button */}
        <div className="w-full flex justify-center">
          <button
            onClick={handleNext}
            className="h-[54px] w-[100%] bg-primary text-white rounded-full mb-[1rem] text-sm font-semibold"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Get Started"}
          </button>
        </div>

      </div>
    </div>
  );
}