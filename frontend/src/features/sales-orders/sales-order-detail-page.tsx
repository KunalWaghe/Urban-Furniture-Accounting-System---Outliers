/**
 * Sales Order Detail Page — view one SO, confirm draft state machine, and generate invoice.
 *
 * Data flow:
 * - Query: useQuery calling fetchSalesOrderApi.
 * - Confirm mutation: confirmSalesOrder (draft -> confirmed).
 * - Generate invoice mutation: createInvoiceFromSo (confirmed -> invoiced, redirects to /sales-invoices/[id]).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Package,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Pencil,
  XCircle,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  cancelSalesOrder,
  confirmSalesOrder,
  fetchSalesOrderApi,
  mapSalesOrder,
} from "./sales-orders-api";
import { SoStatusBadge } from "./so-status-badge";
import { createInvoiceFromSo } from "@/features/customer-invoices/customer-invoices-api";
import { formatDate, formatINR } from "@/lib/format";

interface SalesOrderDetailPageProps {
  soId: number;
}

export function SalesOrderDetailPage({ soId }: SalesOrderDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // ── Server query: load SO by ID ───────────────────────────────────────────
  const soQuery = useQuery({
    queryKey: ["sales-order", soId],
    queryFn: () => fetchSalesOrderApi(soId),
  });

  // ── Mutation: confirm draft SO ───────────────────────────────────────────
  const confirmMutation = useMutation({
    mutationFn: () => confirmSalesOrder(soId),
    onSuccess: () => {
      setConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["sales-order", soId] });
      void queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
  });

  // ── Mutation: cancel draft or confirmed SO ─────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: () => cancelSalesOrder(soId),
    onSuccess: () => {
      setCancelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["sales-order", soId] });
      void queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
  });

  // ── Mutation: create invoice from confirmed SO (Task 6B) ─────────────────
  const createInvoiceMutation = useMutation({
    mutationFn: () => createInvoiceFromSo(soId),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: ["sales-order", soId] });
      void queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budget-report"] });
      router.push(`/sales-invoices/${invoice.id}`);
    },
  });

  if (soQuery.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner label="Loading Sales Order details..." />
      </div>
    );
  }

  if (soQuery.isError || !soQuery.data) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-text-muted">Could not load sales order #{soId}.</p>
        <Link href="/sales-orders" className="text-sm font-semibold text-primary-600 hover:underline">
          Back to Sales Orders Directory
        </Link>
      </div>
    );
  }

  const so = soQuery.data;
  const mapped = mapSalesOrder(so);
  const statusStr = (so.status || "").toLowerCase();
  const isDraft = statusStr === "draft";
  const isConfirmed = statusStr === "confirmed";
  const isInvoiced = statusStr === "invoiced" || statusStr === "partially billed";
  const isCancelled = statusStr === "cancelled";
  const isActive = !isCancelled && statusStr !== "unknown";

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

      {/* ── Page Header & Workflow Action Bar ─────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {so.so_number}
            </h1>
            <SoStatusBadge status={mapped.status} />
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Customer order placed on {formatDate(so.order_date)}
          </p>
        </div>

        {/* State Machine Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Draft State -> Confirm Action */}
          {isDraft && (
            <Button
              type="button"
              variant="default"
              onClick={() => setConfirmOpen(true)}
              className="gap-1.5 shadow-sm w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Order
            </Button>
          )}

          {/* Confirmed State -> Generate Invoice Action (Task 6B) */}
          {isConfirmed && (
            <Button
              type="button"
              variant="default"
              disabled={createInvoiceMutation.isPending}
              onClick={() => createInvoiceMutation.mutate()}
              className="gap-1.5 bg-purple-600 text-white shadow-sm hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 w-full sm:w-auto"
            >
              <Receipt className="h-4 w-4" />
              {createInvoiceMutation.isPending ? "Generating Invoice..." : "Generate Invoice"}
            </Button>
          )}

          {/* Invoiced State -> View Invoices Link */}
          {isInvoiced && (
            <Link href="/sales-invoices" className="w-full sm:w-auto">
              <Button variant="outline" className="gap-1.5 w-full">
                <Receipt className="h-4 w-4 text-purple-500" />
                View Customer Invoices
              </Button>
            </Link>
          )}
          {/* Draft state -> Edit button */}
          {isDraft && (
            <Button
              variant="outline"
              onClick={() => router.push(`/sales-orders/${soId}/edit`)}
              className="gap-1.5 w-full sm:w-auto"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
          {/* Cancel for draft or confirmed */}
          {isActive && (isDraft || isConfirmed) && (
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              disabled={cancelMutation.isPending}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-400 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 gap-1.5 w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4" />
              {cancelMutation.isPending ? "Cancelling…" : "Cancel Order"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Order Overview Meta Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <User className="h-4 w-4 text-blue-500" />
            Customer
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">
            {so.customer_name ?? `Customer #${so.customer_id}`}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <Calendar className="h-4 w-4 text-emerald-500" />
            Order Date
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">
            {formatDate(so.order_date)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <Package className="h-4 w-4 text-purple-500" />
            Line Items
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">
            {so.lines.length} {so.lines.length === 1 ? "Product" : "Products"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <CreditCard className="h-4 w-4 text-amber-500" />
            Total Value
          </div>
          <p className="mt-2 text-base font-bold text-primary-600">
            {formatINR(so.total)}
          </p>
        </div>
      </div>

      {/* ── Line Items Table ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="border-b border-border bg-surface-elevated/60 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Ordered Products & Pricing
          </h2>
        </div>

        {isMobile ? (
          /* Mobile card view */
          <div className="divide-y divide-border">
            {so.lines.map((line, idx) => (
              <div key={line.id || idx} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-xs text-text-muted">#{idx + 1}</span>
                    <p className="font-medium text-text-primary">
                      {line.product_name || `Product #${line.product_id}`}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {line.account_name || "Sales Income (4010)"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Qty:</span>
                    <span className="font-medium text-text-primary">{line.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Unit:</span>
                    <span className="text-text">{formatINR(line.unit_price)}</span>
                  </div>
                  <div className="col-span-2 flex justify-between pt-1 border-t border-border">
                    <span className="text-text-muted">Subtotal:</span>
                    <span className="font-semibold text-text-primary">{formatINR(line.subtotal)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop table view */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-elevated text-xs font-semibold uppercase text-text-muted">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Sales Account</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {so.lines.map((line, idx) => (
                  <tr key={line.id || idx} className="hover:bg-surface-elevated/40">
                    <td className="px-5 py-3.5 text-xs text-text-muted">{idx + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-text-primary">
                      {line.product_name || `Product #${line.product_id}`}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-muted">
                      {line.account_name || "Sales Income (4010)"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-text-primary">
                      {line.quantity}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-muted">
                      {formatINR(line.unit_price)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-text-primary">
                      {formatINR(line.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Financial Summary ──────────────────────────────────────────── */}
        <div className="border-t border-border bg-surface-elevated/30 p-4 sm:p-5">
          <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span>
              <span className="font-medium text-text-primary">{formatINR(so.total)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Tax (GST)</span>
              <span>Included / 0.00</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-text-primary">
              <span>Total Amount</span>
              <span className="text-primary-600">{formatINR(so.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Order Dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title="Confirm Sales Order"
        message={`Are you sure you want to confirm sales order ${so.so_number}? Once confirmed, this order can be billed and converted into a Customer Invoice.`}
        confirmLabel={confirmMutation.isPending ? "Confirming..." : "Confirm Order"}
        onConfirm={() => confirmMutation.mutate()}
        pending={confirmMutation.isPending}
      />

      <ConfirmDialog
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        title="Cancel Sales Order"
        message={`Cancel ${so.so_number}? This cannot be undone. The order will be marked as Cancelled.`}
        confirmLabel={cancelMutation.isPending ? "Cancelling…" : "Cancel Order"}
        onConfirm={() => cancelMutation.mutate()}
        pending={cancelMutation.isPending}
      />
    </div>
  );
}
