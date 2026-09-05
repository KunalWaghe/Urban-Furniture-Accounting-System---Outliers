"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { resetPasswordRequest } from "./api";

export function ResetPasswordForm({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await resetPasswordRequest({ token, new_password: password });
      setMessage(response.message || "Password reset successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm"><form className="space-y-4" onSubmit={handleSubmit}><label className="block text-sm font-medium text-text">Reset token<input required value={token} onChange={(event) => setToken(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label><label className="block text-sm font-medium text-text">New password<input type="password" required minLength={9} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="At least 9 characters with upper/lowercase and symbol" /></label>{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}{message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p>}<button type="submit" disabled={submitting} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50">{submitting ? "Resetting…" : "Reset password"}</button></form><p className="mt-5 text-center text-sm text-text-muted"><Link href="/login" className="font-semibold text-primary-600 hover:underline">Back to sign in</Link></p></div>;
}
