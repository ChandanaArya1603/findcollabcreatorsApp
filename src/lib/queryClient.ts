import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const PERSIST_KEY = "fc_query_cache";
export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: PERSIST_KEY,
});

/** Cache buster includes the logged-in user id so cached data never leaks across accounts. */
export const getCacheBuster = (): string => {
  try {
    const raw = localStorage.getItem("fc_user");
    const id = raw ? JSON.parse(raw)?.id : null;
    return `v1-${id ?? "anon"}`;
  } catch {
    return "v1-anon";
  }
};

export const clearQueryCache = () => {
  queryClient.clear();
  try {
    localStorage.removeItem(PERSIST_KEY);
  } catch {
    // ignore storage errors
  }
};
