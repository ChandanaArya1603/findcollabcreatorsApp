import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { BackHeader } from "../findcollab/BackHeader";
import { Card } from "../findcollab/Card";
import { Badge } from "../findcollab/Badge";
import { AppButton } from "../findcollab/AppButton";

const BASE_URL = "https://findcollab.com/api";

interface PublicProfile {
  user_name: string;
  followers: string;
  engagement_rate: string;
  rating: string;
  a_list: boolean;
  verify: boolean;
  insta_url: string;
  youtube_url: string;
  y_count: string;
}

const str = (v: any) => (v == null || v === "" ? "" : String(v));
const flag = (v: any) => v === true || v === 1 || v === "1" || String(v).toLowerCase() === "yes";

/**
 * Public profile, fetched without the login token. SECURITY: only whitelisted public
 * fields are copied out — the raw response (which contains password, email, mobile,
 * tokens) is never returned, cached, stored or logged.
 */
const fetchPublicProfile = async (id: number): Promise<PublicProfile> => {
  const res = await fetch(`${BASE_URL}/userProfile/${id}`);
  const text = await res.text();
  const i = text.indexOf("{");
  if (i === -1) throw new Error(`Request failed (${res.status})`);
  const json = JSON.parse(text.slice(i));
  if (!res.ok || json?.data?.status === false) throw new Error("Profile not available");
  const ud = json?.data?.userDetail || {};
  return {
    user_name: str(ud.user_name),
    followers: str(ud.followers),
    engagement_rate: str(ud.engagement_rate),
    rating: str(ud.rating),
    a_list: flag(ud.a_list),
    verify: flag(ud.verify),
    insta_url: str(ud.insta_url),
    youtube_url: str(ud.youtube_url),
    y_count: str(ud.y_count),
  };
};

const PublicProfileScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const id = Number(user?.id || 0);
  const q = useQuery({ queryKey: ["public_profile", id], queryFn: () => fetchPublicProfile(id), enabled: id > 0 });
  const p = q.data;
  const name = p?.user_name || "—";
  const link = `https://findcollab.com/userProfile/${id}`;

  const stats: [string, string][] = p
    ? ([
        ["Instagram followers", p.followers],
        ["Engagement", p.engagement_rate ? `${p.engagement_rate.replace(/%$/, "")}%` : ""],
        ["YouTube subscribers", p.y_count],
        ["Rating", p.rating],
      ] as [string, string][]).filter(([, v]) => v)
    : [];

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${name} on FindCollab`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        toast.success("Profile link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const openUrl = (u: string) => window.open(/^https?:/.test(u) ? u : `https://${u}`, "_blank", "noopener");

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-6">
      <BackHeader title="Public profile" onBack={onBack} />
      <div className="px-4 pt-3.5 flex flex-col gap-3">
        <p className="text-[11px] text-muted-foreground text-center">This is how brands see your profile</p>
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
        ) : q.isError || !p ? (
          <Card><p className="text-sm text-destructive text-center">{(q.error as Error)?.message || "Could not load profile"}</p></Card>
        ) : (
          <>
            <Card className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-light mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl font-black text-primary">{name.charAt(0).toUpperCase()}</span>
              </div>
              <p className="text-lg font-black text-foreground">{name}{p.verify ? " ✓" : ""}</p>
              <div className="flex justify-center gap-1.5 mt-2">
                {p.verify && <Badge color="green" sm>Verified</Badge>}
                {p.a_list && <Badge sm>A-List</Badge>}
              </div>
            </Card>
            {stats.length > 0 && (
              <Card>
                <p className="text-sm font-extrabold text-foreground mb-2">Stats</p>
                <div className="grid grid-cols-2 gap-2">
                  {stats.map(([k, v]) => (
                    <div key={k} className="bg-background rounded-xl p-3">
                      <p className="text-base font-black text-foreground">{v}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{k}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {(p.insta_url || p.youtube_url) && (
              <div className="flex gap-2">
                {p.insta_url && <AppButton variant="outline" className="flex-1" onClick={() => openUrl(p.insta_url)}>Instagram</AppButton>}
                {p.youtube_url && <AppButton variant="outline" className="flex-1" onClick={() => openUrl(p.youtube_url)}>YouTube</AppButton>}
              </div>
            )}
            <AppButton full icon="share" onClick={share}>Share profile</AppButton>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicProfileScreen;
