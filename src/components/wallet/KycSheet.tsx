import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { profileService } from "@/services/profileService";
import { queryClient } from "@/lib/queryClient";
import { AppButton } from "../findcollab/AppButton";
import { Card } from "../findcollab/Card";

export type KycTab = "kyc" | "bank";
const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const statusInfo = (s: any) => {
  if (s == null || s === "") return { label: "Not submitted", cls: "bg-muted text-text-mid", n: -1 };
  const n = Number(s);
  if (n === 1) return { label: "Verified", cls: "bg-success-light text-success", n };
  if (n === 2) return { label: "Rejected", cls: "bg-destructive/10 text-destructive", n };
  return { label: "Under review", cls: "bg-warning-light text-warning", n: 0 };
};

const inputCls = (err?: boolean) =>
  `w-full p-3 rounded-xl border-[1.5px] ${err ? "border-destructive" : "border-border"} text-sm bg-card text-foreground outline-none focus:border-primary mt-1.5`;
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">{children}</label>
);

const FilePick: React.FC<{ label: string; existing?: string | null; file: File | null; onPick: (f: File | null) => void; err?: string }> = ({ label, existing, file, onPick, err }) => {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : existing || null), [file, existing]);
  useEffect(() => () => { if (file && preview) URL.revokeObjectURL(preview); }, [file, preview]);
  return (
    <div>
      <Label>{label}</Label>
      <label className={`mt-1.5 flex items-center gap-3 p-2.5 rounded-xl border-[1.5px] border-dashed ${err ? "border-destructive" : "border-border"} bg-card cursor-pointer`}>
        <div className="w-14 h-14 rounded-lg bg-primary-light overflow-hidden flex items-center justify-center shrink-0">
          {preview ? <img src={preview} alt={label} className="w-full h-full object-cover" /> : <span className="text-lg text-primary">+</span>}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{file ? file.name : existing ? "Uploaded · tap to replace" : "Choose image"}</p>
          <p className="text-[10px] text-text-light">JPG, PNG or WEBP · under 5 MB</p>
        </div>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0] || null; e.target.value = "";
          if (!f) return;
          if (!TYPES.includes(f.type)) return toast.error("Only JPG, PNG or WEBP images are allowed");
          if (f.size >= MAX) return toast.error("Image must be under 5 MB");
          onPick(f);
        }} />
      </label>
      {err && <p className="text-[11px] text-destructive font-bold mt-1">{err}</p>}
    </div>
  );
};

interface Props { data: any; initialTab?: KycTab; onClose: () => void }

const KycSheet: React.FC<Props> = ({ data, initialTab = "kyc", onClose }) => {
  const [tab, setTab] = useState<KycTab>(initialTab);
  const kyc = data?.kyc || null;
  const bank = data?.bankUPI || null;
  const files = data?.kycFiles || {};
  const kSt = statusInfo(kyc?.kyc_status);
  const bSt = statusInfo(bank?.status);

  // KYC form
  const [pan, setPan] = useState<File | null>(null);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [panNo, setPanNo] = useState(kyc?.pancard_number || "");
  const [aadharNo, setAadharNo] = useState(kyc?.aadhar_number || "");
  const [consent, setConsent] = useState(false);
  // Bank form
  const [b, setB] = useState({
    account_name: bank?.account_name || "", account_number: bank?.account_number || "", bank_name: bank?.bank_name || "",
    ifsc_code: bank?.ifsc_code || "", googlepay: bank?.googlepay || "", phonepe: bank?.phonepe || "", paypal: bank?.paypal || "",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<null | (() => void)>(null);

  const serverErr = (e: any) => {
    const msg = e?.message || "Could not save";
    if (e?.data?.field) setErrs({ [e.data.field]: msg });
    toast.error(msg);
  };
  const refresh = (patch: Record<string, any>) => {
    queryClient.setQueryData(["kyc_details"], (old: any) => ({ ...(old || {}), ...patch }));
    queryClient.invalidateQueries({ queryKey: ["kyc_details"] });
  };
  const guard = (approved: boolean, fn: () => void) => (approved ? setWarn(() => fn) : fn());

  const submitKyc = async () => {
    const e: Record<string, string> = {};
    const pn = panNo.toUpperCase().replace(/\s/g, "");
    const an = aadharNo.replace(/[\s-]/g, "");
    const firstPan = !kyc && !files.pancard;
    if (firstPan && !pan) e.pancard = "PAN card image is required";
    if (pn || firstPan) { if (!pn) e.pancard_number = "PAN number is required"; else if (!PAN_RE.test(pn)) e.pancard_number = "Enter a valid PAN (e.g. ABCDE1234F)"; }
    const aadharOnFile = !!(files.aadhar_front || files.aadhar_back || kyc?.aadhar_number);
    if (front || back || an || aadharOnFile) {
      if (!front && !files.aadhar_front) e.aadhar_front = "Aadhaar front is required";
      if (!back && !files.aadhar_back) e.aadhar_back = "Aadhaar back is required";
      if (!an) e.aadhar_number = "Aadhaar number is required"; else if (!/^\d{12}$/.test(an)) e.aadhar_number = "Aadhaar number must be 12 digits";
    }
    if (!consent) e.kyc_consent = "Please accept the consent to continue";
    setErrs(e);
    if (Object.keys(e).length) return;
    const body: Record<string, any> = { kyc_consent: "1" };
    if (pan) body.pancard = pan;
    if (front) body.aadhar_front = front;
    if (back) body.aadhar_back = back;
    if (pn && pn !== kyc?.pancard_number) body.pancard_number = pn; else if (firstPan) body.pancard_number = pn;
    if (an && an !== kyc?.aadhar_number) body.aadhar_number = an;
    setBusy(true);
    try {
      const res: any = await profileService.uploadKyc(body);
      refresh({ kyc: res?.kyc ?? kyc, kycFiles: res?.kycFiles ?? files });
      setPan(null); setFront(null); setBack(null); setConsent(false);
      toast.success(res?.message || "KYC submitted for review");
    } catch (err) { serverErr(err); } finally { setBusy(false); }
  };

  const submitBank = async () => {
    const e: Record<string, string> = {};
    const v = { ...b, account_number: b.account_number.replace(/\s/g, ""), ifsc_code: b.ifsc_code.toUpperCase().trim() };
    if (!v.account_name.trim()) e.account_name = "Required"; else if (v.account_name.length > 100) e.account_name = "Max 100 characters";
    if (!/^\d{6,18}$/.test(v.account_number)) e.account_number = "6 to 18 digits";
    if (!v.bank_name.trim()) e.bank_name = "Required"; else if (v.bank_name.length > 100) e.bank_name = "Max 100 characters";
    if (!IFSC_RE.test(v.ifsc_code)) e.ifsc_code = "Enter a valid IFSC (e.g. HDFC0001234)";
    for (const k of ["googlepay", "phonepe", "paypal"] as const) if (v[k].length > 50) e[k] = "Max 50 characters";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const res: any = await profileService.updateBankUpi(v);
      refresh({ bankUPI: res?.bankUPI ?? v });
      toast.success(res?.message || "Bank details submitted for review");
    } catch (err) { serverErr(err); } finally { setBusy(false); }
  };

  const Status: React.FC<{ s: ReturnType<typeof statusInfo>; remarks?: string }> = ({ s, remarks }) => (
    <div className="flex flex-col gap-1.5">
      <span className={`self-start text-[11px] font-black px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
      {s.n === 2 && remarks && <p className="text-xs text-destructive font-bold">Reason: {remarks}</p>}
      {s.n === 1 && <p className="text-[11px] text-text-mid">Changing these details sends them back for review and pauses withdrawals until re-approved.</p>}
    </div>
  );

  const bankField = (k: keyof typeof b, label: string, opts: { numeric?: boolean; upper?: boolean; max?: number } = {}) => (
    <div>
      <Label>{label}</Label>
      <input value={b[k]} maxLength={opts.max} inputMode={opts.numeric ? "numeric" : undefined}
        onChange={(e) => { let x = e.target.value; if (opts.numeric) x = x.replace(/\D/g, ""); if (opts.upper) x = x.toUpperCase(); setB({ ...b, [k]: x }); }}
        className={inputCls(!!errs[k])} />
      {errs[k] && <p className="text-[11px] text-destructive font-bold mt-1">{errs[k]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end" onClick={onClose}>
      <div className="w-full max-h-[92vh] overflow-y-auto bg-background rounded-t-[24px] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-black text-foreground">KYC & payouts</h3>
          <button onClick={onClose} className="text-xs font-bold text-text-mid">Close</button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(["kyc", "bank"] as KycTab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); setErrs({}); }}
              className={`py-2.5 rounded-xl text-xs font-black ${tab === t ? "bg-primary text-primary-foreground" : "bg-card text-text-mid border border-border"}`}>
              {t === "kyc" ? "KYC documents" : "Bank / UPI"}
            </button>
          ))}
        </div>

        {tab === "kyc" ? (
          <div className="flex flex-col gap-3">
            <Card className="!p-3"><Status s={kSt} remarks={kyc?.kyc_remarks} /></Card>
            <FilePick label="PAN card" existing={files.pancard} file={pan} onPick={setPan} err={errs.pancard} />
            <div>
              <Label>PAN number</Label>
              <input value={panNo} maxLength={12} onChange={(e) => setPanNo(e.target.value.toUpperCase())} placeholder="ABCDE1234F" className={inputCls(!!errs.pancard_number)} />
              {errs.pancard_number && <p className="text-[11px] text-destructive font-bold mt-1">{errs.pancard_number}</p>}
            </div>
            <p className="text-[11px] text-text-light">Aadhaar is optional. If you add it, front, back and number are all needed.</p>
            <div className="grid grid-cols-1 gap-3">
              <FilePick label="Aadhaar front" existing={files.aadhar_front} file={front} onPick={setFront} err={errs.aadhar_front} />
              <FilePick label="Aadhaar back" existing={files.aadhar_back} file={back} onPick={setBack} err={errs.aadhar_back} />
            </div>
            <div>
              <Label>Aadhaar number</Label>
              <input value={aadharNo} inputMode="numeric" maxLength={14} onChange={(e) => setAadharNo(e.target.value.replace(/[^\d\s-]/g, ""))} placeholder="1234 5678 9012" className={inputCls(!!errs.aadhar_number)} />
              {errs.aadhar_number && <p className="text-[11px] text-destructive font-bold mt-1">{errs.aadhar_number}</p>}
            </div>
            <label className="flex items-start gap-2 text-xs text-foreground">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[hsl(var(--primary))]" />
              <span>I confirm these documents are mine and consent to FindCollab verifying them for payouts.</span>
            </label>
            {errs.kyc_consent && <p className="text-[11px] text-destructive font-bold -mt-2">{errs.kyc_consent}</p>}
            <AppButton full disabled={busy} onClick={() => guard(kSt.n === 1, submitKyc)}>{busy ? "Uploading…" : "Submit KYC"}</AppButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Card className="!p-3"><Status s={bSt} remarks={bank?.bank_remarks} /></Card>
            {bankField("account_name", "Account holder name", { max: 100 })}
            {bankField("account_number", "Account number", { numeric: true, max: 18 })}
            {bankField("bank_name", "Bank name", { max: 100 })}
            {bankField("ifsc_code", "IFSC code", { upper: true, max: 11 })}
            {bankField("googlepay", "Google Pay (optional)", { max: 50 })}
            {bankField("phonepe", "PhonePe (optional)", { max: 50 })}
            {bankField("paypal", "PayPal (optional)", { max: 50 })}
            <AppButton full disabled={busy} onClick={() => guard(bSt.n === 1, submitBank)}>{busy ? "Saving…" : "Save bank details"}</AppButton>
          </div>
        )}
      </div>

      <AlertDialog open={!!warn} onOpenChange={(o) => !o && setWarn(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Change approved details?</AlertDialogTitle>
            <AlertDialogDescription>Your details will go back for review and withdrawals will stop until they're re-approved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { const f = warn; setWarn(null); f?.(); }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KycSheet;
