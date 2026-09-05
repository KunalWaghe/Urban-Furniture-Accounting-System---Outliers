/**
 * Shared orders list page for Sales Orders and Purchase Orders routes.
 *
 * Data flow:
 * - Sales: useSalesOrders → orders-api → sales-orders API
 * - Purchase: usePaginatedPurchaseOrders → orders-api → purchase-orders API (server-side)
 *
 * Local UI state: search query, status filter, pagination, sort (PO only), detail modal (sales).
 * No mutations on this page — purchase rows navigate to /purchase-orders/:id.
 */

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Package,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { AppModal } from "@/components/app-modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatINR } from "@/lib/format";
import { usePaginatedPurchaseOrders, useSalesOrders } from "./queries";
import type { PurchaseOrder, SalesOrder } from "@/lib/types";

type OrderKind = "sales" | "purchase";
type Order = SalesOrder | PurchaseOrder;

interface OrdersListPageProps {
  kind: OrderKind;
}

const PAGE_SIZE = 10;

/** Type guard: sales orders have `order_number`, purchase orders have `po_number`. */
function isSalesOrder(order: Order): order is SalesOrder {
  return "order_number" in order;
}

/** Returns Tailwind classes for the order status pill color. */
function statusClasses(status: string) {
  if (status === "Confirmed") {
    return "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  if (status === "Partially Billed") {
    return "border-purple-200/70 bg-purple-50 text-purple-700 dark:border-purple-900/70 dark:bg-purple-950/40 dark:text-purple-400";
  }
  if (status === "Cancelled") {
    return "border-red-200/70 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-400";
  }
  return "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-400";
}

/** Small colored badge showing order status in the table. */
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

/**
 * Renders the sales or purchase orders table with filters, stats, and pagination.
 *
 * @param kind - "sales" for customer orders, "purchase" for supplier POs.
 */
export function OrdersListPage({ kind }: OrdersListPageProps) {
  const router = useRouter();
  const isSales = kind === "sales";

  // ── Search / filter state ────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ── Sorting state for purchase orders (backend-supported) ───────────────
  const [poSortBy, setPoSortBy] = useState("created_at");
  const [poSortOrder, setPoSortOrder] = useState<"asc" | "desc">("desc");

  // ── Pagination state ─────────────────────────────────────────────────────
  const [salesPage, setSalesPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);

  /** Toggles sort direction or switches sort column for purchase orders. */
  function handlePoSort(field: string) {
    if (poSortBy === field) {
      setPoSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setPoSortBy(field);
      setPoSortOrder("asc");
    }
    setPurchasePage(1);
  }

  // ── Data fetching ────────────────────────────────────────────────────────
  // Sales orders: client-side (data is synthesised locally)
  const salesQuery = useSalesOrders(isSales);

  // Purchase orders: server-side pagination, search, filter and sort
  const purchaseQuery = usePaginatedPurchaseOrders(
    {
      page: purchasePage,
      limit: PAGE_SIZE,
      search: query.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sort_by: poSortBy,
      sort_order: poSortOrder,
    },
    !isSales
  );

  // ── Derived data ─────────────────────────────────────────────────────────

  // Sales: all rows come from the hook; we filter + paginate client-side
  const allSalesOrders = useMemo<SalesOrder[]>(
    () => (salesQuery.data ?? []) as SalesOrder[],
    [salesQuery.data]
  );

  const filteredSalesOrders = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return allSalesOrders.filter((order) => {
      const status = order.status.toLowerCase();
      const itemMatches = order.items.some((item) =>
        item.product_name.toLowerCase().includes(normalizedQuery)
      );
      return (
        (statusFilter === "all" || status === statusFilter.toLowerCase()) &&
        (!normalizedQuery ||
          order.order_number.toLowerCase().includes(normalizedQuery) ||
          order.customer_name.toLowerCase().includes(normalizedQuery) ||
          (order.customer_location ?? "").toLowerCase().includes(normalizedQuery) ||
          itemMatches)
      );
    });
  }, [allSalesOrders, query, statusFilter]);

  const salesTotalPages = Math.max(1, Math.ceil(filteredSalesOrders.length / PAGE_SIZE));
  const pagedSalesOrders = useMemo(() => {
    const start = (salesPage - 1) * PAGE_SIZE;
    return filteredSalesOrders.slice(start, start + PAGE_SIZE);
  }, [filteredSalesOrders, salesPage]);

  // Purchase: server already paginates
  const purchaseOrders = useMemo<PurchaseOrder[]>(
    () => (purchaseQuery.data?.orders ?? []) as PurchaseOrder[],
    [purchaseQuery.data]
  );
  const purchaseTotalRows = purchaseQuery.data?.total ?? 0;
  const purchaseTotalPages = purchaseQuery.data?.pages ?? 1;

  // Active data / meta depending on kind
  const visibleOrders: Order[] = isSales ? pagedSalesOrders : purchaseOrders;
  const totalRows = isSales ? filteredSalesOrders.length : purchaseTotalRows;
  const allRowsCount = isSales ? allSalesOrders.length : purchaseTotalRows;
  const totalPages = isSales ? salesTotalPages : purchaseTotalPages;
  const currentPage = isSales ? salesPage : purchasePage;
  const setPage = isSales ? setSalesPage : setPurchasePage;
  const loading = isSales ? salesQuery.isLoading : purchaseQuery.isLoading;
  const isFetching = !isSales && purchaseQuery.isFetching && !purchaseQuery.isLoading;
  const error = (isSales ? salesQuery.error : purchaseQuery.error)
    ? ((isSales ? salesQuery.error : purchaseQuery.error) instanceof Error
      ? (isSales ? salesQuery.error : purchaseQuery.error)!.message
      : "Failed to load orders")
    : null;

  // ── Summary stats (always over the full set) ─────────────────────────────
  const confirmedCount = isSales
    ? allSalesOrders.filter((o) => o.status === "Confirmed").length
    : (purchaseQuery.data?.orders ?? []).filter((o) => o.status === "Confirmed").length;
  const draftCount = isSales
    ? allSalesOrders.filter((o) => o.status === "Draft").length
    : (purchaseQuery.data?.orders ?? []).filter((o) => o.status === "Draft").length;
  const totalValue = isSales
    ? allSalesOrders.reduce((sum, o) => sum + o.total_amount, 0)
    : (purchaseQuery.data?.orders ?? []).reduce((sum, o) => sum + o.total_amount, 0);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedOrder(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

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
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.icon}`}>
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
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          {!isSales && (
            <Link
              href="/purchase-orders/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              New Purchase Order
            </Link>
          )}
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Total order value</p>
            <p className="mt-1 font-mono text-lg font-bold text-text">{formatINR(totalValue)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="All orders" value={allRowsCount} detail="active records" icon={<Package className="h-4 w-4" />} />
        <StatCard label="Confirmed" value={confirmedCount} detail="approved orders" icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Draft" value={draftCount} detail="pending approval" icon={<Clock3 className="h-4 w-4" />} tone="amber" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* Table header / filters */}
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-text">All {title.toLowerCase()}</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Showing {visibleOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, totalRows)} of {totalRows} {title.toLowerCase()}
              {isFetching && (
                <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent align-middle opacity-60" />
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSalesPage(1);
                  setPurchasePage(1);
                }}
                placeholder={`Search ${isSales ? "SO #, customer, item" : "PO #, vendor, item"}`}
                className="w-full rounded-lg border border-border bg-surface-muted py-2 pl-9 pr-3 text-xs text-text outline-none transition-colors focus:border-primary-500 focus:bg-surface focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setSalesPage(1);
                setPurchasePage(1);
              }}
              className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="draft">Draft</option>
              {!isSales && <option value="cancelled">Cancelled</option>}
              {!isSales && <option value="partially billed">Partially Billed</option>}
            </select>
          </div>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="px-6 py-20 text-center">
            <Package className="mx-auto h-8 w-8 text-red-500" />
            <h3 className="mt-3 font-semibold text-text">Could not load {title.toLowerCase()}</h3>
            <p className="mt-1 text-sm text-text-muted">{error}</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Package className="mx-auto h-8 w-8 text-text-muted" />
            <h3 className="mt-3 font-semibold text-text">No {title.toLowerCase()} found</h3>
            <p className="mt-1 text-sm text-text-muted">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">
                      {isSales ? (
                        "Sales Order #"
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePoSort("po_number")}
                          className="inline-flex items-center gap-1.5 transition-colors hover:text-text"
                        >
                          <span>Purchase Order #</span>
                          {poSortBy === "po_number" ? (
                            poSortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-primary-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary-600" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      )}
                    </th>
                    <th className="px-5 py-3">{isSales ? "Customer" : "Vendor"}</th>
                    <th className="px-5 py-3">
                      {isSales ? (
                        "Date"
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePoSort("order_date")}
                          className="inline-flex items-center gap-1.5 transition-colors hover:text-text"
                        >
                          <span>Date</span>
                          {poSortBy === "order_date" ? (
                            poSortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-primary-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary-600" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      )}
                    </th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">
                      {isSales ? (
                        "Total"
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePoSort("total")}
                          className="inline-flex items-center justify-end gap-1.5 transition-colors hover:text-text"
                        >
                          <span>Total</span>
                          {poSortBy === "total" ? (
                            poSortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-primary-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary-600" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      )}
                    </th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleOrders.map((order) => {
                    const reference = isSalesOrder(order) ? order.order_number : order.po_number;
                    const partner = isSalesOrder(order) ? order.customer_name : order.vendor_name;
                    const date = isSalesOrder(order) ? order.order_date : order.po_date;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => {
                          if (isSales) {
                            setSelectedOrder(order);
                          } else {
                            router.push(`/purchase-orders/${order.id}`);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-surface-muted/70"
                      >
                        <td className={`whitespace-nowrap px-5 py-4 font-mono font-semibold ${accent.reference}`}>{reference}</td>
                        <td className="px-5 py-4 font-medium text-text">{partner}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-text-muted">{date}</td>
                        <td className="px-5 py-4"><OrderStatus status={order.status} /></td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-semibold text-text">{formatINR(order.total_amount)}</td>
                        <td className="px-5 py-4 text-right">
                          {isSales ? (
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
                          ) : (
                            <Link
                              href={`/purchase-orders/${order.id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/40"
                            >
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination bar */}
            {totalPages > 1 && (
              <div className="border-t border-border px-5">
                <TablePagination
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </section>

      {isSales && selectedOrder && (
        <OrderDetails order={selectedOrder} title={singularTitle} isPurchase={false} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

/** KPI card showing a count with label and icon (All orders, Confirmed, Draft). */
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

/** Slide-over modal with full order line items (sales orders only). */
function OrderDetails({
  order,
  title,
  isPurchase = false,
  onClose,
}: {
  order: Order;
  title: string;
  isPurchase?: boolean;
  onClose: () => void;
}) {
  const salesOrder = isSalesOrder(order);
  const reference = salesOrder ? order.order_number : order.po_number;
  const partner = salesOrder ? order.customer_name : order.vendor_name;
  const location = salesOrder ? order.customer_location : order.vendor_location;
  const date = salesOrder ? order.order_date : order.po_date;

  return (
    <AppModal
      open
      onClose={onClose}
      title={reference}
      subtitle={title}
      maxWidth="lg"
      bodyClassName="space-y-5 p-0 px-6 py-5"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-muted"
          >
            Close
          </button>
        </div>
      }
    >
          <div className="grid gap-4 sm:grid-cols-3">
            <Detail label={salesOrder ? "Customer" : "Vendor"} value={partner} />
            <Detail label="Order date" value={date} icon={<CalendarDays className="h-3.5 w-3.5" />} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</p>
              <div className="mt-2"><OrderStatus status={order.status} /></div>
            </div>
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
                      {"category" in item && item.category && (
                        <p className="text-xs text-text-muted">{item.category as string}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-text-muted">{item.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-text">{formatINR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-border bg-surface-muted/60 px-4 py-3 text-sm font-semibold">
              <span>Total amount</span>
              <span className="font-mono">{formatINR(order.total_amount)}</span>
            </div>
          </div>
    </AppModal>
  );
}

/** Single label + value pair inside the order details modal. */
function Detail({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-text">{icon}{value}</p>
    </div>
  );
}
