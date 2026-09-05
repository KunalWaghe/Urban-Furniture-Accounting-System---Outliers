"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Shared height + styling for toolbar inputs/selects so they align with buttons. */
export const toolbarControlClass =
  "h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

/** Row of page-level filters and actions, bottom-aligned. */
export function PageToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-2", className)}>{children}</div>;
}

/** Labelled filter/control column for toolbars. */
export function PageToolbarField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium leading-none text-text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Action buttons column with an invisible label spacer so controls line up
 * with labelled fields like "Financial year".
 */
export function PageToolbarActions({
  children,
  label = "Actions",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium leading-none text-transparent select-none" aria-hidden="true">
        {label}
      </span>
      <div className="flex h-9 items-center gap-2">{children}</div>
    </div>
  );
}

/** Reusable financial-year picker for report toolbars. */
export function FinancialYearField({
  value,
  onChange,
  id = "financial-year",
}: {
  value: number;
  onChange: (year: number) => void;
  id?: string;
}) {
  return (
    <PageToolbarField label="Financial year" htmlFor={id}>
      <input
        id={id}
        type="number"
        min={2000}
        max={2100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(toolbarControlClass, "w-28")}
      />
    </PageToolbarField>
  );
}
