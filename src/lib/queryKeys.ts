/** Shared query keys so screens reuse the same cached data. */
export const qk = {
  dashboardStats: ["dashboard_stats"] as const,
  walletBalance: ["wallet_balance"] as const,
  creditBalance: ["credit_balance"] as const,
  creditTransactions: (page = 1) => ["credit_transactions", page] as const,
  notifications: (page = 1) => ["notifications", page] as const,
  mediaKit: ["media_kit"] as const,
  youtubeData: ["youtube_data"] as const,
  campaigns: (page = 1) => ["campaigns", page] as const,
  myCampaigns: ["my_campaigns"] as const,
  startups: ["startups"] as const,
  categories: ["categories"] as const,
  chatUsers: ["chat_users"] as const,
};
