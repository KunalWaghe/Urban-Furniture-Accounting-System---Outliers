/**
 * Next.js App Router — Signup Page
 *
 * Route: `/signup`
 *
 * Public page for self-service account registration. Wrapped by `(auth)/layout.tsx`,
 * which redirects already-authenticated users to the dashboard.
 */
import type { Metadata } from "next";

import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { SignupForm } from "@/features/auth/components/signup-form";

/** Browser tab title for the signup screen. */
export const metadata: Metadata = {
  title: "Create account · Urban Furniture Accounting",
};

/**
 * Signup route — brand header plus the registration form.
 *
 * Feature components:
 * - `AuthBrandHeader` — title and subtitle above the form
 * - `SignupForm` — default self-registration mode (not admin-create)
 *
 * No role guard; anyone can visit `/signup` when logged out.
 */
export default function SignupPage() {
  return (
    <div className="w-full sm:max-w-lg">
      <AuthBrandHeader
        title="Create your account"
        subtitle="Register to manage procurement and accounting"
      />
      <SignupForm />
    </div>
  );
}
