import { api } from "./api";

export const isDemoUser = () => api.getToken() === "demo-token";
