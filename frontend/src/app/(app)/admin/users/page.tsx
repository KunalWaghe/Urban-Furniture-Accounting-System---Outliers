"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search, Shield, Users } from "lucide-react";

import { RequireRole } from "@/components/require-role";
import { TablePagination } from "@/components/ui/table-pagination";
import { SignupForm } from "@/features/auth/components/signup-form";
import { useUsers } from "@/features/users/queries";

const PAGE_SIZE = 8;

export default function AdminUsersPage() {
  const { data: users = [], isLoading: loading, refetch: refetchUsers } = useUsers();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.login_id, u.email, u.role].some((val) =>
        val?.toLowerCase().includes(q)
      )
    );
  }, [users, search]);

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
          {/* Create User Form (Top on mobile, Right column on desktop) */}
          <div className="order-1 lg:order-2 lg:col-span-5">
            <SignupForm mode="admin-create" cancelHref="/" />
          </div>

          {/* System Users List & Role Privileges Matrix (Bottom on mobile, Left column on desktop) */}
          <div className="order-2 lg:order-1 space-y-6 lg:col-span-7">
            <div className="rounded-2xl border border-border bg-surface shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-600" />
                  <h3 className="text-sm font-semibold text-text">
                    System Users ({filteredUsers.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-52">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search users..."
                      className="w-full rounded-lg border border-border bg-surface-muted/60 py-1.5 pl-8 pr-3 text-xs text-text outline-none focus:border-primary-500 focus:bg-surface focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      void refetchUsers();
                    }}
                    disabled={loading}
                    className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-50"
                    title="Refresh users"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {loading && users.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">Loading users…</div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">
                  No users found matching &ldquo;{search}&rdquo;.
                </div>
              ) : (() => {
                const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
                const safePage = Math.min(page, totalPages);
                const start = (safePage - 1) * PAGE_SIZE;
                const pageUsers = filteredUsers.slice(start, start + PAGE_SIZE);
                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          <tr>
                            <th className="px-4 py-2.5">Name</th>
                            <th className="px-4 py-2.5">Login ID · Email</th>
                            <th className="px-4 py-2.5 text-right">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {pageUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-surface-muted/50">
                              <td className="px-4 py-3 font-medium text-text">{u.name}</td>
                              <td className="px-4 py-3 text-text-muted">
                                {u.login_id ? `@${u.login_id}` : "No ID"} · {u.email}
                              </td>
                              <td className="px-4 py-3 text-right">
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="border-t border-border px-4">
                        <div className="flex items-center justify-between py-1">
                          <p className="text-xs text-text-muted">
                            {start + 1}–{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of{" "}
                            {filteredUsers.length}
                          </p>
                          <TablePagination
                            page={safePage}
                            totalPages={totalPages}
                            onPageChange={setPage}
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

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
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
