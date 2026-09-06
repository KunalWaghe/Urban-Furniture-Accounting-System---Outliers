/**
 * Customer Invoice Detail Page (Task 6B / P0-FE-10).
 *
 * View single customer invoice with status badge (Draft -> Confirmed -> Paid),
 * linked Sales Order reference, journal entry indicators, line items table,
 * and inbound customer payment modal integration (Task 6C).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileCheck,
  FileText,
  Receipt,
  User,
  Wallet,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { formatDate, formatINR } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  fetchCustomerInvoice,
  payCustomerInvoice,
  type CustomerPaymentInput,
} from "./customer-invoices-api";
import { CustomerInvoiceStatusBadge } from "./customer-invoice-status-badge";
import { CustomerPaymentModal } from "./customer-payment-modal";

interface CustomerInvoiceDetailPageProps {
  invoiceId: string;
}

export function CustomerInvoiceDetailPage({ invoiceId }: CustomerInvoiceDetailPageProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // ── Dialog & modal state ──────────────────────────────────────────────────
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // ── Query: Load customer invoice by ID ───────────────────────────────────
  const invoiceQuery = useQuery({
    queryKey: ["customer-invoice", invoiceId],
    queryFn: () => fetchCustomerInvoice(invoiceId),
  });

  // ── Mutation: Inbound customer payment (Task 6C) ──────────────────────────
  const payMutation = useMutation({
    mutationFn: (input: CustomerPaymentInput) => payCustomerInvoice(invoiceId, input),
    onSuccess: () => {
      setPaymentModalOpen(false);
      setPaymentError(null);
      void queryClient.invalidateQueries({ queryKey: ["customer-invoice", invoiceId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
    },
    onError: (err: Error) => {
      setPaymentError(err.message || "Failed to process payment");
    },
  });

  if (invoiceQuery.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner label="Loading customer invoice details..." />
      </div>
    );
  }

  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-text-muted">Could not load invoice &ldquo;{invoiceId}&rdquo;.</p>
        <Link href="/sales-invoices" className="text-sm font-semibold text-primary-600 hover:underline">
          Back to Customer Invoices
        </Link>
      </div>
    );
  }

  const invoice = invoiceQuery.data;
  const isConfirmed = invoice.status === "Confirmed" || invoice.status === "Partially Paid";
  const isPaid = invoice.status === "Paid";

  return (
    <div className="space-y-6 pb-16">
      {/* ── Breadcrumbs ───────────────────────────────────────────────────── */}
      <Link
        href="/sales-invoices"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Customer Invoices
      </Link>

      {/* ── Page Header & Workflow Action Bar ─────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {invoice.invoice_number}
            </h1>
            <CustomerInvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Commercial Customer Invoice issued on {formatDate(invoice.invoice_date)}
          </p>
        </div>

        {/* State Machine Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Confirmed -> Register Payment Action (Task 6C) */}
          {isConfirmed && (
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setPaymentError(null);
                setPaymentModalOpen(true);
              }}
              className="gap-1.5 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 w-full sm:w-auto"
            >
              <CreditCard className="h-4 w-4" />
              Register Payment / Receipt
            </Button>
          )}

          {/* Paid State Marker */}
          {isPaid && (
            <div className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Fully Paid & Settled
            </div>
          )}
        </div>
      </div>

      {/* ── Invoice Details Meta Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Customer */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <User className="h-4 w-4 text-blue-500" />
            Customer
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">
            {invoice.customer_name}
          </p>
          <p className="text-xs text-text-muted">Client ID #{invoice.customer_id}</p>
        </div>

        {/* Linked Sales Order */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <FileText className="h-4 w-4 text-purple-500" />
            Source Sales Order
          </div>
          <div className="mt-2">
            {invoice.so_id ? (
              <Link
                href={`/sales-orders/${invoice.so_id}`}
                className="inline-flex items-center gap-1 text-base font-bold text-primary-600 hover:underline"
              >
                {invoice.so_number || `SO-${String(invoice.so_id).padStart(4, "0")}`}
              </Link>
            ) : (
              <p className="text-sm text-text-muted">Direct Invoice (No SO)</p>
            )}
          </div>
          <p className="text-xs text-text-muted">Originating document</p>
        </div>

        {/* Due Date */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <Calendar className="h-4 w-4 text-amber-500" />
            Payment Due Date
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">
            {formatDate(invoice.due_date)}
          </p>
          <p className="text-xs text-text-muted">Net 14 Credit Terms</p>
        </div>

        {/* Balance Due */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            Amount Outstanding
          </div>
          <p
            className={`mt-2 text-xl font-bold ${invoice.amount_due > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
          >
            {formatINR(invoice.amount_due)}
          </p>
          <p className="text-xs text-text-muted">
            {invoice.amount_due > 0 ? "Pending customer settlement" : "Zero balance"}
          </p>
        </div>
      </div>

      {/* ── Double-Entry Ledger & Payment Audit Card ─────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Double-Entry Accounting Reference
              </h3>
              <p className="text-xs text-text-muted">
                Sales Journal (SLS) &middot; Dr Debtors (1030) / Cr Sales Income (4010)
              </p>
            </div>
          </div>

          {invoice.journal_entry_id ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-mono font-medium text-text-primary">
              JE-{(invoice.journal_entry_id).toString().padStart(4, "0")} (Posted)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Journal entry unavailable / not posted
            </span>
          )}
        </div>

        {/* If payment registered, show payment details banner */}
        {invoice.payment_method && (
          <div className="mt-4 border-t border-border pt-4 text-xs text-text-primary">
            <span className="font-semibold uppercase tracking-wider text-text-muted">
              Settlement Record:
            </span>{" "}
            Received via{" "}
            <span className="font-semibold capitalize text-primary-600">
              {invoice.payment_method} Desk
            </span>{" "}
            on {invoice.payment_date ? formatDate(invoice.payment_date) : "N/A"}
            {invoice.payment_notes && (
              <span className="text-text-muted"> &middot; Note: {invoice.payment_notes}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Line Items Table ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="border-b border-border bg-surface-elevated/60 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Invoice Line Items
          </h2>
        </div>

        {isMobile ? (
          /* Mobile card view */
          <div className="divide-y divide-border">
            {invoice.lines.map((line, idx) => (
              <div key={line.id || idx} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-xs text-text-muted">#{idx + 1}</span>
                    <p className="font-medium text-text-primary">
                      {line.product_name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {line.account_name ?? "Unavailable"}
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
                  <th className="px-5 py-3">Product Description</th>
                  <th className="px-5 py-3">Chart of Account</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.lines.map((line, idx) => (
                  <tr key={line.id || idx} className="hover:bg-surface-elevated/40">
                    <td className="px-5 py-3.5 text-xs text-text-muted">{idx + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-text-primary">
                      {line.product_name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-muted">
                      {line.account_name ?? "Unavailable"}
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

        {/* ── Financial Summary Breakdown ────────────────────────────────── */}
        <div className="border-t border-border bg-surface-elevated/30 p-4 sm:p-5">
          <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Invoice Subtotal</span>
              <span className="font-mono font-medium text-text-primary">{formatINR(invoice.subtotal ?? invoice.total_amount)}</span>
            </div>
            {(invoice.tax_percent ?? 0) > 0 && (
              <div className="flex justify-between text-text-muted">
                <span>Tax ({invoice.tax_percent}%)</span>
                <span className="font-mono font-medium text-text-primary">{formatINR(invoice.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>Total Amount</span>
              <span className="font-mono font-semibold text-text-primary">{formatINR(invoice.total_with_tax ?? invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Amount Paid</span>
              <span className="font-mono font-medium text-emerald-600">
                {formatINR(invoice.amount_paid)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-text-primary">
              <span>Balance Due</span>
              <span className={`font-mono font-bold ${invoice.amount_due > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {formatINR(invoice.amount_due)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Customer Payment Modal (Task 6C) ─────────────────────────────── */}
      <CustomerPaymentModal
        invoice={invoice}
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={(input) => payMutation.mutate(input)}
        isSubmitting={payMutation.isPending}
        error={paymentError}
      />
    </div>
  );
}
