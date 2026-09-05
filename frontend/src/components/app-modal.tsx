"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const modalMaxWidthClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
} as const;

export type ModalMaxWidth = keyof typeof modalMaxWidthClass;

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  titleId?: string;
  badge?: ReactNode;
  /** Optional icon or avatar block shown left of the title */
  leading?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: ModalMaxWidth;
  closeOnBackdrop?: boolean;
  bodyClassName?: string;
  /** Tighter padding and typography — ideal for read-only detail dialogs */
  dense?: boolean;
  /** Disable closing via backdrop / X (e.g. while submitting) */
  disableClose?: boolean;
}

/** Base modal shell — header, divider, scrollable body, optional footer with divider. */
export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  titleId,
  badge,
  leading,
  children,
  footer,
  maxWidth = "md",
  closeOnBackdrop = true,
  bodyClassName,
  dense = false,
  disableClose = false,
}: AppModalProps) {
  if (!open) return null;

  function handleClose() {
    if (!disableClose) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={closeOnBackdrop ? handleClose : undefined}
    >
      <div
        className={cn(
          "w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl",
          modalMaxWidthClass[maxWidth]
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn(
            "flex items-start justify-between gap-3",
            dense ? "px-5 pt-4 pb-3" : "gap-4 px-6 pt-6 pb-4"
          )}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {leading}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={titleId}
                  className={cn(
                    "font-semibold tracking-tight text-text",
                    dense ? "text-base" : "text-lg"
                  )}
                >
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p className={cn("text-text-muted", dense ? "mt-0.5 text-xs" : "mt-1 text-sm")}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={disableClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Separator />

        <div
          className={cn(
            "max-h-[70vh] overflow-y-auto",
            dense ? "space-y-3 px-5 py-3.5" : "space-y-4 px-6 py-5",
            bodyClassName
          )}
        >
          {children}
        </div>

        {footer && (
          <>
            <Separator />
            <div className={dense ? "px-5 py-2.5" : "px-6 py-4"}>{footer}</div>
          </>
        )}
      </div>
    </div>
  );
}

/** Standard inline error banner for modal bodies. */
export function ModalError({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
      {children}
    </p>
  );
}

interface FormModalFooterProps {
  onCancel: () => void;
  cancelLabel?: string;
  submitLabel: ReactNode;
  pending?: boolean;
  formId?: string;
  submitDisabled?: boolean;
}

/** Standard cancel + submit footer for form modals. */
export function FormModalFooter({
  onCancel,
  cancelLabel = "Cancel",
  submitLabel,
  pending = false,
  formId,
  submitDisabled = false,
}: FormModalFooterProps) {
  return (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
        {cancelLabel}
      </Button>
      <Button type="submit" form={formId} disabled={pending || submitDisabled}>
        {submitLabel}
      </Button>
    </div>
  );
}
