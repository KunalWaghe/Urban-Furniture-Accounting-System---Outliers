/**
 * Visual status badge for customer invoice states.
 *
 * Shows an icon + label for Draft, Confirmed (Open), Paid, or Cancelled customer invoices.
 * Used on customer invoices list and detail pages.
 */

import { CheckCircle2, Clock, CreditCard, XCircle } from "lucide-react";
import type { CustomerInvoiceStatus } from "./customer-invoices-api";

interface CustomerInvoiceStatusBadgeProps {
  status: CustomerInvoiceStatus;
  className?: string;
}

export function CustomerInvoiceStatusBadge({
  status,
  className = "",
}: CustomerInvoiceStatusBadgeProps) {
  switch (status) {
    case "Confirmed":
    case "open":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ${className}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Confirmed
        </span>
      );
    case "Paid":
    case "paid":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 ${className}`}
        >
          <CreditCard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          Paid
        </span>
      );
    case "Cancelled":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 ${className}`}
        >
          <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          Cancelled
        </span>
      );
    case "Draft":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ${className}`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          Draft
        </span>
      );
  }
}
