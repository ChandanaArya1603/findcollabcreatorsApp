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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userDetail: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = api.getToken();
    const savedUser = localStorage.getItem("fc_user");

    if (token && savedUser) {
      const parsed = JSON.parse(savedUser);
      setState({
        token,
        user: parsed,
        userDetail: null,
        isAuthenticated: true,
        isLoading: false,
      });

      // Hydrate user name from media_kit if missing in localStorage
      if (!parsed.fname) {
        api.get("/media_kit").then((res: any) => {
          const fname = res?.fname || res?.user?.fname || res?.first_name || res?.user?.first_name || "";
          const lname = res?.lname || res?.user?.lname || res?.last_name || res?.user?.last_name || "";
          if (fname) {
            const updatedUser = { ...parsed, fname, lname: lname || parsed.lname || "" };
            localStorage.setItem("fc_user", JSON.stringify(updatedUser));
            setState((s) => ({
              ...s,
              user: s.user ? { ...s.user, fname, lname: lname || s.user.lname } : s.user,
              userDetail: res,
            }));
          }
        }).catch(() => {});
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const setAuthData = useCallback((data: { token: string; user: User; userDetail: UserDetail }) => {
    api.setToken(data.token);
    // Persist only minimum identity fields needed to bootstrap the UI.
    const minimalUser: User = {
      id: data.user.id,
      fname: data.user.fname,
      lname: data.user.lname,
      email: data.user.email,
      sign_up_type: data.user.sign_up_type,
    };
    localStorage.setItem("fc_user", JSON.stringify(minimalUser));
    setState({
      token: data.token,
      user: data.user,
      userDetail: data.userDetail,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.postForm("/login", { email, password });
    // Normalize: API may return user fields at top level or nested under .user
    const user = res.user ?? {
      id: res.id ?? res.user_login_id,
      fname: res.fname ?? res.first_name ?? "",
      lname: res.lname ?? res.last_name ?? "",
      email: res.email ?? email,
      sign_up_type: res.sign_up_type ?? "",
    };
    const userDetail = res.userDetail ?? res.user_detail ?? res;
    setAuthData({ token: res.token, user, userDetail });

    // Hydrate real name from media_kit if login response lacked it
    if (!user.fname) {
      try {
        const mk = await api.get("/media_kit");
        const fname = mk?.fname || mk?.user?.fname || mk?.first_name || mk?.user?.first_name || "";
        const lname = mk?.lname || mk?.user?.lname || mk?.last_name || mk?.user?.last_name || "";
        if (fname) {
          const updated = { ...user, fname, lname: lname || user.lname };
          localStorage.setItem("fc_user", JSON.stringify(updated));
          setState((s) => ({ ...s, user: s.user ? { ...s.user, fname, lname: lname || s.user.lname } : s.user, userDetail: mk }));
        }
      } catch {}
    }
  }, [setAuthData]);

  const register = useCallback(async (data: Record<string, any>) => {
    const res = await api.postForm("/register_influencer", data);
    // If google signup, auto-login
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
    // Clean up legacy key from previous versions that persisted the full user detail.
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
    // During auto-logout reload, context may be momentarily unavailable
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
