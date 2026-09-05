"use client";

import Link from "next/link";
import { Check, KeyRound, Mail, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ADMIN_CREATABLE_ROLES } from "../validation";
import { useSignupForm } from "../hooks/use-signup-form";
import { AuthAlert } from "./auth-alert";
import type { AuthUser } from "@/lib/types";
import { PasswordInput } from "./password-input";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { TextField } from "./text-field";

export interface SignupFormProps {
  mode?: "signup" | "admin-create";
  onSuccess?: (createdUser: AuthUser) => void;
  className?: string;
  cancelHref?: string;
}

export function SignupForm({
  mode = "signup",
  onSuccess,
  className = "",
  cancelHref,
}: SignupFormProps) {
  const form = useSignupForm({ mode, onSuccess });
  const isAdminCreate = mode === "admin-create";

  return (
    <div className={`mt-6 w-full ${className}`}>
      <div className="rounded-2xl border border-border bg-surface px-6 py-7 shadow-sm sm:px-8">
        {form.notice && (
          <AuthAlert {...form.notice} onDismiss={form.dismissNotice} />
        )}

        <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
          {/* Full name */}
          <TextField
            id="name"
            label="Full name"
            icon={User}
            autoComplete="name"
            placeholder={isAdminCreate ? "e.g. Nimesh Pathak" : "e.g. Sourabh Sharma"}
            value={form.fields.name}
            onChange={(value) => form.setField("name", value)}
            error={form.errors.name}
            required
          />

          {/* Login ID */}
          <TextField
            id="login_id"
            label="Login ID"
            icon={KeyRound}
            type="text"
            autoComplete="username"
            placeholder={isAdminCreate ? "e.g. nimesh01" : "e.g. sourabh01"}
            value={form.fields.login_id}
            onChange={(value) => form.setField("login_id", value)}
            error={form.errors.login_id}
            hint="6–12 letters and numbers — used to sign in"
            required
          />

          {/* Work email */}
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

          {/* Role selector - only displayed on Create User page for Admin */}
          {isAdminCreate && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                Assigned Role <span className="ml-0.5 text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ADMIN_CREATABLE_ROLES.map((r) => {
                  const isSelected = form.fields.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => form.setRole(r.value)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-primary-600 bg-primary-50 font-semibold text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-300"
                          : "border-border bg-surface text-text-muted hover:border-border/80 hover:bg-surface-muted hover:text-text"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <PasswordInput
              id="password"
              label={isAdminCreate ? "Initial Password" : "Password"}
              autoComplete="new-password"
              placeholder={isAdminCreate ? "Create a secure initial password" : "Create a secure password"}
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

          {/* Confirm password */}
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

          {/* Terms - for public signup only */}
          {!isAdminCreate && (
            <div className="pt-1">
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={form.fields.acceptedTerms}
                  onChange={(event) => form.setAcceptedTerms(event.target.checked)}
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
                <p className="mt-1 text-xs text-destructive">{form.errors.terms}</p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col gap-3 pt-3 sm:flex-row">
            <Button
              type="submit"
              className="order-1 h-10 flex-1 gap-2 font-semibold sm:order-2"
              disabled={form.isSubmitting}
            >
              {form.isSubmitting
                ? isAdminCreate
                  ? "Creating user…"
                  : "Creating account…"
                : isAdminCreate
                ? "Create & Authorize User"
                : "Create account"}
              {!form.isSubmitting && <Check className="h-4 w-4" />}
            </Button>
            <Link
              href={cancelHref || (isAdminCreate ? "/" : "/login")}
              className="order-2 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted sm:order-1"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Footer link for public signup */}
        {!isAdminCreate && (
          <div className="mt-6 border-t border-border/60 pt-5 text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
