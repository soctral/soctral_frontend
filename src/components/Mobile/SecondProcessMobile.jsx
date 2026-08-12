import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Info, Search, DollarSign, Calendar, Plus, Minus, X, Loader2, ChevronDown, Check, UserCircle2 } from 'lucide-react';
import btc from '../../assets/btc.svg';
import eth from '../../assets/eth.svg';
import usdt from '../../assets/usdt.svg';
import sol from '../../assets/sol.svg';
import bnb from '../../assets/bnb.svg';
import trx from '../../assets/trx.svg';
import usdc from '../../assets/usdc.svg';
import escrowService, { PAYMENT_NETWORK_MAP } from '../../services/escrowService';
import { useUser } from '../../context/userContext';

const ALL_PAYMENT_METHODS = [
  { id: 'btc', icon: btc, label: 'BTC' },
  { id: 'eth', icon: eth, label: 'ETH' },
  { id: 'usdt', icon: usdt, label: 'USDT' },
  { id: 'sol', icon: sol, label: 'SOL' },
  { id: 'bnb', icon: bnb, label: 'BNB' },
  { id: 'trx', icon: trx, label: 'TRX' },
  { id: 'usdc', icon: usdc, label: 'USDC' },
];

const ICON_MAP = { btc, eth, usdt, sol, bnb, trx, usdc };

const NETWORK_DISPLAY_MAP = {
  ethereum: 'Ethereum (ERC20)',
  base: 'Base',
  bitcoin: 'Bitcoin',
  solana: 'Solana',
  binance: 'BNB Smart Chain',
  bsc: 'BNB Smart Chain',
  bnb: 'BNB Smart Chain',
  tron: 'Tron (TRC20)',
  trx: 'Tron (TRC20)',
};

const STATIC_TOKEN_NETWORKS = {
  btc: ['bitcoin'],
  eth: ['ethereum', 'base'],
  usdt: ['ethereum', 'base', 'tron', 'solana'],
  sol: ['solana'],
  bnb: ['binance'],
  trx: ['tron'],
  usdc: ['ethereum', 'base', 'solana'],
};

const TOKEN_TO_CURRENCY_KEY = {
  btc: ['btc', 'bitcoin'],
  eth: ['eth', 'ethereum'],
  usdt: ['usdt', 'tether'],
  usdc: ['usdc'],
  sol: ['sol', 'solana'],
  bnb: ['bnb', 'binance'],
  trx: ['trx', 'tron'],
};

function buildPaymentMethods(currenciesData) {
  if (!currenciesData) return ALL_PAYMENT_METHODS;
  const tokenSymbolMap = {
    bitcoin: 'btc', ethereum: 'eth', tether: 'usdt',
    solana: 'sol', binance: 'bnb', tron: 'trx', usdc: 'usdc',
  };
  const seen = new Set();
  const methods = [];
  Object.keys(currenciesData).forEach(key => {
    const id = tokenSymbolMap[key.toLowerCase()] || key.toLowerCase();
    if (!seen.has(id) && ICON_MAP[id]) {
      seen.add(id);
      methods.push({ id, icon: ICON_MAP[id], label: id.toUpperCase() });
    }
  });
  return methods.length > 0 ? methods : ALL_PAYMENT_METHODS;
}

function buildNetworkOptions(currenciesData, paymentMethodId) {
  const networkOptions = [];
  if (currenciesData && paymentMethodId) {
    const keys = TOKEN_TO_CURRENCY_KEY[paymentMethodId] || [];
    for (const key of keys) {
      const currencyData = currenciesData[key];
      if (currencyData?.networks) {
        Object.keys(currencyData.networks).forEach(netKey => {
          const label = NETWORK_DISPLAY_MAP[netKey.toLowerCase()] ||
            netKey.charAt(0).toUpperCase() + netKey.slice(1);
          const value = netKey.toLowerCase();
          if (!networkOptions.find(n => n.value === value)) {
            networkOptions.push({ value, label });
          }
        });
      }
    }
  }
  if (networkOptions.length === 0) {
    (STATIC_TOKEN_NETWORKS[paymentMethodId] || []).forEach(net => {
      networkOptions.push({ value: net, label: NETWORK_DISPLAY_MAP[net] || net });
    });
  }
  return networkOptions;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const SecondProcessMobile = ({ formData, onNext, onBack, walletData }) => {
  const [localData, setLocalData] = useState(formData);
  const currenciesData = walletData?.balances?.currencies;
  const paymentMethods = buildPaymentMethods(currenciesData);
  const networkOptions = buildNetworkOptions(currenciesData, localData.paymentMethod);
  const [errors, setErrors] = useState({});
  const todayString = new Date().toISOString().split('T')[0];
  const { user: userData } = useUser();
  const currentUserName = userData?.displayName || userData?.name || userData?.email || 'You';

  // --- Payment dropdown state ---
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const paymentDropdownRef = useRef(null);

  // --- Network dropdown state ---
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const networkDropdownRef = useRef(null);

  // --- Role dropdown state ---
  const [showInitiatorDropdown, setShowInitiatorDropdown] = useState(false);
  const initiatorDropdownRef = useRef(null);
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);
  const receiverDropdownRef = useRef(null);

  // --- User search state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // --- Image upload state ---
  const [uploadingImages, setUploadingImages] = useState({}); // { index: true }

  const handleChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    // Clear error when typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // --- User Search ---
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);

    // If user clears or the query is too short, reset
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Debounce the API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await escrowService.searchUsers(query);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error('User search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  const handleSelectPartner = (user) => {
    setLocalData(prev => ({
      ...prev,
      dealPartner: user.displayName,
      partnerId: user._id,
      partnerAvatar: user.avatarUrl || '',
    }));
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    if (errors.dealPartner) {
      setErrors(prev => ({ ...prev, dealPartner: null }));
    }
  };

  const handleClearPartner = () => {
    setLocalData(prev => ({
      ...prev,
      dealPartner: '',
      partnerId: '',
      partnerAvatar: '',
      initiatorRole: 'creator',
      receiverRole: 'partner',
    }));
    setSearchQuery('');
  };

  // --- Initiator / Receiver Role Handlers ---
  const handleInitiatorRoleChange = (role) => {
    setLocalData(prev => ({
      ...prev,
      initiatorRole: role,
      receiverRole: role === 'creator' ? 'partner' : 'creator',
    }));
  };

  const handleReceiverRoleChange = (role) => {
    setLocalData(prev => ({
      ...prev,
      receiverRole: role,
      initiatorRole: role === 'creator' ? 'partner' : 'creator',
    }));
    setShowReceiverDropdown(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target)) {
        setShowPaymentDropdown(false);
      }
      if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target)) {
        setShowNetworkDropdown(false);
      }
      if (initiatorDropdownRef.current && !initiatorDropdownRef.current.contains(event.target)) {
        setShowInitiatorDropdown(false);
      }
      if (receiverDropdownRef.current && !receiverDropdownRef.current.contains(event.target)) {
        setShowReceiverDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // --- Image Upload ---
  const handleImageUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Reset the input so same file can be re-selected
    e.target.value = '';

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, dealImages: 'Only JPEG, PNG, GIF, WebP allowed' }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, dealImages: 'File exceeds 5MB limit' }));
      return;
    }
    if (localData.dealImages.length >= MAX_IMAGES) {
      setErrors(prev => ({ ...prev, dealImages: `Max ${MAX_IMAGES} images allowed` }));
      return;
    }

    // Clear image errors
    if (errors.dealImages) {
      setErrors(prev => ({ ...prev, dealImages: null }));
    }

    // Add local preview immediately
    const localUrl = URL.createObjectURL(file);
    const newIndex = localData.dealImages.length;
    const newImage = { file, url: localUrl, uploadedUrl: null, uploading: true };

    const updatedImages = [...localData.dealImages, newImage];
    const updatedUploadedUrls = [...(localData.uploadedImageUrls || [])];

    handleChange('dealImages', updatedImages);
    setUploadingImages(prev => ({ ...prev, [newIndex]: true }));

    // Upload to API
    try {
      const urls = await escrowService.uploadImages([file]);
      if (urls && urls.length > 0) {
        // Update the image with the CDN URL
        setLocalData(prev => {
          const imgs = [...prev.dealImages];
          if (imgs[newIndex]) {
            imgs[newIndex] = { ...imgs[newIndex], uploadedUrl: urls[0], uploading: false };
          }
          const newUploadedUrls = [...(prev.uploadedImageUrls || [])];
          newUploadedUrls.push(urls[0]);
          return { ...prev, dealImages: imgs, uploadedImageUrls: newUploadedUrls };
        });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      // Remove the failed image
      setLocalData(prev => {
        const imgs = [...prev.dealImages];
        imgs.splice(newIndex, 1);
        return { ...prev, dealImages: imgs };
      });
      setErrors(prev => ({ ...prev, dealImages: err.message || 'Upload failed' }));
    } finally {
      setUploadingImages(prev => {
        const copy = { ...prev };
        delete copy[newIndex];
        return copy;
      });
    }
  };

  const removeImage = (index) => {
    const removedImage = localData.dealImages[index];
    const newImages = [...localData.dealImages];
    newImages.splice(index, 1);

    // Also remove from uploadedImageUrls
    let newUploadedUrls = [...(localData.uploadedImageUrls || [])];
    if (removedImage?.uploadedUrl) {
      newUploadedUrls = newUploadedUrls.filter(u => u !== removedImage.uploadedUrl);
    }

    setLocalData(prev => ({
      ...prev,
      dealImages: newImages,
      uploadedImageUrls: newUploadedUrls,
    }));
  };

  // --- Payment Method ---
  const handlePaymentSelect = (methodId) => {
    const nets = buildNetworkOptions(currenciesData, methodId);
    setLocalData(prev => ({
      ...prev,
      paymentMethod: methodId,
      network: nets[0]?.value || PAYMENT_NETWORK_MAP[methodId] || 'ethereum',
    }));
  };

  // --- Validation ---
  const validate = () => {
    const newErrors = {};
    if (!localData.dealName.trim()) newErrors.dealName = 'Deal Name is required';
    if (!localData.description.trim()) newErrors.description = 'Description is required';
    if (!localData.partnerId) newErrors.dealPartner = 'Please select a deal partner from the search results';
    if (!localData.network) newErrors.network = 'Network is required';
    
    if (!localData.startDate) {
      newErrors.startDate = 'Start Date is required';
    } else {
      const start = new Date(localData.startDate);
      const today = new Date(todayString);
      if (start < today) {
        newErrors.startDate = 'Start Date cannot be in the past';
      }
    }
    
    if (!localData.endDate) {
      newErrors.endDate = 'End Date is required';
    } else {
      const end = new Date(localData.endDate);
      const today = new Date(todayString);
      if (end < today) {
        newErrors.endDate = 'End Date cannot be in the past';
      }
    }
    
    if (localData.startDate && localData.endDate && new Date(localData.startDate) > new Date(localData.endDate)) {
      newErrors.endDate = 'End Date must be after Start Date';
    }

    const uploadedCount = (localData.dealImages || []).filter(img => img.uploadedUrl).length;
    if (uploadedCount === 0) {
      newErrors.dealImages = 'At least one image is required';
    }
    const anyUploading = localData.dealImages.some(img => img.uploading);
    if (anyUploading) {
      newErrors.dealImages = 'Please wait for images to finish uploading';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onNext(localData);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0D0D0D] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white text-lg font-bold">Create Escrow Deal</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Progress Tracker */}
        <div className="px-10 py-6">
          <div className="flex items-center justify-between relative z-0">
            {/* Progress Line */}
            <div className="absolute left-[10px] right-[10px] top-[10px] h-[2px] bg-white/10 -z-10">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: '0%' }}></div> {/* Width becomes 50% on Review, 100% on Confirm */}
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#181818] border-[3px] border-primary flex items-center justify-center relative z-10">
                <Check className="w-3 h-3 text-white" strokeWidth={4} />
              </div>
              <span className="text-white text-[10px] font-medium">Details</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#0D0D0D] border-2 border-white/20 relative z-10"></div>
              <span className="text-gray-500 text-[10px] font-medium">Review</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#0D0D0D] border-2 border-white/20 relative z-10"></div>
              <span className="text-gray-500 text-[10px] font-medium">Confirm</span>
            </div>
          </div>
        </div>

        <div className="px-5">
          <h2 className="text-white text-base font-bold mb-4">Deal Information</h2>
          
          <div className="bg-[#181818] rounded-xl p-4 border border-white/5 mb-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-gray-400 text-xs leading-relaxed">
                This transaction is protected by Soctral Escrow. Funds are held securely until both parties confirm the terms of the trade have been met. Nothing moves until everyone agrees.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-yellow-400 text-[10px] font-semibold mb-1">Important — Please read before creating</p>
              <ul className="space-y-0.5 text-gray-400 text-[10px] list-disc list-inside">
                <li>Provide accurate transaction terms, descriptions, and proof (photos / receipts).</li>
                <li>Double-check all external links, addresses, and relevant information.</li>
                <li>Missing or incorrect details may result in loss of funds or unfavourable dispute resolution.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-5">
            {/* Deal Name */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Deal Name</label>
              <input 
                type="text" 
                placeholder="Enter Deal Name"
                value={localData.dealName}
                onChange={(e) => handleChange('dealName', e.target.value)}
                className={`w-full bg-[#181818] border ${errors.dealName ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary`}
              />
              {errors.dealName && <p className="text-red-500 text-[10px] mt-1">{errors.dealName}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Description</label>
              <div className="relative">
                <textarea 
                  placeholder="Write a Description"
                  rows="4"
                  maxLength={100}
                  value={localData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`w-full bg-[#181818] border ${errors.description ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none`}
                ></textarea>
                <span className="absolute bottom-3 right-4 text-gray-500 text-[10px]">
                  {localData.description.length}/100
                </span>
              </div>
              {errors.description && <p className="text-red-500 text-[10px] mt-1">{errors.description}</p>}
            </div>

            {/* Deal Partner — User Search */}
            <div ref={searchRef}>
              <label className="block text-gray-400 text-xs mb-2">Select Deal Partner</label>

              {/* Show selected partner chip or search input */}
              {localData.partnerId ? (
                <div className="flex items-center gap-3 bg-[#181818] border border-primary rounded-xl px-4 py-3">
                  {localData.partnerAvatar ? (
                    <img src={localData.partnerAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-white text-xs font-bold">
                      {localData.dealPartner?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-white text-sm font-medium flex-1">{localData.dealPartner}</span>
                  <button onClick={handleClearPartner} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search User by name or email"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    className={`w-full bg-[#181818] border ${errors.dealPartner ? 'border-red-500' : 'border-white/10'} rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary`}
                  />

                  {/* Search Results Dropdown */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto shadow-xl">
                      {searchResults.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => handleSelectPartner(user)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-white text-xs font-bold">
                              {user.displayName?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{user.displayName}</p>
                            <p className="text-gray-500 text-xs truncate">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.dealPartner && <p className="text-red-500 text-[10px] mt-1">{errors.dealPartner}</p>}
            </div>

            {/* Initiator & Receiver Role Fields */}
            <div className="space-y-5">
              {/* Initiator Dropdown */}
              <div ref={initiatorDropdownRef} className="relative">
                <label className="block text-gray-400 text-xs mb-2">Initiator <span className="text-gray-600 text-[10px]">(who pays)</span></label>
                <button
                  type="button"
                  onClick={() => setShowInitiatorDropdown(prev => !prev)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {localData.initiatorRole === 'creator' ? (
                      <>
                        {userData?.avatarUrl ? (
                          <img src={userData.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <UserCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-white text-sm font-medium truncate">{currentUserName} (You)</span>
                      </>
                    ) : (
                      <>
                        {localData.partnerAvatar ? (
                          <img src={localData.partnerAvatar} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {localData.dealPartner ? localData.dealPartner.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <span className="text-white text-sm font-medium truncate">{localData.dealPartner || 'Select Partner'}</span>
                      </>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showInitiatorDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showInitiatorDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                    <button
                      type="button"
                      onClick={() => { handleInitiatorRoleChange('creator'); setShowInitiatorDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${localData.initiatorRole === 'creator' ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'}`}
                    >
                      {userData?.avatarUrl ? (
                        <img src={userData.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <UserCircle2 className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-white text-sm font-medium truncate">{currentUserName} (You)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleInitiatorRoleChange('partner'); setShowInitiatorDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${localData.initiatorRole === 'partner' ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'}`}
                    >
                      {localData.partnerAvatar ? (
                        <img src={localData.partnerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-white text-[10px] font-bold">
                          {localData.dealPartner ? localData.dealPartner.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <span className="text-white text-sm font-medium truncate">{localData.dealPartner || 'Select Partner'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Receiver Dropdown */}
              <div ref={receiverDropdownRef} className="relative">
                <label className="block text-gray-400 text-xs mb-2">Receiver <span className="text-gray-600 text-[10px]">(gets paid)</span></label>
                <button
                  type="button"
                  onClick={() => setShowReceiverDropdown(prev => !prev)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {localData.receiverRole === 'creator' ? (
                      <>
                        {userData?.avatarUrl ? (
                          <img src={userData.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <UserCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-white text-sm font-medium truncate">{currentUserName} (You)</span>
                      </>
                    ) : (
                      <>
                        {localData.partnerAvatar ? (
                          <img src={localData.partnerAvatar} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {localData.dealPartner ? localData.dealPartner.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <span className="text-white text-sm font-medium truncate">{localData.dealPartner || 'Select Partner'}</span>
                      </>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showReceiverDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showReceiverDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                    <button
                      type="button"
                      onClick={() => { handleReceiverRoleChange('creator'); setShowReceiverDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${localData.receiverRole === 'creator' ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'}`}
                    >
                      {userData?.avatarUrl ? (
                        <img src={userData.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <UserCircle2 className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-white text-sm font-medium truncate">{currentUserName} (You)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleReceiverRoleChange('partner'); setShowReceiverDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${localData.receiverRole === 'partner' ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'}`}
                    >
                      {localData.partnerAvatar ? (
                        <img src={localData.partnerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-white text-[10px] font-bold">
                          {localData.dealPartner ? localData.dealPartner.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <span className="text-white text-sm font-medium truncate">{localData.dealPartner || 'Select Partner'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Deal Amount */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Set Deal Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </div>
                <input 
                  type="number" 
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter Amount"
                  value={localData.amount}
                  onChange={(e) => {
                    if (e.target.value === '' || Number(e.target.value) >= 0) {
                      handleChange('amount', e.target.value);
                    }
                  }}
                  className={`w-full bg-[#181818] border ${errors.amount ? 'border-red-500' : 'border-white/10'} rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary`}
                />
              </div>
              {errors.amount && <p className="text-red-500 text-[10px] mt-1">{errors.amount}</p>}
            </div>

            {/* Payment Method Dropdown */}
            <div ref={paymentDropdownRef} className="relative">
              <label className="block text-gray-400 text-xs mb-2">Select Payment Method</label>
              <button
                type="button"
                onClick={() => setShowPaymentDropdown(prev => !prev)}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={paymentMethods.find(m => m.id === localData.paymentMethod)?.icon}
                    alt={localData.paymentMethod}
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-white text-sm font-medium">
                    {paymentMethods.find(m => m.id === localData.paymentMethod)?.label || 'Select Token'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showPaymentDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showPaymentDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-10 max-h-56 overflow-y-auto shadow-xl">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        handlePaymentSelect(method.id);
                        setShowPaymentDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                        localData.paymentMethod === method.id
                          ? 'bg-primary/10 border-l-2 border-primary'
                          : 'hover:bg-white/5 border-l-2 border-transparent'
                      }`}
                    >
                      <img src={method.icon} alt={method.label} className="w-5 h-5 object-contain" />
                      <span className={`text-sm font-medium ${
                        localData.paymentMethod === method.id ? 'text-white' : 'text-gray-300'
                      }`}>{method.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Network Dropdown */}
            <div ref={networkDropdownRef} className="relative">
              <label className="block text-gray-400 text-xs mb-2">Select Network</label>
              <button
                type="button"
                onClick={() => setShowNetworkDropdown(prev => !prev)}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-white text-sm font-medium">
                    {NETWORK_DISPLAY_MAP[localData.network] || localData.network || 'Select Network'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showNetworkDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showNetworkDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-10 max-h-56 overflow-y-auto shadow-xl">
                  {networkOptions.map((net) => (
                    <button
                      key={net.value}
                      onClick={() => {
                        handleChange('network', net.value);
                        setShowNetworkDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                        localData.network === net.value
                          ? 'bg-primary/10 border-l-2 border-primary'
                          : 'hover:bg-white/5 border-l-2 border-transparent'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        localData.network === net.value ? 'text-white' : 'text-gray-300'
                      }`}>{net.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.network && <p className="text-red-500 text-[10px] mt-1">{errors.network}</p>}
            </div>

            {/* Deal Duration */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Select Deal Duration</label>
              <div className="space-y-3">
                <div className={`bg-[#181818] border ${errors.startDate ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 flex justify-between items-center relative cursor-pointer overflow-hidden`}>
                  <div className="flex-1 pointer-events-none">
                    <span className="block text-gray-500 text-[10px] mb-1">Start Date</span>
                    <span className={`block text-sm ${localData.startDate ? 'text-white' : 'text-gray-500'}`}>
                      {localData.startDate || 'YYYY-MM-DD'}
                    </span>
                  </div>
                  <Calendar className="w-4 h-4 text-gray-400 pointer-events-none" />
                  <input 
                    type="date" 
                    min={todayString}
                    value={localData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0 p-0"
                  />
                </div>
                {errors.startDate && <p className="text-red-500 text-[10px] mt-1">{errors.startDate}</p>}

                <div className={`bg-[#181818] border ${errors.endDate ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 flex justify-between items-center relative cursor-pointer overflow-hidden`}>
                  <div className="flex-1 pointer-events-none">
                    <span className="block text-gray-500 text-[10px] mb-1">End Date</span>
                    <span className={`block text-sm ${localData.endDate ? 'text-white' : 'text-gray-500'}`}>
                      {localData.endDate || 'YYYY-MM-DD'}
                    </span>
                  </div>
                  <Calendar className="w-4 h-4 text-gray-400 pointer-events-none" />
                  <input 
                    type="date" 
                    min={localData.startDate || todayString}
                    value={localData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0 p-0"
                  />
                </div>
                {errors.endDate && <p className="text-red-500 text-[10px] mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {/* Acceptance Timer */}
            <div>
              <label className="block text-gray-400 text-xs mb-1">Acceptance Window <span className="text-gray-600 text-[10px]">(time partner has to accept)</span></label>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#181818] border border-white/10 rounded-xl px-3 py-3 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="167"
                    value={localData.acceptanceDurationHours ?? 1}
                    onChange={(e) => handleChange('acceptanceDurationHours', Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-transparent text-white text-sm w-full focus:outline-none"
                  />
                  <span className="text-gray-500 text-xs shrink-0">hrs</span>
                </div>
                <div className="bg-[#181818] border border-white/10 rounded-xl px-3 py-3 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={localData.acceptanceDurationMinutes ?? 0}
                    onChange={(e) => handleChange('acceptanceDurationMinutes', Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="bg-transparent text-white text-sm w-full focus:outline-none"
                  />
                  <span className="text-gray-500 text-xs shrink-0">min</span>
                </div>
              </div>
            </div>

            {/* Upload Images */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Upload Deal Image(s) <span className="text-red-400 text-[10px]">*required</span> <span className="text-gray-600">({localData.dealImages.length}/{MAX_IMAGES})</span></label>
              <div className="flex flex-wrap gap-3">
                {localData.dealImages.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10">
                    <img src={img.uploadedUrl || img.url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                    {/* Upload loading overlay */}
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    )}
                    {!img.uploading && (
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                ))}
                
                {localData.dealImages.length < MAX_IMAGES && (
                  <label className="w-24 h-24 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors bg-[#181818]">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-500 text-[10px]">Upload Image</span>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              {errors.dealImages && <p className="text-red-500 text-[10px] mt-1">{errors.dealImages}</p>}
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0D0D0D] border-t border-white/5 shrink-0">
        <button
          onClick={handleSubmit}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-full transition-colors text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SecondProcessMobile;
