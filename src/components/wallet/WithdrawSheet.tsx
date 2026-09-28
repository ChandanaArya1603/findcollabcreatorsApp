import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { walletService } from "@/services/walletService";
import { invalidateWalletData } from "@/hooks/useAppData";
import { queryClient } from "@/lib/queryClient";
import { AppButton } from "../findcollab/AppButton";
import { Card } from "../findcollab/Card";

export type Method = "bank" | "googlepay" | "phonepe" | "paypal";
export interface PayoutMethod { id: Method; label: string; detail: string }

const has = (v: any) => v != null && String(v).trim() !== "" && String(v).toLowerCase() !== "null";
const mask = (v: any, keep = 4) => {
  const s = String(v ?? "").trim();
  if (s.includes("@")) { const [u, d] = s.split("@"); return `${u.slice(0, 2)}${"•".repeat(Math.max(u.length - 2, 2))}@${d}`; }
  return s.length <= keep ? s : `${"•".repeat(Math.min(s.length - keep, 6))}${s.slice(-keep)}`;
};

/** Read payout methods and KYC status from the /kyc_details reply. */
export const readKyc = (res: any) => {
  const kyc = res?.kyc || {};
  const status = String(kyc.status ?? res?.kyc_status ?? res?.status_kyc ?? "").toLowerCase();
  const verified = ["verified", "approved", "1", "complete", "completed"].includes(status);
  const raw = res?.bankUPI ?? res?.bankupi ?? {};
  const b = Array.isArray(raw) ? raw[0] || {} : raw || {};
  const methods: PayoutMethod[] = [];
  if (has(b.account_number) || has(b.bank_name))
    methods.push({ id: "bank", label: "Bank", detail: [b.bank_name, has(b.account_number) ? mask(b.account_number) : ""].filter(Boolean).join(" · ") });
  if (has(b.googlepay)) methods.push({ id: "googlepay", label: "Google Pay", detail: mask(b.googlepay) });
  if (has(b.phonepe)) methods.push({ id: "phonepe", label: "PhonePe", detail: mask(b.phonepe) });
  if (has(b.paypal)) methods.push({ id: "paypal", label: "PayPal", detail: mask(b.paypal) });
  return { verified, status, methods };
};

interface Props { balance: number | null; kyc: any; onClose: () => void }

const MIN = 100;

const WithdrawSheet: React.FC<Props> = ({ balance, kyc, onClose }) => {
  const { verified, methods } = useMemo(() => readKyc(kyc), [kyc]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method | null>(methods[0]?.id ?? null);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ message: string; txn: string } | null>(null);

  const bal = balance ?? 0;
  const amt = Number(amount);
  const blocked = !verified || methods.length === 0;
  const error = !amount ? "" : !(amt > 0) ? "Enter an amount" : amt < MIN ? `Minimum ₹${MIN}` : amt > bal ? "Amount is more than your balance" : "";
  const canSubmit = !blocked && !!method && amt >= MIN && amt <= bal && !busy;
  const methodLabel = methods.find((m) => m.id === method)?.label || "";

  const submit = async () => {
    setConfirm(false);
    if (!method) return;
    setBusy(true);
    try {
      const res: any = await walletService.submitWithdrawal({ withdrawAmount: amt, withdrawMethod: method, withdrawReason: reason.trim() || undefined });
      setDone({ message: res?.message || "Withdrawal request submitted", txn: String(res?.transaction_id ?? res?.transactionId ?? "") });
      invalidateWalletData();
      queryClient.invalidateQueries({ queryKey: ["withdrawal_history"] });
    } catch (e: any) {
      toast.error(/unknown method/i.test(e?.message || "") ? "This will be available after the next server update" : e?.message || "Could not submit withdrawal");
    } finally { setBusy(false); }
  };

  const inputCls = "w-full p-3 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end" onClick={onClose}>
      <div className="w-full max-h-[90vh] overflow-y-auto bg-background rounded-t-[24px] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-black text-foreground">Withdraw earnings</h3>
          <button onClick={onClose} className="text-xs font-bold text-text-mid">Close</button>
        </div>

        {done ? (
          <Card className="!p-4 flex flex-col gap-2">
            <p className="text-sm font-black text-success">✓ {done.message}</p>
            {done.txn && <p className="text-xs text-text-mid">Transaction ID: <span className="font-bold text-foreground">{done.txn}</span></p>}
            <AppButton full className="mt-2" onClick={onClose}>Done</AppButton>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="bg-primary-light rounded-2xl p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-dark">Available balance</p>
              <p className="text-2xl font-black text-primary">{balance != null ? `₹${bal.toLocaleString()}` : "—"}</p>
            </div>

            {blocked && (
              <div className="p-3 rounded-xl bg-warning-light text-xs font-bold text-foreground">
                Complete KYC and add a bank/UPI account on findcollab.com to withdraw
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Amount (₹)</label>
              <input value={amount} inputMode="numeric" placeholder="0" disabled={blocked}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className={`${inputCls} mt-1.5`} />
              <p className={`text-[11px] mt-1 ${error ? "text-destructive font-bold" : "text-text-light"}`}>{error || `Minimum ₹${MIN}`}</p>
            </div>

            {methods.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Method</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {methods.map((m) => (
                    <button key={m.id} type="button" disabled={blocked} onClick={() => setMethod(m.id)}
                      className={`text-left p-2.5 rounded-xl border-[1.5px] ${method === m.id ? "border-primary bg-primary-light" : "border-border bg-card"}`}>
                      <p className={`text-xs font-black ${method === m.id ? "text-primary" : "text-foreground"}`}>{m.label}</p>
                      <p className="text-[10px] text-text-mid truncate">{m.detail || "—"}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Reason (optional)</label>
              <input value={reason} maxLength={200} disabled={blocked} onChange={(e) => setReason(e.target.value)} className={`${inputCls} mt-1.5`} />
            </div>

            <AppButton full icon="arrowUp" disabled={!canSubmit} className={!canSubmit ? "opacity-50" : ""} onClick={() => setConfirm(true)}>
              {busy ? "Submitting…" : "Withdraw"}
            </AppButton>
          </div>
        )}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw ₹{amt.toLocaleString()} to {methodLabel}?</AlertDialogTitle>
            <AlertDialogDescription>Your request will be sent for processing.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>Withdraw</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WithdrawSheet;
