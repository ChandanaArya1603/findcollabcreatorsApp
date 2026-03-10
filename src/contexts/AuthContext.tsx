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
    const savedDetail = localStorage.getItem("fc_user_detail");

    if (token && savedUser) {
      setState({
        token,
        user: JSON.parse(savedUser),
        userDetail: savedDetail ? JSON.parse(savedDetail) : null,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const setAuthData = useCallback((data: { token: string; user: User; userDetail: UserDetail }) => {
    api.setToken(data.token);
    localStorage.setItem("fc_user", JSON.stringify(data.user));
    localStorage.setItem("fc_user_detail", JSON.stringify(data.userDetail));
    setState({
      token: data.token,
      user: data.user,
      userDetail: data.userDetail,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/login", { email, password });
    setAuthData({ token: res.token, user: res.user, userDetail: res.userDetail });
  }, [setAuthData]);

  const register = useCallback(async (data: Record<string, any>) => {
    const res = await api.post("/register_influencer", data);
    // If google signup, auto-login
    if (res.token) {
      setAuthData({ token: res.token, user: res.user, userDetail: res.userDetail });
    }
    return res;
  }, [setAuthData]);

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
