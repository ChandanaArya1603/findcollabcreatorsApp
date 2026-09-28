import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "../../findcollab/AppButton";
import { Card } from "../../findcollab/Card";

interface Props {
  userId?: number;
  email?: string;
  notice?: string;
  onDone: () => void;
  onBack: () => void;
}

const VerifyScreen: React.FC<Props> = ({ userId, email, notice, onDone, onBack }) => {
  const { setAuthData } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(notice ? 0 : 60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) return toast.error("Enter the 6-digit code");
    if (!userId) return toast.error("Missing account details, please register or sign in again");
    setLoading(true);
    try {
      const res: any = await authService.verifyAccount(code, userId);
      if (res?.token) {
        const user = res.user ?? { id: res.user_id ?? userId, fname: res.fname ?? "", lname: res.lname ?? "", email: res.email ?? email ?? "", sign_up_type: "" };
        setAuthData({ token: res.token, user, userDetail: res.userDetail ?? res.user_detail ?? {} } as any);
        toast.success("Account verified");
      } else {
        toast.success("Account verified, please sign in");
        onDone();
      }
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return toast.error("Email address missing");
    try {
      await authService.resendVerification(email);
      toast.success("Code sent");
      setCooldown(60);
    } catch (err: any) {
      toast.error(err?.message || "Could not resend code");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-black text-foreground text-center mb-1">Verify your email</h1>
        <p className="text-sm text-text-mid text-center mb-6">
          Enter the 6-digit code sent to {email || "your email"}
        </p>
        <Card className="!p-5">
          {notice && (
            <p className="text-xs font-semibold text-foreground bg-warning-light rounded-xl p-2.5 mb-3">{notice}</p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            className="w-full text-center tracking-[0.5em] text-2xl font-black p-3 rounded-xl border-[1.5px] border-border bg-card text-foreground outline-none focus:border-primary mb-3.5"
          />
          <AppButton full onClick={verify} disabled={loading || code.length !== 6}>
            {loading ? "Verifying…" : "Verify"}
          </AppButton>
          <button
            onClick={resend}
            disabled={cooldown > 0}
            className="w-full text-xs font-bold text-primary mt-3 disabled:text-muted-foreground"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </Card>
        <p className="text-center text-xs text-text-mid mt-5">
          <button onClick={onBack} className="text-primary font-bold">Back to sign in</button>
        </p>
      </div>
    </div>
  );
};

export default VerifyScreen;
