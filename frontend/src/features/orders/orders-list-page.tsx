"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  Search,
  X,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { fetchSalesOrders } from "./orders-api";
import type { SalesOrder } from "@/lib/types";

type SortKey = "reference" | "partner" | "date" | "total";
type SortOrder = "asc" | "desc";

function currency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function statusClasses(status: string) {
  if (status === "Confirmed") {
    return "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  return "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-400";
}

function OrderStatus({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(status)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function OrdersListPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchSalesOrders()
      .then((nextOrders) => {
        if (ignore) return;
        setError(null);
        setOrders(nextOrders);
      })
      .catch(() => {
        if (!ignore) setError("Could not load sales orders.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedOrder(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    const matchingOrders = orders.filter((order) => {
      const status = order.status.toLowerCase();
      const itemMatches = order.items.some((item) =>
        item.product_name.toLowerCase().includes(normalizedQuery)
      );

      return (
        (statusFilter === "all" || status === statusFilter.toLowerCase()) &&
        (!normalizedQuery ||
          order.order_number.toLowerCase().includes(normalizedQuery) ||
          order.customer_name.toLowerCase().includes(normalizedQuery) ||
          order.customer_location.toLowerCase().includes(normalizedQuery) ||
          itemMatches)
      );
    });

    const getSortValue = (order: SalesOrder): string | number => {
      if (sortKey === "reference") return order.order_number;
      if (sortKey === "partner") return order.customer_name;
      if (sortKey === "date") return order.order_date;
      return order.total_amount;
    };

    return [...matchingOrders].sort((left, right) => {
      const leftValue = getSortValue(left);
      const rightValue = getSortValue(right);
      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue));
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [orders, query, sortKey, sortOrder, statusFilter]);

  const visibleOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);
  const totalCount = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const confirmedCount = orders.filter((order) => order.status === "Confirmed").length;
  const draftCount = orders.filter((order) => order.status === "Draft").length;
  const totalValue = visibleOrders.reduce((sum, order) => sum + order.total_amount, 0);

  function handleSort(nextKey: SortKey) {
    setPage(1);
    if (sortKey === nextKey) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortOrder("asc");
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">Sales Orders</h1>
              <p className="mt-1 text-sm text-text-muted">
                Manage customer orders, fulfillment status, and order value.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-right shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Shown order value</p>
          <p className="mt-1 font-mono text-lg font-bold text-text">{currency(totalValue)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="All orders" value={totalCount} detail="active records" icon={<Package className="h-4 w-4" />} />
        <StatCard label="Confirmed" value={confirmedCount} detail="approved orders" icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Draft" value={draftCount} detail="pending approval" icon={<Clock3 className="h-4 w-4" />} tone="amber" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-text">All sales orders</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Showing {visibleOrders.length} of {totalCount} sales orders
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setPage(1);
                  setQuery(event.target.value);
                }}
                placeholder="Search SO #, customer, item"
                className="w-full rounded-lg border border-border bg-surface-muted py-2 pl-9 pr-3 text-xs text-text outline-none transition-colors focus:border-primary-500 focus:bg-surface focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-20 text-center">
            <p className="font-semibold text-destructive">{error}</p>
            <p className="mt-1 text-sm text-text-muted">Please try again after the backend is available.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Package className="mx-auto h-8 w-8 text-text-muted" />
            <h3 className="mt-3 font-semibold text-text">No sales orders found</h3>
            <p className="mt-1 text-sm text-text-muted">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <SortableHeader label="Sales Order #" sortKey="reference" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Customer" sortKey="partner" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Date" sortKey="date" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                  <th className="px-5 py-3">Status</th>
                  <SortableHeader label="Total" sortKey="total" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} align="right" />
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer transition-colors hover:bg-surface-muted/70"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-mono font-semibold text-blue-600 dark:text-blue-400">{order.order_number}</td>
                    <td className="px-5 py-4 font-medium text-text">{order.customer_name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-text-muted">{order.order_date}</td>
                    <td className="px-5 py-4"><OrderStatus status={order.status} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-semibold text-text">{currency(order.total_amount)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/40"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-text-muted">
            <span>Page {page} of {totalPages}</span>
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
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedOrder && (
        <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
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

function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "blue",
}: {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
  tone?: "blue" | "emerald" | "amber";
}) {
  const colors = {
    blue: "border-blue-200/60 bg-blue-50/40 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-400",
    emerald: "border-emerald-200/60 bg-emerald-50/40 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400",
    amber: "border-amber-200/60 bg-amber-50/40 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <span className="text-xs opacity-80">{detail}</span>
      </div>
    </div>
  );
}

function OrderDetails({
  order,
  onClose,
}: {
  order: SalesOrder;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-2xl sm:max-w-2xl sm:rounded-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Sales Order</p>
            <h2 className="mt-1 font-mono text-xl font-bold text-primary-600">{order.order_number}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-surface-muted hover:text-text" aria-label="Close order details">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Detail label="Customer" value={order.customer_name} />
            <Detail label="Order date" value={order.order_date} icon={<CalendarDays className="h-3.5 w-3.5" />} />
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</p><div className="mt-2"><OrderStatus status={order.status} /></div></div>
          </div>
          {order.customer_location && <Detail label="Location" value={order.customer_location} />}
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Item</th>
                  <th className="w-20 px-4 py-2.5 text-right font-semibold">Qty</th>
                  <th className="w-32 px-4 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {order.items.map((item, index) => (
                  <tr key={`${item.product_name}-${index}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text">{item.product_name}</p>
                      {item.category && <p className="text-xs text-text-muted">{item.category}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-text-muted">{item.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-text">{currency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-border bg-surface-muted/60 px-4 py-3 text-sm font-semibold">
              <span>Total amount</span>
              <span className="font-mono">{currency(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-text">{icon}{value}</p></div>;
}
