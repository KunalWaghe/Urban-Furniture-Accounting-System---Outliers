"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Shield, UserPlus, Users } from "lucide-react";

import { RequireRole } from "@/components/require-role";
import { SignupForm } from "@/features/auth/components/signup-form";
import type { AuthUser } from "@/lib/types";

export default function CreateNewUserPage() {
  const [createdUser, setCreatedUser] = useState<AuthUser | null>(null);

  return (
    <RequireRole allowedRoles={["admin"]}>
      <div className="space-y-6 pb-12">
        {/* Back Link & Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 font-medium text-text-muted transition-colors hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            User Management
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">Create New User</span>
        </div>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Admin Only
            </span>
            <span className="text-xs text-text-muted">· Role-Gated Path (/users/new)</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Create New User
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Authorize a new internal account with role-based permissions and secure credentials.
          </p>
        </div>

        {/* Success Alert if just created */}
        {createdUser && (
          <div className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  User Created Successfully
                </p>
                <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                  Account <span className="font-semibold">@{createdUser.login_id}</span> ({createdUser.name}) was registered with role{" "}
                  <span className="font-semibold uppercase">{createdUser.role === "invoicing_user" ? "Accountant" : createdUser.role}</span>.
                </p>
              </div>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm border border-emerald-200 hover:bg-emerald-50 dark:bg-surface dark:text-emerald-300 dark:border-emerald-800"
            >
              <Users className="h-3.5 w-3.5" />
              View Users List
            </Link>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Create User Form */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 pb-2">
              <UserPlus className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-text">Account Details</h2>
            </div>
            <SignupForm
              mode="admin-create"
              onSuccess={(user) => setCreatedUser(user)}
              cancelHref="/admin/users"
            />
          </div>

          {/* Role Privileges & Guidelines */}
          <div className="space-y-6 lg:col-span-5 lg:mt-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Shield className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-text">Role Privileges Matrix</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">Admin:</span>
                  <span>Full access across Purchase Orders, Sales, Chart of Accounts, Reports, and User Administration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Accountant:</span>
                  <span>Standard operator for invoices, bills, payments, and double-entry journals.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Password &amp; Security Policy
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-text-muted">
                <li>• Login ID: 6–12 alphanumeric characters (unique)</li>
                <li>• Password: Minimum 8 characters with upper, lower, digit &amp; symbol</li>
                <li>• Initial password must be securely communicated to the user</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
