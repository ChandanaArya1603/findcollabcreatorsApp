import { api } from "@/lib/api";

export const dashboardService = {
  getStats: () => api.get("/dashboard_stats"),
};
