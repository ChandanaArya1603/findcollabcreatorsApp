import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import HomeScreen from "@/components/screens/HomeScreen";
import CampaignsScreen from "@/components/screens/CampaignsScreen";
import CampaignDetail from "@/components/screens/CampaignDetail";
import WalletScreen from "@/components/screens/WalletScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import MediaKitScreen from "@/components/screens/MediaKitScreen";
import OffersScreen from "@/components/screens/OffersScreen";
import OfferDetail from "@/components/screens/OfferDetail";
import StartupsScreen from "@/components/screens/StartupsScreen";
import MessagesScreen from "@/components/screens/MessagesScreen";
import MyCampaignsScreen from "@/components/screens/MyCampaignsScreen";
import EditProfileScreen from "@/components/screens/EditProfileScreen";
import LoginScreen from "@/components/screens/LoginScreen";
import RegisterScreen from "@/components/screens/RegisterScreen";
import BottomNav from "@/components/findcollab/BottomNav";

interface StackItem {
  screen: string;
  data?: any;
}

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [tab, setTab] = useState("home");
  const [stack, setStack] = useState<StackItem[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  const push = (screen: string, data?: any) => setStack((s) => [...s, { screen, data }]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const current = stack.length > 0 ? stack[stack.length - 1] : null;

  const handleTabChange = (newTab: string) => {
    setStack([]);
    setTab(newTab);
  };

  const renderMain = () => {
    switch (tab) {
      case "home": return <HomeScreen push={push} switchTab={handleTabChange} />;
      case "campaigns": return <CampaignsScreen push={push} />;
      case "messages": return <MessagesScreen push={push} onChatOpen={setChatOpen} />;
      case "wallet": return <WalletScreen />;
      case "profile": return <ProfileScreen push={push} />;
      default: return <HomeScreen push={push} switchTab={handleTabChange} />;
    }
  };

  const renderStack = (screen: string, data: any) => {
    switch (screen) {
      case "campaign-detail": return <CampaignDetail campaign={data} onBack={pop} />;
      case "offer-detail": return <OfferDetail offer={data} onBack={pop} />;
      case "mediakit": return <MediaKitScreen onBack={pop} />;
      case "offers":
        return (
          <OffersScreen
            push={(id, d) => {
              if (id === "offer-detail") push("offer-detail", d);
              else if (id === "profile") pop();
            }}
          />
        );
      case "startups": return <StartupsScreen onBack={pop} />;
      case "messages": return <MessagesScreen onBack={pop} />;
      case "mycampaigns": return <MyCampaignsScreen onBack={pop} />;
      case "editprofile": return <EditProfileScreen onBack={pop} />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-5">
        <div className="w-[390px] h-[844px] bg-background rounded-[44px] shadow-[0_40px_80px_rgba(0,0,0,0.4),0_0_0_10px_#111,0_0_0_12px_#333] flex items-center justify-center">
          <p className="text-text-mid text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-5">
        <div className="w-[390px] h-[844px] bg-background rounded-[44px] shadow-[0_40px_80px_rgba(0,0,0,0.4),0_0_0_10px_#111,0_0_0_12px_#333] relative overflow-hidden flex flex-col">
          <div className="h-11 bg-card flex items-center justify-between px-5 pl-7 shrink-0 relative">
            <span className="text-[13px] font-bold text-foreground">9:41</span>
            <div className="w-[110px] h-7 bg-foreground rounded-[20px] absolute left-1/2 -translate-x-1/2 top-0" />
          </div>
          {authView === "login"
            ? <LoginScreen onSwitch={() => setAuthView("register")} />
            : <RegisterScreen onSwitch={() => setAuthView("login")} />
          }
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-5">
      {/* Phone Shell */}
      <div className="w-[390px] h-[844px] bg-background rounded-[44px] shadow-[0_40px_80px_rgba(0,0,0,0.4),0_0_0_10px_#111,0_0_0_12px_#333] relative overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="h-11 bg-card flex items-center justify-between px-5 pl-7 shrink-0 relative">
          <span className="text-[13px] font-bold text-foreground">9:41</span>
          <div className="w-[110px] h-7 bg-foreground rounded-[20px] absolute left-1/2 -translate-x-1/2 top-0" />
          <div className="flex gap-1.5 items-center">
            <div className="flex gap-[1px] items-end">
              {[3, 4, 5].map((h) => (
                <div key={h} className="w-[3px] bg-foreground rounded-sm" style={{ height: h }} />
              ))}
            </div>
            <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
              <rect x="0.5" y="2.5" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" className="text-foreground" />
              <path d="M13 4.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-foreground" />
              <rect x="2" y="4" width="8" height="4" rx="0.8" fill="currentColor" className="text-foreground" />
            </svg>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
          <div className="flex-1 flex flex-col overflow-hidden">{renderMain()}</div>
          {current && (
            <div className="absolute inset-0 bg-background flex flex-col animate-slide-in">
              {renderStack(current.screen, current.data)}
            </div>
          )}
          {!current && !chatOpen && <BottomNav active={tab} setActive={handleTabChange} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
