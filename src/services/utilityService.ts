import { api } from "@/lib/api";

export const utilityService = {
  getCountries: () =>
    api.get("/countries"),

  getCategories: () =>
    api.get("/categories"),

  getLanguages: () =>
    api.get("/languages"),

  getStates: (countryId: number) =>
    api.postForm("/states", { countryId }),

  getCities: (stateId: number) =>
    api.postForm("/cities", { stateId }),
};
