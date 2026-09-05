import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardIcon = ComponentType<LucideProps>;
type PanelTone = "blue" | "indigo" | "purple";
type MetricTone = "neutral" | "emerald" | "blue" | "amber";

const panelToneClasses: Record<PanelTone, string> = {
  blue: "border-blue-100/80 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400",
  indigo: "border-indigo-100/80 bg-indigo-50 text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400",
  purple: "border-purple-100/80 bg-purple-50 text-purple-600 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-400",
};

const metricToneClasses: Record<MetricTone, { card: string; label: string; value: string; detail: string; icon: string; divider: string }> = {
  neutral: {
    card: "border-border/80 bg-surface-muted/60 hover:bg-surface-muted",
    label: "text-text-muted",
    value: "text-text",
    detail: "text-text-muted",
    icon: "border border-border bg-surface text-text-muted",
    divider: "border-border/60",
  },
  emerald: {
    card: "border-emerald-200/60 bg-emerald-50/40 hover:bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    label: "text-emerald-800 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-400",
    detail: "text-emerald-600 dark:text-emerald-500",
    icon: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    divider: "border-emerald-200/40 dark:border-emerald-900/40",
  },
  blue: {
    card: "border-blue-200/60 bg-blue-50/40 hover:bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/20",
    label: "text-blue-800 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-400",
    detail: "text-blue-600 dark:text-blue-500",
    icon: "bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    divider: "border-blue-200/40 dark:border-blue-900/40",
  },
  amber: {
    card: "border-amber-200/60 bg-amber-50/40 hover:bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20",
    label: "text-amber-800 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-400",
    detail: "text-amber-600 dark:text-amber-500",
    icon: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    divider: "border-amber-200/40 dark:border-amber-900/40",
  },
};

export function DashboardPanel({
  id,
  purpose,
  children,
  className,
}: {
  id: string;
  purpose?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-purpose={purpose}
      className={cn("space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-sm", className)}
    >
      {children}
    </section>
  );
}

export function DashboardPanelHeader({
  icon: Icon,
  tone,
  title,
  badge,
  description,
  actions,
}: {
  icon: DashboardIcon;
  tone: PanelTone;
  title: string;
  badge: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3.5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs", panelToneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-text">{title}</h2>
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", panelToneClasses[tone])}>
              {badge}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">{description}</p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 self-end sm:self-auto">{actions}</div>}
    </div>
  );
}

export function DashboardMetricCard({
  title,
  icon: Icon,
  value,
  valueDetail,
  footerLabel,
  footerValue,
  tone = "neutral",
}: {
  title: string;
  icon: DashboardIcon;
  value: ReactNode;
  valueDetail: ReactNode;
  footerLabel: string;
  footerValue: ReactNode;
  tone?: MetricTone;
}) {
  const styles = metricToneClasses[tone];

  return (
    <div className={cn("rounded-xl border p-4 transition-all", styles.card)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider", styles.label)}>{title}</span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", styles.icon)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold tracking-tight", styles.value)}>{value}</span>
        <span className={cn("text-xs font-medium", styles.detail)}>{valueDetail}</span>
      </div>
      <div className={cn("mt-2 flex items-center justify-between border-t pt-2 text-[11px]", styles.divider)}>
        <span className={styles.detail}>{footerLabel}</span>
        <span className={cn("font-mono font-semibold", styles.value)}>{footerValue}</span>
      </div>
    </div>
  );
}

export function DashboardTableCard({
  id,
  title,
  count,
  tone = "blue",
  actions,
  children,
  className,
}: {
  id?: string;
  title: string;
  count?: ReactNode;
  tone?: PanelTone;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const dotClass = tone === "indigo" ? "bg-indigo-500" : tone === "purple" ? "bg-purple-500" : "bg-primary-600";

  return (
    <div id={id} className={cn("overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs", className)}>
      <div className="flex items-center justify-between border-b border-border/80 bg-surface-muted/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
          <span className="text-xs font-bold uppercase tracking-wider text-text">{title}</span>
          {count && <span className="text-[11px] font-normal text-text-muted">{count}</span>}
        </div>
        {actions && <div className="flex items-center gap-2.5 text-xs">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function DashboardModal({
  icon: Icon,
  tone,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  icon: DashboardIcon;
  tone: PanelTone;
  title: ReactNode;
  description: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", panelToneClasses[tone])}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">{title}</h3>
              <p className="text-xs text-text-muted">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text"
            aria-label="Close dialog"
          >
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-4 space-y-4">{children}</div>
        {footer && <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">{footer}</div>}
      </div>
    </div>
  );
}
