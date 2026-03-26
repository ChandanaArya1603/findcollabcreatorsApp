import { api } from "@/lib/api";

export const authService = {
  login: (email: string, password: string) =>
    api.postForm("/login", { email, password }),

  register: (data: Record<string, any>) =>
    api.postForm("/register_influencer", data),

  verifyAccount: (verify_code: string, user_id: number) =>
    api.postForm("/verify_account", { verify_code, user_id }),

  resendVerification: (email: string) =>
    api.postForm("/resend_verification", { email }),

  forgotPassword: (email: string) =>
    api.postForm("/forgot_password", { email }),

  verifyResetToken: (reset_token: string, user_id: number) =>
    api.postForm("/verify_reset_token", { reset_token, user_id }),

  resetPassword: (data: { user_id: number; reset_token: string; password: string; confirm_password: string }) =>
    api.postForm("/reset_password", data),

  logout: () => api.postForm("/logout", {}),

  checkEmailAvailability: (email: string) =>
    api.postForm("/check_email_availability", { email }),

  checkPhoneAvailability: (mobile: string) =>
    api.postForm("/check_phone_availability", { mobile }),

  checkInstagramAvailability: (instagram_username: string) =>
    api.postForm("/check_instagram_availability", { instagram_username }),

  checkYoutubeAvailability: (youtube_username: string) =>
    api.postForm("/check_youtube_availability", { youtube_username }),

  checkLinkedinAvailability: (linkedin_username: string) =>
    api.postForm("/check_linkedin_availability", { linkedin_username }),
};
