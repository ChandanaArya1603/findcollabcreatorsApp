import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMediaKit } from "@/hooks/useAppData";
import { queryClient } from "@/lib/queryClient";
import { qk } from "@/lib/queryKeys";
import { refreshCompletion, validUrl } from "@/lib/profileSync";
import { onboardingService } from "@/services/onboardingService";
import { AppButton } from "../findcollab/AppButton";
import { AppInput } from "../findcollab/AppInput";
import { Card } from "../findcollab/Card";
import { Icon } from "../findcollab/Icon";

export interface Project { id?: number | string; brand: string; link: string }

const toProjects = (list: any): Project[] =>
  Array.isArray(list)
    ? list.map((p: any) => ({ id: p.id ?? p.project_id, brand: p.brand_name || p.brand || "", link: p.collaboration_link || p.link || "" }))
    : [];

/** Returns cleaned values, or an error message. */
const check = (brand: string, link: string): { b: string; l: string } | string => {
  const b = brand.trim();
  let l = link.trim();
  if (!b) return "Enter the brand name";
  if (!l) return "Enter the collaboration link";
  if (!/^https?:\/\//i.test(l)) l = `https://${l}`;
  if (b.length > 100) return "Brand name must be 100 characters or less";
  if (l.length > 100) return "Link must be 100 characters or less";
  if (!validUrl(l)) return "Enter a valid link, e.g. https://instagram.com/p/…";
  return { b, l };
};

const unknown = (e: any) => /unknown method/i.test(e?.message || "");

/** Shared Past Projects add / inline-edit / delete used by Edit Profile and the wizard. */
export const PastProjectsEditor: React.FC<{ onCountChange?: (n: number) => void }> = ({ onCountChange }) => {
  const { data: mk } = useMediaKit();
  const [projects, setProjects] = useState<Project[]>([]);
  const [brand, setBrand] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [eBrand, setEBrand] = useState("");
  const [eLink, setELink] = useState("");

  useEffect(() => { if (mk) setProjects(toProjects(mk.userProjects)); }, [mk]);
  useEffect(() => { onCountChange?.(projects.length); }, [projects.length, onCountChange]);

  const after = async () => {
    refreshCompletion();
    await queryClient.invalidateQueries({ queryKey: qk.mediaKit });
  };
  const fail = (e: any) =>
    toast.error(unknown(e) ? "This will be available after the next server update" : e?.message || "Could not save project");

  const add = async () => {
    const v = check(brand, link);
    if (typeof v === "string") return toast.error(v);
    setBusy("add");
    try {
      await onboardingService.addProject(v.b, v.l);
      setProjects((p) => [...p, { brand: v.b, link: v.l }]);
      setBrand(""); setLink("");
      toast.success("Project added");
      await after();
    } catch (e) { fail(e); } finally { setBusy(null); }
  };

  const save = async (p: Project) => {
    const v = check(eBrand, eLink);
    if (typeof v === "string") return toast.error(v);
    setBusy(`edit-${p.id}`);
    try {
      await onboardingService.updateProject(p.id!, v.b, v.l);
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, brand: v.b, link: v.l } : x)));
      setEditId(null);
      toast.success("Project updated");
      await after();
    } catch (e) { fail(e); } finally { setBusy(null); }
  };

  const remove = async (p: Project) => {
    if (p.id == null) return toast.error("This project is still syncing. Try again in a moment.");
    setBusy(`del-${p.id}`);
    try {
      await onboardingService.deleteProject(p.id);
      setProjects((list) => list.filter((x) => x.id !== p.id));
      toast.success("Project deleted");
      await after();
    } catch (e) { fail(e); } finally { setBusy(null); }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="!p-4 flex flex-col gap-3">
        <p className="text-sm font-extrabold text-foreground">Add past project</p>
        <AppInput label="Brand name" value={brand} onChange={setBrand} placeholder="Brand" />
        <AppInput label="Collaboration link" value={link} onChange={setLink} placeholder="https://" />
        <AppButton full icon="plus" onClick={add} disabled={!!busy}>{busy === "add" ? "Saving…" : "Add project"}</AppButton>
      </Card>

      {projects.length === 0 ? (
        <p className="text-xs text-text-mid text-center">No projects yet</p>
      ) : projects.map((p, i) => (
        <Card key={p.id ?? `new-${i}`} className="!p-3">
          {editId != null && editId === p.id ? (
            <div className="flex flex-col gap-2.5">
              <AppInput label="Brand name" value={eBrand} onChange={setEBrand} />
              <AppInput label="Collaboration link" value={eLink} onChange={setELink} />
              <div className="flex gap-2">
                <div className="flex-1"><AppButton full icon="check" onClick={() => save(p)} disabled={!!busy}>{busy === `edit-${p.id}` ? "Saving…" : "Save"}</AppButton></div>
                <AppButton variant="ghost" onClick={() => setEditId(null)} disabled={!!busy}>Cancel</AppButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary font-black shrink-0">{(p.brand || "P").charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{p.brand || "—"}</p>
                <p className="text-[11px] text-text-mid truncate">{p.link || "—"}</p>
              </div>
              <button type="button" aria-label={`Edit ${p.brand}`} disabled={!!busy || p.id == null}
                onClick={() => { setEditId(p.id!); setEBrand(p.brand); setELink(p.link); }}
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-primary disabled:opacity-40"><Icon name="edit" size={15} /></button>
              <button type="button" aria-label={`Delete ${p.brand}`} disabled={!!busy} onClick={() => remove(p)}
                className="h-9 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-bold disabled:opacity-40">
                {busy === `del-${p.id}` ? "…" : "Delete"}
              </button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
