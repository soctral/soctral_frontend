import React from 'react';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import btc from '../../assets/btc.svg';
import eth from '../../assets/eth.svg';
import usdt from '../../assets/usdt.svg';
import sol from '../../assets/sol.svg';
import bnb from '../../assets/bnb.svg';
import trx from '../../assets/trx.svg';
import usdc from '../../assets/usdc.svg';
import { NETWORK_LABELS } from '../../services/escrowService';

const paymentIcons = {
  btc: btc,
  eth: eth,
  usdt: usdt,
  sol: sol,
  bnb: bnb,
  trx: trx,
  usdc: usdc,
  // Keep uppercase keys for backward compat
  BTC: btc,
  ETH: eth,
  USDT: usdt,
  SOL: sol,
  BNB: bnb,
  TRX: trx,
  USDC: usdc
};

const paymentLabels = {
  btc: 'BTC',
  eth: 'ETH',
  usdt: 'USDT',
  sol: 'SOL',
  bnb: 'BNB',
  trx: 'TRX',
  usdc: 'USDC',
  BTC: 'BTC',
  ETH: 'ETH',
  USDT: 'USDT',
  SOL: 'SOL',
  BNB: 'BNB',
  TRX: 'TRX',
  USDC: 'USDC'
};

const ThirdProcessMobile = ({ formData, onNext, onBack, isSubmitting, submitError }) => {
  
  const getDurationString = () => {
    if (!formData.startDate || !formData.endDate) return '';
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  return (
    <div className="fixed inset-0 bg-[#0D0D0D] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        <button onClick={onBack} disabled={isSubmitting} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white text-lg font-bold">Create Escrow Deal</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Progress Tracker */}
        <div className="px-10 py-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-4 right-4 top-2.5 h-[2px] bg-white/10 -z-10"></div>
            {/* The line connecting Details and Review should be colored partially */}
            <div className="absolute left-4 w-1/2 top-2.5 h-[2px] bg-primary -z-10"></div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-white text-[10px] font-medium">Details</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#181818] border-4 border-primary flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              </div>
              <span className="text-white text-[10px] font-medium">Review</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#0D0D0D] border-2 border-white/20"></div>
              <span className="text-gray-500 text-[10px] font-medium">Confirm</span>
            </div>
          </div>
        </div>

        <div className="px-5">
          <h2 className="text-white text-base font-bold mb-4">Deal Summary</h2>
          
          <div className="bg-[#181818] rounded-xl border border-white/5 p-5">
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3">Deal Name</span>
                <span className="text-white text-sm font-medium flex-1 text-left sm:text-right">{formData.dealName}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3 pt-1">Description</span>
                <span className="text-white text-sm flex-1 text-left sm:text-right leading-relaxed">{formData.description}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3">Deal Partner</span>
                <div className="flex items-center gap-2 flex-1 sm:justify-end">
                  {formData.partnerAvatar ? (
                    <img src={formData.partnerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : null}
                  <span className="text-white text-sm font-medium">{formData.dealPartner}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3">Initiator <span className="text-gray-600 text-[10px]">(pays)</span></span>
                <span className="text-white text-sm font-medium flex-1 text-left sm:text-right">
                  {formData.initiatorRole === 'creator' ? 'You' : formData.dealPartner}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3">Receiver <span className="text-gray-600 text-[10px]">(gets paid)</span></span>
                <span className="text-white text-sm font-medium flex-1 text-left sm:text-right">
                  {formData.receiverRole === 'creator' ? 'You' : formData.dealPartner}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3">Amount (USD)</span>
                <span className="text-white text-sm font-medium flex-1 text-left sm:text-right">${formData.amount}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3">Payment Method</span>
                <div className="flex items-center sm:justify-end gap-1.5 flex-1">
                  {paymentIcons[formData.paymentMethod] && (
                    <img src={paymentIcons[formData.paymentMethod]} alt={formData.paymentMethod} className="w-4 h-4 object-contain" />
                  )}
                  <span className="text-white text-sm font-medium">{paymentLabels[formData.paymentMethod] || formData.paymentMethod?.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3">Network</span>
                <span className="text-white text-sm font-medium flex-1 text-left sm:text-right">{NETWORK_LABELS[formData.network] || formData.network}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 pb-4 border-b border-white/5">
                <span className="text-gray-500 text-xs w-1/3">Deal Duration</span>
                <span className="text-white text-sm font-medium flex-1 text-left sm:text-right">{getDurationString()}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1 sm:gap-4">
                <span className="text-gray-500 text-xs w-1/3 pt-1">Upload Deal Image(s)</span>
                <div className="flex flex-wrap sm:justify-end gap-2 flex-1 mt-1 sm:mt-0">
                  {formData.dealImages.length > 0 ? (
                    formData.dealImages.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                        <img src={img.uploadedUrl || img.url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-600 text-sm italic">No images uploaded</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0D0D0D] border-t border-white/5 shrink-0">
        <button 
          onClick={onNext}
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-full transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Deal...
            </>
          ) : (
            'Confirm & Create Deal'
          )}
        </button>
      </div>
    </div>
  );
};

export default ThirdProcessMobile;
