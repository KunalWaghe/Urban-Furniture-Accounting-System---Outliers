"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CheckCircle2, Pencil, Receipt } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { DashboardPanel, DashboardTableCard } from "@/features/dashboard/components/dashboard-card";
import { ApiError } from "@/lib/api";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import {
  cancelPurchaseOrder,
  confirmPurchaseOrder,
  fetchAnalyticAccounts,
  fetchPurchaseOrder,
} from "./purchase-orders-api";
import { PoStatusBadge } from "./po-status-badge";

export function PurchaseOrderDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = String(params.id);

  const [dialog, setDialog] = useState<"confirm" | "cancel" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const poQuery = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => fetchPurchaseOrder(id),
    retry: false,
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytic-accounts"],
    queryFn: fetchAnalyticAccounts,
  });

  function invalidatePo() {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
  }

  const confirmMutation = useMutation({
    mutationFn: () => confirmPurchaseOrder(id),
    onSuccess: () => {
      setDialog(null);
      setActionError(null);
      invalidatePo();
    },
    onError: (err) => {
      setDialog(null);
      setActionError(err instanceof ApiError ? err.message : "Could not confirm the purchase order.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchaseOrder(id),
    onSuccess: () => {
      setDialog(null);
      setActionError(null);
      invalidatePo();
    },
    onError: (err) => {
      setDialog(null);
      setActionError(err instanceof ApiError ? err.message : "Could not cancel the purchase order.");
    },
  });

  if (poQuery.isLoading) {
    return <div className="flex justify-center py-24"><LoadingSpinner /></div>;
  }

  if (poQuery.isError || !poQuery.data) {
    const notFound = poQuery.error instanceof ApiError && poQuery.error.status === 404;
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold text-text">
          {notFound ? "Purchase order not found" : "Could not load the purchase order"}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {notFound ? "It may have been removed, or the link is wrong." : "Please try again in a moment."}
        </p>
        <Link href="/purchase-orders" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Purchase Orders
        </Link>
      </div>
    );
  }

  const po = poQuery.data;
  const analytics = analyticsQuery.data ?? [];
  const analyticName = (analyticId?: number | null) =>
    analyticId ? analytics.find((a) => a.id === analyticId)?.name ?? "—" : "—";
  const busy = confirmMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb + title + actions */}
      <div>
        <Link
          href="/purchase-orders"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Purchase Orders
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-text">{po.po_number}</h1>
              <PoStatusBadge status={po.status} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {po.vendor_name ?? `Vendor #${po.vendor_id}`} · Ordered {formatDate(po.order_date)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {po.status === "draft" && (
              <>
                <button
                  type="button"
                  onClick={() => setDialog("confirm")}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm
                </button>
                <Link
                  href={`/purchase-orders/${po.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-muted"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setDialog("cancel")}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                >
                  <Ban className="h-4 w-4" />
                  Cancel
                </button>
              </>
            )}
            {po.status === "confirmed" && (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  disabled
                  title="Vendor Bill workflow lands next"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white opacity-50"
                >
                  <Receipt className="h-4 w-4" />
                  Create Bill
                </button>
                <span className="text-[11px] text-text-muted">Next step: Vendor Bill</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Status banner */}
      {po.status === "confirmed" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Confirmed{po.confirmed_at ? ` on ${formatDateTime(po.confirmed_at)}` : ""}. Ready to convert to a vendor bill.
          </span>
        </div>
      )}
      {po.status === "cancelled" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          <Ban className="h-4 w-4 shrink-0" />
          <span>This purchase order was cancelled.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line items */}
        <div className="lg:col-span-2">
          <DashboardTableCard title="Line Items" tone="indigo" count={`${po.lines.length} item${po.lines.length === 1 ? "" : "s"}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="w-12 px-4 py-2.5">Sr</th>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Purchase Account</th>
                    <th className="px-4 py-2.5">Budget Analytics</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {po.lines.map((line, index) => (
                    <tr key={line.id}>
                      <td className="px-4 py-3 text-text-muted">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-text">{line.product_name ?? `Product #${line.product_id}`}</td>
                      <td className="px-4 py-3 text-text-muted">{line.account_name ?? "Purchase Expense"}</td>
                      <td className="px-4 py-3 text-text-muted">{analyticName(line.analytic_account_id)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-text-muted">{line.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-text-muted">{formatINR(line.unit_price)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-text">{formatINR(line.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardTableCard>
        </div>

        {/* Summary rail */}
        <DashboardPanel id="po-summary" className="h-fit space-y-4">
          <h3 className="text-sm font-semibold text-text">Summary</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Vendor</dt>
              <dd className="font-medium text-text">{po.vendor_name ?? `Vendor #${po.vendor_id}`}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">PO Date</dt>
              <dd className="font-medium text-text">{formatDate(po.order_date)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Status</dt>
              <dd><PoStatusBadge status={po.status} /></dd>
            </div>
            {po.confirmed_at && (
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Confirmed At</dt>
                <dd className="font-medium text-text">{formatDateTime(po.confirmed_at)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="text-text-muted">Subtotal</dt>
              <dd className="font-mono font-medium text-text">{formatINR(po.total)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-semibold text-text">Total Amount</dt>
              <dd className="font-mono text-lg font-bold text-primary-600">{formatINR(po.total)}</dd>
            </div>
            <p className="text-right text-[11px] text-text-muted">Currency: INR ₹</p>
          </dl>
        </DashboardPanel>
      </div>

      <ConfirmDialog
        open={dialog === "confirm"}
        title="Confirm purchase order"
        message={`Confirm ${po.po_number}? Only draft orders can be confirmed. This locks the order for billing.`}
        confirmLabel="Confirm"
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "cancel"}
        title="Cancel purchase order"
        message={`Cancel ${po.po_number}? This cannot be undone.`}
        confirmLabel="Cancel order"
        destructive
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
