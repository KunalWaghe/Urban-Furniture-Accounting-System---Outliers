import { apiFetch } from "@/lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/lib/types";

export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function registerRequest(
  payload: RegisterRequest
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function fetchCurrentUser(): Promise<Omit<AuthResponse, "token">> {
  return apiFetch<Omit<AuthResponse, "token">>("/api/v1/auth/me", {
    method: "GET",
    auth: true,
  });
}
