/**
 * New Purchase Order form — create draft or confirmed PO with line items.
 *
 * Data flow:
 * - Master data queries: vendors, products, expense accounts (for dropdowns)
 * - Submit: createPurchaseOrder → POST /purchase-orders
 * - Optional confirm: confirmPurchaseOrder → PATCH /confirm (when not saving as draft)
 *
 * Form state (local useState): vendor, date, line rows, validation error, submitting flag.
 * No React Query mutations — save uses direct API calls then router.push to detail page.
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { SearchableContactSelect } from "@/components/searchable-contact-select";
import { Button } from "@/components/ui/button";
import {
  confirmPurchaseOrder,
  createPurchaseOrder,
  fetchExpenseAccounts,
  fetchProducts,
  fetchVendors,
  updatePurchaseOrder,
  type PurchaseOrderApi,
} from "@/features/purchase-orders/purchase-orders-api";
import { formatINR, todayDate } from "@/lib/format";

/** One editable row in the line items table (all fields stored as strings for inputs). */
interface LineRow {
  key: string;
  productId: string;
  accountId: string;
  quantity: string;
  unitPrice: string;
}

/** Creates a blank line row with a unique key for React list rendering. */
function emptyLine(): LineRow {
  return {
    key: crypto.randomUUID(),
    productId: "",
    accountId: "",
    quantity: "1",
    unitPrice: "",
  };
}

/** Computes qty × unit price for one line (returns 0 if inputs are invalid). */
function lineTotal(line: LineRow): number {
  const qty = Number(line.quantity);
  const price = Number(line.unitPrice);
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
  return qty * price;
}

/**
 * Form page for creating a new purchase order with vendor, date, and line items.
 * Supports "Save as Draft" or "Confirm" on submit.
 */
export function PurchaseOrderFormPage({ initialOrder }: { initialOrder?: PurchaseOrderApi }) {
  const router = useRouter();
  const today = todayDate();
  const isEditing = Boolean(initialOrder);

  // ── Form state (local — not synced to URL or server until submit) ────────
  const [vendorId, setVendorId] = useState<number | null>(initialOrder?.vendor_id ?? null);
  const [poDate, setPoDate] = useState(initialOrder?.order_date.slice(0, 10) ?? today);
  const [lines, setLines] = useState<LineRow[]>(() => initialOrder?.lines.length ? initialOrder.lines.map((line) => ({
    key: String(line.id),
    productId: String(line.product_id),
    accountId: line.account_id ? String(line.account_id) : "",
    quantity: String(line.quantity),
    unitPrice: String(line.unit_price),
  })) : [emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  // ── Master data for dropdowns (React Query → purchase-orders-api) ────────
  const vendorsQuery = useQuery({ queryKey: ["po-vendors"], queryFn: fetchVendors });
  const productsQuery = useQuery({ queryKey: ["po-products"], queryFn: fetchProducts });
  const accountsQuery = useQuery({ queryKey: ["po-expense-accounts"], queryFn: fetchExpenseAccounts });

  const vendors = useMemo(() => vendorsQuery.data ?? [], [vendorsQuery.data]);
  const products = productsQuery.data ?? [];
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  const defaultAccountId = useMemo(() => {
    const purchaseExpense = accounts.find((a) => a.code === "5010" || a.name === "Purchase Expense");
    return purchaseExpense?.id ?? accounts[0]?.id;
  }, [accounts]);

  const grandTotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  const loadingMaster = vendorsQuery.isLoading || productsQuery.isLoading || accountsQuery.isLoading;

  /** Updates one line row by its unique key. */
  function updateLine(key: string, patch: Partial<LineRow>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  /** When product changes, auto-fill unit price from product cost/price. */
  function onProductChange(key: string, productId: string) {
    const product = products.find((p) => p.id === Number(productId));
    updateLine(key, {
      productId,
      unitPrice: product ? String(product.cost ?? product.price ?? "") : "",
    });
  }

  /** Client-side validation before submit; returns error message or null. */
  function validate(): string | null {
    if (!vendorId) return "Vendor is required.";
    if (!poDate) return "PO date is required.";
    if (lines.length === 0) return "Add at least one line item.";

    for (const [index, line] of lines.entries()) {
      if (!line.productId) return `Line ${index + 1}: product is required.`;
      const qty = Number(line.quantity);
      const price = Number(line.unitPrice);
      if (!Number.isFinite(qty) || qty <= 0) return `Line ${index + 1}: quantity must be greater than 0.`;
      if (!Number.isFinite(price) || price < 0) return `Line ${index + 1}: unit price cannot be negative.`;
    }

    return null;
  }

  /** Builds the JSON body sent to POST /purchase-orders. */
  function buildPayload() {
    return {
      vendor_id: vendorId!,
      order_date: `${poDate}T00:00:00`,
      lines: lines.map((line) => ({
        product_id: Number(line.productId),
        account_id: line.accountId ? Number(line.accountId) : defaultAccountId,
        quantity: Number(line.quantity),
        unit_price: Number(line.unitPrice),
      })),
    };
  }

  /**
   * Saves the PO. If asDraft is false, also confirms it immediately after create.
   * On success, navigates to the new PO detail page.
   */
  async function handleSave(asDraft: boolean) {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    if (!isEditing && createdOrderId) {
      try {
        if (!asDraft) {
          await confirmPurchaseOrder(createdOrderId);
        }
        router.push(`/purchase-orders/${createdOrderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to confirm the existing purchase order.");
        setSubmitting(false);
      }
      return;
    }

    let persistedOrderId: number | null = null;
    try {
      const saved = isEditing
        ? await updatePurchaseOrder(initialOrder!.id, buildPayload())
        : await createPurchaseOrder(buildPayload());
      if (!isEditing) {
        persistedOrderId = Number(saved.id);
        setCreatedOrderId(persistedOrderId);
      }
      if (!isEditing && !asDraft) {
        await confirmPurchaseOrder(persistedOrderId!);
      }
      router.push(`/purchase-orders/${saved.id}`);
    } catch (err) {
      setError(
        persistedOrderId && !asDraft
          ? `Purchase order #${persistedOrderId} was created as a draft, but confirmation failed. Retry to confirm this existing order.`
          : err instanceof Error
            ? err.message
            : "Failed to save purchase order"
      );
      setSubmitting(false);
    }
  }

  if (loadingMaster) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Link
        href="/purchase-orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Purchase Orders
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{isEditing ? `Edit ${initialOrder?.po_number}` : "New Purchase Order"}</h1>
        <p className="mt-1 text-sm text-text-muted">{isEditing ? "Update this draft purchase order before confirming it." : "Create a draft purchase order, then save or confirm it."}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-semibold text-text">Order Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Status</label>
                <input readOnly value="Draft" className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text-muted" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">PO Date *</label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <SearchableContactSelect
                  contacts={vendors}
                  value={vendorId}
                  onChange={setVendorId}
                  label="Vendor Name"
                  required
                  disabled={submitting}
                  placeholder="Search vendors by name, city, or email..."
                  emptyMessage="No active vendors found."
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-text">Line Items</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
                <Plus className="h-4 w-4" />
                Add Line
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {lines.map((line, index) => (
                <div key={line.key} className="rounded-xl border border-border bg-surface-muted/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Line {index + 1}</span>
                    <button
                      type="button"
                      disabled={lines.length === 1}
                      onClick={() => setLines((prev) => prev.filter((row) => row.key !== line.key))}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-red-600 disabled:opacity-40"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-text-muted">Product *</label>
                      <select
                        value={line.productId}
                        onChange={(e) => onProductChange(line.key, e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
                      >
                        <option value="">Select product...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} — Cost {formatINR(product.cost ?? product.price ?? 0)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Purchase Account</label>
                      <select
                        value={line.accountId || String(defaultAccountId ?? "")}
                        onChange={(e) => updateLine(line.key, { accountId: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
                      >
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Qty *</label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Unit Price *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Total</label>
                      <p className="mt-2 font-mono font-semibold text-text">{formatINR(lineTotal(line))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-text">Summary</h3>
          <p className="mt-4 font-mono text-3xl font-bold text-primary-600">{formatINR(grandTotal)}</p>
          <p className="mt-1 text-xs text-text-muted">Currency: INR ₹</p>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex flex-col gap-2">
            {!isEditing && <Button type="button" disabled={submitting} onClick={() => void handleSave(false)}>
              {submitting ? "Saving…" : "Confirm"}
            </Button>}
            <Button type="button" variant={isEditing ? "default" : "outline"} disabled={submitting} onClick={() => void handleSave(true)}>
              {submitting ? "Saving…" : isEditing ? "Save Changes" : "Save as Draft"}
            </Button>
            <Link
              href="/purchase-orders"
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-muted"
            >
              Cancel
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
