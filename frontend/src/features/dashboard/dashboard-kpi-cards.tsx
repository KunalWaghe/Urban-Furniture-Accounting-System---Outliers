"use client";

import Link from "next/link";
import { Banknote, Landmark, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { SkeletonKpiCard } from "@/components/skeleton-kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { fetchBalanceSheet, fetchProfitLoss } from "@/features/reports/reports-api";

function findBalance(lines: { account_name: string; balance: number }[], terms: string[]) {
  return lines.filter((line) => terms.some((term) => line.account_name.toLowerCase().includes(term))).reduce((sum, line) => sum + line.balance, 0);
}

export function DashboardKpiCards() {
  const balanceQuery = useQuery({ queryKey: ["dashboard", "balance-sheet"], queryFn: () => fetchBalanceSheet() });
  const pnlQuery = useQuery({ queryKey: ["dashboard", "profit-loss"], queryFn: () => fetchProfitLoss() });
  if (balanceQuery.isLoading || pnlQuery.isLoading) return <section aria-label="Financial KPIs" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <SkeletonKpiCard key={i} />)}</section>;
  if (balanceQuery.isError || pnlQuery.isError || !balanceQuery.data || !pnlQuery.data) return <Card><CardContent className="p-5"><p className="text-sm font-semibold text-text">Financial KPIs unavailable</p><p className="mt-1 text-xs text-text-muted">Connect the reporting API to show Cash, Bank, Receivables, Payables, and Net Profit.</p></CardContent></Card>;
  const balance = balanceQuery.data;
  const metrics = [
    { label: "Cash", value: findBalance(balance.assets.lines, ["cash"]), icon: Banknote, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Bank", value: findBalance(balance.assets.lines, ["bank"]), icon: Landmark, tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
    { label: "Receivables", value: findBalance(balance.assets.lines, ["receivable", "debtor", "accounts receivable"]), icon: ReceiptText, tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
    { label: "Payables", value: balance.liabilities.total, icon: WalletCards, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    { label: "Net Profit", value: pnlQuery.data.net_income, icon: TrendingUp, tone: pnlQuery.data.net_income >= 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" : "text-red-600 bg-red-50 dark:bg-red-950/40" },
  ];
  return <section aria-label="Financial KPIs" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => { const Icon = metric.icon; return <Link key={metric.label} href={metric.label === "Net Profit" ? "/reports/profit-loss" : "/reports/balance-sheet"} className="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-3"><div className={`rounded-lg p-2.5 ${metric.tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-xs text-text-muted">{metric.label}</p><p className="mt-1 truncate text-base font-bold text-text">{formatINR(metric.value)}</p></div></div></Link>; })}</section>;
}
