import React, { useState } from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { Icon } from "../findcollab/Icon";

interface Props {
  onBack: () => void;
}

const MediaKitScreen: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState("stats");

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="My Media Kit" onBack={onBack} right={
        <button className="w-9 h-9 rounded-[10px] bg-primary-light border-none flex items-center justify-center cursor-pointer">
          <Icon name="send" size={16} className="text-primary" />
        </button>
      } />
      <div className="bg-card border-b border-border">
        <div className="h-[70px] gradient-hero" />
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 mb-3">
            <div className="w-16 h-16 rounded-[18px] bg-primary border-[3px] border-card -mt-8 flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-2xl font-black">D</span>
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[17px] font-black text-foreground">Dilraj Singh</p>
                <Badge color="blue" sm>✓ Verified</Badge>
              </div>
              <p className="text-[11px] text-text-light mt-0.5">📍 Chennai, India • Hindi, English</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["Food", "Fitness", "Science & Tech", "Movies"].map((t) => (
              <Badge key={t} color="pink" sm>{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3.5">
        <div className="flex gap-2 mb-3.5">
          {[["stats", "Stats"], ["rates", "Rates"], ["projects", "Projects"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
        </div>

        {tab === "stats" && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { l: "Instagram", v: "6.1M", ic: "insta", c: "text-pink-600" },
                { l: "YouTube", v: "32.7M", ic: "yt", c: "text-red-600" },
                { l: "LinkedIn", v: "120K", ic: "linkedin", c: "text-blue-600" },
                { l: "TikTok", v: "4.2M", ic: "tiktok", c: "text-foreground" },
              ].map((s) => (
                <Card key={s.l} className="!p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon name={s.ic} size={18} className={s.c} />
                    <p className="text-[11px] text-text-light">{s.l}</p>
                  </div>
                  <p className="text-2xl font-black text-foreground">{s.v}</p>
                </Card>
              ))}
            </div>
            <Card className="!bg-gradient-to-br from-primary-light to-card">
              <p className="text-[13px] font-extrabold text-foreground mb-3">Engagement Metrics</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[["Avg Likes", "2.1M"], ["Reel Views", "2M"], ["Comments", "94.4K"], ["Engagement", "37.03%"]].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-lg font-black text-primary">{v}</p>
                    <p className="text-[10px] text-text-mid mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "rates" && (
          <Card>
            <p className="text-[13px] font-extrabold text-foreground mb-3">Instagram Commercials</p>
            {[["Reel (<60s)", "₹10,00,000"], ["Static Post", "₹5,00,000"], ["Video Story (<45s)", "₹3,00,000"], ["Video Story (<30s)", "₹1,50,000"]].map(([s, r], i) => (
              <div key={i} className={`flex justify-between items-center py-2.5 ${i < 3 ? "border-b border-border" : ""}`}>
                <p className="text-[13px] text-foreground">{s}</p>
                <p className="text-sm font-black text-primary">{r}</p>
              </div>
            ))}
          </Card>
        )}

        {tab === "projects" && (
          <div className="flex flex-col gap-2.5">
            {[
              { brand: "Sery Cosmetics", link: "instagram.com/reel/CSQOCHsg7S2" },
              { brand: "Wow Momo", link: "instagram.com/p/C374PQBykrx" },
            ].map((p, i) => (
              <Card key={i} className="!p-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center">
                    <Icon name="insta" size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{p.brand}</p>
                    <p className="text-[11px] text-primary mt-0.5">🔗 {p.link}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaKitScreen;
