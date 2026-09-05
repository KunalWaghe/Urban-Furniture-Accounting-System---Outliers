import { ApiError } from "@/lib/api";

const LOGIN_FIELD_MAP: Record<string, "email" | "password"> = {
  email: "email",
  password: "password",
};

const SIGNUP_FIELD_MAP: Record<
  string,
  "name" | "email" | "password" | "confirmPassword"
> = {
  name: "name",
  email: "email",
  password: "password",
  confirmPassword: "confirmPassword",
};

export function mapApiFieldsToLoginErrors(
  fields: Record<string, string> | undefined
): Partial<Record<"email" | "password", string>> {
  if (!fields) {
    return {};
  }

  const mapped: Partial<Record<"email" | "password", string>> = {};

  for (const [key, message] of Object.entries(fields)) {
    const normalizedKey = key.split(".").pop() ?? key;
    const target = LOGIN_FIELD_MAP[normalizedKey];
    if (target) {
      mapped[target] = message;
    }
  }

  return mapped;
}

export function mapApiFieldsToSignupErrors(
  fields: Record<string, string> | undefined
): Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "terms", string>
> {
  if (!fields) {
    return {};
  }

  const mapped: Partial<
    Record<"name" | "email" | "password" | "confirmPassword" | "terms", string>
  > = {};

  for (const [key, message] of Object.entries(fields)) {
    const normalizedKey = key.split(".").pop() ?? key;
    const target = SIGNUP_FIELD_MAP[normalizedKey];
    if (target) {
      mapped[target] = message;
    }
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
