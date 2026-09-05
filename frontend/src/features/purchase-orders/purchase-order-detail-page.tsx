"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileText, Pencil } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { PoStatusBadge } from "@/features/purchase-orders/po-status-badge";
import {
  confirmPurchaseOrder,
  fetchPurchaseOrderApi,
  mapPurchaseOrder,
} from "@/features/purchase-orders/purchase-orders-api";
import { formatDate, formatINR } from "@/lib/format";

interface PurchaseOrderDetailPageProps {
  poId: number;
}

export function PurchaseOrderDetailPage({ poId }: PurchaseOrderDetailPageProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const poQuery = useQuery({
    queryKey: ["purchase-order", poId],
    queryFn: () => fetchPurchaseOrderApi(poId),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmPurchaseOrder(poId),
    onSuccess: () => {
      setConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] });
      void queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  if (poQuery.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (poQuery.isError || !poQuery.data) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-text-muted">Could not load this purchase order.</p>
        <Link href="/purchase-orders" className="text-sm font-semibold text-primary-600 hover:underline">
          Back to Purchase Orders
        </Link>
      </div>
    );
  }

  const po = poQuery.data;
  const mapped = mapPurchaseOrder(po);
  const isDraft = po.status === "draft";
  const isConfirmed = po.status === "confirmed";

  return (
    <div className="space-y-6 pb-12">
      <Link
        href="/purchase-orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Purchase Orders
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text">{po.po_number}</h1>
            <PoStatusBadge status={mapped.status} />
          </div>
          <p className="mt-1 text-sm text-text-muted">
            {po.vendor_name ?? "Unknown vendor"} · Ordered {formatDate(po.order_date)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <Button onClick={() => setConfirmOpen(true)} disabled={confirmMutation.isPending}>
                <CheckCircle2 className="h-4 w-4" />
                Confirm
              </Button>
              <Button variant="outline" disabled title="Edit coming soon">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </>
          )}
          {isConfirmed && (
            <Button variant="outline" disabled title="Vendor Bill workflow coming soon">
              <FileText className="h-4 w-4" />
              Create Bill
            </Button>
          )}
        </div>
      </div>

      {isDraft && (
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
          This purchase order is a draft. Confirm it to lock the order for billing.
        </div>
      )}

      {isConfirmed && (
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
          Purchase order confirmed and ready for vendor billing.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-text">Line Items</h2>
            <p className="text-xs text-text-muted">{po.lines.length} item(s)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">Sr</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Purchase Account</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {po.lines.map((line, index) => (
                  <tr key={line.id}>
                    <td className="px-5 py-4 text-text-muted">{index + 1}</td>
                    <td className="px-5 py-4 font-medium text-text">{line.product_name}</td>
                    <td className="px-5 py-4 text-text-muted">{line.account_name ?? "Purchase Expense"}</td>
                    <td className="px-5 py-4 text-right text-text-muted">{line.quantity}</td>
                    <td className="px-5 py-4 text-right font-mono text-text-muted">{formatINR(line.unit_price)}</td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-text">{formatINR(line.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-text">Summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Vendor</dt>
              <dd className="text-right font-medium text-text">{po.vendor_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">PO Date</dt>
              <dd className="text-right text-text">{formatDate(po.order_date)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Status</dt>
              <dd><PoStatusBadge status={mapped.status} /></dd>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between gap-4">
                <dt className="font-medium text-text">Total Amount</dt>
                <dd className="font-mono text-lg font-bold text-primary-600">{formatINR(po.total)}</dd>
              </div>
              <p className="mt-1 text-right text-xs text-text-muted">Currency: INR ₹</p>
            </div>
          </dl>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm purchase order"
        message={`Confirm ${po.po_number}? Only draft orders can be confirmed. This locks the order for billing.`}
        confirmLabel={confirmMutation.isPending ? "Confirming…" : "Confirm"}
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />

      {confirmMutation.isError && (
        <p className="text-sm text-red-600">
          {confirmMutation.error instanceof Error ? confirmMutation.error.message : "Confirm failed"}
        </p>
      )}
    </div>
  );
}
