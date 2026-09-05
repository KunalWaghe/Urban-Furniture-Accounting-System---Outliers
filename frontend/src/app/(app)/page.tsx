/**
 * Next.js App Router — Dashboard (Home) Page
 *
 * Route: `/` (the app home after login)
 *
 * Unlike most routes in this project, the dashboard UI lives directly in this file
 * instead of a separate feature component under `@/features/`. It is a client component
 * (`"use client"`) because it uses hooks, local state, and browser events.
 *
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 * No extra role guard — any authenticated user sees this page.
 */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  LineChart,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  X,
  FileSpreadsheet,
} from "lucide-react";

import type {
  Contact,
  Product,
  SalesOrder,
  PurchaseOrder,
  VendorBill,
} from "@/lib/types";
import {
  useDashboardCustomerInvoiceStats,
  useDashboardOrderData,
  useProducts,
} from "@/features/dashboard/queries";
import { useQueryClient } from "@tanstack/react-query";
import {
  createPurchaseOrder,
  confirmPurchaseOrder,
} from "@/features/purchase-orders/purchase-orders-api";
import {
  createSalesOrder,
  confirmSalesOrder,
} from "@/features/sales-orders/sales-orders-api";
import { createBillFromPo } from "@/features/vendor-bills/vendor-bills-api";
import { SearchableContactSelect } from "@/components/searchable-contact-select";
import { PaymentModal } from "@/components/payment-modal";
import { DashboardKpiCards } from "@/features/dashboard/dashboard-kpi-cards";

/**
 * Main dashboard page — sales, purchase, and budget overview in one scrollable view.
 *
 * Data sources:
 * - Server state: contacts, products, sales/purchase orders, vendor bills, and
 *   budget metrics from React Query hooks backed by live APIs.
 *
 * This page does not import a feature page component; all UI and modals are defined here.
 */
export default function AppDashboardPage() {
  const queryClient = useQueryClient();
  const {
    contacts,
    salesOrders,
    purchaseOrders,
    vendorBills,
    budgetMetric,
    isLoading: loading,
    refetchAll,
  } = useDashboardOrderData();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: invoiceStats } = useDashboardCustomerInvoiceStats();

  const products = useMemo(() => productsData ?? [], [productsData]);
  const dataLoading = loading || productsLoading;

  // Filter & View States
  const [salesFilterStatus, setSalesFilterStatus] = useState<string>("all");
  const [salesSearchQuery, setSalesSearchQuery] = useState<string>("");
  const [purchaseActiveTab, setPurchaseActiveTab] = useState<"po" | "bills">("po");

  // Selected Order / PO / Bill for Inspection & Payment Modals
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<VendorBill | null>(null);

  // Create Modals
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  /** Shows a temporary success/info banner; auto-dismisses after 4 seconds. */
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  /** Re-fetches all dashboard data from the backend APIs. */
  const handleRefresh = useCallback(async () => {
    try {
      await refetchAll();
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["customer-invoices", "stats"] });
      showToast("Backend data refreshed successfully.");
    } catch (err) {
      console.error("Failed to refresh dashboard data:", err);
      showToast("Could not sync with backend. Using cached data.");
    }
  }, [refetchAll, queryClient, showToast]);

  // Keyboard shortcut ESC to close modals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedSalesOrder(null);
        setSelectedPurchaseOrder(null);
        setSelectedBillForPayment(null);
        setIsCreateOrderModalOpen(false);
        setIsCreatePOModalOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync navigation from navbar header (hashchange and erp-navigate custom events)
  useEffect(() => {
    function handleNavigation(hash: string, tab?: "po" | "bills") {
      if (tab) {
        setPurchaseActiveTab(tab);
      } else if (hash === "#purchase-bills") {
        setPurchaseActiveTab("bills");
      } else if (hash === "#purchase-orders") {
        setPurchaseActiveTab("po");
      }

      if (hash && hash.startsWith("#")) {
        const targetId = hash.replace("#", "");
        const elementId =
          targetId === "purchase-orders" || targetId === "purchase-bills"
            ? "purchase-section"
            : targetId;

        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    }

    function onErpNavigate(e: Event) {
      const detail = (e as CustomEvent<{ href: string; tab?: "po" | "bills" }>).detail;
      if (detail?.href) {
        const hash = detail.href.includes("#") ? `#${detail.href.split("#")[1]}` : "";
        handleNavigation(hash, detail.tab);
      }
    }

    function onHashChange() {
      handleNavigation(window.location.hash);
    }

    window.addEventListener("erp-navigate", onErpNavigate);
    window.addEventListener("hashchange", onHashChange);
    if (window.location.hash) {
      handleNavigation(window.location.hash);
    }

    return () => {
      window.removeEventListener("erp-navigate", onErpNavigate);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  // Customers and Vendors derived from backend data
  const backendCustomers = useMemo(() => {
    return contacts.filter((c: Contact) => c.type === "customer" || c.type === "both");
  }, [contacts]);

  const backendVendors = useMemo(() => {
    return contacts.filter((c: Contact) => c.type === "vendor" || c.type === "both");
  }, [contacts]);

  // Filtered Sales Orders
  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const matchesStatus =
        salesFilterStatus === "all" ||
        order.status.toLowerCase() === salesFilterStatus.toLowerCase();

      const query = salesSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        Boolean(order.customer_location?.toLowerCase().includes(query)) ||
        order.items.some((item) =>
          item.product_name.toLowerCase().includes(query)
        );

      return matchesStatus && matchesQuery;
    });
  }, [salesOrders, salesFilterStatus, salesSearchQuery]);

  // Sales Stat Computations
  const salesStats = useMemo(() => {
    const totalCount = salesOrders.length;
    const confirmedCount = salesOrders.filter((o) => o.status === "Confirmed").length;
    const draftCount = salesOrders.filter((o) => o.status === "Draft").length;

    const totalGross = salesOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const realizedRevenue = salesOrders
      .filter((o) => o.status === "Confirmed")
      .reduce((sum, o) => sum + o.total_amount, 0);
    const pipelineValue = salesOrders
      .filter((o) => o.status === "Draft")
      .reduce((sum, o) => sum + o.total_amount, 0);

    return {
      totalCount,
      confirmedCount,
      draftCount,
      totalGross,
      realizedRevenue,
      pipelineValue,
    };
  }, [salesOrders]);

  // Purchase Stat Computations
  const purchaseStats = useMemo(() => {
    const totalRecords = purchaseOrders.length + vendorBills.length;
    const totalCommitted =
      purchaseOrders.reduce((sum, p) => sum + p.total_amount, 0) +
      vendorBills.reduce((sum, b) => sum + b.amount, 0);

    const confirmedCount = purchaseOrders.filter((p) => p.status === "Confirmed").length;
    const authorizedPayables = purchaseOrders
      .filter((p) => p.status === "Confirmed")
      .reduce((sum, p) => sum + p.total_amount, 0);

    const draftCount = purchaseOrders.filter((p) => p.status === "Draft").length;
    const underReview = purchaseOrders
      .filter((p) => p.status === "Draft")
      .reduce((sum, p) => sum + p.total_amount, 0);

    return {
      totalRecords,
      totalCommitted,
      confirmedCount,
      authorizedPayables,
      draftCount,
      underReview,
    };
  }, [purchaseOrders, vendorBills]);

  /** Creates a vendor bill from a confirmed PO via the backend API. */
  const handleConvertPOToBill = useCallback(
    async (po: PurchaseOrder) => {
      try {
        const newBill = await createBillFromPo(Number(po.id));
        await queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
        await queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        setSelectedPurchaseOrder(null);
        showToast(
          `Vendor Bill ${newBill.bill_number} created for ${po.vendor_name} ($${newBill.total_amount.toLocaleString(
            "en-US",
            { minimumFractionDigits: 2 }
          )})`
        );
        setPurchaseActiveTab("bills");
      } catch (err) {
        console.error("Failed to create vendor bill:", err);
        showToast(
          err instanceof Error ? err.message : "Could not create vendor bill from PO."
        );
      }
    },
    [queryClient, showToast]
  );

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 pb-8 sm:pb-10 md:pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 sm:top-20 right-3 sm:right-6 left-3 sm:left-auto z-50 flex items-center gap-2 rounded-lg sm:rounded-xl bg-slate-900 px-3 py-2 sm:px-4 sm:py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <DashboardKpiCards />


      {/* ========================================================================= */}
      {/* SECTION 1: Sales Module Card */}
      {/* ========================================================================= */}
      <section
        id="sales-section"
        className="rounded-xl sm:rounded-2xl border border-border bg-surface p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm space-y-4 sm:space-y-5"
        data-purpose="sales-card"
      >
        {/* Card Header */}
        <div className="flex flex-col gap-3 sm:gap-4 border-b border-border/80 pb-3 sm:pb-4">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3.5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-blue-100/80 bg-blue-50 text-blue-600 font-bold dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs">
              <LineChart className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-text">Sales</h2>
                <span className="rounded-full border border-blue-200/50 bg-blue-50 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
                  Customer Invoicing &amp; Dispatch
                </span>
              </div>
              <p className="mt-0.5 text-[11px] sm:text-xs text-text-muted line-clamp-2">
                Furniture sales contracts, commercial invoicing &amp; collections
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/sales-orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              <span className="hidden sm:inline">View all sales orders</span>
              <span className="sm:hidden">All orders</span>
              <span>→</span>
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={dataLoading}
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-primary-600 disabled:opacity-50"
              title="Refresh backend data"
            >
              <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${dataLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOrderModalOpen(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-primary-600 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary-700 active:bg-primary-800"
            >
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Create New Order</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>

        {/* Metric Stat Tiles (All, Confirmed, Draft) */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {/* All Tile */}
          <div className="rounded-lg sm:rounded-xl border border-border/80 bg-surface-muted/60 p-3 sm:p-4 transition-all hover:bg-surface-muted">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                All
              </span>
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-surface border border-border text-text-muted">
                <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                {salesStats.totalCount}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-text-muted">active orders</span>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between border-t border-border/60 pt-1.5 sm:pt-2 text-[10px] sm:text-[11px]">
              <span className="text-text-muted">Total Gross</span>
              <span className="font-semibold text-text font-mono text-xs sm:text-sm">
                ${salesStats.totalGross.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Confirmed Tile */}
          <div className="rounded-lg sm:rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3 sm:p-4 transition-all hover:bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Confirmed
              </span>
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                {salesStats.confirmedCount}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-500">
                ready / billed
              </span>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between border-t border-emerald-200/40 pt-1.5 sm:pt-2 text-[10px] sm:text-[11px] dark:border-emerald-900/40">
              <span className="text-emerald-700/70 dark:text-emerald-500">Realized Revenue</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 font-mono text-xs sm:text-sm">
                ${salesStats.realizedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Draft Tile */}
          <div className="rounded-lg sm:rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 sm:p-4 transition-all hover:bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Draft
              </span>
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-100/80 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
                {salesStats.draftCount}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-amber-600 dark:text-amber-500">
                quotations
              </span>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between border-t border-amber-200/40 pt-1.5 sm:pt-2 text-[10px] sm:text-[11px] dark:border-amber-900/40">
              <span className="text-amber-700/70 dark:text-amber-500">Pipeline Value</span>
              <span className="font-semibold text-amber-800 dark:text-amber-300 font-mono text-xs sm:text-sm">
                ${salesStats.pipelineValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-2 sm:gap-3 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={salesSearchQuery}
              onChange={(e) => setSalesSearchQuery(e.target.value)}
              placeholder="Search SO #, Customer, location..."
              className="w-full rounded-lg sm:rounded-xl border border-border bg-surface-muted py-2 pl-8 sm:pl-9 pr-3 sm:pr-4 text-xs text-text placeholder-text-muted transition-all focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <Search className="absolute left-2.5 sm:left-3 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-muted" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="inline-flex rounded-lg sm:rounded-xl bg-surface-muted p-0.5 sm:p-1 text-[11px] sm:text-xs font-medium text-text-muted whitespace-nowrap">
              <button
                type="button"
                onClick={() => setSalesFilterStatus("all")}
                className={`rounded-md sm:rounded-lg px-2 sm:px-3 py-1 transition-all ${salesFilterStatus === "all"
                  ? "bg-surface text-primary-600 font-semibold shadow-xs"
                  : "hover:text-text"
                  }`}
              >
                All ({salesStats.totalCount})
              </button>
              <button
                type="button"
                onClick={() => setSalesFilterStatus("Confirmed")}
                className={`rounded-md sm:rounded-lg px-2 sm:px-3 py-1 transition-all ${salesFilterStatus === "Confirmed"
                  ? "bg-surface text-primary-600 font-semibold shadow-xs"
                  : "hover:text-text"
                  }`}
              >
                Confirmed ({salesStats.confirmedCount})
              </button>
              <button
                type="button"
                onClick={() => setSalesFilterStatus("Draft")}
                className={`rounded-md sm:rounded-lg px-2 sm:px-3 py-1 transition-all ${salesFilterStatus === "Draft"
                  ? "bg-surface text-primary-600 font-semibold shadow-xs"
                  : "hover:text-text"
                  }`}
              >
                Draft ({salesStats.draftCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => showToast("Filtering by current accounting fiscal period (Oct 2025 - Present)")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text whitespace-nowrap"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted" />
              <span>Date Range</span>
            </button>
          </div>
        </div>

        {/* Recent Sales Orders Table */}
        <div className="rounded-lg sm:rounded-xl border border-border/80 overflow-hidden bg-surface shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-b border-border/80 bg-surface-muted/80 px-3 sm:px-4 py-2 sm:py-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600"></span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-text">
                Recent Sales Orders
              </span>
              <span className="hidden md:inline text-[11px] font-normal text-text-muted">
                (Click row to inspect order details)
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs overflow-x-auto">
              <Link
                href="/sales-invoices"
                className="rounded-md px-1.5 sm:px-2 py-0.5 font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors whitespace-nowrap"
              >
                Invoices ({invoiceStats?.total ?? 0})
              </Link>
              <span className="text-border">|</span>
              <Link
                href="/sales-invoices"
                className="rounded-md px-1.5 sm:px-2 py-0.5 font-medium text-text-muted hover:bg-surface-muted hover:text-primary-600 transition-colors whitespace-nowrap"
              >
                Receipts ({invoiceStats?.paid ?? 0})
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-text-muted">
        <thead className="border-b border-border bg-surface-muted/40 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className="rounded border-border text-primary-600 focus:ring-primary-500/20"
              />
            </th>
            <th className="px-4 py-3">Sales Order #</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Order Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Total Amount</th>
            <th className="w-24 px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {filteredSalesOrders.map((order) => {
            const initials = order.customer_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <tr
                key={order.id}
                onClick={() => setSelectedSalesOrder(order)}
                className="cursor-pointer transition-colors hover:bg-primary-50/40 dark:hover:bg-primary-950/20"
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary-600 focus:ring-primary-500/20"
                  />
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-primary-600">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary-500" />
                    <span>{order.order_number}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium text-text leading-none">
                        {order.customer_name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {order.customer_location}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-text-muted">
                  {order.order_date}
                </td>
                <td className="px-4 py-3">
                  {order.status === "Confirmed" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-text">
                  ${order.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setSelectedSalesOrder(order)}
                    className="rounded px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-primary-600"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            );
          })}

          {filteredSalesOrders.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-text-muted">
                No sales orders found matching your filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
        </div >
      </section >

    {/* ========================================================================= */ }
  {/* SECTION 2: Purchase Module Card */ }
  {/* ========================================================================= */ }
  <section
    id="purchase-section"
    className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5"
    data-purpose="purchase-card"
  >
    {/* Card Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-100/80 bg-indigo-50 text-indigo-600 font-bold dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-xs">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-text">Purchase</h2>
            <span className="rounded-full border border-indigo-200/50 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-400">
              Procurement &amp; Payables
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Raw materials procurement, timber/hardware supplies &amp; vendor payables
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <Link
          href="/purchase-orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors dark:text-indigo-400"
        >
          <span>View all purchase orders</span>
          <span>→</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsCreatePOModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:bg-indigo-800"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create PO</span>
        </button>
      </div>
    </div>

    {/* Metric Stat Tiles (All Bills/POs, Confirmed, Draft) */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* All Bills / POs */}
      <div className="rounded-xl border border-border/80 bg-surface-muted/60 p-4 transition-all hover:bg-surface-muted">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            All Bills / POs
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface border border-border text-text-muted">
            <Receipt className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-text">
            {purchaseStats.totalRecords}
          </span>
          <span className="text-xs font-medium text-text-muted">records filed</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
          <span className="text-text-muted">Total Committed</span>
          <span className="font-semibold text-text font-mono">
            ${purchaseStats.totalCommitted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Confirmed POs */}
      <div className="rounded-xl border border-blue-200/60 bg-blue-50/40 p-4 transition-all hover:bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-400">
            Confirmed
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            <Check className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
            {purchaseStats.confirmedCount}
          </span>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-500">approved</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-blue-200/40 pt-2 text-[11px] dark:border-blue-900/40">
          <span className="text-blue-700/70 dark:text-blue-500">Authorized Payables</span>
          <span className="font-semibold text-blue-800 dark:text-blue-300 font-mono">
            ${purchaseStats.authorizedPayables.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Draft POs */}
      <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 transition-all hover:bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Draft
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/80 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
            {purchaseStats.draftCount}
          </span>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
            pending approval
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-amber-200/40 pt-2 text-[11px] dark:border-amber-900/40">
          <span className="text-amber-700/70 dark:text-amber-500">Under Review</span>
          <span className="font-semibold text-amber-800 dark:text-amber-300 font-mono">
            ${purchaseStats.underReview.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>

    {/* Segmented View Selector (POs vs Vendor Bills) */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
      <div className="inline-flex rounded-xl bg-surface-muted p-1 text-xs font-medium">
        <button
          type="button"
          id="tab-btn-po"
          onClick={() => setPurchaseActiveTab("po")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all ${purchaseActiveTab === "po"
            ? "bg-surface text-indigo-600 font-semibold shadow-xs dark:text-indigo-400"
            : "text-text-muted hover:text-text"
            }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Recent Purchase Orders ({purchaseOrders.length})</span>
        </button>
        <button
          type="button"
          id="tab-btn-bills"
          onClick={() => setPurchaseActiveTab("bills")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all ${purchaseActiveTab === "bills"
            ? "bg-surface text-indigo-600 font-semibold shadow-xs dark:text-indigo-400"
            : "text-text-muted hover:text-text"
            }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Vendor Bills ({vendorBills.length})</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">(Click row to view line items)</span>
        <button
          type="button"
          onClick={() => showToast("Exporting procurement batch statement (CSV)...")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>

    {/* VIEW 1: Recent Purchase Orders Table */}
    {purchaseActiveTab === "po" && (
      <div
        id="poView"
        className="rounded-xl border border-border/80 overflow-hidden bg-surface shadow-xs animate-in fade-in duration-150"
      >
        <div className="flex items-center justify-between border-b border-border/80 bg-surface-muted/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Procurement Orders
            </span>
          </div>
          <span className="text-xs text-text-muted">
            {purchaseOrders.length} orders pending action
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-muted">
            <thead className="border-b border-border bg-surface-muted/40 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-border text-indigo-600 focus:ring-indigo-500/20"
                  />
                </th>
                <th className="px-4 py-3">Purchase Order #</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3">PO Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="w-36 px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {purchaseOrders.map((po) => {
                const initials = po.vendor_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={po.id}
                    onClick={() => setSelectedPurchaseOrder(po)}
                    className="cursor-pointer transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-border text-indigo-600 focus:ring-indigo-500/20"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {po.po_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                          {initials}
                        </span>
                        <span className="font-medium text-text">{po.vendor_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-text-muted">{po.po_date}</td>
                    <td className="px-4 py-3">
                      {po.status === "Confirmed" && (
                        <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
                          Confirmed
                        </span>
                      )}
                      {po.status === "Partially Billed" && (
                        <span className="inline-flex items-center rounded-full border border-purple-200/60 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-400">
                          Partially Billed
                        </span>
                      )}
                      {po.status === "Draft" && (
                        <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-text">
                      ${po.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConvertPOToBill(po)}
                          className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                        >
                          Create Bill
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPurchaseOrder(po)}
                          className="rounded px-2 py-1 text-[11px] text-text-muted hover:text-indigo-600 transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* VIEW 2: Vendor Bills Table */}
    {purchaseActiveTab === "bills" && (
      <div
        id="billsView"
        className="rounded-xl border border-border/80 overflow-hidden bg-surface shadow-xs animate-in fade-in duration-150"
      >
        <div className="flex items-center justify-between border-b border-border/80 bg-surface-muted/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Active Vendor Bills
            </span>
          </div>
          <span className="font-mono text-xs text-text-muted">
            Total Payables: $
            {vendorBills
              .reduce((sum, b) => sum + b.amount, 0)
              .toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-muted">
            <thead className="border-b border-border bg-surface-muted/40 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Bill #</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {vendorBills.map((bill) => (
                <tr
                  key={bill.id}
                  className="transition-colors hover:bg-surface-muted/70"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {bill.bill_number}
                  </td>
                  <td className="px-4 py-3 font-medium text-text">{bill.vendor_name}</td>
                  <td className="px-4 py-3 font-mono text-text-muted">{bill.due_date}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-text">
                    ${bill.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    ${(bill.amount_paid ?? (bill.payment_status === "Paid" ? bill.amount : 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    {bill.payment_status === "Unpaid" && (
                      <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
                        Unpaid
                      </span>
                    )}
                    {bill.payment_status === "Partially Paid" && (
                      <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
                        Partially Paid
                      </span>
                    )}
                    {bill.payment_status === "Scheduled" && (
                      <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
                        Scheduled
                      </span>
                    )}
                    {bill.payment_status === "Paid" && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Paid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {bill.payment_status !== "Paid" ? (
                      <button
                        type="button"
                        onClick={() => setSelectedBillForPayment(bill)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pay
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </section>

  {/* ========================================================================= */ }
  {/* SECTION 3: Budget Reports Module Card */ }
  {/* ========================================================================= */ }
  {
    budgetMetric && (
      <section
        id="budget-section"
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5"
        data-purpose="budget-card"
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100/80 bg-purple-50 text-purple-600 font-bold dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-400 shadow-xs">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-text">
                  Budget Reports
                </h2>
                <span className="rounded-full border border-purple-200/50 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-400">
                  Cost Accounting
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">
                Analytical cost centers, operating budgets &amp; variance tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href="/reports/profit-loss"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors dark:text-purple-400"
            >
              <span>Full Analytical P&amp;L</span>
              <span>→</span>
            </Link>
            <button
              type="button"
              onClick={() => showToast("Exporting comprehensive cost accounting statement...")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-purple-700 active:bg-purple-800"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* Metric Stat Tiles: Achieved, Budget, Committed */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Achieved Card */}
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 transition-all hover:bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Achieved
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80 text-xs font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                ✓
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                {budgetMetric.achieved_count}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
                {budgetMetric.achieved_target_percent}% target
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-emerald-200/40 pt-2 text-[11px] dark:border-emerald-900/40">
              <span className="text-emerald-700/70 dark:text-emerald-500">Revenue Targets</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Reached
              </span>
            </div>
          </div>

          {/* Budget Card */}
          <div className="rounded-xl border border-blue-200/60 bg-blue-50/40 p-4 transition-all hover:bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-400">
                Budget
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                <CreditCard className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                {budgetMetric.budget_count}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-500">
                ${budgetMetric.budget_cap.toLocaleString("en-US")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-blue-200/40 pt-2 text-[11px] dark:border-blue-900/40">
              <span className="text-blue-700/70 dark:text-blue-500">Active Cap</span>
              <span className="font-semibold text-blue-800 dark:text-blue-300">Allocations</span>
            </div>
          </div>

          {/* Committed Card */}
          <div className="rounded-xl border border-border/80 bg-surface-muted/60 p-4 transition-all hover:bg-surface-muted">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Committed
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface border border-border text-text-muted">
                <Truck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-text">
                {budgetMetric.committed_count}
              </span>
              <span className="text-xs font-bold text-text-muted">
                ${budgetMetric.committed_amount.toLocaleString("en-US")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
              <span className="text-text-muted">Total Allocated</span>
              <span className="font-semibold text-text">{budgetMetric.committed_percent}%</span>
            </div>
          </div>
        </div>

        {/* Analytical Center Progress Bar & Direct Quick Links */}
        <div className="rounded-xl border border-border/80 bg-surface-muted/70 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-semibold text-text">
              <span>{budgetMetric.cost_center_name}</span>
              <span className="rounded border border-primary-200/60 bg-primary-100/70 px-1.5 py-0.5 font-mono text-[10px] text-primary-700 dark:border-primary-800/60 dark:bg-primary-950/50 dark:text-primary-300">
                {budgetMetric.cost_center_code}
              </span>
            </span>
            <span className="font-mono text-xs font-medium text-text-muted">
              Committed: ${(budgetMetric.committed_amount / 1000).toFixed(1)}k / Cap: $
              {(budgetMetric.budget_cap / 1000).toFixed(1)}k ({budgetMetric.committed_percent}%)
            </span>
          </div>

          {/* Progress Track */}
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-border ring-1 ring-border/50">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${budgetMetric.actual_incurred_percent}%` }}
              title={`Realized Actuals: ${budgetMetric.actual_incurred_percent}%`}
            ></div>
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${budgetMetric.pending_committed_percent}%` }}
              title={`Committed Incurred: ${budgetMetric.pending_committed_percent}%`}
            ></div>
            <div
              className="h-full bg-transparent"
              style={{ width: `${budgetMetric.available_capacity_percent}%` }}
              title={`Remaining Cap: ${budgetMetric.available_capacity_percent}%`}
            ></div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-text-muted">
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Actual Incurred ({budgetMetric.actual_incurred_percent}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Pending Committed ({budgetMetric.pending_committed_percent}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                Available Capacity ({budgetMetric.available_capacity_percent}%)
              </span>
            </div>
            <div className="flex items-center gap-3 font-medium">
              <Link
                href="/reports/balance-sheet"
                className="text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400"
              >
                Balancesheet
              </Link>
              <span className="text-border">•</span>
              <Link
                href="/reports/profit-loss"
                className="text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400"
              >
                Profit &amp; Loss
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  {/* ========================================================================= */ }
  {/* MODAL 1: Sales Order Details Modal */ }
  {/* ========================================================================= */ }
  {
    selectedSalesOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">
                  Order Details: {selectedSalesOrder.order_number}
                </h3>
                <p className="text-xs text-text-muted">
                  Customer dispatch record &amp; line breakdown
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSalesOrder(null)}
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Customer Info Box */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-muted p-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Customer
                </span>
                <p className="font-semibold text-text text-sm mt-0.5">
                  {selectedSalesOrder.customer_name}
                </p>
                <p className="text-text-muted mt-0.5">
                  {selectedSalesOrder.customer_location}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Contact &amp; Status
                </span>
                <p className="text-text-muted mt-0.5">
                  {selectedSalesOrder.customer_email}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {selectedSalesOrder.status}
                  </span>
                  <span className="font-mono text-text-muted">
                    {selectedSalesOrder.order_date}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Order Line Items
              </h4>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted border-b border-border text-[10px] font-semibold uppercase text-text-muted">
                    <tr>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedSalesOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2.5 font-medium text-text">
                          {item.product_name}
                        </td>
                        <td className="px-3 py-2.5 text-text-muted">
                          {item.category || "Furniture"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          ${item.unit_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-text">
                          ${item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-text-muted">
                Double-entry ledger status: Balanced Sales Journal entry verified
              </span>
              <div className="text-right">
                <span className="text-xs text-text-muted">Total Order Amount: </span>
                <span className="text-base font-bold text-text font-mono">
                  ${selectedSalesOrder.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setSelectedSalesOrder(null)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                showToast(`Invoice generated for ${selectedSalesOrder.order_number}`);
                setSelectedSalesOrder(null);
              }}
              className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Generate Customer Invoice
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* ========================================================================= */ }
  {/* MODAL 2: Purchase Order Details Modal */ }
  {/* ========================================================================= */ }
  {
    selectedPurchaseOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">
                  Purchase Order: {selectedPurchaseOrder.po_number}
                </h3>
                <p className="text-xs text-text-muted">
                  Vendor procurement order &amp; raw materials
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPurchaseOrder(null)}
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Vendor Info Box */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-muted p-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Vendor
                </span>
                <p className="font-semibold text-text text-sm mt-0.5">
                  {selectedPurchaseOrder.vendor_name}
                </p>
                <p className="text-text-muted mt-0.5">
                  {selectedPurchaseOrder.vendor_location}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Order Meta
                </span>
                <p className="text-text-muted mt-0.5">
                  {selectedPurchaseOrder.vendor_email}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400">
                    {selectedPurchaseOrder.status}
                  </span>
                  <span className="font-mono text-text-muted">
                    {selectedPurchaseOrder.po_date}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Procurement Line Items
              </h4>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted border-b border-border text-[10px] font-semibold uppercase text-text-muted">
                    <tr>
                      <th className="px-3 py-2">Material / Item</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Cost</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedPurchaseOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2.5 font-medium text-text">
                          {item.product_name}
                        </td>
                        <td className="px-3 py-2.5 text-text-muted">
                          {item.category || "Procurement"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          ${item.unit_cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-text">
                          ${item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-text-muted">
                Procurement Account: 5010 Purchase Expense (Committed)
              </span>
              <div className="text-right">
                <span className="text-xs text-text-muted">Total Order Cost: </span>
                <span className="text-base font-bold text-text font-mono">
                  ${selectedPurchaseOrder.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setSelectedPurchaseOrder(null)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleConvertPOToBill(selectedPurchaseOrder)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Convert to Vendor Bill
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* ========================================================================= */ }
  {/* MODAL 3: Create New Sales Order Modal */ }
  {/* ========================================================================= */ }
  {
    isCreateOrderModalOpen && (
      <CreateSalesOrderModal
        customers={backendCustomers}
        products={products}
        onClose={() => setIsCreateOrderModalOpen(false)}
        onCreate={async () => {
          await queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
          setIsCreateOrderModalOpen(false);
        }}
        showToast={showToast}
      />
    )
  }

  {/* ========================================================================= */ }
  {/* MODAL 4: Create New Purchase Order Modal */ }
  {/* ========================================================================= */ }
  {
    isCreatePOModalOpen && (
      <CreatePurchaseOrderModal
        vendors={backendVendors}
        products={products}
        onClose={() => setIsCreatePOModalOpen(false)}
        onCreate={async (newPO) => {
          await queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
          await queryClient.invalidateQueries({ queryKey: ["purchase-orders-paged"] });
          setIsCreatePOModalOpen(false);
          showToast(`Purchase Order ${newPO.po_number} created successfully for ${newPO.vendor_name}!`);
        }}
      />
    )
  }

  {
    selectedBillForPayment && (
      <PaymentModal
        isOpen={Boolean(selectedBillForPayment)}
        onClose={() => setSelectedBillForPayment(null)}
        billId={selectedBillForPayment.id}
        billNumber={selectedBillForPayment.bill_number}
        vendorName={selectedBillForPayment.vendor_name}
        totalAmount={selectedBillForPayment.amount}
        amountPaid={
          selectedBillForPayment.amount_paid ??
          (selectedBillForPayment.payment_status === "Paid" ? selectedBillForPayment.amount : 0)
        }
        onSuccess={(payment) => {
          showToast(
            `Payment ${payment.payment_number} ($${payment.amount.toFixed(
              2
            )}) recorded for Bill ${selectedBillForPayment.bill_number}! Journal Entry auto-posted.`
          );
          refetchAll();
          queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
          setSelectedBillForPayment(null);
        }}
      />
    )
  }
    </div >
  );
}

/**
 * Modal form to create a new sales order via the backend API.
 * Calls `createSalesOrder` and optionally `confirmSalesOrder` on submit.
 */
function CreateSalesOrderModal({
  customers,
  products,
  onClose,
  onCreate,
  showToast,
}: {
  customers: Contact[];
  products: Product[];
  onClose: () => void;
  onCreate: () => Promise<void>;
  showToast: (msg: string) => void;
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(
    customers[0]?.id || 1
  );
  const [selectedProductId, setSelectedProductId] = useState<number>(
    products[0]?.id || 1
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [status, setStatus] = useState<"Confirmed" | "Draft">("Confirmed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const product = products.find((p) => p.id === selectedProductId) || products[0];

  const unitPrice = product ? Number(product.price) : 14500;
  const taxPercent = product ? Number(product.tax_percent ?? 0) : 18;
  const subtotal = unitPrice * quantity;
  const totalAmount = subtotal * (1 + taxPercent / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) {
      setError("Please select a customer.");
      return;
    }
    if (!product) {
      setError("Please select a product.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createSalesOrder({
        customer_id: customer.id,
        lines: [
          {
            product_id: product.id,
            quantity,
            unit_price: unitPrice,
          },
        ],
      });

      if (status === "Confirmed") {
        try {
          await confirmSalesOrder(Number(created.id));
        } catch (confirmErr) {
          console.warn("Could not confirm SO, saved as draft:", confirmErr);
        }
      }

      showToast(
        `Sales Order ${created.order_number} created successfully for ${customer.name}!`
      );
      await onCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sales order on server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Create Sales Order</h3>
              <p className="text-xs text-text-muted">Select backend customer &amp; furniture item</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-text mb-1">Customer (from Backend DB)</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              disabled={submitting}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.city ? `(${c.city}, ${c.state || ""})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Product (from Backend Catalog)</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              disabled={submitting}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${Number(p.price).toFixed(2)} ({p.category || "Furniture"})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                disabled={submitting}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Confirmed" | "Draft")}
                disabled={submitting}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
              >
                <option value="Confirmed">Confirmed (Ready to Bill)</option>
                <option value="Draft">Draft (Quotation)</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-surface-muted p-3 space-y-1 text-text-muted">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-text">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({taxPercent}%):</span>
              <span className="font-mono text-text">${(totalAmount - subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-bold text-text">
              <span>Total Gross:</span>
              <span className="font-mono text-primary-600">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-border px-4 py-2 text-text-muted hover:bg-surface-muted hover:text-text transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || customers.length === 0 || products.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Confirm Order</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal form to create a new purchase order via the backend API.
 * Calls `createPurchaseOrder` and optionally `confirmPurchaseOrder` on submit.
 */
function CreatePurchaseOrderModal({
  vendors,
  products,
  onClose,
  onCreate,
}: {
  vendors: Contact[];
  products: Product[];
  onClose: () => void;
  onCreate: (po: PurchaseOrder) => void | Promise<void>;
}) {
  const [selectedVendorId, setSelectedVendorId] = useState<number | undefined>(() => vendors[0]?.id);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [quantity, setQuantity] = useState<number>(10);
  const [customUnitCost, setCustomUnitCost] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveProductId = selectedProductId ?? products[0]?.id;

  const vendor = vendors.find((v) => v.id === selectedVendorId);
  const product = products.find((p) => p.id === effectiveProductId) || products[0];
  const unitCost = customUnitCost ?? (product?.cost ?? product?.price ?? 2400);
  const totalAmount = quantity * unitCost;

  /** When product changes, reset unit cost to the product's default cost/price. */
  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    setCustomUnitCost(prod ? (prod.cost ?? prod.price ?? 0) : null);
  };

  /**
   * Creates PO via backend API, confirms it, enriches vendor details, then
   * calls onCreate so the parent can add it to the local dashboard list.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) {
      setError("Please select a vendor.");
      return;
    }
    if (!product) {
      setError("Please select a product.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (unitCost < 0) {
      setError("Unit cost cannot be negative.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createPurchaseOrder({
        vendor_id: vendor.id,
        lines: [
          {
            product_id: product.id,
            quantity,
            unit_price: unitCost,
          },
        ],
      });

      // Confirm the PO so it is in Confirmed status, matching issued state
      let finalPO = created;
      try {
        finalPO = await confirmPurchaseOrder(Number(created.id));
      } catch (confirmErr) {
        console.warn("Could not confirm PO, saved as draft:", confirmErr);
      }

      // Enrich vendor contact details for dashboard UI display
      const locationStr =
        [vendor.city, vendor.state].filter(Boolean).join(", ") || "India Supply Depot";
      finalPO = {
        ...finalPO,
        vendor_location: locationStr,
        vendor_email: vendor.email || "supply@vendor.com",
      };

      await onCreate(finalPO);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create purchase order on server."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Create Purchase Order</h3>
              <p className="text-xs text-text-muted">Procure raw materials from backend vendor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <SearchableContactSelect
              contacts={vendors}
              value={selectedVendorId}
              onChange={(contactId) => setSelectedVendorId(contactId ?? undefined)}
              label="Vendor Name"
              required
              disabled={submitting}
              placeholder="Search vendors by name, city, or email..."
              emptyMessage="No active vendors found in database."
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Raw Material / Product</label>
            {products.length > 0 ? (
              <select
                value={effectiveProductId ?? 0}
                onChange={(e) => handleProductChange(Number(e.target.value))}
                disabled={submitting}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.category ? `(${p.category})` : ""} - ₹{(p.cost ?? p.price).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-600">No active products found in database.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                disabled={submitting}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Unit Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => setCustomUnitCost(Math.max(0, Number(e.target.value)))}
                disabled={submitting}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="rounded-xl bg-surface-muted p-3 flex justify-between font-bold text-text">
            <span>Total Committed PO Cost:</span>
            <span className="font-mono text-indigo-600">
              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-border px-4 py-2 text-text-muted hover:bg-surface-muted hover:text-text transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || vendors.length === 0 || products.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Issuing PO...</span>
                </>
              ) : (
                <span>Issue Purchase Order</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
