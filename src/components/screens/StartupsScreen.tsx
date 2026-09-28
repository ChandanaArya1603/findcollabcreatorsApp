import React, { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { startupService } from "@/services/startupService";
import { useCreditBalance } from "@/hooks/useAppData";
import { qk } from "@/lib/queryKeys";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Icon } from "../findcollab/Icon";
import { cn } from "@/lib/utils";

interface Startup {
  id: number;
  name: string;
  industry: string;
  desc: string;
  logo: string;
  pitch_sent: boolean;
  pitch_status: string;
}

interface Props {
  onBack: () => void;
  onOpenWallet?: () => void;
}

const K = {
  stats: ["startup_stats"] as const,
  industries: ["industries"] as const,
  daily: ["daily_pitch_status"] as const,
  gmail: ["gmail_status"] as const,
  list: (s: string, ind: number | null, hide: boolean) => ["startups_list", s, ind, hide] as const,
  pitched: (status: string) => ["pitched_startups", status] as const,
  detail: (id: number) => ["startup_detail", id] as const,
};

const normalizeStartup = (s: any): Startup => ({
  id: Number(s.id),
  name: s.name || s.startup_name || s.company_name || "",
  industry: String(s.industry?.name ?? s.industry ?? s.category ?? ""),
  desc: s.description || s.desc || s.about || "",
  logo: s.logo || s.logo_url || s.image || "",
  pitch_sent: s.pitch_sent === true || s.pitch_sent === 1 || s.pitch_sent === "1",
  pitch_status: String(s.pitch_status || ""),
});

const num = (v: any) => (v === undefined || v === null || v === "" ? "—" : String(v));
const truthy = (v: any) => v === true || v === 1 || v === "1";

/* ── How it works ─────────────────────────────── */
const HIW_KEY = "fc_how_it_works_collapsed";
const HIW_STEPS = [
  "Search or pick an industry to find brands that fit your niche.",
  "Tap Send Pitch and write a few lines on why you're a good fit. Your Media Kit is attached automatically.",
  "Your pitch goes from your connected Gmail, so brands reply straight to your inbox.",
];
const HIW_FOOTER = "Your first pitch each day is free. After that, each pitch costs 10 credits.";

const HowItWorksCard: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(HIW_KEY) === "1"; } catch { return false; }
  });
  const dismiss = () => { setCollapsed(true); try { localStorage.setItem(HIW_KEY, "1"); } catch { /* */ } };
  const expand = () => { setCollapsed(false); try { localStorage.removeItem(HIW_KEY); } catch { /* */ } };

  if (collapsed) {
    return (
      <div className="px-4 pt-3">
        <button type="button" onClick={expand}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-light border border-border">
          <Icon name="campaign" size={14} className="text-primary" />
          <span className="text-xs font-bold text-primary">How it works</span>
          <Icon name="chevD" size={14} className="text-primary ml-auto" />
        </button>
      </div>
    );
  }
  return (
    <div className="px-4 pt-3">
      <div className="rounded-2xl bg-primary-light border border-primary-mid p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-black text-foreground leading-tight">Pitch brands directly</p>
          <button type="button" onClick={dismiss} aria-label="Dismiss how it works"
            className="shrink-0 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center text-[10px] leading-none text-muted-foreground">✕</button>
        </div>
        <ol className="flex flex-col gap-2 mb-2.5">
          {HIW_STEPS.map((step, i) => (
            <li key={step} className="flex gap-2 items-start">
              <span className="shrink-0 w-4 h-4 mt-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-primary font-semibold border-t border-border pt-2 leading-relaxed">{HIW_FOOTER}</p>
      </div>
    </div>
  );
};

/* ── Sheet wrapper ────────────────────────────── */
const Sheet: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[200]">
    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
    <div className="absolute inset-0 flex items-center justify-center p-5 pointer-events-none">
      <div className="bg-card rounded-[20px] p-5 shadow-2xl w-full max-w-[350px] max-h-[85vh] overflow-y-auto pointer-events-auto">
        <div className="w-9 h-1 rounded-full bg-border mx-auto mb-4" />
        {children}
      </div>
    </div>
  </div>
);

const StartupsScreen: React.FC<Props> = ({ onBack, onOpenWallet }) => {
  const qc = useQueryClient();
  const [view, setView] = useState<"discover" | "mine">("discover");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [industryId, setIndustryId] = useState<number | null>(null);
  const [hidePitched, setHidePitched] = useState(false);
  const [pitchStatusFilter, setPitchStatusFilter] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [pitchTarget, setPitchTarget] = useState<Startup | null>(null);
  const [subject, setSubject] = useState("Collaboration proposal");
  const [pitchMsg, setPitchMsg] = useState(
    "Hi there,\n\nI'm reaching out to explore potential collaboration opportunities.\n\nLooking forward to connecting!"
  );
  const [sending, setSending] = useState(false);
  const [pitchError, setPitchError] = useState<{ required: any; balance: any } | null>(null);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const credit = useCreditBalance();
  const stats = useQuery({ queryKey: K.stats, queryFn: () => startupService.getStats() });
  const industriesQ = useQuery({ queryKey: K.industries, queryFn: () => startupService.getIndustries() });
  const daily = useQuery({ queryKey: K.daily, queryFn: () => startupService.getDailyPitchStatus() });
  const gmail = useQuery({ queryKey: K.gmail, queryFn: () => startupService.gmailStatus() });

  const list = useInfiniteQuery({
    queryKey: K.list(debouncedSearch, industryId, hidePitched),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      startupService.getStartups({
        page: pageParam as number,
        search: debouncedSearch || undefined,
        industry_id: industryId ?? undefined,
        filter: hidePitched ? "unpitched" : undefined,
      }),
    getNextPageParam: (last: any) => {
      const page = Number(last?.page || 1);
      const totalPages = Number(last?.total_pages || 1);
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const pitched = useQuery({
    queryKey: K.pitched(pitchStatusFilter),
    queryFn: () => startupService.getPitched({ page: 1, limit: 50, status: pitchStatusFilter || undefined }),
    enabled: view === "mine",
  });

  const detail = useQuery({
    queryKey: K.detail(detailId ?? 0),
    queryFn: () => startupService.getStartupDetail(detailId!),
    enabled: detailId !== null,
  });

  const refetchGmail = () => qc.invalidateQueries({ queryKey: K.gmail }).then(() =>
    qc.invalidateQueries({ queryKey: K.daily }));

  // Refresh Gmail status when the app/browser regains focus
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") refetchGmail(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    let handle: any;
    if (Capacitor.isNativePlatform()) {
      Browser.addListener("browserFinished", () => refetchGmail()).then((h) => (handle = h));
    }
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
      handle?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const g = gmail.data || {};
  const gmailConnected = truthy(g.connected) && !truthy(g.needs_reconnect);
  const d = daily.data || {};
  const freeUsed = truthy(d.free_pitch_used_today);
  const creditsRequired = Number(d.credits_required ?? (freeUsed ? d.credits_per_pitch ?? 10 : 0));
  const dailyBalance = d.credits_balance;
  const headerBalance = credit.data?.balance ?? credit.data?.credits_balance ?? dailyBalance;

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const res = await startupService.gmailConnect();
      const url = res?.auth_url;
      if (!url) throw new Error("No Gmail link received");
      if (Capacitor.isNativePlatform()) await Browser.open({ url });
      else window.open(url, "_blank");
    } catch (err: any) {
      if (truthy(err?.data?.connected)) {
        toast.success("Gmail is already connected");
        refetchGmail();
      } else toast.error(err?.message || "Could not start Gmail connection");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await startupService.gmailDisconnect();
      toast.success("Gmail disconnected");
    } catch (err: any) {
      toast.error(err?.message || "Could not disconnect Gmail");
    } finally {
      setConfirmDisconnect(false);
      refetchGmail();
    }
  };

  const openPitch = async (s: Startup) => {
    setPitchError(null);
    setPitchTarget(s);
    qc.invalidateQueries({ queryKey: K.daily });
  };

  const handleSendPitch = async () => {
    if (!pitchTarget || sending) return;
    if (!subject.trim() || !pitchMsg.trim()) {
      toast.error("Please enter a subject and message");
      return;
    }
    setSending(true);
    setPitchError(null);
    try {
      const res = await startupService.sendPitch({
        startup_id: pitchTarget.id,
        subject: subject.trim(),
        message: pitchMsg.trim(),
      });
      const via = res?.sent_from || res?.sent_via || d.gmail_email || "Gmail";
      toast.success(`Pitch sent to ${pitchTarget.name} via ${via}`);
      setSentIds((prev) => new Set(prev).add(pitchTarget.id));
      setPitchTarget(null);
      qc.invalidateQueries({ queryKey: K.stats });
      qc.invalidateQueries({ queryKey: K.daily });
      qc.invalidateQueries({ queryKey: ["pitched_startups"] });
      qc.invalidateQueries({ queryKey: ["startups_list"] });
      qc.invalidateQueries({ queryKey: qk.creditBalance });
      qc.invalidateQueries({ queryKey: ["credit_transactions"] });
    } catch (err: any) {
      const data = err?.data || {};
      if (truthy(data.insufficient_credits)) {
        setPitchError({ required: data.credits_required, balance: data.credits_balance });
        toast.error(`Need ${num(data.credits_required)} credits, you have ${num(data.credits_balance)}`);
      } else {
        toast.error(err?.message || "Failed to send pitch");
      }
      qc.invalidateQueries({ queryKey: K.daily });
    } finally {
      setSending(false);
    }
  };

  const industries: any[] = industriesQ.data?.industries || [];
  const startups: Startup[] = (list.data?.pages || []).flatMap((p: any) =>
    (p?.startups || p?.result || []).map(normalizeStartup)
  );
  const total = list.data?.pages?.[0]?.total ?? startups.length;

  // Infinite scroll sentinel
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [list.hasNextPage, list.isFetchingNextPage, list]);

  const s = stats.data || {};
  const statItems = [
    { label: "Total Startups", value: s.total_startups },
    { label: "Industries", value: s.industries },
    { label: "Pitches Sent", value: s.pitches_sent },
    { label: "Available to Pitch", value: s.available_to_pitch },
  ];

  const canSend = truthy(d.can_send_pitch);
  const pitches: any[] = pitched.data?.pitches || [];

  const renderGmailBar = () => (
    <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl bg-card border border-border flex items-center gap-2">
      <Icon name="msg" size={16} className="text-primary shrink-0" />
      {gmail.isLoading ? (
        <p className="text-xs text-muted-foreground">Checking Gmail…</p>
      ) : gmailConnected ? (
        <>
          <p className="text-xs text-foreground flex-1 min-w-0 truncate">
            Gmail connected: <span className="font-bold">{g.email || "—"}</span>
          </p>
          <button onClick={() => setConfirmDisconnect(true)} className="text-[11px] font-bold text-primary shrink-0">
            Disconnect
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground flex-1">
            {truthy(g.needs_reconnect) ? "Gmail needs reconnecting" : "Gmail not connected"}
          </p>
          <AppButton className="!px-3 !py-1.5 !text-[11px]" onClick={handleConnect} disabled={connecting}>
            {connecting ? "Opening…" : "Connect Gmail"}
          </AppButton>
        </>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5 relative">
      <BackHeader
        title="Discover Startups"
        onBack={onBack}
        right={
          <span className="text-[10px] font-extrabold text-primary whitespace-nowrap -ml-4">
            {num(headerBalance)} cr
          </span>
        }
      />

      <HowItWorksCard />
      {renderGmailBar()}

      {/* Credits */}
      <div className="mx-4 mt-3 p-3 rounded-xl bg-primary-light border border-border">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">Credits balance</p>
          <p className="text-sm font-black text-primary">{num(dailyBalance)}</p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Your first pitch each day is FREE. Additional pitches cost 10 credits each.
        </p>
        {daily.data && (
          <p className="text-[11px] font-bold text-primary mt-1">
            {!freeUsed ? "You can send your FREE pitch today" : `Next pitch costs ${creditsRequired} credits`}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        {statItems.map((it) => (
          <div key={it.label} className="bg-card rounded-xl border border-border p-3">
            <p className="text-lg font-black text-foreground">{num(it.value)}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{it.label}</p>
          </div>
        ))}
      </div>

      {/* Segment */}
      <div className="mx-4 mt-3 p-1 rounded-xl bg-muted flex">
        {(["discover", "mine"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={cn("flex-1 py-2 rounded-lg text-xs font-bold",
              view === v ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>
            {v === "discover" ? "Discover" : "My Pitches"}
          </button>
        ))}
      </div>

      {view === "discover" ? (
        <>
          <div className="px-4 pt-3 pb-2.5">
            <div className="relative mb-2.5">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon name="search" size={16} className="text-muted-foreground" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search startups or categories..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
              <button onClick={() => setIndustryId(null)}
                className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap",
                  industryId === null ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border")}>
                All Industries
              </button>
              {industries.map((ind) => {
                const count = Number(ind.startup_count || 0);
                const active = industryId === Number(ind.id);
                return (
                  <button key={ind.id} disabled={count === 0} onClick={() => setIndustryId(Number(ind.id))}
                    className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap",
                      active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border",
                      count === 0 && "opacity-40 cursor-not-allowed")}>
                    {ind.name} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">{num(total)} startups</p>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                <input type="checkbox" checked={hidePitched} onChange={(e) => setHidePitched(e.target.checked)}
                  className="accent-primary" />
                Hide pitched
              </label>
            </div>
          </div>

          <div className="px-4 flex flex-col gap-2.5">
            {list.isLoading && <p className="text-sm text-muted-foreground text-center py-10">Loading startups…</p>}
            {!list.isLoading && startups.length === 0 && (
              <div className="py-10 text-center">
                <Icon name="search" size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No startups found</p>
              </div>
            )}
            {startups.map((st) => {
              const sent = st.pitch_sent || sentIds.has(st.id);
              const failed = !sent && st.pitch_status === "failed";
              return (
                <Card key={st.id} className="!p-3.5" onClick={() => setDetailId(st.id)}>
                  <div className="flex gap-2.5 items-center mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center overflow-hidden shrink-0">
                      {st.logo ? <img src={st.logo} alt={st.name} className="w-full h-full object-cover" />
                        : <Icon name="startup" size={18} className="text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-foreground truncate">{st.name}</p>
                      {st.industry ? <Badge color="pink" sm>{st.industry}</Badge> : null}
                    </div>
                  </div>
                  {st.desc ? (
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {st.desc.length > 120 ? st.desc.substring(0, 120) + "…" : st.desc}
                    </p>
                  ) : null}
                  {sent ? (
                    <div className="flex justify-center"><Badge color="green">Sent ✓</Badge></div>
                  ) : (
                    <div onClick={(e) => e.stopPropagation()}>
                      <AppButton full icon="send" onClick={() => openPitch(st)}>
                        {failed ? "Retry pitch" : "Send Pitch"}
                      </AppButton>
                    </div>
                  )}
                </Card>
              );
            })}
            <div ref={sentinel} />
            {list.hasNextPage && (
              <AppButton variant="outline" full disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
                {list.isFetchingNextPage ? "Loading…" : "Load more"}
              </AppButton>
            )}
          </div>
        </>
      ) : (
        <div className="px-4 pt-3 flex flex-col gap-2.5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[["", "All"], ["sent", "Sent"], ["failed", "Failed"], ["pending", "Pending"]].map(([v, l]) => (
              <button key={l} onClick={() => setPitchStatusFilter(v)}
                className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold",
                  pitchStatusFilter === v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border")}>
                {l}
              </button>
            ))}
          </div>
          {pitched.isLoading && <p className="text-sm text-muted-foreground text-center py-10">Loading pitches…</p>}
          {!pitched.isLoading && pitches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No pitches yet</p>
          )}
          {pitches.map((p: any, i: number) => {
            const status = String(p.status || p.pitch_status || "");
            const color = status === "sent" ? "green" : status === "failed" ? "red" : "amber";
            return (
              <Card key={p.id ?? i} className="!p-3.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-foreground truncate">
                      {p.startup_name || p.name || "—"}
                    </p>
                    {p.subject && <p className="text-xs text-muted-foreground truncate">{p.subject}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {p.sent_at || p.created_at || p.date || "—"}
                    </p>
                  </div>
                  {status && <Badge color={color as any} sm>{status}</Badge>}
                </div>
                {status === "failed" && p.error_message && (
                  <p className="text-[11px] text-destructive mt-2">{p.error_message}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail sheet */}
      {detailId !== null && (
        <Sheet onClose={() => setDetailId(null)}>
          {detail.isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
          ) : (() => {
            const raw = detail.data?.startup || detail.data || {};
            const st = normalizeStartup({ ...raw, id: raw.id ?? detailId });
            const sent = st.pitch_sent || sentIds.has(st.id);
            return (
              <>
                <div className="flex gap-3 items-center mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center overflow-hidden shrink-0">
                    {st.logo ? <img src={st.logo} alt={st.name} className="w-full h-full object-cover" />
                      : <Icon name="startup" size={22} className="text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-foreground">{st.name || "—"}</p>
                    {st.industry && <Badge color="pink" sm>{st.industry}</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">
                  {st.desc || "No description yet"}
                </p>
                {sent ? (
                  <div className="flex justify-center"><Badge color="green">Sent ✓</Badge></div>
                ) : (
                  <AppButton full icon="send" onClick={() => { setDetailId(null); openPitch(st); }}>
                    Send Pitch
                  </AppButton>
                )}
              </>
            );
          })()}
        </Sheet>
      )}

      {/* Pitch sheet */}
      {pitchTarget && (
        <Sheet onClose={() => !sending && setPitchTarget(null)}>
          <p className="text-base font-black text-foreground mb-1">Pitch to {pitchTarget.name}</p>
          {daily.isFetching && !daily.data ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Checking…</p>
          ) : !truthy(d.gmail_connected) ? (
            <div className="py-3">
              <p className="text-sm font-bold text-foreground mb-1">Connect Gmail first</p>
              <p className="text-xs text-muted-foreground mb-4">
                Pitches are sent from your Gmail so brands reply straight to your inbox.
              </p>
              <div className="flex gap-2.5">
                <AppButton variant="outline" className="flex-1" onClick={() => setPitchTarget(null)}>Cancel</AppButton>
                <AppButton className="flex-[2]" onClick={handleConnect} disabled={connecting}>
                  {connecting ? "Opening…" : "Connect Gmail"}
                </AppButton>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3.5">
                Sending from <span className="font-bold text-foreground">{d.gmail_email || g.email || "—"}</span>
              </p>
              <div className="flex flex-col gap-2.5">
                <AppInput label="Subject" value={subject} onChange={setSubject} />
                <AppInput label="Message" value={pitchMsg} onChange={setPitchMsg} multiline />
              </div>
              <div className="py-2.5 px-3 bg-primary-light rounded-[10px] mt-2.5">
                <p className="text-[11px] text-primary font-semibold">🔗 Media Kit auto-attached</p>
                <p className="text-[11px] text-foreground font-bold mt-1">
                  {!freeUsed || creditsRequired === 0
                    ? "Free pitch"
                    : `${creditsRequired} credits · Balance after: ${
                        dailyBalance !== undefined ? Number(dailyBalance) - creditsRequired : "—"
                      }`}
                </p>
              </div>
              {pitchError && (
                <p className="text-[11px] text-destructive font-semibold mt-2">
                  Need {num(pitchError.required)} credits, you have {num(pitchError.balance)}
                </p>
              )}
              {(!canSend || pitchError) && (
                <AppButton variant="ghost" full className="mt-2.5" icon="wallet"
                  onClick={() => { setPitchTarget(null); onOpenWallet?.(); }}>
                  Buy Credits
                </AppButton>
              )}
              <div className="flex gap-2.5 mt-3.5">
                <AppButton variant="outline" className="flex-1" disabled={sending} onClick={() => setPitchTarget(null)}>
                  Cancel
                </AppButton>
                <AppButton className="flex-[2]" icon="send"
                  disabled={sending || !canSend || !subject.trim() || !pitchMsg.trim()}
                  onClick={handleSendPitch}>
                  {sending ? "Sending…" : "Send Pitch"}
                </AppButton>
              </div>
            </>
          )}
        </Sheet>
      )}

      {/* Disconnect confirm */}
      {confirmDisconnect && (
        <Sheet onClose={() => setConfirmDisconnect(false)}>
          <p className="text-base font-black text-foreground mb-1">Disconnect Gmail?</p>
          <p className="text-xs text-muted-foreground mb-4">You won't be able to send pitches until you reconnect.</p>
          <div className="flex gap-2.5">
            <AppButton variant="outline" className="flex-1" onClick={() => setConfirmDisconnect(false)}>Cancel</AppButton>
            <AppButton className="flex-1" onClick={handleDisconnect}>Disconnect</AppButton>
          </div>
        </Sheet>
      )}
    </div>
  );
};

export default StartupsScreen;
