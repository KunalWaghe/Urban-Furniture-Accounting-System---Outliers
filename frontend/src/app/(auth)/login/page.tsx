/**
 * Next.js App Router — Login Page
 *
 * Route: `/login`
 *
 * Public page for signing in. Wrapped by `(auth)/layout.tsx`, which redirects
 * already-authenticated users to the dashboard.
 */
import type { Metadata } from "next";

import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { LoginForm } from "@/features/auth/components/login-form";

/** Browser tab title for the login screen. */
export const metadata: Metadata = {
  title: "Sign in · Urban Furniture Accounting",
};

/**
 * Login route — brand header plus the sign-in form.
 *
 * Feature components:
 * - `AuthBrandHeader` — title and subtitle above the form
 * - `LoginForm` — email/password fields and submit handler
 *
 * No role guard; anyone can visit `/login` when logged out.
 */
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
