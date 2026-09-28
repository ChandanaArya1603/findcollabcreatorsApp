import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialService } from "@/services/socialService";
import { useMediaKit, useYoutubeData } from "@/hooks/useAppData";
import { flattenStats, findStat } from "@/lib/statsFlatten";
import { instagramStats, youtubeStats } from "@/lib/socialStats";
import { BackHeader } from "../findcollab/BackHeader";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";

type Plat = "instagram" | "youtube" | "linkedin";

const StatGrid: React.FC<{ rows: [string, string][] }> = ({ rows }) => (
  <div className="grid grid-cols-2 gap-2">
    {rows.map(([k, v]) => (
      <div key={k} className="bg-background rounded-xl p-3">
        <p className="text-base font-black text-foreground break-words">{v}</p>
        <p className="text-[10px] text-muted-foreground font-semibold">{k}</p>
      </div>
    ))}
  </div>
);

const AnalyticsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<Plat>("instagram");
  const ig = useMediaKit();
  const yt = useYoutubeData();
  const li = useQuery({ queryKey: ["linkedin_data"], queryFn: () => socialService.getLinkedinData(), enabled: tab === "linkedin" });
  const q = tab === "instagram" ? ig : tab === "youtube" ? yt : li;
  const clean = (r: [string, string][]) => r.filter(([k]) => !/\b(id|ids|fbid|strong id|id acc|num results|youtube id)\b/i.test(k) && !/id$/i.test(k.replace(/\s/g, "")));
  const mapped = q.data ? (tab === "instagram" ? instagramStats(q.data) : tab === "youtube" ? youtubeStats(q.data) : null) : null;
  const rows = mapped ? mapped.rows : q.data ? clean(flattenStats(q.data)) : [];
  const followers = mapped ? mapped.followers : findStat(rows, /follower|subscriber|connection/i);
  const engagement = mapped ? mapped.engagement : findStat(rows, /engagement/i);

  const [username, setUsername] = useState("");
  const [calc, setCalc] = useState<[string, string][] | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const runCalc = async () => {
    if (!username.trim()) return toast.error("Enter a LinkedIn username");
    setCalcLoading(true);
    try {
      const res = await socialService.linkedinCalculator(username.trim());
      setCalc(flattenStats(res));
    } catch (err: any) {
      toast.error(err?.message || "Could not calculate");
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-6">
      <BackHeader title="Analytics" onBack={onBack} />
      <div className="px-4 pt-3.5 flex flex-col gap-3">
        <div className="flex gap-2">
          {(["instagram", "youtube", "linkedin"] as Plat[]).map((p) => (
            <Pill key={p} active={tab === p} onClick={() => setTab(p)}>
              {p === "instagram" ? "Instagram" : p === "youtube" ? "YouTube" : "LinkedIn"}
            </Pill>
          ))}
        </div>
        <Card>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
          ) : q.isError || rows.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-bold text-foreground">Not connected</p>
              <p className="text-xs text-muted-foreground mt-1">No stats yet for this account</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-primary-light rounded-xl p-3">
                  <p className="text-xl font-black text-primary">{followers ?? "—"}</p>
                  <p className="text-[10px] font-bold text-primary-dark">Followers</p>
                </div>
                <div className="bg-primary-light rounded-xl p-3">
                  <p className="text-xl font-black text-primary">{engagement ?? "—"}</p>
                  <p className="text-[10px] font-bold text-primary-dark">Engagement</p>
                </div>
              </div>
              <StatGrid rows={rows} />
            </>
          )}
        </Card>

        <Card>
          <p className="text-sm font-extrabold text-foreground mb-2">LinkedIn calculator</p>
          <div className="flex flex-col gap-2.5">
            <AppInput label="LinkedIn username" value={username} onChange={setUsername} placeholder="e.g. johndoe" />
            <AppButton full onClick={runCalc} disabled={calcLoading}>{calcLoading ? "Calculating…" : "Calculate"}</AppButton>
          </div>
          {calc && (
            <div className="mt-3">
              {calc.length ? <StatGrid rows={clean(calc)} /> : <p className="text-xs text-muted-foreground">No metrics returned</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
