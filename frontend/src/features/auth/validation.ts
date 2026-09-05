/**
 * @file validation.ts
 *
 * Client-side validation rules and helpers for login and signup forms.
 *
 * What this file does:
 * - Defines regex patterns and password strength rules
 * - Validates form fields before submit (fast feedback, no network call)
 * - Exports shared types (LoginFields, SignupFields, AuthNotice, etc.)
 *
 * Who consumes this:
 * - `useLoginForm` / `useSignupForm` call validate* functions on submit
 * - `PasswordStrengthMeter` uses `PasswordStrength` type from here
 * - `SignupForm` reads `ADMIN_CREATABLE_ROLES` for the admin-create UI
 */

/** login_id: 6–12 alphanumeric characters (case-insensitive on backend) */
export const LOGIN_ID_PATTERN = /^[A-Za-z0-9]{6,12}$/;

/**
 * Checks whether a login ID matches the required format.
 *
 * @param value - Raw input; trimmed before testing
 */
export function isValidLoginId(value: string): boolean {
  return LOGIN_ID_PATTERN.test(value.trim());
}

/** Simple email format check (not exhaustive — backend validates fully). */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks whether a string looks like a valid email address.
 *
 * @param value - Raw input; trimmed before testing
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** One password requirement shown in the strength meter checklist. */
export interface PasswordRule {
  id: "length" | "case" | "number" | "symbol";
  label: string;
  test: (password: string) => boolean;
}

/** All password rules — user must pass every rule to sign up. */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "More than 8 characters",
    test: (password) => password.length > 8,
  },
  {
    id: "case",
    label: "Uppercase & lowercase",
    test: (password) => /[a-z]/.test(password) && /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "At least 1 number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "symbol",
    label: "1 symbol (#, $, %, @)",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

/** Result of scoring a password against PASSWORD_RULES. */
export interface PasswordStrength {
  score: number;
  label: string;
  rules: Array<PasswordRule & { passed: boolean }>;
}

/**
 * Scores a password and returns a label (Weak → Strong) plus per-rule pass/fail.
 *
 * @param password - Current password field value
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const rules = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
  const score = rules.filter((rule) => rule.passed).length;
  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  return { score, label, rules };
}

/** Banner message shown above login/signup forms (error or success info). */
export interface AuthNotice {
  kind: "error" | "info";
  title: string;
  message: string;
}

// ── Login ──────────────────────────────────────────────────────────────────

/** Shape of the login form's controlled inputs. */
export interface LoginFields {
  login_id: string;
  password: string;
}

/** Per-field error messages for the login form (empty object = no errors). */
export type LoginErrors = Partial<Record<keyof LoginFields, string>>;

/**
 * Validates login fields before submit.
 *
 * @param fields - Current login_id and password values
 * @returns Object with error strings keyed by field name (may be empty)
 */
export function validateLoginFields(fields: LoginFields): LoginErrors {
  const errors: LoginErrors = {};
  const trimmed = fields.login_id.trim();
  if (!trimmed) {
    errors.login_id = "Login ID or Email is required.";
  }
  if (!fields.password) {
    errors.password = "Password is required.";
  }
  return errors;
}

// ── Signup ─────────────────────────────────────────────────────────────────

/** All roles in the system — used for typing and public signup default. */
export const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "invoicing_user", label: "Accountant" },
  { value: "contact", label: "User" },
] as const;

export type RoleValue = (typeof ROLES)[number]["value"];

/** Default landing route after login or signup, based on account role. */
export function getHomeRouteForRole(role: RoleValue): string {
  return role === "contact" ? "/portal" : "/dashboard";
}

/** Roles an Admin can assign when creating a user from the dashboard. */
export const ADMIN_CREATABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "invoicing_user", label: "Accountant" },
] as const;

export type AdminCreatableRole = (typeof ADMIN_CREATABLE_ROLES)[number]["value"];

/** Shape of the signup / create-user form's controlled inputs. */
export interface SignupFields {
  name: string;
  login_id: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: RoleValue;
  acceptedTerms: boolean;
}

/** Per-field error messages for the signup form. */
export type SignupErrors = Partial<
  Record<
    "name" | "login_id" | "email" | "password" | "confirmPassword" | "role" | "terms",
    string
  >
>;

/**
 * Validates signup fields before submit.
 *
 * @param fields - Current form values
 * @param options.requireTerms - When true (default), user must accept terms (public signup)
 * @returns Object with error strings keyed by field name (may be empty)
 */
export function validateSignupFields(
  fields: SignupFields,
  options?: { requireTerms?: boolean }
): SignupErrors {
  const errors: SignupErrors = {};
  if (fields.name.trim().length < 2) {
    errors.name = "Enter your full name (min 2 characters).";
  }
  if (!fields.login_id.trim()) {
    errors.login_id = "Login ID is required.";
  } else if (!isValidLoginId(fields.login_id)) {
    errors.login_id = "Login ID must be 6–12 alphanumeric characters (letters and numbers only).";
  }
  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(fields.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (getPasswordStrength(fields.password).score < PASSWORD_RULES.length) {
    errors.password = "Password does not meet all requirements below.";
  }
  if (!fields.confirmPassword || fields.confirmPassword !== fields.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (options?.requireTerms !== false && !fields.acceptedTerms) {
    errors.terms = "You must accept the terms to continue.";
  }
  return errors;
}
