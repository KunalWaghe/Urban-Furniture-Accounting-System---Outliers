"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Package,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { fetchPurchaseOrders, fetchSalesOrders } from "./orders-api";
import type { PurchaseOrder, SalesOrder } from "@/lib/types";

type OrderKind = "sales" | "purchase";
type Order = SalesOrder | PurchaseOrder;

interface OrdersListPageProps {
  kind: OrderKind;
}

function currency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function isSalesOrder(order: Order): order is SalesOrder {
  return "order_number" in order;
}

function statusClasses(status: string) {
  if (status === "Confirmed") {
    return "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  if (status === "Partially Billed") {
    return "border-purple-200/70 bg-purple-50 text-purple-700 dark:border-purple-900/70 dark:bg-purple-950/40 dark:text-purple-400";
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

export function OrdersListPage({ kind }: OrdersListPageProps) {
  const isSales = kind === "sales";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = isSales ? fetchSalesOrders : fetchPurchaseOrders;

    load()
      .then((nextOrders) => {
        if (!ignore) setOrders(nextOrders);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isSales]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedOrder(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return orders.filter((order) => {
      const status = order.status.toLowerCase();
      const reference = isSalesOrder(order) ? order.order_number : order.po_number;
      const partner = isSalesOrder(order) ? order.customer_name : order.vendor_name;
      const location = isSalesOrder(order)
        ? order.customer_location
        : order.vendor_location ?? "";
      const itemMatches = order.items.some((item) =>
        item.product_name.toLowerCase().includes(normalizedQuery)
      );

      return (
        (statusFilter === "all" || status === statusFilter.toLowerCase()) &&
        (!normalizedQuery ||
          reference.toLowerCase().includes(normalizedQuery) ||
          partner.toLowerCase().includes(normalizedQuery) ||
          location.toLowerCase().includes(normalizedQuery) ||
          itemMatches)
      );
    });
  }, [orders, query, statusFilter]);

  const confirmedCount = orders.filter((order) => order.status === "Confirmed").length;
  const draftCount = orders.filter((order) => order.status === "Draft").length;
  const totalValue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const title = isSales ? "Sales Orders" : "Purchase Orders";
  const singularTitle = isSales ? "Sales Order" : "Purchase Order";
  const accent = isSales
    ? {
        icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
        reference: "text-blue-600 dark:text-blue-400",
      }
    : {
        icon: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
        reference: "text-indigo-600 dark:text-indigo-400",
      };

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
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.icon}`}
            >
              {isSales ? <FileText className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
              <p className="mt-1 text-sm text-text-muted">
                {isSales
                  ? "Manage customer orders, fulfillment status, and order value."
                  : "Manage supplier orders, approvals, and committed procurement value."}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-right shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Total order value</p>
          <p className="mt-1 font-mono text-lg font-bold text-text">{currency(totalValue)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="All orders" value={orders.length} detail="active records" icon={<Package className="h-4 w-4" />} />
        <StatCard label="Confirmed" value={confirmedCount} detail="approved orders" icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Draft" value={draftCount} detail="pending approval" icon={<Clock3 className="h-4 w-4" />} tone="amber" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-text">All {title.toLowerCase()}</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Showing {filteredOrders.length} of {orders.length} {title.toLowerCase()}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${isSales ? "SO #, customer, item" : "PO #, vendor, item"}`}
                className="w-full rounded-lg border border-border bg-surface-muted py-2 pl-9 pr-3 text-xs text-text outline-none transition-colors focus:border-primary-500 focus:bg-surface focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="draft">Draft</option>
              {!isSales && <option value="partially billed">Partially Billed</option>}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Package className="mx-auto h-8 w-8 text-text-muted" />
            <h3 className="mt-3 font-semibold text-text">No {title.toLowerCase()} found</h3>
            <p className="mt-1 text-sm text-text-muted">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">{isSales ? "Sales Order #" : "Purchase Order #"}</th>
                  <th className="px-5 py-3">{isSales ? "Customer" : "Vendor"}</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => {
                  const reference = isSalesOrder(order) ? order.order_number : order.po_number;
                  const partner = isSalesOrder(order) ? order.customer_name : order.vendor_name;
                  const date = isSalesOrder(order) ? order.order_date : order.po_date;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted/70"
                    >
                      <td className={`whitespace-nowrap px-5 py-4 font-mono font-semibold ${accent.reference}`}>{reference}</td>
                      <td className="px-5 py-4 font-medium text-text">{partner}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-text-muted">{date}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && (
        <OrderDetails order={selectedOrder} title={singularTitle} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
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
  title,
  onClose,
}: {
  order: Order;
  title: string;
  onClose: () => void;
}) {
  const salesOrder = isSalesOrder(order);
  const reference = salesOrder ? order.order_number : order.po_number;
  const partner = salesOrder ? order.customer_name : order.vendor_name;
  const location = salesOrder ? order.customer_location : order.vendor_location;
  const date = salesOrder ? order.order_date : order.po_date;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-2xl sm:max-w-2xl sm:rounded-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{title}</p>
            <h2 className="mt-1 font-mono text-xl font-bold text-primary-600">{reference}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-surface-muted hover:text-text" aria-label="Close order details">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Detail label={salesOrder ? "Customer" : "Vendor"} value={partner} />
            <Detail label="Order date" value={date} icon={<CalendarDays className="h-3.5 w-3.5" />} />
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</p><div className="mt-2"><OrderStatus status={order.status} /></div></div>
          </div>
          {location && <Detail label="Location" value={location} />}
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
