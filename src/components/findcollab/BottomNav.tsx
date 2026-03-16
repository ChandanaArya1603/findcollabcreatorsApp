import React from "react";
import { Icon } from "../findcollab/Icon";

interface BottomNavProps {
  active: string;
  setActive: (tab: string) => void;
}

const tabs = [
  { id: "home", l: "Home", ic: "home" },
  { id: "campaigns", l: "Search", ic: "search" },
  { id: "messages", l: "Messages", ic: "msg" },
  { id: "wallet", l: "Wallet", ic: "wallet" },
  { id: "profile", l: "Profile", ic: "person" },
];

const BottomNav: React.FC<BottomNavProps> = ({ active, setActive }) => (
  <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border flex items-center pb-1.5 shadow-[0_-4px_20px_rgba(26,26,46,0.08)] z-50">
    {tabs.map((tab) => {
      const isActive = active === tab.id;
      const isCenter = tab.id === "campaigns";

      return (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={`flex-1 flex flex-col items-center gap-1 border-none cursor-pointer bg-transparent transition-colors ${
            isCenter ? "pt-1.5 pb-1" : "pt-2.5 pb-1"
          } ${isActive ? "text-primary" : "text-text-light"}`}
        >
          {isCenter ? (
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-3.5 transition-all ${
                isActive ? "bg-primary shadow-primary" : "bg-primary/10"
              }`}
            >
              <Icon name={tab.ic} size={22} className={isActive ? "text-primary-foreground" : "text-primary"} />
            </div>
          ) : (
            <div className="relative">
              <Icon name={tab.ic} size={22} />
              {isActive && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
          )}
          {!(isCenter && isActive) && (
            <span className="text-[9px] font-bold tracking-wide">{tab.l}</span>
          )}
        </button>
      );
    })}
  </div>
);

export default BottomNav;