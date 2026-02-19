import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Shield, CheckCircle, DollarSign } from "lucide-react";
// import BuySellTable from "../components/buysellTable";
import step1 from "../../assets/step1.svg"
import step2 from "../../assets/step2.svg"
import step3 from "../../assets/step3.svg"
import front from "../../assets/front.svg"
import back from "../../assets/back.svg"
import bulb from "../../assets/bulb.svg"


// Confetti Component
const Confetti = ({ onComplete }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Create confetti particles
    const createParticles = () => {
      const newParticles = [];
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
      
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -10,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          speedX: (Math.random() - 0.5) * 4,
          speedY: Math.random() * 3 + 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10
        });
      }
      setParticles(newParticles);
    };

    createParticles();

    // Animation loop
    let animationId;
    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.speedX,
          y: particle.y + particle.speedY,
          rotation: particle.rotation + particle.rotationSpeed,
          speedY: particle.speedY + 0.1 // gravity
        })).filter(particle => particle.y < window.innerHeight + 20)
      );
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Complete animation after 3 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationId);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            transition: 'none'
          }}
        />
      ))}
    </div>
  );
};

const BuySellModal = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // Check if user has completed the guide before
  const hasCompletedGuide = () => {
    return localStorage.getItem('buysell_guide_completed') === 'true';
  };

  // Mark guide as completed
  const markGuideCompleted = () => {
    localStorage.setItem('buysell_guide_completed', 'true');
  };

  // If user has already seen the guide, don't show the modal
  useEffect(() => {
    if (isOpen && hasCompletedGuide()) {
      // Directly call onComplete to show the table instead of the modal
      if (onComplete) {
        onComplete();
      }
      onClose();
    }
  }, [isOpen, onComplete, onClose]);

  const steps = [
    {
      id: 1,
      icon: ShoppingCart,
      title: "Initiate Trade",
      description: "Browse and select the perfect social media account to purchase. Once you've found the right one, initiate a secure trade to proceed with the transaction.",
      image: step1
    },
    {
      id: 2,
      icon: Shield,
      title: "Secure Transaction",
      description: "Your funds are held securely in escrow while the seller prepares the account transfer. This ensures protection for both parties during the exchange.",
      image: step2
    },
    {
      id: 3,
      icon: CheckCircle,
      title: "Confirm Account",
      description: "Review the transferred social media account to ensure it matches the details provided. Verify metrics, access, and any linked assets before proceeding.",
      image: step3
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step reached - mark as completed and show confetti
      markGuideCompleted();
      setShowConfetti(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    markGuideCompleted();
    setShowTable(true);
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
    // Close the modal after confetti
    onClose();
    
    // If there's an onComplete callback, call it
    if (onComplete) {
      onComplete();
    }
  };

  // Don't render anything if user has already completed guide
  if (!isOpen || hasCompletedGuide()) return null;

  // If onComplete prop exists, don't show the table internally
  if (showTable && !onComplete) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="bg-[#181818] rounded-lg max-w-4xl w-full mx-4 relative border border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="p-8">
            <h2 className="text-white font-bold text-2xl mb-4">Buy/Sell Table</h2>
            <p className="text-gray-400">Table content would go here...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Debug indicator */}
      {showConfetti && (
        <div className="fixed top-4 left-4 bg-red-500 text-white p-2 rounded z-[70]">
          Confetti Active!
        </div>
      )}
      
      {/* Confetti Animation */}
      {showConfetti && <Confetti onComplete={handleConfettiComplete} />}
      
      <div 
        className="fixed inset-0 bg-black/90 z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-end justify-end lg:items-center lg:justify-center lg:p-4">
        <div className="bg-[#181818] lg:rounded-lg max-w-2xl w-full lg:mx-4 relative border border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="p-2 lg:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-white font-bold text-md lg:text-2xl mt-5 mb-2">Complete P2P Trades in 3 Steps</h2>
            </div>

            {/* Image with Navigation Buttons */}
            <div className="flex justify-between items-center mb-3 lg:mb-8 relative">
              {/* Back Button */}
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`p-2 transition-colors ${
                  currentStep === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-80'
                }`}
              >
                <img 
                  src={back} 
                  alt="Previous" 
                  className={`w-6 h-6 ${currentStep === 0 ? 'opacity-50' : 'brightness-0 invert'}`}
                />
              </button>

              {/* Centered Image */}
              <div className="flex-1 flex justify-center relative">
                <img src={steps[currentStep].image} alt={steps[currentStep].title} className="lg:h-[100px]" />
                
                {/* Welcome Bubble - Only show on first step */}
                {currentStep === 0 && showWelcomeBubble && (
                  <div className="absolute top-[50px] lg:left-1 transform -translate-x-1/2 z-20 animate-bounce">
                    <div className="relative bg-blue-600 text-white px-4 py-4 rounded-lg shadow-lg lg:min-w-[390px]">
                      <button
                        onClick={() => setShowWelcomeBubble(false)}
                        className="absolute top-1 right-1 p-1 hover:bg-blue-700 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 mt-1 text-white" />
                      </button>
                      <p className="">
                        <span className="text-xs flex items-center mb-3">
                            <img src={bulb} alt="" className="mr-2" />
                             Welcome to Soctral's P2P Trading Guide. 
                        </span> 
                        
                        <span className="text-xs font-light">
                        This step-by-step guide will walk you through the process of securely trading a social media account.
                        </span>
                      </p>
                      {/* Speech bubble tail */}
                      <div className="absolute top-full left-10 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-blue-600"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="p-2 hover:opacity-80 transition-colors"
              >
                {currentStep === steps.length - 1 ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <img src={front} alt="Next" className="w-6 h-6 brightness-0 invert" />
                )}
              </button>
            </div>

            {/* Current Step Content */}
            <div className="text-center mb-3 lg:mb-8">
              <h3 className="text-white font-semibold text-md lg:text-xl mb-2 lg:mb-4">
                {currentStep + 1}. {steps[currentStep].title}
              </h3>
              
              <p className="text-gray-400 text-sm lg:text-base leading-relaxed max-w-lg mx-auto">
                {steps[currentStep].description}
              </p>

              {/* Complete button on last step */}
              {currentStep === steps.length - 1 && (
                <div className="mt-6">
                  {/* <button
                    onClick={handleNext}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-colors duration-200 transform hover:scale-105"
                  >
                    Complete Guide! ðŸŽ‰
                  </button> */}
                </div>
              )}
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center items-center">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-9 h-[4px] transition-colors ${
                    index === 0 ? 'rounded-l-full ' : ''
                  }${
                    index === steps.length - 1 ? 'rounded-r-full ' : ''
                  }${
                    index === currentStep ? 'bg-blue-600 ' : index < currentStep ? 'bg-blue-600/60' : 'bg-[rgba(242,242,242,0.1)]'
                  }`}
                />
              ))}
            </div>

            {/* Skip button */}
            {currentStep < steps.length - 1 && (
              <div className="text-center mt-6">
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white text-sm underline transition-colors"
                >
                  Skip Guide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BuySellModal;