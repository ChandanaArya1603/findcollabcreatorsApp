import { api } from "@/lib/api";

export const walletService = {
  getBalance: () =>
    api.get("/wallet_balance"),

  getCreditBalance: () =>
    api.get("/credit_balance"),

  getCreditTransactions: (page = 1) =>
    api.get(`/credit_transactions?page=${page}`),

  getTransactions: (page = 1, limit = 10) =>
    api.get(`/wallet_transactions?page=${page}&limit=${limit}`),

  submitWithdrawal: (data: { withdrawAmount: number; withdrawMethod: string; withdrawReason?: string }) =>
    api.postForm("/submit_withdrawal_request", data),

  verifyPlayPurchase: (data: { product_id: string; purchase_token: string; order_id: string }) =>
    api.postForm("/verify_play_purchase", data),
};
