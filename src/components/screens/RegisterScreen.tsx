import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { toast } from "sonner";
import logoMark from "@/assets/collab-cluster-mark.png.asset.json";
import logoFull from "@/assets/findcollab-logo-full.png.asset.json";

interface Props {
  onSwitch: () => void;
}

const RegisterScreen: React.FC<Props> = ({ onSwitch }) => {
  const { register, loginWithGoogle } = useAuth();
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactno, setContactno] = useState("");
  const [loading, setLoading] = useState(false);
  const hasGoogle = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleRegister = async () => {
    if (!firstname.trim() || !email.trim() || !password.trim() || !contactno.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await register({ firstname, email, password, contactno });
      if (res.verification_required) {
        toast.success("Registration successful! Check your email to verify.");
        onSwitch();
      } else {
        toast.success("Registered and logged in!");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
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
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10 overflow-hidden relative">
      {/* Animated backdrop blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-pulse [animation-delay:1s]" />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <img
            src={logoMark.url}
            alt="Findcollab"
            className="h-16 w-16 mx-auto mb-3 object-contain drop-shadow-xl hover-scale animate-scale-in"
            style={{ animation: "scale-in 0.5s ease-out, float 3s ease-in-out infinite 0.5s" }}
          />
          <img src={logoFull.url} alt="Findcollab" className="h-8 mx-auto mb-2 object-contain opacity-0 animate-fade-in [animation-delay:150ms] [animation-fill-mode:forwards]" />
          <p className="text-sm text-text-mid opacity-0 animate-fade-in [animation-delay:300ms] [animation-fill-mode:forwards]">
            Create your influencer account
          </p>
        </div>

        <Card className="!p-5 opacity-0 animate-fade-in [animation-delay:400ms] [animation-fill-mode:forwards]">
          <div className="flex flex-col gap-3.5">
            {[
              <AppInput key="fn" label="First Name" value={firstname} onChange={setFirstname} placeholder="John" />,
              <AppInput key="em" label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />,
              <AppInput key="ph" label="Phone Number" value={contactno} onChange={setContactno} placeholder="+91 98765 43210" />,
              <AppInput key="pw" label="Password" value={password} onChange={setPassword} placeholder="••••••••" />,
            ].map((field, i) => (
              <div
                key={i}
                className="opacity-0 animate-fade-in [animation-fill-mode:forwards]"
                style={{ animationDelay: `${500 + i * 90}ms` }}
              >
                {field}
              </div>
            ))}
            <div className="opacity-0 animate-fade-in [animation-fill-mode:forwards]" style={{ animationDelay: "900ms" }}>
              <AppButton full onClick={handleRegister} disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </AppButton>
            </div>

            {hasGoogle && (
              <div className="opacity-0 animate-fade-in [animation-fill-mode:forwards]" style={{ animationDelay: "1000ms" }}>
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

        <p className="text-center text-xs text-text-mid mt-5 opacity-0 animate-fade-in [animation-delay:1100ms] [animation-fill-mode:forwards]">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-primary font-bold story-link">Sign In</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
