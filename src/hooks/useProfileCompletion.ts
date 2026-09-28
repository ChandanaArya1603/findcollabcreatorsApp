import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { onboardingService } from "@/services/onboardingService";
import { useMediaKit, invalidateCreditData } from "@/hooks/useAppData";
import { useAuth } from "@/contexts/AuthContext";
import { getProfilePhoto } from "@/lib/profilePhoto";

export type StepKey = "basic" | "photo" | "social" | "commercials" | "projects";
export const STEP_KEYS: StepKey[] = ["basic", "photo", "social", "commercials", "projects"];

const has = (v: any) => v !== undefined && v !== null && String(v).trim() !== "" && String(v).toLowerCase() !== "null" && String(v) !== "0";
const truthy = (v: any) => v === true || v === 1 || v === "1" || v === "true" || v === "yes";

const parseArr = (raw: any): any[] => {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
  } catch {
    return [];
  }
};

export const computeFromMediaKit = (mk: any, user?: any, userDetail?: any): Record<StepKey, boolean> => {
  const ud = mk?.userDetail || {};
  const basic =
    has(ud.dob) && has(ud.gender) && has(ud.country) && has(ud.city) &&
    Array.isArray(mk?.userCategories) && mk.userCategories.length > 0 &&
    Array.isArray(mk?.userLanguages) && mk.userLanguages.length > 0;
  const photo = Boolean(getProfilePhoto(mk, user, userDetail));
  const social = [ud.insta_url, ud.youtube_url, ud.linkedin_url].some(has) || !!mk?.instagramData || !!mk?.youtubeData;
  const uc = mk?.userCommercials || {};
  const commercials = [
    ...parseArr(uc.instagram_details).map((r) => r?.instagramrate),
    ...parseArr(uc.youtube_details).map((r) => r?.youtuberate),
    ...parseArr(uc.linkedin_details).map((r) => r?.linkedinrate),
    ...parseArr(uc.content_writing_details).map((r) => r?.cost_per_coverage),
  ].some((r) => Number(r) > 0);
  const projects = Array.isArray(mk?.userProjects) && mk.userProjects.length > 0;
  return { basic, photo, social, commercials, projects };
};

export const useProfileCompletion = () => {
  const { data: mk, isLoading: mkLoading } = useMediaKit();
  const { user, userDetail } = useAuth();
  const server = useQuery({
    queryKey: ["profile_completion"],
    queryFn: () => onboardingService.getProfileCompletion(),
    retry: false,
  });
  const s: any = server.data;
  const fromServer = s && s.steps && typeof s.steps === "object";
  const steps: Record<StepKey, boolean> = fromServer
    ? (Object.fromEntries(STEP_KEYS.map((k) => [k, truthy(s.steps[k])])) as Record<StepKey, boolean>)
    : computeFromMediaKit(mk, user, userDetail);
  const percent = fromServer && s.percent != null
    ? Math.round(Number(s.percent))
    : STEP_KEYS.filter((k) => steps[k]).length * 20;
  const ready = fromServer || (!!mk && !mkLoading) || (server.isError && !!mk);
  const rewardCredits = Number(s?.reward_credits ?? 10) || 10;
  const rewardClaimed = truthy(s?.reward_claimed);

  // One-time celebration when the reward flips to claimed.
  const prev = useRef<boolean | null>(null);
  useEffect(() => {
    if (!s) return;
    const key = "fc_profile_reward_celebrated";
    if (prev.current === false && rewardClaimed && !localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      toast.success(`+${rewardCredits} credits added`);
      invalidateCreditData();
    }
    prev.current = rewardClaimed;
  }, [s, rewardClaimed, rewardCredits]);

  return { steps, percent, ready, rewardCredits, rewardClaimed, mediaKit: mk };
};
