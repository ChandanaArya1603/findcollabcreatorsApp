import { api, sanitize } from "@/lib/api";

const BASE_URL = "https://findcollab.com/api";

export interface DeliverableRow { platform: string; type: "url" | "file"; url?: string; file?: File }

/** Multipart upload with progress (fetch can't report upload progress). */
const uploadWithProgress = (endpoint: string, fd: FormData, onProgress?: (pct: number) => void) =>
  new Promise<any>((resolve, reject) => {
    const token = api.getToken();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}${endpoint}${token ? `?token=${token}` : ""}`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onload = () => {
      const text = xhr.responseText || "";
      const i = text.indexOf("{");
      let json: any;
      try { json = sanitize(JSON.parse(text.slice(i))); } catch {
        return reject(new Error("The server couldn't save this right now. Please try again later."));
      }
      if (xhr.status >= 400 || json?.data?.status === false) {
        return reject(new Error(json?.data?.message || `Request failed (${xhr.status})`));
      }
      resolve(json.data);
    };
    xhr.send(fd);
  });

export const offerService = {
  getOfferDetail: (campaign_id: number | string) => api.get(`/offer_detail?campaign_id=${campaign_id}`),

  addDeliverables: (campaign_id: number | string, rows: DeliverableRow[], onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append("campaign_id", String(campaign_id));
    rows.forEach((r) => {
      fd.append("platform[]", r.platform);
      fd.append("type[]", r.type);
      if (r.type === "url") fd.append("url[]", r.url || "");
      else if (r.file) fd.append("file[]", r.file);
    });
    return uploadWithProgress("/add_deliverable", fd, onProgress);
  },

  deleteDeliverable: (deliverable_id: number | string) => api.postForm("/delete_deliverable", { deliverable_id }),

  addLivePerformance: (campaign_id: number | string, rows: { platform: string; content_type: string; live_url: string }[]) =>
    api.postForm("/add_live_performance", {
      campaign_id,
      platform: rows.map((r) => r.platform),
      content_type: rows.map((r) => r.content_type),
      live_url: rows.map((r) => r.live_url),
    }),

  deleteLivePerformance: (id: number | string) => api.postForm("/delete_live_performance", { id }),

  submitBrandReview: (campaign_id: number | string, rating: number, review: string) =>
    api.postForm("/submit_brand_review", { campaign_id, rating, review }),
};
