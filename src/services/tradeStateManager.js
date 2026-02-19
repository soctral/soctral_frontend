/**
 * TradeStateManager - Consolidated trade state persistence
 * 
 * Replaces the fragmented TransactionStorage that used multiple localStorage keys.
 * Uses a single 'trade_state' key + backend API validation on restore.
 * 
 * Phase flow: idle → seller_ready → buyer_accepted → trade_created → funds_released → completed
 * 
 * 🔥 FIX: Properly clear channel-specific data when trade completes to allow new trades
 */

import transactionService from './transactionService';

const STORAGE_KEY = 'trade_state';
const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

// Valid phase transitions
const PHASES = {
  IDLE: 'idle',
  SELLER_READY: 'seller_ready',
  BUYER_ACCEPTED: 'buyer_accepted',
  TRADE_CREATED: 'trade_created',
  FUNDS_RELEASED: 'funds_released',
  COMPLETED: 'completed',
};

const TradeStateManager = {
  PHASES,

  /**
   * Save the current trade state to localStorage
   */
  save(state) {
    try {
      const entry = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
      console.log('💾 TradeStateManager: saved state', { phase: state.phase, transactionId: state.transactionId, channelId: state.channelId });
    } catch (error) {
      console.error('TradeStateManager: save failed', error);
    }
  },

  /**
   * Get the raw stored state (without backend validation)
   */
  getStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const state = JSON.parse(raw);

      // Stale check
      if (Date.now() - state.timestamp > STALE_THRESHOLD) {
        console.log('🗑️ TradeStateManager: stale state, clearing');
        this.clear();
        return null;
      }

      // Already completed – clear and return null
      if (state.phase === PHASES.COMPLETED) {
        this.clear();
        return null;
      }

      return state;
    } catch (error) {
      console.error('TradeStateManager: getStored failed', error);
      return null;
    }
  },

  /**
   * Restore trade state by validating stored state against the backend.
   * Returns validated trade state or null if no active trade.
   */
  async restore() {
    try {
      const stored = this.getStored();

      // Always check backend for active transaction, even if nothing stored
      let backendTransaction = null;

      try {
        const response = await Promise.race([
          transactionService.getCurrentTransaction(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000)),
        ]);

        if (response?.transaction) {
          backendTransaction = response.transaction;
        }
      } catch (err) {
        console.warn('TradeStateManager: backend check failed', err.message);
        // Fall through - we'll use stored state if available
      }

      // If backend has no active transaction, clear any stored state
      if (!backendTransaction) {
        if (stored) {
          console.log('🗑️ TradeStateManager: backend has no transaction, clearing stored state');
          this.clear();
        }
        return null;
      }

      // Map backend status to phase
      const backendPhase = this._mapBackendStatus(backendTransaction.status);

      // Merge: prefer stored tradeData (has UI details) but trust backend for phase
      const restoredState = {
        transactionId: backendTransaction._id || backendTransaction.id,
        phase: backendPhase,
        tradeData: stored?.tradeData || {},
        timerState: stored?.timerState || null,
        channelId: stored?.channelId || null,
        backendTransaction,
        timestamp: Date.now(),
      };

      // Adjust timer if stored
      if (restoredState.timerState) {
        const elapsed = Math.floor((Date.now() - (stored?.timestamp || Date.now())) / 1000);
        restoredState.timerState.remainingTime = Math.max(0, (restoredState.timerState.remainingTime || 0) - elapsed);
        if (restoredState.timerState.remainingTime <= 0) {
          restoredState.timerState.isActive = false;
        }
      }

      // Persist the merged state
      this.save(restoredState);

      console.log('✅ TradeStateManager: restored state', {
        phase: restoredState.phase,
        transactionId: restoredState.transactionId,
        channelId: restoredState.channelId,
        hasTimer: !!restoredState.timerState,
      });

      return restoredState;
    } catch (error) {
      console.error('TradeStateManager: restore failed', error);
      return null;
    }
  },

  /**
   * Update the phase and optional extra data
   */
  setPhase(phase, extraData = {}) {
    const stored = this.getStored() || {};
    this.save({
      ...stored,
      phase,
      ...extraData,
    });
  },

  /**
   * Get the current phase
   */
  getPhase() {
    const stored = this.getStored();
    return stored?.phase || PHASES.IDLE;
  },

  /**
   * Save timer state (remaining seconds + active flag)
   */
  setTimerState(transactionId, isActive, remainingTime = 300) {
    const stored = this.getStored() || {};
    this.save({
      ...stored,
      transactionId: transactionId || stored.transactionId,
      timerState: {
        isActive,
        remainingTime,
      },
    });
  },

  /**
   * Get timer state with elapsed time adjustment
   */
  getTimerState() {
    const stored = this.getStored();
    if (!stored?.timerState) return null;

    const elapsed = Math.floor((Date.now() - stored.timestamp) / 1000);
    const adjustedTime = Math.max(0, stored.timerState.remainingTime - elapsed);

    return {
      isActive: stored.timerState.isActive && adjustedTime > 0,
      remainingTime: adjustedTime,
    };
  },

  /**
   * 🔥 FIX: Mark a transaction as completed and clear channel-specific state
   * This allows users to start NEW trades on the SAME channel after completion
   */
  markCompleted(transactionId, channelId = null) {
    if (!transactionId) return;
    try {
      // Store completion marker with both transaction ID AND channel ID (if provided)
      const completionKey = `trade_${transactionId}_completed`;
      localStorage.setItem(completionKey, JSON.stringify({
        transactionId,
        channelId,
        completedAt: Date.now()
      }));
      
      console.log(`✅ TradeStateManager: marked ${transactionId} as completed`, { channelId });
      
      // 🔥 Clear the main trade state to allow new trades
      this.clear();
      
      // 🔥 IMPORTANT: Fire event to notify components that trade completed
      window.dispatchEvent(new CustomEvent('tradeCompleted', { 
        detail: { transactionId, channelId } 
      }));
      
      console.log('🔔 Fired tradeCompleted event for:', { transactionId, channelId });
    } catch (error) {
      console.error('TradeStateManager: markCompleted failed', error);
    }
  },

  /**
   * 🔥 FIX: Check if a transaction was already completed
   * Now also returns the channel ID if available
   */
  isCompleted(transactionId) {
    if (!transactionId) return false;
    try {
      const completionKey = `trade_${transactionId}_completed`;
      const data = localStorage.getItem(completionKey);
      if (!data) return false;
      
      // Try to parse the stored data
      try {
        const parsed = JSON.parse(data);
        return {
          isCompleted: true,
          channelId: parsed.channelId,
          completedAt: parsed.completedAt
        };
      } catch {
        // Legacy format (just "true" string)
        return { isCompleted: true };
      }
    } catch {
      return false;
    }
  },

  /**
   * 🔥 NEW: Check if there's an active transaction for a specific channel
   * This prevents showing "Initiate Trade" button when there's already an active transaction
   */
  hasActiveTransactionForChannel(channelId) {
    if (!channelId) return false;
    
    const stored = this.getStored();
    if (!stored) return false;
    
    // Check if stored state has this channel ID AND is not completed
    const isActivePhase = ![PHASES.COMPLETED, PHASES.IDLE].includes(stored.phase);
    const matchesChannel = stored.channelId === channelId;
    
    const hasActive = isActivePhase && matchesChannel;
    
    console.log('🔍 Checking active transaction for channel:', {
      channelId,
      storedChannelId: stored.channelId,
      phase: stored.phase,
      matchesChannel,
      isActivePhase,
      hasActive
    });
    
    return hasActive;
  },

  /**
   * 🔥 NEW: Clear completed transaction marker after some time
   * This prevents localStorage from filling up with old completion markers
   */
  cleanupOldCompletions(daysOld = 7) {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trade_') && key.endsWith('_completed')) {
          try {
            const data = localStorage.getItem(key);
            const parsed = JSON.parse(data);
            if (parsed.completedAt && parsed.completedAt < cutoffTime) {
              keysToRemove.push(key);
            }
          } catch {
            // If we can't parse it, it's old format or corrupted - remove it
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} old completion markers`);
      }
    } catch (error) {
      console.error('TradeStateManager: cleanup failed', error);
    }
  },

  /**
   * Clear all trade state
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Also clear legacy keys from old TransactionStorage
      localStorage.removeItem('activeTransaction');
      localStorage.removeItem('pendingTransaction');
      console.log('🗑️ TradeStateManager: cleared');
    } catch (error) {
      console.error('TradeStateManager: clear failed', error);
    }
  },

  /**
   * Map backend transaction status to our phase enum
   */
  _mapBackendStatus(status) {
    if (!status) return PHASES.IDLE;
    const s = status.toLowerCase();

    if (s === 'completed' || s === 'released') return PHASES.COMPLETED;
    if (s === 'cancelled' || s === 'canceled' || s === 'expired') return PHASES.IDLE;
    // pending/active/escrowed all mean trade is created and buyer needs to release
    if (s === 'pending' || s === 'active' || s === 'escrowed') return PHASES.TRADE_CREATED;

    return PHASES.IDLE;
  },
};

// 🔥 Run cleanup on load (once per session)
if (typeof window !== 'undefined') {
  try {
    TradeStateManager.cleanupOldCompletions(7);
  } catch (error) {
    console.error('Failed to run cleanup:', error);
  }
}

export default TradeStateManager;