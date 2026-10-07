import React, { useState } from "react";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { toast } from "sonner";
const logoFull = { url: "/findcollab-logo-full.png" };

interface Props {
  onSwitch: () => void;
  onForgot?: () => void;
  onNeedVerify?: (info: { userId?: number; email: string }) => void;
  initialEmail?: string;
}

const LoginScreen: React.FC<Props> = ({ onSwitch, onForgot, onNeedVerify, initialEmail }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Logged in successfully!");
    } catch (err: any) {
      const d = err?.data || {};
      const msg = String(err?.message || "");
      if (d.not_verified && onNeedVerify) {
        onNeedVerify({ userId: Number(d.user_id) || undefined, email: String(d.email || email).trim() });
        return;
      }
      toast.error(msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoFull.url} alt="Findcollab" className="h-14 mx-auto mb-3 object-contain" />
          <p className="text-sm text-text-mid">Sign in to your influencer account</p>
        </div>
        <Card className="!p-5">
          <div className="flex flex-col gap-3.5">
            <GoogleSignInButton />
            <AppInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <AppInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
            {onForgot && (
              <button onClick={onForgot} className="text-xs font-bold text-primary self-end -mt-1.5">Forgot password?</button>
            )}
            <AppButton full onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </AppButton>

          </div>
        </Card>
        <p className="text-center text-xs text-text-mid mt-5">
          Don't have an account?{" "}
          <button onClick={onSwitch} className="text-primary font-bold">Register</button>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
