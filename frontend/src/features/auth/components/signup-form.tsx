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
              disabled={form.isSubmitting}
            >
              {form.isSubmitting ? "Creating account…" : "Create account"}
              {!form.isSubmitting && <Check />}
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
