"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  FileText,
  Receipt,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";

interface Section {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

const sections: Section[] = [
  {
    title: "Purchase Orders",
    description:
      "Create and track purchase orders for furniture procurements across vendors.",
    href: "#",
    icon: ShoppingCart,
    roles: ["admin", "invoicing_user"],
  },
  {
    title: "Bills",
    description:
      "Record vendor bills, match them to orders, and monitor approval status.",
    href: "#",
    icon: Receipt,
    roles: ["admin", "invoicing_user"],
  },
  {
    title: "Payments",
    description:
      "Schedule and log outgoing and incoming settlements with complete audit trail.",
    href: "#",
    icon: CreditCard,
    roles: ["admin", "invoicing_user"],
  },
  {
    title: "Financial Reports",
    description:
      "View real-time Balance Sheet and Profit & Loss reports computed from posted journals.",
    href: "#",
    icon: BarChart3,
    roles: ["admin", "invoicing_user"],
  },
  {
    title: "User Management",
    description:
      "Create and administer internal accounts, accountants, and external contact portal users.",
    href: "/admin/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "My Invoices",
    description:
      "View your verified self-service invoices and settlement status.",
    href: "#",
    icon: FileText,
    roles: ["contact"],
  },
];

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || "invoicing_user";

  const visibleSections = sections.filter(
    (s) => !s.roles || s.roles.includes(role)
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            Accounting &amp; ERP System
          </span>
          {role === "admin" && (
            <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Role: Administrator
            </span>
          )}
          {role === "invoicing_user" && (
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Role: Accountant
            </span>
          )}
          {role === "contact" && (
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Role: Customer / Vendor Portal
            </span>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-text sm:text-3xl">
          Welcome back, {user?.name || "Team Member"}!
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
          {role === "contact"
            ? "You are logged into the Urban Furniture Self-Service Portal. Internal procurement and journal books are restricted."
            : "A seamless double-entry accounting engine where standard business actions automatically post balanced journal entries with zero lag."}
        </p>

        {role !== "contact" && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
            >
              View reports
            </Link>
            {role === "admin" && (
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-800 transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
              >
                <Users className="h-4 w-4" />
                Manage Users
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Module Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSections.map((section) => (
          <div
            key={section.title}
            className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary-200 dark:hover:border-primary-800"
          >
            <div>
              <div className="w-fit rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                <section.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-text">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-text-muted">{section.description}</p>
            </div>
            <Link
              href={section.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Open module
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
