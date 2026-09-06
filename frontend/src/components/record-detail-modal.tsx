"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppModal, type ModalMaxWidth } from "@/components/app-modal";
import { cn } from "@/lib/utils";

interface RecordDetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  titleId?: string;
  badge?: ReactNode;
  children: ReactNode;
  maxWidth?: ModalMaxWidth;
}

/** Read-only detail dialog built on the shared AppModal shell. */
export function RecordDetailModal({
  open,
  onClose,
  title,
  subtitle,
  titleId,
  badge,
  children,
  maxWidth = "sm",
}: RecordDetailModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      titleId={titleId}
      badge={badge}
      maxWidth={maxWidth}
      dense
      bodyClassName="space-y-3"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {children}
    </AppModal>
  );
}

interface DetailSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/** Grouped block inside a detail modal with a section label. */
export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <section className={cn("space-y-1.5", className)}>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{title}</h3>
      {children}
    </section>
  );
}

interface DetailFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
  mono?: boolean;
}

/** Single label + value pair — compact, no per-field card chrome. */
export function DetailField({ label, value, className, mono }: DetailFieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted leading-none">
        {label}
      </p>
      <div className={cn("mt-1 text-sm font-medium text-text", mono && "font-mono tabular-nums")}>
        {value}
      </div>
    </div>
  );
}


interface DetailFieldGridProps {
  children: ReactNode;
  columns?: 1 | 2;
}

/** Responsive grid wrapper for DetailField pairs. */
export function DetailFieldGrid({ children, columns = 2 }: DetailFieldGridProps) {
  return (
    <div className={cn("grid gap-x-4 gap-y-2.5", columns === 2 ? "sm:grid-cols-2" : "grid-cols-1")}>
      {children}
    </div>
  );
}

export { Separator };
