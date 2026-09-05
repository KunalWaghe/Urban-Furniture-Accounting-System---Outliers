/**
 * Customer Invoices List Page (Task 6B / P0-FE-10).
 *
 * Directory table displaying customer invoices with server/store-side pagination,
 * status filters (All, Confirmed, Paid, Draft), search, financial KPI summaries,
 * and navigation to invoice details.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Plus,
  Receipt,
  Search,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { fetchCustomerInvoicesPage } from "./customer-invoices-api";
import { CustomerInvoiceStatusBadge } from "./customer-invoice-status-badge";
import { formatINR } from "@/lib/format";

const PAGE_SIZE = 10;

export function CustomerInvoicesListPage() {
  const router = useRouter();

  // ── Search, filter & sorting state ─────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Query: paginated customer invoices ────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer-invoices", page, query, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      fetchCustomerInvoicesPage({
        page,
        limit: PAGE_SIZE,
        search: query.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const invoices = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  // ── Financial summaries computed from current dataset ──────────────────────
  const totalInvoicedVal = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalCollectedVal = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalDueVal = invoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0);
  const paidCount = invoices.filter((i) => i.status === "Paid" || i.status === "paid").length;

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function renderSortIcon(column: string) {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-text-muted opacity-60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Customer Invoices
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage client billing, accounts receivable, and customer payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/sales-orders">
            <Button variant="outline" className="shadow-xs">
              <FileText className="mr-1.5 h-4 w-4 text-primary-600" />
              Sales Orders
            </Button>
          </Link>
          <Link href="/sales-orders/new">
            <Button variant="default" className="shadow-sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Sales Order
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Total Invoiced</span>
            <Receipt className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {formatINR(totalInvoicedVal)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">{total} total invoices</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Collected / Received</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatINR(totalCollectedVal)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">{paidCount} settled in full</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Outstanding Due (AR)</span>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {formatINR(totalDueVal)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">Trade receivables balance</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Fully Settled</span>
            <Building2 className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">{paidCount}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">Receipts deposited</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search invoice #, customer, or SO..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-1 text-xs">
          {[
            { id: "all", label: "All" },
            { id: "Confirmed", label: "Open / Confirmed" },
            { id: "paid", label: "Paid" },
            { id: "draft", label: "Draft" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                statusFilter === tab.id
                  ? "bg-primary-600 text-white shadow-xs"
                  : "text-text-muted hover:bg-surface-elevated hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Invoices Table ───────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner label="Loading customer invoices..." />
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-500">Failed to load customer invoices.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Try Again
            </Button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="mx-auto h-10 w-10 text-text-muted opacity-40" />
            <h3 className="mt-3 text-sm font-semibold text-text-primary">No invoices found</h3>
            <p className="mt-1 text-xs text-text-muted">
              {query || statusFilter !== "all"
                ? "Try adjusting your search query or status filter."
                : "Invoices are generated from confirmed Sales Orders."}
            </p>
            {query || statusFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Link href="/sales-orders">
                <Button size="sm" className="mt-4">
                  <FileText className="mr-1.5 h-4 w-4" />
                  Go to Sales Orders
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-elevated text-xs font-semibold uppercase text-text-muted">
                <tr>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-text-primary"
                    onClick={() => handleSort("invoice_number")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Invoice #</span>
                      {renderSortIcon("invoice_number")}
                    </div>
                  </th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Source SO</th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-text-primary"
                    onClick={() => handleSort("invoice_date")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Invoice Date</span>
                      {renderSortIcon("invoice_date")}
                    </div>
                  </th>
                  <th className="px-4 py-3">Due Date</th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right hover:text-text-primary"
                    onClick={() => handleSort("total")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total</span>
                      {renderSortIcon("total")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right">Amount Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/sales-invoices/${inv.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-elevated/60"
                  >
                    <td className="px-4 py-3 font-semibold text-primary-600">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {inv.customer_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {inv.so_id ? (
                        <span className="font-mono text-purple-600 dark:text-purple-400">
                          {inv.so_number || `SO-${inv.so_id}`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {inv.invoice_date}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {inv.due_date}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">
                      {formatINR(inv.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={inv.amount_due > 0 ? "text-amber-600" : "text-emerald-600"}>
                        {formatINR(inv.amount_due)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CustomerInvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-primary-600 hover:underline">
                        View Details →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {!isLoading && total > 0 && (
          <div className="border-t border-border px-4 py-3">
            <TablePagination
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
