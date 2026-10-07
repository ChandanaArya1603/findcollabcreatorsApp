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
import PublicProfileScreen from "@/components/screens/PublicProfileScreen";
import EditProfileScreen from "@/components/screens/EditProfileScreen";
import DeleteAccountScreen from "@/components/screens/DeleteAccountScreen";
import LoginScreen from "@/components/screens/LoginScreen";
import RegisterScreen from "@/components/screens/RegisterScreen";
import CheckInboxScreen from "@/components/screens/auth/CheckInboxScreen";
import ProfileWizard from "@/components/onboarding/ProfileWizard";
import { useProfileCompletion, STEP_KEYS, type StepKey } from "@/hooks/useProfileCompletion";
import ForgotPasswordScreen from "@/components/screens/auth/ForgotPasswordScreen";
import BottomNav from "@/components/findcollab/BottomNav";
import { CreditBar } from "@/components/findcollab/CreditPill";
import WelcomeScreen from "@/components/screens/WelcomeScreen";
import { waitForCriticalHome } from "@/hooks/useAppData";
import { queryClient } from "@/lib/queryClient";
import { qk } from "@/lib/queryKeys";
import { hideSplash } from "@/lib/splash";

interface StackItem {
  screen: string;
  data?: any;
}

const SKIP_KEY = "fc_onboarding_skipped";
const PENDING_KEY = "fc_onboarding_pending";
const STEP_INDEX: Partial<Record<StepKey, number>> = { social: 0, commercials: 1, projects: 2 };

/** Auto-opens the wizard only once, on the first login after sign-up, unless skipped before. */
const AutoOnboarding: React.FC<{ onOpen: (k: StepKey) => void }> = ({ onOpen }) => {
  const { ready, percent, steps } = useProfileCompletion();
  const firstOpen = STEP_KEYS.find((k) => !steps[k]) ?? null;
  const done = React.useRef(false);
  React.useEffect(() => {
    if (done.current || !ready) return;
    done.current = true;
    if (!localStorage.getItem(PENDING_KEY)) return;
    localStorage.removeItem(PENDING_KEY);
    if (percent < 100 && firstOpen && !localStorage.getItem(SKIP_KEY)) onOpen(firstOpen);
  }, [ready, percent, firstOpen, onOpen]);
  return null;
};

const Index = () => {
  const { isAuthenticated, isLoading, welcomeName, clearWelcome } = useAuth();
  const [entered, setEntered] = useState(false);
  const finishWelcome = React.useCallback(() => { setEntered(true); clearWelcome(); }, [clearWelcome]);

  // Keep the native splash until cached data exists or the first Home data arrives (max 2.5 s).
  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || queryClient.getQueryData(qk.dashboardStats)) { hideSplash(); return; }
    const t = setTimeout(hideSplash, 2500);
    waitForCriticalHome().then(hideSplash);
    return () => clearTimeout(t);
  }, [isLoading, isAuthenticated]);
  const [loginEmail, setLoginEmail] = useState("");
  const [wizardStep, setWizardStep] = useState<number | null>(null);
  const [authView, setAuthView] = useState<"login" | "register" | "verify" | "forgot">("login");
  const [verifyInfo, setVerifyInfo] = useState<{ userId?: number; email: string; notice?: string }>({ email: "" });
  const goVerify = (info: { userId?: number; email: string; notice?: string }) => {
    setVerifyInfo(info);
    setAuthView("verify");
  };
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

  const openProfileStep = (k: StepKey) => {
    if (k === "basic" || k === "photo") return push("editprofile");
    setWizardStep(STEP_INDEX[k] ?? 0);
  };

  const renderMain = () => {
    switch (tab) {
      case "home": return <HomeScreen push={push} switchTab={handleTabChange} onOpenProfileStep={openProfileStep} />;
      case "campaigns": return <CampaignsScreen push={push} onOpenWallet={() => handleTabChange("wallet")} />;
      case "messages": return <MessagesScreen push={push} onBack={() => handleTabChange("home")} onChatOpen={setChatOpen} />;
      case "wallet": return <WalletScreen />;
      case "pitch": return <StartupsScreen onBack={() => handleTabChange("home")} onOpenWallet={() => handleTabChange("wallet")} />;
      default: return <HomeScreen push={push} switchTab={handleTabChange} />;
    }
  };

  const renderStack = (screen: string, data: any) => {
    switch (screen) {
      case "campaign-detail": return <CampaignDetail campaign={data} onBack={pop} onOpenWallet={() => handleTabChange("wallet")} />;
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
      case "startups": return <StartupsScreen onBack={pop} onOpenWallet={() => handleTabChange("wallet")} />;
      case "messages": return <MessagesScreen onBack={pop} />;
      case "mycampaigns": return <MyCampaignsScreen onBack={pop} />;
      case "editprofile": return <EditProfileScreen onBack={pop} />;
      case "publicprofile": return <PublicProfileScreen onBack={pop} />;
      case "deleteaccount": return <DeleteAccountScreen onBack={pop} onOpenWallet={() => handleTabChange("wallet")} />;
      case "profile": return <ProfileScreen push={push} />;
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
        {authView === "login" && (
          <LoginScreen key={loginEmail} initialEmail={loginEmail} onSwitch={() => setAuthView("register")} onForgot={() => setAuthView("forgot")} onNeedVerify={goVerify} />
        )}
        {authView === "register" && <RegisterScreen onSwitch={() => setAuthView("login")} onVerify={goVerify} />}
        {authView === "verify" && (
          <CheckInboxScreen email={verifyInfo.email} notice={verifyInfo.notice}
            onSignIn={(e) => { setLoginEmail(e || ""); setAuthView("login"); }} />
        )}
        {authView === "forgot" && <ForgotPasswordScreen onBack={() => setAuthView("login")} />}
      </div>
    );
  }

  if (welcomeName !== null) return <WelcomeScreen name={welcomeName} onDone={finishWelcome} />;

  return (
    <div className={`h-screen bg-background flex flex-col overflow-hidden relative ${entered ? "fc-fade-up" : ""}`}>
      <CreditBar
        onClick={() => handleTabChange("wallet")}
        onProfileClick={() => { setChatOpen(false); setStack([{ screen: "profile" }]); }}
        showProfile={tab !== "home" || Boolean(current)}
        showBalance={tab !== "home" || Boolean(current)}
      />
      <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">{renderMain()}</div>
        {current && (
          <div className="absolute inset-0 z-20 bg-background flex flex-col animate-slide-in">
            {renderStack(current.screen, current.data)}
          </div>
        )}
      </div>
      {tab === "home" && !current && (
        <AutoOnboarding onOpen={openProfileStep} />
      )}
      {wizardStep !== null && (
        <ProfileWizard key={wizardStep} initialStep={wizardStep}
          onSkip={() => localStorage.setItem(SKIP_KEY, "1")}
          onClose={() => setWizardStep(null)} />
      )}
      <BottomNav active={tab} setActive={handleTabChange} />
    </div>
  );
};

export default Index;
