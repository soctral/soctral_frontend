import React, { useState } from "react";
import { X, Copy, Instagram, Check } from "lucide-react";
import { useUser } from "../../context/userContext"; 
import referral from "../../assets/referral.svg"
import icon1 from "../../assets/Frame8.svg"
import icon2 from "../../assets/Frame9.svg"
import icon3 from "../../assets/Frame10.svg"
import icon4 from "../../assets/Frame11.svg"


const ReferralsModal = ({ isOpen, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { isAuthenticated, user } = useUser(); // Added user context

  if (!isOpen) return null;

  // Close modal and show alert if user is not logged in
  if (!isAuthenticated) {
    onClose();
    alert("Please log in to access referrals");
    return null;
  }

  const handleCopyReferralLink = () => {
    // Add your referral link logic here
    navigator.clipboard.writeText("https://your-referral-link.com");
    setIsCopied(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleShare = (platform) => {
    const referralLink = "https://your-referral-link.com";
    const text = "Join me on this amazing platform!";
    
    switch(platform) {
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so copy to clipboard
        navigator.clipboard.writeText(`${text} ${referralLink}`);
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, '_blank');
        break;
      case 'tiktok':
        // TikTok doesn't have direct URL sharing, so copy to clipboard
        navigator.clipboard.writeText(`${text} ${referralLink}`);
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: 'Join me!',
            text: text,
            url: referralLink,
          });
        } else {
          navigator.clipboard.writeText(`${text} ${referralLink}`);
        }
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-[rgba(0,0,0,0.7)] border border-white/10 rounded-lg h-full lg:h-[36rem] p-6 max-w-xl w-full lg:mx-4">
        {/* Header */}
        <div className="flex justify-end items-end mb-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>


<div className="flex flex-col justify-center items-center mb-6">

          <h2 className="text-md font-semibold text-white mb-5">Referrals</h2>
          <img src={referral} alt="" />

</div>


        {/* Content */}
        <div className="space-y-4">
          <p className="text-md font-semibold text-white text-center leading-relaxed">
            Refer a friend and earn 10% of their initial deposit
          </p>
          
          <p className="text-gray-400 text-xs leading-relaxed">
            Help your friends join a secure and trusted marketplace for buying and selling social media accounts. When they sign up and make their first deposit, you'll earn 10% of their initial deposit as a reward. The more friends you refer, the more you earn!
          </p>

          {/* Copy Referral Link Button */}
          <button
            onClick={handleCopyReferralLink}
            className={`w-full ${isCopied ? 'bg-primary' : 'bg-[rgba(24,24,24,1)]'} text-white py-5 px-4 rounded-full flex items-center justify-between gap-2 transition-colors`}
          >
            {isCopied ? 'Copied Link' : 'Copy Referral Link'}

            {isCopied ? (
              <Check className="h-6 w-6 hover:scale-110 duration-200" />
            ) : (
              <Copy className="h-6 w-6 hover:scale-110 duration-200" />
            )}
          </button>

          {/* Social Share Buttons */}
          <div className="flex items-center justify-evenly">
            <div 
              className="flex flex-col gap-3 justify-center items-center hover:scale-110 duration-200 cursor-pointer"
              onClick={() => handleShare('instagram')}
            >
                <img src={icon1} className="h-12 w-12" alt="" />
                <p className="text-sm">Instagram</p>
            </div>

            <div 
              className="flex flex-col gap-3 justify-center items-center hover:scale-110 duration-200 cursor-pointer"
              onClick={() => handleShare('tiktok')}
            >
        <img src={icon2} className="h-12 w-12" alt="" />
                <p className="text-sm">Tiktok</p>
            </div>
            <div 
              className="flex flex-col gap-3 justify-center items-center hover:scale-110 duration-200 cursor-pointer"
              onClick={() => handleShare('x')}
            >
        <img src={icon3} className="h-12 w-12" alt="" />
                <p className="text-sm">X</p>
            </div>
            <div 
              className="flex flex-col gap-3 justify-center items-center hover:scale-110 duration-200 cursor-pointer"
              onClick={() => handleShare('share')}
            >
        <img src={icon4} className="h-12 w-12" alt="" />
                <p className="text-sm">Share</p>
            </div>


          </div>
   
        </div>
      </div>
    </div>
  );
};

export default ReferralsModal;