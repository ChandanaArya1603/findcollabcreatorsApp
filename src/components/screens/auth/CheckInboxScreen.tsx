import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { authService } from "@/services/authService";
import { AppButton } from "../../findcollab/AppButton";
import { Card } from "../../findcollab/Card";

interface Props {
  email?: string;
  notice?: string;
  onSignIn: (email?: string) => void;
}

const CheckInboxScreen: React.FC<Props> = ({ email, notice, onSignIn }) => {
  const [cooldown, setCooldown] = useState(notice ? 0 : 60);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    if (!email) return toast.error("Email address missing");
    setSending(true);
    try {
      await authService.resendVerification(email);
      toast.success("Verification link sent");
      setCooldown(60);
    } catch (err: any) {
      toast.error(err?.message || "Could not resend the link");
    } finally {
      setSending(false);
    }
  };

  const openMail = () => {
    window.location.href = Capacitor.isNativePlatform() ? "mailto:" : "https://mail.google.com";
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-black text-foreground text-center mb-1">Check your inbox</h1>
        <p className="text-sm text-text-mid text-center mb-6">
          We've sent a verification link to <span className="font-bold text-foreground">{email || "your email"}</span>. Tap the link to activate your account, then sign in.
        </p>
        <Card className="!p-5 flex flex-col gap-3">
          {notice && (
            <p className="text-xs font-semibold text-foreground bg-warning-light rounded-xl p-2.5">{notice}</p>
          )}
          <AppButton full onClick={openMail}>Open email app</AppButton>
          <AppButton full variant="outline" onClick={() => onSignIn(email)}>I've verified, Sign in</AppButton>
          <button onClick={resend} disabled={cooldown > 0 || sending}
            className="w-full text-xs font-bold text-primary disabled:text-muted-foreground">
            {sending ? "Sending…" : cooldown > 0 ? `Resend link in ${cooldown}s` : "Resend link"}
          </button>
        </Card>
      </div>
    </div>
  );
};

export default CheckInboxScreen;
