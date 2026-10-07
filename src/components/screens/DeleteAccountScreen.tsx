import { PasswordInput } from "../findcollab/AppInput";
import React, { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BackHeader } from "../findcollab/BackHeader";
import { Card } from "../findcollab/Card";

const ITEMS = [
  "Profile and social data", "Media kit and brand logos", "KYC and bank details", "Campaign applications",
  "Offers and reviews", "Messages and notifications", "Credits", "Wallet history and withdrawals",
  "Referrals", "Consultations", "Support tickets", "Uploaded files",
];

interface Props { onBack: () => void; onOpenWallet: () => void }

const DeleteAccountScreen: React.FC<Props> = ({ onBack, onOpenWallet }) => {
  const { logout, user } = useAuth();
  const hasPw = user?.has_password; // undefined → unknown, keep the fallback checkbox
  const [password, setPassword] = useState("");
  const [noPwChecked, setNoPassword] = useState(false);
  const noPassword = hasPw === false || (hasPw === undefined && noPwChecked);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pwErr, setPwErr] = useState("");
  const [forfeit, setForfeit] = useState<{ wallet: any; credits: any } | null>(null);
  const [blockers, setBlockers] = useState<string[] | null>(null);

  const canDelete = agree && (noPassword || password.trim().length > 0) && !busy;

  const run = async (forfeitBalance: boolean) => {
    setBusy(true); setPwErr("");
    const body: Record<string, string> = { confirm: "DELETE" };
    if (!noPassword) body.password = password;
    if (forfeitBalance) body.forfeit_balance = "1";
    try {
      const res: any = await api.postForm("/delete_account", body);
      toast.success(res?.message || "Your account has been deleted");
      try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ }
      await logout().catch(() => {});
      try { localStorage.clear(); } catch { /* ignore */ }
      window.location.replace("/");
    } catch (e: any) {
      const d = e?.data || {};
      if (d.requires_forfeit) setForfeit({ wallet: d.wallet_balance, credits: d.credits_balance });
      else if (Array.isArray(d.blockers) && d.blockers.length) { setForfeit(null); setBlockers(d.blockers.map((b: any) => (typeof b === "string" ? b : b?.message || b?.title || JSON.stringify(b)))); }
      else {
        setForfeit(null);
        if (d.field === "password") setPwErr(e.message || "Incorrect password");
        toast.error(e?.message || "Could not delete account");
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <BackHeader title="Delete account" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {blockers ? (
          <Card className="!p-4">
            <p className="text-base font-black text-foreground mb-2">Your account can't be deleted yet</p>
            <ul className="list-disc pl-5 text-sm text-text-mid flex flex-col gap-1.5">
              {blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </Card>
        ) : forfeit ? (
          <Card className="!p-4 flex flex-col gap-3">
            <p className="text-base font-black text-foreground">You still have a balance</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-primary-light rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-primary-dark">Wallet</p>
                <p className="text-xl font-black text-primary">₹{Number(forfeit.wallet || 0).toLocaleString()}</p>
              </div>
              <div className="bg-warning-light rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-warning">Credits</p>
                <p className="text-xl font-black text-warning">{Number(forfeit.credits || 0).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-text-mid">If you delete now, this balance is lost forever.</p>
            <button onClick={onOpenWallet} className="w-full py-3 rounded-xl border-[1.5px] border-primary text-primary text-sm font-bold">Withdraw first</button>
            <button disabled={busy} onClick={() => run(true)} className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-black disabled:opacity-50">
              {busy ? "Deleting…" : "Delete anyway"}
            </button>
          </Card>
        ) : (
          <>
            <Card className="!p-4">
              <p className="text-sm font-black text-destructive mb-2">This permanently deletes:</p>
              <ul className="list-disc pl-5 text-xs text-text-mid flex flex-col gap-1">
                {ITEMS.map((i) => <li key={i}>{i}</li>)}
              </ul>
              <p className="text-xs font-bold text-foreground mt-3">This cannot be undone.</p>
            </Card>

            {hasPw !== false && <div>
              <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Password</label>
              <div className="mt-1.5"><PasswordInput value={password} disabled={noPassword} autoComplete="current-password"
                onChange={(v) => { setPassword(v); setPwErr(""); }} error={!!pwErr} /></div>
              {pwErr && <p className="text-[11px] text-destructive font-bold mt-1">{pwErr}</p>}
              {hasPw === undefined && <label className="flex items-center gap-2 text-xs text-text-mid mt-2">
                <input type="checkbox" checked={noPwChecked} onChange={(e) => { setNoPassword(e.target.checked); setPwErr(""); }} />
                I signed up with Google and don't have a password
              </label>}
            </div>}

            <label className="flex items-start gap-2 text-xs text-foreground">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
              <span>I understand my account and all its data will be permanently deleted.</span>
            </label>

            <button disabled={!canDelete} onClick={() => run(false)}
              className="w-full py-3.5 rounded-[14px] bg-destructive text-destructive-foreground text-sm font-black disabled:opacity-50">
              {busy ? "Deleting…" : "Delete my account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountScreen;
