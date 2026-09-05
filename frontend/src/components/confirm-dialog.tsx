/**
 * ConfirmDialog — modal overlay that asks the user to confirm or cancel an action.
 *
 * Used before destructive operations like delete. The parent controls visibility
 * via the `open` prop (this component does not manage its own open/close state).
 */
"use client"

interface ConfirmDialogProps {
  /** When false, nothing is rendered. Parent toggles this to show/hide the dialog. */
  open: boolean
  /** Bold heading at the top of the dialog. */
  title: string
  /** Explanatory text below the title. */
  message: string
  /** Label for the primary action button (default: "Confirm"). */
  confirmLabel?: string
  /** Label for the dismiss button (default: "Cancel"). */
  cancelLabel?: string
  /** Called when the user clicks the confirm button. */
  onConfirm: () => void
  /** Called when the user clicks cancel or wants to dismiss. */
  onCancel: () => void
  /** When true, confirm button uses red styling (for delete/destructive actions). */
  destructive?: boolean
}

/**
 * Confirmation modal with title, message, and two action buttons.
 *
 * **State OWNED:** none — fully controlled by parent props.
 *
 * **State CONSUMED:**
 * - `open` — whether the dialog is visible
 * - `title`, `message`, button labels
 * - `onConfirm`, `onCancel` — parent handles the actual logic
 *
 * **Source of truth:** parent page/component owns open state and action handlers.
 *
 * **Flow:**
 * 1. If `open` is false, return null (dialog hidden)
 * 2. Render overlay with title, message, Cancel and Confirm buttons
 * 3. Parent closes dialog by setting `open` to false inside onConfirm/onCancel
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
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        <p className="mt-2 text-sm text-text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
