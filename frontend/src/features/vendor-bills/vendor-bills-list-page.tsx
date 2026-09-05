"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatDate, formatINR } from "@/lib/format";

import { fetchVendorBills, type VendorBillStatus } from "./vendor-bills-api";
import { VendorBillStatusBadge } from "./vendor-bill-status-badge";

const PAGE_SIZE = 10;

export function VendorBillsListPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const billsQuery = useQuery({
    queryKey: ["vendor-bills"],
    queryFn: fetchVendorBills,
  });

  const bills = billsQuery.data ?? [];

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalValue = 0;
    let totalOutstanding = 0;
    let totalPaid = 0;

    for (const b of bills) {
      totalValue += b.total_amount;
      if (b.status === "Confirmed") {
        totalOutstanding += b.amount_due;
      }
      if (b.status === "Paid") {
        totalPaid += b.total_amount;
      }
    }

    return { totalValue, totalOutstanding, totalPaid, count: bills.length };
  }, [bills]);

  // Filter & Search
  const filteredBills = useMemo(() => {
    let result = bills;
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status.toLowerCase() === statusFilter.toLowerCase());
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (b) =>
          b.bill_number.toLowerCase().includes(q) ||
          b.vendor_name.toLowerCase().includes(q) ||
          (b.po_number && b.po_number.toLowerCase().includes(q))
      );
    }
    return result;
  }, [bills, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageBills = filteredBills.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              Purchases Vertical
            </span>
            <span className="text-xs text-text-muted">· Accounts Payable</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Vendor Bills
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage supplier commercial invoices, double-entry ledger postings, and vendor disbursements.
          </p>
        </div>

        <Link
          href="/purchase-orders"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Bill from PO
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Total Bills Value</span>
            <Building2 className="h-4 w-4 text-primary-600" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-text">
            {formatINR(metrics.totalValue)}
          </div>
          <div className="mt-1 text-[11px] text-text-muted">{metrics.count} total bill(s)</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Outstanding Dues (AP)</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
            {formatINR(metrics.totalOutstanding)}
          </div>
          <div className="mt-1 text-[11px] text-text-muted">Pending vendor disbursements</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Total Settled</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatINR(metrics.totalPaid)}
          </div>
          <div className="mt-1 text-[11px] text-text-muted">Paid via Cash &amp; Bank</div>
        </div>
      </div>

      {/* Filter & Table Section */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-surface-muted p-1 text-xs">
            {["all", "draft", "confirmed", "paid"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-all ${
                  statusFilter === tab
                    ? "bg-surface text-text shadow-xs font-semibold"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search + Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search bill #, vendor..."
                className="w-full rounded-xl border border-border bg-surface-muted/60 py-1.5 pl-8 pr-3 text-xs text-text outline-none focus:border-primary-500 focus:bg-surface focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <button
              type="button"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["vendor-bills"] })}
              className="rounded-xl border border-border p-2 text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              title="Refresh directory"
            >
              <RefreshCw className={`h-4 w-4 ${billsQuery.isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        {billsQuery.isLoading ? (
          <div className="py-12 text-center">
            <LoadingSpinner label="Fetching vendor bills…" />
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted space-y-2">
            <FileText className="mx-auto h-8 w-8 text-text-muted/60" />
            <p className="font-semibold text-text">No Vendor Bills Found</p>
            <p>Try clearing filters or generate a bill from a confirmed Purchase Order.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Bill Number</th>
                    <th className="px-5 py-3">Vendor Partner</th>
                    <th className="px-5 py-3">Source PO</th>
                    <th className="px-5 py-3">Bill Date</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Total Amount</th>
                    <th className="px-5 py-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="hover:bg-surface-muted/50 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/vendor-bills/${bill.id}`)}
                    >
                      <td className="px-5 py-4 font-bold text-primary-600">
                        <Link href={`/vendor-bills/${bill.id}`} className="hover:underline">
                          {bill.bill_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-medium text-text">{bill.vendor_name}</td>
                      <td className="px-5 py-4 text-text-muted">
                        {bill.po_number ? (
                          <span className="rounded bg-surface-muted px-2 py-0.5 font-mono text-[11px] text-text">
                            {bill.po_number}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4 text-text-muted">{formatDate(bill.bill_date)}</td>
                      <td className="px-5 py-4 text-text-muted font-medium">
                        {formatDate(bill.due_date)}
                      </td>
                      <td className="px-5 py-4">
                        <VendorBillStatusBadge status={bill.status} />
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-semibold text-text">
                        {formatINR(bill.total_amount)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-primary-600">
                        {formatINR(bill.amount_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="border-t border-border px-5 py-3 flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  Showing {start + 1}–{Math.min(safePage * PAGE_SIZE, filteredBills.length)} of{" "}
                  {filteredBills.length} bills
                </p>
                <TablePagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
