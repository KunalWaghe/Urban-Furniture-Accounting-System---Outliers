"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/format";

import {
  confirmVendorBill,
  fetchVendorBill,
  payVendorBill,
  type PaymentInput,
} from "./vendor-bills-api";
import { VendorBillStatusBadge } from "./vendor-bill-status-badge";

interface VendorBillDetailPageProps {
  billId: string;
}

export function VendorBillDetailPage({ billId }: VendorBillDetailPageProps) {
  const queryClient = useQueryClient();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Payment Form state
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash">("bank");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const billQuery = useQuery({
    queryKey: ["vendor-bill", billId],
    queryFn: () => fetchVendorBill(billId),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmVendorBill(billId),
    onSuccess: () => {
      setConfirmDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["vendor-bill", billId] });
      void queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
    },
  });

  const payMutation = useMutation({
    mutationFn: (input: PaymentInput) => payVendorBill(billId, input),
    onSuccess: () => {
      setPaymentModalOpen(false);
      setPaymentError(null);
      void queryClient.invalidateQueries({ queryKey: ["vendor-bill", billId] });
      void queryClient.invalidateQueries({ queryKey: ["vendor-bills"] });
    },
    onError: (err: Error) => {
      setPaymentError(err.message || "Failed to process payment");
    },
  });

  if (billQuery.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner label="Loading Vendor Bill details…" />
      </div>
    );
  }

  if (billQuery.isError || !billQuery.data) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-text-muted">Could not load vendor bill &ldquo;{billId}&rdquo;.</p>
        <Link href="/vendor-bills" className="text-sm font-semibold text-primary-600 hover:underline">
          Back to Vendor Bills Directory
        </Link>
      </div>
    );
  }

  const bill = billQuery.data;
  const isDraft = bill.status === "Draft";
  const isConfirmed = bill.status === "Confirmed";
  const isPaid = bill.status === "Paid";

  function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault();
    payMutation.mutate({
      payment_method: paymentMethod,
      payment_date: paymentDate,
      amount: bill.amount_due,
      notes: paymentNotes.trim() || `Settled via ${paymentMethod.toUpperCase()}`,
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <Link
        href="/vendor-bills"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Vendor Bills
      </Link>

      {/* Header Row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {bill.bill_number}
            </h1>
            <VendorBillStatusBadge status={bill.status} />

            {bill.po_number && (
              <Link
                href={bill.po_id ? `/purchase-orders/${bill.po_id}` : "/purchase-orders"}
                className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 transition-colors hover:bg-purple-200 dark:bg-purple-950/60 dark:text-purple-300"
                title="Source Purchase Order"
              >
                <FileText className="h-3 w-3" />
                Source: {bill.po_number}
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Vendor: <span className="font-semibold text-text">{bill.vendor_name}</span> · Bill Date:{" "}
            {formatDate(bill.bill_date)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <Button onClick={() => setConfirmDialogOpen(true)} disabled={confirmMutation.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {confirmMutation.isPending ? "Confirming…" : "Confirm Bill"}
            </Button>
          )}

          {isConfirmed && (
            <Button
              onClick={() => {
                setPaymentError(null);
                setPaymentModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CreditCard className="h-4 w-4" />
              Register Payment
            </Button>
          )}

          {isPaid && (
            <Button variant="outline" disabled className="gap-2 cursor-default opacity-90 border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
              <FileCheck className="h-4 w-4 text-blue-600" />
              Paid via {bill.payment_method?.toUpperCase() ?? "Bank"}
            </Button>
          )}
        </div>
      </div>

      {/* Accounting State Banner */}
      {isDraft && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-sm text-amber-900 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Draft Vendor Bill</p>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">
                Confirming this bill locks line pricing and auto-posts the double-entry accounting journal:{" "}
                <span className="font-mono font-semibold">Dr 5010 Purchase Expense</span> /{" "}
                <span className="font-mono font-semibold">Cr 2010 Accounts Payable (Creditors)</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {isConfirmed && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-sm text-emerald-900 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold">Confirmed &amp; Posted to Accounting Ledger</p>
              <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                Double-entry journal posted successfully. Click <span className="font-semibold">&ldquo;Register Payment&rdquo;</span> to settle vendor dues via Cash or Bank disbursement.
              </p>
            </div>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-4 text-sm text-blue-900 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold">Settled &amp; Fully Paid</p>
              <p className="text-xs text-blue-800 dark:text-blue-400 mt-0.5">
                Disbursement recorded on {bill.payment_date ? formatDate(bill.payment_date) : "today"}. Journal Entry:{" "}
                <span className="font-mono font-semibold">Dr 2010 Accounts Payable</span> /{" "}
                <span className="font-mono font-semibold">Cr {bill.payment_method === "cash" ? "1010 Cash" : "1020 Bank Account"}</span>.
                {bill.payment_notes && <span className="block mt-1 italic">&ldquo;{bill.payment_notes}&rdquo;</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Line Items Table */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text">Bill Line Items</h2>
              <p className="text-xs text-text-muted">{bill.lines.length} items linked</p>
            </div>
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-mono text-text-muted">
              Currency: INR ₹
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Product / Particulars</th>
                  <th className="px-5 py-3">Chart of Account</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bill.lines.map((line, index) => (
                  <tr key={line.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-5 py-4 text-xs text-text-muted">{index + 1}</td>
                    <td className="px-5 py-4 font-medium text-text">{line.product_name}</td>
                    <td className="px-5 py-4 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-0.5 font-mono text-text">
                        {line.account_name ?? "5010 - Purchase Expense"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-text">{line.quantity}</td>
                    <td className="px-5 py-4 text-right font-mono text-text-muted">
                      {formatINR(line.unit_price)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-text">
                      {formatINR(line.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Financial Summary Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-text border-b border-border pb-3">
              Financial Summary
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Vendor Partner</dt>
                <dd className="text-right font-medium text-text">{bill.vendor_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Bill Date</dt>
                <dd className="text-right text-text">{formatDate(bill.bill_date)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Due Date</dt>
                <dd className="text-right text-text font-medium text-amber-600 dark:text-amber-400">
                  {formatDate(bill.due_date)}
                </dd>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Total Bill Amount</dt>
                  <dd className="font-mono text-base font-semibold text-text">
                    {formatINR(bill.total_amount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 text-xs">
                  <dt className="text-text-muted">Amount Paid</dt>
                  <dd className="font-mono text-emerald-600 font-semibold">
                    {formatINR(bill.total_amount - bill.amount_due)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border/80 pt-2">
                  <dt className="font-bold text-text">Balance Due</dt>
                  <dd className="font-mono text-xl font-bold text-primary-600">
                    {formatINR(bill.amount_due)}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-text-muted">
              <Building2 className="h-4 w-4 text-primary-600" />
              Accounting Ledger Posting
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Every vendor bill posts directly to the Chart of Accounts upon confirmation. Balanced debits and credits ensure strict audit compliance.
            </p>
          </div>
        </aside>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        title="Confirm Vendor Bill"
        message={`Are you sure you want to confirm ${bill.bill_number}? This will lock line amounts and post a journal entry to Accounts Payable.`}
        confirmLabel={confirmMutation.isPending ? "Confirming…" : "Confirm Bill"}
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setConfirmDialogOpen(false)}
      />

      {/* Register Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">Register Bill Payment</h3>
                  <p className="text-xs text-text-muted">Disburse funds for {bill.bill_number}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-medium transition-all ${
                      paymentMethod === "bank"
                        ? "border-primary-600 bg-primary-50/50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300 font-semibold ring-1 ring-primary-500/30"
                        : "border-border text-text-muted hover:bg-surface-muted"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-medium transition-all ${
                      paymentMethod === "cash"
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30"
                        : "border-border text-text-muted hover:bg-surface-muted"
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    Cash Desk
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Disbursement Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-muted/60 p-2.5 text-xs text-text outline-none focus:border-primary-500 focus:bg-surface"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Settlement Amount (INR ₹)</label>
                <input
                  type="number"
                  value={bill.amount_due}
                  readOnly
                  className="w-full rounded-xl border border-border bg-surface-muted/40 p-2.5 font-mono text-sm font-bold text-text cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Payment Reference / Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. HDFC Bank UTR #9821371"
                  className="w-full rounded-xl border border-border bg-surface-muted/60 p-2.5 text-xs text-text outline-none focus:border-primary-500 focus:bg-surface"
                />
              </div>

              {paymentError && (
                <p className="text-xs font-semibold text-rose-600">{paymentError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentModalOpen(false)}
                  disabled={payMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={payMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {payMutation.isPending ? "Posting Payment…" : "Post Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
