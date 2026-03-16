import React, { useState, useRef, useCallback } from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Badge } from "../findcollab/Badge";
import { Pill } from "../findcollab/Pill";
import { Icon } from "../findcollab/Icon";

interface Props {
  onBack: () => void;
}

const tabs = ["Basic Information", "Social Accounts", "My Commercials", "Past Projects"];

interface Commercial {
  service: string;
  rate: string;
  remarks: string;
}

interface Project {
  brand: string;
  link: string;
}

const EditProfileScreen: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("Basic Information");

  // Basic Info
  const [name, setName] = useState("Dilraj Singh");
  const [bio, setBio] = useState("India's Biggest Science & Experiment Creator");
  const [location, setLocation] = useState("Chennai");
  const [gmail, setGmail] = useState("officiallindianhacker@gmail.com");
  const [barterInterest, setBarterInterest] = useState(true);
  const [categories, setCategories] = useState(["Food", "Fitness", "Science & Tech", "Movies"]);
  const [newCat, setNewCat] = useState("");

  // Social Accounts
  const [instagram, setInstagram] = useState("dilraj_singh_rawat");
  const [youtube, setYoutube] = useState("https://www.youtube.com/channel/UCSiDGbOMnHFGjs4E2WKvShw");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("https://findcollab.com/");
  const [primarySocial, setPrimarySocial] = useState("instagram");

  // Commercials
  const [commercialPlatform, setCommercialPlatform] = useState("instagram");
  const [commercials, setCommercials] = useState<Record<string, Commercial[]>>({
    instagram: [
      { service: "Reel", rate: "1000000", remarks: "less than 60 Seconds" },
      { service: "Static Post", rate: "500000", remarks: "Single Static post" },
      { service: "Video Story", rate: "300000", remarks: "<45 Seconds" },
      { service: "Video Story", rate: "150000", remarks: "<30 Seconds" },
    ],
    youtube: [
      { service: "Dedicated Video", rate: "2500000", remarks: "Full video" },
      { service: "Integrated Video", rate: "1500000", remarks: "Brand mention" },
    ],
    linkedin: [],
  });

  // Past Projects
  const [projects, setProjects] = useState<Project[]>([
    { brand: "Sery Cosmetics", link: "https://www.instagram.com/reel/CSQOCHsg7S2/?hl=en" },
    { brand: "Wow Momo", link: "https://www.instagram.com/p/C374PQBykrx/" },
  ]);

  const addCategory = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
      setNewCat("");
    }
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const updateCommercial = (platform: string, index: number, field: keyof Commercial, value: string) => {
    setCommercials((prev) => {
      const updated = { ...prev };
      updated[platform] = [...(updated[platform] || [])];
      updated[platform][index] = { ...updated[platform][index], [field]: value };
      return updated;
    });
  };

  const addCommercial = (platform: string) => {
    setCommercials((prev) => ({
      ...prev,
      [platform]: [...(prev[platform] || []), { service: "", rate: "", remarks: "" }],
    }));
  };

  const removeCommercial = (platform: string, index: number) => {
    setCommercials((prev) => ({
      ...prev,
      [platform]: (prev[platform] || []).filter((_, i) => i !== index),
    }));
  };

  const addProject = () => {
    setProjects([...projects, { brand: "", link: "" }]);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    setProjects(projects.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const commercialPlatforms = [
    { id: "instagram", label: "Instagram", ic: "insta" },
    { id: "youtube", label: "Youtube", ic: "yt" },
    { id: "linkedin", label: "LinkedIn", ic: "linkedin" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="Edit Profile" onBack={onBack} />

      {/* Avatar */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-20 h-20 rounded-[22px] bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-[32px] font-black">D</span>
        </div>
      </div>

      {/* Tab Bar - Sliding */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all shrink-0 ${
                activeTab === t
                  ? "gradient-primary text-primary-foreground border-transparent shadow-primary"
                  : "bg-card text-primary border-border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3.5">
        {/* Basic Information */}
        {activeTab === "Basic Information" && (
          <>
            <Card>
              <p className="text-sm font-extrabold text-foreground mb-3">Basic Info</p>
              <div className="flex flex-col gap-3">
                <AppInput label="Full Name" value={name} onChange={setName} placeholder="Your name" />
                <AppInput label="Bio" value={bio} onChange={setBio} placeholder="Short bio" multiline />
                <AppInput label="Location" value={location} onChange={setLocation} placeholder="City" />
                <AppInput label="Gmail ID" value={gmail} onChange={setGmail} placeholder="your.email@gmail.com" />
              </div>
            </Card>

            <Card>
              <p className="text-sm font-extrabold text-foreground mb-3">Barter Campaigns</p>
              <div className="flex gap-4 items-center">
                <span className="text-xs text-muted-foreground">Are you interested in Barter Campaigns?</span>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={barterInterest}
                      onChange={() => setBarterInterest(true)}
                      className="accent-primary w-3.5 h-3.5"
                    />
                    <span className="text-xs font-semibold text-foreground">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={!barterInterest}
                      onChange={() => setBarterInterest(false)}
                      className="accent-primary w-3.5 h-3.5"
                    />
                    <span className="text-xs font-semibold text-foreground">No</span>
                  </label>
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-sm font-extrabold text-foreground mb-3">Categories</p>
              <div className="flex gap-1.5 flex-wrap mb-3">
                {categories.map((c) => (
                  <div key={c} onClick={() => removeCategory(c)} className="cursor-pointer">
                    <Badge color="pink" sm>{c} ✕</Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <AppInput value={newCat} onChange={setNewCat} placeholder="Add category" />
                </div>
                <AppButton variant="outline" icon="plus" onClick={addCategory} className="!py-2.5 !px-3.5">Add</AppButton>
              </div>
            </Card>
          </>
        )}

        {/* Social Accounts */}
        {activeTab === "Social Accounts" && (
          <Card>
            <p className="text-sm font-extrabold text-foreground mb-3">Social Accounts</p>
            <div className="flex flex-col gap-3">
              <div>
                <AppInput label="Instagram Username" value={instagram} onChange={setInstagram} placeholder="username" />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={primarySocial === "instagram"}
                    onChange={() => setPrimarySocial("instagram")}
                    className="accent-primary w-3 h-3"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {primarySocial === "instagram" ? "Primary" : "Make Primary"}
                  </span>
                </label>
              </div>

              <div>
                <AppInput label="Youtube Username" value={youtube} onChange={setYoutube} placeholder="Channel URL" />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={primarySocial === "youtube"}
                    onChange={() => setPrimarySocial("youtube")}
                    className="accent-primary w-3 h-3"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {primarySocial === "youtube" ? "Primary" : "Make Primary"}
                  </span>
                </label>
              </div>

              <div>
                <AppInput label="LinkedIn Username" value={linkedin} onChange={setLinkedin} placeholder="Profile URL" />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={primarySocial === "linkedin"}
                    onChange={() => setPrimarySocial("linkedin")}
                    className="accent-primary w-3 h-3"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {primarySocial === "linkedin" ? "Primary" : "Make Primary"}
                  </span>
                </label>
              </div>

              <div>
                <AppInput label="Website Link" value={website} onChange={setWebsite} placeholder="https://..." />
              </div>
            </div>
          </Card>
        )}

        {/* My Commercials */}
        {activeTab === "My Commercials" && (
          <>
            {/* Platform selector */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {commercialPlatforms.map((cp) => (
                <button
                  key={cp.id}
                  onClick={() => setCommercialPlatform(cp.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                    commercialPlatform === cp.id
                      ? "bg-foreground text-card border-foreground"
                      : "bg-card text-foreground border-border"
                  }`}
                >
                  <Icon name={cp.ic} size={14} />
                  {cp.label}
                </button>
              ))}
            </div>

            <Card>
              <p className="text-sm font-extrabold text-foreground mb-3">
                {commercialPlatforms.find((c) => c.id === commercialPlatform)?.label} Details
              </p>
              {(commercials[commercialPlatform] || []).map((c, i) => (
                <div key={i} className="mb-3 pb-3 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <AppInput label="Service" value={c.service} onChange={(v) => updateCommercial(commercialPlatform, i, "service", v)} placeholder="Service name" />
                      </div>
                      <div className="w-24">
                        <AppInput label="Rate(₹)" value={c.rate} onChange={(v) => updateCommercial(commercialPlatform, i, "rate", v)} placeholder="Amount" />
                      </div>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <AppInput label="Remarks" value={c.remarks} onChange={(v) => updateCommercial(commercialPlatform, i, "remarks", v)} placeholder="Details" />
                      </div>
                      <button
                        onClick={() => removeCommercial(commercialPlatform, i)}
                        className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 cursor-pointer border-none"
                      >
                        <Icon name="close" size={16} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addCommercial(commercialPlatform)}
                className="w-full py-2.5 rounded-xl border-[1.5px] border-dashed border-border text-xs font-bold text-muted-foreground cursor-pointer bg-transparent mt-2"
              >
                + Add More
              </button>
            </Card>
          </>
        )}

        {/* Past Projects */}
        {activeTab === "Past Projects" && (
          <Card>
            <p className="text-sm font-extrabold text-foreground mb-3">Past Projects</p>
            {projects.map((p, i) => (
              <div key={i} className="mb-3 pb-3 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                <div className="flex flex-col gap-2">
                  <AppInput label="Brand Name" value={p.brand} onChange={(v) => updateProject(i, "brand", v)} placeholder="Brand name" />
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <AppInput label="Collaboration Link" value={p.link} onChange={(v) => updateProject(i, "link", v)} placeholder="https://..." />
                    </div>
                    <button
                      onClick={() => removeProject(i)}
                      className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 cursor-pointer border-none"
                    >
                      <Icon name="close" size={16} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addProject}
              className="w-full py-2.5 rounded-xl border-[1.5px] border-dashed border-border text-xs font-bold text-muted-foreground cursor-pointer bg-transparent mt-2"
            >
              + Add More
            </button>
          </Card>
        )}

        <AppButton full icon="check" onClick={onBack}>Save Changes</AppButton>
      </div>
    </div>
  );
};

export default EditProfileScreen;