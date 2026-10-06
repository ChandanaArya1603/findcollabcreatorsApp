import { api } from "@/lib/api";

export interface ProfilePayload {
  firstname: string; contactno: string; introduction: string; dob: string; gender: string;
  address: string; country: string | number; state: string | number; city: string | number;
  categories: number[]; languages: number[];
}

/**
 * /update_profile accepts partial payloads: only the fields sent are written.
 * categories[] / languages[] replace the whole set when sent.
 */
export const profileService = {
  getMediaKit: () =>
    api.get("/media_kit"),

  updateProfile: (changes: Partial<ProfilePayload>) => {
    const payload: Record<string, any> = { ...changes };
    for (const k of ["firstname", "contactno"] as const) {
      if (k in payload && !String(payload[k] ?? "").trim()) delete payload[k]; // never send empty
    }
    if (!Object.keys(payload).length) return Promise.resolve(null);
    return api.postForm("/update_profile", payload);
  },

  uploadProfileImage: (file: File) =>
    api.postForm("/upload_profile_image", { profile_image: file }),

  getMediaKitDownload: () =>
    api.get("/media_kit_download"),

  getMediaKitSettings: () =>
    api.get("/media_kit_settings"),

  /** Send theme and/or banner; returns the full settings block plus message. */
  updateMediaKitTheme: (changes: { theme?: string; banner?: string }) => {
    const body: Record<string, string> = {};
    if (changes.theme) body.theme = changes.theme;
    if (changes.banner) body.banner = changes.banner;
    return api.postForm("/update_media_kit_theme", body);
  },

  uploadBrandLogo: (logo: File) =>
    api.postForm("/upload_brand_logo", { logo }),

  deleteBrandLogo: (logoId: string | number) =>
    api.postForm("/delete_brand_logo", { logo_id: logoId }),

  getKycDetails: () =>
    api.get("/kyc_details"),

  uploadKyc: (body: Record<string, any>) =>
    api.postForm("/upload_kyc", body),

  updateBankUpi: (body: Record<string, any>) =>
    api.postForm("/update_bank_upi", body),

  getYoutubeData: () =>
    api.get("/youtube_data"),
};
