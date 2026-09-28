import React, { useState } from "react";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { AppButton } from "../../findcollab/AppButton";
import { AppInput } from "../../findcollab/AppInput";
import { Card } from "../../findcollab/Card";

interface Props {
  onBack: () => void;
}

const PwInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">{label}</label>
    <input type="password" value={value} onChange={(e) => onChange(e.target.value)}
      className="p-3 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary" />
  </div>
);

const ForgotPasswordScreen: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  const sendLink = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast.error("Enter a valid email");
    setLoading(true);
    try {
      const res: any = await authService.forgotPassword(email.trim());
      setUserId(Number(res?.user_id ?? res?.id ?? res?.user?.id) || null);
      toast.success("Reset link sent");
      setStep("reset");
    } catch (err: any) {
      toast.error(err?.message || "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!token.trim()) return toast.error("Enter the code from your email");
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const v: any = await authService.verifyResetToken(token.trim(), userId ?? 0);
      const uid = Number(v?.user_id ?? userId ?? 0);
      await authService.resetPassword({ user_id: uid, reset_token: token.trim(), password: pw, confirm_password: pw2 });
      toast.success("Password updated, please sign in");
      onBack();
    } catch (err: any) {
      toast.error(err?.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-black text-foreground text-center mb-1">
          {step === "email" ? "Forgot password" : "Reset password"}
        </h1>
        <p className="text-sm text-text-mid text-center mb-6">
          {step === "email" ? "We'll email you a reset code" : `Enter the code sent to ${email}`}
        </p>
        <Card className="!p-5">
          <div className="flex flex-col gap-3.5">
            {step === "email" ? (
              <>
                <AppInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <AppButton full onClick={sendLink} disabled={loading}>{loading ? "Sending…" : "Send reset link"}</AppButton>
              </>
            ) : (
              <>
                <AppInput label="Reset code" value={token} onChange={setToken} />
                <PwInput label="New password" value={pw} onChange={setPw} />
                <PwInput label="Confirm password" value={pw2} onChange={setPw2} />
                {pw2 && pw !== pw2 && <p className="text-[11px] text-destructive">Passwords don't match</p>}
                <AppButton full onClick={reset} disabled={loading}>{loading ? "Saving…" : "Reset password"}</AppButton>
                <button onClick={() => setStep("email")} className="text-xs font-bold text-primary">Resend link</button>
              </>
            )}
          </div>
        </Card>
        <p className="text-center text-xs text-text-mid mt-5">
          <button onClick={onBack} className="text-primary font-bold">Back to sign in</button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
