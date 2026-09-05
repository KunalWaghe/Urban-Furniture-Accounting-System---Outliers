"use client";

import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useLoginForm } from "../hooks/use-login-form";
import { AuthAlert } from "./auth-alert";
import { PasswordInput } from "./password-input";
import { TextField } from "./text-field";

export function LoginForm() {
  const form = useLoginForm();

  return (
    <div className="mt-8 w-full max-w-md">
      <div className="rounded-2xl border border-border bg-surface px-4 py-6 shadow-sm sm:px-8 sm:py-8">
        {form.notice && (
          <AuthAlert {...form.notice} onDismiss={form.dismissNotice} />
        )}

        <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
          <TextField
            id="login_id"
            label="Login ID"
            icon={KeyRound}
            type="text"
            autoComplete="username"
            placeholder="e.g. riya001"
            value={form.fields.login_id}
            onChange={(value) => form.setField("login_id", value)}
            error={form.errors.login_id}
            hint="6–12 alphanumeric characters"
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
              onChange={(event) => form.setRememberDevice(event.target.checked)}
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
            <Button
              type="submit"
              className="h-10 w-full gap-2 font-semibold"
              disabled={form.isSubmitting}
            >
              {form.isSubmitting ? "Signing in…" : "Sign in"}
              {!form.isSubmitting && <ArrowRight />}
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t border-border/60 pt-5 text-center">
          <p className="text-sm text-text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
