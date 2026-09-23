// Per-user dashboard cache: in-memory + localStorage so the Home screen can
// render instantly while fresh data loads in the background.

export interface DashboardCache {
  stats?: any;
  walletBalance?: number | null;
  profileName?: string;
  notifications?: any[];
  notifCount?: number;
}

const PREFIX = "fc_dash_cache_";
const memory = new Map<string, DashboardCache>();

const keyFor = (userId: string | number | null | undefined) => `${PREFIX}${userId ?? "anon"}`;

export const readDashboardCache = (userId: string | number | null | undefined): DashboardCache | null => {
  const key = keyFor(userId);
  const mem = memory.get(key);
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardCache;
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
};

export const writeDashboardCache = (
  userId: string | number | null | undefined,
  patch: DashboardCache,
) => {
  const key = keyFor(userId);
  const next = { ...(memory.get(key) ?? readDashboardCache(userId) ?? {}), ...patch };
  memory.set(key, next);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // storage full / unavailable — in-memory cache still works
  }
};

export const clearDashboardCache = () => {
  memory.clear();
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};
