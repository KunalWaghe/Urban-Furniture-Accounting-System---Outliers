/**
 * Chart of Accounts Page
 *
 * Master-data screen for managing ledger accounts grouped by type
 * (Assets, Liabilities, Income, Expenses, Capital).
 *
 * Data flow:
 * 1. React Query (`accountsQuery`) calls `fetchAccounts` from master-data-api
 * 2. Server returns accounts sorted by code
 * 3. Client-side `search` filters the list before grouping (no extra API call)
 * 4. Create/edit uses local `form` state → `saveMutation` calls create/update API
 * 5. Deactivate uses `deleteMutation` → soft-deactivates account on server
 *
 * State ownership:
 * - Server data: React Query cache (key: "chart-of-accounts")
 * - Search/status filters: local useState (filtered with useMemo)
 * - Modal form: local useState (`form`, `editing`, `isModalOpen`)
 */

"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Landmark,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { AppModal, FormModalFooter, ModalError } from "@/components/app-modal";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import type { Account } from "@/lib/types";
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  reactivateAccount,
  updateAccount,
  type AccountInput,
} from "./master-data-api";

const fieldClass =
  "mt-1 block h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm leading-normal text-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";
const textareaClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

/** Display config for each account type section in the ledger hierarchy. */
const groups: {
  type: Account["type"];
  label: string;
  description: string;
  icon: typeof Landmark;
  tone: string;
}[] = [
  { type: "asset", label: "Assets", description: "What the business owns", icon: Landmark, tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  { type: "liability", label: "Liabilities", description: "What the business owes", icon: ShieldCheck, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
  { type: "capital", label: "Capital", description: "Owner equity and retained value", icon: WalletCards, tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
  { type: "income", label: "Income", description: "Revenue and operating income", icon: TrendingUp, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  { type: "expense", label: "Expenses", description: "Costs of running the business", icon: Banknote, tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
];

const accountTypeOptions: { value: Account["type"]; label: string }[] = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "capital", label: "Capital" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "other_expense", label: "Other Expense" },
];

const emptyForm: AccountInput = {
  code: "",
  name: "",
  type: "expense",
  description: "",
};

function typeLabel(type: Account["type"]): string {
  return accountTypeOptions.find((option) => option.value === type)?.label ?? type;
}

/**
 * Chart of Accounts page.
 *
 * Fetches ledger accounts and displays them in grouped sections.
 * Supports create, edit, deactivate/reactivate, search, and status filter.
 */
export function ChartOfAccountsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deactivatingAccount, setDeactivatingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["chart-of-accounts", statusFilter],
    queryFn: () =>
      fetchAccounts({
        is_active: statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: AccountInput = {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        description: form.description?.trim() || undefined,
      };
      return editing ? updateAccount(editing.id, payload) : createAccount(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      setEditing(null);
      setIsModalOpen(false);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save account."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAccount(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      setDeactivatingAccount(null);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => reactivateAccount(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not reactivate account."),
  });

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const activeCount = accounts.filter((account) => account.is_active).length;

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter(
      (account) =>
        !q ||
        account.code.toLowerCase().includes(q) ||
        account.name.toLowerCase().includes(q) ||
        account.type.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      description: account.description ?? "",
    });
    setError(null);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Account / Structure</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">Chart of Accounts</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Manage the ledger accounts that power journal entries, transactions, and financial reports.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New account
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Accounts shown</p>
              <p className="text-xl font-bold text-text">{accounts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-text-muted">Active accounts</p>
            <p className="mt-1 text-xl font-bold text-text">{activeCount}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-text-muted">Account groups</p>
            <p className="mt-1 text-xl font-bold text-text">
              {groups.filter((group) => filteredAccounts.some((account) => account.type === group.type || (group.type === "expense" && account.type === "other_expense"))).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-text">Ledger hierarchy</h2>
              <p className="mt-1 text-xs text-text-muted">Accounts are grouped by their financial statement classification.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search code or account..."
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
                className="rounded-lg border border-border bg-surface py-2 px-3 text-xs text-text outline-none focus:border-primary-500"
                aria-label="Filter accounts by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
          </div>

          {accountsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : accountsQuery.isError ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-red-600">Unable to load chart of accounts.</p>
              <p className="mt-1 text-xs text-text-muted">Check your access and API connection, then try again.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => {
                const groupAccounts = filteredAccounts.filter(
                  (account) => account.type === group.type || (group.type === "expense" && account.type === "other_expense")
                );
                if (groupAccounts.length === 0) return null;
                const Icon = group.icon;
                return (
                  <section key={group.type} className="overflow-hidden rounded-xl border border-border">
                    <div className="flex items-center gap-3 border-b border-border bg-surface-muted/60 px-4 py-3">
                      <div className={`rounded-lg p-2 ${group.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-text">{group.label}</h3>
                        <p className="text-xs text-text-muted">{group.description}</p>
                      </div>
                      <Badge variant="secondary">{groupAccounts.length} accounts</Badge>
                    </div>
                    <div className="divide-y divide-border">
                      {groupAccounts.map((account) => (
                        <div
                          key={account.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openEdit(account)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openEdit(account);
                            }
                          }}
                          className="flex cursor-pointer items-center gap-3 px-4 py-3 pl-8 transition hover:bg-surface-muted/40 focus-visible:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40"
                        >
                          <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-text-muted" />
                          <span className="w-14 font-mono text-xs font-semibold text-primary-600">{account.code}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-text">{account.name}</p>
                            {account.description && (
                              <p className="mt-0.5 truncate text-xs text-text-muted">{account.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="hidden sm:inline-flex">
                            {typeLabel(account.type)}
                          </Badge>
                          <span className={`text-xs ${account.is_active ? "text-emerald-600" : "text-text-muted"}`}>
                            {account.is_active ? "Active" : "Inactive"}
                          </span>
                          <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                            <ActionTooltip label="Edit account">
                              <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEdit(account)}>
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </ActionTooltip>
                            {account.is_active ? (
                              <ActionTooltip label="Deactivate account">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setDeactivatingAccount(account)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </ActionTooltip>
                            ) : (
                              <ActionTooltip label="Reactivate account">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={reactivateMutation.isPending}
                                  onClick={() => reactivateMutation.mutate(account.id)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </ActionTooltip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
              {filteredAccounts.length === 0 && (
                <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
                  No accounts match your search.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AppModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
          setError(null);
        }}
        title={editing ? "Edit account" : "New account"}
        subtitle="Account type controls where this account appears on Balance Sheet or Profit & Loss reports."
        titleId="account-form-title"
        maxWidth="md"
        footer={
          <FormModalFooter
            formId="account-form"
            onCancel={() => {
              setIsModalOpen(false);
              setEditing(null);
              setError(null);
            }}
            submitLabel={saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Create account"}
            pending={saveMutation.isPending}
          />
        }
      >
        <form
          id="account-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.code.trim() || !form.name.trim()) {
              setError("Code and name are required.");
              return;
            }
            saveMutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text">
              Code
              <input
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="5020"
                className={fieldClass}
                required
              />
            </label>
            <label className="block text-sm text-text">
              Type
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Account["type"] }))}
                className={fieldClass}
              >
                {accountTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm text-text">
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Rent Expense"
              className={fieldClass}
              required
            />
          </label>

          <label className="block text-sm text-text">
            Description
            <textarea
              value={form.description ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Optional notes about this account"
              rows={3}
              className={textareaClass}
            />
          </label>

          {error && <ModalError>{error}</ModalError>}
        </form>
      </AppModal>

      <ConfirmDialog
        open={Boolean(deactivatingAccount)}
        title="Deactivate account?"
        message={
          deactivatingAccount
            ? `"${deactivatingAccount.name}" (${deactivatingAccount.code}) will be hidden from new postings but kept for historical journal entries.`
            : ""
        }
        confirmLabel="Deactivate"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deactivatingAccount && deleteMutation.mutate(deactivatingAccount.id)}
        onCancel={() => setDeactivatingAccount(null)}
      />
    </div>
  );
}
