import React, { useState, useEffect } from "react";
import { walletService } from "@/services/walletService";
import { isDemoUser } from "@/lib/demo";
import { Screen } from "../findcollab/Screen";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { AppButton } from "../findcollab/AppButton";
import { toast } from "sonner";

interface Transaction {
  desc: string;
  amt: string;
  type: "credit" | "debit";
  date: string;
}

const DEMO_TXNS: Transaction[] = [
  { desc: "Summer Slimming Challenge — Payment released", amt: "+₹1,000", type: "credit", date: "31 May" },
  { desc: "Healthy Living with Moringa — Payment released", amt: "+₹5,000", type: "credit", date: "30 May" },
  { desc: "Withdrawal rejected by admin", amt: "-₹1,000", type: "debit", date: "31 May" },
];

const WalletScreen: React.FC = () => {
  const [tab, setTab] = useState("txns");
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<Transaction[]>(DEMO_TXNS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemoUser()) return;
    setLoading(true);

    Promise.all([
      walletService.getBalance().catch(() => null),
      walletService.getTransactions().catch(() => null),
    ]).then(([balRes, txnRes]) => {
      if (balRes) setBalance(balRes.wallet_balance ?? 0);
      if (txnRes?.transactions) {
        setTxns(
          txnRes.transactions.map((t: any) => ({
            desc: t.description || t.transaction_id || "",
            amt: `${t.transaction_type === "credit" ? "+" : "-"}₹${Math.abs(t.amount).toLocaleString()}`,
            type: t.transaction_type === "credit" ? "credit" : "debit",
            date: t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "",
          }))
        );
      }
    }).finally(() => setLoading(false));
  }, []);

  const displayBalance = balance !== null ? `₹${balance.toLocaleString()}` : "₹6,000";

  const plans = [
    { name: "Starter", credits: 100, price: "₹199", pop: false },
    { name: "Growth", credits: 300, price: "₹499", pop: true },
    { name: "Pro", credits: 700, price: "₹999", pop: false },
    { name: "Power", credits: 1500, price: "₹1,999", pop: false },
  ];

  return (
    <Screen>
      <div className="px-4 pt-4 pb-3 bg-card">
        <h2 className="text-lg font-black text-foreground mb-4">Wallet</h2>
        <div className="gradient-hero rounded-[20px] p-5 mb-3 relative overflow-hidden">
          <div className="absolute -right-5 -top-5 w-[100px] h-[100px] rounded-full bg-primary/10" />
          <p className="text-[11px] text-primary-foreground/50 uppercase tracking-widest mb-1">Available Balance</p>
          <p className="text-4xl font-black text-primary-foreground mb-1">{displayBalance}</p>
          <p className="text-[11px] text-primary-foreground/40 mb-4">Updated from your account</p>
          <AppButton icon="arrowUp" className="!py-2.5 !px-4 !text-xs !rounded-[10px]">Withdraw</AppButton>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-primary-light rounded-[14px] p-3">
            <p className="text-[10px] text-primary-dark font-bold uppercase mb-0.5">Credits</p>
            <p className="text-[26px] font-black text-primary">10</p>
            <p className="text-[10px] text-text-mid mt-0.5">20 earned • 10 spent</p>
          </div>
          <div className="bg-success-light rounded-[14px] p-3">
            <p className="text-[10px] text-emerald-800 font-bold uppercase mb-0.5">KYC Status</p>
            <p className="text-base font-black text-success mt-1 mb-0.5">Verified ✓</p>
            <p className="text-[10px] text-text-mid">Bank connected</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3.5">
        <div className="flex gap-2 mb-3.5">
          {[["txns", "Transactions"], ["credits", "Credits"], ["buy", "Buy Credits"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
        </div>

        {tab === "txns" && (
          <div className="flex flex-col gap-2.5">
            {loading && <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>}
            {!loading && txns.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>}
            {!loading && txns.map((t, i) => (
              <Card key={i} className="!p-3.5">
                <div className="flex justify-between items-center">
                  <div className="flex-1 mr-2.5">
                    <p className="text-xs font-semibold text-foreground mb-0.5 leading-snug">{t.desc}</p>
                    <p className="text-[10px] text-text-light">{t.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[15px] font-black mb-1 ${t.type === "credit" ? "text-success" : "text-destructive"}`}>{t.amt}</p>
                    <Badge color={t.type === "credit" ? "green" : "red"} sm>{t.type}</Badge>
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
                    <p className="text-lg font-black text-foreground mb-2">{p.price}</p>
                    <AppButton className="!py-2 !px-4 !text-xs !rounded-[10px]">Buy Now</AppButton>
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
