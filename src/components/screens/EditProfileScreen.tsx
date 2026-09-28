import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaKit, useCategories } from "@/hooks/useAppData";
import { qk } from "@/lib/queryKeys";
import { handleFrom, getProfilePhoto } from "@/lib/profilePhoto";
import { isUnknownMethod, toOptions, type Opt } from "@/lib/listParse";
import { profileService } from "@/services/profileService";
import { onboardingService } from "@/services/onboardingService";
import { utilityService } from "@/services/utilityService";
import { BackHeader } from "../findcollab/BackHeader";
import { Card } from "../findcollab/Card";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Icon } from "../findcollab/Icon";

interface Props { onBack: () => void }
type Platform = "instagram" | "youtube" | "linkedin";
interface Commercial { d: string; rate: string; remarks: string }
interface Project { id?: number | string; brand: string; link: string }

const tabs = ["Basic Information", "Social Accounts", "My Commercials", "Past Projects"];
const MAX_CATS = 5;
const DELIVERABLES: Record<Platform, string[]> = {
  instagram: ["Reel", "Post", "Story", "Carousel"],
  youtube: ["Dedicated video", "Integration", "Shorts"],
  linkedin: ["Post", "Article"],
};
const clean = (v: any) => (v == null || String(v).toLowerCase() === "null" ? "" : String(v));
const parse = (raw: any): any[] => {
  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
  } catch { return []; }
};
const readId = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = Number(source?.[key]);
    if (value > 0) return value;
  }
  return 0;
};
const matchId = (options: Opt[], value: any) => {
  const numeric = Number(value);
  if (numeric > 0 && options.some((o) => o.id === numeric)) return numeric;
  const text = clean(value).trim().toLowerCase();
  return options.find((o) => o.name.toLowerCase() === text)?.id || 0;
};
const selectCls = "w-full p-3 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary disabled:opacity-60";
const inputCls = "p-2.5 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary min-w-0";

const EditProfileScreen: React.FC<Props> = ({ onBack }) => {
  const qc = useQueryClient();
  const { user, userDetail, refreshProfile } = useAuth();
  const { data: mediaKit, refetch: refetchMediaKit } = useMediaKit();
  const { data: categoryCatalogue } = useCategories();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [saving, setSaving] = useState(false);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [name, setName] = useState(user ? `${user.fname}${user.lname ? ` ${user.lname}` : ""}` : "");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState<number | "">("");
  const [state, setState] = useState<number | "">("");
  const [city, setCity] = useState<number | "">("");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [languageIds, setLanguageIds] = useState<number[]>([]);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [uploadedPhoto, setUploadedPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [primarySocial, setPrimarySocial] = useState<Platform>("instagram");

  const [barter, setBarter] = useState<"yes" | "no">("no");
  const [commercialPlatform, setCommercialPlatform] = useState<Platform>("instagram");
  const [commercials, setCommercials] = useState<Record<Platform, Commercial[]>>({ instagram: [], youtube: [], linkedin: [] });
  const [contentRate, setContentRate] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [brand, setBrand] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [projectLogo, setProjectLogo] = useState<File | null>(null);
  const [projectLogoPreview, setProjectLogoPreview] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const countryQ = useQuery({ queryKey: ["countries"], queryFn: utilityService.getCountries, staleTime: 36e5 });
  const countryOpts = useMemo(() => toOptions(countryQ.data), [countryQ.data]);
  const stateQ = useQuery({
    queryKey: ["states", country], enabled: Boolean(country), staleTime: 36e5,
    queryFn: () => utilityService.getStates(Number(country)),
  });
  const stateOpts = useMemo(() => toOptions(stateQ.data), [stateQ.data]);
  const cityQ = useQuery({
    queryKey: ["cities", state], enabled: Boolean(state), staleTime: 36e5,
    queryFn: () => utilityService.getCities(Number(state)),
  });
  const cityOpts = useMemo(() => toOptions(cityQ.data), [cityQ.data]);
  const categoryOpts = useMemo(() => toOptions(categoryCatalogue), [categoryCatalogue]);
  const languageQ = useQuery({ queryKey: ["languages"], queryFn: utilityService.getLanguages, staleTime: 36e5 });
  const languageOpts = useMemo(() => toOptions(languageQ.data), [languageQ.data]);

  useEffect(() => {
    const mk: any = mediaKit;
    if (!mk) return;
    const ud = mk.userDetail || {};
    setBio(clean(ud.introduction));
    const fullName = clean(ud.firstname) || [clean(mk.user?.fname), clean(mk.user?.lname)].filter(Boolean).join(" ");
    if (fullName) setName(fullName);
    setDob(clean(ud.dob).slice(0, 10));
    const g = clean(ud.gender).toLowerCase();
    setGender(g ? g[0].toUpperCase() + g.slice(1) : "");
    setAddress(clean(ud.address));
    const langs = Array.isArray(mk.userLanguages)
      ? mk.userLanguages.map((l: any) => Number(l.language_id ?? l.id)).filter((id: number) => id > 0)
      : [];
    setLanguageIds(langs);
    setInstagram(handleFrom(mk.instagramData?.insta_handle) || handleFrom(ud.insta_url) || handleFrom(ud.instagram_user_name));
    setYoutube(handleFrom(ud.youtube_url) || handleFrom(ud.youtube_user_name));
    setLinkedin(handleFrom(ud.linkedin_url) || handleFrom(ud.linkedin_user_name));
    if (["instagram", "youtube", "linkedin"].includes(ud.primary_account)) setPrimarySocial(ud.primary_account);

    const selected = Array.isArray(mk.userCategories)
      ? mk.userCategories.map((c: any) => Number(c.id ?? c.category_id)).filter((id: number) => id > 0)
      : [];
    if (selected.length) setCategoryIds(selected);

    const uc = mk.userCommercials || {};
    const map = (raw: any, platform: Platform): Commercial[] => parse(raw)
      .map((r) => ({
        d: clean(r[`${platform}_values`]),
        rate: clean(r[`${platform}rate`]),
        remarks: clean(r[`${platform}remarks`] ?? r.remarks),
      }))
      .filter((r) => r.d || r.rate || r.remarks);
    setCommercials({ instagram: map(uc.instagram_details, "instagram"), youtube: map(uc.youtube_details, "youtube"), linkedin: map(uc.linkedin_details, "linkedin") });
    const barterValue = clean(uc.barter_campaign ?? ud.barter_campaign).toLowerCase();
    setBarter(barterValue === "yes" || barterValue === "1" ? "yes" : "no");
    setContentRate(clean(parse(uc.content_writing_details)[0]?.cost_per_coverage));

    setProjects(Array.isArray(mk.userProjects) ? mk.userProjects.map((p: any) => ({
      id: p.id ?? p.project_id,
      brand: p.brand_name || p.brand || "",
      link: p.collaboration_link || p.link || "",
    })) : []);
  }, [mediaKit]);

  useEffect(() => {
    if (!mediaKit || !categoryOpts.length || categoryIds.length) return;
    const existing = Array.isArray((mediaKit as any).userCategories) ? (mediaKit as any).userCategories : [];
    const ids = existing
      .map((category: any) => matchId(categoryOpts, category.Interested_in_industry || category.name || category.category_name))
      .filter((id: number) => id > 0);
    if (ids.length) setCategoryIds(ids);
  }, [mediaKit, categoryOpts, categoryIds.length]);

  useEffect(() => {
    if (!mediaKit || !countryOpts.length || country) return;
    const mk: any = mediaKit;
    const ud = mk.userDetail || {};
    const id = readId(ud, ["country_id"]) || readId(mk, ["country_id"]) || matchId(countryOpts, ud.country || mk.country);
    if (id) setCountry(id);
  }, [mediaKit, countryOpts, country]);

  useEffect(() => {
    if (!mediaKit || !stateOpts.length || state) return;
    const mk: any = mediaKit;
    const ud = mk.userDetail || {};
    const id = readId(ud, ["state_id"]) || readId(mk, ["state_id"]) || matchId(stateOpts, ud.state || mk.state);
    if (id) setState(id);
  }, [mediaKit, stateOpts, state]);

  useEffect(() => {
    if (!mediaKit || !cityOpts.length || city) return;
    const mk: any = mediaKit;
    const ud = mk.userDetail || {};
    const id = readId(ud, ["city_id"]) || readId(mk, ["city_id"]) || matchId(cityOpts, ud.city || mk.city);
    if (id) setCity(id);
  }, [mediaKit, cityOpts, city]);

  useEffect(() => () => {
    if (projectLogoPreview) URL.revokeObjectURL(projectLogoPreview);
  }, [projectLogoPreview]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: qk.mediaKit });
    await qc.invalidateQueries({ queryKey: ["profile_completion"] });
    await refetchMediaKit();
    await refreshProfile().catch(() => undefined);
  };

  const run = async (work: () => Promise<any>, success: string) => {
    setSaving(true);
    try {
      await work();
      await refresh();
      toast.success(success);
      return true;
    } catch (err: any) {
      toast.error(isUnknownMethod(err) ? "Saving this section will be available shortly" : err?.message || "Could not save");
      return false;
    } finally { setSaving(false); }
  };

  const selectTab = (tab: string, index: number) => {
    setActiveTab(tab);
    const el = tabRefs.current[index];
    const container = tabBarRef.current;
    if (el && container) container.scrollTo({ left: el.offsetLeft - container.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  };

  const saveBasic = async () => {
    if (!name.trim()) return toast.error("Enter your name");
    if (!dob) return toast.error("Select your date of birth");
    if (!gender) return toast.error("Select your gender");
    if (!country || !state || !city) return toast.error("Select your country, state and city");
    if (!categoryIds.length) return toast.error("Pick at least one category");
    if (!languageIds.length) return toast.error("Pick at least one language");
    setSaving(true);
    const failedLabels: string[] = [];
    const attempt = async (label: string, work: () => Promise<any>) => {
      try { await work(); return true; } catch { failedLabels.push(label); return false; }
    };
    const profileSaved = await attempt("Profile details", () => profileService.updateProfile(mediaKit, {
      firstname: name, introduction: bio, dob, gender, address, country, state, city,
    }));
    const categoriesSaved = await attempt("Categories", () => profileService.updateCategories(categoryIds));
    const languagesSaved = await attempt("Languages", () => profileService.updateLanguages(languageIds));
    await refresh().catch(() => undefined);
    setSaving(false);
    if (!profileSaved) {
      toast.error("Couldn't save your profile details. Please try again.");
      return;
    }
    if (!categoriesSaved || !languagesSaved) {
      const names = [!categoriesSaved && "Categories", !languagesSaved && "Languages"].filter(Boolean).join(" and ");
      toast.error(`Profile saved. ${names} couldn't be updated right now.`);
      return;
    }
    toast.success("Saved");
    onBack();
  };

  const toggleLanguage = (id: number) =>
    setLanguageIds((cur) => cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]);

  const compress = (file: File): Promise<File> => new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => blob ? resolve(new File([blob], "profile.jpg", { type: "image/jpeg" })) : reject(new Error("Could not process image")), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });

  const choosePhoto = async (file?: File) => {
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file) return;
    if (!/^image\/(jpe?g|png)$/i.test(file.type)) return toast.error("Choose a JPG or PNG image");
    if (file.size > 2 * 1024 * 1024) return toast.error("Photo must be under 2 MB");
    setUploadingPhoto(true);
    const localPreview = URL.createObjectURL(file);
    setUploadedPhoto(localPreview);
    try {
      const res: any = await profileService.uploadProfileImage(await compress(file));
      const url = [res?.image_url, res?.url, res?.profile_image, res?.img_name, res?.data?.image_url, res?.data?.img_name]
        .find((v) => typeof v === "string" && v.trim());
      if (url) {
        setUploadedPhoto(url);
        qc.setQueryData(qk.mediaKit, (old: any) => old ? { ...old, userDetail: { ...(old.userDetail || {}), img_name: url } } : old);
      }
      toast.success("Profile photo updated");
      await refresh().catch(() => undefined);
    } catch (err: any) {
      setUploadedPhoto("");
      toast.error(err?.message || "Could not upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveSocial = () => {
    if (!instagram.trim() && !youtube.trim() && !linkedin.trim()) return toast.error("Add at least one username");
    return run(() => onboardingService.updateSocialAccounts({
      instagram_username: handleFrom(instagram), youtube_username: handleFrom(youtube), linkedin_username: handleFrom(linkedin), primary_account: primarySocial,
    }), "Social accounts saved");
  };

  const saveCommercials = () => {
    const all = (Object.keys(commercials) as Platform[]).flatMap((p) => commercials[p]);
    if (all.some((row) => !row.d || !(Number(row.rate) > 0))) return toast.error("Each row needs a deliverable and a rate");
    const serialize = (platform: Platform) => JSON.stringify(commercials[platform].map((row) => ({
      [`${platform}_values`]: row.d,
      [`${platform}rate`]: row.rate,
      [`${platform}remarks`]: row.remarks,
    })));
    return run(() => onboardingService.updateCommercials({
      barter_campaign: barter,
      instagram_details: serialize("instagram"), youtube_details: serialize("youtube"), linkedin_details: serialize("linkedin"),
      content_writing_details: JSON.stringify({ cost_per_coverage: contentRate }),
    }), "Commercials saved");
  };

  const setRow = (platform: Platform, index: number, patch: Partial<Commercial>) =>
    setCommercials((current) => ({ ...current, [platform]: current[platform].map((row, i) => i === index ? { ...row, ...patch } : row) }));

  const chooseLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Logo must be under 5 MB");
    setProjectLogo(file);
    setProjectLogoPreview(URL.createObjectURL(file));
  };

  const addProject = async () => {
    const b = brand.trim();
    let link = projectLink.trim();
    if (!b) return toast.error("Enter the brand name");
    if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`;
    if (!/^https?:\/\/\S+\.\S+/.test(link)) return toast.error("Enter a valid collaboration link");
    const ok = await run(() => onboardingService.addProject(b, link), "Project added");
    if (ok) {
      setBrand(""); setProjectLink("");
      if (projectLogo) toast("Project saved. Logo upload needs backend support.");
      setProjectLogo(null); setProjectLogoPreview("");
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const removeProject = async (project: Project) => {
    if (!project.id) return toast.error("This project cannot be removed yet");
    await run(() => onboardingService.deleteProject(project.id as number | string), "Project removed");
  };

  const toggleCategory = (id: number) => {
    setCategoryIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= MAX_CATS) { toast.error(`You can pick up to ${MAX_CATS} categories`); return current; }
      return [...current, id];
    });
  };

  const photo = (uploadedPhoto && !uploadedPhoto.startsWith("blob:") ? uploadedPhoto : "") || getProfilePhoto(mediaKit, user, userDetail) || uploadedPhoto;
  const chip = (selected: boolean) => `px-3 py-2 rounded-xl text-xs font-bold ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`;
  const sectionSave = activeTab === tabs[0] ? saveBasic : activeTab === tabs[1] ? saveSocial : activeTab === tabs[2] ? saveCommercials : undefined;

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-5">
      <BackHeader title="Edit Profile" onBack={onBack} />
      <div className="flex justify-center pt-3 pb-2">
        <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} aria-label="Change profile photo" className="relative">
          <div className="w-20 h-20 rounded-full bg-primary overflow-hidden flex items-center justify-center">
            {photo ? <img src={photo} alt="Profile" className={`w-full h-full object-cover ${uploadingPhoto ? "opacity-60" : ""}`} /> : <span className="text-primary-foreground text-[32px] font-black">{(user?.fname || "D").charAt(0)}</span>}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary border-2 border-card flex items-center justify-center">
            <Icon name="camera" size={13} className="text-primary-foreground" />
          </span>
        </button>
        <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => choosePhoto(e.target.files?.[0])} />
      </div>

      <div className="px-4 pb-3">
        <div ref={tabBarRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab, index) => (
            <button key={tab} ref={(el) => { tabRefs.current[index] = el; }} onClick={() => selectTab(tab, index)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl border text-[11px] font-bold shrink-0 ${activeTab === tab ? "gradient-primary text-primary-foreground border-transparent shadow-primary" : "bg-card text-primary border-border"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3.5">
        {activeTab === tabs[0] && <>
          <Card className="!p-4 flex flex-col gap-3">
            <p className="text-sm font-extrabold text-foreground">Basic information</p>
            <AppInput label="Full name" value={name} onChange={setName} placeholder="Your name" />
            <AppInput label="Bio" value={bio} onChange={setBio} placeholder="Short bio" multiline />
            <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Date of birth</label>
            <input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} className={selectCls} />
            <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Gender</label>
            <div className="flex gap-2">{["Female", "Male", "Other"].map((g) => <button key={g} type="button" onClick={() => setGender(g)} className={`${chip(gender === g)} flex-1`}>{g}</button>)}</div>
            <AppInput label="Address (optional)" value={address} onChange={setAddress} placeholder="Street, area" />
            <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">Location</label>
            <select value={country} onChange={(e) => { setCountry(Number(e.target.value) || ""); setState(""); setCity(""); }} className={selectCls}>
              <option value="">{countryQ.isFetching ? "Loading countries…" : "Country"}</option>
              {countryOpts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={state} disabled={!country} onChange={(e) => { setState(Number(e.target.value) || ""); setCity(""); }} className={selectCls}>
              <option value="">{stateQ.isFetching ? "Loading states…" : "State"}</option>
              {stateOpts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={city} disabled={!state} onChange={(e) => setCity(Number(e.target.value) || "")} className={selectCls}>
              <option value="">{cityQ.isFetching ? "Loading cities…" : "City"}</option>
              {cityOpts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-extrabold text-foreground">Categories</p>
              <span className="text-[11px] text-text-mid">{categoryIds.length}/{MAX_CATS}</span>
            </div>
            {categoryOpts.length ? <div className="flex flex-wrap gap-2">{categoryOpts.map((option) => (
              <button key={option.id} type="button" onClick={() => toggleCategory(option.id)} className={chip(categoryIds.includes(option.id))}>{option.name}</button>
            ))}</div> : <p className="text-xs text-text-mid">{categoryCatalogue ? "No categories available" : "Loading categories…"}</p>}
          </Card>
          <Card className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-extrabold text-foreground">Languages</p>
              <span className="text-[11px] text-text-mid">{languageIds.length} selected</span>
            </div>
            {languageOpts.length ? <div className="flex flex-wrap gap-2">{languageOpts.map((option) => (
              <button key={option.id} type="button" onClick={() => toggleLanguage(option.id)} className={chip(languageIds.includes(option.id))}>{option.name}</button>
            ))}</div> : <p className="text-xs text-text-mid">{languageQ.data ? "No languages available" : "Loading languages…"}</p>}
          </Card>
        </>}

        {activeTab === tabs[1] && <Card className="!p-4 flex flex-col gap-3.5">
          <p className="text-sm font-extrabold text-foreground">Social accounts</p>
          {(["instagram", "youtube", "linkedin"] as Platform[]).map((platform) => {
            const values = { instagram, youtube, linkedin };
            const setters = { instagram: setInstagram, youtube: setYoutube, linkedin: setLinkedin };
            return <div key={platform}>
              <AppInput label={`${platform === "youtube" ? "YouTube" : platform[0].toUpperCase() + platform.slice(1)} username`} value={values[platform]} onChange={setters[platform]} placeholder="username" />
              <label className="flex items-center gap-1.5 mt-1.5">
                <input type="radio" checked={primarySocial === platform} onChange={() => setPrimarySocial(platform)} className="accent-primary" />
                <span className="text-[10px] text-muted-foreground">{primarySocial === platform ? "Primary" : "Make primary"}</span>
              </label>
            </div>;
          })}
        </Card>}

        {activeTab === tabs[2] && <>
          <Card className="!p-4">
            <p className="text-sm font-bold text-foreground mb-2">Open to barter collaborations?</p>
            <div className="flex gap-2">{(["yes", "no"] as const).map((value) => <button key={value} onClick={() => setBarter(value)} className={`${chip(barter === value)} flex-1 capitalize`}>{value}</button>)}</div>
          </Card>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(["instagram", "youtube", "linkedin"] as Platform[]).map((platform) => <button key={platform} onClick={() => setCommercialPlatform(platform)} className={`${chip(commercialPlatform === platform)} capitalize whitespace-nowrap`}>{platform}</button>)}
          </div>
          <Card className="!p-4">
            <p className="text-sm font-black text-foreground capitalize mb-3">{commercialPlatform} rates</p>
            {commercials[commercialPlatform].length === 0 && <p className="text-xs text-text-mid mb-3">No rates yet</p>}
            {commercials[commercialPlatform].map((row, index) => <div key={index} className="flex flex-col gap-2 mb-3 pb-3 border-b border-border last:border-0">
              <div className="flex gap-2">
                <select value={row.d} onChange={(e) => setRow(commercialPlatform, index, { d: e.target.value })} className={`${inputCls} flex-1`}>
                  <option value="">Deliverable</option>{DELIVERABLES[commercialPlatform].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input value={row.rate} inputMode="numeric" placeholder="₹ Rate" onChange={(e) => setRow(commercialPlatform, index, { rate: e.target.value.replace(/\D/g, "") })} className={`${inputCls} w-24`} />
              </div>
              <div className="flex gap-2">
                <input value={row.remarks} placeholder="Remarks (optional)" onChange={(e) => setRow(commercialPlatform, index, { remarks: e.target.value })} className={`${inputCls} flex-1`} />
                <AppButton variant="ghost" onClick={() => setCommercials((current) => ({ ...current, [commercialPlatform]: current[commercialPlatform].filter((_, i) => i !== index) }))} className="!px-3 !py-2">Remove</AppButton>
              </div>
            </div>)}
            <AppButton variant="outline" icon="plus" onClick={() => setCommercials((current) => ({ ...current, [commercialPlatform]: [...current[commercialPlatform], { d: "", rate: "", remarks: "" }] }))} className="!py-2.5">Add rate</AppButton>
          </Card>
          <Card className="!p-4">
            <p className="text-sm font-black text-foreground mb-2">Content writing</p>
            <input value={contentRate} inputMode="numeric" placeholder="₹ Cost per coverage" onChange={(e) => setContentRate(e.target.value.replace(/\D/g, ""))} className={`${inputCls} w-full`} />
          </Card>
        </>}

        {activeTab === tabs[3] && <>
          <Card className="!p-4 flex flex-col gap-3">
            <p className="text-sm font-extrabold text-foreground">Add past project</p>
            <AppInput label="Brand name" value={brand} onChange={setBrand} placeholder="Brand" />
            <AppInput label="Collaboration link" value={projectLink} onChange={setProjectLink} placeholder="https://" />
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => chooseLogo(e.target.files?.[0])} />
            <div className="flex items-center gap-3">
              {projectLogoPreview ? <img src={projectLogoPreview} alt="Project logo preview" className="w-14 h-14 rounded-lg border border-border object-contain bg-card" /> : <div className="w-14 h-14 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center"><Icon name="plus" size={18} className="text-text-mid" /></div>}
              <div className="flex-1">
                <AppButton variant="outline" onClick={() => logoInputRef.current?.click()} className="!py-2.5">Choose logo</AppButton>
                <p className="text-[10px] text-text-mid mt-1.5">Logo upload will be enabled when supported by the server.</p>
              </div>
            </div>
            <AppButton full icon="plus" onClick={addProject} disabled={saving}>Add project</AppButton>
          </Card>
          {projects.length === 0 ? <p className="text-xs text-text-mid text-center">No projects yet</p> : projects.map((project, index) => <Card key={project.id ?? index} className="!p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary font-black">{(project.brand || "P").charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-foreground truncate">{project.brand || "—"}</p><p className="text-[11px] text-text-mid truncate">{project.link || "—"}</p></div>
            <AppButton variant="ghost" onClick={() => removeProject(project)} disabled={saving} className="!px-3 !py-2">Remove</AppButton>
          </Card>)}
        </>}

        {sectionSave && <AppButton full icon="check" onClick={sectionSave} disabled={saving}>{saving ? "Saving…" : `Save ${activeTab === tabs[0] ? "basic information" : activeTab === tabs[1] ? "social accounts" : "commercials"}`}</AppButton>}
      </div>
    </div>
  );
};

export default EditProfileScreen;
