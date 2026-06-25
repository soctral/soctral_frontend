import React from 'react';
import { ArrowLeft, Check, X, Loader2, AlertCircle } from 'lucide-react';
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

const ThirdProcessDesktop = ({ formData, onNext, onBack, onClose, isSubmitting, submitError }) => {
  
  const getDurationString = () => {
    if (!formData.startDate || !formData.endDate) return '';
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-xl bg-[#0D0D0D] rounded-2xl pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={onBack} disabled={isSubmitting} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-white text-lg font-bold">Create Escrow Deal</h1>
            </div>
            <button onClick={onClose} disabled={isSubmitting} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
            {/* Progress Tracker */}
            <div className="py-6 px-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-4 right-4 top-2.5 h-[2px] bg-white/10 -z-10"></div>
                <div className="absolute left-4 w-1/2 top-2.5 h-[2px] bg-primary -z-10"></div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">Details</span>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#181818] border-4 border-primary flex items-center justify-center relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  </div>
                  <span className="text-white text-xs font-medium">Review</span>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#0D0D0D] border-2 border-white/20"></div>
                  <span className="text-gray-500 text-xs font-medium">Confirm</span>
                </div>
              </div>
            </div>

            <div className="pb-6">
              <h2 className="text-white text-base font-bold mb-4">Deal Summary</h2>
              
              <div className="bg-[#181818] rounded-xl border border-white/5 p-6">
                <div className="space-y-6">
                  
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-500 text-sm">Deal Name</span>
                    <span className="text-white text-sm font-medium text-right">{formData.dealName}</span>
                  </div>

                  <div className="flex justify-between items-start pb-4 border-b border-white/5">
                    <span className="text-gray-500 text-sm w-1/3 pt-1">Description</span>
                    <span className="text-white text-sm text-right leading-relaxed flex-1">{formData.description}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-500 text-sm">Deal Partner</span>
                    <div className="flex items-center gap-2">
                      {formData.partnerAvatar ? (
                        <img src={formData.partnerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : null}
                      <span className="text-white text-sm font-medium text-right">{formData.dealPartner}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-500 text-sm">Amount (USD)</span>
                    <span className="text-white text-sm font-medium text-right">${formData.amount}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-500 text-sm">Payment Method</span>
                    <div className="flex items-center justify-end gap-2">
                      {paymentIcons[formData.paymentMethod] && (
                        <img src={paymentIcons[formData.paymentMethod]} alt={formData.paymentMethod} className="w-5 h-5 object-contain" />
                      )}
                      <span className="text-white text-sm font-medium">{paymentLabels[formData.paymentMethod] || formData.paymentMethod?.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-500 text-sm">Network</span>
                    <span className="text-white text-sm font-medium text-right">{NETWORK_LABELS[formData.network] || formData.network}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-500 text-sm">Deal Duration</span>
                    <span className="text-white text-sm font-medium text-right">{getDurationString()}</span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 text-sm pt-1">Upload Deal Image(s)</span>
                    <div className="flex flex-wrap justify-end gap-3 flex-1">
                      {formData.dealImages.length > 0 ? (
                        formData.dealImages.map((img, idx) => (
                          <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                            <img src={img.url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
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
          <div className="p-6 border-t border-white/5 shrink-0 bg-[#0D0D0D]">
            <button 
              onClick={onNext}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      </div>
    </>
  );
};

export default ThirdProcessDesktop;
