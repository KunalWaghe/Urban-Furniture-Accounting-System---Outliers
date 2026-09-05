import { apiFetch } from "@/lib/api";
import type { AdminCreateUserRequest, AuthUser } from "@/lib/types";

export async function fetchUsers(): Promise<AuthUser[]> {
  return apiFetch<AuthUser[]>("/api/v1/users", { auth: true });
}

export async function createUser(
  payload: AdminCreateUserRequest
): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/v1/users", {
    method: "POST",
    body: payload,
    auth: true,
  });
}
