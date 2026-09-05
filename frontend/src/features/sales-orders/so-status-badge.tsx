/**
 * Visual status badge for sales order states.
 *
 * Maps each SO status (Draft, Confirmed, Cancelled, Partially Billed) to
 * a colored pill with a dot indicator. Used on list and detail pages.
 */

import type { SalesOrder } from "@/lib/types";

/** Tailwind classes for each sales order status variant. */
const STATUS_STYLES: Record<SalesOrder["status"], string> = {
  Draft: "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-400",
  Confirmed:
    "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-400",
  Cancelled: "border-red-200/70 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-400",
  "Partially Billed":
    "border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-400",
};

/**
 * Renders a colored badge showing the sales order status.
 *
 * @param status - One of Draft, Confirmed, Cancelled, or Partially Billed (Invoiced).
 */
export function SoStatusBadge({ status }: { status: SalesOrder["status"] }) {
  const label = status === "Partially Billed" ? "Invoiced" : status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        STATUS_STYLES[status] ?? STATUS_STYLES.Draft
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
