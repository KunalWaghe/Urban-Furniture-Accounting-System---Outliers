import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password · Urban Furniture Accounting",
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="w-full sm:max-w-md">
      <AuthBrandHeader
        title="Set a new password"
        subtitle="Enter and confirm your new password to secure your account"
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-muted" />}>
        <ResetPasswordForm initialToken={params.token ?? ""} />
      </Suspense>
    </div>
  );
}
