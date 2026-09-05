"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Armchair, LogOut, Menu, Moon, Sun, User, X } from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Sales", href: "/sales-orders", roles: ["admin", "invoicing_user"] },
  { label: "Purchase Orders", href: "/purchase-orders", roles: ["admin", "invoicing_user"] },
  { label: "Master Data", href: "#", roles: ["admin", "invoicing_user"] },
  { label: "Journals", href: "#", roles: ["admin", "invoicing_user"] },
  { label: "Reports", href: "#", roles: ["admin", "invoicing_user"] },
  { label: "User Management", href: "/admin/users", roles: ["admin"] },
  { label: "Portal Invoices", href: "#", roles: ["contact"] },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Admin</span>;
  }
  if (role === "invoicing_user") {
    return <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Accountant</span>;
  }
  return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Portal</span>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const userRole = user?.role || "invoicing_user";
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(userRole));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="rounded-xl bg-primary-600 p-2 text-white shadow-sm shadow-primary-500/20">
            <Armchair className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="block text-sm font-bold leading-tight tracking-tight text-text sm:text-base">
              Urban<span className="text-primary-600">Furniture</span>
            </span>
            <span className="block text-[11px] leading-none text-text-muted">Accounting System</span>
          </div>
        </Link>

        {/* Flat nav pills (Stitch clean top nav) */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-primary-50 font-semibold text-primary-600 shadow-sm dark:bg-primary-950/40 dark:text-primary-400"
                    : "font-medium text-text-muted hover:bg-surface-muted hover:text-text"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: user + theme + sign out + mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="hidden items-center gap-2 rounded-xl border border-border/70 bg-surface-muted/40 px-2.5 py-1.5 text-xs lg:flex">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[120px] truncate font-medium text-text">{user.name}</div>
              <RoleBadge role={user.role} />
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text transition-colors hover:bg-surface-muted"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text sm:flex"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text transition-colors hover:bg-surface-muted md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          {user && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-border/70 bg-surface-muted/40 p-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-text">{user.name}</div>
                <div className="text-[11px] text-text-muted">{user.login_id ? `@${user.login_id}` : user.email}</div>
              </div>
              <RoleBadge role={user.role} />
            </div>
          )}
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary-50 font-semibold text-primary-600 dark:bg-primary-950/40 dark:text-primary-400"
                      : "font-medium text-text-muted hover:bg-surface-muted hover:text-text"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </header>
  );
}
