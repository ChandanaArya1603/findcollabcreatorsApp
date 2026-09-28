import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { creditService, pick } from "@/services/creditService";
import { invalidateCreditData } from "@/hooks/useAppData";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";

interface Props {
  campaignId: number;
  onOpenWallet?: () => void;
}

export const BrandContactCard: React.FC<Props> = ({ campaignId, onOpenWallet }) => {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["brand_contact_status", campaignId],
    queryFn: () => creditService.getBrandContactStatus(campaignId),
  });
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<any>(null);
  const [need, setNeed] = useState<{ r: any; b: any } | null>(null);

  const s = status.data || {};
  const unlocked = Boolean(s.already_unlocked);
  const price = pick(s, "credits_required", "required_credits") ?? "—";

  const load = async () => {
    setLoading(true);
    setNeed(null);
    try {
      const res: any = await creditService.viewBrandContact(campaignId);
      setContact(res.contact || res.brand || res);
      qc.invalidateQueries({ queryKey: ["brand_contact_status", campaignId] });
      invalidateCreditData();
    } catch (err: any) {
      const d = err?.data || {};
      if (d.insufficient_credits) {
        const r = pick(d, "required_credits", "credits_required");
        const b = pick(d, "current_balance", "credits_balance");
        setNeed({ r, b });
        toast.error(`Need ${r ?? "—"} credits, you have ${b ?? "—"}`);
      } else toast.error(err?.message || "Could not load contact");
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  const c = contact || {};
  const rows: [string, string | undefined, string | undefined][] = [
    ["Company", pick(c, "company_name", "company"), undefined],
    ["Owner", pick(c, "owner_name", "owner", "name"), undefined],
    ["Email", pick(c, "email", "company_email"), pick(c, "email", "company_email") && `mailto:${pick(c, "email", "company_email")}`],
    ["Phone", pick(c, "phone", "mobile", "phone_number"), pick(c, "phone", "mobile", "phone_number") && `tel:${pick(c, "phone", "mobile", "phone_number")}`],
    ["Website", pick(c, "website", "website_url"), pick(c, "website", "website_url")],
    ["Address", pick(c, "address"), undefined],
  ];

  return (
    <Card>
      <p className="text-sm font-extrabold text-foreground mb-2">Brand contact</p>
      {contact ? (
        <div className="flex flex-col gap-1.5">
          {rows.filter(([, v]) => v).map(([label, v, href]) => (
            <div key={label} className="flex justify-between gap-3 text-xs">
              <span className="text-text-mid shrink-0">{label}</span>
              {href ? (
                <a href={/^https?:|^mailto:|^tel:/.test(href) ? href : `https://${href}`} target="_blank" rel="noopener noreferrer"
                  className="text-primary font-semibold text-right break-all">{v}</a>
              ) : (
                <span className="text-foreground font-semibold text-right break-words">{v}</span>
              )}
            </div>
          ))}
        </div>
      ) : status.isLoading ? (
        <p className="text-xs text-muted-foreground">Checking…</p>
      ) : (
        <>
          <p className="text-xs text-text-mid mb-3">
            {unlocked ? "You've already unlocked this contact." : "Unlock the brand's email, phone and website."}
          </p>
          <AppButton full variant={unlocked ? "outline" : "primary"} disabled={loading}
            onClick={() => (unlocked ? load() : setConfirm(true))}>
            {loading ? "Loading…" : unlocked ? "View contact" : `Unlock contact · ${price} credits`}
          </AppButton>
          {need && (
            <AppButton variant="ghost" full className="mt-2" icon="wallet" onClick={onOpenWallet}>Buy Credits</AppButton>
          )}
        </>
      )}

      {confirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setConfirm(false)} />
          <div className="relative bg-card rounded-[20px] p-5 w-full max-w-[340px]">
            <p className="text-base font-black text-foreground mb-1">Unlock contact?</p>
            <p className="text-xs text-muted-foreground mb-4">This will use {price} credits. Continue?</p>
            <div className="flex gap-2.5">
              <AppButton variant="outline" className="flex-1" onClick={() => setConfirm(false)}>Cancel</AppButton>
              <AppButton className="flex-1" disabled={loading} onClick={load}>{loading ? "Unlocking…" : "Continue"}</AppButton>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
