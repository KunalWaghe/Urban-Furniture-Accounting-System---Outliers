"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { forgotPasswordRequest } from "@/features/auth/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await forgotPasswordRequest({ email });
      setMessage(response.message || "If the account exists, reset instructions have been generated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start password reset.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="w-full sm:max-w-md"><AuthBrandHeader title="Reset your password" subtitle="Request a secure reset link for your Urban Furniture account" /><div className="rounded-2xl border border-border bg-surface p-6 shadow-sm"><form className="space-y-4" onSubmit={handleSubmit}><label className="block text-sm font-medium text-text">Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="you@company.com" /></label>{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}{message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p>}<button type="submit" disabled={submitting} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50">{submitting ? "Sending…" : "Send reset request"}</button></form><p className="mt-5 text-center text-sm text-text-muted"><Link href="/login" className="font-semibold text-primary-600 hover:underline">Back to sign in</Link></p></div></div>;
}
