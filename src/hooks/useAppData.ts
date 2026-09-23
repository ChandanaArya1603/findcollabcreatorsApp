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

/** Warm the caches for the main tabs (app start and right after login). */
export const prefetchAppData = () => {
  const jobs: { queryKey: readonly unknown[]; queryFn: () => Promise<any> }[] = [
    { queryKey: qk.dashboardStats, queryFn: () => dashboardService.getStats() },
    { queryKey: qk.walletBalance, queryFn: () => walletService.getBalance() },
    { queryKey: qk.notifications(1), queryFn: () => notificationService.getNotifications(1) },
    { queryKey: qk.campaigns(1), queryFn: () => campaignService.getCampaigns(1) },
    { queryKey: qk.myCampaigns, queryFn: () => campaignService.getMyCampaigns() },
    { queryKey: qk.creditBalance, queryFn: () => walletService.getCreditBalance() },
    { queryKey: qk.creditTransactions(1), queryFn: () => walletService.getCreditTransactions(1) },
    { queryKey: qk.mediaKit, queryFn: () => profileService.getMediaKit() },
    { queryKey: qk.youtubeData, queryFn: () => profileService.getYoutubeData() },
  ];
  jobs.forEach((j) => {
    queryClient.prefetchQuery(j as any).catch(() => {});
  });
};

export const invalidateProfileData = () => {
  queryClient.invalidateQueries({ queryKey: qk.mediaKit });
  queryClient.invalidateQueries({ queryKey: qk.youtubeData });
};

export const invalidateCampaignData = () => {
  queryClient.invalidateQueries({ queryKey: qk.myCampaigns });
  queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  queryClient.invalidateQueries({ queryKey: qk.dashboardStats });
  queryClient.invalidateQueries({ queryKey: qk.creditBalance });
};

export const invalidateWalletData = () => {
  queryClient.invalidateQueries({ queryKey: qk.walletBalance });
  queryClient.invalidateQueries({ queryKey: qk.creditBalance });
  queryClient.invalidateQueries({ queryKey: ["credit_transactions"] });
};
