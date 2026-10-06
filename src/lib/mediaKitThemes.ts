/** Visual styling for server-provided media kit themes and banners. Ids come from /media_kit_settings. */
export interface Option { id: string; label: string }

const titleCase = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** themes[] / banners[] may be strings or objects — normalise without guessing beyond common keys. */
export const toOptions = (list: any): Option[] =>
  (Array.isArray(list) ? list : [])
    .map((x: any) => {
      if (typeof x === "string") return { id: x, label: titleCase(x) };
      const id = String(x?.id ?? x?.key ?? x?.value ?? x?.slug ?? "");
      return { id, label: String(x?.label ?? x?.name ?? x?.title ?? titleCase(id)) };
    })
    .filter((o: Option) => o.id);

// Theme palettes: [from, to, accent] in HSL. Unknown ids get a stable generated palette.
const PALETTES: Record<string, [string, string, string]> = {
  desi: ["350 85% 60%", "25 95% 60%", "45 95% 55%"],
  "mumbai-shaana": ["40 95% 55%", "15 90% 55%", "200 80% 45%"],
  "south-texas": ["5 80% 50%", "30 70% 45%", "45 60% 60%"],
  "sfo-breeze": ["200 85% 55%", "180 60% 60%", "20 90% 65%"],
  "bong-bindaas": ["145 55% 42%", "5 75% 50%", "45 90% 60%"],
  "madras-machan": ["280 55% 45%", "330 70% 55%", "45 90% 55%"],
  "bengaluru-adjust-maadi": ["220 25% 25%", "160 50% 40%", "80 70% 55%"],
};

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export const themePalette = (id: string): [string, string, string] => {
  if (PALETTES[id]) return PALETTES[id];
  const h = hash(id) % 360;
  return [`${h} 75% 55%`, `${(h + 40) % 360} 80% 58%`, `${(h + 180) % 360} 70% 55%`];
};

export const themeGradient = (id: string) => {
  const [a, b] = themePalette(id);
  return `linear-gradient(135deg, hsl(${a}), hsl(${b}))`;
};

/** Banner artwork as a CSS background layered on the theme palette. 'theme' = theme gradient only. */
export const bannerBackground = (bannerId: string, themeId: string): string => {
  const [a, b, c] = themePalette(themeId);
  const base = themeGradient(themeId);
  switch (bannerId) {
    case "theme":
    case "theme-gradient":
      return base;
    case "aurora-mesh":
      return `radial-gradient(at 20% 30%, hsl(${c} / .8), transparent 50%), radial-gradient(at 80% 20%, hsl(${b} / .9), transparent 50%), radial-gradient(at 50% 90%, hsl(${a}), transparent 60%), hsl(${a})`;
    case "y2k-chrome":
      return `linear-gradient(180deg, hsl(0 0% 95%), hsl(${a} / .6) 45%, hsl(0 0% 85%) 55%, hsl(${b}))`;
    case "synthwave-sunset":
      return `repeating-linear-gradient(0deg, transparent 0 14px, hsl(${c} / .35) 14px 16px), linear-gradient(180deg, hsl(280 60% 25%), hsl(${a}) 60%, hsl(${b}))`;
    case "acid-brutalist":
      return `linear-gradient(90deg, hsl(80 95% 55%) 0 30%, hsl(0 0% 10%) 30% 34%, hsl(${a}) 34%)`;
    case "memphis-pop":
      return `radial-gradient(circle at 15% 25%, hsl(${c}) 0 18px, transparent 19px), radial-gradient(circle at 80% 70%, hsl(${b}) 0 26px, transparent 27px), repeating-linear-gradient(45deg, hsl(${a} / .25) 0 6px, transparent 6px 18px), hsl(45 100% 92%)`;
    case "graffiti-street":
      return `radial-gradient(ellipse at 30% 60%, hsl(${c} / .9), transparent 40%), radial-gradient(ellipse at 75% 30%, hsl(${b} / .9), transparent 35%), linear-gradient(135deg, hsl(0 0% 20%), hsl(${a}))`;
    case "cyber-neon":
      return `repeating-linear-gradient(90deg, hsl(180 100% 50% / .25) 0 1px, transparent 1px 22px), repeating-linear-gradient(0deg, hsl(300 100% 60% / .25) 0 1px, transparent 1px 22px), linear-gradient(135deg, hsl(250 60% 12%), hsl(${a} / .8))`;
    case "risograph":
      return `radial-gradient(hsl(${a} / .5) 1.5px, transparent 1.5px) 0 0 / 8px 8px, linear-gradient(120deg, hsl(${b} / .75), hsl(${c} / .75)), hsl(40 60% 94%)`;
    case "holo-foil":
      return `linear-gradient(115deg, hsl(300 80% 80%), hsl(200 90% 75%), hsl(60 90% 80%), hsl(${a}))`;
    case "bauhaus":
      return `radial-gradient(circle at 85% 15%, hsl(${a}) 0 70px, transparent 71px), linear-gradient(45deg, transparent 60%, hsl(${c}) 60% 75%, transparent 75%), linear-gradient(90deg, transparent 75%, hsl(0 0% 15%) 75% 76%, transparent 76%), hsl(45 80% 90%)`;
    default: {
      const h = hash(bannerId) % 360;
      return `radial-gradient(circle at 75% 25%, hsl(${h} 80% 60% / .85), transparent 45%), ${base}`;
    }
  }
};
