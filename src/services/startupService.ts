import { api } from "@/lib/api";

const qs = (params: Record<string, any>) => {
  const p = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return p ? `?${p}` : "";
};

export const startupService = {
  getStats: () => api.get("/startup_stats"),
  getIndustries: () => api.get("/industries"),
  getStartups: (p: { page?: number; search?: string; industry_id?: number | string; filter?: string } = {}) =>
    api.get(`/startups${qs(p)}`),
  getStartupDetail: (id: number | string) => api.get(`/startup_detail/${id}`),
  getPitched: (p: { page?: number; limit?: number; status?: string } = {}) =>
    api.get(`/pitched_startups${qs(p)}`),
  getDailyPitchStatus: () => api.get("/daily_pitch_status"),
  sendPitch: (payload: { startup_id: number | string; subject: string; message: string }) =>
    api.postForm("/send_startup_pitch", payload),
  gmailStatus: () => api.get("/gmail_status"),
  gmailConnect: () => api.get("/gmail_connect"),
  gmailDisconnect: () => api.postForm("/gmail_disconnect", {}),
};
