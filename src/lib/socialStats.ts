/** Explicit stat mappers for /instagram_data and /youtube_data (no generic id-leaking flatten). */
const parse = (v: any) => {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return null; }
};
const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};
const fmt = (v: number | null) => (v == null ? "—" : v.toLocaleString());
const pct = (v: number | null) => (v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(2)}%`);

export interface PlatformStats {
  followers: string;
  engagement: string;
  rows: [string, string][];
}

export const instagramStats = (res: any): PlatformStats | null => {
  const j = parse(res?.instagramData?.json_data);
  const u = j?.data?.user || j?.user;
  if (!u) return null;
  const followers = n(u.edge_followed_by?.count);
  const edges: any[] = u.edge_owner_to_timeline_media?.edges || [];
  let eng: number | null = null;
  if (followers && edges.length) {
    const total = edges.reduce((s, e) => {
      const node = e?.node || {};
      const likes = n(node.edge_liked_by?.count ?? node.edge_media_preview_like?.count) || 0;
      const comments = n(node.edge_media_to_comment?.count) || 0;
      return s + likes + comments;
    }, 0);
    eng = (total / edges.length / followers) * 100;
  }
  return {
    followers: fmt(followers),
    engagement: pct(eng),
    rows: [
      ["Following", fmt(n(u.edge_follow?.count))],
      ["Posts", fmt(n(u.edge_owner_to_timeline_media?.count))],
      ["Reels", fmt(n(u.edge_felix_video_timeline?.count))],
    ],
  };
};

export const youtubeStats = (res: any): PlatformStats | null => {
  const st = res?.youtubeData?.items?.[0]?.statistics;
  if (!st) return null;
  const subs = n(st.subscriberCount);
  const vids: any[] = res?.youtubeVideos?.items || [];
  let avgViews: number | null = null;
  let eng: number | null = null;
  if (vids.length) {
    const views = vids.reduce((s, v) => s + (n(v?.statistics?.viewCount) || 0), 0);
    const inter = vids.reduce((s, v) => s + (n(v?.statistics?.likeCount) || 0) + (n(v?.statistics?.commentCount) || 0), 0);
    avgViews = Math.round(views / vids.length);
    eng = views > 0 ? (inter / views) * 100 : null;
  }
  return {
    followers: fmt(subs),
    engagement: pct(eng),
    rows: [
      ["Total views", fmt(n(st.viewCount))],
      ["Videos", fmt(n(st.videoCount))],
      ["Avg views (recent)", fmt(avgViews)],
    ],
  };
};
