import React, { useState } from 'react';
import FirstProcessDesktop from './FirstProcessDesktop';
import SecondProcessDesktop from './SecondProcessDesktop';
import ThirdProcessDesktop from './ThirdProcessDesktop';
import FourthProcessDesktop from './FourthProcessDesktop';
import escrowService, { PAYMENT_NETWORK_MAP } from '../../services/escrowService';

const DesktopEscrowFlow = ({ onClose, onBuySell, onOpenChat, walletData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    dealName: '',
    description: '',
    dealPartner: '',
    partnerId: '',
    partnerAvatar: '',
    initiatorRole: 'creator',
    receiverRole: 'partner',
    amount: '',
    paymentMethod: 'btc',
    network: 'bitcoin',
    startDate: '',
    endDate: '',
    dealImages: [],
    uploadedImageUrls: [],
    acceptanceDurationHours: 1,
    acceptanceDurationMinutes: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [dealResponse, setDealResponse] = useState(null);

  const handleNext = (data) => {
    if (data) {
      setFormData(prev => ({ ...prev, ...data }));
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setSubmitError('');
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleOptionSelect = (option) => {
    if (option === 'buy_sell') {
      onClose(); // Close the escrow flow first
      if (onBuySell) onBuySell(); // Delegate to parent to open buy/sell
    } else if (option === 'create_escrow') {
      setCurrentStep(2);
    }
  };

  const handleCreateDeal = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const acceptanceDuration = (parseInt(formData.acceptanceDurationHours) || 0) * 60 + (parseInt(formData.acceptanceDurationMinutes) || 0);
      const response = await escrowService.createDeal({
        dealName: formData.dealName,
        description: formData.description,
        partnerId: formData.partnerId,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        network: formData.network,
        startDate: formData.startDate,
        endDate: formData.endDate,
        images: formData.uploadedImageUrls,
        fundingParty: formData.initiatorRole === 'creator' ? 'initiator' : 'receiver',
        acceptanceDuration: acceptanceDuration > 0 ? acceptanceDuration : 60,
      });

      setDealResponse(response);
      setCurrentStep(4);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create escrow deal';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {currentStep === 1 && (
        <FirstProcessDesktop 
          onClose={onClose} 
          onSelect={handleOptionSelect} 
        />
      )}
      {currentStep === 2 && (
        <SecondProcessDesktop
          formData={formData}
          onNext={handleNext}
          onBack={handleBack}
          onClose={onClose}
          walletData={walletData}
        />
      )}
      {currentStep === 3 && (
        <ThirdProcessDesktop 
          formData={formData} 
          onNext={handleCreateDeal} 
          onBack={handleBack} 
          onClose={onClose}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
      {currentStep === 4 && (
        <FourthProcessDesktop 
          formData={formData}
          dealResponse={dealResponse}
          onClose={onClose} 
          onOpenChat={onOpenChat}
        />
      )}
    </>
  );
};

export default DesktopEscrowFlow;
