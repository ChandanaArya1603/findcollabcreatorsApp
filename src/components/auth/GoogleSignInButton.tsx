import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { GOOGLE_WEB_CLIENT_ID } from "@/config/google";

const COMING_SOON = "Google sign-in is coming soon. Please use email for now.";
const BRAND_ONLY = "This app is for creators. Please use findcollab.com for brand accounts.";

const GLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

let nativeReady: Promise<any> | null = null;
const nativeGoogleIdToken = async (): Promise<string> => {
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  if (!nativeReady) nativeReady = SocialLogin.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID } });
  await nativeReady;
  const res: any = await SocialLogin.login({ provider: "google", options: { scopes: ["email", "profile"] } });
  const token = res?.result?.idToken;
  if (!token) throw new Error("Google sign-in was cancelled");
  return token;
};

interface Props { getReferral?: () => string }

export const GoogleSignInButton: React.FC<Props> = ({ getReferral }) => {
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const native = Capacitor.isNativePlatform();

  const finish = async (idToken?: string) => {
    if (!idToken) return toast.error("Google sign-in failed");
    setBusy(true);
    try {
      await loginWithGoogle(idToken, getReferral?.().trim() || undefined);
      toast.success("Signed in with Google");
    } catch (e: any) {
      if (e?.comingSoon) toast(COMING_SOON);
      else if (e?.notCreator) toast.error(BRAND_ONLY);
      else toast.error(e?.message || "Google sign-in failed");
    } finally { setBusy(false); }
  };

  const onNative = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) return toast(COMING_SOON);
    try { await finish(await nativeGoogleIdToken()); }
    catch (e: any) { setBusy(false); if (!/cancel/i.test(String(e?.message))) toast.error(e?.message || "Google sign-in failed"); }
  };

  const face = (
    <span className="w-full h-12 rounded-[14px] border-[1.5px] border-border bg-card text-foreground text-sm font-bold flex items-center justify-center gap-2.5">
      {busy ? "Signing in…" : (<><GLogo /> Continue with Google</>)}
    </span>
  );

  return (
    <div className="flex flex-col gap-3">
      {native || !GOOGLE_WEB_CLIENT_ID ? (
        <button type="button" disabled={busy} onClick={native ? onNative : () => toast(COMING_SOON)} className="w-full disabled:opacity-60">{face}</button>
      ) : (
        <div className={`relative w-full ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {face}
          {/* Official Google button sits invisibly on top so the tap goes to Google Identity Services. */}
          <div className="absolute inset-0 opacity-[0.01] overflow-hidden flex justify-center">
            <GoogleLogin onSuccess={(r) => finish(r.credential)} onError={() => toast.error("Google sign-in failed")}
              width="400" size="large" text="continue_with" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-text-mid uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
};
