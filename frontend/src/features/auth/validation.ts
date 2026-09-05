// login_id: 6–12 alphanumeric characters (case-insensitive on backend)
export const LOGIN_ID_PATTERN = /^[A-Za-z0-9]{6,12}$/;

export function isValidLoginId(value: string): boolean {
  return LOGIN_ID_PATTERN.test(value.trim());
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export interface PasswordRule {
  id: "length" | "case" | "number" | "symbol";
  label: string;
  test: (password: string) => boolean;
}

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

export interface PasswordStrength {
  score: number;
  label: string;
  rules: Array<PasswordRule & { passed: boolean }>;
}

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

export interface AuthNotice {
  kind: "error" | "info";
  title: string;
  message: string;
}

// ── Login ──────────────────────────────────────────────────────────────────

export interface LoginFields {
  login_id: string;
  password: string;
}

export type LoginErrors = Partial<Record<keyof LoginFields, string>>;

export function validateLoginFields(fields: LoginFields): LoginErrors {
  const errors: LoginErrors = {};
  if (!fields.login_id.trim()) {
    errors.login_id = "Login ID is required.";
  } else if (!isValidLoginId(fields.login_id)) {
    errors.login_id = "Login ID must be 6–12 alphanumeric characters.";
  }
  if (!fields.password) {
    errors.password = "Password is required.";
  }
  return errors;
}

// ── Signup ─────────────────────────────────────────────────────────────────

export const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "invoicing_user", label: "Accountant" },
  { value: "contact", label: "User" },
] as const;

export type RoleValue = (typeof ROLES)[number]["value"];

// Roles selectable by Admin on the Create User screen
export const ADMIN_CREATABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "invoicing_user", label: "Accountant" },
] as const;

export type AdminCreatableRole = (typeof ADMIN_CREATABLE_ROLES)[number]["value"];

export interface SignupFields {
  name: string;
  login_id: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: RoleValue;
  acceptedTerms: boolean;
}

export type SignupErrors = Partial<
  Record<
    "name" | "login_id" | "email" | "password" | "confirmPassword" | "role" | "terms",
    string
  >
>;

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
