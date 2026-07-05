import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ShieldCheck, ChevronRight, X } from 'lucide-react';

const FirstProcessDesktop = ({ onClose, onSelect }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className={`w-full max-w-md bg-[#181818] rounded-2xl pointer-events-auto transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="flex justify-end p-4 pb-0">
            <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="px-6 pb-8 pt-2">
            <h2 className="text-white text-xl font-bold mb-6 text-center">What Would You Like To Do?</h2>
            
            <div className="space-y-4">
              <button 
                className="w-full flex items-center justify-between text-left group hover:bg-white/5 p-3 -mx-3 rounded-xl transition-colors"
                onClick={() => onSelect('buy_sell')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <ArrowLeftRight className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-white text-base font-semibold group-hover:text-primary transition-colors">Buy/Sell Accounts</h3>
                    <p className="text-gray-400 text-xs mt-1">Browse social media accounts in the marketplace</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
              </button>
              
              <div className="h-[1px] w-full bg-white/5"></div>
              
              <button 
                className="w-full flex items-center justify-between text-left group hover:bg-white/5 p-3 -mx-3 rounded-xl transition-colors"
                onClick={() => onSelect('create_escrow')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-white text-base font-semibold group-hover:text-primary transition-colors">Create Escrow</h3>
                    <p className="text-gray-400 text-xs mt-1">Secure transactions for services, products, freelance work, leads, e.t.c</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FirstProcessDesktop;
