"use client";

import { useState } from "react";
import { BookOpen, Edit3, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { AppModal, FormModalFooter, ModalError } from "@/components/app-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/skeleton-card";
import { SkeletonTable } from "@/components/skeleton-table";
import { toolbarSelectClass } from "@/components/page-toolbar";
import { fetchAccounts } from "@/features/master-data/master-data-api";
import type { Journal } from "@/lib/types";
import {
  createJournal,
  deleteJournal,
  fetchJournalsPage,
  reactivateJournal,
  updateJournal,
  type JournalInput,
} from "./journals-api";

const journalTypes: { value: Journal["type"]; label: string }[] = [
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
];

const emptyForm: JournalInput = {
  code: "",
  name: "",
  type: "sale",
  default_account_id: null,
};

const fieldClass =
  "mt-1 block h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm leading-normal text-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

export function JournalsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Journal | null>(null);
  const [deactivatingJournal, setDeactivatingJournal] = useState<Journal | null>(null);
  const [form, setForm] = useState<JournalInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const journalsQuery = useQuery({
    queryKey: ["journals", search, type, statusFilter],
    queryFn: () =>
      fetchJournalsPage({
        search,
        type,
        limit: 100,
        is_active: statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts", "journal-form"],
    queryFn: () => fetchAccounts({ is_active: true }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: JournalInput = {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        default_account_id: form.default_account_id ?? null,
      };
      return editing ? updateJournal(editing.id, payload) : createJournal(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["journals"] });
      setEditing(null);
      setIsModalOpen(false);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save journal."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJournal(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["journals"] });
      setDeactivatingJournal(null);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => reactivateJournal(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not reactivate journal."),
  });

  const journals = journalsQuery.data?.data ?? [];
  const accounts = accountsQuery.data ?? [];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(journal: Journal) {
    setEditing(journal);
    setForm({
      code: journal.code,
      name: journal.name,
      type: journal.type,
      default_account_id: journal.default_account_id ?? null,
    });
    setError(null);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Accounting setup</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">Journals</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage the journals used to post sales, purchases, bank, and cash activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/chart-of-accounts"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-text transition-colors hover:bg-muted"
          >
            View Chart of Accounts
          </a>
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New journal
          </Button>
        </div>
      </div>

      {journalsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} showHeader={false} lines={2} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Journals shown</p>
                <p className="text-xl font-bold text-text">{journals.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <p className="text-xs text-text-muted">With default account</p>
              <p className="mt-1 text-xl font-bold text-text">
                {journals.filter((journal) => journal.default_account_id).length}
              </p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <p className="text-xs text-text-muted">Active journals</p>
              <p className="mt-1 text-xl font-bold text-text">
                {journals.filter((journal) => journal.is_active).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search journals..."
                className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className={toolbarSelectClass}
                aria-label="Filter journals by type"
              >
                <option value="all">All journal types</option>
                {journalTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
                className={toolbarSelectClass}
                aria-label="Filter journals by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
          </div>
          {journalsQuery.isLoading ? (
            <div className="p-8">
              <SkeletonTable columns={6} rows={5} showSearch={false} showPagination={false} />
            </div>
          ) : journalsQuery.isError ? (
            <div className="p-8 text-center text-sm text-red-600">Unable to load journals. Please retry.</div>
          ) : journals.length === 0 ? (
            <div className="p-10 text-center text-sm text-text-muted">No journals found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Journal name</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Default account</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {journals.map((journal) => (
                    <tr
                      key={journal.id}
                      className="cursor-pointer hover:bg-surface-muted/40 focus-visible:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40"
                      onClick={() => openEdit(journal)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openEdit(journal);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-primary-600">{journal.code}</td>
                      <td className="px-5 py-3 font-medium text-text">{journal.name}</td>
                      <td className="px-5 py-3 capitalize text-text-muted">{journal.type}</td>
                      <td className="px-5 py-3 text-text-muted">{journal.default_account_name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge variant={journal.is_active ? "secondary" : "outline"}>
                          {journal.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                          <ActionTooltip label="Edit journal">
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEdit(journal)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                          {journal.is_active ? (
                            <ActionTooltip label="Deactivate journal">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeactivatingJournal(journal)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </ActionTooltip>
                          ) : (
                            <ActionTooltip label="Reactivate journal">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={reactivateMutation.isPending}
                                onClick={() => reactivateMutation.mutate(journal.id)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </ActionTooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        title={editing ? "Edit journal" : "New journal"}
        subtitle="Journals group related postings — sales, purchases, bank, and cash."
        titleId="journal-form-title"
        maxWidth="md"
        footer={
          <FormModalFooter
            formId="journal-form"
            onCancel={() => {
              setIsModalOpen(false);
              setEditing(null);
              setError(null);
            }}
            submitLabel={saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Create journal"}
            pending={saveMutation.isPending}
          />
        }
      >
        <form
          id="journal-form"
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
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                placeholder="SLS"
                className={fieldClass}
                required
              />
            </label>
            <label className="block text-sm text-text">
              Type
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Journal["type"] }))}
                className={fieldClass}
              >
                {journalTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm text-text">
            Journal name
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Sales Journal"
              className={fieldClass}
              required
            />
          </label>

          <label className="block text-sm text-text">
            Default account
            <select
              value={form.default_account_id ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  default_account_id: event.target.value ? Number(event.target.value) : null,
                }))
              }
              className={fieldClass}
            >
              <option value="">No default account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} — {account.name}
                </option>
              ))}
            </select>
          </label>

          {error && <ModalError>{error}</ModalError>}
        </form>
      </AppModal>

      <ConfirmDialog
        open={Boolean(deactivatingJournal)}
        title="Deactivate journal?"
        message={
          deactivatingJournal
            ? `"${deactivatingJournal.name}" (${deactivatingJournal.code}) will be hidden from new journal entries and payment posting. Existing entries already posted to this journal are kept for reporting. You can reactivate it later if needed.`
            : ""
        }
        confirmLabel={deleteMutation.isPending ? "Deactivating…" : "Deactivate"}
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deactivatingJournal && deleteMutation.mutate(deactivatingJournal.id)}
        onCancel={() => setDeactivatingJournal(null)}
      />
    </div>
  );
}
