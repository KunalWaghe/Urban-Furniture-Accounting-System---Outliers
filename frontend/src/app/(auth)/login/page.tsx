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
