import { api } from "@/lib/api";

export const onboardingService = {
  updateSocialAccounts: (d: { instagram_username: string; youtube_username: string; linkedin_username: string; primary_account: string }) =>
    api.postForm("/update_social_accounts", d),

  updateCommercials: (d: {
    barter_campaign: "yes" | "no";
    instagram_details: string;
    youtube_details: string;
    linkedin_details: string;
    content_writing_details: string;
  }) => api.postForm("/update_commercials", d),

  addProject: (brand_name: string, collaboration_link: string) =>
    api.postForm("/add_project", { brand_name, collaboration_link }),

  deleteProject: (project_id: number | string) =>
    api.postForm("/delete_project", { project_id }),

  getProfileCompletion: () => api.get("/profile_completion"),
};
