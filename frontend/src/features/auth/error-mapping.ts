/**
 * @file error-mapping.ts
 *
 * Translates backend API errors into form-friendly messages.
 *
 * What this file does:
 * - Maps server field names (e.g. "body.login_id") to our form field keys
 * - Provides a fallback message for network and unknown errors
 *
 * Who consumes this:
 * - `useLoginForm` and `useSignupForm` call these when a mutation fails
 */

import { ApiError } from "@/lib/api";

/** Maps backend login field names to our LoginForm field keys. */
const LOGIN_FIELD_MAP: Record<string, "login_id" | "password"> = {
  login_id: "login_id",
  password: "password",
};

/** Maps backend signup field names to our SignupForm field keys. */
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

/**
 * Converts a 422 validation error's `fields` object into login form errors.
 *
 * Backend keys may be nested (e.g. "body.password") — we take the last segment.
 *
 * @param fields - Field→message map from ApiError.fields
 * @returns Partial errors keyed by login_id or password
 */
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

/**
 * Converts a 422 validation error's `fields` object into signup form errors.
 *
 * @param fields - Field→message map from ApiError.fields
 * @returns Partial errors keyed by signup field names
 */
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

/**
 * Picks a user-facing message from any thrown error.
 *
 * - ApiError → use the server message
 * - TypeError (network failure) → "Unable to reach the server…"
 * - Anything else → caller's fallback string
 *
 * @param error - Caught value from a failed auth request
 * @param fallback - Default message when error type is unknown
 */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Unable to reach the server. Check that the backend is running.";
  }

  return fallback;
}
