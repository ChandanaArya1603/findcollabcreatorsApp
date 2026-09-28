import { api } from "@/lib/api";

export const creditService = {
  getDashboard: () => api.get("/credit_dashboard"),
  getCosts: () => api.get("/credit_costs"),
  getPackages: () => api.get("/credit_packages"),
  getTransactions: (page = 1) => api.get(`/credit_transactions?page=${page}`),
  getCampaignCost: (campaign_id: number | string) =>
    api.get(`/campaign_credit_cost?campaign_id=${encodeURIComponent(String(campaign_id))}`),
  getBrandContactStatus: (campaign_id: number | string) =>
    api.get(`/brand_contact_status?campaign_id=${encodeURIComponent(String(campaign_id))}`),
  viewBrandContact: (campaign_id: number | string) =>
    api.postForm("/view_brand_contact", { campaign_id }),
};

/** Safely read the first defined value from a list of dotted paths. */
export const pick = (obj: any, ...paths: string[]): any => {
  for (const p of paths) {
    const v = p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

export const toNum = (v: any, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
