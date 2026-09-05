"use client";

import { useMemo, useState } from "react";
import { Check, Edit3, Plus, RotateCcw, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchContacts } from "@/features/master-data/master-data-api";
import { formatINR } from "@/lib/format";
import {
  cancelBudget,
  confirmBudget,
  createBudget,
  fetchAnalyticAccounts,
  fetchBudgets,
  reviseBudget,
  type AnalyticAccount,
  type Budget,
  type BudgetInput,
} from "./analytics-budget-api";

const emptyForm: BudgetInput = { name: "", analytic_account_id: 0, start_date: "", end_date: "", committed_amount: 0, responsible_contact_id: null };

function statusVariant(status: Budget["status"]) {
  return status === "confirmed" ? "secondary" : status === "cancelled" ? "destructive" : "outline";
}

export function BudgetsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<BudgetInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const budgetsQuery = useQuery({ queryKey: ["budgets"], queryFn: fetchBudgets });
  const analyticsQuery = useQuery({ queryKey: ["analytic-accounts", "budget-picker"], queryFn: () => fetchAnalyticAccounts({ is_active: true }) });
  const contactsQuery = useQuery({ queryKey: ["contacts", "budget-picker"], queryFn: fetchContacts });
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["budgets"] });
  const createMutation = useMutation({ mutationFn: createBudget, onSuccess: () => { invalidate(); setIsFormOpen(false); setForm(emptyForm); setFormError(null); }, onError: (error) => setFormError(error instanceof Error ? error.message : "Unable to create budget.") });
  const confirmMutation = useMutation({ mutationFn: confirmBudget, onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: cancelBudget, onSuccess: invalidate });
  const reviseMutation = useMutation({ mutationFn: ({ id, input }: { id: number; input: BudgetInput }) => reviseBudget(id, input), onSuccess: invalidate });
  const budgets = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data]);
  const totals = useMemo(() => ({ committed: budgets.reduce((sum, budget) => sum + budget.committed_amount, 0), achieved: budgets.reduce((sum, budget) => sum + budget.achieved_amount, 0), confirmed: budgets.filter((budget) => budget.status === "confirmed").length }), [budgets]);

  function submit() {
    if (!form.name.trim() || !form.analytic_account_id || !form.start_date || !form.end_date || form.committed_amount <= 0) {
      setFormError("Name, analytic account, dates, and a positive committed amount are required.");
      return;
    }
    if (form.end_date < form.start_date) {
      setFormError("End date must be on or after the start date.");
      return;
    }
    createMutation.mutate(form);
  }

  function openRevision(budget: Budget) {
    const input: BudgetInput = { name: `${budget.name} Revised`, analytic_account_id: budget.analytic_account_id, start_date: budget.start_date, end_date: budget.end_date, committed_amount: budget.committed_amount, responsible_contact_id: budget.responsible_contact_id };
    reviseMutation.mutate({ id: budget.id, input });
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Account / Planning</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">Budgets</h1><p className="mt-1 max-w-2xl text-sm text-text-muted">Plan committed spend or income against analytic accounts and track achieved performance.</p></div><Button onClick={() => { setForm(emptyForm); setFormError(null); setIsFormOpen(true); }}><Plus className="h-4 w-4" /> New Budget</Button></div>
      <div className="grid gap-4 sm:grid-cols-3"><Card size="sm"><CardContent><p className="text-xs text-text-muted">Committed total</p><p className="mt-1 text-xl font-bold text-text">{formatINR(totals.committed)}</p></CardContent></Card><Card size="sm"><CardContent><p className="text-xs text-text-muted">Achieved total</p><p className="mt-1 text-xl font-bold text-text">{formatINR(totals.achieved)}</p></CardContent></Card><Card size="sm"><CardContent><p className="text-xs text-text-muted">Confirmed budgets</p><p className="mt-1 text-xl font-bold text-text">{totals.confirmed}</p></CardContent></Card></div>

      <Card><CardContent className="p-0">{budgetsQuery.isLoading ? <div className="flex justify-center py-16"><LoadingSpinner label="Loading budgets…" /></div> : budgetsQuery.isError ? <div className="p-10 text-center"><p className="text-sm font-medium text-red-600">Unable to load budgets.</p><p className="mt-1 text-xs text-text-muted">The budget API is not available yet. The page is ready for integration.</p></div> : budgets.length === 0 ? <div className="p-10 text-center"><p className="text-sm text-text-muted">No budgets have been created.</p><Button className="mt-4" variant="outline" onClick={() => setIsFormOpen(true)}>Create the first budget</Button></div> : <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted"><tr><th className="px-5 py-3">Budget</th><th className="px-5 py-3">Analytic</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">Committed</th><th className="px-5 py-3">Achieved</th><th className="px-5 py-3">Progress</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead><tbody className="divide-y divide-border">{budgets.map((budget) => <tr key={budget.id} className="hover:bg-surface-muted/40"><td className="px-5 py-3"><p className="font-medium text-text">{budget.name}</p><p className="text-xs text-text-muted">{budget.responsible_contact_name ?? "No responsible contact"}</p></td><td className="px-5 py-3 text-text-muted">{budget.analytic_account_name ?? `Account #${budget.analytic_account_id}`}</td><td className="px-5 py-3 text-xs text-text-muted">{budget.start_date} → {budget.end_date}</td><td className="px-5 py-3 font-mono text-text">{formatINR(budget.committed_amount)}</td><td className="px-5 py-3 font-mono text-text">{formatINR(budget.achieved_amount)}</td><td className="px-5 py-3"><div className="min-w-32"><div className="flex justify-between text-xs"><span className="text-text-muted">{budget.achieved_percent.toFixed(1)}%</span><span className="text-text-muted">{formatINR(budget.amount_to_achieve)} left</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-primary-600" style={{ width: `${Math.min(100, Math.max(0, budget.achieved_percent))}%` }} /></div></div></td><td className="px-5 py-3"><Badge variant={statusVariant(budget.status)}>{budget.status}</Badge></td><td className="px-5 py-3"><div className="flex items-center gap-1"><Button size="icon-sm" variant="ghost" aria-label="Confirm budget" disabled={budget.status !== "draft" || confirmMutation.isPending} onClick={() => confirmMutation.mutate(budget.id)}><Check className="h-4 w-4" /></Button><Button size="icon-sm" variant="ghost" aria-label="Revise budget" disabled={budget.status !== "confirmed" || reviseMutation.isPending} onClick={() => openRevision(budget)}><RotateCcw className="h-4 w-4" /></Button><Button size="icon-sm" variant="ghost" aria-label="Cancel budget" disabled={budget.status === "cancelled" || cancelMutation.isPending} onClick={() => cancelMutation.mutate(budget.id)}><X className="h-4 w-4" /></Button><Edit3 className="ml-1 h-4 w-4 text-text-muted" aria-hidden="true" /></div></td></tr>)}</tbody></table></div>}</CardContent></Card>

      {isFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-text">New Budget</h2><p className="mt-1 text-sm text-text-muted">Create a draft budget, then confirm it to begin tracking achieved amounts.</p></div><button type="button" className="text-text-muted hover:text-text" onClick={() => setIsFormOpen(false)} aria-label="Close">✕</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-text sm:col-span-2">Budget name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Furniture Project January" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text" /></label><label className="text-xs font-semibold text-text">Analytic account<select value={form.analytic_account_id || ""} onChange={(event) => setForm({ ...form, analytic_account_id: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"><option value="">Select analytic account</option>{(analyticsQuery.data ?? []).map((analytic: AnalyticAccount) => <option key={analytic.id} value={analytic.id}>{analytic.name} · {analytic.type}</option>)}</select></label><label className="text-xs font-semibold text-text">Responsible contact<select value={form.responsible_contact_id ?? ""} onChange={(event) => setForm({ ...form, responsible_contact_id: event.target.value ? Number(event.target.value) : null })} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text"><option value="">Select contact</option>{(contactsQuery.data ?? []).map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></label><label className="text-xs font-semibold text-text">Start date<input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text" /></label><label className="text-xs font-semibold text-text">End date<input type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text" /></label><label className="text-xs font-semibold text-text sm:col-span-2">Committed amount<input type="number" min="0" step="0.01" value={form.committed_amount || ""} onChange={(event) => setForm({ ...form, committed_amount: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text" /></label></div>{formError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{formError}</p>}<div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button onClick={submit} disabled={createMutation.isPending}>{createMutation.isPending ? "Saving…" : "Save Draft"}</Button></div></div></div>}
    </div>
  );
}
