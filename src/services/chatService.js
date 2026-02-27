import { StreamChat } from 'stream-chat';

class ChatService {
  constructor() {
    this.client = null;
    this.currentUser = null;
    this.apiKey = '39h4m4hmwswh';
  }

  async initializeChat(userId, userName, userImage) {
    try {
      if (this.client && this.currentUser?.id === userId) {
        console.log('✅ Chat already initialized for user:', userId);
        return this.client;
      }

      // console.log('🔄 Initializing Stream Chat for user:', userId);

      this.client = StreamChat.getInstance(this.apiKey);
      const token = this.client.devToken(userId);

      await this.client.connectUser(
        {
          id: userId,
          name: userName,
          image: userImage,
        },
        token
      );

      this.currentUser = { id: userId, name: userName, image: userImage };
      // console.log('✅ Stream Chat initialized successfully');

      return this.client;
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
      throw error;
    }
  }

  async ensureUserExists(userId, userName, userImage = null) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      // console.log('🔍 Checking if user exists in GetStream:', userId);

      try {
        const { users } = await this.client.queryUsers({ id: userId });

        if (users && users.length > 0) {
          // console.log('✅ User already exists in GetStream:', userId);
          return users[0];
        } else {
          // User will be added when channel is created
          return null;
        }
      } catch (queryError) {
        // User will be added when channel is created
        return null;
      }
    } catch (error) {
      console.error('❌ Error checking user:', error);
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnectUser();
        this.client = null;
        this.currentUser = null;
        console.log('✅ Chat disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting chat:', error);
    }
  }




  // ✅ FIXED: chatService.js - createOrGetChannel with robust metadata extraction

  async createOrGetChannel(otherUserId, otherUserName, chatType = 'buy', channelTypeStr = 'messaging', additionalData = {}) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      if (this.currentUser.id === otherUserId) {
        throw new Error('Cannot create a channel with yourself');
      }

      await this.ensureUserExists(otherUserId, otherUserName);

      const userIds = [this.currentUser.id, otherUserId].sort();
      const userId = this.currentUser.id;

      // 🔥 STABLE CHANNEL ID: One channel per (user1, user2, tradeType). No orderId.
      // Stream Chat 64-char max: truncate userIds to last 12 chars.
      // Format: {last12ofUser1}_{last12ofUser2}_{chatType} — reused for all trades between this pair + type.
      const shortUser1 = userIds[0].slice(-12);
      const shortUser2 = userIds[1].slice(-12);
      const baseChannelId = `${shortUser1}_${shortUser2}_${chatType}`;
      const uniqueMembers = [...new Set([this.currentUser.id, otherUserId])];

      // When user had "deleted" this chat, reuse the same channel (don't create a new one).
      const deletionKey = `deletedChannel_${userId}_${baseChannelId}`;
      if (localStorage.getItem(deletionKey)) {
        localStorage.removeItem(deletionKey);
        const otherUserDeletionKey = `deletedChannel_${otherUserId}_${baseChannelId}`;
        localStorage.removeItem(otherUserDeletionKey);
      }

      let channelId = baseChannelId;

      // 🔥 CRITICAL: Extract ALL possible metadata sources with priority order
      const requestedAccountId = additionalData.accountId || additionalData.account_id;
      const tradePrice = additionalData.price || 'N/A';

      // 🔥 NEW: Flag to determine if this is a new trade initiation or just opening existing chat
      const isNewInitiation = additionalData.isNewInitiation === true;
      console.log('🔍 isNewInitiation flag:', isNewInitiation);

      // 🔥 NEW: Robust extraction with multiple fallbacks
      const platform = additionalData.platform ||
        additionalData.item?.name?.toLowerCase() ||
        additionalData.socialAccount?.toLowerCase() ||
        'Unknown';

      const accountUsername = additionalData.accountUsername ||
        additionalData.username ||
        additionalData.handle ||
        additionalData.accountHandle ||
        'N/A';

      console.log('🔧 ========== CREATE/GET CHANNEL ==========');
      console.log('📋 Input Data:', { channelId, members: uniqueMembers, chatType });

      // Query for existing channel (stable ID only; legacy lookup for backward compat)
      let existingChannels = await this.client.queryChannels({
        type: channelTypeStr,
        id: channelId
      });

      if (existingChannels.length === 0) {
        const legacyChannelId = `${userIds[0]}_${userIds[1]}_${chatType}`;
        if (legacyChannelId !== channelId) {
          const legacyChannels = await this.client.queryChannels({
            type: channelTypeStr,
            id: legacyChannelId
          });
          if (legacyChannels.length > 0) {
            existingChannels = legacyChannels;
            channelId = legacyChannelId;
          }
        }
      }

      let isNewChannel = existingChannels.length === 0;
      let isNewTradeRequest = false;
      let channel;

      // 🔥 CRITICAL: Store metadata with ALL extracted fields
      const metadata = {
        chatType,
        trade_price: tradePrice,
        accountId: requestedAccountId,
        platform: platform,                    // ✅ PERSISTENT
        accountUsername: accountUsername,      // ✅ PERSISTENT
        initiator_id: this.currentUser.id,
        timestamp: Date.now()
      };

      if (existingChannels.length > 0) {
        channel = existingChannels[0];
        console.log('♻️ EXISTING CHANNEL FOUND:', channelId);

        // 🔥 CRITICAL: Always try to extract existing metadata first
        let existingMetadata = channel.data?.metadata || {};

        // Fallback: Parse from name if metadata not in custom data
        if (!existingMetadata.chatType) {
          try {
            const parts = (channel.data?.name || '').split('|');
            if (parts.length > 1) {
              existingMetadata = JSON.parse(parts[1]);
            }
          } catch (e) {
            console.log('⚠️ Could not parse existing metadata from name');
          }
        }

        console.log('📊 Existing metadata:', existingMetadata);

        const messages = channel.state.messages || [];
        const visibleMessages = messages.filter(msg => !msg.deleted_at);

        // Check if this is a new trade request
        const storedAccountId = existingMetadata.accountId;

        if (requestedAccountId && storedAccountId && storedAccountId !== requestedAccountId) {
          isNewTradeRequest = true;
          console.log('🆕 NEW TRADE REQUEST - Different account!');
        } else if (visibleMessages.length === 0 && !storedAccountId) {
          isNewChannel = true;
          console.log('🆕 NEW CHANNEL - No messages');
        } else if (visibleMessages.length === 0 && storedAccountId) {
          isNewTradeRequest = true;
          console.log('🆕 NEW TRADE REQUEST - Channel cleared');
        }

        // 🔥 CRITICAL: ALWAYS update if we have better data
        const shouldUpdate = isNewChannel ||
          isNewTradeRequest ||
          !existingMetadata.platform ||
          existingMetadata.platform === 'Unknown' ||
          !existingMetadata.accountUsername ||
          existingMetadata.accountUsername === 'N/A' ||
          platform !== 'Unknown' ||
          accountUsername !== 'N/A';

        // 🔥 CRITICAL FIX: Only update initiator_id when initiating NEW trade
        // NOT when just opening existing chat from chat list
        const currentInitiator = existingMetadata.initiator_id;
        const newInitiator = this.currentUser.id;
        const initiatorChanged = currentInitiator !== newInitiator;

        console.log('🔍 Initiator check:', {
          currentInitiator,
          newInitiator,
          initiatorChanged,
          isNewInitiation,
          shouldUpdate
        });

        // 🔥 FIXED: Only update when isNewInitiation is true OR when it's a brand new channel
        if (isNewInitiation || isNewChannel || isNewTradeRequest) {
          try {
            const finalMetadata = {
              ...existingMetadata,
              ...metadata,
              // 🔥 CRITICAL: Only update initiator_id for NEW initiations
              initiator_id: this.currentUser.id,
              // Only override platform/username if new value is better
              platform: metadata.platform !== 'Unknown' ? metadata.platform : existingMetadata.platform,
              accountUsername: metadata.accountUsername !== 'N/A' ? metadata.accountUsername : existingMetadata.accountUsername,
              // 🔥 Track last trade initiator for debugging
              last_trade_initiated_by: this.currentUser.id,
              last_trade_timestamp: Date.now()
            };

            const metadataString = JSON.stringify(finalMetadata);
            const newName = `Chat with ${otherUserName}|${metadataString}`;

            await channel.update({
              name: newName,
              metadata: finalMetadata  // ✅ Store in custom data
            });

            console.log('✅ Metadata updated (new initiation):', {
              platform: finalMetadata.platform,
              accountUsername: finalMetadata.accountUsername,
              initiator_id: finalMetadata.initiator_id,
              isNewInitiation: isNewInitiation
            });
          } catch (updateError) {
            console.error('⚠️ Could not update channel:', updateError.message);
          }
        } else {
          console.log('ℹ️ Opening existing chat - NOT updating initiator_id');
          console.log('   Current initiator remains:', currentInitiator);
        }

        await channel.show();
      } else {
        // Create new channel with complete metadata
        console.log('🆕 CREATING NEW CHANNEL:', channelId);

        const metadataString = JSON.stringify(metadata);
        const channelName = `Chat with ${otherUserName}|${metadataString}`;

        channel = this.client.channel(channelTypeStr, channelId, {
          name: channelName,
          members: uniqueMembers,
          metadata: metadata  // ✅ Store in custom data
        });

        await channel.create();
        console.log('✅ New channel created with complete metadata:', {
          platform: metadata.platform,
          accountUsername: metadata.accountUsername
        });
        isNewChannel = true;
      }

      await channel.watch();

      // 🔥 CRITICAL FIX: Clear deletion marker when channel is opened/watched
      // Try both the full channel ID and the legacy 3-part base ID as deletion keys
      const fullDeletionKey = `deletedChannel_${this.currentUser.id}_${channelId}`;
      const legacyBaseId = channelId?.split('_').slice(0, 3).join('_') || channelId;
      const legacyDeletionKey = `deletedChannel_${this.currentUser.id}_${legacyBaseId}`;
      if (localStorage.getItem(fullDeletionKey)) {
        console.log('🗑️ Clearing deletion marker (full):', fullDeletionKey);
        localStorage.removeItem(fullDeletionKey);
      }
      if (localStorage.getItem(legacyDeletionKey)) {
        console.log('🗑️ Clearing deletion marker (legacy):', legacyDeletionKey);
        localStorage.removeItem(legacyDeletionKey);
      }

      // console.log('✅ ========== CHANNEL READY ==========');
      return {
        channel,
        isNewChannel,
        isNewTradeRequest
      };
    } catch (error) {
      console.error('❌ Channel error:', error.message);
      throw error;
    }
  }




  async getUserChannels() {
    try {
      if (!this.client || !this.currentUser) {
        throw new Error('Chat client not initialized');
      }

      const filter = {
        type: 'messaging',
        members: { $in: [this.currentUser.id] }
      };

      const sort = [{ last_message_at: -1 }];
      const userId = this.currentUser.id;

      console.log('📡 Fetching channels for user:', userId);

      const channels = await this.client.queryChannels(filter, sort, {
        watch: true,
        state: true,
        limit: 30,
      });

      console.log('📥 Raw channels from server:', channels.length);

      // 🔥 FIXED: Only filter channels that THIS user specifically deleted
      const visibleChannels = channels.filter(channel => {
        const channelId = channel.id || (channel.cid ? channel.cid.split(':')[1] : null);

        // Check if channel is hidden for current user via Stream API
        const membership = channel.state?.membership;
        const isHidden = membership?.hidden === true;

        // 🔥 FIXED: Check deletion markers using the full channel ID
        const fullDeletionKey = `deletedChannel_${userId}_${channelId}`;
        let wasDeletedByUser = localStorage.getItem(fullDeletionKey) !== null;

        // 🔥 FIX: Clear STALE deletion markers — if the channel has messages AFTER the
        // deletion timestamp, the other party started a new trade on this channel.
        // The user should see it, so auto-clear the stale marker.
        if (wasDeletedByUser) {
          const deletionTimestamp = parseInt(localStorage.getItem(fullDeletionKey), 10);
          const lastMessage = channel.state?.messages?.[channel.state.messages.length - 1];
          const lastMessageTime = lastMessage ? new Date(lastMessage.created_at).getTime() : 0;

          if (lastMessageTime > deletionTimestamp) {
            console.log('🔄 Clearing STALE deletion marker — channel has new messages after deletion:', {
              channelId,
              deletionTime: new Date(deletionTimestamp).toISOString(),
              lastMessageTime: new Date(lastMessageTime).toISOString()
            });
            localStorage.removeItem(fullDeletionKey);
            wasDeletedByUser = false;
          }
        }

        // 🔥 RELAXED: Don't filter by isMember - Stream API already filters by membership
        // Only exclude if: hidden by Stream OR deleted by THIS user (and not a new channel)
        const shouldExclude = isHidden || wasDeletedByUser;

        if (shouldExclude) {
          console.log(`🚫 Excluding channel ${channelId}:`, {
            isHidden,
            wasDeletedByUser,
            deletionKey: wasDeletedByUser ? fullDeletionKey : null
          });
        }

        return !shouldExclude;
      });

      console.log('✅ Fetched channels:', visibleChannels.length, '(filtered from', channels.length, 'total)');

      // 🔥 CRITICAL FIX: Auto-clear stale deletion markers when:
      // 1. We have raw channels from server (channels.length > 0)
      // 2. But ALL are filtered by deletion markers (visibleChannels.length === 0)
      if (channels.length > 0 && visibleChannels.length === 0) {
        console.log('🔄 All channels filtered by deletion markers - auto-clearing stale markers...');

        channels.forEach(channel => {
          const cId = channel.id || (channel.cid ? channel.cid.split(':')[1] : null);
          const fullDeletionKey = `deletedChannel_${userId}_${cId}`;

          if (localStorage.getItem(fullDeletionKey)) {
            console.log('🗑️ Auto-clearing stale deletion marker:', fullDeletionKey);
            localStorage.removeItem(fullDeletionKey);
          }
        });

        console.log('✅ Returning all', channels.length, 'channels after clearing markers');
        return channels;
      }

      return visibleChannels;
    } catch (error) {
      console.error('❌ Error fetching channels:', error);
      throw error;
    }
  }



  async sendMessage(channel, messageText, attachments = []) {
    try {
      if (!channel) {
        throw new Error('Channel not provided');
      }

      const message = {
        text: messageText,
      };

      if (attachments.length > 0) {
        message.attachments = attachments;
      }

      await channel.sendMessage(message);
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  async markAsRead(channel) {
    try {
      if (!channel) {
        throw new Error('Channel not provided');
      }

      await channel.markRead();
      console.log('✅ Messages marked as read for user:', this.currentUser?.id);

      return new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  }

  getUnreadCount(channel) {
    try {
      if (!channel) return 0;
      return channel.state.unreadCount || 0;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  async searchUsers(searchTerm) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      const response = await this.client.queryUsers(
        {
          $or: [
            { name: { $autocomplete: searchTerm } },
            { id: { $autocomplete: searchTerm } }
          ],
          id: { $ne: this.currentUser.id },
        },
        { name: 1 },
        { limit: 10 }
      );

      return response.users;
    } catch (error) {
      console.error('❌ Error searching users:', error);
      throw error;
    }
  }

  async deleteMessage(messageId) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      await this.client.deleteMessage(messageId);
      console.log('✅ Message deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  }

  async updateMessage(messageId, newText) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      await this.client.updateMessage({
        id: messageId,
        text: newText,
      });

      console.log('✅ Message updated successfully');
    } catch (error) {
      console.error('❌ Error updating message:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isInitialized() {
    return this.client !== null && this.currentUser !== null;
  }

  getClient() {
    return this.client;
  }

  async sendTypingIndicator(channel, isTyping = true) {
    try {
      if (!channel) {
        throw new Error('Channel not provided');
      }

      if (isTyping) {
        await channel.keystroke();
      } else {
        await channel.stopTyping();
      }
    } catch (error) {
      console.error('❌ Error sending typing indicator:', error);
    }
  }

  listenForTyping(channel, callback) {
    try {
      if (!channel) {
        throw new Error('Channel not provided');
      }

      channel.on('typing.start', (event) => {
        if (event.user.id !== this.currentUser.id) {
          callback(true, event.user);
        }
      });

      channel.on('typing.stop', (event) => {
        if (event.user.id !== this.currentUser.id) {
          callback(false, event.user);
        }
      });
    } catch (error) {
      console.error('❌ Error listening for typing:', error);
    }
  }

  async uploadFile(channel, file) {
    try {
      if (!channel) {
        throw new Error('Channel not provided');
      }

      const response = await channel.sendFile(file);
      console.log('✅ File uploaded successfully');
      return response;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  async uploadImage(channel, file) {
    try {
      if (!channel) {
        throw new Error('Channel not provided');
      }

      const response = await channel.sendImage(file);
      console.log('✅ Image uploaded successfully');
      return response;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }

  async createTransactionChannel(transactionId, buyerId, sellerId, buyerName, sellerName) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      if (buyerId === sellerId) {
        throw new Error('Buyer and seller cannot be the same user');
      }

      await this.ensureUserExists(buyerId, buyerName);
      await this.ensureUserExists(sellerId, sellerName);

      const channelId = `transaction_${transactionId}`;
      const uniqueMembers = [...new Set([buyerId, sellerId])];

      const channel = this.client.channel('messaging', channelId, {
        members: uniqueMembers,
        name: `Transaction ${transactionId}`,
        created_by_id: this.currentUser.id,
        transaction_id: transactionId,
      });

      await channel.create();
      console.log('✅ Transaction channel created:', channelId);

      return channel;
    } catch (error) {
      console.error('❌ Error creating transaction channel:', error);
      throw error;
    }
  }

  async clearChannel(channel) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      if (!channel) {
        throw new Error('Channel not provided');
      }

      await channel.truncate();

      console.log('✅ Channel cleared successfully');
      return { success: true, message: 'Channel cleared successfully' };
    } catch (error) {
      console.error('❌ Error clearing channel:', error);
      throw error;
    }
  }

  async deleteChannel(channel) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      if (!channel) {
        throw new Error('Channel not provided');
      }

      const channelId = channel.id || (channel.cid ? channel.cid.split(':')[1] : null);
      const userId = this.currentUser.id;

      console.log('🗑️ ========== DELETE CHANNEL ==========');
      console.log('🔍 Channel details:', {
        id: channelId,
        currentUserId: userId,
        members: Object.keys(channel.state?.members || {})
      });

      // 🔥 CRITICAL FIX: Hide the channel with clear history for THIS user only
      await channel.hide(userId, true);

      console.log('✅ Channel hidden successfully for user:', userId);

      // 🔥 Store deletion marker using FULL channel ID (trade-scoped)
      const deletionKey = `deletedChannel_${userId}_${channelId}`;
      localStorage.setItem(deletionKey, Date.now().toString());
      console.log('📝 Stored deletion marker:', deletionKey);

      // Verify the channel is hidden
      const membership = channel.state?.membership;
      console.log('📊 Post-hide membership status:', {
        hidden: membership?.hidden,
        userId: userId
      });

      console.log('✅ ========== DELETE COMPLETE ==========');

      return {
        success: true,
        message: 'Chat deleted successfully',
        hidden: true,
        channelId: channelId,
        userId: userId
      };
    } catch (error) {
      console.error('❌ ========== DELETE FAILED ==========');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  async hideChannel(channel, clearHistory = false) {
    try {
      if (!this.client) {
        throw new Error('Chat client not initialized');
      }

      if (!channel) {
        throw new Error('Channel not provided');
      }

      await channel.hide(this.currentUser.id, clearHistory);

      console.log(`✅ Channel hidden successfully${clearHistory ? ' (with history cleared)' : ''}`);
      return {
        success: true,
        message: `Channel hidden successfully${clearHistory ? ' with history cleared' : ''}`
      };
    } catch (error) {
      console.error('❌ Error hiding channel:', error);
      throw error;
    }
  }
}

export default new ChatService();