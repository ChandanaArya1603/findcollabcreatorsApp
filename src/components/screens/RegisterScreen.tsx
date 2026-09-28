import React, { useEffect, useMemo, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { utilityService } from "@/services/utilityService";
import { toOptions, type Opt } from "@/lib/listParse";
import { useAvailability, type Avail } from "@/hooks/useAvailability";
const logoMark = { url: "/collab-cluster-mark.png" };
const logoFull = { url: "/findcollab-logo-full.png" };

interface Props {
  onSwitch: () => void;
  onVerify?: (info: { userId?: number; email: string; notice?: string }) => void;
}

const Hint: React.FC<{ a: { s: Avail; msg?: string } }> = ({ a }) =>
  a.s === "idle" ? null : (
    <p className={`text-[11px] -mt-2.5 font-semibold ${a.s === "taken" ? "text-destructive" : a.s === "available" ? "text-success" : "text-muted-foreground"}`}>
      {a.s === "checking" ? "Checking…" : a.s === "available" ? "✓ available" : `✗ ${a.msg || "taken"}`}
    </p>
  );

const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);
const isPhone = (v: string) => v.replace(/\D/g, "").length >= 8;
const isHandle = (v: string) => v.length >= 2;
const MAX_CATS = 5;

const ageOf = (dob: string) => {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return -1;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[11px] font-bold text-text-mid uppercase tracking-wider">{children}</label>
);
const selectCls = "w-full p-3 rounded-xl border-[1.5px] border-border text-sm bg-card text-foreground outline-none focus:border-primary disabled:opacity-60";

const Chips: React.FC<{ options: Opt[]; value: number[]; onToggle: (id: number) => void; empty: string }> = ({ options, value, onToggle, empty }) =>
  options.length === 0 ? (
    <p className="text-xs text-text-mid">{empty}</p>
  ) : (
    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onToggle(o.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold ${value.includes(o.id) ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`}>
          {o.name}
        </button>
      ))}
    </div>
  );

const RegisterScreen: React.FC<Props> = ({ onSwitch, onVerify }) => {
  const { register, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactno, setContactno] = useState("");
  const [referral, setReferral] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [languages, setLanguages] = useState<number[]>([]);
  const [country, setCountry] = useState<number | "">("");
  const [state, setState] = useState<number | "">("");
  const [city, setCity] = useState<number | "">("");
  const [categories, setCategories] = useState<number[]>([]);
  const [ig, setIg] = useState("");
  const [yt, setYt] = useState("");
  const [li, setLi] = useState("");
  const [primary, setPrimary] = useState<"instagram" | "youtube" | "linkedin">("instagram");
  const [loading, setLoading] = useState(false);
  const [followerError, setFollowerError] = useState("");
  const hasGoogle = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID) && !Capacitor.isNativePlatform();

  const aEmail = useAvailability(email, authService.checkEmailAvailability, isEmail);
  const aPhone = useAvailability(contactno, authService.checkPhoneAvailability, isPhone);
  const aIg = useAvailability(ig, authService.checkInstagramAvailability, isHandle);
  const aYt = useAvailability(yt, authService.checkYoutubeAvailability, isHandle);
  const aLi = useAvailability(li, authService.checkLinkedinAvailability, isHandle);

  const langQ = useQuery({ queryKey: ["languages"], queryFn: () => utilityService.getLanguages(), staleTime: 36e5 });
  const catQ = useQuery({ queryKey: ["categories"], queryFn: () => utilityService.getCategories(), staleTime: 36e5 });
  const countryQ = useQuery({ queryKey: ["countries"], queryFn: () => utilityService.getCountries(), staleTime: 36e5 });
  const stateQ = useQuery({
    queryKey: ["states", country], enabled: !!country, staleTime: 36e5,
    queryFn: () => utilityService.getStates(Number(country)),
  });
  const cityQ = useQuery({
    queryKey: ["cities", state], enabled: !!state, staleTime: 36e5,
    queryFn: () => utilityService.getCities(Number(state)),
  });
  const langOpts = useMemo(() => toOptions(langQ.data), [langQ.data]);
  const catOpts = useMemo(() => toOptions(catQ.data), [catQ.data]);
  const countryOpts = useMemo(() => toOptions(countryQ.data), [countryQ.data]);
  const stateOpts = useMemo(() => toOptions(stateQ.data), [stateQ.data]);
  const cityOpts = useMemo(() => toOptions(cityQ.data), [cityQ.data]);

  // Default country: India
  useEffect(() => {
    if (country || countryOpts.length === 0) return;
    const india = countryOpts.find((c) => c.name.toLowerCase() === "india");
    if (india) setCountry(india.id);
  }, [countryOpts, country]);

  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().slice(0, 10);
  }, []);

  const toggle = (list: number[], set: (v: number[]) => void, id: number, max?: number) => {
    if (list.includes(id)) return set(list.filter((x) => x !== id));
    if (max && list.length >= max) return toast.error(`You can pick up to ${max}`);
    set([...list, id]);
  };

  const goStep2 = () => {
    if (!firstname.trim()) return toast.error("Enter your name");
    if (!isEmail(email.trim())) return toast.error("Enter a valid email");
    if (!isPhone(contactno)) return toast.error("Enter a valid phone number");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (aEmail.s === "taken" || aPhone.s === "taken") return toast.error("Some details are already taken");
    setStep(2);
  };

  const handleRegister = async () => {
    if (!dob) return toast.error("Select your date of birth");
    if (ageOf(dob) < 13) return toast.error("You must be at least 13 years old");
    if (!gender) return toast.error("Select your gender");
    if (languages.length === 0) return toast.error("Pick at least one language");
    if (!country || !state || !city) return toast.error("Select your country, state and city");
    if (categories.length === 0) return toast.error("Pick at least one category");
    if (!ig.trim() && !yt.trim() && !li.trim()) return toast.error("Add at least one social username");
    const primaryHandle = { instagram: ig, youtube: yt, linkedin: li }[primary];
    if (!primaryHandle.trim()) return toast.error(`Add your ${primary} username or pick another primary account`);
    if ([aEmail, aPhone, aIg, aYt, aLi].some((a) => a.s === "taken")) return toast.error("Some details are already taken");

    setLoading(true);
    setFollowerError("");
    const body: Record<string, any> = {
      firstname: firstname.trim(), email: email.trim(), password, contactno: contactno.trim(), primary_account: primary,
      dob, gender, languages, country, state, city, categories,
    };
    if (referral.trim()) body.referral_code = referral.trim();
    if (ig.trim()) body.instagram_username = ig.trim();
    if (yt.trim()) body.youtube_username = yt.trim();
    if (li.trim()) body.linkedin_username = li.trim();
    try {
      const res = await register(body);
      const userId = Number(res?.user_id ?? res?.id ?? res?.user?.id) || undefined;
      const notice = res?.verification_email_sent === false ? "We couldn't send the email. Tap Resend." : undefined;
      toast.success("Account created! Check your inbox.");
      onVerify?.({ userId, email: email.trim(), notice });
    } catch (err: any) {
      const d = err?.data || {};
      if (d.min_followers != null) {
        const m = `Your account needs at least ${d.min_followers} followers (you have ${d.your_followers ?? 0})`;
        setFollowerError(m);
        toast.error(m);
      } else toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential?: string) => {
    if (!credential) return toast.error("Google sign-up failed");
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success("Account ready! Signed in with Google.");
    } catch (err: any) {
      toast.error(err.message || "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center bg-background px-6 py-10 overflow-y-auto relative">
      <div aria-hidden className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-pulse [animation-delay:1s]" />

      <div className="w-full max-w-sm relative z-10 my-auto">
        <div className="text-center mb-6">
          <img src={logoMark.url} alt="Findcollab" className="h-16 w-16 mx-auto mb-3 object-contain drop-shadow-xl" />
          <img src={logoFull.url} alt="Findcollab" className="h-8 mx-auto mb-2 object-contain" />
          <p className="text-sm text-text-mid">Create your influencer account</p>
        </div>

        <div className="flex gap-2 mb-3">
          {["Account", "About you"].map((t, i) => (
            <div key={t} className="flex-1">
              <div className={`h-1.5 rounded-full ${step > i ? "bg-primary" : "bg-muted"}`} />
              <p className={`text-[11px] font-bold mt-1 ${step === i + 1 ? "text-primary" : "text-text-mid"}`}>{i + 1}. {t}</p>
            </div>
          ))}
        </div>

        <Card className="!p-5">
          {step === 1 ? (
            <div className="flex flex-col gap-3.5">
              <AppInput label="Name" value={firstname} onChange={setFirstname} placeholder="John" />
              <AppInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <Hint a={aEmail} />
              <AppInput label="Phone Number" value={contactno} onChange={setContactno} placeholder="+91 98765 43210" />
              <Hint a={aPhone} />
              <AppInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
              <AppInput label="Referral code (optional)" value={referral} onChange={setReferral} />
              <AppButton full onClick={goStep2}>Next</AppButton>

              {hasGoogle && (
                <div>
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] text-text-mid uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex justify-center mt-2">
                    <GoogleLogin onSuccess={(res) => handleGoogle(res.credential)} onError={() => toast.error("Google sign-up failed")}
                      theme="outline" size="large" text="signup_with" shape="pill" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label>Date of birth</Label>
                <input type="date" value={dob} max={maxDob} onChange={(e) => setDob(e.target.value)} className={selectCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Gender</Label>
                <div className="flex gap-2">
                  {["Female", "Male", "Other"].map((g) => (
                    <button key={g} type="button" onClick={() => setGender(g)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold ${gender === g ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Languages known</Label>
                <Chips options={langOpts} value={languages} onToggle={(id) => toggle(languages, setLanguages, id)}
                  empty={langQ.isLoading ? "Loading…" : "No languages available"} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Location</Label>
                <select value={country} onChange={(e) => { setCountry(Number(e.target.value) || ""); setState(""); setCity(""); }} className={selectCls}>
                  <option value="">Country</option>
                  {countryOpts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <select value={state} disabled={!country} onChange={(e) => { setState(Number(e.target.value) || ""); setCity(""); }} className={selectCls}>
                  <option value="">{stateQ.isFetching ? "Loading…" : "State"}</option>
                  {stateOpts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <select value={city} disabled={!state} onChange={(e) => setCity(Number(e.target.value) || "")} className={selectCls}>
                  <option value="">{cityQ.isFetching ? "Loading…" : "City"}</option>
                  {cityOpts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Categories ({categories.length}/{MAX_CATS})</Label>
                <Chips options={catOpts} value={categories} onToggle={(id) => toggle(categories, setCategories, id, MAX_CATS)}
                  empty={catQ.isLoading ? "Loading…" : "No categories available"} />
              </div>
              <AppInput label="Instagram username" value={ig} onChange={setIg} placeholder="yourhandle" />
              <Hint a={aIg} />
              <AppInput label="YouTube username" value={yt} onChange={setYt} />
              <Hint a={aYt} />
              <AppInput label="LinkedIn username" value={li} onChange={setLi} />
              <Hint a={aLi} />
              <div className="flex flex-col gap-1.5">
                <Label>Primary account</Label>
                <div className="flex gap-2">
                  {(["instagram", "youtube", "linkedin"] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setPrimary(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize ${primary === p ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`}>{p}</button>
                  ))}
                </div>
              </div>
              {followerError && <p className="text-xs text-destructive font-semibold">{followerError}</p>}
              <div className="flex gap-2">
                <AppButton variant="outline" onClick={() => setStep(1)} disabled={loading}>Back</AppButton>
                <div className="flex-1">
                  <AppButton full onClick={handleRegister} disabled={loading}>
                    {loading ? "Creating account…" : "Create Account"}
                  </AppButton>
                </div>
              </div>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-text-mid mt-5">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-primary font-bold story-link">Sign In</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
