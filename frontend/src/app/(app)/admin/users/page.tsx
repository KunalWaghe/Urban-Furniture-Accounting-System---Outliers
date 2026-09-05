"use client";

import { useState } from "react";
import { Shield, UserPlus, Users } from "lucide-react";

import { RequireRole } from "@/components/require-role";
import { SignupForm } from "@/features/auth/components/signup-form";
import type { AuthUser } from "@/lib/types";

export default function AdminUsersPage() {
  const [recentUsers, setRecentUsers] = useState<AuthUser[]>([]);

  return (
    <RequireRole allowedRoles={["admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Admin Area
            </span>
            <span className="text-xs text-text-muted">· Role-Gated Endpoint</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-text sm:text-3xl">
            Create User &amp; Role Allocation
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Authorize internal accounts for Administrators and Accountants.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Create User Form - exactly the same as Signup form with role selector for admin and accountant */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 pb-2">
              <UserPlus className="h-5 w-5 text-primary-600" />
              <h2 className="text-base font-semibold text-text">Create Internal User</h2>
            </div>
            <SignupForm
              mode="admin-create"
              onSuccess={(user) => setRecentUsers((prev) => [user, ...prev])}
              cancelHref="/"
            />
          </div>

          {/* Sidebar Info & Recent Activity */}
          <div className="space-y-6 lg:col-span-5 lg:mt-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Shield className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-text">Role Privileges Matrix</h3>
              </div>
              <ul className="mt-4 space-y-3 text-xs text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">Admin:</span>
                  <span>Full access to all PO/SO, journals, reports, and user administration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Accountant:</span>
                  <span>Standard operator for invoices, bills, payments, and double-entry journals.</span>
                </li>
              </ul>
            </div>

            {recentUsers.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Users className="h-5 w-5 text-primary-600" />
                  <h3 className="text-sm font-semibold text-text">Recently Created Users</h3>
                </div>
                <div className="mt-3 divide-y divide-border">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="py-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text">{u.name}</span>
                        <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-text-muted">
                          {u.role}
                        </span>
                      </div>
                      <p className="text-text-muted">ID: {u.login_id} · {u.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
