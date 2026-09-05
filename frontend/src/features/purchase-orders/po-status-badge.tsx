import type { PurchaseOrderStatus } from "./purchase-orders-api";

const STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  confirmed: "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-400",
  draft: "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-400",
  cancelled: "border-red-200/70 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-400",
};

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  confirmed: "Confirmed",
  draft: "Draft",
  cancelled: "Cancelled",
};

export function PoStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
