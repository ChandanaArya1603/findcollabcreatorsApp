import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { creditService, pick, toNum } from "@/services/creditService";
import { campaignService } from "@/services/campaignService";
import { invalidateCampaignData } from "@/hooks/useAppData";
import { useCampaignCost, getBoostAction } from "@/hooks/useCampaignCost";
import { walletService } from "@/services/walletService";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";

interface Props {
  campaignId: number;
  onClose: () => void;
  onApplied: () => void;
  onOpenWallet?: () => void;
}

export const ApplySheet: React.FC<Props> = ({ campaignId, onClose, onApplied, onOpenWallet }) => {
  const cost = useCampaignCost(campaignId);
  const costs = useQuery({ queryKey: ["credit_costs"], queryFn: () => creditService.getCosts() });
  const creditBal = useQuery({ queryKey: ["credit_balance"], queryFn: () => walletService.getCreditBalance() });

  const [quote, setQuote] = useState("");
  const [message, setMessage] = useState("");
  const [delivery, setDelivery] = useState("");
  const [boost, setBoost] = useState(0);
  const [sending, setSending] = useState(false);
  const [need, setNeed] = useState<{ r: any; b: any } | null>(null);

  const c: any = cost.data || {};
  const k = costs.data || {};
  const applyCost = toNum(c.cost, 0);
  // Prefer the dedicated /credit_balance reply (same source as Home/Wallet).
  const balance = toNum(
    pick(creditBal.data, "balance", "credits_balance", "credit_balance") ?? pick(k, "credits_balance", "current_balance", "balance")
  );
  const boostCfg = getBoostAction(k);
  const boostMin = boostCfg.min;
  const boostMax = boostCfg.max;
  const hasBoost = boostCfg.enabled && boostMax > 0;
  const total = applyCost + boost;
  const after = balance - total;
  const tooLow = !cost.isLoading && after < 0;

  const setBoostSafe = (v: number) => {
    if (v <= 0) return setBoost(0);
    setBoost(Math.min(boostMax, Math.max(boostMin || 1, v)));
  };
  const step = Math.max(1, Math.round((boostMax - boostMin) / 10) || 1);

  const submit = async () => {
    if (sending || tooLow) return;
    setSending(true);
    setNeed(null);
    const body: Record<string, any> = { campaign_id: campaignId };
    if (quote.trim()) body.quote = quote.trim();
    if (message.trim()) body.message = message.trim();
    if (delivery.trim()) body.delivery_time = delivery.trim();
    if (boost > 0) body.boost_credits = boost;
    try {
      const res: any = await campaignService.applyCampaign(body as any);
      const used = pick(res, "credits_deducted", "credits_used", "total_credits") ?? total;
      toast.success(`Applied — ${used} credits used`);
      invalidateCampaignData();
      onApplied();
    } catch (err: any) {
      const d = err?.data || {};
      if (d.insufficient_credits) {
        const r = pick(d, "credits_required", "required_credits");
        const b = pick(d, "credits_balance", "current_balance");
        setNeed({ r, b });
        toast.error(`Need ${r ?? "—"} credits, you have ${b ?? "—"}`);
      } else toast.error(err?.message || "Failed to apply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => !sending && onClose()} />
      <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-[22px] p-5 max-h-[88vh] overflow-y-auto">
        <div className="w-9 h-1 rounded-full bg-border mx-auto mb-4" />
        <p className="text-base font-black text-foreground mb-1">Apply to campaign</p>
        {cost.isLoading ? (
          <p className="text-xs text-muted-foreground mb-3">Checking cost…</p>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">
            Applying costs <b className="text-primary">{applyCost} credits</b> · Balance: <b>{balance}</b>
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Quote (optional)</label>
            <input
              type="number"
              inputMode="numeric"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="p-3 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary"
            />
          </div>
          <AppInput label="Message (optional)" value={message} onChange={setMessage} multiline />
          <AppInput label="Delivery time (optional)" value={delivery} onChange={setDelivery} placeholder="e.g. 7 days" />
        </div>

        {hasBoost && (
          <div className="mt-3 p-3 rounded-xl bg-primary-light">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">Boost</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setBoostSafe(boost - step)} className="w-7 h-7 rounded-full bg-card font-black text-primary">−</button>
                <span className="text-sm font-black text-primary w-10 text-center">{boost}</span>
                <button onClick={() => setBoostSafe(boost === 0 ? boostMin || 1 : boost + step)} className="w-7 h-7 rounded-full bg-card font-black text-primary">+</button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Boost ranks you higher in the brand's applicant list ({boostMin}–{boostMax} credits)
            </p>
          </div>
        )}

        <div className="mt-3 flex justify-between text-xs">
          <span className="text-muted-foreground">Total</span>
          <b className="text-foreground">{total} credits</b>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted-foreground">Balance after</span>
          <b className={after < 0 ? "text-destructive" : "text-foreground"}>{after}</b>
        </div>
        {need && (
          <p className="text-[11px] text-destructive font-semibold mt-2">
            Need {need.r ?? "—"} credits, you have {need.b ?? "—"}
          </p>
        )}
        {(tooLow || need) && (
          <AppButton variant="ghost" full className="mt-3" icon="wallet" onClick={() => { onClose(); onOpenWallet?.(); }}>
            Buy Credits
          </AppButton>
        )}
        <div className="flex gap-2.5 mt-3.5">
          <AppButton variant="outline" className="flex-1" disabled={sending} onClick={onClose}>Cancel</AppButton>
          <AppButton className="flex-[2]" icon="send" disabled={sending || tooLow || cost.isLoading} onClick={submit}>
            {sending ? "Applying…" : "Apply"}
          </AppButton>
        </div>
      </div>
    </div>
  );
};
