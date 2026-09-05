"use client";

import Link from "next/link";
import { BarChart3, PieChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { fetchBudgetReport } from "./analytics-budget-api";

function Donut({ achieved, remaining }: { achieved: number; remaining: number }) {
  const total = Math.max(achieved + remaining, 1);
  const percent = Math.min(100, Math.max(0, (achieved / total) * 100));
  const circumference = 2 * Math.PI * 38;
  const dash = (percent / 100) * circumference;
  return <div className="relative h-28 w-28 shrink-0"><svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-label={`${percent.toFixed(0)} percent achieved`}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="12" className="text-surface-muted" /><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} className="text-primary-600" /></svg><span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text">{percent.toFixed(0)}%</span></div>;
}

export function BudgetReportPage() {
  const query = useQuery({ queryKey: ["budget-report"], queryFn: fetchBudgetReport });
  const rows = query.data ?? [];
  const committed = rows.reduce((sum, row) => sum + row.committed_amount, 0);
  const achieved = rows.reduce((sum, row) => sum + row.achieved_amount, 0);
  const remaining = Math.max(0, committed - achieved);

  return <div className="space-y-6 pb-12"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Reports / Planning</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">Budget Report</h1><p className="mt-1 max-w-2xl text-sm text-text-muted">Compare committed amounts with achieved income or expenses across confirmed budgets.</p></div><div className="grid gap-4 sm:grid-cols-3"><Card size="sm"><CardContent className="flex items-center gap-3"><div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40"><BarChart3 className="h-5 w-5" /></div><div><p className="text-xs text-text-muted">Committed</p><p className="text-xl font-bold text-text">{formatINR(committed)}</p></div></CardContent></Card><Card size="sm"><CardContent><p className="text-xs text-text-muted">Achieved</p><p className="mt-1 text-xl font-bold text-text">{formatINR(achieved)}</p></CardContent></Card><Card size="sm"><CardContent><p className="text-xs text-text-muted">Balance to achieve</p><p className="mt-1 text-xl font-bold text-text">{formatINR(remaining)}</p></CardContent></Card></div>{query.isLoading ? <div className="flex justify-center py-20"><LoadingSpinner label="Loading budget report…" /></div> : query.isError ? <Card><CardContent className="p-10 text-center"><p className="text-sm font-medium text-red-600">Unable to load the budget report.</p><p className="mt-1 text-xs text-text-muted">The budget report API is not available yet. The report view is ready for integration.</p></CardContent></Card> : rows.length === 0 ? <Card><CardContent className="p-10 text-center"><PieChart className="mx-auto h-8 w-8 text-text-muted" /><p className="mt-3 text-sm text-text-muted">No budget data is available.</p><Link href="/budgets" className="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:underline">Create a budget →</Link></CardContent></Card> : <Card><CardContent className="p-0"><div className="border-b border-border p-5"><h2 className="font-semibold text-text">Budget utilization</h2><p className="mt-1 text-xs text-text-muted">Click a budget to review its form and revision history.</p></div><div className="divide-y divide-border">{rows.map((row) => <Link key={row.id} href={`/budgets?budget=${row.id}`} className="flex flex-col gap-4 p-5 transition hover:bg-surface-muted/40 sm:flex-row sm:items-center"><Donut achieved={row.achieved_amount} remaining={row.balance} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-text">{row.name}</h3><Badge variant={row.status === "confirmed" ? "secondary" : "outline"}>{row.status}</Badge></div><p className="mt-1 text-xs text-text-muted">{row.analytic_account_name ?? `Analytic account #${row.analytic_account_id}`} · {row.start_date} → {row.end_date}</p><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><span><span className="text-text-muted">Committed: </span><strong>{formatINR(row.committed_amount)}</strong></span><span><span className="text-text-muted">Achieved: </span><strong>{formatINR(row.achieved_amount)}</strong></span><span><span className="text-text-muted">Remaining: </span><strong>{formatINR(row.balance)}</strong></span></div></div></Link>)}</div></CardContent></Card>}</div>;
}
