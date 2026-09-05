"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Armchair,
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  ShoppingCart,
  Sun,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

export const TOP_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Purchase Orders", href: "#", icon: ShoppingCart, roles: ["admin", "invoicing_user"] },
  { label: "Bills", href: "#", icon: Receipt, roles: ["admin", "invoicing_user"] },
  { label: "Payments", href: "#", icon: CreditCard, roles: ["admin", "invoicing_user"] },
  { label: "Reports", href: "#", icon: BarChart3, roles: ["admin", "invoicing_user"] },
  { label: "User Management", href: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Portal Invoices", href: "#", icon: FileText, roles: ["contact"] },
];

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
  const visibleNavItems = TOP_NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Desktop Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="rounded-xl bg-primary-600 p-2 text-white shadow-sm">
              <Armchair className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-text sm:text-base leading-tight">
                Urban<span className="text-primary-600">Furniture</span>
              </span>
              <span className="block text-[11px] text-text-muted leading-none">
                Accounting System
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 border-l border-border pl-4 lg:pl-6">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href) && item.href !== "#";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors lg:text-sm",
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-semibold"
                      : "text-text-muted hover:bg-surface-muted hover:text-text"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User pill + Theme toggle + Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/70 bg-surface-muted/40 px-2.5 py-1.5 text-xs">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[120px] lg:max-w-[160px] truncate font-medium text-text">
                {user.name}
              </div>
              {user.role === "admin" && (
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  Admin
                </span>
              )}
              {user.role === "invoicing_user" && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Accountant
                </span>
              )}
              {user.role === "contact" && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Portal
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text transition-colors hover:bg-surface-muted"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text transition-colors hover:bg-surface-muted md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          {user && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-border/70 bg-surface-muted/40 p-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text">{user.name}</div>
                  <div className="text-[11px] text-text-muted">
                    {user.login_id ? `@${user.login_id}` : user.email}
                  </div>
                </div>
              </div>
              {user.role === "admin" && (
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  Admin
                </span>
              )}
              {user.role === "invoicing_user" && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Accountant
                </span>
              )}
              {user.role === "contact" && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Portal
                </span>
              )}
            </div>
          )}

          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href) && item.href !== "#";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-semibold"
                      : "text-text-muted hover:bg-surface-muted hover:text-text"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 border-t border-border pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted hover:text-text"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
