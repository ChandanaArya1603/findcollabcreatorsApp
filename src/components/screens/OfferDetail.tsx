import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { offerService, type DeliverableRow } from "@/services/offerService";
import { validUrl } from "@/lib/profileSync";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import type { Offer } from "./OffersScreen";

interface Props { offer: Offer; onBack: () => void }

const PLATFORMS = ["Instagram", "YouTube", "LinkedIn"];
const CONTENT_TYPES = ["Reel", "Static Story", "Static Post", "Video Story", "Carousel", "Live", "UGC Content"];
const FILE_EXT = /\.(docx?|pdf|mp4|mov)$/i;
const MAX_FILE = 50 * 1024 * 1024;
const UNKNOWN = "This will be available after the next server update";

const errMsg = (e: any, fallback: string) => (/unknown method/i.test(e?.message || "") ? UNKNOWN : e?.message || fallback);
const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const statusColor = (s: string) => (/approv/i.test(s) ? "green" : /reject/i.test(s) ? "red" : "amber");
const arr = (v: any): any[] => (Array.isArray(v) ? v : []);

const parseJson = (raw: any): any[] => {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
  } catch { return []; }
};

/** Turn a campaign's platform details JSON into "2 Reel, 2 Static Post". */
const describe = (raw: any): string => {
  const parts: string[] = [];
  parseJson(raw).forEach((item) => {
    if (!item || typeof item !== "object") return;
    const vals = Object.values(item).filter((v) => v != null && String(v).trim() !== "" && String(v).toLowerCase() !== "null");
    const name = vals.find((v) => isNaN(Number(v)));
    const count = vals.find((v) => !isNaN(Number(v)));
    if (name) parts.push(`${count ?? 1} ${name}`);
    else Object.entries(item).forEach(([k, v]) => { if (Number(v) > 0) parts.push(`${v} ${k}`); });
  });
  return parts.join(", ");
};

const selCls = "p-2.5 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary min-w-0";

interface FormRow extends DeliverableRow { key: number }
interface LiveRow { key: number; platform: string; content_type: string; live_url: string }
let seq = 1;

const OfferDetail: React.FC<Props> = ({ offer: o, onBack }) => {
  const raw: any = (o as any).raw || {};
  const campaignId = o.id;
  const q = useQuery({ queryKey: ["offer_detail", campaignId], queryFn: () => offerService.getOfferDetail(campaignId), retry: false });
  const detail: any = q.data || {};
  const unavailable = q.isError && /unknown method/i.test((q.error as any)?.message || "");

  const deliverables = [
    ["Instagram", describe(raw.instagram_details)],
    ["YouTube", describe(raw.youtube_details)],
    ["LinkedIn", describe(raw.linkedin_details)],
  ].filter(([, d]) => d);

  const [rows, setRows] = useState<FormRow[]>([{ key: seq++, platform: "Instagram", type: "url", url: "" }]);
  const [progress, setProgress] = useState<number | null>(null);
  const [live, setLive] = useState<LiveRow[]>([{ key: seq++, platform: "Instagram", content_type: "Reel", live_url: "" }]);
  const [savingLive, setSavingLive] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const setRow = (k: number, p: Partial<FormRow>) => setRows((r) => r.map((x) => (x.key === k ? { ...x, ...p } : x)));
  const setLiveRow = (k: number, p: Partial<LiveRow>) => setLive((r) => r.map((x) => (x.key === k ? { ...x, ...p } : x)));

  const pickFile = (k: number, f?: File) => {
    if (!f) return;
    if (!FILE_EXT.test(f.name)) return toast.error("Allowed files: Word, PDF, MP4 or MOV");
    if (f.size > MAX_FILE) return toast.error("Each file must be 50 MB or less");
    setRow(k, { file: f });
  };

  const submitContent = async () => {
    for (const r of rows) {
      if (r.type === "url" && !validUrl((r.url || "").trim())) return toast.error("Enter a valid link starting with https://");
      if (r.type === "file" && !r.file) return toast.error("Choose a file for each file row");
    }
    setProgress(0);
    try {
      const res: any = await offerService.addDeliverables(campaignId, rows.map((r) => ({ ...r, url: r.url?.trim() })), setProgress);
      toast.success(res?.message || "Submitted for approval");
      setRows([{ key: seq++, platform: "Instagram", type: "url", url: "" }]);
      q.refetch();
    } catch (e) { toast.error(errMsg(e, "Could not submit content")); } finally { setProgress(null); }
  };

  const submitLive = async () => {
    if (live.some((r) => !validUrl(r.live_url.trim()))) return toast.error("Enter a valid live link for each row");
    setSavingLive(true);
    try {
      const res: any = await offerService.addLivePerformance(campaignId, live.map((r) => ({ ...r, live_url: r.live_url.trim() })));
      toast.success(res?.message || "Live performance added");
      setLive([{ key: seq++, platform: "Instagram", content_type: "Reel", live_url: "" }]);
      q.refetch();
    } catch (e) { toast.error(errMsg(e, "Could not add live performance")); } finally { setSavingLive(false); }
  };

  const del = async (kind: "d" | "l", id: any) => {
    setDeleting(`${kind}${id}`);
    try {
      if (kind === "d") await offerService.deleteDeliverable(id); else await offerService.deleteLivePerformance(id);
      toast.success("Deleted");
      q.refetch();
    } catch (e) { toast.error(errMsg(e, "Could not delete")); } finally { setDeleting(null); }
  };

  const submitReview = async () => {
    if (rating < 1) return toast.error("Pick a star rating");
    if (!review.trim()) return toast.error("Write a short review");
    setSavingReview(true);
    try {
      const res: any = await offerService.submitBrandReview(campaignId, rating, review.trim().slice(0, 1000));
      toast.success(res?.message || "Review submitted");
      setRating(0); setReview("");
      q.refetch();
    } catch (e) { toast.error(errMsg(e, "Could not submit review")); } finally { setSavingReview(false); }
  };

  const submitted = arr(detail.deliverables);
  const performance = arr(detail.live_performance);
  const reviews = arr(detail.reviews);

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="Offer Detail" onBack={onBack} />
      <div className="p-4 flex flex-col gap-3.5">
        <Card>
          <p className="text-base font-black text-foreground mb-1">{o.name || "—"}</p>
          <p className="text-xs text-text-mid mb-3.5">{o.brand || "—"}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[{ l: "Budget", v: o.budget || "—" }, { l: "Due date", v: o.due || "—" }].map((i) => (
              <div key={i.l} className="bg-background rounded-[10px] py-2.5 px-3">
                <p className="text-[10px] text-text-light uppercase tracking-wider mb-0.5">{i.l}</p>
                <p className="text-[15px] font-extrabold text-foreground">{i.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 py-2.5 px-3 bg-background rounded-[10px]">
            <p className="text-[10px] text-text-light uppercase tracking-wider mb-1">Payment status</p>
            <Badge color={o.sc}>{detail.payment_status || o.status || "—"}</Badge>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-2.5">Deliverables</p>
          {deliverables.length === 0 ? <p className="text-xs text-text-mid">No deliverables listed</p> : (
            <div className="flex flex-col gap-1.5">
              {deliverables.map(([p, d]) => (
                <div key={p} className="py-2.5 px-3 bg-primary-light rounded-[10px]">
                  <p className="text-[13px] text-primary font-semibold">{p} – {d}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {unavailable && (
          <div className="p-3 rounded-xl bg-warning-light text-xs font-bold text-foreground">{UNKNOWN}</div>
        )}

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-2.5">Submitted content</p>
          {q.isLoading ? <p className="text-xs text-text-mid">Loading…</p> : submitted.length === 0 ? <p className="text-xs text-text-mid">No content submitted yet</p> : (
            <div className="flex flex-col divide-y divide-border">
              {submitted.map((d: any) => {
                const st = String(d.status || "pending");
                const href = d.link || d.file_url || d.url;
                return (
                  <div key={d.id} className="py-2.5 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground capitalize">{d.platform || "—"}</span>
                      <span className="text-[10px] text-text-light uppercase">{d.type === "document" ? "File" : "URL"}</span>
                      <span className="flex-1" />
                      <Badge color={statusColor(st)} sm>{st}</Badge>
                    </div>
                    {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary break-all">{href}</a> : <p className="text-[11px] text-text-mid">—</p>}
                    {d.comment && <p className="text-[11px] text-text-mid">Brand: {d.comment}</p>}
                    {/pending/i.test(st) && (
                      <button onClick={() => del("d", d.id)} disabled={!!deleting} className="self-start text-[11px] font-bold text-destructive">
                        {deleting === `d${d.id}` ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-extrabold text-foreground">Submit content for approval</p>
            <p className="text-[11px] text-text-light">Links, or Word/PDF/MP4/MOV files up to 50 MB each</p>
          </div>
          {rows.map((r, i) => (
            <div key={r.key} className="flex flex-col gap-2 pb-3 border-b border-border last:border-0 last:pb-0">
              <div className="flex gap-2">
                <select value={r.platform} onChange={(e) => setRow(r.key, { platform: e.target.value })} className={`${selCls} flex-1`}>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
                <div className="flex rounded-xl bg-muted p-0.5">
                  {(["url", "file"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setRow(r.key, { type: t })}
                      className={`px-3 text-xs font-bold rounded-[10px] ${r.type === t ? "bg-primary text-primary-foreground" : "text-text-mid"}`}>{t === "url" ? "URL" : "File"}</button>
                  ))}
                </div>
              </div>
              {r.type === "url" ? (
                <input value={r.url || ""} placeholder="https://" onChange={(e) => setRow(r.key, { url: e.target.value })} className={selCls} />
              ) : (
                <label className="p-2.5 rounded-xl border-[1.5px] border-dashed border-border bg-card text-xs cursor-pointer">
                  <input type="file" className="hidden" accept=".doc,.docx,.pdf,.mp4,.mov,application/pdf,video/mp4,video/quicktime"
                    onChange={(e) => pickFile(r.key, e.target.files?.[0])} />
                  {r.file ? <span className="text-foreground font-semibold">{r.file.name} · {size(r.file.size)}</span> : <span className="text-primary font-bold">Choose file</span>}
                </label>
              )}
              {rows.length > 1 && (
                <button onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} className="self-end text-[11px] font-bold text-destructive">Remove row {i + 1}</button>
              )}
            </div>
          ))}
          <button onClick={() => setRows((x) => [...x, { key: seq++, platform: "Instagram", type: "url", url: "" }])} className="self-start text-xs font-bold text-primary">+ Add more</button>
          {progress !== null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
          )}
          <AppButton full icon="send" onClick={submitContent} disabled={progress !== null}>{progress !== null ? `Uploading… ${progress}%` : "Submit for approval"}</AppButton>
        </Card>

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-2.5">Live performance</p>
          {performance.length === 0 ? <p className="text-xs text-text-mid">No live links yet</p> : (
            <div className="flex flex-col divide-y divide-border">
              {performance.map((p: any) => (
                <div key={p.id} className="py-2.5 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground capitalize">{p.platform || "—"}</span>
                    <span className="text-[10px] text-text-light">{p.content_type || ""}</span>
                    <span className="flex-1" />
                    <button onClick={() => del("l", p.id)} disabled={!!deleting} className="text-[11px] font-bold text-destructive">{deleting === `l${p.id}` ? "Deleting…" : "Delete"}</button>
                  </div>
                  {p.live_url && <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary break-all">{p.live_url}</a>}
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {[["Views", p.views], ["Likes", p.likes], ["Comments", p.comments]].map(([l, v]) => (
                      <div key={l as string} className="text-center bg-background rounded-lg py-1.5">
                        <p className="text-sm font-black text-foreground">{v ?? "—"}</p>
                        <p className="text-[10px] text-text-light">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="text-sm font-extrabold text-foreground">Add live performance</p>
          {live.map((r, i) => (
            <div key={r.key} className="flex flex-col gap-2 pb-3 border-b border-border last:border-0 last:pb-0">
              <div className="flex gap-2">
                <select value={r.platform} onChange={(e) => setLiveRow(r.key, { platform: e.target.value })} className={`${selCls} flex-1`}>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
                <select value={r.content_type} onChange={(e) => setLiveRow(r.key, { content_type: e.target.value })} className={`${selCls} flex-1`}>
                  {CONTENT_TYPES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <input value={r.live_url} placeholder="Live URL" onChange={(e) => setLiveRow(r.key, { live_url: e.target.value })} className={selCls} />
              {live.length > 1 && (
                <button onClick={() => setLive((x) => x.filter((y) => y.key !== r.key))} className="self-end text-[11px] font-bold text-destructive">Remove row {i + 1}</button>
              )}
            </div>
          ))}
          <button onClick={() => setLive((x) => [...x, { key: seq++, platform: "Instagram", content_type: "Reel", live_url: "" }])} className="self-start text-xs font-bold text-primary">+ Add more</button>
          <AppButton full icon="send" onClick={submitLive} disabled={savingLive}>{savingLive ? "Saving…" : "Submit live links"}</AppButton>
        </Card>

        <Card className="flex flex-col gap-3">
          <p className="text-sm font-extrabold text-foreground">Leave a review for the brand</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}
                className={`text-2xl leading-none ${n <= rating ? "text-warning" : "text-muted-foreground/40"}`}>★</button>
            ))}
          </div>
          <textarea value={review} maxLength={1000} rows={3} placeholder="How was working with this brand?"
            onChange={(e) => setReview(e.target.value)} className={`${selCls} resize-none`} />
          <AppButton full onClick={submitReview} disabled={savingReview}>{savingReview ? "Saving…" : "Submit review"}</AppButton>
          {reviews.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              {reviews.map((rv: any, i: number) => (
                <div key={rv.id ?? i}>
                  <p className="text-sm text-warning">{"★".repeat(Math.max(0, Math.min(5, Number(rv.rating) || 0)))}</p>
                  <p className="text-xs text-foreground">{rv.review || rv.text || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OfferDetail;
