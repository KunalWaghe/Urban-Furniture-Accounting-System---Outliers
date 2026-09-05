/**
 * Chart of Accounts Page
 *
 * Read-only view of the ledger account hierarchy grouped by type
 * (Assets, Liabilities, Income, Expenses, Capital).
 *
 * Data flow:
 * 1. React Query (`accountsQuery`) calls `fetchAccounts` from master-data-api
 * 2. Server returns active accounts sorted by code
 * 3. Client-side `search` filters the list before grouping (no extra API call)
 *
 * State ownership:
 * - Server data: React Query cache (key: "chart-of-accounts")
 * - Search filter: local useState (filtered with useMemo)
 *
 * This page has no forms or mutations — accounts are managed elsewhere.
 */

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ChevronDown, CircleDollarSign, Landmark, Search, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Account } from "@/lib/types";
import { fetchAccounts } from "./master-data-api";

/** Display config for each account type section in the ledger hierarchy. */
const groups: { type: Account["type"]; label: string; description: string; icon: typeof Landmark; tone: string }[] = [
  { type: "asset", label: "Assets", description: "What the business owns", icon: Landmark, tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  { type: "liability", label: "Liabilities", description: "What the business owes", icon: ShieldCheck, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
  { type: "income", label: "Income", description: "Revenue and operating income", icon: TrendingUp, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  { type: "expense", label: "Expenses", description: "Costs of running the business", icon: Banknote, tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
  { type: "capital", label: "Capital", description: "Owner equity and retained value", icon: WalletCards, tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
];

/**
 * Chart of Accounts page.
 *
 * Fetches all active ledger accounts and displays them in grouped sections.
 * Supports client-side search by code, name, or type.
 */
export function ChartOfAccountsPage() {
  // Single fetch — no pagination; accounts are filtered locally
  const accountsQuery = useQuery({ queryKey: ["chart-of-accounts"], queryFn: fetchAccounts });
  const [search, setSearch] = useState("");
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  // Client-side search — runs on already-fetched data, no new API call
  const filteredAccounts = useMemo(() => { const q = search.trim().toLowerCase(); return accounts.filter((account) => !q || account.code.toLowerCase().includes(q) || account.name.toLowerCase().includes(q) || account.type.toLowerCase().includes(q)); }, [accounts, search]);

  return <div className="space-y-6 pb-12"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Account / Structure</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-text">Chart of Accounts</h1><p className="mt-1 max-w-2xl text-sm text-text-muted">A clear view of the ledger structure powering your financial reports and journal entries.</p></div><div className="grid gap-4 sm:grid-cols-3"><Card size="sm"><CardContent className="flex items-center gap-3"><div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40"><CircleDollarSign className="h-5 w-5" /></div><div><p className="text-xs text-text-muted">Active accounts</p><p className="text-xl font-bold text-text">{accounts.length}</p></div></CardContent></Card><Card size="sm"><CardContent><p className="text-xs text-text-muted">Account groups</p><p className="mt-1 text-xl font-bold text-text">{groups.filter((group) => accounts.some((account) => account.type === group.type)).length}</p></CardContent></Card><Card size="sm"><CardContent><p className="text-xs text-text-muted">Ledger status</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ready for posting</p></CardContent></Card></div><Card><CardContent className="p-5"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-text">Ledger hierarchy</h2><p className="mt-1 text-xs text-text-muted">Accounts are grouped by their financial statement classification.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code or account..." className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></div></div>{accountsQuery.isLoading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : accountsQuery.isError ? <div className="py-16 text-center"><p className="text-sm font-medium text-red-600">Unable to load chart of accounts.</p><p className="mt-1 text-xs text-text-muted">Check your access and API connection, then try again.</p></div> : <div className="space-y-4">{groups.map((group) => { const groupAccounts = filteredAccounts.filter((account) => account.type === group.type || (group.type === "expense" && account.type === "other_expense")); if (groupAccounts.length === 0) return null; const Icon = group.icon; return <section key={group.type} className="overflow-hidden rounded-xl border border-border"><div className="flex items-center gap-3 border-b border-border bg-surface-muted/60 px-4 py-3"><div className={`rounded-lg p-2 ${group.tone}`}><Icon className="h-4 w-4" /></div><div className="flex-1"><h3 className="text-sm font-semibold text-text">{group.label}</h3><p className="text-xs text-text-muted">{group.description}</p></div><Badge variant="secondary">{groupAccounts.length} accounts</Badge></div><div className="divide-y divide-border">{groupAccounts.map((account) => <div key={account.id} className="flex items-center gap-3 px-4 py-3 pl-8 transition hover:bg-surface-muted/40"><ChevronDown className="h-3.5 w-3.5 -rotate-90 text-text-muted" /><span className="w-14 font-mono text-xs font-semibold text-primary-600">{account.code}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-text">{account.name}</p>{account.description && <p className="mt-0.5 truncate text-xs text-text-muted">{account.description}</p>}</div><span className="text-xs text-text-muted">{account.is_active ? "Active" : "Inactive"}</span></div>)}</div></section>; })}{filteredAccounts.length === 0 && <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">No accounts match your search.</div>}</div>}</CardContent></Card></div>;
}
