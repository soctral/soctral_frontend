import React from 'react';
import { X, Send, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

const FourthProcessMobile = ({ formData, dealResponse, onClose, onOpenChat }) => {
  return (
    <div className="fixed inset-0 bg-[#0D0D0D] z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white text-lg font-bold">Soctra</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Animated Icon Container */}
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
          <div className="absolute inset-2 rounded-full bg-primary/40"></div>
          <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(107,70,193,0.6)]">
            <Send className="w-10 h-10 text-white ml-[-4px] mt-[4px]" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-white text-2xl font-bold text-center mb-2">Escrow<br/>Request Sent</h2>
        
        <p className="text-gray-400 text-sm text-center mb-8">
          Your escrow request has been sent to <span className="font-semibold text-white">@{formData.dealPartner || 'User'}</span>
        </p>

        <div className="w-full bg-[#181818] rounded-2xl p-5 border border-white/5">
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            Your escrow partner <span className="text-white">@{formData.dealPartner || 'User'}</span> will receive a notification and can:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-300 text-sm">Accept Deal</span>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-300 text-sm">Decline Deal</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="text-gray-300 text-sm">Message You</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-0 space-y-3 shrink-0">
        <button 
          onClick={() => {
            const dealId = dealResponse?._id || dealResponse?.id || dealResponse?.deal?._id || dealResponse?.deal?.id;
            const channelId = dealResponse?.channelId || `escrow_${dealId}`;
            if (onOpenChat) onOpenChat(channelId);
            else onClose();
          }}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-full transition-colors text-sm"
        >
          Open Chat
        </button>
        <button 
          onClick={onClose}
          className="w-full bg-transparent border border-primary text-white font-semibold py-4 rounded-full hover:bg-white/5 transition-colors text-sm"
        >
          View Escrow Details
        </button>
      </div>
    </div>
  );
};

export default FourthProcessMobile;
