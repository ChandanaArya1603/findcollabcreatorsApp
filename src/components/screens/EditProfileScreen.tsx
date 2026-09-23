import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { useMediaKit, useCategories, invalidateProfileData } from "@/hooks/useAppData";
import { BackHeader } from "../findcollab/BackHeader";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Badge } from "../findcollab/Badge";
import { Icon } from "../findcollab/Icon";
import { toast } from "sonner";

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

// Commercial keys returned by the API mapped to readable labels
const RATE_LABELS: Record<string, string> = {
  rate_per_reel: "Reel",
  rate_per_static_post: "Static Post",
  rate_per_video_story: "Video Story",
  rate_per_static_story: "Static Story",
  rate_per_carousel: "Carousel",
  rate_per_dedicated_video: "Dedicated Video",
  rate_per_integrated_video: "Integrated Video",
  rate_per_shorts: "Shorts",
  ugc_content_instagram: "UGC Content",
};

// userCommercials is an object of per-platform detail blobs, each possibly a JSON string
const parseRates = (raw: any, valueKey: string, rateKey: string): Commercial[] => {
  if (!raw) return [];
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return (Array.isArray(arr) ? arr : []).map((r: any) => ({
      service: RATE_LABELS[r[valueKey]] || r[valueKey] || "Service",
      rate: r[rateKey] != null && r[rateKey] !== "" ? String(Number(r[rateKey]) || r[rateKey]) : "",
      remarks: r.remarks || r.remark || "",
    }));
  } catch {
    return [];
  }
};

const EditProfileScreen: React.FC<Props> = ({ onBack }) => {
  const { user, userDetail, refreshProfile } = useAuth();
  const { data: mediaKit } = useMediaKit();
  const { data: categoryCatalogue } = useCategories();
  const [activeTab, setActiveTab] = useState("Basic Information");
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [saving, setSaving] = useState(false);

  const handleTabClick = useCallback((tab: string, index: number) => {
    setActiveTab(tab);
    const el = tabRefs.current[index];
    const container = tabBarRef.current;
    if (el && container) {
      const scrollLeft = el.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (el.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, []);

  // Basic Info - pre-fill from auth context
  const [name, setName] = useState(user ? `${user.fname}${user.lname ? ` ${user.lname}` : ""}` : "");
  const [bio, setBio] = useState(userDetail?.bio || userDetail?.introduction || "");
  const [location, setLocation] = useState(userDetail?.city || "");
  const [gmail, setGmail] = useState(user?.email || "");
  const [barterInterest, setBarterInterest] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");
  // name -> id map, used to send category IDs to /update_categories
  const [catIdByName, setCatIdByName] = useState<Record<string, number>>({});

  // Social Accounts
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState(userDetail?.content_website || "");
  const [primarySocial, setPrimarySocial] = useState(userDetail?.primary_account || "instagram");

  // Commercials
  const [commercialPlatform, setCommercialPlatform] = useState("instagram");
  const [commercials, setCommercials] = useState<Record<string, Commercial[]>>({
    instagram: [],
    youtube: [],
    linkedin: [],
  });

  // Past Projects
  const [projects, setProjects] = useState<Project[]>([]);

  // Pre-fill from the shared /media_kit data
  useEffect(() => {
    const res: any = mediaKit;
    if (!res) return;
    const ud: any = res.userDetail || {};

    setBio((prev) => ud.bio || ud.introduction || prev);
    setLocation((prev) => res.city || ud.city || prev);
    setInstagram((prev) => ud.instagram_user_name || ud.instagram_username || ud.instagram_link || prev);
    setYoutube((prev) =>
      ud.youtube_user_name || ud.youtube_channel_name || ud.youtube_channel_link || ud.youtube_link || ud.youtube_url || prev
    );
    setLinkedin((prev) => ud.linkedin_user_name || ud.linkedin_username || ud.linkedin_url || ud.linkedin_link || prev);
    setWebsite((prev) => ud.content_website || prev);
    setPrimarySocial((prev) => ud.primary_account || prev);

    if (Array.isArray(res.userCategories)) {
      setCategories(
        res.userCategories
          .map((c: any) => c.Interested_in_industry || c.name || c.category_name || "")
          .filter(Boolean)
      );
      setCatIdByName((prev) => {
        const next = { ...prev };
        res.userCategories.forEach((c: any) => {
          const nm = c.Interested_in_industry || c.name || c.category_name;
          const id = Number(c.category_id ?? c.id);
          if (nm && id) next[String(nm).toLowerCase()] = id;
        });
        return next;
      });
    }

    const uc: any = res.userCommercials || {};
    setCommercials({
      instagram: parseRates(uc.instagram_details, "instagram_values", "instagramrate"),
      youtube: parseRates(uc.youtube_details, "youtube_values", "youtuberate"),
      linkedin: parseRates(uc.linkedin_details, "linkedin_values", "linkedinrate"),
    });

    if (Array.isArray(res.userProjects)) {
      setProjects(
        res.userProjects.map((p: any) => ({
          brand: p.brand_name || p.brand || p.name || "",
          link: p.collaboration_link || p.link || p.url || "",
        }))
      );
    }
  }, [mediaKit]);

  // Full category catalogue so typed names can be mapped to IDs on save
  useEffect(() => {
    const res: any = categoryCatalogue;
    if (!res) return;
    const list = Array.isArray(res) ? res : res?.categories || res?.data?.categories || [];
    setCatIdByName((prev) => {
      const next = { ...prev };
      list.forEach((c: any) => {
        const nm = c.Interested_in_industry || c.name || c.category_name;
        const id = Number(c.id ?? c.category_id);
        if (nm && id) next[String(nm).toLowerCase()] = id;
      });
      return next;
    });
  }, [categoryCatalogue]);

  const addCategory = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
      setNewCat("");
    }
  };

  const removeCategory = (cat: string) => setCategories(categories.filter((c) => c !== cat));


  const handleSave = async () => {
    setSaving(true);
    try {
      const [fname, ...rest] = name.split(" ");
      await profileService.updateProfile({
        fname,
        lname: rest.join(" "),
        bio,
        city: location,
        mobile: userDetail?.mobile || "",
        instagram_user_name: instagram,
        youtube_user_name: youtube,
        linkedin_user_name: linkedin,
        content_website: website,
        primary_account: primarySocial,
      });

      // Save categories as IDs
      const ids: number[] = [];
      const unknown: string[] = [];
      categories.forEach((c) => {
        const id = catIdByName[c.toLowerCase()];
        if (id) ids.push(id);
        else unknown.push(c);
      });
      if (ids.length) {
        try {
          await profileService.updateCategories(ids);
        } catch (catErr: any) {
          toast.error(catErr?.message || "Could not save categories");
        }
      }
      if (unknown.length) {
        toast.error(`Not saved (unknown category): ${unknown.join(", ")}`);
      }

      // Refresh profile so the new values show everywhere immediately
      invalidateProfileData();
      try {
        await refreshProfile();
      } catch {
        // ignore refresh failures — the save itself succeeded
      }

      toast.success("Profile updated successfully!");
      onBack();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const commercialPlatforms = [
    { id: "instagram", label: "Instagram", ic: "insta" },
    { id: "youtube", label: "Youtube", ic: "yt" },
    { id: "linkedin", label: "LinkedIn", ic: "linkedin" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="Edit Profile" onBack={onBack} />

      <div className="flex justify-center pt-3 pb-2">
        <div className="w-20 h-20 rounded-[22px] bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-[32px] font-black">{(user?.fname || "D").charAt(0)}</span>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div ref={tabBarRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((t, i) => (
            <button
              key={t}
              ref={(el) => { tabRefs.current[i] = el; }}
              onClick={() => handleTabClick(t, i)}
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
                    <input type="radio" checked={barterInterest} onChange={() => setBarterInterest(true)} className="accent-primary w-3.5 h-3.5" />
                    <span className="text-xs font-semibold text-foreground">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={!barterInterest} onChange={() => setBarterInterest(false)} className="accent-primary w-3.5 h-3.5" />
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

        {activeTab === "Social Accounts" && (
          <Card>
            <p className="text-sm font-extrabold text-foreground mb-3">Social Accounts</p>
            <div className="flex flex-col gap-3">
              <div>
                <AppInput label="Instagram Username" value={instagram} onChange={setInstagram} placeholder="username" />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input type="radio" checked={primarySocial === "instagram"} onChange={() => setPrimarySocial("instagram")} className="accent-primary w-3 h-3" />
                  <span className="text-[10px] text-muted-foreground">{primarySocial === "instagram" ? "Primary" : "Make Primary"}</span>
                </label>
              </div>
              <div>
                <AppInput label="Youtube Username" value={youtube} onChange={setYoutube} placeholder="Channel URL" />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input type="radio" checked={primarySocial === "youtube"} onChange={() => setPrimarySocial("youtube")} className="accent-primary w-3 h-3" />
                  <span className="text-[10px] text-muted-foreground">{primarySocial === "youtube" ? "Primary" : "Make Primary"}</span>
                </label>
              </div>
              <div>
                <AppInput label="LinkedIn Username" value={linkedin} onChange={setLinkedin} placeholder="Profile URL" />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                  <input type="radio" checked={primarySocial === "linkedin"} onChange={() => setPrimarySocial("linkedin")} className="accent-primary w-3 h-3" />
                  <span className="text-[10px] text-muted-foreground">{primarySocial === "linkedin" ? "Primary" : "Make Primary"}</span>
                </label>
              </div>
              <AppInput label="Website Link" value={website} onChange={setWebsite} placeholder="https://..." />
            </div>
          </Card>
        )}

        {activeTab === "My Commercials" && (
          <>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {commercialPlatforms.map((cp) => (
                <button
                  key={cp.id}
                  onClick={() => setCommercialPlatform(cp.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                    commercialPlatform === cp.id ? "bg-foreground text-card border-foreground" : "bg-card text-foreground border-border"
                  }`}
                >
                  <Icon name={cp.ic} size={14} />
                  {cp.label}
                </button>
              ))}
            </div>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-extrabold text-foreground">
                  {commercialPlatforms.find((c) => c.id === commercialPlatform)?.label} Details
                </p>
                <span className="text-[10px] text-muted-foreground">Edit on findcollab.com</span>
              </div>
              {(commercials[commercialPlatform] || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                (commercials[commercialPlatform] || []).map((c, i) => (
                  <div key={i} className="mb-3 pb-3 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-xs font-bold text-foreground">{c.service || "—"}</p>
                      <p className="text-xs font-bold text-primary shrink-0">{c.rate ? `₹${c.rate}` : "—"}</p>
                    </div>
                    {c.remarks && <p className="text-[11px] text-muted-foreground mt-1">{c.remarks}</p>}
                  </div>
                ))
              )}
            </Card>
          </>
        )}

        {activeTab === "Past Projects" && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-extrabold text-foreground">Past Projects</p>
              <span className="text-[10px] text-muted-foreground">Edit on findcollab.com</span>
            </div>
            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground">—</p>
            ) : (
              projects.map((p, i) => (
                <div key={i} className="mb-3 pb-3 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                  <p className="text-xs font-bold text-foreground">{p.brand || "—"}</p>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer" className="text-[11px] text-primary break-all">
                      {p.link}
                    </a>
                  )}
                </div>
              ))
            )}
          </Card>
        )}

        <AppButton full icon="check" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </AppButton>
      </div>
    </div>
  );
};

export default EditProfileScreen;
