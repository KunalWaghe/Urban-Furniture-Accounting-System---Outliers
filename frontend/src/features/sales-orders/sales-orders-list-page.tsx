/**
 * Sales Orders List Page — directory table with server-side pagination, search, and status filters.
 *
 * Data flow:
 * - Query: useQuery calling fetchSalesOrdersPage from sales-orders-api.
 * - Local UI state: query, statusFilter, page, sortBy, sortOrder.
 * - Actions: "New Order" links to /sales-orders/new, row click navigates to /sales-orders/[id].
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
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { fetchSalesOrdersPage } from "./sales-orders-api";
import { SoStatusBadge } from "./so-status-badge";
import { formatINR } from "@/lib/format";
import type { SalesOrder } from "@/lib/types";

const PAGE_SIZE = 10;

export function SalesOrdersListPage() {
  const router = useRouter();

  // ── Search, filter & sorting state ─────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Query: paginated sales orders ──────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sales-orders", page, query, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      fetchSalesOrdersPage({
        page,
        limit: PAGE_SIZE,
        search: query.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  // ── Quick KPIs summary computed across current dataset ────────────────────
  const confirmedCount = orders.filter((o) => o.status === "Confirmed").length;
  const draftCount = orders.filter((o) => o.status === "Draft").length;
  const invoicedCount = orders.filter((o) => o.status === "Partially Billed").length;
  const totalSalesVal = orders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

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
    <div className="space-y-6 pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Sales Orders
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Track customer orders, manage order confirmation state machine, and generate invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            <span className="text-xs font-medium">Total Orders</span>
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">{total}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Confirmed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">{confirmedCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Draft</span>
            <Clock3 className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">{draftCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Invoiced / Billed</span>
            <Receipt className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">{invoicedCount}</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search SO number or Customer..."
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
            { id: "draft", label: "Draft" },
            { id: "confirmed", label: "Confirmed" },
            { id: "Partially Billed", label: "Invoiced" },
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

      {/* ── Table / Content ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner label="Loading sales orders..." />
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-500">Failed to load sales orders.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Try Again
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-text-muted opacity-40" />
            <h3 className="mt-3 text-sm font-semibold text-text-primary">No sales orders found</h3>
            <p className="mt-1 text-xs text-text-muted">
              {query || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Create your first customer sales order to get started."}
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
              <Link href="/sales-orders/new">
                <Button size="sm" className="mt-4">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Sales Order
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
                    onClick={() => handleSort("so_number")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Order #</span>
                      {renderSortIcon("so_number")}
                    </div>
                  </th>
                  <th className="px-4 py-3">Customer</th>
                  <th
                    className="cursor-pointer px-4 py-3 hover:text-text-primary"
                    onClick={() => handleSort("order_date")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {renderSortIcon("order_date")}
                    </div>
                  </th>
                  <th className="px-4 py-3">Items</th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right hover:text-text-primary"
                    onClick={() => handleSort("total")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total (INR)</span>
                      {renderSortIcon("total")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/sales-orders/${order.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-elevated/60"
                  >
                    <td className="px-4 py-3 font-semibold text-primary-600">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {order.order_date}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">
                      {formatINR(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SoStatusBadge status={order.status} />
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

        {/* ── Table Pagination ─────────────────────────────────────────────── */}
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
