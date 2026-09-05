import type { ApiErrorEnvelope } from "./types";

const TOKEN_STORAGE_KEY = "uf_auth_token";

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

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
}

export function getAuthStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (localStorage.getItem(TOKEN_STORAGE_KEY)) {
    return localStorage;
  }

  if (sessionStorage.getItem(TOKEN_STORAGE_KEY)) {
    return sessionStorage;
  }

  return null;
}

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

export function setStoredToken(token: string, rememberDevice = true): void {
  if (typeof window === "undefined") {
    return;
  }

  clearStoredToken();
  const storage = rememberDevice ? localStorage : sessionStorage;
  storage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;

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

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.ok) {
    if (response.status === 204) {
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
    throw new ApiError(
      response.status,
      envelope.error.code,
      envelope.error.message,
      envelope.error.fields,
      envelope.error.request_id
    );
  }

  throw new ApiError(
    response.status,
    "UNKNOWN_ERROR",
    `Request failed with status ${response.status}`
  );
}
