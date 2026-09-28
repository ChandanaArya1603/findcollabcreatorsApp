export interface Opt { id: number; name: string }

/** Find the first array inside an API reply (reply itself, or any top-level/data array). */
const findArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];
  for (const v of Object.values(res)) if (Array.isArray(v)) return v;
  if (res.data) return findArray(res.data);
  return [];
};

export const toOptions = (res: any): Opt[] =>
  findArray(res)
    .map((x: any) => ({
      id: Number(x?.id ?? x?.country_id ?? x?.state_id ?? x?.city_id ?? x?.language_id ?? x?.category_id),
      name: String(
        x?.name ?? x?.country_name ?? x?.state_name ?? x?.city_name ?? x?.language_name ?? x?.language ??
          x?.Interested_in_industry ?? x?.category_name ?? ""
      ).trim(),
    }))
    .filter((o) => o.id && o.name);

export const isUnknownMethod = (err: any) => /unknown method/i.test(String(err?.message || ""));
