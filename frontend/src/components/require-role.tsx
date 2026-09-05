"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ArrowLeft, LogOut, ShieldAlert } from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";

interface RequireRoleProps {
  allowedRoles: string[];
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: "Administrator",
  invoicing_user: "Accountant",
  contact: "Portal User (Contact)",
};

export function RequireRole({
  allowedRoles,
  children,
  fallbackTitle = "Access Denied",
  fallbackMessage,
}: RequireRoleProps) {
  const { user, isAuthenticated, bootstrapping, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!bootstrapping && !isAuthenticated) {
      router.replace("/login");
    }
  }, [bootstrapping, isAuthenticated, router]);

  if (bootstrapping) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Verifying permissions…" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isAllowed = allowedRoles.includes(user.role);

  if (!isAllowed) {
    const roleName = ROLE_DISPLAY_NAMES[user.role] || user.role;
    const requiredRoles = allowedRoles
      .map((r) => ROLE_DISPLAY_NAMES[r] || r)
      .join(" or ");

    return (
      <div className="mx-auto my-12 max-w-lg rounded-2xl border border-destructive/20 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <span className="mt-4 inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive">
          403 Forbidden
        </span>

        <h2 className="mt-3 text-xl font-bold text-text">{fallbackTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {fallbackMessage ||
            `Your current role (${roleName}) does not have permission to access this screen. This module requires ${requiredRoles} authorization.`}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Switch Account
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
