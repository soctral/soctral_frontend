import { X, Star, Info, LogOut, HelpCircle } from "lucide-react";


const RateAppModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
     <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 z-[9999] rounded-md flex items-center justify-center p-4">
      <div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl">
             <div className="w-full flex items-end justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center items-center mb-4">
          <h2 className="text-white text-lg text-center font-semibold">
Enjoying Soctral?
          </h2>
        </div>
        <div className="text-gray-300">
          <p className="text-[#948f9e] text-center">Enjoying your experience on Soctral? Let us know by rating us on the App Store! Your feedback helps us improve and create a better platform for seamless social media trading.</p>
        
        <div className="flex flex-col gap-4 mt-4">
          <button className="bg-primary text-white rounded-full w-full py-[.9rem] hover:opacity-90">
            Rate Us Now
          </button>

           <button className="border-2 border-primary bg-black text-white w-full py-[.9rem]  hover:opacity-90 rounded-full">
Later
          </button>
        </div>
        
        </div>
      </div>
    </div>
  );
};

export default RateAppModal;