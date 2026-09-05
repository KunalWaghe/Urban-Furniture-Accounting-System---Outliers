"use client";

import { useState } from "react";
import {
  CreditCard,
  Building2,
  Wallet,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { payVendorBill, type PaymentRecord } from "@/features/payments/payments-api";
import { AppModal, ModalError } from "@/components/app-modal";
import { formatINR, todayDate } from "@/lib/format";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId: number | string;
  billNumber: string;
  vendorName?: string;
  totalAmount: number;
  amountPaid: number;
  onSuccess: (payment: PaymentRecord) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  billId,
  billNumber,
  vendorName,
  totalAmount,
  amountPaid,
  onSuccess,
}: PaymentModalProps) {
  const remaining = Math.max(0, Math.round((totalAmount - amountPaid) * 100) / 100);

  const [amount, setAmount] = useState<string>(remaining > 0 ? remaining.toString() : "");
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash">("bank");
  const [date, setDate] = useState<string>(todayDate);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const isOverpayment = numAmount > remaining + 0.001;
  const isInvalidAmount = numAmount <= 0 || isNaN(numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidAmount) {
      setError("Please enter a valid positive payment amount.");
      return;
    }
    if (isOverpayment) {
      setError(`Payment cannot exceed the remaining balance of ${formatINR(remaining)}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const numBillId = Number(billId);
      if (isNaN(numBillId) || numBillId <= 0) {
        throw new Error("A valid persisted vendor bill is required to register a payment.");
      }

      const payment: PaymentRecord = await payVendorBill(numBillId, {
        amount: numAmount,
        payment_method: paymentMethod,
        date: date ? `${date}T00:00:00Z` : undefined,
        note: note.trim() || undefined,
      });

      onSuccess(payment);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to record payment. Please check inputs and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayInFull = () => {
    setAmount(remaining.toFixed(2));
    setError(null);
  };

  return (
    <AppModal
      open={isOpen}
      onClose={onClose}
      title="Register Payment"
      subtitle={`Bill #${billNumber}${vendorName ? ` · ${vendorName}` : ""}`}
      maxWidth="md"
      disableClose={loading}
      leading={
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400">
          <CreditCard className="h-5 w-5" />
        </div>
      }
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-text hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="vendor-payment-form"
            disabled={loading || isInvalidAmount || isOverpayment}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Confirm Payment</span>
            )}
          </button>
        </div>
      }
    >
      {/* Financial Summary Card */}
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/80 bg-surface-muted/50 p-3.5 text-center">
          <div>
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
              Total Bill
            </span>
            <p className="font-mono text-sm font-semibold text-text mt-0.5">
              {formatINR(totalAmount)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
              Paid to Date
            </span>
            <p className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatINR(amountPaid)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
              Remaining Due
            </span>
            <p className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formatINR(remaining)}
            </p>
          </div>
        </div>

      <form id="vendor-payment-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("bank")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  paymentMethod === "bank"
                    ? "border-primary-600 bg-primary-50/60 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-xs"
                    : "border-border bg-surface hover:bg-surface-muted/70 text-text-muted"
                }`}
              >
                <Building2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span>Bank Account (1020)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  paymentMethod === "cash"
                    ? "border-primary-600 bg-primary-50/60 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-xs"
                    : "border-border bg-surface hover:bg-surface-muted/70 text-text-muted"
                }`}
              >
                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Cash Register (1010)</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="payment-amount" className="text-xs font-semibold text-text">
                Amount to Settle
              </label>
              {remaining > 0 && numAmount !== remaining && (
                <button
                  type="button"
                  onClick={handlePayInFull}
                  className="text-[11px] font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  Pay Remaining Balance
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-text-muted">
                ₹
              </span>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                className={`w-full rounded-xl border bg-surface py-2.5 pl-8 pr-4 font-mono text-sm font-medium text-text placeholder:text-text-muted focus:outline-hidden focus:ring-2 ${
                  isOverpayment
                    ? "border-red-500 focus:ring-red-500/30"
                    : "border-border focus:border-primary-500 focus:ring-primary-500/20"
                }`}
                placeholder="0.00"
                required
              />
            </div>
            {isOverpayment && (
              <p className="text-[11px] text-red-500 font-medium">
                Amount cannot exceed remaining balance of {formatINR(remaining)}
              </p>
            )}
          </div>

          {/* Date and Note Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="payment-date" className="text-xs font-semibold text-text flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-text-muted" />
                Payment Date
              </label>
              <input
                id="payment-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text focus:outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="payment-note" className="text-xs font-semibold text-text">
                Reference / Memo
              </label>
              <input
                id="payment-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Wire Ref #8921"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text focus:outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Double-Entry Preview Note */}
          <div className="rounded-xl border border-indigo-200/50 bg-indigo-50/40 p-3 text-[11px] text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Automated Double-Entry Posting:
            </p>
            <p className="mt-0.5 text-indigo-700/90 dark:text-indigo-400/90">
              Dr 2010 Accounts Payable · Cr {paymentMethod === "bank" ? "1020 Bank Account" : "1010 Cash"} ({formatINR(numAmount > 0 ? numAmount : 0)})
            </p>
          </div>

          {error && <ModalError>{error}</ModalError>}
      </form>
    </AppModal>
  );
}
