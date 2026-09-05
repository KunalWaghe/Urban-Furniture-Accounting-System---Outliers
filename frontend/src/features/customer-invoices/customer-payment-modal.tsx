/**
 * Customer Inbound Payment Modal (Task 6C / P0-FE-11).
 *
 * "Register Payment / Receipt" modal on confirmed Customer Invoice.
 * Receives customer payment via Cash or Bank desk, auto-posts journal entry impact
 * (Dr Cash/Bank / Cr Accounts Receivable), updates invoice status to Paid,
 * and eliminates outstanding due amount.
 */

"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Wallet,
  X,
  ArrowDownLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatINR, todayDate } from "@/lib/format";
import type { CustomerInvoice, CustomerPaymentInput } from "./customer-invoices-api";

interface CustomerPaymentModalProps {
  invoice: CustomerInvoice;
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CustomerPaymentInput) => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function CustomerPaymentModal({
  invoice,
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: CustomerPaymentModalProps) {
  const [method, setMethod] = useState<"bank" | "cash">("bank");
  const [date, setDate] = useState(todayDate);
  const [amount, setAmount] = useState(String(invoice.amount_due || invoice.total_amount));
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setValidationError("Payment amount must be greater than zero.");
      return;
    }
    if (numAmount > invoice.amount_due) {
      setValidationError(`Amount cannot exceed the current balance due (${formatINR(invoice.amount_due)}).`);
      return;
    }

    onSubmit({
      payment_method: method,
      payment_date: date,
      amount: numAmount,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-elevated/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Register Customer Receipt
              </h2>
              <p className="text-xs text-text-muted">
                Invoice {invoice.invoice_number} · {invoice.customer_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Outstanding Due Callout */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated/40 p-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Outstanding Balance Due
              </span>
              <p className="text-xs text-text-muted">Payment Type: Inbound Customer Receipt</p>
            </div>
            <span className="text-xl font-bold text-primary-600">
              {formatINR(invoice.amount_due)}
            </span>
          </div>

          {(error || validationError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
              {error || validationError}
            </div>
          )}

          {/* Payment Method Selector (Cash vs Bank desk) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Payment Receipt Desk <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("bank")}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  method === "bank"
                    ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500 dark:bg-primary-950/20"
                    : "border-border bg-surface hover:bg-surface-elevated"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    method === "bank"
                      ? "bg-primary-500 text-white"
                      : "bg-surface-elevated text-text-muted"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">Bank Desk</div>
                  <div className="text-[11px] text-text-muted">Account #1020</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("cash")}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  method === "cash"
                    ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-500 dark:bg-primary-950/20"
                    : "border-border bg-surface hover:bg-surface-elevated"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    method === "cash"
                      ? "bg-primary-500 text-white"
                      : "bg-surface-elevated text-text-muted"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">Cash Desk</div>
                  <div className="text-[11px] text-text-muted">Account #1010</div>
                </div>
              </button>
            </div>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">
                Receipt Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">
                Receipt Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.amount_due}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Reference / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Reference / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Cheque #4012, NEFT Ref, or Cash receipt voucher"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Accounting Posting Notice */}
          <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-3 text-[11px] text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
            <p className="font-semibold">Double-Entry Posting on Receipt:</p>
            <p className="mt-0.5">
              Debit {method === "bank" ? "Bank Account (1020)" : "Cash (1010)"} &middot; Credit Accounts Receivable / Debtors (1030)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "Posting Payment..." : "Confirm & Post Receipt"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
