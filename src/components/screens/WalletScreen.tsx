import { ListSkeleton, Shimmer } from "../findcollab/Skeleton";
import { CountUp } from "../findcollab/CountUp";
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
import WithdrawSheet, { readKyc } from "../wallet/WithdrawSheet";
import KycSheet, { statusInfo, KycTab } from "../wallet/KycSheet";
import { profileService } from "@/services/profileService";

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

  const [storePrices, setStorePrices] = useState<Record<string, string> | null>(null);
  const [storeFailed, setStoreFailed] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const { data: balRes } = useWalletBalance();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [kycTab, setKycTab] = useState<KycTab | null>(null);
  const kycQ = useQuery({ queryKey: ["kyc_details"], queryFn: () => profileService.getKycDetails(), retry: false });
  const kycInfo = readKyc(kycQ.data);
  const withdrawals = useInfiniteQuery({
    queryKey: ["withdrawal_history"],
    initialPageParam: 1,
    enabled: tab === "withdrawals",
    queryFn: ({ pageParam }) => walletService.getTransactions(pageParam as number, 10),
    getNextPageParam: (last: any, all) => {
      const rows = last?.transactions || last?.data || last?.result || [];
      return Array.isArray(rows) && rows.length >= 10 ? all.length + 1 : undefined;
    },
  });
  const wRows: any[] = (withdrawals.data?.pages || []).flatMap((pg: any) => {
    const r = pg?.transactions || pg?.data || pg?.result || [];
    return Array.isArray(r) ? r : [];
  });
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
  const lowBalance = Boolean(dash?.low_balance_warning);
  const expiringCredits = toNum(dash?.expiring_credits, 0);
  const expiringWarning = Boolean(dash?.expiring_warning);
  void creditBal;

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

  const costActions: any[] = Array.isArray(costsRes?.actions) ? costsRes.actions : [];
  const costLabel = (a: any) => {
    if (a?.action === "proposal_boost" && (a.min != null || a.max != null)) return `${a.min ?? 0}–${a.max ?? "—"} credits`;
    if (typeof a?.cost === "number" || /^\d+(\.\d+)?$/.test(String(a?.cost ?? ""))) return `${a.cost} credits`;
    return a?.cost != null && a.cost !== "" ? String(a.cost) : "—";
  };

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
          <p className="text-4xl font-black text-primary">{credits.total === "—" ? <Shimmer className="h-9 w-24" /> : Number.isFinite(Number(credits.total)) ? <CountUp id="wallet-credits" value={Number(credits.total)} /> : credits.total}</p>
          <p className="text-[11px] text-text-mid mt-1">{credits.earned} earned • {credits.spent} spent</p>
          {lowBalance && (
            <div className="mt-3 p-2.5 rounded-xl bg-warning-light flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-foreground">⚠ Low balance — top up to keep applying</p>
              <AppButton className="!py-1.5 !px-3 !text-[11px] !rounded-[10px]" onClick={() => setTab("buy")}>Buy Credits</AppButton>
            </div>
          )}
          {expiringWarning && (
            <div className="mt-3 p-2.5 rounded-xl bg-warning-light">
              <p className="text-[11px] font-bold text-foreground">⌛ {expiringCredits} credits expiring soon</p>
            </div>
          )}
        </div>
        <div className="gradient-hero rounded-[20px] p-5 mb-3 relative overflow-hidden">
          <div className="absolute -right-5 -top-5 w-[100px] h-[100px] rounded-full bg-primary/10" />
          <p className="text-[11px] text-primary-foreground/50 uppercase tracking-widest mb-1">Available Balance</p>
          <p className="text-4xl font-black text-primary-foreground mb-1">{displayBalance}</p>
          <p className="text-[11px] text-primary-foreground/40 mb-4">Updated from your account</p>
          <AppButton icon="arrowUp" className="!py-2.5 !px-4 !text-xs !rounded-[10px]" onClick={() => setWithdrawOpen(true)}>Withdraw</AppButton>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          <div className="bg-success-light rounded-[14px] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-success font-bold uppercase mb-0.5">KYC Status</p>
                <p className="text-xs font-bold mt-1">KYC: <span className={statusInfo(kycQ.data?.kyc?.kyc_status).cls + " px-2 py-0.5 rounded-full"}>{kycQ.isLoading ? "—" : statusInfo(kycQ.data?.kyc?.kyc_status).label}</span></p>
                <p className="text-xs font-bold mt-1.5">Bank: <span className={statusInfo(kycQ.data?.bankUPI?.status).cls + " px-2 py-0.5 rounded-full"}>{kycQ.isLoading ? "—" : statusInfo(kycQ.data?.bankUPI?.status).label}</span></p>
              </div>
              {!kycQ.isLoading && (
                <AppButton
                  variant="outline"
                  className="!py-2 !px-3 !text-xs !rounded-[10px] shrink-0"
                  onClick={() => setKycTab(kycInfo.kycOk && !kycInfo.bankOk ? "bank" : "kyc")}
                >
                  {kycInfo.verified ? "Manage" : "Complete KYC"}
                </AppButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3.5">
        <div className="flex gap-2 mb-3.5 overflow-x-auto no-scrollbar">
          {[["txns", "Credit history"], ["withdrawals", "Withdrawals"], ["credits", "Costs"], ["buy", "Buy Credits"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
        </div>

        {tab === "txns" && (
          <div className="flex flex-col gap-2.5">
            {loading && <ListSkeleton count={3} lines={2} />}
            {!loading && txns.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>}
            {!loading && txns.map((t, i) => (
              <Card key={i} className="!p-3.5">
                <div className="flex justify-between items-start gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center shrink-0">{typeIcon(t.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug">{t.description || t.campaign || "Transaction"}</p>
                    {t.campaign && <p className="text-[10px] text-text-mid">Campaign: {t.campaign}</p>}
                    <p className="text-[10px] text-text-light mt-0.5">{t.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[15px] font-black mb-1 ${isPlus(t) ? "text-success" : "text-destructive"}`}>
                      {isPlus(t) ? "+" : "-"}{t.amount.replace(/^[+-]/, "")}
                    </p>
                    {t.type && <Badge color={isPlus(t) ? "green" : "red"} sm>{t.type.replace(/_/g, " ")}</Badge>}
                  </div>
                </div>
              </Card>
            ))}
            {history.hasNextPage && (
              <AppButton variant="outline" full disabled={history.isFetchingNextPage} onClick={() => history.fetchNextPage()}>
                {history.isFetchingNextPage ? "Loading…" : "Load more"}
              </AppButton>
            )}
          </div>
        )}

        {tab === "withdrawals" && (
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-extrabold text-foreground">Withdrawal history</p>
            {withdrawals.isLoading && <ListSkeleton count={3} lines={2} />}
            {!withdrawals.isLoading && wRows.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No withdrawals yet</p>}
            {wRows.map((w, i) => {
              const st = String(w.status ?? "").toLowerCase();
              return (
                <Card key={w.id ?? w.transaction_id ?? i} className="!p-3.5 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground">₹{Number(w.amount ?? w.withdrawAmount ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-text-mid capitalize">{String(w.method ?? w.withdrawMethod ?? w.payment_method ?? "—")}</p>
                    <p className="text-[10px] text-text-light">{w.date || w.created_at || "—"}</p>
                  </div>
                  <Badge color={/(paid|success|complete|approved)/.test(st) ? "green" : /(reject|fail|cancel)/.test(st) ? "red" : "amber"}>{w.status || "Pending"}</Badge>
                </Card>
              );
            })}
            {withdrawals.hasNextPage && (
              <AppButton variant="outline" full disabled={withdrawals.isFetchingNextPage} onClick={() => withdrawals.fetchNextPage()}>
                {withdrawals.isFetchingNextPage ? "Loading…" : "Load more"}
              </AppButton>
            )}
          </div>
        )}

        {tab === "credits" && (
          <Card className="!bg-warning/5 !border-warning/20">
            <p className="text-[13px] font-extrabold text-foreground mb-2.5">💳 What costs credits</p>
            {costActions.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
            {costActions
              .filter((a) => a?.action !== "proposal_boost" || a.enabled !== false)
              .map((a, i) => (
                <div key={a.action || i} className="mb-2.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{a.label || a.action}</span>
                    <Badge color="amber" sm>{costLabel(a)}</Badge>
                  </div>
                   {a.note && !String(a.note).toLowerCase().includes("/api/") && (
                     <p className="text-[10px] text-text-light mt-0.5">{a.note}</p>
                   )}
                  {a.tiers && typeof a.tiers === "object" && !Array.isArray(a.tiers) && (
                    <div className="mt-1 pl-2 border-l-2 border-warning/30 flex flex-col gap-0.5">
                      {Object.entries(a.tiers).map(([n, v]: any) => (
                        <div key={n} className="flex justify-between text-[11px] text-text-mid">
                          <span>{n}</span>
                          <span className="font-bold">{v} credits</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </Card>
        )}

        {tab === "buy" && (
          <div className="flex flex-col gap-3">
            {plans.map((p) => (
              <Card key={p.id + p.name} className={`!p-3.5 relative ${p.pop ? "!border-2 !border-primary" : ""}`}>
                {p.pop && (
                  <div className="absolute -top-2.5 right-3.5 bg-primary text-primary-foreground text-[9px] font-bold px-2.5 py-0.5 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-extrabold text-foreground mb-0.5">{p.name}</p>
                    <p className="text-[22px] font-black text-primary mb-0.5">
                      {p.credits} <span className="text-xs text-text-light">credits</span>
                    </p>
                    {p.validity && <p className="text-[11px] text-text-light">{p.validity}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-foreground mb-2">{storePrices?.[p.id] || p.price}</p>
                    {isNative ? (
                      <AppButton
                        className="!py-2 !px-4 !text-xs !rounded-[10px]"
                        disabled={storeFailed || !p.playable || buyingId !== null}
                        onClick={() => handleBuy(p)}
                      >
                        {storeFailed || !p.playable ? "Unavailable" : buyingId === p.id ? "Processing…" : "Buy Now"}
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
      {withdrawOpen && <WithdrawSheet balance={balance} kyc={kycQ.data} onClose={() => setWithdrawOpen(false)} onOpenKyc={(t) => { setWithdrawOpen(false); setKycTab(t); }} />}
      {kycTab && <KycSheet data={kycQ.data} initialTab={kycTab} onClose={() => setKycTab(null)} />}
    </Screen>
  );
};

export default WalletScreen;
