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
import {
  DashboardMetricCard,
  DashboardModal,
  DashboardPanel,
  DashboardPanelHeader,
  DashboardTableCard,
} from "@/features/dashboard/components/dashboard-card";

import type {
  Contact,
  Product,
  SalesOrder,
  PurchaseOrder,
  VendorBill,
  BudgetMetric,
} from "@/lib/types";
import {
  fetchDashboardContacts,
  fetchDashboardProducts,
  buildDashboardDataFromBackend,
} from "@/features/dashboard/dashboard-api";

export default function AppDashboardPage() {
  // Backend Data State
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Dashboard Entity State
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [budgetMetric, setBudgetMetric] = useState<BudgetMetric | null>(null);

  // Filter & View States
  const [salesFilterStatus, setSalesFilterStatus] = useState<string>("all");
  const [salesSearchQuery, setSalesSearchQuery] = useState<string>("");
  const [purchaseActiveTab, setPurchaseActiveTab] = useState<"po" | "bills">("po");

  // Selected Order / PO for Inspection Modals
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);

  // Create Modals
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Refresh backend master data on demand
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedContacts, fetchedProducts] = await Promise.all([
        fetchDashboardContacts(),
        fetchDashboardProducts(),
      ]);

      setContacts(fetchedContacts);
      setProducts(fetchedProducts);

      const dashboardData = buildDashboardDataFromBackend(
        fetchedContacts,
        fetchedProducts
      );

      setSalesOrders(dashboardData.salesOrders);
      setPurchaseOrders(dashboardData.purchaseOrders);
      setVendorBills(dashboardData.vendorBills);
      setBudgetMetric(dashboardData.budgetMetric);
      showToast("Backend data refreshed successfully.");
    } catch (err) {
      console.error("Failed to refresh dashboard data:", err);
      showToast("Could not sync with backend. Using cached domain models.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial data loading on mount
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [fetchedContacts, fetchedProducts] = await Promise.all([
          fetchDashboardContacts(),
          fetchDashboardProducts(),
        ]);

        if (ignore) return;
        setContacts(fetchedContacts);
        setProducts(fetchedProducts);

        const dashboardData = buildDashboardDataFromBackend(
          fetchedContacts,
          fetchedProducts
        );

        setSalesOrders(dashboardData.salesOrders);
        setPurchaseOrders(dashboardData.purchaseOrders);
        setVendorBills(dashboardData.vendorBills);
        setBudgetMetric(dashboardData.budgetMetric);
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load dashboard data:", err);
          showToast("Could not sync with backend. Using cached domain models.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void init();
    return () => {
      ignore = true;
    };
  }, [showToast]);

  // Keyboard shortcut ESC to close modals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedSalesOrder(null);
        setSelectedPurchaseOrder(null);
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
    return contacts.filter((c) => c.type === "customer" || c.type === "both");
  }, [contacts]);

  const backendVendors = useMemo(() => {
    return contacts.filter((c) => c.type === "vendor" || c.type === "both");
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
        order.customer_location.toLowerCase().includes(query) ||
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

  // Direct Create Bill action on a PO
  const handleConvertPOToBill = useCallback((po: PurchaseOrder) => {
    const randomSuffix = Math.floor(400 + Math.random() * 90);
    const newBillNumber = `BILL-2025-0${randomSuffix}`;
    const newBill: VendorBill = {
      id: `bill-${Date.now()}`,
      bill_number: newBillNumber,
      vendor_name: po.vendor_name,
      due_date: "Mar 25, 2025",
      amount: po.total_amount,
      payment_status: "Unpaid",
    };

    setVendorBills((prev) => [newBill, ...prev]);
    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === po.id ? { ...p, status: "Partially Billed" } : p
      )
    );
    setSelectedPurchaseOrder(null);
    showToast(
      `Vendor Bill ${newBillNumber} created for ${po.vendor_name} ($${po.total_amount.toLocaleString(
        "en-US",
        { minimumFractionDigits: 2 }
      )})`
    );
    setPurchaseActiveTab("bills");
  }, [showToast]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}


      {/* ========================================================================= */}
      {/* SECTION 1: Sales Module Card */}
      {/* ========================================================================= */}
      <DashboardPanel id="sales-section" purpose="sales-card">
        <DashboardPanelHeader
          icon={LineChart}
          tone="blue"
          title="Sales"
          badge="Customer Invoicing & Dispatch"
          description="Furniture sales contracts, commercial invoicing & collections"
          actions={
            <>
            <Link
              href="/sales-orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              <span>View all sales orders</span>
              <span>→</span>
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-primary-600 disabled:opacity-50"
              title="Refresh backend data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOrderModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary-700 active:bg-primary-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Order</span>
            </button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashboardMetricCard
            title="All"
            icon={Package}
            value={salesStats.totalCount}
            valueDetail="active orders"
            footerLabel="Total Gross"
            footerValue={`$${salesStats.totalGross.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
          <DashboardMetricCard
            title="Confirmed"
            icon={Check}
            tone="emerald"
            value={salesStats.confirmedCount}
            valueDetail="ready / billed"
            footerLabel="Realized Revenue"
            footerValue={`$${salesStats.realizedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
          <DashboardMetricCard
            title="Draft"
            icon={Clock}
            tone="amber"
            value={salesStats.draftCount}
            valueDetail="quotations"
            footerLabel="Pipeline Value"
            footerValue={`$${salesStats.pipelineValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={salesSearchQuery}
              onChange={(e) => setSalesSearchQuery(e.target.value)}
              placeholder="Search SO #, Customer, location, item..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2 pl-9 pr-4 text-xs text-text placeholder-text-muted transition-all focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="inline-flex rounded-xl bg-surface-muted p-1 text-xs font-medium text-text-muted">
              <button
                type="button"
                onClick={() => setSalesFilterStatus("all")}
                className={`rounded-lg px-3 py-1 transition-all ${
                  salesFilterStatus === "all"
                    ? "bg-surface text-primary-600 font-semibold shadow-xs"
                    : "hover:text-text"
                }`}
              >
                All ({salesStats.totalCount})
              </button>
              <button
                type="button"
                onClick={() => setSalesFilterStatus("Confirmed")}
                className={`rounded-lg px-3 py-1 transition-all ${
                  salesFilterStatus === "Confirmed"
                    ? "bg-surface text-primary-600 font-semibold shadow-xs"
                    : "hover:text-text"
                }`}
              >
                Confirmed ({salesStats.confirmedCount})
              </button>
              <button
                type="button"
                onClick={() => setSalesFilterStatus("Draft")}
                className={`rounded-lg px-3 py-1 transition-all ${
                  salesFilterStatus === "Draft"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted" />
              <span>Date Range</span>
            </button>
          </div>
        </div>

        <DashboardTableCard
          title="Recent Sales Orders"
          count="(Click row to inspect order details)"
          actions={
            <>
              <button
                onClick={() => showToast("Showing 8 linked Customer Invoices")}
                className="rounded-md px-2 py-0.5 font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
              >
                Sale Invoices (8)
              </button>
              <span className="text-border">|</span>
              <button
                onClick={() => showToast("Showing 10 linked Payment Receipts")}
                className="rounded-md px-2 py-0.5 font-medium text-text-muted hover:bg-surface-muted hover:text-primary-600 transition-colors"
              >
                Receipts (10)
              </button>
            </>
          }
        >

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
        </DashboardTableCard>
      </DashboardPanel>

      {/* ========================================================================= */}
      {/* SECTION 2: Purchase Module Card */}
      {/* ========================================================================= */}
      <DashboardPanel id="purchase-section" purpose="purchase-card">
        <DashboardPanelHeader
          icon={ShoppingCart}
          tone="indigo"
          title="Purchase"
          badge="Procurement & Payables"
          description="Raw materials procurement, timber/hardware supplies & vendor payables"
          actions={
            <>
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
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashboardMetricCard
            title="All Bills / POs"
            icon={Receipt}
            value={purchaseStats.totalRecords}
            valueDetail="records filed"
            footerLabel="Total Committed"
            footerValue={`$${purchaseStats.totalCommitted.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
          <DashboardMetricCard
            title="Confirmed"
            icon={Check}
            tone="blue"
            value={purchaseStats.confirmedCount}
            valueDetail="approved"
            footerLabel="Authorized Payables"
            footerValue={`$${purchaseStats.authorizedPayables.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
          <DashboardMetricCard
            title="Draft"
            icon={Clock}
            tone="amber"
            value={purchaseStats.draftCount}
            valueDetail="pending approval"
            footerLabel="Under Review"
            footerValue={`$${purchaseStats.underReview.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
        </div>

        {/* Segmented View Selector (POs vs Vendor Bills) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="inline-flex rounded-xl bg-surface-muted p-1 text-xs font-medium">
            <button
              type="button"
              id="tab-btn-po"
              onClick={() => setPurchaseActiveTab("po")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all ${
                purchaseActiveTab === "po"
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
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all ${
                purchaseActiveTab === "bills"
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
          <DashboardTableCard
            id="poView"
            tone="indigo"
            title="Procurement Orders"
            count={`${purchaseOrders.length} orders pending action`}
            className="animate-in fade-in duration-150"
          >
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
          </DashboardTableCard>
        )}

        {/* VIEW 2: Vendor Bills Table */}
        {purchaseActiveTab === "bills" && (
          <DashboardTableCard
            id="billsView"
            tone="blue"
            title="Active Vendor Bills"
            count={
              <span className="font-mono text-xs text-text-muted">
                Total Payables: ${vendorBills
                  .reduce((sum, b) => sum + b.amount, 0)
                  .toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            }
            className="animate-in fade-in duration-150"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-muted">
                <thead className="border-b border-border bg-surface-muted/40 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-3">Bill #</th>
                    <th className="px-4 py-3">Vendor Name</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Payment Status</th>
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
                      <td className="px-4 py-3">
                        {bill.payment_status === "Unpaid" && (
                          <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
                            Unpaid
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardTableCard>
        )}
      </DashboardPanel>

      {/* ========================================================================= */}
      {/* SECTION 3: Budget Reports Module Card */}
      {/* ========================================================================= */}
      {budgetMetric && (
        <DashboardPanel id="budget-section" purpose="budget-card">
          <DashboardPanelHeader
            icon={BarChart3}
            tone="purple"
            title="Budget Reports"
            badge="Cost Accounting"
            description="Analytical cost centers, operating budgets & variance tracking"
            actions={
              <>
              <button
                type="button"
                onClick={() => showToast("Loading Full Analytical Profit & Loss report...")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors dark:text-purple-400"
              >
                <span>Full Analytical P&amp;L</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => showToast("Exporting comprehensive cost accounting statement...")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-purple-700 active:bg-purple-800"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Report</span>
              </button>
              </>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DashboardMetricCard
              title="Achieved"
              icon={Check}
              tone="emerald"
              value={budgetMetric.achieved_count}
              valueDetail={`${budgetMetric.achieved_target_percent}% target`}
              footerLabel="Revenue Targets"
              footerValue="Reached"
            />
            <DashboardMetricCard
              title="Budget"
              icon={CreditCard}
              tone="blue"
              value={budgetMetric.budget_count}
              valueDetail={`$${budgetMetric.budget_cap.toLocaleString("en-US")}`}
              footerLabel="Active Cap"
              footerValue="Allocations"
            />
            <DashboardMetricCard
              title="Committed"
              icon={Truck}
              value={budgetMetric.committed_count}
              valueDetail={`$${budgetMetric.committed_amount.toLocaleString("en-US")}`}
              footerLabel="Total Allocated"
              footerValue={`${budgetMetric.committed_percent}%`}
            />
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
                Committed: $512.3k / Cap: $650.0k ({budgetMetric.committed_percent}%)
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
                <button
                  type="button"
                  onClick={() => showToast("Opening Balancesheet report...")}
                  className="text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400"
                >
                  Balancesheet
                </button>
                <span className="text-border">•</span>
                <button
                  type="button"
                  onClick={() => showToast("Opening Profit & Loss statement...")}
                  className="text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400"
                >
                  Profit &amp; Loss
                </button>
              </div>
            </div>
          </div>
        </DashboardPanel>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Sales Order Details Modal */}
      {/* ========================================================================= */}
      {selectedSalesOrder && (
        <DashboardModal
          icon={FileText}
          tone="blue"
          title={`Order Details: ${selectedSalesOrder.order_number}`}
          description="Customer dispatch record & line breakdown"
          onClose={() => setSelectedSalesOrder(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedSalesOrder(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Invoice generated for ${selectedSalesOrder.order_number}`);
                  setSelectedSalesOrder(null);
                }}
                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                Generate Customer Invoice
              </button>
            </>
          }
        >
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
        </DashboardModal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Purchase Order Details Modal */}
      {/* ========================================================================= */}
      {selectedPurchaseOrder && (
        <DashboardModal
          icon={ShoppingCart}
          tone="indigo"
          title={`Purchase Order: ${selectedPurchaseOrder.po_number}`}
          description="Vendor procurement order & raw materials"
          onClose={() => setSelectedPurchaseOrder(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedPurchaseOrder(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleConvertPOToBill(selectedPurchaseOrder)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Convert to Vendor Bill
              </button>
            </>
          }
        >
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
        </DashboardModal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Create New Sales Order Modal */}
      {/* ========================================================================= */}
      {isCreateOrderModalOpen && (
        <CreateSalesOrderModal
          customers={backendCustomers}
          products={products}
          onClose={() => setIsCreateOrderModalOpen(false)}
          onCreate={(newOrder) => {
            setSalesOrders((prev) => [newOrder, ...prev]);
            setIsCreateOrderModalOpen(false);
            showToast(`Sales Order ${newOrder.order_number} created successfully for ${newOrder.customer_name}!`);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Create New Purchase Order Modal */}
      {/* ========================================================================= */}
      {isCreatePOModalOpen && (
        <CreatePurchaseOrderModal
          vendors={backendVendors}
          products={products}
          onClose={() => setIsCreatePOModalOpen(false)}
          onCreate={(newPO) => {
            setPurchaseOrders((prev) => [newPO, ...prev]);
            setIsCreatePOModalOpen(false);
            showToast(`Purchase Order ${newPO.po_number} created successfully for ${newPO.vendor_name}!`);
          }}
        />
      )}
    </div>
  );
}

// Subcomponent: Modal to create Sales Order using backend Contacts & Products
function CreateSalesOrderModal({
  customers,
  products,
  onClose,
  onCreate,
}: {
  customers: Contact[];
  products: Product[];
  onClose: () => void;
  onCreate: (order: SalesOrder) => void;
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(
    customers[0]?.id || 1
  );
  const [selectedProductId, setSelectedProductId] = useState<number>(
    products[0]?.id || 1
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [status, setStatus] = useState<"Confirmed" | "Draft">("Confirmed");

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const product = products.find((p) => p.id === selectedProductId) || products[0];

  const unitPrice = product ? Number(product.price) : 14500;
  const taxPercent = product ? Number(product.tax_percent) : 18;
  const subtotal = unitPrice * quantity;
  const totalAmount = subtotal * (1 + taxPercent / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    const locationStr = [customer.city, customer.state].filter(Boolean).join(", ") || "India Delivery Hub";

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      order_number: `SO-2025-0${Math.floor(892 + Math.random() * 90)}`,
      contact_id: customer.id,
      customer_name: customer.name,
      customer_location: locationStr,
      customer_email: customer.email || "procurement@client.com",
      customer_phone: customer.mobile || "+91 98000 00000",
      order_date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status,
      total_amount: Math.round(totalAmount * 100) / 100,
      items: [
        {
          product_name: product?.name || "Executive Ergonomic Chair",
          category: product?.category || "Furniture",
          quantity,
          unit_price: unitPrice,
          tax_percent: taxPercent,
          total: Math.round(totalAmount * 100) / 100,
        },
      ],
    };

    onCreate(newOrder);
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
            className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-text mb-1">Customer (from Backend DB)</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Confirmed" | "Draft")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
              className="rounded-xl border border-border px-4 py-2 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              Confirm Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponent: Modal to create Purchase Order using backend Vendors & Products
function CreatePurchaseOrderModal({
  vendors,
  products,
  onClose,
  onCreate,
}: {
  vendors: Contact[];
  products: Product[];
  onClose: () => void;
  onCreate: (po: PurchaseOrder) => void;
}) {
  const [selectedVendorId, setSelectedVendorId] = useState<number>(
    vendors[0]?.id || 1
  );
  const [materialDescription, setMaterialDescription] = useState<string>(
    "Kiln-Dried Teak Wood Planks"
  );
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(2400);

  const vendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
  const totalAmount = quantity * unitCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    const locationStr = [vendor.city, vendor.state].filter(Boolean).join(", ") || "India Supply Depot";

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      po_number: `PO-2025-0${Math.floor(90 + Math.random() * 50)}`,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      vendor_location: locationStr,
      vendor_email: vendor.email || "supply@vendor.com",
      po_date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: "Confirmed",
      total_amount: totalAmount,
      items: [
        {
          product_name: materialDescription,
          category: "Lumber & Hardware",
          quantity,
          unit_cost: unitCost,
          total: totalAmount,
        },
      ],
    };

    onCreate(newPO);
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
            className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-text mb-1">Vendor (from Backend DB)</label>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.city ? `(${v.city}, ${v.state || ""})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Raw Material / Component</label>
            <select
              value={materialDescription}
              onChange={(e) => {
                const val = e.target.value;
                setMaterialDescription(val);
                const matched = products.find((p) => p.name === val);
                if (matched) {
                  setUnitCost(matched.cost ?? matched.price);
                }
              }}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {products.length > 0 ? (
                products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} {p.category ? `(${p.category})` : ""} - ₹{p.cost ?? p.price}
                  </option>
                ))
              ) : (
                <>
                  <option value="Kiln-Dried Teak Wood Planks">Kiln-Dried Teak Wood Planks (Timber)</option>
                  <option value="Oak Veneer Sheets (Grade A)">Oak Veneer Sheets (Grade A)</option>
                  <option value="Heavy-Duty Ergonomic Casters & Gas Lifts">Heavy-Duty Ergonomic Casters &amp; Gas Lifts</option>
                  <option value="High-Density Polyurethane Foam Cushions">High-Density Polyurethane Foam Cushions</option>
                  <option value="Stainless Steel Assembly Fasteners">Stainless Steel Assembly Fasteners</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Unit Cost ($)</label>
              <input
                type="number"
                min="1"
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="rounded-xl bg-surface-muted p-3 flex justify-between font-bold text-text">
            <span>Total Committed PO Cost:</span>
            <span className="font-mono text-indigo-600">${totalAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
