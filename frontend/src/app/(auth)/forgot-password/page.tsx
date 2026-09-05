"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Mail, Send, ArrowLeft } from "lucide-react";

import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { TextField } from "@/features/auth/components/text-field";
import { AuthAlert } from "@/features/auth/components/auth-alert";
import { Button } from "@/components/ui/button";
import { forgotPasswordRequest } from "@/features/auth/api";
import { isValidEmail } from "@/features/auth/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<{ kind: "error" | "info"; title: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!email.trim()) {
      setNotice({
        kind: "error",
        title: "Email is required",
        message: "Please enter your work email address.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      setNotice({
        kind: "error",
        title: "Invalid email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await forgotPasswordRequest({ email: email.trim() });
      setEmailSent(true);
      setNotice({
        kind: "info",
        title: "Reset instructions sent",
        message:
          response.message ||
          "If an account with that email exists, password reset instructions have been sent.",
      });
    } catch (requestError) {
      setNotice({
        kind: "error",
        title: "Unable to start reset",
        message:
          requestError instanceof Error
            ? requestError.message
            : "Unable to process password reset. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full sm:max-w-md">
      <AuthBrandHeader
        title="Reset your password"
        subtitle="Request a secure password reset link for your account"
      />

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        {notice && (
          <AuthAlert
            kind={notice.kind}
            title={notice.title}
            message={notice.message}
            onDismiss={() => setNotice(null)}
          />
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <TextField
            id="email"
            label="Work email"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="you@urbanfurniture.com"
            value={email}
            onChange={(val) => setEmail(val)}
            required
            disabled={submitting || emailSent}
          />

          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 font-semibold"
            >
              {submitting ? "Sending request…" : emailSent ? "Resend reset link" : "Send reset link"}
              {!submitting && <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
