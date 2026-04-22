import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  sign_up_type: string;
}

interface UserDetail {
  user_login_id: number;
  country: string;
  state: string;
  city: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  userDetail: UserDetail | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, any>) => Promise<any>;
  logout: () => Promise<void>;
  setAuthData: (data: { token: string; user: User; userDetail: UserDetail }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const BLOCKED_FULL_NAME = "Access delayed. Only the owner of the page can access this information";

const isMeaningfulValue = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return Boolean(normalized) && normalized.toLowerCase() !== "null" && normalized !== BLOCKED_FULL_NAME;
};

const humanizeHandle = (value: string) =>
  value
    .replace(/^@/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const splitName = (fullName: string) => {
  const [fname = "", ...rest] = fullName.trim().split(/\s+/).filter(Boolean);
  return { fname, lname: rest.join(" ") };
};

const parseInstagramUser = (source: any) => {
  const instagramData = source?.instagramData;
  if (!instagramData) return null;

  try {
    const parsed = typeof instagramData.json_data === "string"
      ? JSON.parse(instagramData.json_data)
      : instagramData.json_data;
    return parsed?.data?.user ?? null;
  } catch {
    return null;
  }
};

const deriveFullName = (...sources: any[]) => {
  // Pass 1: direct fname/lname
  for (const source of sources) {
    if (!source) continue;
    const directName = [source?.fname, source?.lname].filter(isMeaningfulValue).join(" ").trim();
    if (directName) return directName;
  }

  // Pass 2: named fields (user_name, full_name, etc.)
  for (const source of sources) {
    if (!source) continue;
    for (const field of [source?.user_name, source?.name, source?.full_name, source?.display_name, source?.first_name]) {
      if (isMeaningfulValue(field)) return field.trim();
    }
  }

  // Pass 3: Instagram profile data
  for (const source of sources) {
    if (!source) continue;
    const instagramUser = parseInstagramUser(source);
    if (instagramUser) {
      if (isMeaningfulValue(instagramUser.full_name)) return instagramUser.full_name.trim();
      if (isMeaningfulValue(instagramUser.username)) return humanizeHandle(instagramUser.username);
    }
  }

  // Pass 4: social handles (humanized)
  for (const source of sources) {
    if (!source) continue;
    for (const handle of [source?.insta_handle, source?.insta_url, source?.username, source?.youtube_url]) {
      if (isMeaningfulValue(handle)) return humanizeHandle(handle);
    }
  }

  // Pass 5: email as last resort
  for (const source of sources) {
    if (!source) continue;
    if (isMeaningfulValue(source?.email)) return humanizeHandle(source.email.split("@")[0]);
  }

  return "";
};

const normalizeUser = (user: Partial<User> & Record<string, any>, userDetail?: Record<string, any> | null): User => {
  const derivedName = deriveFullName(user, userDetail, userDetail?.user, userDetail?.userDetail);
  const parts = derivedName ? splitName(derivedName) : { fname: "", lname: "" };

  return {
    id: Number(user.id ?? user.user_login_id ?? userDetail?.user_login_id ?? 0),
    fname: isMeaningfulValue(user.fname) ? user.fname.trim() : parts.fname,
    lname: isMeaningfulValue(user.lname) ? user.lname.trim() : parts.lname,
    email: user.email ?? userDetail?.email ?? "",
    sign_up_type: user.sign_up_type ?? userDetail?.sign_up_type ?? "",
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userDetail: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const token = api.getToken();
      const savedUser = localStorage.getItem("fc_user");

      if (!token || !savedUser) {
        if (isMounted) {
          setState((s) => ({ ...s, isLoading: false }));
        }
        return;
      }

      const parsed = JSON.parse(savedUser);

      if (!parsed.fname) {
        try {
          const res = await api.get("/media_kit");
          const normalizedUser = normalizeUser(parsed, res);
          localStorage.setItem("fc_user", JSON.stringify(normalizedUser));

          if (isMounted) {
            setState({
              token,
              user: normalizedUser,
              userDetail: res,
              isAuthenticated: true,
              isLoading: false,
            });
          }
          return;
        } catch {
          // fall back to saved identity below
        }
      }

      const normalizedUser = normalizeUser(parsed, null);
      if (isMounted) {
        setState({
          token,
          user: normalizedUser,
          userDetail: null,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const setAuthData = useCallback((data: { token: string; user: User; userDetail: UserDetail }) => {
    const normalizedUser = normalizeUser(data.user, data.userDetail);
    api.setToken(data.token);
    localStorage.setItem("fc_user", JSON.stringify(normalizedUser));
    setState({
      token: data.token,
      user: normalizedUser,
      userDetail: data.userDetail,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.postForm("/login", { email, password });
    const rawUser = res.user ?? {
      id: res.id ?? res.user_login_id,
      fname: res.fname ?? res.first_name ?? "",
      lname: res.lname ?? res.last_name ?? "",
      email: res.email ?? email,
      sign_up_type: res.sign_up_type ?? "",
    };
    const userDetail = res.userDetail ?? res.user_detail ?? res;
    const normalizedUser = normalizeUser(rawUser, userDetail);
    setAuthData({ token: res.token, user: normalizedUser, userDetail });

    if (!normalizedUser.fname) {
      try {
        const mk = await api.get("/media_kit");
        const hydratedUser = normalizeUser(normalizedUser, mk);
        if (hydratedUser.fname) {
          localStorage.setItem("fc_user", JSON.stringify(hydratedUser));
          setState((s) => ({
            ...s,
            user: hydratedUser,
            userDetail: mk,
          }));
        }
      } catch {
        // ignore secondary hydration failures
      }
    }
  }, [setAuthData]);

  const register = useCallback(async (data: Record<string, any>) => {
    const res = await api.postForm("/register_influencer", data);
    if (res.token) {
      setAuthData({ token: res.token, user: res.user, userDetail: res.userDetail });
    }
    return res;
  }, [setAuthData]);

  const logout = useCallback(async () => {
    try {
      await api.postForm("/logout", {});
    } catch {
      // ignore logout API errors
    }
    api.setToken(null);
    localStorage.removeItem("fc_user");
    localStorage.removeItem("fc_user_detail");
    setState({
      user: null,
      userDetail: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    if (!localStorage.getItem("fc_token")) {
      return {
        user: null, userDetail: null, token: null,
        isAuthenticated: false, isLoading: true,
        login: async () => {}, register: async () => ({}),
        logout: async () => {}, setAuthData: () => {},
      } as unknown as AuthContextType;
    }
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};