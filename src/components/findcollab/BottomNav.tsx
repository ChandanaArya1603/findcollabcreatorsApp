import React from "react";
import { Icon } from "../findcollab/Icon";

interface BottomNavProps {
  active: string;
  setActive: (tab: string) => void;
}

const tabs = [
  { id: "home", l: "Home", ic: "home" },
  { id: "campaigns", l: "Search", ic: "search" },
  { id: "pitch", l: "Pitch", ic: "send" },
  { id: "messages", l: "Messages", ic: "msg" },
  { id: "wallet", l: "Wallet", ic: "wallet" },
];

const BottomNav: React.FC<BottomNavProps> = ({ active, setActive }) => (
  <div className="shrink-0 bg-card border-t border-border flex items-center pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(26,26,46,0.08)] z-50">
    {tabs.map((tab) => {
      const isActive = active === tab.id;

      return (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={`flex-1 h-[58px] pt-2 pb-1 flex flex-col items-center justify-center gap-1 border-none cursor-pointer bg-transparent transition-colors ${
            isActive ? "text-primary" : "text-text-light"
          }`}
        >
          <div className="relative h-6 flex items-center justify-center">
            <Icon name={tab.ic} size={21} strokeWidth={isActive ? 2.8 : 2} />
          </div>
          <span className={`text-[9px] tracking-wide ${isActive ? "font-black" : "font-bold"}`}>{tab.l}</span>
        </button>
      );
    })}
  </div>
);

export default BottomNav;