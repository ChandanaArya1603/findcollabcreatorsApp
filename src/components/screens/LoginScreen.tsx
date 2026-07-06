import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { toast } from "sonner";
import logoFull from "@/assets/findcollab-logo-full.png.asset.json";

interface Props {
  onSwitch: () => void;
}

const LoginScreen: React.FC<Props> = ({ onSwitch }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const hasGoogle = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

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
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential?: string) => {
    if (!credential) {
      toast.error("Google sign-in failed");
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success("Logged in with Google!");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
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
            <AppInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <AppInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
            <AppButton full onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </AppButton>

            {hasGoogle && (
              <>
                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-text-mid uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={(res) => handleGoogle(res.credential)}
                    onError={() => toast.error("Google sign-in failed")}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="pill"
                  />
                </div>
              </>
            )}
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
