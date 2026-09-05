/**
 * @file auth-context.tsx
 *
 * Global authentication state for the app.
 *
 * What this file does:
 * - Stores the logged-in user and JWT token in React state
 * - Persists session to localStorage (remember me) or sessionStorage
 * - Re-validates stored tokens on page load via /auth/me
 * - Exposes login, register, and logout methods to the rest of the app
 *
 * Who consumes this:
 * - `AuthProvider` wraps the app in the root layout
 * - Any component or hook calls `useAuth()` to read user state or trigger auth actions
 * - Login/signup hooks (`useLoginForm`, `useSignupForm`) call `login` / `register`
 * - Protected routes and nav components read `user`, `isAuthenticated`, `bootstrapping`
 */
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

/**
 * Shape of everything available from `useAuth()`.
 * Components read these values; they do not set them directly.
 */
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

/**
 * Reads user data from browser storage (localStorage or sessionStorage)
 * @returns Parsed AuthUser object or null if not found/invalid
 */
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

/**
 * Retrieves stored user from localStorage or sessionStorage
 */
function getStoredUser(): AuthUser | null {
  const storage = getAuthStorage();
  if (!storage) {
    return null;
  }

  return readUserFromStorage(storage);
}

/**
 * Clears user data from both localStorage and sessionStorage
 */
function clearStoredUser(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Saves user + token to browser storage after a successful login or register.
 * Clears any old session first so we never mix stale data.
 *
 * @param rememberDevice - true → localStorage (persists across browser restarts)
 *                         false → sessionStorage (cleared when tab closes)
 */
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

/** Removes token and user from both storage locations. Called on logout or invalid token. */
function clearSession(): void {
  clearStoredToken();
  clearStoredUser();
}

/**
 * Converts an API auth response into our app's `AuthUser` shape.
 * Normalizes optional fields (login_id, contact_id) to null when missing.
 */
function toAuthUser(response: {
  id: number;
  login_id?: string | null;
  email: string;
  name: string;
  role: string;
  contact_id?: number | null;
}): AuthUser {
  return {
    id: response.id,
    login_id: response.login_id ?? null,
    email: response.email,
    name: response.name,
    role: response.role,
    contact_id: response.contact_id ?? null,
  };
}

/**
 * Reads the session from storage on first render (client only).
 * If token and user are out of sync (only one exists), clears both for safety.
 */
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

/**
 * Wraps the app and provides auth state to all descendants.
 *
 * State owned:
 * - `session` — current user + token
 * - `bootstrapping` — true while verifying a stored token against the server
 *
 * Side effects:
 * - On mount: if a token exists, calls `/auth/me` to refresh user data
 * - 401 from /auth/me → logs out; other errors → keeps cached session
 *
 * @param children - App content that can call `useAuth()`
 */
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

/**
 * Hook to access auth state and actions from any component inside `AuthProvider`.
 *
 * @returns Current user, token, `isAuthenticated`, `bootstrapping`, and auth methods
 * @throws If called outside of `AuthProvider` (programming error)
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
