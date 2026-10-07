import { Capacitor } from "@capacitor/core";

let hidden = false;
/** Fade out the native launch splash once cached or first data is ready. */
export const hideSplash = async () => {
  if (hidden || !Capacitor.isNativePlatform()) return;
  hidden = true;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch { /* ignore */ }
};
