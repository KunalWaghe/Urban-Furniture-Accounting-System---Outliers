"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, KeyRound, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthAlert } from "./components/auth-alert";
import { PasswordInput } from "./components/password-input";
import { PasswordStrengthMeter } from "./components/password-strength-meter";
import { TextField } from "./components/text-field";
import { getPasswordStrength, PASSWORD_RULES, type AuthNotice } from "./validation";
import { resetPasswordRequest } from "./api";

interface ResetPasswordFormProps {
  initialToken?: string;
}

export function ResetPasswordForm({ initialToken = "" }: ResetPasswordFormProps) {
  const searchParams = useSearchParams();
  const token = initialToken || searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = Boolean(
    password && confirmPassword && password === confirmPassword
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!token.trim()) {
      setNotice({
        kind: "error",
        title: "Missing reset token",
        message:
          "Reset token is missing or invalid. Please open the reset link provided in your email or request a new reset.",
      });
      return;
    }

    if (passwordStrength.score < PASSWORD_RULES.length) {
      setNotice({
        kind: "error",
        title: "Password requirements not met",
        message: "Please meet all password strength requirements before proceeding.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotice({
        kind: "error",
        title: "Passwords do not match",
        message: "Please ensure both password entries are identical.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetPasswordRequest({
        token: token.trim(),
        new_password: password,
      });
      setIsSuccess(true);
      setNotice({
        kind: "info",
        title: "Password reset successful",
        message:
          response.message ||
          "Your password has been reset successfully. You can now sign in with your new credentials.",
      });
    } catch (requestError) {
      setNotice({
        kind: "error",
        title: "Unable to reset password",
        message:
          requestError instanceof Error
            ? requestError.message
            : "An unexpected error occurred while resetting your password. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-text">Password Reset Completed</h3>
          <p className="mt-2 text-sm text-text-muted">
            Your new password has been set. You can now log into your Urban Furniture account with your updated credentials.
          </p>
          <div className="mt-6 w-full">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in to your account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      {notice && (
        <AuthAlert
          kind={notice.kind}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      {!token && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            No reset token found in URL. Make sure you opened the full link from your reset email or request a new one below.
          </span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <PasswordInput
            id="new-password"
            label="New password"
            autoComplete="new-password"
            placeholder="Enter new secure password"
            value={password}
            onChange={(value) => setPassword(value)}
            show={showPassword}
            onToggleShow={() => setShowPassword((prev) => !prev)}
            required
          />
          {password.length > 0 && (
            <PasswordStrengthMeter strength={passwordStrength} />
          )}
        </div>

        <TextField
          id="confirm-password"
          label="Confirm new password"
          icon={ShieldCheck}
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
          success={passwordsMatch}
          required
          labelAddon={
            passwordsMatch ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                Passwords match
              </span>
            ) : undefined
          }
          rightAddon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="text-text-muted/70 transition-colors hover:text-text"
            >
              {passwordsMatch ? (
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : null}
            </button>
          }
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full gap-2 font-semibold"
          >
            {submitting ? "Resetting password…" : "Reset password"}
            {!submitting && <Check className="h-4 w-4" />}
          </Button>
        </div>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        <Link href="/login" className="font-semibold text-primary-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
