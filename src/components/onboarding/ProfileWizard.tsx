import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaKit } from "@/hooks/useAppData";
import { qk } from "@/lib/queryKeys";
import { applyCommercialsResponse, refreshCompletion, reportSocialResult } from "@/lib/profileSync";
import { handleFrom } from "@/lib/profilePhoto";
import { onboardingService } from "@/services/onboardingService";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { PastProjectsEditor } from "../profile/PastProjectsEditor";

type Platform = "instagram" | "youtube" | "linkedin";
interface Row { d: string; rate: string; remarks: string }

const DELIVERABLES: Record<Platform, string[]> = {
  instagram: ["Reel", "Post", "Story", "Carousel"],
  youtube: ["Dedicated video", "Integration", "Shorts"],
  linkedin: ["Post", "Article"],
};
const TITLES = ["Social accounts", "Your commercials", "Past projects"];

const parse = (raw: any): any[] => {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
  } catch {
    return [];
  }
};
const clean = (v: any) => (v == null || String(v).toLowerCase() === "null" ? "" : String(v));

interface Props { initialStep?: number; onClose: () => void; onSkip?: () => void }

const ProfileWizard: React.FC<Props> = ({ initialStep = 0, onClose, onSkip }) => {
  const qc = useQueryClient();
  const { data: mk } = useMediaKit();
  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);

  const [ig, setIg] = useState("");
  const [yt, setYt] = useState("");
  const [li, setLi] = useState("");
  const [primary, setPrimary] = useState<Platform>("instagram");

  const [barter, setBarter] = useState<"yes" | "no">("no");
  const [rows, setRows] = useState<Record<Platform, Row[]>>({ instagram: [], youtube: [], linkedin: [] });
  const [cpc, setCpc] = useState("");

  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    if (!mk) return;
    const ud: any = mk.userDetail || {};
    setIg((p) => p || handleFrom(mk.instagramData?.insta_handle) || handleFrom(ud.insta_url));
    setYt((p) => p || handleFrom(ud.youtube_url));
    setLi((p) => p || handleFrom(ud.linkedin_url));
    if (["instagram", "youtube", "linkedin"].includes(ud.primary_account)) setPrimary(ud.primary_account);
    const uc: any = mk.userCommercials || {};
    const b = String(uc.barter_campaign ?? ud.barter_campaign ?? "").toLowerCase();
    if (b === "yes" || b === "1") setBarter("yes");
    const map = (raw: any, p: Platform): Row[] =>
      parse(raw)
        .map((r) => ({ d: clean(r[`${p}_values`]), rate: clean(r[`${p}rate`]), remarks: clean(r[`${p}remarks`]) }))
        .filter((r) => r.d || r.rate);
    setRows({
      instagram: map(uc.instagram_details, "instagram"),
      youtube: map(uc.youtube_details, "youtube"),
      linkedin: map(uc.linkedin_details, "linkedin"),
    });
    setCpc(clean(parse(uc.content_writing_details)[0]?.cost_per_coverage));
  }, [mk]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.mediaKit });
    qc.invalidateQueries({ queryKey: ["profile_completion"] });
  };

  const run = async (fn: () => Promise<any>, apply?: (res: any) => void): Promise<"ok" | "error"> => {
    setSaving(true);
    try {
      const res = await fn();
      if (apply) { apply(res); refreshCompletion(); } else refresh();
      return "ok";
    } catch (err: any) {
      toast.error(err?.message || "Could not save");
      return "error";
    } finally {
      setSaving(false);
    }
  };

  const next = () => (step >= 2 ? onClose() : setStep(step + 1));

  const saveSocial = async (advance: boolean) => {
    const h = { instagram: handleFrom(ig), youtube: handleFrom(yt), linkedin: handleFrom(li) };
    const sent = (Object.keys(h) as Platform[]).filter((p) => h[p]);
    if (!sent.length) return toast.error("Add at least one username");
    const prim = sent.includes(primary) ? primary : sent[0];
    let result: any = null;
    const r = await run(async () => {
      result = await onboardingService.updateSocialAccounts({
        instagram_username: h.instagram, youtube_username: h.youtube, linkedin_username: h.linkedin, primary_account: prim,
      });
      return result;
    });
    if (r === "ok") reportSocialResult(result);
    if (r !== "error" && advance) next();
  };

  const saveCommercials = async (advance: boolean) => {
    const all = (Object.keys(rows) as Platform[]).flatMap((p) => rows[p]);
    if (all.some((r) => !r.d || !(Number(r.rate) > 0))) return toast.error("Each row needs a deliverable and a rate");
    const ser = (p: Platform) =>
      JSON.stringify(rows[p].map((r) => ({ [`${p}_values`]: r.d, [`${p}rate`]: r.rate, [`${p}remarks`]: r.remarks })));
    const r = await run(() =>
      onboardingService.updateCommercials({
        barter_campaign: barter,
        instagram_details: ser("instagram"),
        youtube_details: ser("youtube"),
        linkedin_details: ser("linkedin"),
        content_writing_details: JSON.stringify({ cost_per_coverage: cpc }),
      }), applyCommercialsResponse
    );
    if (r === "ok") toast.success("Commercials saved");
    if (r !== "error" && advance) next();
  };

  const saveProjects = () => {
    if (projectCount === 0) return toast.error("Add at least one project to complete this step");
    refresh();
    toast.success("Projects saved");
  };

  const finishProjects = () => {
    if (projectCount === 0) return toast.error("Add at least one project to complete this step");
    refresh();
    onClose();
  };

  const setRow = (p: Platform, i: number, patch: Partial<Row>) =>
    setRows((r) => ({ ...r, [p]: r[p].map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  const chip = (on: boolean) =>
    `flex-1 py-2 rounded-xl text-xs font-bold capitalize ${on ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`;
  const inputCls = "p-2.5 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary min-w-0";

  return (
    <div className="absolute inset-0 z-40 bg-background flex flex-col animate-slide-in">
      <div className="px-4 pt-4 pb-3 bg-card border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-base font-black text-foreground">Complete your profile</h1>
          <button onClick={() => { onSkip?.(); onClose(); }} className="text-xs font-bold text-text-mid">Skip</button>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>
        <p className="text-[11px] font-bold text-primary mt-1.5">Step {step + 1} of 3 · {TITLES[step]}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {step === 0 && (
          <Card className="!p-4 flex flex-col gap-3.5">
            <AppInput label="Instagram username" value={ig} onChange={setIg} placeholder="yourhandle" />
            <AppInput label="YouTube username" value={yt} onChange={setYt} />
            <AppInput label="LinkedIn username" value={li} onChange={setLi} />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Primary account</label>
              <div className="flex gap-2">
                {(["instagram", "youtube", "linkedin"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPrimary(p)} className={chip(primary === p)}>{p}</button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <Card className="!p-4">
              <p className="text-sm font-bold text-foreground mb-2">Open to barter collaborations?</p>
              <div className="flex gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <button key={v} onClick={() => setBarter(v)} className={chip(barter === v)}>{v}</button>
                ))}
              </div>
            </Card>
            {(Object.keys(DELIVERABLES) as Platform[]).map((p) => (
              <Card key={p} className="!p-4">
                <p className="text-sm font-black text-foreground capitalize mb-2">{p}</p>
                {rows[p].length === 0 && <p className="text-xs text-text-mid mb-2">No rates yet</p>}
                {rows[p].map((r, i) => (
                  <div key={i} className="flex flex-col gap-2 mb-3 pb-3 border-b border-border last:border-0">
                    <div className="flex gap-2">
                      <select value={r.d} onChange={(e) => setRow(p, i, { d: e.target.value })} className={`${inputCls} flex-1`}>
                        <option value="">Deliverable</option>
                        {DELIVERABLES[p].map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input value={r.rate} inputMode="numeric" placeholder="₹ Rate"
                        onChange={(e) => setRow(p, i, { rate: e.target.value.replace(/\D/g, "") })} className={`${inputCls} w-24`} />
                    </div>
                    <div className="flex gap-2">
                      <input value={r.remarks} placeholder="Remarks (optional)" maxLength={200}
                        onChange={(e) => setRow(p, i, { remarks: e.target.value })} className={`${inputCls} flex-1`} />
                      <button onClick={() => setRows((x) => ({ ...x, [p]: x[p].filter((_, j) => j !== i) }))}
                        className="text-xs font-bold text-destructive px-2">Remove</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setRows((x) => ({ ...x, [p]: [...x[p], { d: "", rate: "", remarks: "" }] }))}
                  className="text-xs font-bold text-primary">+ Add {p} rate</button>
              </Card>
            ))}
            <Card className="!p-4">
              <p className="text-sm font-black text-foreground mb-2">Content writing</p>
              <input value={cpc} inputMode="numeric" placeholder="₹ Cost per coverage"
                onChange={(e) => setCpc(e.target.value.replace(/\D/g, ""))} className={`${inputCls} w-full`} />
            </Card>
          </div>
        )}

        {step === 2 && <PastProjectsEditor onCountChange={setProjectCount} />}
      </div>

      <div className="p-4 bg-card border-t border-border flex gap-2">
        {step > 0 && (
          <AppButton variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>Back</AppButton>
        )}
        <AppButton variant="outline" disabled={saving}
          onClick={step === 0 ? () => saveSocial(false) : step === 1 ? () => saveCommercials(false) : saveProjects}>
          {saving ? "Saving…" : "Save"}
        </AppButton>
        <div className="flex-1">
          <AppButton full disabled={saving}
            onClick={step === 0 ? () => saveSocial(true) : step === 1 ? () => saveCommercials(true) : finishProjects}>
            {saving ? "Saving…" : step === 2 ? "Finish" : "Next"}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ProfileWizard;
