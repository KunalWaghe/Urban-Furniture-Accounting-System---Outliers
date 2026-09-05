"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  IndianRupee,
  Package,
  Plus,
  Search,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { DashboardMetricCard, DashboardTableCard } from "@/features/dashboard/components/dashboard-card";
import { formatDate, formatINR } from "@/lib/format";
import { fetchPurchaseOrdersPage, type PurchaseOrderSort } from "./purchase-orders-api";
import { PoStatusBadge } from "./po-status-badge";

const PAGE_SIZE = 10;

type SortKey = "reference" | "date" | "total";
type SortOrder = "asc" | "desc";

const SORT_TO_API: Record<SortKey, PurchaseOrderSort> = {
  reference: "po_number",
  date: "order_date",
  total: "total",
};

export function PurchaseOrdersListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const listQuery = useQuery({
    queryKey: ["purchase-orders", { page, search: debouncedSearch, status: statusFilter, sortKey, sortOrder }],
    queryFn: () =>
      fetchPurchaseOrdersPage({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
        sortBy: SORT_TO_API[sortKey],
        sortOrder,
      }),
  });

  // Summary cards read the unfiltered set. Demo-scale assumption: <= 100 POs.
  const summaryQuery = useQuery({
    queryKey: ["purchase-orders", "summary"],
    queryFn: () => fetchPurchaseOrdersPage({ page: 1, limit: 100, sortBy: "id", sortOrder: "desc" }),
  });

  function handleSort(nextKey: SortKey) {
    setPage(1);
    if (sortKey === nextKey) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortOrder("asc");
  }

  const orders = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const pages = Math.max(1, listQuery.data?.pages ?? 1);

  const summaryOrders = summaryQuery.data?.data ?? [];
  const draftOrders = summaryOrders.filter((o) => o.status === "draft");
  const confirmedOrders = summaryOrders.filter((o) => o.status === "confirmed");
  const totalValue = summaryOrders.reduce((sum, o) => sum + o.total, 0);
  const draftValue = draftOrders.reduce((sum, o) => sum + o.total, 0);
  const confirmedValue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgValue = summaryOrders.length > 0 ? Math.round(totalValue / summaryOrders.length) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Purchase Orders</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage supplier orders, approvals, and committed procurement value.
          </p>
        </div>
        <Link
          href="/purchase-orders/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Total Orders"
          icon={Package}
          value={summaryQuery.data?.total ?? 0}
          valueDetail="active records"
          footerLabel="Total value"
          footerValue={formatINR(totalValue)}
        />
        <DashboardMetricCard
          title="Draft Orders"
          icon={Clock3}
          tone="amber"
          value={draftOrders.length}
          valueDetail="pending approval"
          footerLabel="Draft value"
          footerValue={formatINR(draftValue)}
        />
        <DashboardMetricCard
          title="Confirmed Orders"
          icon={CheckCircle2}
          tone="emerald"
          value={confirmedOrders.length}
          valueDetail="approved"
          footerLabel="Confirmed value"
          footerValue={formatINR(confirmedValue)}
        />
        <DashboardMetricCard
          title="Total Purchase Value"
          icon={IndianRupee}
          tone="blue"
          value={formatINR(totalValue)}
          valueDetail="all orders"
          footerLabel="Avg order value"
          footerValue={formatINR(avgValue)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search PO number or vendor..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-xs text-text outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <DashboardTableCard
        title="All Purchase Orders"
        tone="indigo"
        count={`Showing ${orders.length} of ${total} orders`}
      >
        {listQuery.isError ? (
          <div className="px-6 py-20 text-center">
            <p className="font-semibold text-destructive">Could not load purchase orders.</p>
            <p className="mt-1 text-sm text-text-muted">Please try again after the backend is available.</p>
          </div>
        ) : listQuery.isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Package className="mx-auto h-8 w-8 text-text-muted" />
            <h3 className="mt-3 font-semibold text-text">No purchase orders found</h3>
            <p className="mt-1 text-sm text-text-muted">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <SortableHeader label="PO Number" sortKey="reference" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                  <th className="px-5 py-3">Vendor</th>
                  <SortableHeader label="PO Date" sortKey="date" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                  <th className="px-5 py-3">Status</th>
                  <SortableHeader label="Total Amount" sortKey="total" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} align="right" />
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/purchase-orders/${order.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-muted/70"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {order.po_number}
                    </td>
                    <td className="px-5 py-4 font-medium text-text">{order.vendor_name ?? `Vendor #${order.vendor_id}`}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-text-muted">{formatDate(order.order_date)}</td>
                    <td className="px-5 py-4"><PoStatusBadge status={order.status} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-semibold text-text">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/purchase-orders/${order.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/40"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!listQuery.isLoading && !listQuery.isError && total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-text-muted">
            <span>Page {page} of {pages}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pages, current + 1))}
                disabled={page >= pages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </DashboardTableCard>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortOrder,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;
  const Icon = sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={`px-5 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-primary-600"
      >
        {label}
        {active && <Icon className="h-3 w-3" />}
      </button>
    </th>
  );
}
