const ok = (v: any) => typeof v === "string" && v.trim() !== "" && v.toLowerCase() !== "null";

/** Instagram CDN images block hot-linking via Referer; route through an image proxy. */
export const proxyImg = (url: string): string => {
  if (!url) return "";
  if (url.includes("fbcdn.net") || url.includes("cdninstagram.com")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}`;
  }
  return url;
};

export const instagramPic = (mk: any): string => {
  const raw = mk?.instagramData?.json_data;
  if (!raw) return "";
  try {
    const u = (typeof raw === "string" ? JSON.parse(raw) : raw)?.data?.user;
    return u?.profile_pic_url_hd || u?.profile_pic_url || "";
  } catch {
    return "";
  }
};

/** Profile photo: logged-in user object first, then Instagram profile picture. */
export const isAbsUrl = (v: any) => ok(v) && /^https?:\/\//i.test(String(v).trim());

export const getProfilePhoto = (mk: any, user?: any, userDetail?: any): string => {
  const img = mk?.userDetail?.img_name ?? userDetail?.img_name;
  if (isAbsUrl(img)) return String(img).trim();
  const cands = [
    user?.profile_image, user?.profile_pic, user?.image, user?.avatar,
    userDetail?.profile_image, userDetail?.profile_pic, userDetail?.image,
    mk?.userDetail?.profile_image, mk?.userDetail?.profile_pic,
  ];
  let stored: any = null;
  try { stored = JSON.parse(localStorage.getItem("fc_user") || "null"); } catch { /* ignore */ }
  cands.push(stored?.profile_image, stored?.profile_pic, stored?.image);
  const found = cands.find(ok);
  return proxyImg(found || instagramPic(mk));
};

/** insta_url / youtube_url / linkedin_url may be full URLs or handles: return the handle. */
export const handleFrom = (v: any): string => {
  if (!ok(v)) return "";
  const s = String(v).trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
  const last = s.includes("/") ? s.split("/").pop() || "" : s;
  return last.replace(/^@/, "");
};
