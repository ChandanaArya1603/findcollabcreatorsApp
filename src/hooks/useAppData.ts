import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { dashboardService } from "@/services/dashboardService";
import { walletService } from "@/services/walletService";
import { profileService } from "@/services/profileService";
import { notificationService } from "@/services/notificationService";
import { campaignService } from "@/services/campaignService";
import { utilityService } from "@/services/utilityService";
import { messageService } from "@/services/messageService";
import { onboardingService } from "@/services/onboardingService";

/* ── Shared queries ───────────────────────────── */

export const useDashboardStats = () =>
  useQuery({ queryKey: qk.dashboardStats, queryFn: () => dashboardService.getStats() });

export const useWalletBalance = () =>
  useQuery({ queryKey: qk.walletBalance, queryFn: () => walletService.getBalance() });

export const useCreditBalance = () =>
  useQuery({ queryKey: qk.creditBalance, queryFn: () => walletService.getCreditBalance() });

export const useCreditTransactions = (page = 1) =>
  useQuery({ queryKey: qk.creditTransactions(page), queryFn: () => walletService.getCreditTransactions(page) });

export const useNotifications = (page = 1) =>
  useQuery({ queryKey: qk.notifications(page), queryFn: () => notificationService.getNotifications(page) });

export const useMediaKit = () =>
  useQuery({ queryKey: qk.mediaKit, queryFn: () => profileService.getMediaKit() });

export const useYoutubeData = () =>
  useQuery({ queryKey: qk.youtubeData, queryFn: () => profileService.getYoutubeData() });

export const useCampaigns = (page = 1) =>
  useQuery({ queryKey: qk.campaigns(page), queryFn: () => campaignService.getCampaigns(page) });

export const useMyCampaigns = () =>
  useQuery({ queryKey: qk.myCampaigns, queryFn: () => campaignService.getMyCampaigns() });

export const useStartups = () =>
  useQuery({ queryKey: qk.startups, queryFn: () => api.get("/startups") });

export const useCategories = () =>
  useQuery({ queryKey: qk.categories, queryFn: () => utilityService.getCategories() });

export const useChatUsers = () =>
  useQuery({ queryKey: qk.chatUsers, queryFn: () => messageService.getChatUsers() });

/* ── Prefetch & invalidation helpers ──────────── */

let lastCritical: Promise<unknown> = Promise.resolve();
/** Resolves when the above-the-fold Home data from the latest prefetch has arrived. */
export const waitForCriticalHome = () => lastCritical;

/** Fire every Home request in parallel (app start and right after login). Home reuses these results. */
export const prefetchAppData = () => {
  type Job = { queryKey: readonly unknown[]; queryFn: () => Promise<any> };
  const critical: Job[] = [
    { queryKey: qk.dashboardStats, queryFn: () => dashboardService.getStats() },
    { queryKey: qk.creditBalance, queryFn: () => walletService.getCreditBalance() },
    { queryKey: qk.walletBalance, queryFn: () => walletService.getBalance() },
    { queryKey: qk.profileCompletion, queryFn: () => onboardingService.getProfileCompletion() },
    { queryKey: qk.mediaKit, queryFn: () => profileService.getMediaKit() },
  ];
  const rest: Job[] = [
    { queryKey: qk.unreadMessages, queryFn: () => messageService.getUnreadCount() },
    { queryKey: qk.notifications(1), queryFn: () => notificationService.getNotifications(1) },
    { queryKey: qk.campaigns(1), queryFn: () => campaignService.getCampaigns(1) },
    { queryKey: qk.myCampaigns, queryFn: () => campaignService.getMyCampaigns() },
    { queryKey: qk.creditTransactions(1), queryFn: () => walletService.getCreditTransactions(1) },
    { queryKey: qk.youtubeData, queryFn: () => profileService.getYoutubeData() },
  ];
  const run = (j: Job) => queryClient.prefetchQuery(j as any).catch(() => {});
  lastCritical = Promise.all(critical.map(run));
  Promise.all(rest.map(run));
  return lastCritical;
};

export const invalidateProfileData = () => {
  queryClient.invalidateQueries({ queryKey: qk.mediaKit });
  queryClient.invalidateQueries({ queryKey: qk.youtubeData });
};

/** Refresh every credit-related query (header balance, wallet, costs). */
export const invalidateCreditData = () => {
  queryClient.invalidateQueries({ queryKey: qk.creditBalance });
  queryClient.invalidateQueries({ queryKey: ["credit_dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["credit_costs"] });
  queryClient.invalidateQueries({ queryKey: ["credit_transactions"] });
  queryClient.invalidateQueries({ queryKey: ["credit_history"] });
  queryClient.invalidateQueries({ queryKey: ["daily_pitch_status"] });
};

export const invalidateCampaignData = () => {
  queryClient.invalidateQueries({ queryKey: qk.myCampaigns });
  queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  queryClient.invalidateQueries({ queryKey: qk.dashboardStats });
  queryClient.invalidateQueries({ queryKey: ["campaign_application_status"] });
  queryClient.invalidateQueries({ queryKey: ["campaign_credit_cost"] });
  invalidateCreditData();
};

export const invalidateWalletData = () => {
  queryClient.invalidateQueries({ queryKey: qk.walletBalance });
  invalidateCreditData();
};
