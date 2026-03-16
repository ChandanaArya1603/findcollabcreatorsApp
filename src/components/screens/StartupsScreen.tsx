import React, { useState } from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Badge } from "../findcollab/Badge";
import { Card } from "../findcollab/Card";
import { Pill } from "../findcollab/Pill";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Icon } from "../findcollab/Icon";

interface Startup {
  name: string;
  cat: string;
  desc: string;
  hot?: boolean;
}

const startups: Startup[] = [
  { name: "Nykaa", cat: "Beauty", desc: "India's leading beauty e-commerce platform with 35M+ customers.", hot: true },
  { name: "Sugar Cosmetics", cat: "Beauty", desc: "D2C beauty brand with 40,000+ retail touchpoints across India." },
  { name: "Swiggy Instamart", cat: "FoodTech", desc: "10-minute grocery delivery operating in 25+ Indian cities.", hot: true },
  { name: "Curefoods", cat: "FoodTech", desc: "Multi-brand cloud kitchen platform owning EatFit, Yumlane & more." },
  { name: "Practo", cat: "HealthTech", desc: "Digital health platform with 300M+ consultations facilitated." },
  { name: "Vedix", cat: "Beauty", desc: "Customised Ayurvedic hair care brand using ancient formulations." },
  { name: "Zerodha", cat: "Fintech", desc: "India's largest stockbroker with 10M+ active investors." },
  { name: "PhonePe", cat: "Fintech", desc: "Leading UPI payments platform processing 4B+ monthly transactions." },
  { name: "Byju's", cat: "EdTech", desc: "India's largest edtech company with 150M+ registered students." },
  { name: "Unacademy", cat: "EdTech", desc: "Online learning platform for competitive exam preparation." },
];

interface Props {
  onBack: () => void;
}

const StartupsScreen: React.FC<Props> = ({ onBack }) => {
  const [pitchTarget, setPitchTarget] = useState<Startup | null>(null);
  const [pitchMsg, setPitchMsg] = useState(
    "Hi there,\n\nI'm reaching out to explore potential collaboration opportunities.\n\nLooking forward to connecting!"
  );
  const [industry, setIndustry] = useState("All");
  const [search, setSearch] = useState("");
  const industries = ["All", "Beauty", "FoodTech", "HealthTech", "EdTech", "Fintech", "SaaS", "D2C", "Gaming"];

  const filtered = startups.filter((s) => {
    const matchesIndustry = industry === "All" || s.cat === industry;
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.cat.toLowerCase().includes(search.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5 relative">
      <BackHeader title="Discover Startups" onBack={onBack} />

      <div className="px-4 pb-2.5 bg-card border-b border-border">
        {/* Search Input */}
        <div className="relative mb-2.5">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon name="search" size={16} className="text-muted-foreground" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search startups or categories..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border-[1.5px] border-border text-sm bg-background text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>

        <p className="text-xs text-muted-foreground mb-2">Pitch directly to 722 startups</p>

        {/* Sliding Category Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-2.5 scrollbar-hide">
          {industries.map((i) => (
            <Pill key={i} active={industry === i} onClick={() => setIndustry(i)}>{i}</Pill>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3.5 flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <Icon name="search" size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No startups found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        )}
        {filtered.map((s, i) => (
          <Card key={i} className="!p-3.5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-2.5 items-center">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                  <Icon name="startup" size={18} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-extrabold text-foreground">{s.name}</p>
                    {s.hot && <Badge color="red" sm>🔥</Badge>}
                  </div>
                  <Badge color="pink" sm>{s.cat}</Badge>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{s.desc}</p>
            <AppButton full icon="send" onClick={() => setPitchTarget(s)}>Send Pitch</AppButton>
          </Card>
        ))}
      </div>

      {/* Pitch Bottom Sheet */}
      {pitchTarget && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setPitchTarget(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-5">
          <div className="bg-card rounded-[20px] p-5 shadow-2xl w-full max-w-[350px]">
            <div className="w-9 h-1 rounded-full bg-border mx-auto mb-4" />
            <p className="text-base font-black text-foreground mb-1">Pitch to {pitchTarget.name}</p>
            <p className="text-xs text-muted-foreground mb-3.5">Your media kit will be auto-attached</p>
            <AppInput label="Message" value={pitchMsg} onChange={setPitchMsg} multiline />
            <div className="py-2.5 px-3 bg-primary-light rounded-[10px] mt-2.5 mb-3.5">
              <p className="text-[11px] text-primary font-semibold">🔗 Media Kit auto-attached</p>
            </div>
            <div className="flex gap-2.5">
              <AppButton variant="outline" className="flex-1" onClick={() => setPitchTarget(null)}>Cancel</AppButton>
              <AppButton className="flex-[2]" icon="send" onClick={() => setPitchTarget(null)}>Send Pitch</AppButton>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartupsScreen;