/**
 * StatusBadge — colored pill that displays a workflow status string.
 *
 * Maps known accounting statuses (Draft, Paid, Overdue, etc.) to consistent
 * background/text colors. Unknown statuses get a neutral fallback style.
 */

/** Color classes keyed by status label. Add new statuses here as needed. */
const STATUS_STYLES: Record<string, string> = {
  // Accounting workflow statuses
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Submitted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  Approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Received: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Partially Paid": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Overdue: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  Closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Active: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
}

/** Applied when status is not found in STATUS_STYLES. */
const FALLBACK_STYLES =
  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"

interface StatusBadgeProps {
  /** Status label from the API (e.g. "Draft", "Paid"). */
  status: string
}

/**
 * Renders a rounded badge with status-specific colors.
 *
 * **State OWNED:** none.
 *
 * **State CONSUMED:** `status` string from parent (usually a row field from API data).
 *
 * **Source of truth:** server/database status value passed as prop.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? FALLBACK_STYLES

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  )
}
