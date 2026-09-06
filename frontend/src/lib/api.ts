/**
 * HTTP client and auth token storage for the Urban Furniture API.
 *
 * Role in the app:
 * - Central place for all backend HTTP calls (`apiFetch`)
 * - Reads/writes the JWT auth token in browser storage
 * - Converts failed API responses into typed `ApiError` instances
 *
 * Feature modules (e.g. `master-data-api.ts`) should call `apiFetch` here
 * instead of using raw `fetch` against the backend.
 */

import { API_CONSTANTS, HTTP_STATUS, STORAGE_KEYS } from "./constants";
import type { ApiErrorEnvelope } from "./types";

/** localStorage/sessionStorage key used to persist the JWT after login. */
const TOKEN_STORAGE_KEY = STORAGE_KEYS.AUTH_TOKEN;

/** Subscribers are notified when an authenticated request proves the session invalid. */
const unauthorizedListeners = new Set<() => void>();

export function subscribeToUnauthorized(handler: () => void): () => void {
  unauthorizedListeners.add(handler);
  return () => unauthorizedListeners.delete(handler);
}

function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((listener) => listener());
}

/**
 * Structured error thrown when the API returns a non-2xx response.
 *
 * Use this in UI code to show field-level validation errors (`fields`)
 * or generic error messages (`message`). Check `instanceof ApiError`
 * in catch blocks.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;
  readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
  }
}

/**
 * Returns the backend base URL from env, with a localhost fallback for dev.
 *
 * Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` for production/staging.
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
}

/**
 * Finds which browser storage currently holds the auth token.
 *
 * Flow:
 * 1. Return `null` during SSR (no `window`)
 * 2. Check localStorage first (remember-device login)
 * 3. Fall back to sessionStorage (session-only login)
 *
 * @returns The Storage object that has the token, or `null` if none.
 */
export function getAuthStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    if (window.localStorage.getItem(TOKEN_STORAGE_KEY)) {
      return window.localStorage;
    }

    if (window.sessionStorage.getItem(TOKEN_STORAGE_KEY)) {
      return window.sessionStorage;
    }
  } catch {
    // Storage can be disabled by browser privacy settings. Authentication must
    // fail safely instead of crashing the application shell.
    return null;
  }

  return null;
}

/**
 * Reads the stored JWT, or `null` if the user is not logged in.
 *
 * Safe to call during SSR — returns `null` when `window` is unavailable.
 */
export function getStoredToken(): string | null {
  const storage = getAuthStorage();
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Saves a JWT after successful login.
 *
 * @param token - JWT string from the login/register response
 * @param rememberDevice - `true` → localStorage (persists across tabs/restarts);
 *                         `false` → sessionStorage (cleared when tab closes)
 *
 * Clears any existing token in both storages before writing the new one.
 */
export function setStoredToken(token: string, rememberDevice = true): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    clearStoredToken();
    const storage = rememberDevice ? window.localStorage : window.sessionStorage;
    storage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // The in-memory auth state remains usable for this page session. A future
    // reload will require login again when browser storage is unavailable.
  }
}

/**
 * Removes the JWT from both localStorage and sessionStorage.
 *
 * Call this on logout so stale tokens are not sent on future requests.
 */
export function clearStoredToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

/** Options passed to `apiFetch`, extending the standard fetch RequestInit. */
interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Request body — automatically JSON-stringified. */
  body?: unknown;
  /** When `true`, attaches `Authorization: Bearer <token>` if a token exists. */
  auth?: boolean;
}

function withTimeout(signal: AbortSignal | null | undefined): {
  signal: AbortSignal;
  cleanup: () => void;
  didTimeout: () => boolean;
} {
  const controller = new AbortController();
  let timedOut = false;
  // Use globalThis instead of window.* so this function is safe on the server
  // (Next.js Server Components, API routes) where window is not defined.
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_CONSTANTS.REQUEST_TIMEOUT);

  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

/**
 * Typed wrapper around `fetch` for all backend API calls.
 *
 * When to use: any time you need data from or send data to the backend.
 * Pass `auth: true` for endpoints that require a logged-in user.
 *
 * Flow:
 * 1. Build headers (Content-Type for JSON body, Bearer token if `auth`)
 * 2. `fetch` the full URL: base URL + path
 * 3. On success (2xx): parse JSON and return as `T` (204 → `undefined`)
 * 4. On failure: parse error envelope and throw `ApiError`
 *
 * @param path - API path starting with `/` (e.g. `/contacts`)
 * @param options - fetch options plus optional `body` and `auth` flag
 * @returns Parsed JSON response typed as `T`
 * @throws {ApiError} When the server returns a non-2xx status
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, auth = false, headers, signal, ...rest } = options;

  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const timeout = withTimeout(signal);
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: timeout.signal,
    });
  } catch (error) {
    if (timeout.didTimeout()) {
      throw new ApiError(408, "REQUEST_TIMEOUT", "The request timed out. Please try again.");
    }
    if (error instanceof TypeError) {
      throw new ApiError(
        503,
        "NETWORK_ERROR",
        `Unable to connect to backend server at ${getApiBaseUrl()}. Please make sure the backend server is running.`
      );
    }
    throw error;
  } finally {
    timeout.cleanup();
  }

  if (response.ok) {
    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  let envelope: ApiErrorEnvelope | null = null;

  try {
    envelope = (await response.json()) as ApiErrorEnvelope;
  } catch {
    // Non-JSON error body — fall through to generic error below.
  }

  if (envelope?.error) {
    const error = new ApiError(
      response.status,
      envelope.error.code,
      envelope.error.message,
      envelope.error.fields,
      envelope.error.request_id
    );
    if (auth && response.status === HTTP_STATUS.UNAUTHORIZED) notifyUnauthorized();
    throw error;
  }

  const error = new ApiError(
    response.status,
    "UNKNOWN_ERROR",
    `Request failed with status ${response.status}`
  );
  if (auth && response.status === HTTP_STATUS.UNAUTHORIZED) notifyUnauthorized();
  throw error;
}
