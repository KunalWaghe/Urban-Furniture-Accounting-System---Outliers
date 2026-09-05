import { ApiError } from "@/lib/api";

const LOGIN_FIELD_MAP: Record<string, "login_id" | "password"> = {
  login_id: "login_id",
  password: "password",
};

const SIGNUP_FIELD_MAP: Record<
  string,
  "name" | "login_id" | "email" | "password" | "confirmPassword" | "role"
> = {
  name: "name",
  login_id: "login_id",
  email: "email",
  password: "password",
  confirmPassword: "confirmPassword",
  role: "role",
};

export function mapApiFieldsToLoginErrors(
  fields: Record<string, string> | undefined
): Partial<Record<"login_id" | "password", string>> {
  if (!fields) return {};
  const mapped: Partial<Record<"login_id" | "password", string>> = {};
  for (const [key, message] of Object.entries(fields)) {
    const normalizedKey = key.split(".").pop() ?? key;
    const target = LOGIN_FIELD_MAP[normalizedKey];
    if (target) mapped[target] = message;
  }
  return mapped;
}

export function mapApiFieldsToSignupErrors(
  fields: Record<string, string> | undefined
): Partial<
  Record<"name" | "login_id" | "email" | "password" | "confirmPassword" | "role" | "terms", string>
> {
  if (!fields) return {};
  const mapped: Partial<
    Record<"name" | "login_id" | "email" | "password" | "confirmPassword" | "role" | "terms", string>
  > = {};
  for (const [key, message] of Object.entries(fields)) {
    const normalizedKey = key.split(".").pop() ?? key;
    const target = SIGNUP_FIELD_MAP[normalizedKey];
    if (target) mapped[target] = message;
  }
  return mapped;
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Unable to reach the server. Check that the backend is running.";
  }

  return fallback;
}
