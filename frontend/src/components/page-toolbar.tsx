"use client";

import type { ReactNode } from "react";
import { Grid2X2, List } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared height + styling for toolbar inputs/selects so they align with buttons. */
export const toolbarControlClass =
  "h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

/** Native `<select>` styling matched to toolbar controls. */
export const toolbarSelectClass = cn(toolbarControlClass, "cursor-pointer");

/** Segmented toggle shell — same outer height as toolbar selects. */
export const toolbarSegmentClass =
  "inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-surface-muted p-0.5";

/** Segmented toggle option — sized to fit inside `toolbarSegmentClass`. */
export function toolbarSegmentButtonClass(active: boolean) {
  return cn(
    "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition",
    active ? "bg-surface text-primary-600 shadow-sm" : "text-text-muted hover:text-text",
  );
}

/** Table / Kanban view switcher aligned with toolbar filter selects. */
export function TableKanbanToggle({
  value,
  onChange,
}: {
  value: "table" | "kanban";
  onChange: (value: "table" | "kanban") => void;
}) {
  return (
    <div className={toolbarSegmentClass} role="group" aria-label="View mode">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={toolbarSegmentButtonClass(value === "table")}
        aria-pressed={value === "table"}
      >
        <List className="h-3.5 w-3.5" />
        Table
      </button>
      <button
        type="button"
        onClick={() => onChange("kanban")}
        className={toolbarSegmentButtonClass(value === "kanban")}
        aria-pressed={value === "kanban"}
      >
        <Grid2X2 className="h-3.5 w-3.5" />
        Kanban
      </button>
    </div>
  );
}

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
