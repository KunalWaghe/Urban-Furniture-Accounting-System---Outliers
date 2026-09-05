"use client";

import { useEffect, useState } from "react";
import { Shield, UserPlus, Users, RefreshCw } from "lucide-react";

import { RequireRole } from "@/components/require-role";
import { SignupForm } from "@/features/auth/components/signup-form";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiFetch<AuthUser[]>("/api/v1/users", { auth: true });
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    async function fetchUsers() {
      try {
        const data = await apiFetch<AuthUser[]>("/api/v1/users", { auth: true });
        if (!ignore) setUsers(data);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchUsers();
    return () => {
      ignore = true;
    };
  }, []);

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
              onSuccess={(user) => setUsers((prev) => [user, ...prev])}
              cancelHref="/"
            />
          </div>

          {/* Sidebar Info & System Users List */}
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

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-600" />
                  <h3 className="text-sm font-semibold text-text">System Users ({users.length})</h3>
                </div>
                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={loading}
                  className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-50"
                  title="Refresh users"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {loading && users.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">Loading users…</div>
              ) : users.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">No users found.</div>
              ) : (
                <div className="mt-3 max-h-[380px] divide-y divide-border overflow-y-auto pr-1">
                  {users.map((u) => (
                    <div key={u.id} className="py-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text">{u.name}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : u.role === "invoicing_user"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-surface-muted text-text-muted"
                          }`}
                        >
                          {u.role === "invoicing_user" ? "Accountant" : u.role}
                        </span>
                      </div>
                      <p className="mt-0.5 text-text-muted">
                        {u.login_id ? `@${u.login_id}` : "No ID"} · {u.email}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
