"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ApiError,
  clearStoredToken,
  getAuthStorage,
  getStoredToken,
  setStoredToken,
} from "@/lib/api";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/lib/types";

import { fetchCurrentUser, loginRequest, registerRequest } from "./api";

const USER_STORAGE_KEY = "uf_auth_user";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  bootstrapping: boolean;
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

  // true while the /auth/me bootstrap call is in-flight.
  // Initialise to true only when a stored token exists — no token means no
  // async work to do and we can render immediately.
  const [bootstrapping, setBootstrapping] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(getStoredToken());
  });

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
    const response = await registerRequest(payload);
    const nextUser = toAuthUser(response);

    persistSession(nextUser, response.token, true);
    setSession({ user: nextUser, token: response.token });

    return nextUser;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession({ user: null, token: null });
  }, []);

  // On mount: re-validate the stored token against /auth/me.
  // If the token is expired or invalid the backend returns 401 → we log out.
  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setBootstrapping(false);
      return;
    }

    fetchCurrentUser()
      .then((response) => {
        setSession((prev) => ({
          ...prev,
          user: toAuthUser(response),
        }));
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setSession({ user: null, token: null });
        }
        // Any other error (network down, etc.) — keep the cached session so
        // the user isn't logged out on a temporary server hiccup.
      })
      .finally(() => {
        setBootstrapping(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      bootstrapping,
      login,
      register,
      logout,
    }),
    [user, token, bootstrapping, login, register, logout]
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
