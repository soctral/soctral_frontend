// ========================================
// services/escrowService.js — Escrow API integration
// ========================================

import api from "./api.js";

/**
 * Maps payment method codes to their default blockchain networks.
 */
export const PAYMENT_NETWORK_MAP = {
  btc: "bitcoin",
  eth: "ethereum",
  usdt: "ethereum",
  sol: "solana",
  bnb: "binance",
  trx: "tron",
  usdc: "ethereum",
};

export const TOKEN_NETWORKS = {
  btc: ['bitcoin'],
  eth: ['ethereum', 'base', 'binance'],
  usdt: ['ethereum', 'tron', 'solana', 'binance'],
  sol: ['solana'],
  bnb: ['binance'],
  trx: ['tron'],
  usdc: ['ethereum', 'base', 'solana']
};

export const NETWORK_LABELS = {
  ethereum: 'Ethereum (ERC20)',
  bitcoin: 'Bitcoin',
  binance: 'Binance Smart Chain (BEP20)',
  base: 'Base',
  tron: 'Tron (TRC20)',
  solana: 'Solana'
};

const escrowService = {
  // ──────────────────────────────────────
  // 1. Search Users (partner autocomplete)
  // ──────────────────────────────────────
  async searchUsers(query) {
    if (!query || query.length < 2) return [];
    const res = await api.get(`/escrow/search-users?q=${encodeURIComponent(query)}`);
    return res?.data || [];
  },

  // ──────────────────────────────────────
  // 2. Upload Deal Images
  // ──────────────────────────────────────
  async uploadImages(files) {
    if (!files || files.length === 0) {
      throw new Error("No images provided");
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const res = await api.request("/escrow/upload-images", {
      method: "POST",
      body: formData,
    });

    return res?.data?.images || [];
  },

  // ──────────────────────────────────────
  // 3. Create Escrow Deal
  // ──────────────────────────────────────
  async createDeal({ dealName, description, partnerId, amount, paymentMethod, network, startDate, endDate, images, fundingParty }) {
    const payload = {
      dealName,
      description: description || undefined,
      partnerId,
      amount: Number(amount),
      paymentMethod,
      network,
      fundingParty,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      images: images && images.length > 0 ? images : undefined,
    };

    const res = await api.post("/escrow", payload);
    return res?.data || res;
  },

  // ──────────────────────────────────────
  // 4. Accept Deal
  // ──────────────────────────────────────
  async acceptDeal(dealId) {
    const res = await api.patch(`/escrow/${dealId}/accept`);
    return res?.data || res;
  },

  // ──────────────────────────────────────
  // 5. Decline Deal
  // ──────────────────────────────────────
  async declineDeal(dealId, reason) {
    const payload = reason ? { reason } : {};
    const res = await api.patch(`/escrow/${dealId}/decline`, payload);
    return res?.data || res;
  },

  // ──────────────────────────────────────
  // 6. Release Payment
  // ──────────────────────────────────────
  async releasePayment(dealId, pin) {
    const res = await api.post(`/escrow/${dealId}/release-payment`, { pin });
    return res?.data || res;
  },

  // ──────────────────────────────────────
  // 7. Cancel Deal (initiator only)
  // ──────────────────────────────────────
  async cancelDeal(dealId, reason) {
    const payload = reason ? { reason } : {};
    const res = await api.patch(`/escrow/${dealId}/cancel`, payload);
    return res?.data || res;
  },

  // ──────────────────────────────────────
  // 8. Raise Dispute
  // ──────────────────────────────────────
  async raiseDispute(dealId, reason) {
    const res = await api.patch(`/escrow/${dealId}/dispute`, { reason });
    return res?.data || res;
  },

  // ──────────────────────────────────────
  // 8. Get Current Active Deal
  // ──────────────────────────────────────
  async getCurrentDeal() {
    const res = await api.get("/escrow/current");
    return res?.data || null;
  },

  // ──────────────────────────────────────
  // 9. Get Deal by Channel ID
  // ──────────────────────────────────────
  async getDealByChannel(channelId) {
    const res = await api.get(`/escrow/by-channel/${encodeURIComponent(channelId)}`);
    return res?.data || null;
  },

  // ──────────────────────────────────────
  // 10. Get All Escrow Deals
  // ──────────────────────────────────────
  async getMyDeals({ status, role } = {}) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (role) params.append("role", role);
    const qs = params.toString();
    const res = await api.get(`/escrow/my-deals${qs ? `?${qs}` : ""}`);
    return res?.data || [];
  },
};

export default escrowService;
