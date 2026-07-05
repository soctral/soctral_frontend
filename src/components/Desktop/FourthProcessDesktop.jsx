import React from 'react';
import { X, Send, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

const FourthProcessDesktop = ({ formData, dealResponse, onClose, onOpenChat }) => {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-[#0D0D0D] rounded-2xl pointer-events-auto flex flex-col overflow-hidden border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0">
            <h1 className="text-white text-lg font-bold">Soctra</h1>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10 pt-4">
            {/* Animated Icon Container */}
            <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-primary/40"></div>
              <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(107,70,193,0.6)]">
                <Send className="w-12 h-12 text-white ml-[-4px] mt-[4px]" strokeWidth={2.5} />
              </div>
            </div>

            <h2 className="text-white text-2xl font-bold text-center mb-2">Escrow Request Sent</h2>
            
            <p className="text-gray-400 text-sm text-center mb-8">
              Your escrow request has been sent to <span className="font-semibold text-white">@{formData.dealPartner || 'User'}</span>
            </p>

            <div className="w-full bg-[#181818] rounded-2xl p-6 border border-white/5 mb-8">
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                Your escrow partner <span className="text-white">@{formData.dealPartner || 'User'}</span> will receive a notification and can:
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300 text-sm">Accept Deal</span>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-gray-300 text-sm">Decline Deal</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <span className="text-gray-300 text-sm">Message You</span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={() => {
                  const dealId = dealResponse?._id || dealResponse?.id || dealResponse?.deal?._id || dealResponse?.deal?.id;
                  const channelId = dealResponse?.chatChannelId || dealResponse?.channelId || `escrow_${dealId}`;
                  if (onOpenChat) onOpenChat(channelId);
                  else onClose();
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl transition-colors text-sm"
              >
                Open Chat
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-transparent border border-primary text-white font-semibold py-4 rounded-xl hover:bg-white/5 transition-colors text-sm"
              >
                View Escrow Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FourthProcessDesktop;
