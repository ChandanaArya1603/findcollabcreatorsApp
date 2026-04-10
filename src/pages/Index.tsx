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
    setChatOpen(false);
    setTab(newTab);
  };

  const renderMain = () => {
    switch (tab) {
      case "home": return <HomeScreen push={push} switchTab={handleTabChange} />;
      case "campaigns": return <CampaignsScreen push={push} />;
      case "messages": return <MessagesScreen push={push} onBack={() => handleTabChange("home")} onChatOpen={setChatOpen} />;
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
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {authView === "login"
          ? <LoginScreen onSwitch={() => setAuthView("register")} />
          : <RegisterScreen onSwitch={() => setAuthView("login")} />
        }
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
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
  );
};

export default Index;
