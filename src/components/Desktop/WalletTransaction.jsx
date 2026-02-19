import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ArrowLeft, Copy, Check, Scan } from 'lucide-react';
import QRCode from 'qrcode';
import btc from "../../assets/btc.svg";
import usdt from "../../assets/usdt.svg";
import eth from "../../assets/eth.svg";
import solana from "../../assets/sol.svg";
import bnb from "../../assets/bnb.svg";
import tron from "../../assets/trx.svg";
import usdc from "../../assets/usdc.svg";
import withdraw from "../../assets/Group1.svg";
import pay from "../../assets/Group2.svg";
import notice from "../../assets/notice.svg";
import alt from "../../assets/alt.svg";
import tick from "../../assets/tick.svg";
import authService from '../../services/authService';
import CryptoPriceChart from './CryptoPriceChart';
import base from "../../assets/base-logo.png";
import { fixWithdrawalPrecision, validateWithdrawalAmount } from '../../services/Withdrawalprecisionfix';


const WalletTransactionModal = ({ isOpen, onClose, onBack, walletData }) => {
  // 🔥 FIX: Use refs to store walletData to prevent re-renders
  const walletDataRef = React.useRef(walletData);
  const hasInitializedRef = React.useRef(false);

  // Keep ref updated with latest walletData (without triggering re-renders)
  React.useEffect(() => {
    walletDataRef.current = walletData;
  }, [walletData]);

  // Get dynamic assets from wallet data or use defaults
  const getDynamicAssets = () => {
    const currentWalletData = walletDataRef.current;
    if (!currentWalletData || !currentWalletData.balances || Object.keys(currentWalletData.balances).length === 0) {
      return [
        { name: "Bitcoin", abbreviation: "BTC", rate: "0.0", change: "+0.0%", symbol: "₿", balance: "0.0" },
        { name: "Ethereum", abbreviation: "ETH", rate: "0.0", change: "+0.0%", symbol: "Ξ", balance: "0.0" },
        { name: "Tether", abbreviation: "USDT", rate: "0.0", change: "+0.0%", symbol: "$", balance: "0.0" },
        { name: "Solana", abbreviation: "SOL", rate: "0.0", change: "+0.0%", symbol: "SOL", balance: "0.0" },
        { name: "USDCoin", abbreviation: "USDC", rate: "0.0", change: "+0.0%", symbol: "$", balance: "0.0" },
        { name: "Binance Coin", abbreviation: "BNB", rate: "0.0", change: "+0.0%", symbol: "BNB", balance: "0.0" },
        { name: "Tron", abbreviation: "TRX", rate: "0.0", change: "+0.0%", symbol: "TRX", balance: "0.0" },
      ];
    }

    const assets = [];
    
    // NEW STRUCTURE: Check for currencies object first
    const currenciesData = currentWalletData.balances?.currencies;
    
    const assetMapping = {
      // New structure keys
      btc: { name: "Bitcoin", abbreviation: "BTC", symbol: "₿" },
      eth: { name: "Ethereum", abbreviation: "ETH", symbol: "Ξ" },
      usdt: { name: "Tether", abbreviation: "USDT", symbol: "$" },
      sol: { name: "Solana", abbreviation: "SOL", symbol: "SOL" },
      usdc: { name: "USDCoin", abbreviation: "USDC", symbol: "USDC" },
      bnb: { name: "Binance Coin", abbreviation: "BNB", symbol: "BNB" },
      trx: { name: "Tron", abbreviation: "TRX", symbol: "TRX" },
      // Old structure keys (fallback)
      bitcoin: { name: "Bitcoin", abbreviation: "BTC", symbol: "₿" },
      ethereum: { name: "Ethereum", abbreviation: "ETH", symbol: "Ξ" },
      tether: { name: "Tether", abbreviation: "USDT", symbol: "$" },
      solana: { name: "Solana", abbreviation: "SOL", symbol: "SOL" },
      binance: { name: "Binance Coin", abbreviation: "BNB", symbol: "BNB" },
      tron: { name: "Tron", abbreviation: "TRX", symbol: "TRX" },
    };

    // NEW STRUCTURE: Process currencies with networks
    if (currenciesData && typeof currenciesData === 'object') {
      Object.entries(currenciesData).forEach(([key, currencyData]) => {
        const mapping = assetMapping[key.toLowerCase()];
        if (mapping && currencyData?.networks) {
          // Aggregate balances from all networks
          let totalBalance = 0;
          let priceUSD = 0;
          let changePercent = 0;

          Object.values(currencyData.networks).forEach(network => {
            totalBalance += parseFloat(network.balance || '0');
            if (!priceUSD && network.priceUSD) {
              priceUSD = parseFloat(network.priceUSD);
              changePercent = parseFloat(network.percentageChange24h || '0');
            }
          });

          assets.push({
            name: mapping.name,
            abbreviation: mapping.abbreviation,
            rate: priceUSD.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: priceUSD < 1 ? 6 : 2
            }),
            change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            symbol: mapping.symbol,
            balance: totalBalance.toFixed(6),
            priceUSD: priceUSD,
            changePercent: changePercent,
            currencyKey: key,
            networks: currencyData.networks // 🔥 ADD: Store network data for easy access
          });
        }
      });
    }

    // FALLBACK: Old structure - process balances directly
    if (assets.length === 0) {
      const balances = currentWalletData.balances;
      Object.entries(balances || {}).forEach(([key, data]) => {
        if (key === 'total' || key === 'portfolio' || key === 'currencies') return;

        const mapping = assetMapping[key.toLowerCase()];
        if (mapping && data && typeof data === 'object') {
          const priceUSD = parseFloat(data.priceUSD || '0');
          const changePercent = parseFloat(data.percentageChange24h || '0');
          const balance = data.balance || '0';

          assets.push({
            name: mapping.name,
            abbreviation: mapping.abbreviation,
            rate: priceUSD.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: priceUSD < 1 ? 6 : 2
            }),
            change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            symbol: mapping.symbol,
            balance: parseFloat(balance).toFixed(4),
            priceUSD: priceUSD,
            changePercent: changePercent,
            currencyKey: key
          });
        }
      });
    }

    // Sort by priority
    const priorityOrder = ['BTC', 'ETH', 'USDT', 'SOL', 'USDC', 'BNB', 'TRX'];
    assets.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.abbreviation);
      const bIndex = priorityOrder.indexOf(b.abbreviation);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return assets.length > 0 ? assets : [
      { name: "Bitcoin", abbreviation: "BTC", rate: "0.0", change: "+0.0%", symbol: "₿", balance: "0.0" },
      { name: "Ethereum", abbreviation: "ETH", rate: "0.0", change: "+0.0%", symbol: "Ξ", balance: "0.0" },
      { name: "Tether", abbreviation: "USDT", rate: "0.0", change: "+0.0%", symbol: "$", balance: "0.0" },
    ];
  };

  // Get dynamic wallet addresses from walletData
  const getDynamicWalletAddresses = () => {
    const currentWalletData = walletDataRef.current;
    if (!currentWalletData || !currentWalletData.addresses || Object.keys(currentWalletData.addresses).length === 0) {
      return {
        Bitcoin: {
          "Bitcoin Main Network": "",
          "Lightning Network": null
        },
        Ethereum: {
          "Ethereum Main Network": "",
          "Base Network": ""
        },
        Solana: {
          "Solana Network": ""
        },
        Tether: {
          "Ethereum Network": ""
        },
        USDCoin: {
          "Base Network": ""
        },
        "Binance Coin": {
          "BEP20 Network": ""
        },
        Tron: {
          "Tron Network": ""
        }
      };
    }

    const addresses = currentWalletData.addresses;

    return {
      Bitcoin: {
        "Bitcoin Main Network": addresses.bitcoin || "",
        "Lightning Network": null
      },
      Ethereum: {
        "Ethereum Main Network": addresses.ethereum || "",
        "Base Network": addresses.base || addresses.ethereum || ""
      },
      Solana: {
        "Solana Network": addresses.solana || ""
      },
      Tether: {
        "Ethereum Network": addresses.ethereum || ""
      },
      USDCoin: {
        "Base Network": addresses.base || addresses.ethereum || ""
      },
      "Binance Coin": {
        "BEP20 Network": addresses.binance || ""
      },
      Tron: {
        "Tron Network": addresses.tron || ""
      }
    };
  };

  const [assets, setAssets] = useState(getDynamicAssets());
  const [depositAddresses, setDepositAddresses] = useState(getDynamicWalletAddresses());
  const [currentModal, setCurrentModal] = useState('main');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [transactionType, setTransactionType] = useState(null);
  const [lightningAmount, setLightningAmount] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [usdEquivalent, setUsdEquivalent] = useState('0.00');
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [inputMode, setInputMode] = useState('usd'); // 🔥 CHANGED: Default to 'usd' mode (was 'token')
  const [withdrawalSuccessData, setWithdrawalSuccessData] = useState(null);

  // 🔥 NEW: Chart view state
  const [showChartView, setShowChartView] = useState(false);
  const [selectedChartAsset, setSelectedChartAsset] = useState(null);

  // 🔥 FIX: Initialize assets only ONCE when modal opens (not on every walletData change)
  useEffect(() => {
    if (isOpen && !hasInitializedRef.current) {
      console.log('📊 WalletTransactionModal: Initializing assets on modal open');
      setAssets(getDynamicAssets());
      setDepositAddresses(getDynamicWalletAddresses());
      hasInitializedRef.current = true;
    }

    // Reset initialization flag when modal closes
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [isOpen]);

  // Generate QR code when deposit address changes
  useEffect(() => {
    const generateQRCode = async () => {
      if (currentModal === 'depositStep1' && selectedAsset && selectedNetwork) {
        const depositAddress = depositAddresses[selectedAsset?.name]?.[selectedNetwork?.name];

        if (depositAddress && selectedNetwork?.name !== "Lightning Network") {
          try {
            const qrDataUrl = await QRCode.toDataURL(depositAddress, {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            setQrCodeDataUrl(qrDataUrl);
          } catch (error) {
            console.error('Error generating QR code:', error);
            setQrCodeDataUrl('');
          }
        }
      }
    };

    generateQRCode();
  }, [currentModal, selectedAsset, selectedNetwork, depositAddresses]);

  const cryptoImages = {
    Bitcoin: btc,
    BTC: btc,
    Ethereum: eth,
    ETH: eth,
    Base: base,
    BASE: base,
    Tether: usdt,
    USDT: usdt,
    Solana: solana,
    SOL: solana,
    "Binance Coin": bnb,
    BNB: bnb,
    Tron: tron,
    TRX: tron,
    USDCoin: usdc,
    USDC: usdc,
  };

  const networkConfigs = {
    Bitcoin: [
      {
        name: "Bitcoin Main Network",
        confirmations: "1 block confirmation/s",
        minDeposit: ">0.000006 BTC",
        arrival: "=10 min"
      },
      {
        name: "Lightning Network",
        confirmations: "Instant",
        minDeposit: ">0.00000001 BTC",
        arrival: "=1 sec"
      }
    ],
    Ethereum: [
      {
        name: "Ethereum Main Network",
        confirmations: "12 block confirmation/s",
        minDeposit: ">0.001 ETH",
        arrival: "=2 min"
      },
      {
        name: "Base Network",
        confirmations: "1 block confirmation/s",
        minDeposit: ">0.0001 ETH",
        arrival: "=30 sec"
      }
    ],
    Solana: [
      {
        name: "Solana Network",
        confirmations: "1 block confirmation/s",
        minDeposit: ">0.001 SOL",
        arrival: "=30 sec"
      }
    ],
    Tether: [
      {
        name: "Ethereum Network",
        confirmations: "12 block confirmation/s",
        minDeposit: ">1 USDT",
        arrival: "=2 min"
      }
    ],
    USDCoin: [
      {
        name: "Base Network",
        confirmations: "1 block confirmation/s",
        minDeposit: ">0.001 USDC",
        arrival: "=30 sec"
      }
    ],
    "Binance Coin": [
      {
        name: "BEP20 Network",
        confirmations: "15 block confirmation/s",
        minDeposit: ">0.001 BNB",
        arrival: "=1 min"
      }
    ],
    Tron: [
      {
        name: "Tron Network",
        confirmations: "19 block confirmation/s",
        minDeposit: ">1 TRX",
        arrival: "=1 min"
      }
    ]
  };

  const depositLimits = {
    Bitcoin: { min: "0.0001", max: "100000000000" },
    Ethereum: { min: "0.001", max: "100000000000" },
    Tether: { min: "1", max: "100000000000" },
    Solana: { min: "0.001", max: "100000000000" },
    USDCoin: { min: "0.001", max: "100000000000" },
    "Binance Coin": { min: "0.001", max: "100000000000" },
    Tron: { min: "1", max: "100000000000" }
  };

  const networkFees = {
    Bitcoin: {
      "Bitcoin Main Network": "0.0002",
      "Lightning Network": "0.0001"
    },
    Ethereum: {
      "Ethereum Main Network": "0.002",
      "Base Network": "0.0001"
    },
    Tether: {
      "Ethereum Network": "2"
    },
    Solana: {
      "Solana Network": "0.00001"
    },
    USDCoin: {
      "Base Network": "0.001"
    },
    "Binance Coin": {
      "BEP20 Network": "0.0005"
    },
    Tron: {
      "Tron Network": "1"
    }
  };

  // 🔥 REMOVED: Hardcoded exchange rates - now using live priceUSD from wallet data
  // const exchangeRates = { ... }

  const calculateUsdEquivalent = (amount, asset) => {
    // 🔥 FIX: Use actual priceUSD from selectedAsset instead of hardcoded rates
    const priceUSD = parseFloat(selectedAsset?.priceUSD || 0);
    return (parseFloat(amount || 0) * priceUSD).toFixed(2);
  };

  // 🔥 NEW: Calculate token amount from USD value
  const calculateTokenFromUsd = (usdAmount) => {
    const priceUSD = parseFloat(selectedAsset?.priceUSD || 0);
    if (priceUSD === 0) return '0';
    const tokenAmount = (parseFloat(usdAmount || 0) / priceUSD);
    return tokenAmount === 0 ? '' : tokenAmount.toString();
  };

  // 🔥 NEW: Handle input change based on mode
  const handleAmountChange = (value, mode) => {
  console.log('💱 Input change:', { value, mode });
  
  // 🔥 FIX: Limit decimal places based on network DURING input
  if (value && value.includes('.')) {
    const networkIdentifierMap = {
      "Bitcoin Main Network": "bitcoin",
      "Lightning Network": "lightning",
      "Ethereum Main Network": "ethereum",
      "Base Network": "base",
      "Solana Network": "solana",
      "Ethereum Network": "ethereum",
      "BEP20 Network": "binance",
      "Tron Network": "tron"
    };
    
    const networkIdentifier = networkIdentifierMap[selectedNetwork?.name] || selectedNetwork?.name?.toLowerCase();
    
    const maxDecimalsMap = {
      'bitcoin': 8,
      'lightning': 8,
      'ethereum': 18,
      'base': 18,
      'binance': 18,
      'solana': 9,
      'tron': 6
    };
    
    const maxDecimals = maxDecimalsMap[networkIdentifier] || 18;
    const parts = value.split('.');
    
    // Limit decimal places during input
    if (parts[1] && parts[1].length > maxDecimals) {
      value = parts[0] + '.' + parts[1].substring(0, maxDecimals);
      console.log(`⚠️ Truncated to ${maxDecimals} decimals:`, value);
    }
  }
  
  if (mode === 'token') {
    setWithdrawAmount(value);
    const usd = calculateUsdEquivalent(value, selectedAsset?.name);
    setUsdEquivalent(usd);
    console.log(`  → Token: ${value} ${selectedAsset?.abbreviation} = $${usd}`);
  } else {
    setUsdEquivalent(value);
    const token = calculateTokenFromUsd(value);
    setWithdrawAmount(token);
    console.log(`  → USD: $${value} = ${token} ${selectedAsset?.abbreviation}`);
  }
};

  // 🔥 NEW: Toggle input mode
  const toggleInputMode = () => {
    const newMode = inputMode === 'token' ? 'usd' : 'token';
    console.log('🔄 Toggling input mode:', { from: inputMode, to: newMode });
    console.log('   Current values:', { withdrawAmount, usdEquivalent });
    setInputMode(newMode);
    
    // Log after state update (will show in next render)
    setTimeout(() => {
      console.log('✅ Mode toggled to:', newMode);
    }, 0);
  };

  const handleUseMax = () => {
    // 🔥 FIX: Get network-specific balance instead of total balance
    let maxAmount = "0.0";

    // Check if we have networks data in selectedAsset
    if (selectedAsset?.networks && selectedNetwork?.name) {
      // Map UI network names to actual network keys in wallet data
      const networkKeyMap = {
        "Bitcoin Main Network": "bitcoin",
        "Lightning Network": "lightning",
        "Ethereum Main Network": "ethereum",
        "Base Network": "base",
        "Solana Network": "solana",
        "Ethereum Network": "ethereum", // For USDT
        "BEP20 Network": "binance", // For BNB
        "Tron Network": "tron"
      };

      const networkKey = networkKeyMap[selectedNetwork.name];
      
      if (networkKey && selectedAsset.networks[networkKey]) {
        maxAmount = selectedAsset.networks[networkKey].balance || "0.0";
        console.log(`✅ Using ${selectedNetwork.name} balance:`, maxAmount, selectedAsset.abbreviation);
      } else {
        console.warn(`⚠️ Network key '${networkKey}' not found in:`, Object.keys(selectedAsset.networks));
      }
    }

    // Fallback to total balance if network-specific not found
    if (maxAmount === "0.0" || maxAmount === "0") {
      maxAmount = selectedAsset?.balance || "0.0";
      console.log(`ℹ️ Using total balance as fallback:`, maxAmount);
    }

    // Set both token and USD values
    setWithdrawAmount(maxAmount);
    
    // 🔥 FIX: Use actual priceUSD from selectedAsset, not hardcoded exchange rates
    const usdValue = (parseFloat(maxAmount || 0) * parseFloat(selectedAsset?.priceUSD || 0)).toFixed(2);
    setUsdEquivalent(usdValue);
    
    console.log(`💰 Max amount set:`, maxAmount, selectedAsset?.abbreviation, `= $${usdValue}`);
    console.log(`   Current input mode: ${inputMode}`);
    console.log(`   Input will show: ${inputMode === 'usd' ? '$' + usdValue : maxAmount + ' ' + selectedAsset?.abbreviation}`);
    console.log(`   Conversion shows: ${inputMode === 'usd' ? maxAmount + ' ' + selectedAsset?.abbreviation : '$' + usdValue}`);
  };

  const handleClose = () => {
    setCurrentModal('main');
    setSelectedAsset(null);
    setSelectedNetwork(null);
    setTransactionType(null);
    setLightningAmount('');
    setCopiedAddress(false);
    setWithdrawAmount('');
    setWithdrawAddress('');
    setWithdrawPin('');
    setUsdEquivalent('0.00');
    setPinError('');
    setIsVerifyingPin(false);
    setQrCodeDataUrl('');
    setInputMode('usd'); // 🔥 CHANGED: Reset to 'usd' mode (was 'token')
    onClose();
  };

  const handleBack = () => {
    if (currentModal === 'selectAsset') {
      setCurrentModal('main');
      setTransactionType(null);
    } else if (currentModal === 'selectNetwork') {
      setCurrentModal('selectAsset');
      setSelectedAsset(null);
    } else if (currentModal === 'depositStep1') {
      setCurrentModal('selectNetwork');
      setSelectedNetwork(null);
      setQrCodeDataUrl('');
    } else if (currentModal === 'withdrawStep1') {
      setCurrentModal('selectAsset');
      setSelectedAsset(null);
      setSelectedNetwork(null);
    } else if (currentModal === 'depositStep2' || currentModal === 'withdrawStep2') {
      setCurrentModal(currentModal === 'depositStep2' ? 'depositStep1' : 'withdrawStep1');
    } else if (currentModal === 'withdrawStep3') {
      setCurrentModal('withdrawStep2');
      setPinError('');
      setWithdrawPin('');
    } else if (currentModal === 'withdrawStep4') {
      setCurrentModal('withdrawStep3');
    } else {
      setCurrentModal('main');
    }
  };

  const handleDepositClick = () => {
    setTransactionType('deposit');
    setCurrentModal('selectAsset');
  };

  const handleWithdrawClick = () => {
    setTransactionType('withdraw');
    setCurrentModal('selectAsset');
  };

  // 🔥 NEW: Handle asset click to show price chart
  const handleAssetChartClick = (asset) => {
    setSelectedChartAsset(asset);
    setShowChartView(true);
  };

  // 🔥 NEW: Handle back from chart view
  const handleChartBack = () => {
    setShowChartView(false);
    setSelectedChartAsset(null);
  };

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    if (transactionType === 'withdraw') {
      const networks = networkConfigs[asset?.name] || [];
      if (networks.length > 0) {
        setSelectedNetwork(networks[0]);
        setCurrentModal('withdrawStep1');
      }
    } else {
      setCurrentModal('selectNetwork');
    }
  };

  const handleNetworkSelect = (network) => {
    setSelectedNetwork(network);
    if (transactionType === 'deposit') {
      setCurrentModal('depositStep1');
    } else {
      setCurrentModal('withdrawStep1');
    }
  };

  const handleNextStep = () => {
    if (currentModal === 'depositStep1') {
      setCurrentModal('depositStep2');
    } else if (currentModal === 'withdrawStep1') {
      setCurrentModal('withdrawStep2');
    }
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleGenerateInvoice = () => {
    if (lightningAmount) {
      console.log('Generating invoice for:', lightningAmount);
    }
  };

const handleVerifyPinAndProceed = async () => {
  if (withdrawPin.length !== 4) {
    setPinError('PIN must be 4 digits');
    return;
  }

  setIsVerifyingPin(true);
  setPinError('');

  try {
    // Step 1: Verify PIN
    const verifyResponse = await authService.verifyTransactionPin(withdrawPin);

    if (!verifyResponse.status || !verifyResponse.data.success) {
      throw new Error(verifyResponse.message || 'PIN verification failed');
    }

    // 🔥 Step 2: Fix decimal precision BEFORE sending to backend
    // Map UI network names to backend network identifiers
    const networkIdentifierMap = {
      "Bitcoin Main Network": "bitcoin",
      "Lightning Network": "lightning",
      "Ethereum Main Network": "ethereum",
      "Base Network": "base",
      "Solana Network": "solana",
      "Ethereum Network": "ethereum",
      "BEP20 Network": "binance",
      "Tron Network": "tron"
    };
    
    const networkIdentifier = networkIdentifierMap[selectedNetwork?.name] || selectedNetwork?.name?.toLowerCase();
    
    // 🔥 FIX: Get network-specific balance for validation
    let networkBalance = selectedAsset?.balance || '0';
    
    if (selectedAsset?.networks && networkIdentifier) {
      const networkData = selectedAsset.networks[networkIdentifier];
      if (networkData && networkData.balance) {
        networkBalance = networkData.balance;
      }
    }

    // 🔥 CRITICAL: Validate and fix precision
    const validation = validateWithdrawalAmount(
      withdrawAmount,
      networkIdentifier,
      selectedAsset?.abbreviation,
      networkBalance
    );

    if (!validation.valid) {
      setPinError(validation.error);
      setIsVerifyingPin(false);
      return;
    }

    // Use the properly formatted amount
    const fixedAmount = validation.formattedAmount;
    
    console.log('💰 Withdrawal amount precision fix:', {
      original: withdrawAmount,
      fixed: fixedAmount,
      network: networkIdentifier,
      currency: selectedAsset?.abbreviation
    });

    // Step 3: Execute withdrawal using /send-token endpoint
    const withdrawalData = {
      recipientAddress: withdrawAddress,
      amount: parseFloat(fixedAmount), // 🔥 Use fixed amount
      currency: selectedAsset?.abbreviation?.toLowerCase(),
      currencyKey: selectedAsset?.currencyKey,
      network: networkIdentifier,
      networkName: selectedNetwork?.name,
      transactionPin: String(withdrawPin),
      type: 'external_withdrawal',
      usdEquivalent: usdEquivalent,
      notes: `Withdrawal of ${fixedAmount} ${selectedAsset?.abbreviation} to ${withdrawAddress}`
    };

    console.log('🚀 Executing withdrawal with fixed precision:', withdrawalData);

    // Call the endpoint
    const withdrawalResponse = await authService.requestWithRetry('/transaction/send-token', {
      method: 'POST',
      body: JSON.stringify(withdrawalData)
    });

if (withdrawalResponse.status || withdrawalResponse.success) {
  console.log('✅ Withdrawal successful:', withdrawalResponse);
  
  // 🔥 FIX: Store the withdrawal data BEFORE clearing form
  setWithdrawalSuccessData({
    amount: withdrawalResponse.data?.amount || fixedAmount,
    currency: withdrawalResponse.data?.currency || selectedAsset?.abbreviation,
    network: withdrawalResponse.data?.network || networkIdentifier,
    networkName: selectedNetwork?.name,
    toAddress: withdrawalResponse.data?.toAddress || withdrawAddress,
    fromAddress: withdrawalResponse.data?.fromAddress || '',
    transactionHash: withdrawalResponse.data?.transactionHash || '',
    explorerUrl: withdrawalResponse.data?.explorerUrl || '',
    usdEquivalent: usdEquivalent,
    timestamp: withdrawalResponse.data?.timestamp || new Date().toISOString(),
    assetName: selectedAsset?.name
  });
  
  // 🔥 NOW clear the form (after storing data)
  setWithdrawAmount('');
  setWithdrawAddress('');
  setWithdrawPin('');
  setUsdEquivalent('');
  
  setCurrentModal('withdrawStep4');
} else {
      throw new Error(withdrawalResponse.message || 'Withdrawal failed');
    }
  } catch (error) {
    console.error('❌ Withdrawal error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = error.message || 'Withdrawal failed. Please try again.';
    
    if (errorMessage.includes('too many decimals')) {
      errorMessage = 'Amount has too many decimal places. Please use a simpler amount.';
    } else if (errorMessage.includes('underflow')) {
      errorMessage = 'Amount is too small for this network. Please increase the amount.';
    } else if (errorMessage.includes('insufficient')) {
      errorMessage = 'Insufficient balance to complete this withdrawal.';
    } else if (errorMessage.includes('invalid address')) {
      errorMessage = 'Invalid recipient address. Please check and try again.';
    }
    
    setPinError(errorMessage);
  } finally {
    setIsVerifyingPin(false);
  }
};

  if (!isOpen) return null;



  // 🔥 NEW: Chart View Modal
  if (showChartView && selectedChartAsset) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-[rgba(0,0,0,0.7)] rounded-xl w-full h-full lg:h-[40rem] p-3 lg:p-6 max-w-xl lg:mx-4 flex flex-col overflow-y-auto">
          <CryptoPriceChart
            asset={selectedChartAsset}
            onBack={handleChartBack}
            walletBalance={selectedChartAsset.balance}
            isVisible={true}
          />
        </div>
      </div>
    );
  }

  // Main Modal
  if (currentModal === 'main') {
    return (

      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-[rgba(0,0,0,0.7)] rounded-xl w-full h-full lg:h-[40rem] p-3 lg:p-6 max-w-xl lg:mx-4 flex flex-col overflow-y-auto">

          <div className='flex w-full items-center justify-between mt-6 mb-5'>
            <div className="flex items-center justify-center">
              <h1 className="text-md w-full text-center font-bold text-white">Total Assets</h1>
            </div>

            <button
              onClick={handleClose}
              className="flex text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <X size={22} />
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-gray-400 text-sm mb-2"></h2>
            <div className="flex flex-col gap-2 items-center justify-center">
              <span className="text-3xl font-bold text-white">
                ${(() => {
                  const currentWalletData = walletDataRef.current;
                  const portfolioValue = currentWalletData?.balances?.portfolio?.totalValueUSD;
                  
                  if (portfolioValue) {
                    return parseFloat(portfolioValue).toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    });
                  }
                  
                  // Fallback to manual calculation if portfolio data not available
                  return assets.reduce((total, asset) => {
                    const balance = parseFloat(asset.balance || '0');
                    const price = parseFloat(asset.priceUSD || '0');
                    return total + (balance * price);
                  }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
              </span>
              <div className={`flex items-center ${(() => {
                const currentWalletData = walletDataRef.current;
                const changePercentage = currentWalletData?.balances?.portfolio?.totalChangePercentage;
                
                if (changePercentage !== undefined) {
                  return parseFloat(changePercentage) >= 0 ? 'text-green-400' : 'text-red-400';
                }
                
                // Fallback to first asset's change
                return assets.length > 0 && parseFloat(assets[0]?.changePercent || '0') >= 0 
                  ? 'text-green-400' : 'text-red-400';
              })()}`}>
                {(() => {
                  const currentWalletData = walletDataRef.current;
                  const changePercentage = currentWalletData?.balances?.portfolio?.totalChangePercentage;
                  
                  if (changePercentage !== undefined) {
                    return parseFloat(changePercentage) >= 0 
                      ? <TrendingUp size={16} className="mr-1" />
                      : <TrendingDown size={16} className="mr-1" />;
                  }
                  
                  // Fallback
                  return assets.length > 0 && parseFloat(assets[0]?.changePercent || '0') >= 0
                    ? <TrendingUp size={16} className="mr-1" />
                    : <TrendingDown size={16} className="mr-1" />;
                })()}
                <span className="text-sm">
                  {(() => {
                    const currentWalletData = walletDataRef.current;
                    const changePercentage = currentWalletData?.balances?.portfolio?.totalChangePercentage;
                    
                    if (changePercentage !== undefined) {
                      const change = parseFloat(changePercentage);
                      return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                    }
                    
                    // Fallback to first asset's change
                    return assets.length > 0
                      ? `${parseFloat(assets[0]?.changePercent || '0') >= 0 ? '+' : ''}${parseFloat(assets[0]?.changePercent || '0').toFixed(2)}%`
                      : '+0.00%';
                  })()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-8 mb-6">
            <div className='flex flex-col gap-2 justify-center items-center'>
              <button
                onClick={handleDepositClick}
                className="flex-1 bg-[#252525] hover:bg-primary duration-200 p-5 w-fit text-white rounded-full font-medium transition-colors"
              >
                <img src={withdraw} className='h-5 w-5' alt="" />
              </button>
              <p className='text-xs'>Deposit Asset</p>
            </div>

            <div className='flex flex-col gap-2 justify-center items-center'>
              <button
                onClick={handleWithdrawClick}
                className="flex-1 bg-[#252525] p-5 w-fit hover:bg-primary duration-200  text-white rounded-full font-medium transition-colors"
              >
                <img src={pay} className='h-5 w-5' alt="" />
              </button>
              <p className='text-xs'>Withdraw Asset</p>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1">
            {assets.map((asset, index) => (
              <div
                key={index}
                className="rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleAssetChartClick(asset)}
              >
                <div className="flex items-center space-x-3">
                  <div className="rounded-full flex items-center justify-center">
                    <img
                      className="w-12 h-12"
                      src={
                        cryptoImages[asset.name] ||
                        cryptoImages[asset.abbreviation] ||
                        btc
                      }
                      alt={`${asset.name} logo`}
                    />
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h3 className="text-white font-medium">{asset.name}</h3>
                      <p className="text-gray-400 text-md">{asset.abbreviation}</p>
                    </div>
                    <p className="text-gray-100 text-sm">{asset.balance}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white font-medium">{asset.rate}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm flex items-center ${asset.change.startsWith("+") ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {asset.change.startsWith("+") ? (
                        <TrendingUp size={12} className="mr-1" />
                      ) : (
                        <TrendingDown size={12} className="mr-1" />
                      )}
                      {asset.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {onBack && (
            <div className="flex justify-center mt-6">
            </div>
          )}
        </div>
      </div>
    );
  }


  // Select Asset Modal
  if (currentModal === 'selectAsset') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end lg:items-center lg:justify-center z-50">
        <div className="bg-[rgba(0,0,0,0.7)] lg:rounded-xl p-6 w-full max-w-xl lg:mx-4 lg:h-[40rem] pt-12 lg:pt-0">
          <div className='flex w-full items-center justify-between mb-6'>
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">Select Asset</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-3">
            {assets.map((asset, index) => (
              <button
                key={index}
                onClick={() => handleAssetSelect(asset)}
                className="w-full p-4 rounded-lg hover:bg-[#252525] transition-colors flex items-center space-x-3"
              >
                <img
                  className="w-10 h-10"
                  src={
                    cryptoImages[asset.name] ||
                    cryptoImages[asset.abbreviation] ||
                    btc
                  }
                  alt={`${asset.name} logo`}
                />
                <div className="flex items-center gap-2 text-left">
                  <h3 className="text-white font-medium">{asset.name}</h3>
                  <p className="text-gray-400 text-sm">{asset.abbreviation}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Select Network Modal
  if (currentModal === 'selectNetwork') {
    const networks = networkConfigs[selectedAsset?.name] || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-[rgba(0,0,0,0.7)] lg:rounded-xl p-6 w-full max-w-xl lg:mx-4 h-screen lg:h-[40rem] pt-12 lg:pt-0">
          <div className='flex w-full items-center justify-between mb-6'>
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">
              {transactionType === 'deposit' ? 'Deposit' : 'Withdraw'} {selectedAsset?.abbreviation}
            </h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <X size={22} />
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-white font-medium mb-2">Choose Network</h2>
            <p className="flex gap-1 bg-[#1a1a1a] p-2 rounded-md text-gray-400 text-sm mb-4">
              <span><img src={notice} className='h-5 w-5' alt="" /> </span>  Please note that only supported networks on Soctral are shown, if you {transactionType} via another network your assets may be lost.
            </p>
          </div>

          <div className="space-y-3">
            {networks.map((network, index) => (
              <button
                key={index}
                onClick={() => handleNetworkSelect(network)}
                className="w-full p-4 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] transition-colors text-left"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium">{network.name}</h3>
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>{network.confirmations} Min. {transactionType} {network.minDeposit} Est. arrival {network.arrival}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Deposit Step 1 Modal
  if (currentModal === 'depositStep1') {
    const isLightning = selectedNetwork?.name === "Lightning Network";
    const depositAddress = depositAddresses[selectedAsset?.name]?.[selectedNetwork?.name];
    const limits = depositLimits[selectedAsset?.name];

    if (isLightning) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-[rgba(0,0,0,0.7)] lg:rounded-xl p-6 w-full max-w-xl lg:mx-4 h-screen lg:h-[40rem] pt-12 lg:pt-0">
            <div className='flex w-full items-center justify-between mb-6'>
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
              >
                <ArrowLeft size={22} />
              </button>
              <h1 className="text-lg font-bold text-white">Deposit {selectedAsset?.abbreviation}</h1>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-left">
                <h2 className="text-sm font-bold text-white mb-2">Deposit {selectedAsset?.abbreviation}</h2>

                <div className='bg-[rgba(24,24,24,1)] p-3 rounded-lg'>
                  <p className="flex gap-1 items-center text-gray-400 text-sm"> <span><img src={notice} className='h-5 w-5' alt="" /> </span>  Lightning deposit are credited to your account immediately upon receipt.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Network</label>
                  <div className="bg-[#1a1a1a] py-5 px-3 rounded-full">
                    <p className="text-white">{selectedNetwork?.name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    placeholder="Enter Amount"
                    value={lightningAmount}
                    onChange={(e) => setLightningAmount(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white py-5 px-3 rounded-full border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleGenerateInvoice}
                  disabled={!lightningAmount}
                  className="w-full py-5 px-3 rounded-full bg-primary hover:bg-primary disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center overflow-y-auto justify-center z-50">
        <div className="bg-[rgba(0,0,0,0.7)] lg:rounded-xl p-6 w-full max-w-xl lg:mx-4">
          <div className='flex w-full items-center justify-between mb-6'>
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">Deposit {selectedAsset?.abbreviation}</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-left">
              <h2 className="text-sm font-bold text-white mb-4">Deposit {selectedAsset?.abbreviation}</h2>
              <div className="bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg p-3 mb-4">
                <p className="flex gap-1 text-gray-400 text-sm">
                  <span><img src={notice} className='h-7 w-7 pb-2' alt="" /> </span>  You can only receive {selectedAsset?.abbreviation} using this wallet address. Don't attempt to send a different asset to this address. sending any other asset asides {selectedAsset?.abbreviation} will result to permanent loss.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {qrCodeDataUrl ? (
                <div className='flex items-center justify-center'>
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-[200px] h-[200px]" />
                </div>
              ) : (
                <div className='flex items-center justify-center'>
                  <div className="w-[200px] h-[200px] bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">Generating QR Code...</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white text-sm font-medium mb-2">{selectedAsset?.name} Address</label>
                <div className={`py-5 px-3 rounded-full flex items-center justify-between transition-colors ${copiedAddress ? 'bg-primary' : 'bg-[#1a1a1a]'
                  }`}>
                  <span className="text-white text-sm break-all mr-2">
                    {copiedAddress ? 'Copied' : depositAddress}
                  </span>
                  <button
                    onClick={() => handleCopyAddress(depositAddress)}
                    className="text-white hover:text-blue-300 flex-shrink-0"
                  >
                    {copiedAddress ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Asset:</span>
                  <span className="text-white">{selectedAsset?.name} {selectedAsset?.abbreviation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">{selectedNetwork?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Minimum Deposit:</span>
                  <span className="text-white">{limits?.min}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Maximum Deposit:</span>
                  <span className="text-white">{limits?.max}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Withdraw Step 1 Modal
  if (currentModal === 'withdrawStep1') {
    const networkFee = networkFees[selectedAsset?.name]?.[selectedNetwork?.name] || "0.0";
    const availableNetworks = networkConfigs[selectedAsset?.name] || [];
    const amountReceived = withdrawAmount ? (parseFloat(withdrawAmount) - parseFloat(networkFee)).toFixed(8) : "0.00";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center overflow-y-auto z-50">
        <div className="bg-[rgba(0,0,0,0.7)] lg:rounded-xl p-6 w-full max-w-xl lg:mx-4">
          <div className='flex w-full items-center justify-between mb-6'>
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">Withdraw {selectedAsset?.abbreviation}</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg p-3">
              <p className="flex gap-1 text-gray-400 text-sm">
                <span><img src={notice} className='h-7 w-7 pb-2' alt="" /></span> <span> Ensure the wallet address entered belongs to the <span className='font-semibold text-white'> {selectedAsset?.name} network </span> else your asset will be permanently lost, and this transaction cannot be reversed.</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Wallet Address</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Enter ${selectedAsset?.name} Address`}
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white py-5 px-3 pr-12 rounded-full border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      console.log('Open QR scanner');
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Scan size={20} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Network</label>
                <div className="relative">
                  <button
                    onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                    className="w-full bg-[#1a1a1a] text-white py-5 px-3 rounded-full border border-gray-600 focus:border-blue-500 focus:outline-none text-left flex justify-between items-center"
                  >
                    <span>{selectedNetwork?.name || 'Select Network'}</span>
                    <ArrowLeft
                      size={16}
                      className={`transform transition-transform ${isNetworkDropdownOpen ? 'rotate-90' : '-rotate-90'}`}
                    />
                  </button>

                  {isNetworkDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-lg z-10">
                      {availableNetworks.map((network, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedNetwork(network);
                            setIsNetworkDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-white hover:bg-[#252525] first:rounded-t-lg last:rounded-b-lg transition-colors"
                        >
                          {network.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Network Fee:</span>
                  <span className="text-white">{networkFee} {selectedAsset?.abbreviation}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount Received:</span>
                  <span className="text-white">{amountReceived} {selectedAsset?.abbreviation}</span>
                </div>
              </div>

              <button
                onClick={() => setCurrentModal('withdrawStep2')}
                disabled={!withdrawAddress.trim() || !selectedNetwork}
                className="w-full py-5 px-3 rounded-full bg-primary hover:bg-primary disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Withdraw Step 2 Modal
  if (currentModal === 'withdrawStep2') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center overflow-y-auto z-50">
        <div className="bg-[rgba(0,0,0,0.7)] lg:rounded-xl p-6 w-full max-w-xl h-screen lg:h-[40rem] lg:mx-4 pt-10 lg:pt-0">
          <div className='flex w-full items-center justify-between mb-6'>
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">Withdraw {selectedAsset?.abbreviation}</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-2">
                ${usdEquivalent ? usdEquivalent : '0.00'}
              </h2>
              <p className="text-gray-400 mb-4">
                <span className='flex items-center justify-center w-full'><img src={alt} alt="" /> {withdrawAmount ? withdrawAmount : '0'}  {selectedAsset?.abbreviation} </span> <br />

                <span className='text-xs'>This is the equivalent amount in {selectedAsset?.abbreviation}, fees not included</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-white font-medium">Amount</label>
                  <button
                    onClick={toggleInputMode}
                    className="text-sm text-primary hover:text-blue-300 transition-colors flex items-center gap-1 bg-gray-800/50 px-3 py-1 rounded-full"
                  >
                    <span className="text-xs text-gray-400">Mode:</span>
                    <span className="font-medium">{inputMode === 'token' ? selectedAsset?.abbreviation : 'USD'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder={inputMode === 'token' ? `0.00 ${selectedAsset?.abbreviation}` : '$0.00'}
                    value={inputMode === 'token' ? withdrawAmount : usdEquivalent}
                    onChange={(e) => handleAmountChange(e.target.value, inputMode)}
                    className={`w-full bg-[#1a1a1a] text-white py-5 ${inputMode === 'usd' ? 'pl-10' : 'pl-3'} pr-32 rounded-full border-2 ${inputMode === 'usd' ? 'border-green-500/50' : 'border-blue-500/50'} focus:border-primary focus:outline-none`}
                  />
                  {inputMode === 'usd' && (
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 font-bold pointer-events-none text-lg">
                      $
                    </span>
                  )}
                  {inputMode === 'token' && (
                    <span className="absolute right-28 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm font-medium pointer-events-none">
                      {selectedAsset?.abbreviation}
                    </span>
                  )}
                  <button
                    onClick={handleUseMax}
                    title={inputMode === 'usd' 
                      ? `Set to max available: ${selectedAsset?.balance || '0'} ${selectedAsset?.abbreviation}` 
                      : `Set to max available: ${selectedAsset?.balance || '0'} ${selectedAsset?.abbreviation}`}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 rounded-full py-2 px-5 bg-[rgba(220,208,255,1)] text-primary leading-relaxed hover:text-blue-300 text-sm font-medium"
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {inputMode === 'token' 
                    ? `≈ $${usdEquivalent} USD`
                    : `≈ ${withdrawAmount} ${selectedAsset?.abbreviation}`
                  }
                </p>
              </div>

              <button
                onClick={() => setCurrentModal('withdrawStep3')}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="w-full py-5 px-3 rounded-full bg-primary hover:bg-primary disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Withdraw Step 3 Modal
  if (currentModal === 'withdrawStep3') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center overflow-y-auto justify-center z-50">
        <div className="bg-[rgba(0,0,0,0.7)] lg:rounded-xl p-6 w-full max-w-xl lg:mx-4 h-screen lg:h-[40rem] pt-10 lg:pt-0">
          <div className='flex w-full items-center justify-between mb-6'>
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">Finish Transaction</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 mb-6">
                To proceed with your withdrawal of ${usdEquivalent}, please enter your secure 4-digit PIN.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Enter PIN</label>
                <div className="flex justify-center space-x-6">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={withdrawPin[index] || ''}
                      onChange={(e) => {
                        const newPin = withdrawPin.split('');
                        newPin[index] = e.target.value;
                        setWithdrawPin(newPin.join(''));

                        if (e.target.value && index < 3) {
                          const nextInput = e.target.parentElement.children[index + 1];
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !e.target.value && index > 0) {
                          const prevInput = e.target.parentElement.children[index - 1];
                          if (prevInput) prevInput.focus();
                        }
                      }}
                      className="w-12 h-12 bg-transparent text-white border-0 border-b-2 border-gray-600 focus:border-blue-500 focus:outline-none text-center text-2xl"
                    />
                  ))}
                </div>
                {pinError && (
                  <p className="text-red-400 text-sm text-center mt-2">{pinError}</p>
                )}
              </div>

              <button
                onClick={handleVerifyPinAndProceed}
                disabled={withdrawPin.length !== 4 || isVerifyingPin}
                className="w-full py-5 px-3 rounded-full bg-primary hover:bg-primary disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                {isVerifyingPin ? 'Verifying...' : 'Proceed'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Withdraw Step 4 Modal

if (currentModal === 'withdrawStep4') {
  const networkFee = networkFees[selectedAsset?.name]?.[selectedNetwork?.name] || "0.0";
  
  // 🔥 FIX: Use stored withdrawal success data instead of state variables
  const successData = withdrawalSuccessData || {};
  const displayAmount = successData.amount || withdrawAmount || '0';
  const displayUsd = successData.usdEquivalent || usdEquivalent || '0.00';
  const displayAddress = successData.toAddress || withdrawAddress || 'N/A';
  const displayCurrency = successData.currency || selectedAsset?.abbreviation || '';
  const displayAssetName = successData.assetName || selectedAsset?.name || '';
  const displayNetworkName = successData.networkName || selectedNetwork?.name || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center overflow-y-auto justify-center z-50">
      <div className="bg-[rgba(0,0,0,0.7)] h-screen lg:h-[40rem] lg:rounded-xl p-6 w-full max-w-xl lg:mx-4">
        <div className='flex w-full items-center justify-end mb-6'>
          <button
            onClick={() => {
              // 🔥 Clear form data when closing success modal
              setWithdrawAmount('');
              setWithdrawAddress('');
              setWithdrawPin('');
              setUsdEquivalent('');
              setWithdrawalSuccessData(null);
              handleClose();
            }}
            className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/30"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-6 text-center">
          <div>
            <div className="flex items-center justify-center mx-auto mb-4">
              <img src={tick} className="" alt="Success" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 mx-auto">
              Your withdrawal of <br /> {displayAmount} {displayCurrency} is being processed
            </h2>
            <span className="flex items-start text-left gap-2 bg-[rgba(24,24,24,1)] text-sm p-3 rounded-xl">
              <img src={notice} className='h-5 w-5' alt="Notice" />
              <span>
                It may take some time for the transaction to reflect, depending on network confirmations.
                You can track your withdrawal in your transaction history.
              </span>
            </span>
          </div>

          <div className="rounded-lg p-4 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Asset:</span>
              <span className="text-white">{displayAssetName} ({displayCurrency})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network:</span>
              <span className="text-white">{displayNetworkName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Withdrawal Amount:</span>
              <span className="text-white">{displayAmount} {displayCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">USD Equivalent:</span>
              <span className="text-white">${parseFloat(displayUsd).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Receiver Address:</span>
              <span className="text-white text-sm break-all">{displayAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network Fee:</span>
              <span className="text-white">{networkFee} {displayCurrency}</span>
            </div>
            
            {/* 🔥 NEW: Show transaction hash and explorer link if available */}
            {successData.transactionHash && (
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Transaction Hash:</span>
                <span className="text-white text-xs break-all max-w-[200px]">
                  {successData.transactionHash.slice(0, 10)}...{successData.transactionHash.slice(-8)}
                </span>
              </div>
            )}
            
            {successData.explorerUrl && (
              <div className="pt-2">
                <a
                  href={successData.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm underline"
                >
                  View on Block Explorer →
                </a>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              // 🔥 Clear form data when clicking Done
              setWithdrawAmount('');
              setWithdrawAddress('');
              setWithdrawPin('');
              setUsdEquivalent('');
              setWithdrawalSuccessData(null);
              handleClose();
            }}
            className="w-full py-5 px-3 rounded-full bg-primary hover:bg-primary text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

  return null;
};

export default WalletTransactionModal;