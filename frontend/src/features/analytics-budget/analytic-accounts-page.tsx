"use client";

import { useState } from "react";
import { Filter, Layers3, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  RecordDetailModal,
} from "@/components/record-detail-modal";
import { fetchAnalyticAccounts, type AnalyticAccount, type AnalyticType } from "./analytics-budget-api";

export function AnalyticAccountsPage() {
  const [type, setType] = useState<"all" | AnalyticType>("all");
  const [search, setSearch] = useState("");
  const [viewingAccount, setViewingAccount] = useState<AnalyticAccount | null>(null);
  const query = useQuery({
    queryKey: ["analytic-accounts", type],
    queryFn: () => fetchAnalyticAccounts({ type: type === "all" ? undefined : type, is_active: true }),
  });
  const accounts = (query.data ?? []).filter((account) =>
    account.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const incomeCount = (query.data ?? []).filter((account) => account.type === "income").length;
  const expenseCount = (query.data ?? []).filter((account) => account.type === "expense").length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Account / Analytics</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">Analytic Accounts</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">
          Income and expense tags used to connect transactions to budgets and performance reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Active analytics</p>
              <p className="text-xl font-bold text-text">{query.data?.length ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Income analytics</p>
              <p className="text-xl font-bold text-text">{incomeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Expense analytics</p>
              <p className="text-xl font-bold text-text">{expenseCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search analytic accounts..."
                className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-muted" />
              <select
                value={type}
                onChange={(event) => setType(event.target.value as "all" | AnalyticType)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
          {query.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner label="Loading analytic accounts…" />
            </div>
          ) : query.isError ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-red-600">Unable to load analytic accounts.</p>
              <p className="mt-1 text-xs text-text-muted">Check your access and API connection, then try again.</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-10 text-center text-sm text-text-muted">No analytic accounts match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      className="cursor-pointer hover:bg-surface-muted/40 focus-visible:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40"
                      onClick={() => setViewingAccount(account)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setViewingAccount(account);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <td className="px-5 py-3 font-medium text-text">{account.name}</td>
                      <td className="px-5 py-3">
                        <Badge variant={account.type === "income" ? "secondary" : "outline"}>
                          {account.type === "income" ? "Income" : "Expense"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-text-muted">{account.description || "—"}</td>
                      <td className="px-5 py-3 text-xs text-emerald-600">
                        {account.is_active ? "Active" : "Inactive"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {viewingAccount && (
        <RecordDetailModal
          open
          onClose={() => setViewingAccount(null)}
          title={viewingAccount.name}
          subtitle="Analytic account details"
          titleId="analytic-detail-title"
          badge={
            <Badge variant={viewingAccount.type === "income" ? "secondary" : "outline"}>
              {viewingAccount.type === "income" ? "Income" : "Expense"}
            </Badge>
          }
          maxWidth="sm"
        >
          <DetailSection title="Account info">
            <DetailFieldGrid>
              <DetailField label="Type" value={<span className="capitalize">{viewingAccount.type}</span>} />
              <DetailField
                label="Status"
                value={
                  <span className={viewingAccount.is_active ? "text-emerald-600" : "text-text-muted"}>
                    {viewingAccount.is_active ? "Active" : "Inactive"}
                  </span>
                }
              />
            </DetailFieldGrid>
          </DetailSection>

          <Separator />

          <DetailSection title="Description">
            <div className="rounded-xl border border-border/70 bg-surface-muted/35 px-3.5 py-3 text-sm text-text">
              {viewingAccount.description || "No description provided."}
            </div>
          </DetailSection>
        </RecordDetailModal>
      )}
    </div>
  );
}
