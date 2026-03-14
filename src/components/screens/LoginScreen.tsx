import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { toast } from "sonner";

interface Props {
  onSwitch: () => void;
}

const LoginScreen: React.FC<Props> = ({ onSwitch }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
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
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-primary mb-1">Findcollab</h1>
          <p className="text-sm text-text-mid">Sign in to your influencer account</p>
        </div>
        <Card className="!p-5">
          <div className="flex flex-col gap-3.5">
            <AppInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <AppInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
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
