import { api } from "@/lib/api";

export const startupService = {
  getStartups: (search?: string) =>
    api.get(search ? `/startups?search=${encodeURIComponent(search)}` : "/startups"),

  sendPitch: (payload: { startup_id: number | string; message: string }) =>
    api.postForm("/send_pitch", {
      startup_id: payload.startup_id,
      message: payload.message,
      attach_media_kit: 1,
    }),
};
