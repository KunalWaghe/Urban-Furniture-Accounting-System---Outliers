/**
 * @file api.ts
 *
 * HTTP functions for auth endpoints.
 *
 * What this file does:
 * - Sends login, register, and "who am I" requests to the backend
 * - Uses the shared `apiFetch` helper (handles JSON, errors, auth header)
 *
 * Who consumes this:
 * - `auth-context.tsx` calls these during login, register, and session bootstrap
 * - Form hooks do NOT call this file directly — they go through AuthContext
 */

import { apiFetch } from "@/lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/lib/types";

/**
 * Sends credentials to POST /api/v1/auth/login.
 *
 * @param payload - login_id (or email) and password
 * @returns User profile plus JWT token on success
 */
export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: payload,
  });
}

/**
 * Creates a new account via POST /api/v1/auth/register.
 *
 * @param payload - name, login_id, email, password (public signup)
 * @returns User profile plus JWT token — caller persists the session
 */
export async function registerRequest(
  payload: RegisterRequest
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: payload,
  });
}

/**
 * Fetches the current user from GET /api/v1/auth/me.
 * Requires a valid token in storage (`auth: true` adds the Authorization header).
 *
 * Used on app load to verify a stored token is still valid.
 *
 * @returns User profile without a token field
 */
export async function fetchCurrentUser(): Promise<Omit<AuthResponse, "token">> {
  return apiFetch<Omit<AuthResponse, "token">>("/api/v1/auth/me", {
    method: "GET",
    auth: true,
  });
}
