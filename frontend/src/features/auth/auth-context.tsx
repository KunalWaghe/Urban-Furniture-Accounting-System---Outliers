"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearStoredToken,
  getAuthStorage,
  getStoredToken,
  setStoredToken,
} from "@/lib/api";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/lib/types";

import { loginRequest, registerRequest } from "./api";

const USER_STORAGE_KEY = "uf_auth_user";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest, rememberDevice?: boolean) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readUserFromStorage(storage: Storage): AuthUser | null {
  try {
    const raw = storage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function getStoredUser(): AuthUser | null {
  const storage = getAuthStorage();
  if (!storage) {
    return null;
  }

  return readUserFromStorage(storage);
}

function clearStoredUser(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}

function persistSession(
  user: AuthUser,
  token: string,
  rememberDevice = true
): void {
  clearStoredUser();
  setStoredToken(token, rememberDevice);
  const storage = rememberDevice ? localStorage : sessionStorage;
  storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearSession(): void {
  clearStoredToken();
  clearStoredUser();
}

function toAuthUser(response: {
  id: number;
  email: string;
  name: string;
  role: string;
}): AuthUser {
  return {
    id: response.id,
    email: response.email,
    name: response.name,
    role: response.role,
  };
}

function getInitialSession(): { user: AuthUser | null; token: string | null } {
  if (typeof window === "undefined") {
    return { user: null, token: null };
  }

  const storedToken = getStoredToken();
  const storedUser = getStoredUser();

  if (storedToken && storedUser) {
    return { user: storedUser, token: storedToken };
  }

  if (storedToken || storedUser) {
    clearSession();
  }

  return { user: null, token: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(getInitialSession);
  const { user, token } = session;

  const login = useCallback(
    async (payload: LoginRequest, rememberDevice = true) => {
      const response = await loginRequest(payload);
      const nextUser = toAuthUser(response);

      persistSession(nextUser, response.token, rememberDevice);
      setSession({ user: nextUser, token: response.token });

      return nextUser;
    },
    []
  );

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await registerRequest({
      ...payload,
      role: payload.role ?? "invoicing_user",
    });
    const nextUser = toAuthUser(response);

    persistSession(nextUser, response.token, true);
    setSession({ user: nextUser, token: response.token });

    return nextUser;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession({ user: null, token: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [user, token, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
