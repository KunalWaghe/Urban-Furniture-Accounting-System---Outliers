import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: LucideIcon
}

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
