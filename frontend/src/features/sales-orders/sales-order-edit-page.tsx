/**
 * Sales Order Edit Page — loads an existing draft SO and allows updating it.
 *
 * Data flow:
 * - Query: fetchSalesOrderApi to load existing data
 * - Update mutation: updateSalesOrder → PATCH /api/v1/sales-orders/:id
 *
 * Only Draft orders are editable. Confirmed/Invoiced orders redirect back.
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
  fetchSalesOrderApi,
  fetchCustomers,
  fetchIncomeAccounts,
  fetchProducts,
  mapSalesOrder,
} from "./sales-orders-api";
import { apiFetch } from "@/lib/api";
import type { SalesOrderApi } from "./sales-orders-api";
import { formatINR, todayDate } from "@/lib/format";

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

interface SalesOrderEditPageProps {
  soId: number;
}

export function SalesOrderEditPage({ soId }: SalesOrderEditPageProps) {
  const router = useRouter();

  // ── Master data ─────────────────────────────────────────────────────────
  const customersQuery = useQuery({ queryKey: ["so-customers"], queryFn: fetchCustomers });
  const productsQuery = useQuery({ queryKey: ["so-products"], queryFn: fetchProducts });
  const accountsQuery = useQuery({ queryKey: ["so-income-accounts"], queryFn: fetchIncomeAccounts });

  // ── Load existing SO ────────────────────────────────────────────────────
  const soQuery = useQuery({
    queryKey: ["sales-order", soId],
    queryFn: () => fetchSalesOrderApi(soId),
  });

  const [initialized, setInitialized] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [orderDate, setOrderDate] = useState(todayDate());
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data]);
  const products = productsQuery.data ?? [];
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  const defaultAccountId = useMemo(() => {
    const salesIncome = accounts.find((a) => a.code === "4010" || a.name?.toLowerCase().includes("sales"));
    return salesIncome?.id ?? accounts[0]?.id;
  }, [accounts]);

  // Pre-populate form once SO + master data are loaded
  const soData = soQuery.data;
  if (soData && !initialized && customers.length > 0) {
    setCustomerId(soData.customer_id);
    setOrderDate(soData.order_date.split("T")[0]);
    setLines(
      soData.lines.map((l) => ({
        key: String(l.id),
        productId: String(l.product_id),
        accountId: l.account_id ? String(l.account_id) : "",
        quantity: String(l.quantity),
        unitPrice: String(l.unit_price),
      }))
    );
    setInitialized(true);
  }

  const grandTotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const loadingMaster =
    customersQuery.isLoading || productsQuery.isLoading || accountsQuery.isLoading || soQuery.isLoading;

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

  async function handleSubmit(e: React.FormEvent) {
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
      await apiFetch<SalesOrderApi>(`/api/v1/sales-orders/${soId}`, {
        method: "PATCH",
        auth: true,
        body: {
          customer_id: customerId,
          order_date: orderDate + "T00:00:00",
          lines: cleanLines,
        },
      });
      router.push(`/sales-orders/${soId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update sales order.");
      setSubmitting(false);
    }
  }

  if (loadingMaster) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner label="Loading order details…" />
      </div>
    );
  }

  if (soQuery.isError || !soData) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-text-muted">Could not load sales order #{soId}.</p>
        <Link href="/sales-orders" className="text-sm font-semibold text-primary-600 hover:underline">
          Back to Sales Orders
        </Link>
      </div>
    );
  }

  // Guard: only draft orders are editable
  if (soData.status.toLowerCase() !== "draft") {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-text-muted">
          Only <strong>Draft</strong> orders can be edited. This order is currently{" "}
          <strong>{soData.status}</strong>.
        </p>
        <Link
          href={`/sales-orders/${soId}`}
          className="text-sm font-semibold text-primary-600 hover:underline"
        >
          Back to Order
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <Link
        href={`/sales-orders/${soId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {soData.so_number}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Edit {soData.so_number}</h1>
        <p className="mt-1 text-sm text-text-muted">Update line items or customer for this draft order.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer + Date */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-text">Order Details</h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text">Customer *</label>
              <SearchableContactSelect
                contacts={customers}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Select customer…"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text">Order Date *</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-muted/60 px-3 py-2 text-sm text-text outline-none focus:border-primary-500 focus:bg-surface"
                required
              />
            </div>
          </div>
        </section>

        {/* Line Items */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-text">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Line
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line) => (
                  <tr key={line.key}>
                    <td className="px-5 py-3">
                      <select
                        value={line.productId}
                        onChange={(e) => handleLineChange(line.key, { productId: e.target.value })}
                        className="w-full rounded-lg border border-border bg-surface-muted/60 px-2 py-1.5 text-xs text-text outline-none focus:border-primary-500"
                        required
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={line.accountId}
                        onChange={(e) => handleLineChange(line.key, { accountId: e.target.value })}
                        className="w-full rounded-lg border border-border bg-surface-muted/60 px-2 py-1.5 text-xs text-text outline-none focus:border-primary-500"
                      >
                        <option value="">Default Income</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={String(a.id)}>
                            {a.code} — {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(line.key, { quantity: e.target.value })}
                        className="w-20 rounded-lg border border-border bg-surface-muted/60 px-2 py-1.5 text-right text-xs text-text outline-none focus:border-primary-500"
                        required
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(line.key, { unitPrice: e.target.value })}
                        className="w-28 rounded-lg border border-border bg-surface-muted/60 px-2 py-1.5 text-right text-xs text-text outline-none focus:border-primary-500"
                        required
                      />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-muted">
                      {formatINR(lineTotal(line))}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.key)}
                        disabled={lines.length <= 1}
                        className="text-text-muted hover:text-rose-600 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end border-t border-border bg-surface-muted/30 px-5 py-3">
            <p className="text-sm font-bold text-text">
              Grand Total:{" "}
              <span className="font-mono text-primary-600">{formatINR(grandTotal)}</span>
            </p>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Link href={`/sales-orders/${soId}`}>
            <Button type="button" variant="outline" disabled={submitting}>
              Discard
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
