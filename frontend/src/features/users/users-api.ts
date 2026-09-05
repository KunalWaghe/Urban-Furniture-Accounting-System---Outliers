/**
 * Users API
 *
 * Admin-only endpoints for listing and creating user accounts.
 * Calls are authenticated via `apiFetch` with `{ auth: true }`.
 *
 * Used by `queries.ts` hooks — this file has no React Query logic.
 */

import { apiFetch } from "@/lib/api";
import type { AdminCreateUserRequest, AuthUser } from "@/lib/types";

/**
 * Fetch all users visible to the current admin.
 *
 * @returns Array of user records (id, email, role, etc.)
 */
export async function fetchUsers(): Promise<AuthUser[]> {
  return apiFetch<AuthUser[]>("/api/v1/users", { auth: true });
}

/**
 * Create a new user account (admin action).
 *
 * @param payload - Email, password, name, and role from the admin form
 * @returns The newly created user from the server
 */
export async function createUser(
  payload: AdminCreateUserRequest
): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/v1/users", {
    method: "POST",
    body: payload,
    auth: true,
  });
}
