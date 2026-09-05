"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { redirect, useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Plus, Trash2 } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-card";
import { ApiError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import {
  createPurchaseOrder,
  confirmPurchaseOrder,
  fetchAnalyticAccounts,
  fetchExpenseAccounts,
  fetchNextPoNumberPreview,
  fetchProducts,
  fetchPurchaseOrder,
  fetchVendors,
  updatePurchaseOrder,
  type PurchaseOrder,
  type PurchaseOrderInput,
} from "./purchase-orders-api";

interface LineState {
  key: number;
  productId: string;
  accountId: string;
  analyticId: string;
  quantity: string;
  unitPrice: string;
}

let nextLineKey = 1;
function emptyLine(): LineState {
  return { key: nextLineKey++, productId: "", accountId: "", analyticId: "", quantity: "1", unitPrice: "" };
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

export function PurchaseOrderFormPage({ mode }: { mode: "new" | "edit" }) {
  const params = useParams();
  const poId = mode === "edit" ? String(params.id) : null;

  const existingPoQuery = useQuery({
    queryKey: ["purchase-order", poId],
    queryFn: () => fetchPurchaseOrder(poId!),
    enabled: mode === "edit" && !!poId,
  });

  if (mode === "edit" && existingPoQuery.isLoading) {
    return <div className="flex justify-center py-24"><LoadingSpinner /></div>;
  }

  // Edit is draft-only: confirmed/cancelled orders bounce back to the detail screen.
  const po = existingPoQuery.data;
  if (mode === "edit" && po && po.status !== "draft") {
    redirect(`/purchase-orders/${po.id}`);
  }

  return <PurchaseOrderForm key={po?.id ?? "new"} mode={mode} poId={poId} initialPo={po ?? null} />;
}

function PurchaseOrderForm({
  mode,
  poId,
  initialPo,
}: {
  mode: "new" | "edit";
  poId: string | null;
  initialPo: PurchaseOrder | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [vendorId, setVendorId] = useState<number | null>(initialPo?.vendor_id ?? null);
  const [vendorSearch, setVendorSearch] = useState(initialPo?.vendor_name ?? "");
  const [vendorOpen, setVendorOpen] = useState(false);
  const [poDate, setPoDate] = useState(() =>
    initialPo ? initialPo.order_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [lines, setLines] = useState<LineState[]>(() =>
    initialPo
      ? initialPo.lines.map((line) => ({
          key: nextLineKey++,
          productId: String(line.product_id),
          accountId: line.account_id ? String(line.account_id) : "",
          analyticId: line.analytic_account_id ? String(line.analytic_account_id) : "",
          quantity: String(line.quantity),
          unitPrice: String(line.unit_price),
        }))
      : [emptyLine()]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const vendorsQuery = useQuery({ queryKey: ["vendors"], queryFn: fetchVendors });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const accountsQuery = useQuery({ queryKey: ["expense-accounts"], queryFn: fetchExpenseAccounts });
  const analyticsQuery = useQuery({ queryKey: ["analytic-accounts"], queryFn: fetchAnalyticAccounts });
  const nextPoQuery = useQuery({
    queryKey: ["next-po-number"],
    queryFn: fetchNextPoNumberPreview,
    enabled: mode === "new",
  });

  const vendors = useMemo(() => vendorsQuery.data ?? [], [vendorsQuery.data]);
  const products = productsQuery.data ?? [];
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const analytics = useMemo(() => analyticsQuery.data ?? [], [analyticsQuery.data]);

  // "Purchase Expense" (code 5010) is the display + payload fallback, so no
  // state backfill effect is needed when accounts finish loading.
  const defaultAccountId = useMemo(
    () => accounts.find((a) => a.code === "5010")?.id ?? null,
    [accounts]
  );

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.toLowerCase().trim();
    if (!q) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendors, vendorSearch]);

  function updateLine(key: number, patch: Partial<LineState>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: number) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.key !== key) : current));
  }

  function lineTotal(line: LineState): number {
    const qty = parseFloat(line.quantity);
    const price = parseFloat(line.unitPrice);
    if (isNaN(qty) || isNaN(price)) return 0;
    return qty * price;
  }

  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  // Totals computed inline (not via lineTotal) to keep exhaustive-deps happy.
  const exceededAnalytics = useMemo(() => {
    const totals = new Map<number, number>();
    for (const line of lines) {
      if (!line.analyticId) continue;
      const qty = parseFloat(line.quantity);
      const price = parseFloat(line.unitPrice);
      if (isNaN(qty) || isNaN(price)) continue;
      const id = Number(line.analyticId);
      totals.set(id, (totals.get(id) ?? 0) + qty * price);
    }
    return analytics.filter((a) => (totals.get(a.id) ?? 0) > a.remaining_amount);
  }, [lines, analytics]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!vendorId) next.vendor = "Vendor is required";
    if (!poDate) next.poDate = "PO date is required";
    if (lines.length === 0) next.lines = "At least one line item is required";
    for (const line of lines) {
      if (!line.productId) next[`line-${line.key}-product`] = "Product is required";
      const qty = parseFloat(line.quantity);
      if (isNaN(qty) || qty <= 0) next[`line-${line.key}-quantity`] = "Quantity must be greater than zero";
      const price = parseFloat(line.unitPrice);
      if (line.unitPrice === "" || isNaN(price) || price < 0)
        next[`line-${line.key}-unitPrice`] = "Unit price cannot be negative";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildPayload(): PurchaseOrderInput {
    return {
      vendor_id: vendorId!,
      order_date: new Date(`${poDate}T00:00:00`).toISOString(),
      lines: lines.map((line) => ({
        product_id: Number(line.productId),
        account_id: line.accountId ? Number(line.accountId) : defaultAccountId,
        analytic_account_id: line.analyticId ? Number(line.analyticId) : null,
        quantity: parseFloat(line.quantity),
        unit_price: parseFloat(line.unitPrice),
      })),
    };
  }

  function invalidatePoQueries() {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-order"] });
    queryClient.invalidateQueries({ queryKey: ["analytic-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["next-po-number"] });
  }

  const saveMutation = useMutation({
    mutationFn: (payload: PurchaseOrderInput) =>
      mode === "edit" && poId ? updatePurchaseOrder(poId, payload) : createPurchaseOrder(payload),
  });

  function errorMessage(err: unknown): string {
    return err instanceof ApiError ? err.message : "Could not save the purchase order.";
  }

  function handleSaveDraft() {
    if (!validate()) return;
    setSubmitError(null);
    saveMutation.mutate(buildPayload(), {
      onSuccess: (po) => {
        invalidatePoQueries();
        router.push(`/purchase-orders/${po.id}`);
      },
      onError: (err) => setSubmitError(errorMessage(err)),
    });
  }

  function handleConfirm() {
    if (!validate()) return;
    setSubmitError(null);
    saveMutation.mutate(buildPayload(), {
      onSuccess: (po) => {
        confirmPurchaseOrder(String(po.id))
          .catch(() => undefined) // order exists as draft; detail screen can retry confirm
          .finally(() => {
            invalidatePoQueries();
            router.push(`/purchase-orders/${po.id}`);
          });
      },
      onError: (err) => setSubmitError(errorMessage(err)),
    });
  }

  const busy = saveMutation.isPending;
  const title = mode === "edit" ? `Edit ${initialPo?.po_number ?? "Purchase Order"}` : "New Purchase Order";

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb + title */}
      <div>
        <Link
          href="/purchase-orders"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Purchase Orders
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {mode === "edit" ? "Update the draft order, then save your changes." : "Create a draft purchase order, then save or confirm it."}
        </p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          {submitError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order details */}
          <DashboardPanel id="po-details" className="space-y-4">
            <h3 className="text-sm font-semibold text-text">Order Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  PO Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={mode === "edit" ? initialPo?.po_number ?? "" : nextPoQuery.data ?? "…"}
                  className={`${inputClass} cursor-not-allowed bg-surface-muted font-mono`}
                />
                <p className="mt-1 text-[11px] text-text-muted">Auto-assigned on save</p>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Status
                </label>
                <input type="text" readOnly value="Draft" className={`${inputClass} cursor-not-allowed bg-surface-muted`} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Vendor Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(event) => {
                      setVendorSearch(event.target.value);
                      setVendorId(null);
                      setVendorOpen(true);
                    }}
                    onFocus={() => setVendorOpen(true)}
                    onBlur={() => setTimeout(() => setVendorOpen(false), 150)}
                    placeholder="Search vendors..."
                    className={inputClass}
                  />
                  {vendorOpen && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
                      {filteredVendors.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-text-muted">No vendors found</div>
                      ) : (
                        filteredVendors.map((vendor) => (
                          <button
                            key={vendor.id}
                            type="button"
                            onMouseDown={() => {
                              setVendorId(vendor.id);
                              setVendorSearch(vendor.name);
                              setVendorOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-surface-muted"
                          >
                            <span className="font-medium text-text">{vendor.name}</span>
                            {vendor.city && <span className="text-text-muted">{vendor.city}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.vendor && <p className="mt-1 text-xs text-destructive">{errors.vendor}</p>}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  PO Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(event) => setPoDate(event.target.value)}
                  className={inputClass}
                />
                {errors.poDate && <p className="mt-1 text-xs text-destructive">{errors.poDate}</p>}
              </div>
            </div>
          </DashboardPanel>

          {/* Line items */}
          <DashboardPanel id="po-lines" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Line Items</h3>
              <button
                type="button"
                onClick={() => setLines((current) => [...current, emptyLine()])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Line
              </button>
            </div>
            {errors.lines && <p className="text-xs text-destructive">{errors.lines}</p>}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="w-10 px-3 py-2.5">Sr</th>
                    <th className="min-w-44 px-3 py-2.5">Product</th>
                    <th className="min-w-36 px-3 py-2.5">Purchase Account</th>
                    <th className="min-w-36 px-3 py-2.5">Budget Analytics</th>
                    <th className="w-24 px-3 py-2.5 text-right">Qty</th>
                    <th className="w-28 px-3 py-2.5 text-right">Unit Price</th>
                    <th className="w-28 px-3 py-2.5 text-right">Total</th>
                    <th className="w-10 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((line, index) => (
                    <tr key={line.key} className="align-top">
                      <td className="px-3 py-3 text-text-muted">{index + 1}</td>
                      <td className="px-3 py-2">
                        <select
                          value={line.productId}
                          onChange={(event) => {
                            const product = products.find((p) => String(p.id) === event.target.value);
                            updateLine(line.key, {
                              productId: event.target.value,
                              unitPrice: product?.cost != null ? String(product.cost) : line.unitPrice,
                            });
                          }}
                          className={inputClass}
                        >
                          <option value="">Select product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} — Cost {formatINR(product.cost ?? 0)}
                            </option>
                          ))}
                        </select>
                        {errors[`line-${line.key}-product`] && (
                          <p className="mt-1 text-[11px] text-destructive">{errors[`line-${line.key}-product`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={line.accountId || (defaultAccountId ? String(defaultAccountId) : "")}
                          onChange={(event) => updateLine(line.key, { accountId: event.target.value })}
                          className={inputClass}
                        >
                          {accounts.length === 0 && <option value="">Purchase Expense</option>}
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={line.analyticId}
                          onChange={(event) => updateLine(line.key, { analyticId: event.target.value })}
                          className={inputClass}
                        >
                          <option value="">None</option>
                          {analytics.map((analytic) => (
                            <option key={analytic.id} value={analytic.id}>
                              {analytic.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.quantity}
                          onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                          className={`${inputClass} text-right`}
                        />
                        {errors[`line-${line.key}-quantity`] && (
                          <p className="mt-1 text-[11px] text-destructive">{errors[`line-${line.key}-quantity`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                          className={`${inputClass} text-right font-mono`}
                        />
                        {errors[`line-${line.key}-unitPrice`] && (
                          <p className="mt-1 text-[11px] text-destructive">{errors[`line-${line.key}-unitPrice`]}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-mono font-semibold text-text">
                        {formatINR(lineTotal(line))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          disabled={lines.length === 1}
                          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/30"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {exceededAnalytics.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Exceeds Approved Budget</p>
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {exceededAnalytics.map((analytic) => (
                      <li key={analytic.id}>
                        {analytic.name} — remaining budget {formatINR(analytic.remaining_amount)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </DashboardPanel>
        </div>

        {/* Summary rail */}
        <DashboardPanel id="po-summary" className="h-fit space-y-4 lg:sticky lg:top-20">
          <h3 className="text-sm font-semibold text-text">Summary</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Subtotal</dt>
              <dd className="font-mono font-medium text-text">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="font-semibold text-text">Total Amount</dt>
              <dd className="font-mono text-lg font-bold text-primary-600">{formatINR(subtotal)}</dd>
            </div>
            <p className="text-right text-[11px] text-text-muted">Currency: INR ₹</p>
          </dl>
          <div className="space-y-2 border-t border-border pt-4">
            {mode === "new" ? (
              <>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={busy}
                  className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={busy}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface-muted disabled:opacity-50"
                >
                  Save as Draft
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={busy}
                className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(mode === "edit" && poId ? `/purchase-orders/${poId}` : "/purchase-orders")}
              disabled={busy}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
