import React, { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { toast } from "sonner";
import { walletService } from "@/services/walletService";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { creditService, pick, toNum } from "@/services/creditService";
import {
  useWalletBalance,
  useCreditBalance,
  invalidateWalletData,
} from "@/hooks/useAppData";
import { addPendingPurchase, removePendingPurchase, retryPendingPurchases } from "@/lib/pendingPurchases";
import { Screen } from "../findcollab/Screen";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { AppButton } from "../findcollab/AppButton";

interface Transaction {
  date: string;
  transaction_id: string;
  brand: string;
  campaign: string;
  description: string;
  amount: string;
  type: string;
  status: string;
}

const PLANS = [
  { id: "credits_100", name: "Starter", credits: 100, price: "₹199", pop: false },
  { id: "credits_300", name: "Growth", credits: 300, price: "₹499", pop: true },
  { id: "credits_700", name: "Pro", credits: 700, price: "₹999", pop: false },
  { id: "credits_1500", name: "Power", credits: 1500, price: "₹1,999", pop: false },
];

const isNative = Capacitor.isNativePlatform();

const WalletScreen: React.FC = () => {
  const [tab, setTab] = useState("txns");
  void Pill;
  const [storePrices, setStorePrices] = useState<Record<string, string> | null>(null);
  const [storeFailed, setStoreFailed] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const { data: balRes } = useWalletBalance();
  const { data: creditRes } = useCreditBalance();
  const { data: dash } = useQuery({ queryKey: ["credit_dashboard"], queryFn: () => creditService.getDashboard() });
  const { data: costsRes } = useQuery({ queryKey: ["credit_costs"], queryFn: () => creditService.getCosts() });
  const { data: pkgRes } = useQuery({ queryKey: ["credit_packages"], queryFn: () => creditService.getPackages() });
  const history = useInfiniteQuery({
    queryKey: ["credit_history"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => creditService.getTransactions(pageParam as number),
    getNextPageParam: (last: any, all) => {
      const page = toNum(pick(last, "page", "current_page", "pagination.page"), all.length);
      const pages = toNum(pick(last, "total_pages", "pagination.total_pages", "last_page"), 0);
      if (pages) return page < pages ? page + 1 : undefined;
      return (last?.transactions || []).length >= 20 ? all.length + 1 : undefined;
    },
  });
  const loading = history.isLoading;

  const balance: number | null = balRes?.wallet_balance ?? null;
  const creditBal = toNum(pick(dash, "balance", "credits_balance", "current_balance") ?? creditRes?.balance, 0);
  const credits = {
    total: pick(dash, "balance", "credits_balance", "current_balance") ?? creditRes?.balance ?? "—",
    earned: pick(dash, "total_earned", "earned", "summary.total_earned") ?? creditRes?.total_earned ?? 0,
    spent: pick(dash, "total_spent", "spent", "summary.total_spent") ?? creditRes?.total_spent ?? 0,
  };
  const lowBalance = Boolean(pick(dash, "low_balance", "low_balance_warning")) || (dash && creditBal < 20);
  const expiring: any[] = pick(dash, "expiring_credits", "expiring", "expiring_soon") || [];
  const expiringList = Array.isArray(expiring) ? expiring : [];

  const txns: Transaction[] = (history.data?.pages || []).flatMap((pg: any) => pg?.transactions || []).map((t: any) => ({
    date: t.date || t.created_at || "",
    transaction_id: t.transaction_id || t.id || "",
    brand: t.brand || t.brand_name || "",
    campaign: t.campaign || t.campaign_name || "",
    description: t.description || "",
    amount: String(t.amount ?? t.credits ?? ""),
    type: t.type || t.transaction_type || "",
    status: t.status || "",
  }));

  const packages: any[] = pkgRes?.packages || [];
  const plans = packages.length
    ? packages.map((pk, i) => {
        const byCredits = PLANS.find((p) => p.credits === toNum(pk.credits));
        const byName = PLANS.find((p) => String(pk.name || "").toLowerCase().includes(p.name.toLowerCase()));
        const play = byCredits || byName || PLANS.find((p) => p.id === pk.id) || PLANS[i];
        return {
          id: play?.id || String(pk.id),
          name: String(pk.name || play?.name || "Credits"),
          credits: toNum(pk.credits, play?.credits || 0),
          price: pk.display_price != null ? `${pk.display_symbol || ""}${pk.display_price}` : play?.price || "—",
          validity: pk.validity_days ? `Valid ${pk.validity_days} days` : "",
          pop: play?.pop || false,
          playable: Boolean(play),
        };
      })
    : PLANS.map((p) => ({ ...p, validity: "Valid 180 days", playable: true }));

  const costRows: [string, string][] = (() => {
    const k = costsRes || {};
    const rows: [string, string][] = [];
    const tiers = pick(k, "apply_tiers", "application_tiers", "apply", "costs.apply_tiers");
    if (Array.isArray(tiers)) {
      tiers.forEach((t: any) => rows.push([String(t.label || t.name || t.tier || t.campaign_type || "Apply"), `${t.credits ?? t.cost ?? "—"} credits`]));
    } else if (tiers && typeof tiers === "object") {
      Object.entries(tiers).forEach(([n, v]: any) => rows.push([`Apply · ${n}`, `${typeof v === "object" ? v.credits ?? v.cost : v} credits`]));
    }
    const bmin = pick(k, "boost.min", "boost_min"); const bmax = pick(k, "boost.max", "boost_max");
    if (bmin != null || bmax != null) rows.push(["Boost application", `${bmin ?? 0}–${bmax ?? "—"} credits`]);
    const pitch = pick(k, "pitch_price", "startup_pitch", "credits_per_pitch", "pitch.credits");
    if (pitch != null) rows.push(["Startup pitch (after first free)", `${typeof pitch === "object" ? pitch.credits : pitch} credits`]);
    const unlock = pick(k, "contact_unlock_price", "brand_contact", "contact_unlock", "unlock_contact");
    if (unlock != null) rows.push(["Unlock brand contact", `${typeof unlock === "object" ? unlock.credits : unlock} credits`]);
    return rows;
  })();

  const typeIcon = (t: string) =>
    ({ purchase: "🛒", application: "📝", bonus: "🎁", referral: "🤝", collaboration: "💼", expiry: "⌛", startup_pitch: "🚀" } as Record<string, string>)[t] || "🪙";
  const isPlus = (t: Transaction) => ["purchase", "bonus", "referral", "collaboration", "credit"].includes(t.type) || t.amount.startsWith("+");

  const refreshCredits = useCallback(() => {
    invalidateWalletData();
  }, []);

  // Retry any purchases that were paid for but not yet confirmed by the server
  useEffect(() => {
    retryPendingPurchases().then((done) => {
      if (done > 0) {
        toast.success("Your credits have been added");
        refreshCredits();
      }
    });
  }, [refreshCredits]);

  // Load Google Play prices
  useEffect(() => {
    if (!isNative) return;
    NativePurchases.getProducts({
      productIdentifiers: PLANS.map((p) => p.id),
      productType: PURCHASE_TYPE.INAPP,
    })
      .then(({ products }) => {
        const map: Record<string, string> = {};
        (products || []).forEach((pr: any) => {
          if (pr?.identifier && pr?.priceString) map[pr.identifier] = pr.priceString;
        });
        if (Object.keys(map).length === 0) {
          setStoreFailed(true);
        } else {
          setStorePrices(map);
        }
      })
      .catch(() => setStoreFailed(true));
  }, []);

  const handleBuy = async (plan: { id: string; credits: number }) => {
    setBuyingId(plan.id);
    try {
      const txn: any = await NativePurchases.purchaseProduct({
        productIdentifier: plan.id,
        productType: PURCHASE_TYPE.INAPP,
        isConsumable: true,
        quantity: 1,
      });

      const payload = {
        product_id: plan.id,
        purchase_token: txn?.purchaseToken || txn?.transactionId || "",
        order_id: txn?.orderId || txn?.transactionId || "",
      };

      try {
        await walletService.verifyPlayPurchase(payload);
        removePendingPurchase(payload.purchase_token);
        toast.success(`${plan.credits} credits added`);
        refreshCredits();
      } catch {
        addPendingPurchase(payload);
        toast.success("Payment received, credits will be added shortly");
      }
    } catch (err: any) {
      const msg = String(err?.message || "").toLowerCase();
      if (msg.includes("cancel")) {
        toast("Purchase cancelled");
      } else {
        toast.error(err?.message || "Purchase failed");
      }
    } finally {
      setBuyingId(null);
    }
  };

  const displayBalance = balance !== null ? `₹${balance.toLocaleString()}` : "—";



  return (
    <Screen>
      <div className="px-4 pt-4 pb-3 bg-card">
        <h2 className="text-lg font-black text-foreground mb-4">Wallet</h2>
        <div className="bg-primary-light rounded-[20px] p-4 mb-3">
          <p className="text-[11px] text-primary-dark font-bold uppercase tracking-widest mb-1">Credits</p>
          <p className="text-4xl font-black text-primary">{credits.total}</p>
          <p className="text-[11px] text-text-mid mt-1">{credits.earned} earned • {credits.spent} spent</p>
          {lowBalance && (
            <div className="mt-3 p-2.5 rounded-xl bg-warning-light flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-foreground">⚠ Low balance — top up to keep applying</p>
              <AppButton className="!py-1.5 !px-3 !text-[11px] !rounded-[10px]" onClick={() => setTab("buy")}>Buy Credits</AppButton>
            </div>
          )}
          {expiringList.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold text-foreground mb-1">Expiring soon</p>
              {expiringList.map((e: any, i: number) => (
                <div key={i} className="flex justify-between text-[11px] text-text-mid">
                  <span>{e.credits ?? e.amount ?? "—"} credits</span>
                  <span>{e.expires_at || e.expiry_date || e.date || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="gradient-hero rounded-[20px] p-5 mb-3 relative overflow-hidden">
          <div className="absolute -right-5 -top-5 w-[100px] h-[100px] rounded-full bg-primary/10" />
          <p className="text-[11px] text-primary-foreground/50 uppercase tracking-widest mb-1">Available Balance</p>
          <p className="text-4xl font-black text-primary-foreground mb-1">{displayBalance}</p>
          <p className="text-[11px] text-primary-foreground/40 mb-4">Updated from your account</p>
          <AppButton icon="arrowUp" className="!py-2.5 !px-4 !text-xs !rounded-[10px]">Withdraw</AppButton>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          <div className="bg-success-light rounded-[14px] p-3">
            <p className="text-[10px] text-emerald-800 font-bold uppercase mb-0.5">KYC Status</p>
            <p className="text-base font-black text-success mt-1 mb-0.5">Verified ✓</p>
            <p className="text-[10px] text-text-mid">Bank connected</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3.5">
        <div className="flex gap-2 mb-3.5">
          {[["txns", "Credit history"], ["credits", "Costs"], ["buy", "Buy Credits"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
        </div>

        {tab === "txns" && (
          <div className="flex flex-col gap-2.5">
            {loading && <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>}
            {!loading && txns.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>}
            {!loading && txns.map((t, i) => (
              <Card key={i} className="!p-3.5">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex-1 mr-2.5">
                    <p className="text-xs font-semibold text-foreground leading-snug">{t.description || t.campaign || "Transaction"}</p>
                    {t.brand && <p className="text-[10px] text-text-mid mt-0.5">Brand: {t.brand}</p>}
                    {t.campaign && <p className="text-[10px] text-text-mid">Campaign: {t.campaign}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-[15px] font-black mb-1 ${t.type === "credit" ? "text-success" : "text-destructive"}`}>
                      {t.type === "credit" ? "+" : "-"}{t.amount}
                    </p>
                    <Badge color={t.type === "credit" ? "green" : "red"} sm>{t.type}</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-border">
                  <p className="text-[10px] text-text-light">{t.date}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-text-light">ID: {t.transaction_id}</p>
                    {t.status && <Badge color={t.status === "completed" ? "green" : "amber"} sm>{t.status}</Badge>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "credits" && (
          <div>
            <Card className="!bg-warning/5 !border-warning/20 mb-3.5">
              <p className="text-[13px] font-extrabold text-foreground mb-2.5">💳 How Credits Work</p>
              {[["Barter / Affiliate", "10 credits"], ["Paid (₹1K–5K)", "15 credits"], ["Paid (₹5K–10K)", "20 credits"], ["Paid (₹25K+)", "30 credits"]].map(([k, v]) => (
                <div key={k} className="flex justify-between mb-1.5">
                  <span className="text-xs text-text-mid">{k}</span>
                  <Badge color="amber" sm>{v}</Badge>
                </div>
              ))}
            </Card>
            <Card>
              <p className="text-[13px] font-extrabold text-foreground mb-2.5">🎁 Earn Bonus Credits</p>
              {[["Sign-up bonus", "20 credits"], ["Refer a friend", "50 credits"], ["Successful collab", "10 credits"]].map(([k, v]) => (
                <div key={k} className="flex justify-between mb-1.5">
                  <span className="text-xs text-text-mid">{k}</span>
                  <Badge color="green" sm>{v}</Badge>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === "buy" && (
          <div className="flex flex-col gap-3">
            {plans.map((p) => (
              <Card key={p.name} className={`!p-3.5 relative ${p.pop ? "!border-2 !border-primary" : ""}`}>
                {p.pop && (
                  <div className="absolute -top-2.5 right-3.5 bg-primary text-primary-foreground text-[9px] font-bold px-2.5 py-0.5 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-extrabold text-foreground mb-0.5">{p.name} Pack</p>
                    <p className="text-[22px] font-black text-primary mb-0.5">
                      {p.credits} <span className="text-xs text-text-light">credits</span>
                    </p>
                    <p className="text-[11px] text-text-light">Valid 180 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-foreground mb-2">{storePrices?.[p.id] || p.price}</p>
                    {isNative ? (
                      <AppButton
                        className="!py-2 !px-4 !text-xs !rounded-[10px]"
                        disabled={storeFailed || buyingId !== null}
                        onClick={() => handleBuy(p)}
                      >
                        {storeFailed ? "Unavailable" : buyingId === p.id ? "Processing…" : "Buy Now"}
                      </AppButton>
                    ) : (
                      <AppButton
                        className="!py-2 !px-3 !text-xs !rounded-[10px]"
                        onClick={() => window.open("https://findcollab.com", "_blank", "noopener")}
                      >
                        Buy on findcollab.com
                      </AppButton>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
};

export default WalletScreen;
