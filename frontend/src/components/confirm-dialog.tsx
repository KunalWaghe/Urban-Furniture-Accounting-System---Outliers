"use client";

import { useEffect, useId, useRef } from "react";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  /** Prevent duplicate mutations and dismissal while the action is in flight. */
  pending?: boolean;
}

/**
 * Accessible controlled confirmation dialog. It traps focus, restores it to
 * the triggering control, handles Escape, and makes confirmation single-flight.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
  pending = false,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";

    const target = destructive ? cancelButtonRef.current : cancelButtonRef.current;
    target?.focus();

    return () => {
      document.body.style.overflow = "";
      returnFocusRef.current?.focus();
    };
  }, [destructive, open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, open, pending]);

  if (!open) return null;

  return (
    <AppModal
      open={open}
      onClose={onCancel}
      title={title}
      titleId={titleId}
      maxWidth="sm"
      closeOnBackdrop={!pending}
      disableClose={pending}
      footer={
        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-sm font-medium text-text hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              if (!pending) onConfirm();
            }}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p id={descriptionId} className="text-sm leading-relaxed text-text-muted">
        {message}
      </p>
    </AppModal>
  );
}
