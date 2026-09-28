import React from "react";
import { useCreditBalance } from "@/hooks/useAppData";

/** Slim bar showing the credit balance, used above every main tab. */
export const CreditBar: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { data } = useCreditBalance();
  const bal = data?.balance ?? data?.credits_balance;
  return (
    <div className="flex justify-end px-4 pt-2 pb-1 bg-card shrink-0">
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-light text-primary text-[11px] font-extrabold"
      >
        🪙 {bal ?? "—"} credits
      </button>
    </div>
  );
};
