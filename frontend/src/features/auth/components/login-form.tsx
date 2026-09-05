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
    <div className="mt-8 w-full">
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
        {form.notice && (
          <AuthAlert {...form.notice} onDismiss={form.dismissNotice} />
        )}

        <div className="mb-5 rounded-xl border border-primary-200 bg-primary-50/60 p-3.5 text-xs text-text-muted">
          <div className="flex items-center justify-between font-semibold text-text-main">
            <span>Demo Accounts</span>
            <span className="text-[10px] font-normal uppercase tracking-wider text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">Quick Fill</span>
          </div>
          <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                form.setField("login_id", "admin");
                form.setField("password", "Admin@123");
              }}
              className="flex-1 rounded-lg border border-primary-200 bg-surface px-2.5 py-1.5 text-left font-mono text-xs hover:border-primary-400 transition cursor-pointer"
            >
              <span className="font-sans font-semibold text-primary-700">Admin:</span> admin / Admin@123
            </button>
            <button
              type="button"
              onClick={() => {
                form.setField("login_id", "accountant");
                form.setField("password", "Accountant@123");
              }}
              className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left font-mono text-xs hover:border-primary-400 transition cursor-pointer"
            >
              <span className="font-sans font-semibold text-text-main">Accountant:</span> accountant / Accountant@123
            </button>
          </div>
        </div>

        <form className="space-y-4" onSubmit={form.handleSubmit} noValidate>
          <TextField
            id="login_id"
            label="Login ID or Email"
            icon={KeyRound}
            type="text"
            autoComplete="username"
            placeholder="e.g. admin or admin@urbanfurniture.com"
            value={form.fields.login_id}
            onChange={(value) => form.setField("login_id", value)}
            error={form.errors.login_id}
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
