import { api } from "@/lib/api";

export const campaignService = {
  getCampaigns: (page = 1) =>
    api.get(`/campaigns?page=${page}`),

  getCampaignDetail: (id: number) =>
    api.get(`/campaignDetail/${id}`),

  applyCampaign: (campaign_id: number) =>
    api.post("/apply_campaign", { campaign_id }),

  getMyCampaigns: () =>
    api.get("/my_campaigns"),

  campaignResponse: (campaign_id: number, response: "accept" | "reject") =>
    api.post("/campaign_response", { campaign_id, response }),

  getApplicationStatus: (campaign_id: number) =>
    api.get(`/campaign_application_status?campaign_id=${campaign_id}`),
};
