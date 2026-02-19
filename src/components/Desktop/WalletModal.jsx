import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import WalletTransactionModal from '../../components/Desktop/WalletTransaction'; 
import authService from '../../services/authService';

const WalletSetupModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); 
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const handlePinChange = (value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    setError('');
  };

  const handleConfirmPinChange = (value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(numericValue);
    setError('');
  };

  const handleNext = () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setStep(2);
  };

  const handleConfirm = async () => {
    if (confirmPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Call the API to create transaction PIN
      const response = await authService.createTransactionPin(pin);
      
      if (response.status) {
        
        // Reset state
        setPin('');
        setConfirmPin('');
        setStep(1);
        setError('');
        
        // Close the wallet setup modal
        onClose();
        
        // Note: The wallet transaction modal should be opened from parent component
        // after checking if PIN exists, not automatically here
      } else {
        throw new Error(response.message || 'Failed to create transaction PIN');
      }
    } catch (err) {
      console.error('❌ Error creating transaction PIN:', err);
      setError(err.message || 'Failed to setup wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setConfirmPin('');
    setError('');
  };

  const resetModal = () => {
    setStep(1);
    setPin('');
    setConfirmPin('');
    setError('');
    setShowPin(false);
    setShowConfirmPin(false);
    onClose();
  };

  const handleTransactionModalClose = () => {
    setShowTransactionModal(false);
    onClose();
  };

  const handleBackToSetup = () => {
    setShowTransactionModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {!showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-[rgba(0,0,0,0.7)] rounded-xl p-6 h-full lg:h-[25rem] max-w-xl lg:mx-4">
            
            <div className='flex w-full items-center justify-between mb-5'>
              <div className="flex items-center justify-center">
                <h1 className="text-xl w-full text-center font-bold text-white">Wallet Setup</h1>
              </div>

              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
                disabled={isLoading}
              >
                <X size={22} />
              </button>
            </div>

            {/* Description */}
            <div className="text-left mb-6">
              <p className="text-gray-400 text-sm">
                To ensure the security of your transactions, create a 4-digit unique PIN for your wallet. 
                This PIN will be required for every transaction, giving you an extra layer of protection on Soctral.
              </p>
            </div>

            {/* Step 1: Enter PIN */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-md font-semibold text-white mb-4">
                    Enter PIN
                  </label>
                  <div className="flex justify-center space-x-2 mb-4">
                    {[...Array(4)].map((_, index) => (
                      <input
                        key={index}
                        type={showPin ? 'text' : 'tel'}
                        maxLength={1}
                        value={pin[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const newPin = pin.split('');
                          newPin[index] = value;
                          const updatedPin = newPin.join('').slice(0, 4);
                          handlePinChange(updatedPin);
                          
                          if (value && index < 3) {
                            const nextInput = e.target.parentElement.children[index + 1];
                            if (nextInput) nextInput.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                          handlePinChange(pastedText);
                          
                          const targetIndex = Math.min(pastedText.length - 1, 3);
                          setTimeout(() => {
                            const targetInput = e.target.parentElement.children[targetIndex];
                            if (targetInput) targetInput.focus();
                          }, 0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !pin[index] && index > 0) {
                            const prevInput = e.target.parentElement.children[index - 1];
                            if (prevInput) prevInput.focus();
                          }
                        }}
                        className="w-12 h-12 text-center text-white text-xl font-bold bg-transparent border-b-2 border-gray-600 focus:border-primary focus:outline-none"
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-gray-400 hover:text-white text-sm transition-colors rounded-full px-4 py-2 hover:bg-gray-700/30"
                    >
                      {showPin ? (
                        <>
                          <EyeOff size={16} className="inline mr-2" />
                          Hide PIN
                        </>
                      ) : (
                        <>
                          <Eye size={16} className="inline mr-2" />
                          Show PIN
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    onClick={handleNext}
                    className={`w-full py-3 px-6 rounded-full text-white font-medium transition-all ${
                      isLoading || pin.length !== 4
                        ? 'bg-primary/50 cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary hover:scale-105'
                    }`}
                    disabled={isLoading || pin.length !== 4}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Confirm PIN */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="mb-6 text-left">
                  <h1 className="text-lg font-bold text-white">
                    Confirm PIN
                  </h1>
                </div>

                <div className="mb-4">
                  <div className="flex justify-center space-x-2 mb-4">
                    {[...Array(4)].map((_, index) => (
                      <input
                        key={index}
                        type={showConfirmPin ? 'text' : 'tel'}
                        maxLength={1}
                        value={confirmPin[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const newPin = confirmPin.split('');
                          newPin[index] = value;
                          const updatedPin = newPin.join('').slice(0, 4);
                          handleConfirmPinChange(updatedPin);
                          
                          if (value && index < 3) {
                            const nextInput = e.target.parentElement.children[index + 1];
                            if (nextInput) nextInput.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                          handleConfirmPinChange(pastedText);
                          
                          const targetIndex = Math.min(pastedText.length - 1, 3);
                          setTimeout(() => {
                            const targetInput = e.target.parentElement.children[targetIndex];
                            if (targetInput) targetInput.focus();
                          }, 0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !confirmPin[index] && index > 0) {
                            const prevInput = e.target.parentElement.children[index - 1];
                            if (prevInput) prevInput.focus();
                          }
                        }}
                        className="w-12 h-12 text-center text-white text-xl font-bold bg-transparent border-b-2 border-gray-600 focus:border-primary focus:outline-none"
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="text-gray-400 hover:text-white text-sm transition-colors rounded-full px-4 py-2 hover:bg-gray-700/30"
                    >
                      {showConfirmPin ? (
                        <>
                          <EyeOff size={16} className="inline mr-2" />
                          Hide PIN
                        </>
                      ) : (
                        <>
                          <Eye size={16} className="inline mr-2" />
                          Show PIN
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                {isLoading && (
                  <div className="mb-4">
                    <p className="text-green-400 text-sm text-center">Setting up your wallet...</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-center">
                    <button
                      onClick={handleConfirm}
                      className={`w-full py-3 px-6 rounded-full text-white font-medium transition-all ${
                        isLoading || confirmPin.length !== 4
                          ? 'bg-primary/50 cursor-not-allowed' 
                          : 'bg-primary hover:bg-primary hover:scale-105'
                      }`}
                      disabled={isLoading || confirmPin.length !== 4}
                    >
                      {isLoading ? 'Setting up wallet...' : 'Confirm'}
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleBack}
                      className="text-gray-400 hover:text-white text-sm transition-colors rounded-full px-4 py-2 hover:bg-gray-700/30"
                      disabled={isLoading}
                    >
                      ← Back to previous step
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <WalletTransactionModal 
        isOpen={showTransactionModal}
        onClose={handleTransactionModalClose}
        onBack={handleBackToSetup}
      />
    </>
  );
};

export default WalletSetupModal;