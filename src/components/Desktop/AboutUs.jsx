import { X, Star, Info, LogOut, HelpCircle } from "lucide-react";



const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 z-[9999] flex items-center justify-center p-4">
<div className="bg-[#0D0D0D] rounded-lg p-6 w-full max-w-xl shadow-2xl">
          <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-semibold">About Us</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-gray-300">
          <p>About us information will be displayed here.</p>
          {/* Add your about us content here */}
        </div>
      </div>
    </div>
  );
};


export default AboutModal;