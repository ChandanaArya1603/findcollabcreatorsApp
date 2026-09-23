import { walletService } from "@/services/walletService";

const KEY = "fc_pending_purchases";

export interface PendingPurchase {
  product_id: string;
  purchase_token: string;
  order_id: string;
}

export const readPendingPurchases = (): PendingPurchase[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (list: PendingPurchase[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
};

export const addPendingPurchase = (p: PendingPurchase) => {
  const list = readPendingPurchases();
  if (!list.some((x) => x.purchase_token === p.purchase_token)) {
    list.push(p);
    write(list);
  }
};

export const removePendingPurchase = (purchaseToken: string) => {
  write(readPendingPurchases().filter((x) => x.purchase_token !== purchaseToken));
};

/** Retries any saved purchases. Returns the number successfully verified. */
export const retryPendingPurchases = async (): Promise<number> => {
  const list = readPendingPurchases();
  let ok = 0;
  for (const p of list) {
    try {
      await walletService.verifyPlayPurchase(p);
      removePendingPurchase(p.purchase_token);
      ok += 1;
    } catch {
      // keep it for the next attempt
    }
  }
  return ok;
};
