/**
 * EmptyState — placeholder shown when a list or section has no data.
 *
 * Displays a title, optional description, and optional action button (e.g. "Add contact").
 * Used inside DataTable and standalone on pages with no records yet.
 */
import type { ReactNode } from "react"

interface EmptyStateProps {
  /** Main message (e.g. "No contacts found"). */
  title: string
  /** Secondary hint text (e.g. "Try adjusting your search."). */
  description?: string
  /** Optional button or link rendered below the text. */
  action?: ReactNode
}

/**
 * Centered empty-state card with dashed border.
 *
 * **State OWNED:** none — pure display component.
 *
 * **State CONSUMED:** title, description, and optional action from parent props.
 *
 * **Source of truth:** parent decides when to show this (usually when data.length === 0).
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
