"use client";

import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJournalsPage } from "./journals-api";

const journalTypes = ["all", "sale", "purchase", "bank", "cash"];

export function JournalsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const journalsQuery = useQuery({
    queryKey: ["journals", search, type],
    queryFn: () => fetchJournalsPage({ search, type, limit: 100, is_active: true }),
  });
  const journals = journalsQuery.data?.data ?? [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Accounting setup</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">Journals</h1>
          <p className="mt-1 text-sm text-text-muted">Review the journals used to post sales, purchases, bank, and cash activity.</p>
        </div>
        <a href="/chart-of-accounts" className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-sm font-medium text-text transition-colors hover:bg-muted">View Chart of Accounts</a>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm"><CardContent className="flex items-center gap-3"><div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40"><BookOpen className="h-5 w-5" /></div><div><p className="text-xs text-text-muted">Active journals</p><p className="text-xl font-bold text-text">{journals.length}</p></div></CardContent></Card>
        <Card size="sm"><CardContent><p className="text-xs text-text-muted">Default journals</p><p className="mt-1 text-xl font-bold text-text">{journals.filter((journal) => journal.default_account_id).length}</p></CardContent></Card>
        <Card size="sm"><CardContent><p className="text-xs text-text-muted">Posting status</p><p className="mt-1 text-sm font-semibold text-emerald-600">Ready for entries</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search journals..." className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></div>
            <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"><option value="all">All journal types</option>{journalTypes.slice(1).map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select>
          </div>
          {journalsQuery.isLoading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : journalsQuery.isError ? <div className="p-8 text-center text-sm text-red-600">Unable to load journals. Please retry.</div> : journals.length === 0 ? <div className="p-10 text-center text-sm text-text-muted">No journals found.</div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted"><tr><th className="px-5 py-3">Code</th><th className="px-5 py-3">Journal name</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Default account</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-border">{journals.map((journal) => <tr key={journal.id} className="hover:bg-surface-muted/40"><td className="px-5 py-3 font-mono text-xs font-semibold text-primary-600">{journal.code}</td><td className="px-5 py-3 font-medium text-text">{journal.name}</td><td className="px-5 py-3 capitalize text-text-muted">{journal.type}</td><td className="px-5 py-3 text-text-muted">{journal.default_account_name ?? "—"}</td><td className="px-5 py-3"><Badge variant={journal.is_active ? "secondary" : "outline"}>{journal.is_active ? "Active" : "Inactive"}</Badge></td></tr>)}</tbody></table></div>}
        </CardContent>
      </Card>
    </div>
  );
}
