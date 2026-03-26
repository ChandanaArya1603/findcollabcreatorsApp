import { api } from "@/lib/api";

export const walletService = {
  getBalance: () =>
    api.get("/wallet_balance"),

  getTransactions: (page = 1, limit = 10) =>
    api.get(`/wallet_transactions?page=${page}&limit=${limit}`),

  submitWithdrawal: (data: { withdrawAmount: number; withdrawMethod: string; withdrawReason?: string }) =>
    api.postForm("/submit_withdrawal_request", data),
};
