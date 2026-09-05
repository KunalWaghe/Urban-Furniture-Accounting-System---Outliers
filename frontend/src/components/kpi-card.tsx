/**
 * KpiCard — dashboard metric card showing a title, big value, and optional subtitle.
 *
 * Used on the dashboard to display KPIs like total revenue, open invoices, etc.
 * Optionally shows a Lucide icon in the top-right corner.
 */
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  /** Small label above the number (e.g. "Total Revenue"). */
  title: string
  /** Main metric displayed in large bold text (usually pre-formatted by parent). */
  value: string
  /** Optional helper text below the value (e.g. "vs last month"). */
  subtitle?: string
  /** Optional Lucide icon component shown in a colored box. */
  icon?: LucideIcon
}

/**
 * Single KPI summary card for dashboard grids.
 *
 * **State OWNED:** none — display-only.
 *
 * **State CONSUMED:** title, value, subtitle, and icon from parent props.
 *
 * **Source of truth:** parent page computes/formats the metric values (often from API).
 */
export function KpiCard({ title, value, subtitle, icon: Icon }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold text-text">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
