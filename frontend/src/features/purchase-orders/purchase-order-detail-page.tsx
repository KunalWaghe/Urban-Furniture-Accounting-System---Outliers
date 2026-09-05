"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  CreditCard,
  Pencil,
  Receipt,
  Loader2,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment-modal";
import { PoStatusBadge } from "@/features/purchase-orders/po-status-badge";
import {
  confirmPurchaseOrder,
  createBillFromPo,
  fetchPurchaseOrderApi,
  mapPurchaseOrder,
} from "@/features/purchase-orders/purchase-orders-api";
import { createBillFromPo } from "@/features/vendor-bills/vendor-bills-api";
import { formatDate, formatINR } from "@/lib/format";
import { apiFetch } from "@/lib/api";

interface PurchaseOrderDetailPageProps {
  poId: number;
}

interface VendorBillData {
  id: number;
  bill_number: string;
  po_id: number;
  vendor_id: number;
  total: number;
  amount_paid: number;
  status: "open" | "partially_paid" | "paid" | "cancelled";
  journal_entry_id?: number | null;
}

export function PurchaseOrderDetailPage({ poId }: PurchaseOrderDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [billConfirmOpen, setBillConfirmOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

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

  const createBillMutation = useMutation({
    mutationFn: () => createBillFromPo(poId),
    onSuccess: () => {
      setBillConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] });
      void queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor-bill-for-po", poId] });
    },
  });

  // Query bill details if the PO has transitioned to 'billed'
  const billQuery = useQuery<VendorBillData | null>({
    queryKey: ["vendor-bill-for-po", poId],
    queryFn: async () => {
      const res = await apiFetch<{ data: VendorBillData[] }>("/api/v1/vendor-bills?limit=100", { auth: true });
      return res.data?.find((b) => b.po_id === poId) ?? null;
    },
    enabled: poQuery.data?.status === "billed",
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
  const isBilled = po.status === "billed";
  const currentBill = billQuery.data;

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
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Confirm Order
              </Button>
              <Button variant="outline" disabled title="Edit coming soon">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </>
          )}
          {isConfirmed && (
            <Button
              onClick={() => setBillConfirmOpen(true)}
              disabled={createBillMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {createBillMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Generating Bill...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-1.5" />
                  Create Vendor Bill
                </>
              )}
            </Button>
          )}
          {isBilled && currentBill && currentBill.status !== "paid" && (
            <Button
              onClick={() => setPaymentModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Register Payment
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
          Purchase order confirmed. Click <strong>Create Vendor Bill</strong> above to generate the bill and post the automated accounting journal entry.
        </div>
      )}

      {isBilled && (
        <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              Vendor Bill generated. Double-entry Journal Entry automatically posted in the general ledger.
            </span>
          </div>
          {currentBill && (
            <span className="font-mono font-semibold text-xs text-indigo-700 dark:text-indigo-300">
              Bill #{currentBill.bill_number}
            </span>
          )}
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
                    <td className="px-5 py-4 text-right font-mono font-medium text-text">{formatINR(line.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
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
          </div>

          {/* Vendor Bill & Payment Settlement Card */}
          {currentBill && (
            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-5 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/20 space-y-3.5">
              <div className="flex items-center justify-between border-b border-indigo-200/50 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider">
                    Vendor Bill #{currentBill.bill_number}
                  </h4>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${currentBill.status === "paid"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : currentBill.status === "partially_paid"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                >
                  {currentBill.status}
                </span>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between text-text-muted">
                  <span>Bill Total:</span>
                  <span className="font-mono font-semibold text-text">{formatINR(currentBill.total)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Amount Settled:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatINR(currentBill.amount_paid)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-indigo-200/40 pt-1.5">
                  <span className="font-medium text-text">Remaining Due:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatINR(Math.max(0, currentBill.total - currentBill.amount_paid))}
                  </span>
                </div>
              </div>

              {currentBill.status !== "paid" ? (
                <Button
                  size="sm"
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  <CreditCard className="h-3.5 w-3.5 mr-1" />
                  Register Payment
                </Button>
              ) : (
                <div className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 py-1.5 bg-emerald-100/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60">
                  ✓ Bill Settled in Full
                </div>
              )}
            </div>
          )}
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

      <ConfirmDialog
        open={billConfirmOpen}
        title="Generate Vendor Bill"
        message={`Create a Vendor Bill for ${po.po_number}? This will automatically post a balanced double-entry Journal Entry (Dr Expense / Cr Accounts Payable) into the accounting ledger.`}
        confirmLabel={createBillMutation.isPending ? "Creating…" : "Create Bill & Post Ledger"}
        onConfirm={() => createBillMutation.mutate()}
        onCancel={() => setBillConfirmOpen(false)}
      />

      {currentBill && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          billId={currentBill.id}
          billNumber={currentBill.bill_number}
          vendorName={po.vendor_name ?? undefined}
          totalAmount={currentBill.total}
          amountPaid={currentBill.amount_paid}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["vendor-bill-for-po", poId] });
            void queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] });
          }}
        />
      )}

      {confirmMutation.isError && (
        <p className="text-sm text-red-600">
          {confirmMutation.error instanceof Error ? confirmMutation.error.message : "Confirm failed"}
        </p>
      )}

      {createBillMutation.isError && (
        <p className="text-sm text-red-600">
          {createBillMutation.error instanceof Error ? createBillMutation.error.message : "Bill creation failed"}
        </p>
      )}
    </div>
  );
}
