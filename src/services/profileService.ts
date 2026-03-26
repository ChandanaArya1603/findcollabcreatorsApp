import { api } from "@/lib/api";

export const profileService = {
  getMediaKit: () =>
    api.get("/media_kit"),

  updateProfile: (data: Record<string, any>) =>
    api.postForm("/update_profile", data),

  uploadProfileImage: (file: File) =>
    api.postForm("/upload_profile_image", { profile_image: file }),

  updateCategories: (categories: number[]) =>
    api.postForm("/update_categories", { categories }),

  updateLanguages: (languages: number[]) =>
    api.postForm("/update_languages", { languages }),

  getMediaKitDownload: () =>
    api.get("/media_kit_download"),

  getKycDetails: () =>
    api.get("/kyc_details"),
};
