import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ShieldCheck, ChevronRight } from 'lucide-react';

const FirstProcessMobile = ({ onClose, onSelect }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      <div className={`fixed bottom-0 left-0 right-0 bg-[#181818] z-50 rounded-t-3xl transition-transform duration-300 transform ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
        </div>
        
        <div className="px-5 pb-8 pt-4">
          <h2 className="text-white text-xl font-bold mb-6">What Would You Like To Do?</h2>
          
          <div className="space-y-4">
            <button 
              className="w-full flex items-center justify-between text-left group"
              onClick={() => onSelect('buy_sell')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ArrowLeftRight className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white text-base font-semibold">Buy/Sell Accounts</h3>
                  <p className="text-gray-400 text-xs mt-1">Browse social media accounts in the marketplace</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
            
            <div className="h-[1px] w-full bg-white/5"></div>
            
            <button 
              className="w-full flex items-center justify-between text-left group"
              onClick={() => onSelect('create_escrow')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white text-base font-semibold">Create Escrow</h3>
                  <p className="text-gray-400 text-xs mt-1">Secure transactions for services, products, freelance work, leads, e.t.c</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FirstProcessMobile;
