"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/auth-context";
import { LoadingSpinner } from "@/components/loading-spinner";

/**
 * Wraps any (app) layout or page.
 *
 * Three states:
 *  1. bootstrapping=true  → /auth/me in-flight; show a centered spinner so
 *     the user sees feedback, not a blank screen.
 *  2. bootstrapping=false, isAuthenticated=true  → render children.
 *  3. bootstrapping=false, isAuthenticated=false → redirect to /login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!bootstrapping && !isAuthenticated) {
      router.replace("/login");
    }
  }, [bootstrapping, isAuthenticated, router]);

  // Still verifying the stored token — show a spinner instead of a blank screen.
  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" label="Loading…" />
      </div>
    );
  }

  // Unauthenticated — the effect above is redirecting; render nothing.
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
