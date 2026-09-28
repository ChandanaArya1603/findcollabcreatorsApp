import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { qk } from "@/lib/queryKeys";

const patchMediaKit = (patch: (old: any) => any) =>
  queryClient.setQueryData(qk.mediaKit, (old: any) => (old ? patch(old) : old));

/** Refetch server profile completion (single source of truth). */
export const refreshCompletion = () => queryClient.invalidateQueries({ queryKey: ["profile_completion"] });

/** Put /update_profile's returned user/userDetail/userCategories/userLanguages into the media_kit cache. */
export const applyProfileResponse = (res: any) => {
  if (!res) return;
  patchMediaKit((old) => {
    const next = { ...old };
    if (res.user) next.user = { ...(old.user || {}), ...res.user };
    if (res.userDetail) next.userDetail = { ...(old.userDetail || {}), ...res.userDetail };
    if (Array.isArray(res.userCategories)) next.userCategories = res.userCategories;
    if (Array.isArray(res.userLanguages)) next.userLanguages = res.userLanguages;
    return next;
  });
};

export const applyCommercialsResponse = (res: any) => {
  if (res?.commercials) patchMediaKit((old) => ({ ...old, userCommercials: res.commercials }));
};

export const applyPhoto = (url: string) =>
  patchMediaKit((old) => ({ ...old, userDetail: { ...(old.userDetail || {}), img_name: url } }));

/** Show the social-save outcome; returns true when saved. */
export const reportSocialResult = (res: any) => {
  if (res?.fetch_incomplete) toast.warning(res?.message || "Saved, but we couldn't fetch data for one of your accounts. Check the username is correct and the account is public.");
  else toast.success(res?.message || "Social accounts saved");
};

export const validUrl = (s: string) => {
  try { const u = new URL(s); return /^https?:$/.test(u.protocol) && u.hostname.includes("."); } catch { return false; }
};
