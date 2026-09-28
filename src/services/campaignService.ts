import { api } from "@/lib/api";

export const campaignService = {
  getCampaigns: (page = 1) =>
    api.get(`/campaigns?page=${page}`),

  getCampaignDetail: (id: number) =>
    api.get(`/campaignDetail/${id}`),

  applyCampaign: (
    body: number | { campaign_id: number; quote?: string; message?: string; delivery_time?: string; boost_credits?: number },
  ) => api.postForm("/apply_campaign", typeof body === "number" ? { campaign_id: body } : body),

  getMyCampaigns: () =>
    api.get("/my_campaigns"),

  campaignResponse: (campaign_id: number, response: "accept" | "reject") =>
    api.postForm("/campaign_response", { campaign_id, response }),

  getApplicationStatus: (campaign_id: number) =>
    api.get(`/campaign_application_status?campaign_id=${campaign_id}`),
};
