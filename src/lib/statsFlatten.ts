/** Collect numeric stats from any API object (parses nested JSON strings), for generic display. */
const SKIP = /(^|_)(id|ids|timestamp|created|updated|user_id|status|page|limit|pk)$/i;

export const humanize = (k: string) =>
  k.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());

export const flattenStats = (obj: any, max = 24): [string, string][] => {
  const out: [string, string][] = [];
  const seen = new Set<string>();
  const walk = (o: any, depth: number) => {
    if (o == null || depth > 4 || out.length >= max) return;
    if (typeof o === "string" && /^\s*[{[]/.test(o)) {
      try { return walk(JSON.parse(o), depth); } catch { return; }
    }
    if (Array.isArray(o) || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o)) {
      if (out.length >= max) return;
      if (SKIP.test(k)) continue;
      const isNum = typeof v === "number" || (typeof v === "string" && /^-?\d+(\.\d+)?%?$|^\d+(\.\d+)?[KMB]$/i.test(v.trim()));
      if (isNum && !seen.has(k)) {
        seen.add(k);
        const n = typeof v === "number" ? v : v;
        out.push([humanize(k), typeof n === "number" ? n.toLocaleString() : String(n)]);
      } else if (v && typeof v === "object") walk(v, depth + 1);
      else if (typeof v === "string" && /^\s*[{[]/.test(v)) walk(v, depth + 1);
    }
  };
  walk(obj, 0);
  return out;
};

export const findStat = (rows: [string, string][], re: RegExp) => rows.find(([k]) => re.test(k))?.[1];
