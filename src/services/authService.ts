import { api } from "@/lib/api";

export const authService = {
  login: (email: string, password: string) =>
    api.post("/login", { email, password }),

  register: (data: Record<string, any>) =>
    api.post("/register_influencer", data),

  verifyAccount: (verify_code: string, user_id: number) =>
    api.post("/verify_account", { verify_code, user_id }),

  resendVerification: (email: string) =>
    api.post("/resend_verification", { email }),

  forgotPassword: (email: string) =>
    api.post("/forgot_password", { email }),

  verifyResetToken: (reset_token: string, user_id: number) =>
    api.post("/verify_reset_token", { reset_token, user_id }),

  resetPassword: (data: { user_id: number; reset_token: string; password: string; confirm_password: string }) =>
    api.post("/reset_password", data),

  logout: () => api.post("/logout"),

  checkEmailAvailability: (email: string) =>
    api.post("/check_email_availability", { email }),

  checkPhoneAvailability: (mobile: string) =>
    api.post("/check_phone_availability", { mobile }),

  checkInstagramAvailability: (instagram_username: string) =>
    api.post("/check_instagram_availability", { instagram_username }),

  checkYoutubeAvailability: (youtube_username: string) =>
    api.post("/check_youtube_availability", { youtube_username }),

  checkLinkedinAvailability: (linkedin_username: string) =>
    api.post("/check_linkedin_availability", { linkedin_username }),
};
