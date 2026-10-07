import React, { useEffect } from "react";
import { waitForCriticalHome } from "@/hooks/useAppData";

/** Branded hand-off after sign-in: min 600 ms, max 2.5 s, or until critical Home data arrives. */
const WelcomeScreen: React.FC<{ name: string; onDone: () => void }> = ({ name, onDone }) => {
  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; onDone(); } };
    const min = new Promise((r) => setTimeout(r, 600));
    Promise.all([min, waitForCriticalHome()]).then(finish);
    const max = setTimeout(finish, 2500);
    return () => { done = true; clearTimeout(max); };
  }, [onDone]);

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-5 px-6 fc-fade-up">
      <img src="/findcollab-logo-full.png" alt="Findcollab" className="h-14 object-contain fc-pulse-soft" />
      <p className="text-xl font-black text-foreground text-center">Welcome back{name ? `, ${name}` : ""} 👋</p>
    </div>
  );
};

export default WelcomeScreen;
