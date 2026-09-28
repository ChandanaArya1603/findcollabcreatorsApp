import { getProfilePhoto } from "@/lib/profilePhoto";
import React from "react";
import { useCreditBalance, useMediaKit } from "@/hooks/useAppData";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "./Avatar";

/** Slim bar showing the credit balance, used above every main tab. */
export const CreditBar: React.FC<{ onClick?: () => void; onProfileClick?: () => void; showProfile?: boolean; showBalance?: boolean }> = ({ onClick, onProfileClick, showProfile = true, showBalance = true }) => {
  const { data } = useCreditBalance();
  const { data: mediaKit } = useMediaKit();
  const { user, userDetail } = useAuth();
  const bal = data?.balance ?? data?.credits_balance;
  const detail = mediaKit?.userDetail || userDetail || {};
  const name = mediaKit?.fname || user?.fname || "User";
  const photo = getProfilePhoto(mediaKit, user, detail);
  if (!showBalance && !showProfile) return null;
  return (
    <div className="flex items-center justify-end gap-2 px-4 pt-2 pb-1 bg-card shrink-0">
      {showBalance && (
        <button
          onClick={onClick}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-light text-primary text-[11px] font-extrabold"
        >
          🪙 {bal ?? "—"} credits
        </button>
      )}
      {showProfile && (
        <button onClick={onProfileClick} aria-label="Open profile" className="rounded-[10px]">
          <Avatar letter={name.charAt(0).toUpperCase()} src={photo || undefined} size={32} />
        </button>
      )}
    </div>
  );
};
