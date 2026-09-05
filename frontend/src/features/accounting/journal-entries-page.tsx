"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppModal, ModalError } from "@/components/app-modal";
import { DetailField, DetailFieldGrid, DetailSection, RecordDetailModal } from "@/components/record-detail-modal";
import { fetchAccountsPage, fetchContacts } from "@/features/master-data/master-data-api";
import { formatINR, todayDate } from "@/lib/format";
import type { Account } from "@/lib/types";
import {
  createJournalEntry,
  fetchJournalEntriesPage,
  fetchJournalEntry,
  type JournalEntryItemInput,
} from "./journal-entries-api";
import { fetchJournals } from "./journals-api";

interface EntryLine extends JournalEntryItemInput {
  key: string;
}

const newLine = (): EntryLine => ({
  key: crypto.randomUUID(),
  account_id: 0,
  partner_id: null,
  debit: 0,
  credit: 0,
  description: "",
});

function amount(value: number | null | undefined) {
  return Number(value ?? 0);
}

export function JournalEntriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingEntryId, setViewingEntryId] = useState<number | null>(null);
  const [journalCode, setJournalCode] = useState("PUR");
  const [reference, setReference] = useState("");
  const [entryDate, setEntryDate] = useState(todayDate);
  const [lines, setLines] = useState<EntryLine[]>([newLine(), newLine()]);
  const [formError, setFormError] = useState<string | null>(null);

  const entriesQuery = useQuery({
    queryKey: ["journal-entries", search],
    queryFn: () => fetchJournalEntriesPage({ search, limit: 100 }),
  });
  const entryDetailQuery = useQuery({
    queryKey: ["journal-entry", viewingEntryId],
    queryFn: () => fetchJournalEntry(viewingEntryId!),
    enabled: viewingEntryId != null,
  });
  const journalsQuery = useQuery({ queryKey: ["journals", "picker"], queryFn: fetchJournals });
  const accountsQuery = useQuery({
    queryKey: ["accounts", "journal-entry-picker"],
    queryFn: () => fetchAccountsPage({ limit: 100, is_active: true }),
  });
  const contactsQuery = useQuery({
    queryKey: ["contacts", "journal-entry-picker"],
    queryFn: () => fetchContacts(),
  });

  const entries = entriesQuery.data?.data ?? [];
  const accounts = accountsQuery.data?.data ?? [];
  const contacts = contactsQuery.data ?? [];
  const totalDebit = useMemo(() => lines.reduce((sum, line) => sum + amount(line.debit), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((sum, line) => sum + amount(line.credit), 0), [lines]);
  const balanced = Math.round(totalDebit * 100) === Math.round(totalCredit * 100) && totalDebit > 0;

  const createMutation = useMutation({
    mutationFn: () =>
      createJournalEntry({
        journal_code: journalCode,
        reference: reference || undefined,
        date: `${entryDate}T00:00:00`,
        items: lines.map((line) => ({
          account_id: line.account_id,
          partner_id: line.partner_id,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
          analytic_account_id: line.analytic_account_id,
        })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      setIsCreateOpen(false);
      setFormError(null);
      setLines([newLine(), newLine()]);
      setReference("");
    },
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : "Unable to create journal entry."),
  });

  function updateLine(key: string, patch: Partial<EntryLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function validate() {
    if (!journalCode) return "Select a journal.";
    if (lines.some((line) => !line.account_id)) return "Select an account for every line.";
    if (lines.some((line) => amount(line.debit) === 0 && amount(line.credit) === 0)) {
      return "Every line needs a debit or credit amount.";
    }
    if (!balanced) return "Total debits must equal total credits.";
    return null;
  }

  function submit() {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    createMutation.mutate();
  }

  const viewingEntry = entryDetailQuery.data;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">General ledger</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">Journal Entries</h1>
          <p className="mt-1 text-sm text-text-muted">
            Review balanced postings and create manual accounting entries.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New Journal Entry
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-5">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search entry number or reference..."
                className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          {entriesQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : entriesQuery.isError ? (
            <div className="p-8 text-center text-sm text-red-600">
              Unable to load journal entries. Please retry.
            </div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-sm text-text-muted">No journal entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Entry</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Journal</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="cursor-pointer hover:bg-surface-muted/40 focus-visible:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40"
                      onClick={() => setViewingEntryId(entry.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setViewingEntryId(entry.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-primary-600">
                        {entry.entry_number}
                      </td>
                      <td className="px-5 py-3 text-text-muted">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-text">
                        {entry.journal_name ?? entry.journal_code ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-text-muted">{entry.reference ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-text">
                        {formatINR(entry.total_amount ?? 0)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={entry.is_posted ? "secondary" : "outline"}>
                          {entry.is_posted ? "Posted" : "Draft"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {viewingEntryId != null && (
        <RecordDetailModal
          open
          onClose={() => setViewingEntryId(null)}
          title={viewingEntry?.entry_number ?? "Journal Entry"}
          subtitle="Read-only entry details"
          titleId="journal-entry-detail-title"
          badge={
            viewingEntry ? (
              <Badge variant={viewingEntry.is_posted ? "secondary" : "outline"}>
                {viewingEntry.is_posted ? "Posted" : "Draft"}
              </Badge>
            ) : undefined
          }
          maxWidth="xl"
        >
          {entryDetailQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner label="Loading entry…" />
            </div>
          ) : entryDetailQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load journal entry details.</p>
          ) : viewingEntry ? (
            <>
              <DetailSection title="Entry summary">
                <DetailFieldGrid>
                  <DetailField
                    label="Date"
                    value={new Date(viewingEntry.date).toLocaleDateString()}
                  />
                  <DetailField
                    label="Journal"
                    value={viewingEntry.journal_name ?? viewingEntry.journal_code ?? "—"}
                  />
                  <DetailField label="Reference" value={viewingEntry.reference ?? "—"} />
                  <DetailField
                    label="Total"
                    value={formatINR(viewingEntry.total_amount ?? 0)}
                    mono
                  />
                </DetailFieldGrid>
              </DetailSection>

              <Separator />

              <DetailSection title="Line items">
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                      <tr>
                        <th className="px-4 py-3">Account</th>
                        <th className="px-4 py-3">Debit</th>
                        <th className="px-4 py-3">Credit</th>
                        <th className="px-4 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(viewingEntry.items ?? []).map((item, index) => (
                        <tr key={`${item.account_id}-${index}`} className="hover:bg-surface-muted/30">
                          <td className="px-4 py-3 text-text">
                            {item.account_code ? `${item.account_code} · ` : ""}
                            {item.account_name ?? `Account #${item.account_id}`}
                          </td>
                          <td className="px-4 py-3 font-mono text-text">
                            {item.debit ? formatINR(item.debit) : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-text">
                            {item.credit ? formatINR(item.credit) : "—"}
                          </td>
                          <td className="px-4 py-3 text-text-muted">{item.description ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DetailSection>
            </>
          ) : null}
        </RecordDetailModal>
      )}

      <AppModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Journal Entry"
        subtitle="Debits and credits must balance before posting."
        maxWidth="2xl"
        bodyClassName="space-y-5"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setLines((current) => [...current, newLine()])}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
            <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
              <div className="text-right text-sm">
                <div>
                  Debit: <strong>{formatINR(totalDebit)}</strong>
                </div>
                <div>
                  Credit: <strong>{formatINR(totalCredit)}</strong>
                </div>
                <div className={balanced ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                  {balanced ? "Balanced" : `Difference: ${formatINR(Math.abs(totalDebit - totalCredit))}`}
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={submit} disabled={createMutation.isPending || !balanced}>
                  {createMutation.isPending ? "Posting…" : "Post Entry"}
                </Button>
              </div>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-xs font-semibold text-text">
                Journal
                <select
                  value={journalCode}
                  onChange={(event) => setJournalCode(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
                >
                  {(journalsQuery.data ?? []).map((journal) => (
                    <option key={journal.id} value={journal.code}>
                      {journal.name} ({journal.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-text">
                Accounting date
                <input
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
                />
              </label>
              <label className="text-xs font-semibold text-text">
                Reference
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="e.g. Manual adjustment"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"
                />
              </label>
            </div>
            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-3 py-3">Account</th>
                    <th className="px-3 py-3">Partner</th>
                    <th className="px-3 py-3">Debit</th>
                    <th className="px-3 py-3">Credit</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((line) => (
                    <tr key={line.key}>
                      <td className="px-3 py-2">
                        <select
                          value={line.account_id || ""}
                          onChange={(event) =>
                            updateLine(line.key, { account_id: Number(event.target.value) })
                          }
                          className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm"
                        >
                          <option value="">Select account</option>
                          {accounts.map((account: Account) => (
                            <option key={account.id} value={account.id}>
                              {account.code} · {account.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={line.partner_id ?? ""}
                          onChange={(event) =>
                            updateLine(line.key, {
                              partner_id: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                          className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm"
                        >
                          <option value="">No partner</option>
                          {contacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit || ""}
                          onChange={(event) =>
                            updateLine(line.key, { debit: Number(event.target.value), credit: 0 })
                          }
                          className="w-28 rounded-lg border border-border bg-surface px-2 py-2 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit || ""}
                          onChange={(event) =>
                            updateLine(line.key, { credit: Number(event.target.value), debit: 0 })
                          }
                          className="w-28 rounded-lg border border-border bg-surface px-2 py-2 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={line.description ?? ""}
                          onChange={(event) =>
                            updateLine(line.key, { description: event.target.value })
                          }
                          className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <ActionTooltip label="Remove line">
                          <button
                            type="button"
                            onClick={() =>
                              setLines((current) =>
                                current.length > 2
                                  ? current.filter((item) => item.key !== line.key)
                                  : current
                              )
                            }
                            disabled={lines.length <= 2}
                            className="rounded-lg p-2 text-text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ActionTooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        {formError && <ModalError>{formError}</ModalError>}
      </AppModal>
    </div>
  );
}
