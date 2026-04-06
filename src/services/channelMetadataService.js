/**
 * Channel metadata and lifecycle API - custom backend (replaces Stream channel.update for metadata)
 */

import apiService from "./api.js";

/**
 * Get metadata for a channel
 * @param {string} channelId - Channel ID (e.g. bd0c745bdcd8_df015f7d1320_buy)
 * @returns {Promise<Object|null>} Metadata or null on failure
 */
export async function getChannelMetadata(channelId) {
  if (!channelId) return null;
  const id = normalizeChannelId(channelId);
  try {
    const response = await apiService.get(`/channels/${id}/metadata`);
    return response?.data ?? response ?? null;
  } catch (err) {
    console.warn("⚠️ getChannelMetadata failed:", err?.message);
    return null;
  }
}

/** Extract MongoDB ObjectId string from various formats - backend rejects non-ObjectId values */
function toId(v) {
  if (v == null) return null;
  if (typeof v === "string") return /^[a-f0-9]{24}$/i.test(v) ? v : v;
  const id = v?.$oid ?? v?.oid ?? v?.id ?? (typeof v?._id === "string" ? v._id : toId(v?._id));
  return id ? String(id) : null;
}

/** Normalize Stream channel id (e.g. "messaging:user1_user2_buy" -> "user1_user2_buy") */
function normalizeChannelId(id) {
  if (!id || typeof id !== "string") return id;
  const i = id.indexOf(":");
  return i >= 0 ? id.slice(i + 1) : id;
}

/**
 * Build DTO matching backend createOrUpdate expectations
 * @param {Object} opts
 * @returns {Object} Clean DTO for backend
 */
function buildMetadataDto(opts) {
  const {
    participantIds,
    initiator_id,
    chatType,
    accountId,
    sellOrderId,
    buyOrderId,
    platform,
    accountUsername,
    trade_price,
  } = opts;
  if (
    !participantIds ||
    participantIds.length !== 2 ||
    !initiator_id ||
    !chatType
  ) {
    return null;
  }
  const resolvedInitiatorId = toId(initiator_id);
  if (!resolvedInitiatorId || resolvedInitiatorId === "[object Object]") return null;

  const dto = {
    participantIds: participantIds.map((id) => String(id)),
    initiator_id: String(resolvedInitiatorId),
    chatType: String(chatType),
  };
  if (accountId != null && accountId !== "")
    dto.accountId = String(toId(accountId) || accountId);
  if (sellOrderId != null && sellOrderId !== "")
    dto.sellOrderId = String(toId(sellOrderId) || sellOrderId);
  if (buyOrderId != null && buyOrderId !== "")
    dto.buyOrderId = String(toId(buyOrderId) || buyOrderId);
  if (platform != null && platform !== "Unknown")
    dto.platform = String(platform);
  if (accountUsername != null && accountUsername !== "N/A")
    dto.accountUsername = String(accountUsername);
  const numPrice =
    typeof trade_price === "number" ? trade_price : parseFloat(trade_price);
  if (trade_price != null && trade_price !== "N/A" && !Number.isNaN(numPrice))
    dto.trade_price = numPrice;
  return dto;
}

/**
 * Create or update channel metadata (backend handles Stream write)
 * @param {string} channelId
 * @param {Object} metadata - Must include participantIds, initiator_id, chatType
 * @returns {Promise<Object|null>} Updated metadata or null
 */
export async function setChannelMetadata(channelId, metadata) {
  if (!channelId || !metadata) return null;
  const id = normalizeChannelId(channelId);
  const dto = buildMetadataDto(metadata) ?? metadata;
  if (!dto || !dto.participantIds || dto.participantIds.length !== 2) {
    console.warn("⚠️ setChannelMetadata skipped: invalid dto or participantIds", {
      hasDto: !!dto,
      participantIds: metadata?.participantIds,
      initiator_id: metadata?.initiator_id,
      chatType: metadata?.chatType,
    });
    return null;
  }
  console.log("🔍 setChannelMetadata POST", id, dto);
  try {
    const response = await apiService.post(`/channels/${id}/metadata`, dto);
    return response?.data ?? response ?? null;
  } catch (err) {
    console.error("⚠️ setChannelMetadata failed:", err?.message, err?.response?.status, err?.response?.data);
    return null;
  }
}

/**
 * Create metadata for a new channel (POST)
 * @param {string} channelId
 * @param {Object} metadata
 * @returns {Promise<Object|null>}
 */
export async function createChannelMetadata(channelId, metadata) {
  if (!channelId || !metadata) return null;
  const id = normalizeChannelId(channelId);
  const dto = buildMetadataDto(metadata) ?? metadata;
  if (!dto || !dto.participantIds || dto.participantIds.length !== 2) {
    console.warn("⚠️ createChannelMetadata skipped: invalid dto", {
      participantIds: metadata?.participantIds,
      initiator_id: metadata?.initiator_id,
      chatType: metadata?.chatType,
    });
    return null;
  }
  try {
    const response = await apiService.post(`/channels/${id}/metadata`, dto);
    return response?.data ?? response ?? null;
  } catch (err) {
    if (err?.response?.status === 409 || err?.message?.includes("exist")) {
      return setChannelMetadata(channelId, metadata);
    }
    console.error("⚠️ createChannelMetadata failed:", err?.message, err?.response?.status, err?.response?.data);
    return null;
  }
}

/**
 * Get lifecycle state for a channel
 * @param {string} channelId
 * @returns {Promise<Object|null>} { stage, hasInvoice, hasTransaction, ... } or null
 */
export async function getChannelLifecycle(channelId) {
  if (!channelId) return null;
  const id = normalizeChannelId(channelId);
  try {
    const response = await apiService.get(`/channels/${id}/lifecycle`);
    return response?.data ?? response ?? null;
  } catch (err) {
    console.warn("⚠️ getChannelLifecycle failed:", err?.message);
    return null;
  }
}
