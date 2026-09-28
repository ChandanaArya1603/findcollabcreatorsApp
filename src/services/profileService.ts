import { api } from "@/lib/api";

export interface ProfilePayload {
  firstname: string; contactno: string; introduction: string; dob: string; gender: string;
  address: string; country: string | number; state: string | number; city: string | number;
}

const val = (v: any) => (v == null || String(v).toLowerCase() === "null" ? "" : String(v).trim());
const numId = (...vs: any[]) => { for (const v of vs) { const n = Number(v); if (n > 0) return n; } return ""; };

export const buildProfilePayload = (mk: any, edits: Partial<ProfilePayload>): ProfilePayload => {
  const ud = mk?.userDetail || {};
  const u = mk?.user || {};
  const current: ProfilePayload = {
    firstname: val(ud.firstname) || [val(u.fname), val(u.lname)].filter(Boolean).join(" "),
    contactno: val(ud.mobile),
    introduction: val(ud.introduction),
    dob: val(ud.dob),
    gender: val(ud.gender),
    address: val(ud.address),
    country: numId(ud.country_id, ud.country),
    state: numId(ud.state_id, ud.state),
    city: numId(ud.city_id, ud.city),
  };
  const merged: any = { ...current };
  for (const [k, v] of Object.entries(edits)) {
    if (k === "contactno") continue; // phone always comes from media_kit
    if (v !== undefined && v !== null && String(v).trim() !== "") merged[k] = typeof v === "string" ? v.trim() : v;
    else if (k === "address" || k === "introduction") merged[k] = ""; // optional fields may be cleared intentionally
  }
  return merged;
};

export const profileService = {
  getMediaKit: () =>
    api.get("/media_kit"),

  /**
   * The server overwrites every field on each call (missing keys become NULL),
   * so always send the complete set: current server values merged with edits.
   */
  updateProfile: (mediaKit: any, edits: Partial<ProfilePayload>) => {
    const payload = buildProfilePayload(mediaKit, edits);
    if (!payload.contactno) {
      return Promise.reject(new Error("Your phone number is missing from your profile, so it can't be saved safely. Please contact support."));
    }
    return api.postForm("/update_profile", payload);
  },

  uploadProfileImage: (file: File) =>
    api.postForm("/upload_profile_image", { profile_image: file }),

  updateCategories: (categories: number[]) =>
    api.postForm("/update_categories", { categories }),

  updateLanguages: (languages: number[]) =>
    api.postForm("/update_languages", { languages }),

  getMediaKitDownload: () =>
    api.get("/media_kit_download"),

  saveMediaKitTheme: (theme: string, banner: string) =>
    api.postForm("/save-media-kit-theme", { theme, banner }),

  getKycDetails: () =>
    api.get("/kyc_details"),

  getYoutubeData: () =>
    api.get("/youtube_data"),
};
