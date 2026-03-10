import { api } from "@/lib/api";

export const utilityService = {
  getCountries: () =>
    api.get("/countries"),

  getCategories: () =>
    api.get("/categories"),

  getLanguages: () =>
    api.get("/languages"),

  getStates: (countryId: number) =>
    api.post("/states", { countryId }),

  getCities: (stateId: number) =>
    api.post("/cities", { stateId }),
};
