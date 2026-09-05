/**
 * Next.js App Router — Admin Users Page
 *
 * Route: `/admin/users`
 *
 * Admin-only screen for listing system users and creating new accounts.
 * Auth: `(app)/layout.tsx` requires login; this page adds a role guard for admins only.
 */
"use client";

import { useMemo, useState } from "react";
import { Edit3, RefreshCw, Search, Shield, Trash2, Users } from "lucide-react";

import { AppModal, FormModalFooter, ModalError } from "@/components/app-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RequireRole } from "@/components/require-role";
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  RecordDetailModal,
} from "@/components/record-detail-modal";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { ActionTooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/auth-context";
import { SignupForm } from "@/features/auth/components/signup-form";
import { useDeactivateUser, useUpdateUser, useUsers } from "@/features/users/queries";
import type { AuthUser, UserRole } from "@/lib/types";
import { ApiError } from "@/lib/api";

const PAGE_SIZE = 8;

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

function roleLabel(role: UserRole): string {
  if (role === "invoicing_user") return "Accountant";
  if (role === "contact") return "Portal User";
  return role;
}

function roleBadgeClass(role: UserRole): string {
  if (role === "admin") {
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
  }
  if (role === "invoicing_user") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  }
  return "bg-surface-muted text-text-muted";
}

interface UserFormState {
  name: string;
  login_id: string;
  email: string;
  role: UserRole;
  password: string;
  is_active: boolean;
}

function toFormState(user: AuthUser): UserFormState {
  return {
    name: user.name,
    login_id: user.login_id ?? "",
    email: user.email,
    role: user.role,
    password: "",
    is_active: user.is_active !== false,
  };
}

const EDITABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "invoicing_user", label: "Accountant" },
  { value: "contact", label: "Portal User" },
];

/**
 * Admin user management page — user list, search, pagination, and create-user form.
 */
export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading: loading, refetch: refetchUsers } = useUsers();
  const updateUserMutation = useUpdateUser();
  const deactivateUserMutation = useDeactivateUser();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewingUser, setViewingUser] = useState<AuthUser | null>(null);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<UserFormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.login_id, u.email, u.role].some((val) =>
        val?.toLowerCase().includes(q)
      )
    );
  }, [users, search]);

  function openEdit(user: AuthUser) {
    setViewingUser(null);
    setEditingUser(user);
    setForm(toFormState(user));
    setError(null);
  }

  function closeEdit() {
    setEditingUser(null);
    setForm(null);
    setError(null);
  }

  async function handleSave() {
    if (!editingUser || !form) return;
    setError(null);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      login_id: form.login_id.trim(),
      email: form.email.trim(),
      role: form.role,
      is_active: form.is_active,
    };
    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        payload,
      });
      closeEdit();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update user.");
    }
  }

  async function handleDeactivate() {
    if (!deactivatingUser) return;
    try {
      await deactivateUserMutation.mutateAsync(deactivatingUser.id);
      setDeactivatingUser(null);
      if (viewingUser?.id === deactivatingUser.id) setViewingUser(null);
    } catch {
      // Error surfaced via mutation state if needed
    }
  }

  async function handleReactivate(user: AuthUser) {
    try {
      await updateUserMutation.mutateAsync({
        userId: user.id,
        payload: { is_active: true },
      });
      if (viewingUser?.id === user.id) {
        setViewingUser({ ...user, is_active: true });
      }
    } catch {
      // noop
    }
  }

  const isSaving = updateUserMutation.isPending;
  const isDeactivating = deactivateUserMutation.isPending;

  return (
    <RequireRole allowedRoles={["admin"]}>
      <div className="space-y-8">
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
          <div className="order-1 lg:order-2 lg:col-span-5">
            <SignupForm mode="admin-create" cancelHref="/" />
          </div>

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
                  <ActionTooltip label="Refresh users">
                    <button
                      type="button"
                      onClick={() => {
                        setPage(1);
                        void refetchUsers();
                      }}
                      disabled={loading}
                      className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                  </ActionTooltip>
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
                            <th className="px-4 py-2.5">Role</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {pageUsers.map((u) => (
                            <tr
                              key={u.id}
                              className={`hover:bg-surface-muted/50 ${u.is_active === false ? "opacity-60" : ""}`}
                            >
                              <td
                                className="cursor-pointer px-4 py-3 font-medium text-text"
                                onClick={() => setViewingUser(u)}
                              >
                                <span className="flex items-center gap-2">
                                  {u.name}
                                  {u.is_active === false && (
                                    <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-destructive">
                                      Inactive
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td
                                className="cursor-pointer px-4 py-3 text-text-muted"
                                onClick={() => setViewingUser(u)}
                              >
                                {u.login_id ? `@${u.login_id}` : "No ID"} · {u.email}
                              </td>
                              <td
                                className="cursor-pointer px-4 py-3"
                                onClick={() => setViewingUser(u)}
                              >
                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${roleBadgeClass(u.role)}`}
                                >
                                  {roleLabel(u.role)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <ActionTooltip label="Edit user">
                                    <button
                                      type="button"
                                      onClick={() => openEdit(u)}
                                      className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-primary-600"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                  </ActionTooltip>
                                  {u.is_active !== false ? (
                                    <ActionTooltip
                                      label={
                                        u.id === currentUser?.id
                                          ? "Cannot deactivate your own account"
                                          : "Deactivate user"
                                      }
                                    >
                                      <button
                                        type="button"
                                        onClick={() => setDeactivatingUser(u)}
                                        disabled={u.id === currentUser?.id}
                                        className="rounded-lg p-1.5 text-text-muted hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </ActionTooltip>
                                  ) : (
                                    <ActionTooltip label="Reactivate user">
                                      <button
                                        type="button"
                                        onClick={() => void handleReactivate(u)}
                                        disabled={updateUserMutation.isPending}
                                        className="rounded-lg px-2 py-1 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-950/30"
                                      >
                                        Restore
                                      </button>
                                    </ActionTooltip>
                                  )}
                                </div>
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

        {viewingUser && (
          <RecordDetailModal
            open
            onClose={() => setViewingUser(null)}
            title={viewingUser.name}
            subtitle="User account details"
            titleId="user-detail-title"
            badge={
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${roleBadgeClass(viewingUser.role)}`}
              >
                {roleLabel(viewingUser.role)}
              </span>
            }
            maxWidth="sm"
          >
            <DetailSection title="Account">
              <DetailFieldGrid columns={1}>
                <DetailField
                  label="Status"
                  value={
                    viewingUser.is_active === false ? (
                      <span className="text-destructive">Inactive</span>
                    ) : (
                      <span className="text-emerald-600">Active</span>
                    )
                  }
                />
                <DetailField
                  label="Login ID"
                  value={viewingUser.login_id ? `@${viewingUser.login_id}` : "—"}
                  mono
                />
                <DetailField label="Email" value={viewingUser.email} />
                {viewingUser.contact_id != null && (
                  <DetailField label="Linked contact" value={`Contact #${viewingUser.contact_id}`} />
                )}
              </DetailFieldGrid>
            </DetailSection>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(viewingUser)}>
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
              {viewingUser.is_active !== false && viewingUser.id !== currentUser?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setDeactivatingUser(viewingUser);
                    setViewingUser(null);
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Deactivate
                </Button>
              )}
            </div>
          </RecordDetailModal>
        )}

        {editingUser && form && (
          <AppModal
            open
            onClose={closeEdit}
            title="Edit User"
            subtitle={`Update account for ${editingUser.name}`}
            titleId="edit-user-title"
            maxWidth="md"
            disableClose={isSaving}
            footer={
              <FormModalFooter
                onCancel={closeEdit}
                submitLabel={isSaving ? "Saving…" : "Save changes"}
                pending={isSaving}
                formId="edit-user-form"
              />
            }
          >
            {error && <ModalError>{error}</ModalError>}
            <form
              id="edit-user-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSave();
              }}
            >
              <div>
                <label htmlFor="edit-name" className="text-xs font-medium text-text">
                  Full name
                </label>
                <input
                  id="edit-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-login-id" className="text-xs font-medium text-text">
                  Login ID
                </label>
                <input
                  id="edit-login-id"
                  value={form.login_id}
                  onChange={(e) => setForm({ ...form, login_id: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="text-xs font-medium text-text">
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text">Assigned Role</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {EDITABLE_ROLES.map((r) => {
                    const isSelected = form.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm({ ...form, role: r.value })}
                        disabled={
                          editingUser.id === currentUser?.id && r.value !== "admin"
                        }
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary-600 bg-primary-50 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                            : "border-border bg-surface text-text-muted hover:border-border/80 hover:bg-surface-muted"
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="edit-password" className="text-xs font-medium text-text">
                  New password <span className="text-text-muted">(leave blank to keep current)</span>
                </label>
                <input
                  id="edit-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  disabled={editingUser.id === currentUser?.id}
                  className="h-4 w-4 rounded border-border accent-primary-600"
                />
                <label htmlFor="edit-active" className="text-xs text-text-muted">
                  Account is active
                  {editingUser.id === currentUser?.id && " (cannot deactivate yourself)"}
                </label>
              </div>
            </form>
          </AppModal>
        )}

        <ConfirmDialog
          open={deactivatingUser !== null}
          title="Deactivate user?"
          message={
            deactivatingUser
              ? `This will deactivate ${deactivatingUser.name}'s account. They will no longer be able to sign in.`
              : ""
          }
          confirmLabel="Deactivate"
          onConfirm={() => void handleDeactivate()}
          onCancel={() => setDeactivatingUser(null)}
          destructive
          pending={isDeactivating}
        />
      </div>
    </RequireRole>
  );
}
