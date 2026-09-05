"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-context";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Wraps the (auth) layout.
 *
 * States:
 *  1. !mounted            → SSR or initial client hydration; render children so
 *                           server HTML and client initial render match identically.
 *  2. bootstrapping=true  → /auth/me in-flight; render nothing (prevents a
 *                           flash of the login page to a user who is already authenticated).
 *  3. bootstrapping=false, isAuthenticated=true  → redirect to /.
 *  4. bootstrapping=false, isAuthenticated=false → render children (auth form).
 */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (mounted && !bootstrapping && isAuthenticated) {
      router.replace("/");
    }
  }, [mounted, bootstrapping, isAuthenticated, router]);

  // Before mounting, render children so SSR HTML matches initial client hydration.
  if (!mounted) {
    return <>{children}</>;
  }

  // Still verifying — show nothing to avoid a flash of the login form.
  if (bootstrapping) return null;

  // Authenticated — the effect is redirecting; render nothing.
  if (isAuthenticated) return null;

  return <>{children}</>;
}
