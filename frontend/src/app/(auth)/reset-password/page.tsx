import { AuthBrandHeader } from "@/features/auth/components/auth-brand-header";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <div className="w-full sm:max-w-md"><AuthBrandHeader title="Set a new password" subtitle="Use the reset token supplied by your administrator or email flow" /><ResetPasswordForm initialToken={params.token ?? ""} /></div>;
}
