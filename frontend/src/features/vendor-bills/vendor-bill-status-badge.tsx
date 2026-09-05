/**
 * Visual status badge for vendor bill states.
 *
 * Shows an icon + label for Draft, Confirmed, Paid, or Cancelled bills.
 * Used on the vendor bills list and detail pages.
 */

import { CheckCircle2, Clock, CreditCard, XCircle } from "lucide-react";
import type { VendorBillStatus } from "./vendor-bills-api";

interface VendorBillStatusBadgeProps {
  status: VendorBillStatus;
  className?: string;
}

/**
 * Renders a colored badge with an icon for the given vendor bill status.
 *
 * @param status - Bill status from the API (Draft, Confirmed, Paid, Cancelled, etc.).
 * @param className - Optional extra CSS classes to append.
 */
export function VendorBillStatusBadge({ status, className = "" }: VendorBillStatusBadgeProps) {
  switch (status) {
    case "Confirmed":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ${className}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Confirmed
        </span>
      );
    case "Paid":
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
