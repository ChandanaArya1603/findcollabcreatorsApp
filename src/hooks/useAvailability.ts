import { useEffect, useState } from "react";

export type Avail = "idle" | "checking" | "available" | "taken";

/** Debounced (500ms) server availability check. Server returns status:false (thrown) or available:false when taken. */
export const useAvailability = (value: string, check: (v: string) => Promise<any>, valid: (v: string) => boolean) => {
  const [state, setState] = useState<{ s: Avail; msg?: string }>({ s: "idle" });
  useEffect(() => {
    const v = value.trim();
    if (!v || !valid(v)) {
      setState({ s: "idle" });
      return;
    }
    let cancelled = false;
    setState({ s: "checking" });
    const t = setTimeout(async () => {
      try {
        const res: any = await check(v);
        if (cancelled) return;
        const taken = res?.available === false || res?.is_available === false || res?.exists === true;
        setState({ s: taken ? "taken" : "available", msg: res?.message });
      } catch (err: any) {
        if (cancelled) return;
        // Network failures shouldn't block signup; only a server "false" reply counts as taken.
        setState(err?.data ? { s: "taken", msg: err.message } : { s: "idle" });
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return state;
};
