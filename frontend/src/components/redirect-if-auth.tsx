"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-context";

/**
 * Wraps the (auth) layout.
 *
 * Three states:
 *  1. bootstrapping=true  → /auth/me in-flight; render nothing (prevents a
 *     flash of the login page to a user who is already authenticated).
 *  2. bootstrapping=false, isAuthenticated=true  → redirect to /.
 *  3. bootstrapping=false, isAuthenticated=false → render children (auth form).
 */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!bootstrapping && isAuthenticated) {
      router.replace("/");
    }
  }, [bootstrapping, isAuthenticated, router]);

  // Still verifying — show nothing to avoid a flash of the login form.
  if (bootstrapping) return null;

  // Authenticated — the effect is redirecting; render nothing.
  if (isAuthenticated) return null;

  return <>{children}</>;
}
