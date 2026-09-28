import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { sanitize } from "./lib/api";

// One-time cleanup: drop the old v1 query cache and strip secrets from stored user data.
try {
  if (!localStorage.getItem("fc_cache_v2")) {
    localStorage.removeItem("fc_query_cache");
    localStorage.setItem("fc_cache_v2", "1");
  }
  ["fc_user", "fc_user_detail"].forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw) localStorage.setItem(key, JSON.stringify(sanitize(JSON.parse(raw))));
  });
} catch { /* ignore storage errors */ }

createRoot(document.getElementById("root")!).render(<App />);
