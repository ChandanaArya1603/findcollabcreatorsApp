import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { flattenStats } from "@/lib/statsFlatten";
import { pick } from "@/services/creditService";
import { BackHeader } from "../findcollab/BackHeader";
import { Card } from "../findcollab/Card";
import { Badge } from "../findcollab/Badge";
import { AppButton } from "../findcollab/AppButton";

const BASE_URL = "https://findcollab.com/api";

/** Public profile is fetched without the login token — exactly what brands see. */
const fetchPublicProfile = async (id: number) => {
  const res = await fetch(`${BASE_URL}/userProfile/${id}`);
  const text = await res.text();
  const i = text.indexOf("{");
  if (i === -1) throw new Error(`Request failed (${res.status})`);
  const json = JSON.parse(text.slice(i));
  if (!res.ok || json?.data?.status === false) throw new Error(json?.data?.message || "Profile not available");
  return json.data;
};

const PublicProfileScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const id = Number(user?.id || 0);
  const q = useQuery({ queryKey: ["public_profile", id], queryFn: () => fetchPublicProfile(id), enabled: id > 0 });

  const d = q.data || {};
  const p = d.userDetail || d.user || d.profile || d;
  const name = [pick(p, "fname", "first_name", "name"), pick(p, "lname", "last_name")].filter(Boolean).join(" ") || "—";
  const avatar = pick(p, "profile_image", "profile_pic", "image", "avatar");
  const bio = pick(p, "bio", "introduction", "about");
  const city = pick(p, "city", "location");
  const cats: any[] = d.userCategories || d.categories || [];
  const stats = flattenStats(d, 12);
  const link = pick(d, "profile_url", "public_url", "share_url") || `https://findcollab.com/userProfile/${id}`;

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

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-6">
      <BackHeader title="Public profile" onBack={onBack} />
      <div className="px-4 pt-3.5 flex flex-col gap-3">
        <p className="text-[11px] text-muted-foreground text-center">This is how brands see your profile</p>
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
        ) : q.isError ? (
          <Card><p className="text-sm text-destructive text-center">{(q.error as Error)?.message || "Could not load profile"}</p></Card>
        ) : (
          <>
            <Card className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-light mx-auto mb-2 overflow-hidden flex items-center justify-center">
                {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-black text-primary">{name.charAt(0)}</span>}
              </div>
              <p className="text-lg font-black text-foreground">{name}</p>
              {city && <p className="text-xs text-muted-foreground">📍 {city}</p>}
              {cats.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  {cats.map((c: any, i: number) => (
                    <Badge key={i} sm>{typeof c === "string" ? c : c.name || c.category_name || "—"}</Badge>
                  ))}
                </div>
              )}
              {bio && <p className="text-xs text-text-mid mt-3 leading-relaxed whitespace-pre-line">{bio}</p>}
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
            <AppButton full icon="share" onClick={share}>Share profile</AppButton>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicProfileScreen;
