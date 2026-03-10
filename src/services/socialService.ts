import { api } from "@/lib/api";

export const socialService = {
  getInstagramData: () =>
    api.get("/instagram_data"),

  getYoutubeData: () =>
    api.get("/youtube_data"),

  getLinkedinData: () =>
    api.get("/linkedin_data"),

  linkedinCalculator: (username: string) =>
    api.post("/linkedin_calculator", { username }),
};
