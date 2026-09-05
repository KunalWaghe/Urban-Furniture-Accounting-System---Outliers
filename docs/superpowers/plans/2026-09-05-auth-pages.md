# Auth Pages (Login / Signup) Implementation Plan

> **Superseded for new work:** This plan describes the original email-based, UI-only baseline. The Excalidraw clarification requires `loginId`, API-backed auth, public signup locked to `invoicing_user`, Admin-created roles, and a Forgot Password route. Do not execute the old email/stub steps unchanged; use `P0-BE-02R`, `P0-FE-02R`, `P0-INT-01`, and `P0-FE-14` in `docs/TASK_BOARD.md` and the updated auth spec/API contract.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal (historical baseline):** Build `/login` and `/signup` pages matching the original approved spec — Stitch-based UI, Urban Furniture branding, fully interactive locally, no auth API calls.

**Architecture:** Next.js route groups separate the app shell from auth pages. Feature folder `src/features/auth/` colocates UI components, hooks (all form state/validation), and pure validation helpers. Hooks own state; components only render.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (tokens already in `globals.css`), shadcn/base-ui primitives (`Input`, `Button`), lucide-react icons, `cn` package.

**Spec deviations to note:** No test framework exists and none is added (user rule) — verification is `lint` + `build` + browser checks. No git commits unless the user asks (git safety rule) — evidence is verified UI + build output per TASK_BOARD rule 5.

---

### Task 1: Route group restructure (auth pages escape the app shell)

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/(app)/layout.tsx`
- Move: `frontend/src/app/page.tsx` → `frontend/src/app/(app)/page.tsx`
- Create: `frontend/src/app/(auth)/layout.tsx`

- [ ] **Step 1: Slim the root layout** — remove the shell (sidebar/header/footer) so it only provides `<html>`, `<body>`, and `ThemeProvider`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Urban Furniture Accounting System",
  description:
    "Manage purchase orders, bills, payments, and reports for urban furniture operations.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create the `(app)` group layout** with the shell that used to be in root:

```tsx
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteSidebar } from "@/components/site-sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SiteSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Move the home page into the `(app)` group** (URL stays `/`):

```bash
mkdir -p "frontend/src/app/(app)" && mv frontend/src/app/page.tsx "frontend/src/app/(app)/page.tsx"
```

- [ ] **Step 4: Create the `(auth)` group layout** — centered column, ambient glows, shared footer:

```tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-text sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-100 opacity-60 blur-3xl dark:bg-primary-900/20" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-50 opacity-70 blur-3xl dark:bg-primary-900/10" />
      </div>
      <div className="relative z-10 flex w-full flex-col items-center">
        {children}
        <div className="mt-6 space-y-2 text-center">
          <p className="text-xs text-text-muted">
            Urban Furniture Accounting System v0.1 &middot; Double-entry ledger
            environment
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
            <a href="#" className="transition-colors hover:text-text">
              Security Policy
            </a>
            <span>&middot;</span>
            <a href="#" className="transition-colors hover:text-text">
              Terms
            </a>
            <span>&middot;</span>
            <a href="#" className="transition-colors hover:text-text">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify the restructure**

Run: `cd frontend && npm run build`
Expected: build compiles; `/` route still listed (now served from `(app)/page.tsx`).

---

### Task 2: Pure validation helpers

**Files:**
- Create: `frontend/src/features/auth/validation.ts`

- [ ] **Step 1: Create the file** — no React imports; pure functions only:

```ts
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
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
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

export interface LoginFields {
  email: string;
  password: string;
}

export type LoginErrors = Partial<Record<keyof LoginFields, string>>;

export function validateLoginFields(fields: LoginFields): LoginErrors {
  const errors: LoginErrors = {};
  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(fields.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!fields.password) {
    errors.password = "Password is required.";
  }
  return errors;
}

export interface SignupFields {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export type SignupErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "terms", string>
>;

export function validateSignupFields(fields: SignupFields): SignupErrors {
  const errors: SignupErrors = {};
  if (fields.name.trim().length < 2) {
    errors.name = "Enter your full name (min 2 characters).";
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
  if (!fields.acceptedTerms) {
    errors.terms = "You must accept the terms to continue.";
  }
  return errors;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

---

### Task 3: Shared auth UI components (presentational only — no form state)

**Files:**
- Create: `frontend/src/features/auth/components/auth-brand-header.tsx`
- Create: `frontend/src/features/auth/components/auth-alert.tsx`
- Create: `frontend/src/features/auth/components/text-field.tsx`
- Create: `frontend/src/features/auth/components/password-input.tsx`
- Create: `frontend/src/features/auth/components/password-strength-meter.tsx`
- Create: `frontend/src/features/auth/components/sso-buttons.tsx`

- [ ] **Step 1: `auth-brand-header.tsx`** — logo mark + product name + per-page title/subtitle:

```tsx
import { Armchair } from "lucide-react";

interface AuthBrandHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthBrandHeader({ title, subtitle }: AuthBrandHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary-200/60 bg-primary-600 text-white shadow-sm">
          <Armchair className="h-6 w-6" />
        </div>
        <div className="text-left">
          <span className="block text-2xl leading-tight font-bold tracking-tight text-text">
            Urban Furniture
          </span>
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">
            Accounting &amp; ERP
          </span>
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-text">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>
    </div>
  );
}
```

- [ ] **Step 2: `auth-alert.tsx`** — dismissible banner for errors and demo notices:

```tsx
import { AlertCircle, Info, X } from "lucide-react";
import { cn } from "cn";

import type { AuthNotice } from "../validation";

interface AuthAlertProps extends AuthNotice {
  onDismiss: () => void;
}

export function AuthAlert({ kind, title, message, onDismiss }: AuthAlertProps) {
  const isError = kind === "error";
  return (
    <div
      role="alert"
      className={cn(
        "mb-5 flex items-start gap-3 rounded-lg border p-3.5",
        isError
          ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40"
          : "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/40"
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      ) : (
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
      )}
      <div className="flex-1 text-xs sm:text-sm">
        <p
          className={cn(
            "font-semibold",
            isError
              ? "text-red-800 dark:text-red-300"
              : "text-blue-800 dark:text-blue-300"
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5",
            isError
              ? "text-red-700 dark:text-red-400"
              : "text-blue-700 dark:text-blue-400"
          )}
        >
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={cn(
          "p-0.5 transition-colors",
          isError
            ? "text-red-400 hover:text-red-600"
            : "text-blue-400 hover:text-blue-600"
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: `text-field.tsx`** — label row + icon input + error/hint text. The workhorse for email/name/confirm fields:

```tsx
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

import { Input } from "@/components/ui/input";

interface TextFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  required?: boolean;
  labelAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export function TextField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  error,
  success = false,
  hint,
  required = false,
  labelAddon,
  rightAddon,
}: TextFieldProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        {labelAddon}
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted/70">
          <Icon className="h-4 w-4" />
        </div>
        <Input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-10 pl-9",
            rightAddon ? "pr-10" : "pr-3",
            success && !error && "border-emerald-400 dark:border-emerald-600"
          )}
        />
        {rightAddon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightAddon}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: `password-input.tsx`** — TextField with a show/hide eye toggle. Visibility state stays in the hook; this only renders:

```tsx
import { Eye, EyeOff, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { TextField } from "./text-field";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
  labelAddon?: ReactNode;
}

export function PasswordInput({
  show,
  onToggleShow,
  ...props
}: PasswordInputProps) {
  return (
    <TextField
      {...props}
      icon={Lock}
      type={show ? "text" : "password"}
      rightAddon={
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          className="text-text-muted/70 transition-colors hover:text-text"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}
```

- [ ] **Step 5: `password-strength-meter.tsx`** — segmented bar + rule checklist from the signup mock:

```tsx
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "cn";

import type { PasswordStrength } from "../validation";

const SEGMENT_COLORS = [
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-500",
];

const LABEL_COLORS = [
  "text-red-600 dark:text-red-400",
  "text-amber-600 dark:text-amber-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-emerald-600 dark:text-emerald-400",
];

export function PasswordStrengthMeter({
  strength,
}: {
  strength: PasswordStrength;
}) {
  const colorIndex = Math.max(strength.score - 1, 0);
  return (
    <div className="mt-2.5 rounded-lg border border-border bg-surface-muted p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-text">Password strength</span>
        <span
          className={cn("text-xs font-semibold", LABEL_COLORS[colorIndex])}
        >
          {strength.label} ({strength.score}/4)
        </span>
      </div>
      <div className="mb-2.5 grid h-1.5 grid-cols-4 gap-1.5">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={cn(
              "rounded-full",
              index < strength.score
                ? SEGMENT_COLORS[colorIndex]
                : "bg-border"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        {strength.rules.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5",
              rule.passed
                ? "font-medium text-emerald-700 dark:text-emerald-400"
                : "text-text-muted"
            )}
          >
            {rule.passed ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `sso-buttons.tsx`** — divider + Google/Microsoft visual stubs:

```tsx
export type SsoProvider = "google" | "microsoft";

interface SsoButtonsProps {
  onProviderClick: (provider: SsoProvider) => void;
}

const buttonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text shadow-sm transition-colors hover:bg-surface-muted";

export function SsoButtons({ onProviderClick }: SsoButtonsProps) {
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-3 font-medium tracking-wider text-text-muted">
            Enterprise Single Sign-On
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onProviderClick("google")}
          className={buttonClass}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
          </svg>
          Google SSO
        </button>
        <button
          type="button"
          onClick={() => onProviderClick("microsoft")}
          className={buttonClass}
        >
          <svg
            className="h-4 w-4 text-primary-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
          </svg>
          Microsoft AD
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify components compile**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

---

### Task 4: Login page (hook + form + route)

**Files:**
- Create: `frontend/src/features/auth/hooks/use-login-form.ts`
- Create: `frontend/src/features/auth/components/login-form.tsx`
- Create: `frontend/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: `use-login-form.ts`** — owns ALL state. Submit is a stub (no API; wiring is P0-INT-01):

```ts
import { useState } from "react";
import type { FormEvent } from "react";

import { validateLoginFields } from "../validation";
import type { AuthNotice, LoginErrors, LoginFields } from "../validation";
import type { SsoProvider } from "../components/sso-buttons";

const FIELD_ORDER: Array<keyof LoginFields> = ["email", "password"];

export function useLoginForm() {
  const [fields, setFields] = useState<LoginFields>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  function setField(field: keyof LoginFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginFields(fields);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      setNotice({
        kind: "error",
        title: "Unable to sign in",
        message: "Please correct the highlighted fields and try again.",
      });
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    // Demo only — real auth wiring happens in P0-INT-01 (spec §Future Seams)
    console.log("[demo] login submit", { ...fields, rememberDevice });
    setNotice({
      kind: "info",
      title: "Demo mode",
      message:
        "Authentication is not connected yet. Your credentials were not sent anywhere.",
    });
  }

  function handleSsoClick(provider: SsoProvider) {
    console.log(`[demo] sso click: ${provider}`);
    setNotice({
      kind: "info",
      title: "Enterprise SSO",
      message: "Single sign-on is not connected yet.",
    });
  }

  return {
    fields,
    setField,
    errors,
    rememberDevice,
    setRememberDevice,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    notice,
    dismissNotice: () => setNotice(null),
    handleSubmit,
    handleSsoClick,
  };
}
```

- [ ] **Step 2: `login-form.tsx`** — UI only; every value/handler comes from the hook:

```tsx
"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useLoginForm } from "../hooks/use-login-form";
import { AuthAlert } from "./auth-alert";
import { PasswordInput } from "./password-input";
import { SsoButtons } from "./sso-buttons";
import { TextField } from "./text-field";

export function LoginForm() {
  const form = useLoginForm();

  return (
    <div className="mt-8 w-full">
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
        {form.notice && (
          <AuthAlert {...form.notice} onDismiss={form.dismissNotice} />
        )}

        <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
          <TextField
            id="email"
            label="Email"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="admin@urbanfurniture.com"
            value={form.fields.email}
            onChange={(value) => form.setField("email", value)}
            error={form.errors.email}
            required
          />

          <PasswordInput
            id="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.fields.password}
            onChange={(value) => form.setField("password", value)}
            error={form.errors.password}
            show={form.showPassword}
            onToggleShow={form.toggleShowPassword}
            required
            labelAddon={
              <Link
                href="#"
                className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                Forgot password?
              </Link>
            }
          />

          <div className="flex items-center pt-1">
            <input
              id="remember-device"
              type="checkbox"
              checked={form.rememberDevice}
              onChange={(event) =>
                form.setRememberDevice(event.target.checked)
              }
              className="h-4 w-4 rounded border-border accent-primary-600"
            />
            <label
              htmlFor="remember-device"
              className="ml-2 block text-xs text-text-muted"
            >
              Remember me on this device
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" className="h-10 w-full gap-2 font-semibold">
              Sign in
              <ArrowRight />
            </Button>
          </div>
        </form>

        <SsoButtons onProviderClick={form.handleSsoClick} />

        <div className="mt-6 border-t border-border/60 pt-5 text-center">
          <p className="text-sm text-text-muted">
            Don&apos;t have an account?
            <Link
              href="/signup"
              className="ml-1 font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `(auth)/login/page.tsx`** — thin route, sets width + header copy:

```tsx
import type { Metadata } from "next";

import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign in · Urban Furniture Accounting",
};

export default function LoginPage() {
  return (
    <div className="w-full sm:max-w-md">
      <AuthBrandHeader
        title="Sign in to your account"
        subtitle="Access purchase orders, bills, payments, and reports"
      />
      <LoginForm />
    </div>
  );
}
```

- [ ] **Step 4: Verify `/login` in the browser**

Run: `cd frontend && npm run build` then visit `http://localhost:3000/login`
Expected: page renders per spec; empty submit shows inline errors + error alert; valid submit shows demo info alert; eye toggle works; `/` still renders with sidebar.

---

### Task 5: Signup page (hook + form + route)

**Files:**
- Create: `frontend/src/features/auth/hooks/use-signup-form.ts`
- Create: `frontend/src/features/auth/components/signup-form.tsx`
- Create: `frontend/src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: `use-signup-form.ts`** — owns all state incl. derived strength/match:

```ts
import { useState } from "react";
import type { FormEvent } from "react";

import { getPasswordStrength, validateSignupFields } from "../validation";
import type { AuthNotice, SignupErrors, SignupFields } from "../validation";

const FIELD_ORDER: Array<keyof SignupErrors> = [
  "name",
  "email",
  "password",
  "confirmPassword",
  "terms",
];

export function useSignupForm() {
  const [fields, setFields] = useState<SignupFields>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const passwordStrength = getPasswordStrength(fields.password);
  const passwordsMatch =
    fields.confirmPassword.length > 0 &&
    fields.password === fields.confirmPassword;

  function setField(
    field: keyof Omit<SignupFields, "acceptedTerms">,
    value: string
  ) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function setAcceptedTerms(value: boolean) {
    setFields((prev) => ({ ...prev, acceptedTerms: value }));
    setErrors((prev) => ({ ...prev, terms: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSignupFields(fields);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      setNotice({
        kind: "error",
        title: "Unable to create account",
        message: "Please correct the highlighted fields and try again.",
      });
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    // Demo only — real registration wiring happens in P0-INT-01
    console.log("[demo] signup submit", fields);
    setNotice({
      kind: "info",
      title: "Demo mode",
      message:
        "Registration is not connected yet. Your details were not sent anywhere.",
    });
  }

  return {
    fields,
    setField,
    errors,
    setAcceptedTerms,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    passwordStrength,
    passwordsMatch,
    notice,
    dismissNotice: () => setNotice(null),
    handleSubmit,
  };
}
```

- [ ] **Step 2: `signup-form.tsx`** — UI only. Note: `id="confirmPassword"` matches the hook's focus target:

```tsx
"use client";

import Link from "next/link";
import { Check, Mail, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useSignupForm } from "../hooks/use-signup-form";
import { AuthAlert } from "./auth-alert";
import { PasswordInput } from "./password-input";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { TextField } from "./text-field";

export function SignupForm() {
  const form = useSignupForm();

  return (
    <div className="mt-6 w-full">
      <div className="rounded-2xl border border-border bg-surface px-6 py-7 shadow-sm sm:px-8">
        {form.notice && (
          <AuthAlert {...form.notice} onDismiss={form.dismissNotice} />
        )}

        <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
          <TextField
            id="name"
            label="Full name"
            icon={User}
            autoComplete="name"
            placeholder="e.g. Sourabh Sharma"
            value={form.fields.name}
            onChange={(value) => form.setField("name", value)}
            error={form.errors.name}
            required
          />

          <TextField
            id="email"
            label="Work email"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="you@urbanfurniture.com"
            value={form.fields.email}
            onChange={(value) => form.setField("email", value)}
            error={form.errors.email}
            required
          />

          <div>
            <PasswordInput
              id="password"
              label="Password"
              autoComplete="new-password"
              placeholder="Create a secure password"
              value={form.fields.password}
              onChange={(value) => form.setField("password", value)}
              error={form.errors.password}
              show={form.showPassword}
              onToggleShow={form.toggleShowPassword}
              required
            />
            {form.fields.password.length > 0 && (
              <PasswordStrengthMeter strength={form.passwordStrength} />
            )}
          </div>

          <TextField
            id="confirmPassword"
            label="Re-enter password"
            icon={ShieldCheck}
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={form.fields.confirmPassword}
            onChange={(value) => form.setField("confirmPassword", value)}
            error={form.errors.confirmPassword}
            success={form.passwordsMatch}
            required
            labelAddon={
              form.passwordsMatch ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  Passwords match
                </span>
              ) : undefined
            }
            rightAddon={
              form.passwordsMatch ? (
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : undefined
            }
          />

          <div className="pt-1">
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={form.fields.acceptedTerms}
                onChange={(event) =>
                  form.setAcceptedTerms(event.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary-600"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-xs leading-normal text-text-muted"
              >
                I agree to the{" "}
                <a href="#" className="text-primary-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and acknowledge the operational compliance guidelines.
              </label>
            </div>
            {form.errors.terms && (
              <p className="mt-1 text-xs text-destructive">
                {form.errors.terms}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-3 sm:flex-row">
            <Button
              type="submit"
              className="order-1 h-10 flex-1 gap-2 font-semibold sm:order-2"
            >
              Create account
              <Check />
            </Button>
            <Link
              href="/login"
              className="order-2 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted sm:order-1"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-6 border-t border-border/60 pt-5 text-center">
          <p className="text-sm text-text-muted">
            Already have an account?
            <Link
              href="/login"
              className="ml-1 font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `(auth)/signup/page.tsx`:**

```tsx
import type { Metadata } from "next";

import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Create account · Urban Furniture Accounting",
};

export default function SignupPage() {
  return (
    <div className="w-full sm:max-w-lg">
      <AuthBrandHeader
        title="Create your account"
        subtitle="Register to manage procurement and accounting"
      />
      <SignupForm />
    </div>
  );
}
```

- [ ] **Step 4: Verify `/signup` in the browser**

Visit `http://localhost:3000/signup`
Expected: strength meter appears and updates while typing; match badge appears when passwords match; empty submit shows all inline errors + error alert and focuses "name"; valid submit shows demo info alert.

---

### Task 6: Final verification

- [ ] **Step 1: Lint**

Run: `cd frontend && npm run lint`
Expected: no errors.

- [ ] **Step 2: Production build**

Run: `cd frontend && npm run build`
Expected: compiles; `/`, `/login`, `/signup` all listed as routes.

- [ ] **Step 3: Browser checklist** (dev server on `:3000`)

| Check | Expected |
|---|---|
| `/login` renders | Matches spec §6 (light + dark via theme toggle) |
| `/signup` renders | Matches spec §6 (light + dark) |
| `/` home | Sidebar/header/footer shell intact, no regression |
| Login submit (empty) | Inline errors + red alert, email focused |
| Login submit (valid) | Blue "Demo mode" alert, dismissible |
| Signup typing | Strength meter + match badge update live |
| `/login` ↔ `/signup` links | Both navigate correctly |

- [ ] **Step 4: Update TASK_BOARD** — move P0-FE-02 evidence in (UI portion DONE per spec; AuthContext + API client remain open for P0-INT-01 prep).

---

## Self-Review Notes

- **Spec coverage:** §3 route groups → Task 1; §4 file map → Tasks 2–5; §5 state ownership → hooks in Tasks 4–5; §6 page content → forms/pages; §7 validation → Task 2; §8 styling → component classes; §9 error handling → AuthAlert; §10 verification → Task 6.
- **Type consistency:** `AuthNotice`, `LoginFields/LoginErrors`, `SignupFields/SignupErrors`, `PasswordStrength`, `SsoProvider` are defined once in Task 2/3 and imported everywhere else. `id="confirmPassword"` in the form matches `FIELD_ORDER` in the hook.
- **No placeholders:** every code block is complete and runnable.
