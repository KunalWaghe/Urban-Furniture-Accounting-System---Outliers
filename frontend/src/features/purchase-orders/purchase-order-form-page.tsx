"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  confirmPurchaseOrder,
  createPurchaseOrder,
  fetchExpenseAccounts,
  fetchProducts,
  fetchVendors,
} from "@/features/purchase-orders/purchase-orders-api";
import { formatINR } from "@/lib/format";

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

export function PurchaseOrderFormPage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [poDate, setPoDate] = useState(today);
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendorSearch, vendors]);

  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const grandTotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  const loadingMaster = vendorsQuery.isLoading || productsQuery.isLoading || accountsQuery.isLoading;

  function updateLine(key: string, patch: Partial<LineRow>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function onProductChange(key: string, productId: string) {
    const product = products.find((p) => p.id === Number(productId));
    updateLine(key, {
      productId,
      unitPrice: product ? String(product.cost ?? product.price ?? "") : "",
    });
  }

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

  async function handleSave(asDraft: boolean) {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const created = await createPurchaseOrder(buildPayload());
      if (!asDraft) {
        await confirmPurchaseOrder(Number(created.id));
      }
      router.push(`/purchase-orders/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save purchase order");
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
        <h1 className="text-2xl font-bold tracking-tight text-text">New Purchase Order</h1>
        <p className="mt-1 text-sm text-text-muted">Create a draft purchase order, then save or confirm it.</p>
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
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Vendor Name *</label>
                <input
                  type="search"
                  value={selectedVendor ? selectedVendor.name : vendorSearch}
                  onChange={(e) => {
                    setVendorSearch(e.target.value);
                    setVendorId(null);
                  }}
                  placeholder="Search vendors..."
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                {!selectedVendor && vendorSearch.trim() && filteredVendors.length > 0 && (
                  <div className="mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                    {filteredVendors.slice(0, 6).map((vendor) => (
                      <button
                        key={vendor.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setVendorId(vendor.id);
                          setVendorSearch(vendor.name);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                      >
                        {vendor.name}
                        {vendor.city ? <span className="ml-2 text-text-muted">{vendor.city}</span> : null}
                      </button>
                    ))}
                  </div>
                )}
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
            <Button type="button" disabled={submitting} onClick={() => void handleSave(false)}>
              {submitting ? "Saving…" : "Confirm"}
            </Button>
            <Button type="button" variant="outline" disabled={submitting} onClick={() => void handleSave(true)}>
              Save as Draft
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
