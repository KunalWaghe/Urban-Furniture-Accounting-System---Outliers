/**
 * New Sales Order form — create draft or confirmed SO with line items.
 *
 * Data flow:
 * - Master data queries: customers, products, income accounts (for dropdowns)
 * - Submit: createSalesOrder
 * - Optional confirm: confirmSalesOrder (when user chooses "Confirm Order")
 *
 * Form state (local useState): customer, date, line rows, validation error, submitting flag.
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  confirmSalesOrder,
  createSalesOrder,
  fetchCustomers,
  fetchIncomeAccounts,
  fetchProducts,
} from "./sales-orders-api";
import { formatINR } from "@/lib/format";

/** One editable row in the line items table. */
interface LineRow {
  key: string;
  productId: string;
  accountId: string;
  quantity: string;
  unitPrice: string;
}

function emptyLine(): LineRow {
  return {
    key: crypto.randomUUID(),
    productId: "",
    accountId: "",
    quantity: "1",
    unitPrice: "",
  };
}

function lineTotal(line: LineRow): number {
  const qty = Number(line.quantity);
  const price = Number(line.unitPrice);
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
  return qty * price;
}

export function SalesOrderFormPage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [orderDate, setOrderDate] = useState(today);
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Master data queries from live API ──────────────────────────────────────
  const customersQuery = useQuery({ queryKey: ["so-customers"], queryFn: fetchCustomers });
  const productsQuery = useQuery({ queryKey: ["so-products"], queryFn: fetchProducts });
  const accountsQuery = useQuery({ queryKey: ["so-income-accounts"], queryFn: fetchIncomeAccounts });

  const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data]);
  const products = productsQuery.data ?? [];
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  const defaultAccountId = useMemo(() => {
    const salesIncome = accounts.find((a) => a.code === "4010" || a.name?.toLowerCase().includes("sales"));
    return salesIncome?.id ?? accounts[0]?.id;
  }, [accounts]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customerSearch, customers]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const grandTotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const loadingMaster = customersQuery.isLoading || productsQuery.isLoading || accountsQuery.isLoading;

  function handleAddLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function handleRemoveLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function handleLineChange(key: string, patch: Partial<LineRow>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const updated = { ...l, ...patch };
        // Auto-fill price when product changes
        if (patch.productId !== undefined && patch.productId !== l.productId) {
          const prod = products.find((p) => String(p.id) === patch.productId);
          if (prod && !patch.unitPrice) {
            updated.unitPrice = String(prod.price ?? "");
          }
        }
        return updated;
      })
    );
  }

  async function handleSubmit(e: React.FormEvent, shouldConfirm: boolean) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer for this sales order.");
      return;
    }

    const cleanLines = lines.map((l) => ({
      product_id: Number(l.productId),
      account_id: l.accountId ? Number(l.accountId) : defaultAccountId,
      quantity: Number(l.quantity),
      unit_price: Number(l.unitPrice),
    }));

    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];
      if (!line.product_id || Number.isNaN(line.product_id)) {
        setError(`Please pick a product for line #${i + 1}.`);
        return;
      }
      if (!line.quantity || line.quantity <= 0) {
        setError(`Line #${i + 1} quantity must be greater than 0.`);
        return;
      }
      if (line.unit_price < 0 || Number.isNaN(line.unit_price)) {
        setError(`Line #${i + 1} unit price cannot be negative.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const created = await createSalesOrder({
        customer_id: customerId,
        order_date: new Date(orderDate).toISOString(),
        lines: cleanLines,
      });

      if (shouldConfirm) {
        await confirmSalesOrder(Number(created.id));
      }

      router.push(`/sales-orders/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sales order.");
      setSubmitting(false);
    }
  }

  if (loadingMaster) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner label="Loading customer and product catalog..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── Breadcrumbs & Back link ───────────────────────────────────────── */}
      <Link
        href="/sales-orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Sales Orders
      </Link>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          New Sales Order
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Record customer item selections, assign sales income accounts, and initiate fulfillment.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <form className="space-y-6">
        {/* ── Order Header Info Card ─────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Customer & Order Details
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Customer Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Filter customers by name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-hidden"
                />
                <select
                  value={customerId ?? ""}
                  onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a Customer...</option>
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.city ? `(${c.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCustomer && (
                <p className="text-[11px] text-text-muted">
                  Email: {selectedCustomer.email || "N/A"} · City: {selectedCustomer.city || "N/A"}
                </p>
              )}
            </div>

            {/* Order Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                required
              />
              <p className="text-[11px] text-text-muted">
                Standard credit payment term: 14 days from invoicing date.
              </p>
            </div>
          </div>
        </div>

        {/* ── Line Items Card ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                Order Line Items
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Select products from inventory and confirm sales pricing.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-elevated text-xs font-semibold uppercase text-text-muted">
                <tr>
                  <th className="px-3 py-2.5">Product</th>
                  <th className="px-3 py-2.5">Sales Account</th>
                  <th className="w-24 px-3 py-2.5 text-right">Qty</th>
                  <th className="w-36 px-3 py-2.5 text-right">Unit Price (₹)</th>
                  <th className="w-36 px-3 py-2.5 text-right">Subtotal (₹)</th>
                  <th className="w-12 px-3 py-2.5 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, idx) => {
                  const subtotal = lineTotal(line);
                  return (
                    <tr key={line.key}>
                      {/* Product Selector */}
                      <td className="px-3 py-2.5">
                        <select
                          value={line.productId}
                          onChange={(e) => handleLineChange(line.key, { productId: e.target.value })}
                          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary focus:border-primary-500 focus:outline-hidden"
                          required
                        >
                          <option value="">Select product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.category ? `(${p.category})` : ""} — {formatINR(p.price)}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Income Account */}
                      <td className="px-3 py-2.5">
                        <select
                          value={line.accountId || defaultAccountId || ""}
                          onChange={(e) => handleLineChange(line.key, { accountId: e.target.value })}
                          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary focus:border-primary-500 focus:outline-hidden"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(line.key, { quantity: e.target.value })}
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-right text-xs text-text-primary focus:border-primary-500 focus:outline-hidden"
                          required
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(line.key, { unitPrice: e.target.value })}
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-right text-xs text-text-primary focus:border-primary-500 focus:outline-hidden"
                          required
                        />
                      </td>

                      {/* Subtotal */}
                      <td className="px-3 py-2.5 text-right font-semibold text-text-primary">
                        {formatINR(subtotal)}
                      </td>

                      {/* Delete */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          disabled={lines.length <= 1}
                          onClick={() => handleRemoveLine(line.key)}
                          className="text-text-muted transition-colors hover:text-red-500 disabled:opacity-30"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Financial Summary Box ────────────────────────────────────── */}
          <div className="mt-6 flex justify-end border-t border-border pt-4">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span className="font-medium text-text-primary">{formatINR(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Tax (GST)</span>
                <span>Included / 0.00</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-text-primary">
                <span>Grand Total</span>
                <span className="text-primary-600">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form Actions Bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/sales-orders")}
            disabled={submitting}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, false)}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, true)}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Processing..." : "Confirm Order"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
