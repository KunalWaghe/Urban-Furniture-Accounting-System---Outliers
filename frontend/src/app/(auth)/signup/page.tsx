import type { Metadata } from "next";

import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Create account · Urban Furniture Accounting",
};

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
