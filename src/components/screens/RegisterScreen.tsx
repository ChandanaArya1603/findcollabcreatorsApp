import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { toast } from "sonner";
const logoMark = { url: "/collab-cluster-mark.png" };
const logoFull = { url: "/findcollab-logo-full.png" };

interface Props {
  onSwitch: () => void;
  onVerify?: (info: { userId?: number; email: string; notice?: string }) => void;
}

const Hint: React.FC<{ a: { s: Avail; msg?: string } }> = ({ a }) =>
  a.s === "idle" ? null : (
    <p className={`text-[11px] -mt-2.5 font-semibold ${a.s === "taken" ? "text-destructive" : a.s === "available" ? "text-success" : "text-muted-foreground"}`}>
      {a.s === "checking" ? "Checking…" : a.s === "available" ? "✓ available" : `✗ ${a.msg || "taken"}`}
    </p>
  );

const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);
const isPhone = (v: string) => v.replace(/\D/g, "").length >= 8;
const isHandle = (v: string) => v.length >= 2;

const RegisterScreen: React.FC<Props> = ({ onSwitch, onVerify }) => {
  const { register, loginWithGoogle } = useAuth();
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactno, setContactno] = useState("");
  const [referral, setReferral] = useState("");
  const [ig, setIg] = useState("");
  const [yt, setYt] = useState("");
  const [li, setLi] = useState("");
  const [primary, setPrimary] = useState<"instagram" | "youtube" | "linkedin">("instagram");
  const [loading, setLoading] = useState(false);
  const [followerError, setFollowerError] = useState("");
  const hasGoogle = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID) && !Capacitor.isNativePlatform();

  const aEmail = useAvailability(email, authService.checkEmailAvailability, isEmail);
  const aPhone = useAvailability(contactno, authService.checkPhoneAvailability, isPhone);
  const aIg = useAvailability(ig, authService.checkInstagramAvailability, isHandle);
  const aYt = useAvailability(yt, authService.checkYoutubeAvailability, isHandle);
  const aLi = useAvailability(li, authService.checkLinkedinAvailability, isHandle);
  const anyTaken = [aEmail, aPhone, aIg, aYt, aLi].some((a) => a.s === "taken");

  const handleRegister = async () => {
    if (!firstname.trim() || !email.trim() || !password.trim() || !contactno.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (anyTaken) {
      toast.error("Some details are already taken");
      return;
    }
    setLoading(true);
    setFollowerError("");
    const body: Record<string, any> = { firstname, email: email.trim(), password, contactno, primary_account: primary };
    if (referral.trim()) body.referral_code = referral.trim();
    if (ig.trim()) body.instagram_username = ig.trim();
    if (yt.trim()) body.youtube_username = yt.trim();
    if (li.trim()) body.linkedin_username = li.trim();
    try {
      const res = await register(body);
      const userId = Number(res?.user_id ?? res?.id ?? res?.user?.id) || undefined;
      const notice = res?.verification_email_sent === false ? "We couldn't send the email — tap Resend" : undefined;
      toast.success("Account created! Verify your email to continue.");
      onVerify?.({ userId, email: email.trim(), notice });
    } catch (err: any) {
      const d = err?.data || {};
      if (d.min_followers != null) {
        const m = `Your account needs at least ${d.min_followers} followers (you have ${d.your_followers ?? 0})`;
        setFollowerError(m);
        toast.error(m);
      } else toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential?: string) => {
    if (!credential) {
      toast.error("Google sign-up failed");
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success("Account ready! Signed in with Google.");
    } catch (err: any) {
      toast.error(err.message || "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center bg-background px-6 py-10 overflow-y-auto relative">
      <div aria-hidden className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-pulse [animation-delay:1s]" />

      <div className="w-full max-w-sm relative z-10 my-auto">
        <div className="text-center mb-8">
          <img
            src={logoMark.url}
            alt="Findcollab"
            className="h-16 w-16 mx-auto mb-3 object-contain drop-shadow-xl transition-transform hover:scale-105"
          />
          <img src={logoFull.url} alt="Findcollab" className="h-8 mx-auto mb-2 object-contain" />
          <p className="text-sm text-text-mid">Create your influencer account</p>
        </div>

        <Card className="!p-5">
          <div className="flex flex-col gap-3.5">
            <AppInput label="First Name" value={firstname} onChange={setFirstname} placeholder="John" />
            <AppInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Hint a={aEmail} />
            <AppInput label="Phone Number" value={contactno} onChange={setContactno} placeholder="+91 98765 43210" />
            <Hint a={aPhone} />
            <AppInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
            <AppInput label="Referral code (optional)" value={referral} onChange={setReferral} />
            <AppInput label="Instagram username (optional)" value={ig} onChange={setIg} placeholder="yourhandle" />
            <Hint a={aIg} />
            <AppInput label="YouTube username (optional)" value={yt} onChange={setYt} />
            <Hint a={aYt} />
            <AppInput label="LinkedIn username (optional)" value={li} onChange={setLi} />
            <Hint a={aLi} />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Primary account</label>
              <div className="flex gap-2">
                {(["instagram", "youtube", "linkedin"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPrimary(p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize ${primary === p ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {followerError && <p className="text-xs text-destructive font-semibold">{followerError}</p>}

            <AppButton full onClick={handleRegister} disabled={loading || anyTaken}>
              {loading ? "Creating account…" : "Create Account"}
            </AppButton>

            {hasGoogle && (
              <div>
                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-text-mid uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex justify-center mt-2">
                  <GoogleLogin
                    onSuccess={(res) => handleGoogle(res.credential)}
                    onError={() => toast.error("Google sign-up failed")}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    shape="pill"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-text-mid mt-5">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-primary font-bold story-link">Sign In</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
