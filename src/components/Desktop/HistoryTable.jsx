import React, { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Star, ArrowLeft, Filter, Calendar, Copy, Share, AlertTriangle } from "lucide-react";
import btc from "../../assets/btc.svg";
import usdt from "../../assets/usdt.svg";
import eth from "../../assets/eth.svg";
import filter2 from "../../assets/filter2.svg";
import shield from "../../assets/Shield.svg";
import notice from "../../assets/notice.svg";
import share from "../../assets/share-04.svg";
import exchange from "../../assets/exchange.svg";
import gid from "../../assets/gridicons.svg";
import solana from "../../assets/sol.svg";
import bnb from "../../assets/bnb.svg";
import tron from "../../assets/trx.svg";
import transactionService from "../../services/transactionService";
import { useUser } from "../../context/userContext";

const HistoryTable = ({ 
  section = 'main',
  isAuthenticated,
  setShowAuthModal,
  setAuthModalType,
  setActiveMenuSection,
  setActiveTab,
  onClose,
  onBack 
}) => {

    const { user: userData } = useUser();

  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeTab, setActiveTabLocal] = useState('incoming');
  const [tableHeight, setTableHeight] = useState(530);
  const [activeFilters, setActiveFilters] = useState([]);
  const [copiedText, setCopiedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [incomingTransactions, setIncomingTransactions] = useState([]);
  const [outgoingTransactions, setOutgoingTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterData, setFilterData] = useState({
    startDate: '',
    endDate: '',
    dateRange: 'today'
  });
  
  const tableContainerRef = useRef(null);
  const bodyRef = useRef(null);
  const tableBodyRef = useRef(null);

  // Crypto images mapping
  const cryptoImages = {
    Bitcoin: btc,
    BTC: btc,
    Ethereum: eth,
    ETH: eth,
    Tether: usdt,
    USDT: usdt,
    Solana: solana,
    SOL: solana,
    "Binance Coin": bnb,
    BNB: bnb,
    Tron: tron,
    TRX: tron
  };

  // Get crypto image by currency
  const getCryptoImage = (currency) => {
    const upperCurrency = currency?.toUpperCase();
    return cryptoImages[upperCurrency] || cryptoImages[currency] || btc;
  };

  // Format transaction data from API response
  const formatTransactionData = (transactions, direction) => {
    if (!transactions || !Array.isArray(transactions)) return [];

    return transactions.map(transaction => {
      const crypto = transaction.currency?.toUpperCase() || 'BTC';
      const type = transaction.type || 'deposit'; // deposit or withdrawal
      const status = transaction.status || 'pending'; // confirmed, pending, failed
      
      // Format description based on type and status
      let description = '';
      if (type === 'deposit') {
        description = status === 'confirmed' 
          ? `Received ${transaction.amount} ${crypto}`
          : `Pending deposit of ${transaction.amount} ${crypto}`;
      } else if (type === 'withdrawal') {
        description = status === 'confirmed' 
          ? `Sent ${transaction.amount} ${crypto}`
          : `Pending withdrawal of ${transaction.amount} ${crypto}`;
      } else {
        description = `${type} of ${transaction.amount} ${crypto}`;
      }

      return {
        id: transaction._id || transaction.id,
        type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize
        crypto: crypto,
        amount: transaction.amount?.toString() || '0',
        status: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize
        description: description,
        date: transaction.confirmedAt || transaction.blockTimestamp || transaction.createdAt 
          ? new Date(transaction.confirmedAt || transaction.blockTimestamp || transaction.createdAt).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
        time: transaction.confirmedAt || transaction.blockTimestamp || transaction.createdAt
          ? new Date(transaction.confirmedAt || transaction.blockTimestamp || transaction.createdAt).toTimeString().split(' ')[0].substring(0, 5) 
          : '00:00',
        icon: getCryptoImage(transaction.currency),
        hash: transaction.transactionHash || transaction.hash || 'N/A',
        network: transaction.network || crypto,
        fromAddress: transaction.fromAddress || 'N/A',
        toAddress: transaction.toAddress || 'N/A',
        explorerUrl: transaction.explorerUrl || null,
        blockNumber: transaction.blockNumber || null,
        label: transaction.label || type,
        isNativeTransfer: transaction.isNativeTransfer || false,
        source: transaction.source || 'blockchain',
        usdValue: transaction.usdValue?.toString() || transaction.amount?.toString() || '0',
        notes: transaction.notes || ''
      };
    });
  };



// Update the fetchTransactions function in HistoryTable.jsx
// Replace the existing fetchTransactions function with this:

const fetchTransactions = async () => {
  try {
    setIsLoading(true);

    console.log('📊 Fetching wallet transactions (no filters applied)');

    // 🔥 UPDATED: Fetch all transactions without any filters
    let allTransactions = [];
    
    try {
      // Fetch all wallet transactions (no filters)
      const response = await transactionService.getWalletTransactionHistory();

      console.log('✅ All wallet transactions response:', response);

      // Extract transaction data
      allTransactions = response?.data || [];

      console.log('📊 Total Wallet Transactions fetched:', allTransactions.length);

    } catch (error) {
      console.error('❌ Error fetching wallet transactions:', error);
      
      // Check if it's a "no data" error
      const isNoDataError = error.message?.includes('No transactions found') ||
                            error.message?.includes('not found');
      
      if (!isNoDataError) {
        console.error('❌ Fetch failed with error:', error.message);
      }
      
      // Set empty array on error
      allTransactions = [];
    }

    // 🔥 FILTER ON FRONTEND: Separate by transaction type
    // Incoming = deposits (received funds), trade sales (seller received crypto)
    // Outgoing = withdrawals/sends (sent funds), trade purchases (buyer released crypto)
    const currentUserId = userData?._id || userData?.id;

    // First, identify outgoing transactions
    const isOutgoing = (txn) => {
      const type = (txn.type || '').toLowerCase();
      const direction = (txn.direction || '').toLowerCase();
      
      // Direct direction field takes priority
      if (direction === 'outgoing' || direction === 'outbound' || direction === 'debit') return true;
      
      // Check by type
      if (type === 'withdrawal' || type === 'withdraw' || type === 'send' || type === 'sent' || type === 'outgoing') return true;
      
      // Trade transactions - buyer releases funds (outgoing)
      if (type === 'trade' || type === 'escrow_release' || type === 'release-payment' || type === 'release') {
        const buyerId = txn.buyer?.userId || txn.buyer?._id || txn.buyerId;
        if (buyerId && buyerId === currentUserId) return true;
        const sellerId = txn.seller?.userId || txn.seller?._id || txn.sellerId;
        if (sellerId && sellerId !== currentUserId) return true;
        if (txn.label?.toLowerCase().includes('sent') || txn.label?.toLowerCase().includes('debit') || txn.label?.toLowerCase().includes('released')) return true;
      }
      
      return false;
    };

    const withdrawals = allTransactions.filter(isOutgoing);

    // 🔥 Everything that is NOT outgoing goes to Incoming (catch-all so no transaction is lost)
    const deposits = allTransactions.filter(txn => !isOutgoing(txn));

    console.log('📊 Transactions filtered:', {
      total: allTransactions.length,
      deposits: deposits.length,
      withdrawals: withdrawals.length
    });

    // Format the transactions
    const formattedIncoming = formatTransactionData(deposits, 'incoming');
    const formattedOutgoing = formatTransactionData(withdrawals, 'outgoing');

    console.log('✅ Formatted transactions:', {
      incoming: formattedIncoming.length,
      outgoing: formattedOutgoing.length
    });

    setIncomingTransactions(formattedIncoming);
    setOutgoingTransactions(formattedOutgoing);

  } catch (error) {
    console.error('❌ Fetch transactions error:', error);
    setIncomingTransactions([]);
    setOutgoingTransactions([]);
  } finally {
    setIsLoading(false);
  }
};

  


  // Fetch transactions on mount and when filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated, filterData.dateRange]);

  // Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleTableScroll = (e) => {
    if (!e || !e.target) return;
    
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    setShowLeftScroll(scrollLeft > 10);
    setShowRightScroll(scrollLeft < maxScrollLeft - 10);
  };

  const scrollTableLeft = () => {
    if (tableContainerRef.current) {
      const scrollAmount = 200;
      tableContainerRef.current.scrollLeft -= scrollAmount;
    }
  };

  const scrollTableRight = () => {
    if (tableContainerRef.current) {
      const scrollAmount = 200;
      tableContainerRef.current.scrollLeft += scrollAmount;
    }
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filterData);
    setShowFilterModal(false);
    
    // Add applied filter to active filters for display
    const filterLabels = {
      'today': 'Today',
      'last7days': 'Last 7 Days',
      'last14days': 'Last 14 Days',
      'lastmonth': 'Last Month',
      'lastquarter': 'Last Quarter',
      'lastyear': 'Last Year'
    };
    
    const newFilter = {
      label: filterLabels[filterData.dateRange] || filterData.dateRange,
      type: 'dateRange'
    };
    setActiveFilters([newFilter]);

    // Trigger fetch with new filters
    fetchTransactions();
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilterData({
      startDate: '',
      endDate: '',
      dateRange: 'today'
    });
  };

  const removeFilter = (index) => {
    const newFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(newFilters);
    
    // Reset to default filter
    if (newFilters.length === 0) {
      setFilterData({
        startDate: '',
        endDate: '',
        dateRange: 'today'
      });
    }
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const formatTransactionDate = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}:00`);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) + ', ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Group transactions by date
  const groupTransactionsByDate = (data) => {
    const grouped = {};
    data.forEach(transaction => {
      const date = transaction.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });
    return grouped;
  };

  const formatDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const checkScrollButtons = () => {
      if (tableContainerRef.current) {
        const container = tableContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const maxScrollLeft = scrollWidth - clientWidth;
        
        setShowLeftScroll(scrollLeft > 10);
        setShowRightScroll(scrollLeft < maxScrollLeft - 10);
      }
    };

    checkScrollButtons();
    
    const handleResize = () => {
      checkScrollButtons();
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  

  if (section === 'main') {
    const currentTableData = activeTab === 'incoming' ? incomingTransactions : outgoingTransactions;
    const isActive = (tab) => activeTab === tab;
    
    // Group current tab's transactions by date
    const allGroupedTransactions = groupTransactionsByDate(currentTableData);
    
    // Get all dates sorted newest first (for current tab)
    const allDates = Object.keys(allGroupedTransactions)
      .sort((a, b) => new Date(b) - new Date(a));
    
    // 🔥 FIX: Also compute total dates across BOTH tabs so pagination always shows
    const allTransactionsCombined = [...incomingTransactions, ...outgoingTransactions];
    const allGroupedCombined = groupTransactionsByDate(allTransactionsCombined);
    const allDatesCombined = Object.keys(allGroupedCombined)
      .sort((a, b) => new Date(b) - new Date(a));
    
    // Pagination: 2 date groups per page
    const datesPerPage = 2;
    const totalPages = Math.max(1, Math.ceil(allDatesCombined.length / datesPerPage));
    
    // Get the dates for the current page (from current tab's dates)
    const startIndex = (currentPage - 1) * datesPerPage;
    const endIndex = startIndex + datesPerPage;
    const paginatedDates = allDates.slice(startIndex, endIndex);
    
    // Build grouped transactions for display
    const groupedTransactions = {};
    paginatedDates.forEach(date => {
      groupedTransactions[date] = allGroupedTransactions[date];
    });

    return (
      <div className="flex h-full lg:max-w-[53rem] mt-3">
        <div className="flex-1 rounded-md max-w-[53rem]">
          {/* Header Section */}
          <div className="mb-3 flex items-center justify-between max-w-[53rem]">
            <h2 className="text-white font-semibold text-lg">Transactions</h2>
            
            {/* Filter Section */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Display active filters */}
              {activeFilters.map((filter, index) => (
                <div key={index} className="flex items-center gap-1 bg-[#613cd0] text-white px-3 py-1 rounded-full text-xs">
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(index)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {/* Clear All Button */}
              {activeFilters.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-gray-400 hover:text-white text-xs underline transition-colors"
                >
                  Clear all
                </button>
              )}
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilterModal(true)} 
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#3c3a3f] text-white rounded-lg transition-all duration-200"
              >
                <span className="text-sm font-medium">Filter</span>
                <img src={filter2} className="" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-4">
            <div className="flex items-center gap-0 rounded-lg p-1 relative">
              <button
                onClick={() => setActiveTabLocal('incoming')}
                className={`px-4 py-2 rounded-md text-base font-medium transition-all duration-300 relative ${
                  isActive('incoming')
                    ? 'text-white'
                    : 'text-gray-400 hover:text-primary'
                }`}
              >
                Incoming
                {isActive('incoming') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full transition-all duration-300"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTabLocal('outgoing')}
                className={`px-4 py-2 rounded-md text-base font-medium transition-all duration-300 relative ${
                  isActive('outgoing')
                    ? 'text-white'
                    : 'text-gray-400 hover:text-primary'
                }`}
              >
                Outgoing
                {isActive('outgoing') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full transition-all duration-300"></div>
                )}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-white">Loading transactions...</div>
            </div>
          )}

          {/* Empty State — Today section */}
          {!isLoading && currentTableData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              {/* Illustration */}
              <div className="w-28 h-28 mb-6 relative">
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circle */}
                  <circle cx="60" cy="60" r="56" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5"/>
                  {/* Document icon */}
                  <rect x="38" y="28" width="44" height="56" rx="6" fill="#232323" stroke="#333" strokeWidth="1.5"/>
                  <rect x="46" y="40" width="28" height="3" rx="1.5" fill="#383838"/>
                  <rect x="46" y="48" width="20" height="3" rx="1.5" fill="#383838"/>
                  <rect x="46" y="56" width="24" height="3" rx="1.5" fill="#383838"/>
                  <rect x="46" y="64" width="16" height="3" rx="1.5" fill="#383838"/>
                  {/* Magnifying glass */}
                  <circle cx="78" cy="76" r="14" fill="#0d0d0d" stroke="#603CD0" strokeWidth="2"/>
                  <line x1="88" y1="86" x2="98" y2="96" stroke="#603CD0" strokeWidth="3" strokeLinecap="round"/>
                  {/* Sparkle */}
                  <circle cx="82" cy="72" r="2" fill="#603CD0" opacity="0.6"/>
                </svg>
              </div>
              {/* Message */}
              <h3 className="text-white font-semibold text-base mb-2">
                {activeTab === 'incoming' ? 'No Incoming Transactions' : 'No Outgoing Transactions'}
              </h3>
              <p className="text-gray-500 text-sm text-center max-w-xs leading-relaxed">
                {activeTab === 'incoming'
                  ? 'Deposits and received funds will appear here once they are confirmed on the blockchain.'
                  : 'Withdrawals and sent transactions will appear here once they are processed.'}
              </p>
            </div>
          )}

          {/* Transactions Display */}
          {!isLoading && currentTableData.length > 0 && (
            <div className="space-y-4">
              {Object.entries(groupedTransactions)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .map(([date, transactions]) => (
                  <div key={date} className="rounded-lg lg:p-4">
                    {/* Date Header with Transaction Count */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium">
                        {formatDate(date)}
                      </h3>
                      <span className="text-gray-400 text-sm">
                        {transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Transaction List */}
                    <div className="bg-neutral-900 rounded-lg">
                      {transactions.map((transaction, index) => (
                        <div key={transaction.id} className="space-y-2">
                          {/* Main Transaction Row */}
                          <div 
                            className={`flex items-center justify-between p-2 lg:p-6 hover:bg-neutral-800 hover:rounded-lg transition-colors cursor-pointer ${
                              index !== transactions.length - 1 ? 'border-b border-gray-500/20' : ''
                            }`}
                            onClick={() => handleTransactionClick(transaction)}
                          >
                            {/* Left Section with Arrow and Transaction Info */}
                            <div className="flex items-center lg:gap-3">
                              {/* Directional Arrow */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                activeTab === 'incoming' 
                                  ? 'bg-green-500/20' 
                                  : 'bg-red-500/20'
                              }`}>
                                <svg 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  className={`${
                                    activeTab === 'incoming' 
                                      ? 'text-green-400' 
                                      : 'text-red-400'
                                  }`}
                                >
                                  {activeTab === 'incoming' ? (
                                    <path 
                                      d="M12 5v14m7-7l-7 7-7-7" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    />
                                  ) : (
                                    <path 
                                      d="M12 19V5m-7 7l7-7 7 7" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    />
                                  )}
                                </svg>
                              </div>

                              {/* Transaction Details */}
                              <div className="flex flex-col lg:flex-row">
                                <div className="flex items-center gap-1 lg:gap-2 ml-2 lg:ml-5">
                                  <img src={transaction.icon} alt={transaction.crypto} className="w-5 h-5" />
                                  <span className="text-white font-bold text-sm">{transaction.crypto}</span>
                                  <span className="text-xs py-1 rounded-full">
                                    {transaction.status}
                                  </span>

                                  <span className={`text-xs flex lg:hidden px-3 py-1 ml-[3px] rounded-full ${
                                    transaction.type === 'Trade' 
                                      ? 'text-[#603CD0] bg-[#603CD0]/20'
                                      : transaction.type === 'Wallet Funding'
                                      ? 'text-[#F7931A] bg-[#F7931A]/20'
                                      : transaction.type === 'Withdrawal'
                                      ? 'text-green-500 bg-green-500/20'
                                      : 'text-white'
                                  }`}>
                                    {transaction.type}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between pl-2 lg:pl-10 mt-1 lg:mt-0">
                                  <div className="flex items-center relative justify-between w-full">
                                    <p className="flex text-gray-400 gap-1 text-sm whitespace-nowrap">
                                      {transaction.description.split(transaction.amount + ' ' + transaction.crypto)[0]}
                                      <span className="text-white font-bold">
                                        {transaction.amount} {transaction.crypto}
                                      </span>
                                      {transaction.description.split(transaction.amount + ' ' + transaction.crypto)[1]}
                                    </p>
                                  </div>
                                  <span className={`text-xs px-3 py-1 ml-[3.5em] hidden lg:flex rounded-full ${
                                    transaction.type === 'Trade' 
                                      ? 'text-[#603CD0] bg-[#603CD0]/20'
                                      : transaction.type === 'Wallet Funding'
                                      ? 'text-[#F7931A] bg-[#F7931A]/20'
                                      : transaction.type === 'Withdrawal'
                                      ? 'text-green-500 bg-green-500/20'
                                      : 'text-white'
                                  }`}>
                                    {transaction.type}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right Section with Amount and iPhone Arrow */}
                            <div className="flex items-center gap-3">
                              {/* iPhone-style Arrow Icon */}
                              <div className="w-6 h-6 flex items-center justify-center">
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  className="text-gray-400"
                                >
                                  <path 
                                    d="M9 18l6-6-6-6" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Pagination Controls — always show if there are pages to navigate */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between px-4">
              {/* Page Info */}
              <div className="text-gray-400 text-sm">
                <span>Page {currentPage} of {totalPages}</span>
              </div>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary text-white'
                          : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {showTransactionModal && selectedTransaction && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
              onClick={() => setShowTransactionModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center lg:p-4">
              <div className="bg-[#000000] rounded-lg max-w-md w-full px-3 lg:mx-4 relative max-h-[100vh] lg:max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Transaction Summary */}
                <div className="p-3 border-gray-700">
                  {/* Header */}
                  <div className="flex items-center justify-center p-3 lg:p-6 border-gray-700">
                    <h3 className="text-white font-semibold text-lg">Transaction Details</h3>
                  </div>

                  <div className="text-center">
                    <div className="flex mb-3 items-center justify-center">
                      <img src={selectedTransaction.icon} alt={selectedTransaction.crypto} className="w-12 h-12" />
                    </div>

                    <div className="text-green-400 text-sm mb-1">{selectedTransaction.status}</div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="text-white text-2xl font-bold">
                        {selectedTransaction.amount} {selectedTransaction.crypto}
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-gray-400 text-lg font-semibold">
                      <img src={exchange} alt="" /> ${selectedTransaction.usdValue}
                    </div>
                    <div className="text-gray-400 text-sm mt-2">
                      {formatTransactionDate(selectedTransaction.date, selectedTransaction.time)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-gray-700">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col gap-2 items-center justify-center pr-10">
                      <button 
                        onClick={() => copyToClipboard(selectedTransaction.hash)}
                        className="flex items-center justify-center gap-2 py-4 px-4 rounded-full bg-[#181818] text-white hover:bg-[#3a3a3a] transition-colors"
                      >
                        <img src={share} className="w-6 h-6" />
                      </button>
                      <p className="text-xs">Share Receipt</p>
                    </div>
                  
                    <div className="flex flex-col gap-2 items-center justify-center">
                      <button className="flex items-center justify-center gap-2 py-4 px-4 bg-[#181818] text-white rounded-full hover:bg-[#3a3a3a] transition-colors">
                        <img src={gid} className="w-6 h-6" />
                      </button>
                      <p className="text-xs text-red-700">Report Issue</p>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="p-6 bg-[#181818] mb-5 lg:mb-0 rounded-lg mt-8 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Asset:</span>
                    <span className="text-white">{selectedTransaction.network} {selectedTransaction.crypto}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Transaction Type:</span>
                    <span className="text-white">{selectedTransaction.type}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Transaction Hash:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm truncate max-w-[200px]">{selectedTransaction.hash}</span>
                      <button 
                        onClick={() => copyToClipboard(selectedTransaction.hash)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {copiedText === selectedTransaction.hash ? (
                          <span className="text-green-400 text-xs">Copied!</span>
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Amount:</span>
                    <span className="text-white">{selectedTransaction.amount} {selectedTransaction.crypto}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Network:</span>
                    <span className="text-white">{selectedTransaction.network}</span>
                  </div>

                  {/* From Address */}
                  {selectedTransaction.fromAddress && selectedTransaction.fromAddress !== 'N/A' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">From Address:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm truncate max-w-[200px]">{selectedTransaction.fromAddress}</span>
                        <button 
                          onClick={() => copyToClipboard(selectedTransaction.fromAddress)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {copiedText === selectedTransaction.fromAddress ? (
                            <span className="text-green-400 text-xs">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* To Address */}
                  {selectedTransaction.toAddress && selectedTransaction.toAddress !== 'N/A' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">To Address:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm truncate max-w-[200px]">{selectedTransaction.toAddress}</span>
                        <button 
                          onClick={() => copyToClipboard(selectedTransaction.toAddress)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {copiedText === selectedTransaction.toAddress ? (
                            <span className="text-green-400 text-xs">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Transaction Date:</span>
                    <span className="text-white">{new Date(selectedTransaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Transaction Time:</span>
                    <span className="text-white">{new Date(`${selectedTransaction.date}T${selectedTransaction.time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  </div>

                  {/* Block Number */}
                  {selectedTransaction.blockNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Block Number:</span>
                      <span className="text-white">{selectedTransaction.blockNumber}</span>
                    </div>
                  )}

                  {/* Explorer Link */}
                  {selectedTransaction.explorerUrl && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">View on Explorer:</span>
                      <a 
                        href={selectedTransaction.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
                      >
                        Open
                        <Share className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Transaction Label */}
                  {selectedTransaction.label && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Label:</span>
                      <span className="text-white text-sm">{selectedTransaction.label}</span>
                    </div>
                  )}

                  {/* Notes if available */}
                  {selectedTransaction.notes && (
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-500 text-sm">Notes:</span>
                      <span className="text-white text-sm">{selectedTransaction.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <>
            <div 
              className="fixed inset-0 bg-black/80 z-50 transition-opacity duration-300"
              onClick={() => setShowFilterModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center lg:p-4">
              <div className="bg-[#000000] h-screen lg:h-[31rem] rounded-lg p-3 lg:p-6 lg:max-w-lg w-full lg:mx-4 relative">
                {/* Header with Back Arrow */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h3 className="text-white font-semibold text-lg">Filter</h3>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                <div className="mb-6">
                  {/* Date Range Section */}
                  <div className="space-y-4">
                    <div className="bg-[#181818] p-4 rounded-xl">
                      <div className="w-full bg-[#2a2a2a] rounded-lg px-3 py-5 text-white text-sm focus:outline-none mb-3 focus:border-purple-500">
                        <label className="block text-xs font-medium text-[#8f8f8f] mb-2">Date Range</label>
                        <select 
                          value={filterData.dateRange}
                          onChange={(e) => setFilterData({...filterData, dateRange: e.target.value})}
                          className="w-full bg-[#2a2a2a] text-white text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="today">Today</option>
                          <option value="last7days">Last 7 Days</option>
                          <option value="last14days">Last 14 Days</option>
                          <option value="lastmonth">Last Month</option>
                          <option value="lastquarter">Last Quarter</option>
                          <option value="lastyear">Last Year</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {filterData.dateRange === 'custom' && (
                        <>
                          <div className="w-full bg-[#2a2a2a] rounded-lg px-3 py-5 text-white text-sm focus:outline-none mb-3 focus:border-purple-500">
                            <label className="block text-xs font-medium text-[#8f8f8f] mb-2">Start Date</label>
                            <input
                              type="date"
                              value={filterData.startDate}
                              onChange={(e) => setFilterData({...filterData, startDate: e.target.value})}
                              className="w-full bg-[#2a2a2a] text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="w-full bg-[#2a2a2a] rounded-lg px-3 py-5 text-white text-sm focus:outline-none focus:border-purple-500">
                            <label className="block text-xs font-medium text-[#8f8f8f] mb-2">End Date</label>
                            <input
                              type="date"
                              value={filterData.endDate}
                              onChange={(e) => setFilterData({...filterData, endDate: e.target.value})}
                              className="w-full bg-[#2a2a2a] text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyFilters}
                  className="w-full py-3 bg-primary text-white rounded-full font-medium hover:opacity-80 transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default HistoryTable;