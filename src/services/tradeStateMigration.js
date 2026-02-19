/**
 * 🔥 MIGRATION UTILITY - Run this once to fix old completed transactions
 * 
 * This script handles transactions that were completed BEFORE the tradeStateManager update.
 * It ensures that old completion markers don't block new trades.
 * 
 * HOW TO USE:
 * 1. Import this file in your main app component (e.g., App.jsx or HomePage.jsx)
 * 2. Call runMigration() once on app load
 * 3. This will clean up old data and allow new trades
 */

const MIGRATION_KEY = 'trade_state_migration_v1_done';

const TradeStateMigration = {
  /**
   * Main migration function - call this once on app load
   */
  runMigration() {
    // Check if migration already ran
    if (localStorage.getItem(MIGRATION_KEY)) {
      console.log('✅ Trade state migration already completed');
      return;
    }

    console.log('🔄 Running trade state migration...');

    let migratedCount = 0;
    let clearedCount = 0;

    try {
      // 1. Find all old completion markers (format: just "true" string)
      const keysToUpdate = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('trade_') && key.endsWith('_completed')) {
          const value = localStorage.getItem(key);
          
          // Check if it's old format (just "true" string) vs new format (JSON object)
          try {
            const parsed = JSON.parse(value);
            // If it's an object with completedAt, it's already new format
            if (typeof parsed === 'object' && parsed.completedAt) {
              console.log(`✅ Already migrated: ${key}`);
              continue;
            }
          } catch {
            // Not JSON, must be old format
          }
          
          // Old format detected
          keysToUpdate.push(key);
        }
      }

      console.log(`📊 Found ${keysToUpdate.length} old completion markers`);

      // 2. Update old markers to new format
      keysToUpdate.forEach(key => {
        try {
          // Extract transaction ID from key (format: trade_{id}_completed)
          const transactionId = key.replace('trade_', '').replace('_completed', '');
          
          // Update to new format
          const newValue = {
            transactionId,
            channelId: null, // We don't know the channel ID for old completions
            completedAt: Date.now() - (7 * 24 * 60 * 60 * 1000) // Mark as 7 days old so cleanup will remove it soon
          };
          
          localStorage.setItem(key, JSON.stringify(newValue));
          migratedCount++;
          
          console.log(`✅ Migrated: ${key}`);
        } catch (error) {
          console.error(`❌ Failed to migrate ${key}:`, error);
        }
      });

      // 3. Clear any stale trade_state that might be blocking
      try {
        const tradeState = localStorage.getItem('trade_state');
        if (tradeState) {
          const parsed = JSON.parse(tradeState);
          const isOld = Date.now() - parsed.timestamp > (24 * 60 * 60 * 1000); // Older than 24 hours
          
          if (isOld || parsed.phase === 'completed') {
            localStorage.removeItem('trade_state');
            clearedCount++;
            console.log('🗑️ Cleared stale trade_state');
          }
        }
      } catch (error) {
        console.warn('Could not check trade_state:', error);
      }

      // 4. Clear legacy keys
      const legacyKeys = ['activeTransaction', 'pendingTransaction'];
      legacyKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          clearedCount++;
          console.log(`🗑️ Cleared legacy key: ${key}`);
        }
      });

      // 5. Mark migration as complete
      localStorage.setItem(MIGRATION_KEY, JSON.stringify({
        completedAt: Date.now(),
        migratedCount,
        clearedCount
      }));

      console.log(`✅ Migration complete! Migrated ${migratedCount} completion markers, cleared ${clearedCount} stale items`);
      
      // 6. Reload the page to apply changes
      if (migratedCount > 0 || clearedCount > 0) {
        console.log('🔄 Reloading page to apply changes...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  },

  /**
   * Force clear all trade-related data (use only if needed)
   */
  forceCleanup() {
    console.warn('⚠️ Running FORCE cleanup - this will clear ALL trade data');
    
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && (
        key.startsWith('trade_') ||
        key === 'trade_state' ||
        key === 'activeTransaction' ||
        key === 'pendingTransaction'
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`🗑️ Force cleanup complete: removed ${keysToRemove.length} items`);
    
    // Remove migration marker so it can run again
    localStorage.removeItem(MIGRATION_KEY);
    
    // Reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  },

  /**
   * Check migration status
   */
  getStatus() {
    const migrationData = localStorage.getItem(MIGRATION_KEY);
    
    if (!migrationData) {
      return {
        completed: false,
        message: 'Migration has not been run yet'
      };
    }
    
    try {
      const data = JSON.parse(migrationData);
      return {
        completed: true,
        completedAt: new Date(data.completedAt).toLocaleString(),
        migratedCount: data.migratedCount,
        clearedCount: data.clearedCount
      };
    } catch {
      return {
        completed: true,
        message: 'Migration completed (legacy format)'
      };
    }
  }
};

// Auto-run migration on import (only in browser)
if (typeof window !== 'undefined') {
  // Run migration after a short delay to let app initialize
  setTimeout(() => {
    TradeStateMigration.runMigration();
  }, 1000);
}

export default TradeStateMigration;


/**
 * 🔧 USAGE EXAMPLES:
 * 
 * 1. AUTOMATIC (Recommended):
 *    Simply import this file in your main App component:
 *    
 *    import './services/tradeStateMigration';
 *    
 *    It will auto-run once per browser and fix all old data.
 * 
 * 
 * 2. MANUAL RUN:
 *    If you want to manually trigger it:
 *    
 *    import TradeStateMigration from './services/tradeStateMigration';
 *    TradeStateMigration.runMigration();
 * 
 * 
 * 3. CHECK STATUS:
 *    To check if migration has run:
 *    
 *    import TradeStateMigration from './services/tradeStateMigration';
 *    console.log(TradeStateMigration.getStatus());
 * 
 * 
 * 4. FORCE CLEANUP (Emergency only):
 *    If something is really broken, clear everything:
 *    
 *    import TradeStateMigration from './services/tradeStateMigration';
 *    TradeStateMigration.forceCleanup();
 * 
 */
