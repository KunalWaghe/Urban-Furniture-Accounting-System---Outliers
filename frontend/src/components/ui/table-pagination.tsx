/**
 * TablePagination — page navigation controls for data tables.
 *
 * Renders first/prev/numbered/next/last buttons with a sliding window of
 * page numbers. Used by DataTable and can be reused on any paginated list.
 */
"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface TablePaginationProps {
  /** Current active page (1-based). */
  page: number;
  /** Total number of pages available. */
  totalPages: number;
  /** Called when user clicks a page button. Parent updates page state. */
  onPageChange: (page: number) => void;
  /** How many numbered page buttons to show at once (default: 5) */
  windowSize?: number;
}

/**
 * Pagination button bar with first/prev/numbers/next/last controls.
 *
 * **State OWNED:** none — fully controlled by parent via `page` prop.
 *
 * **State CONSUMED:**
 * - `page`, `totalPages` from parent
 * - `onPageChange` callback to notify parent of page clicks
 *
 * **Source of truth:** parent owns current page (DataTable or page component).
 *
 * **Flow:**
 * 1. Return null if totalPages <= 1 (nothing to paginate)
 * 2. Compute a sliding window of page numbers around current page
 * 3. Render nav buttons; disabled state when at first/last page
 */
export function TablePagination({
  page,
  totalPages,
  onPageChange,
  windowSize = 5,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  // Build the sliding window of page numbers to render
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + windowSize - 1);
  // Shift start left if we're near the last page and window is not full
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }
  const pageNumbers: number[] = [];
  for (let n = start; n <= end; n++) pageNumbers.push(n);

  const btnBase =
    "inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:pointer-events-none disabled:opacity-40";
  const btnIdle =
    "text-text-muted hover:bg-surface-muted hover:text-text border border-transparent";
  const btnActive =
    "border border-primary-500/40 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300";

  return (
    <div
      className="flex items-center justify-center gap-1 py-3"
      role="navigation"
      aria-label="Pagination"
    >
      {/* First page */}
      <button
        type="button"
        className={`${btnBase} ${btnIdle}`}
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      {/* Previous page */}
      <button
        type="button"
        className={`${btnBase} ${btnIdle}`}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Left ellipsis when window does not start at page 1 */}
      {start > 1 && (
        <span className="inline-flex h-8 min-w-[2rem] items-center justify-center text-sm text-text-muted">
          …
        </span>
      )}

      {/* Numbered page buttons */}
      {pageNumbers.map((n) => (
        <button
          key={n}
          type="button"
          className={`${btnBase} ${n === page ? btnActive : btnIdle}`}
          onClick={() => onPageChange(n)}
          aria-current={n === page ? "page" : undefined}
          aria-label={`Page ${n}`}
        >
          {n}
        </button>
      ))}

      {/* Right ellipsis when window does not reach last page */}
      {end < totalPages && (
        <span className="inline-flex h-8 min-w-[2rem] items-center justify-center text-sm text-text-muted">
          …
        </span>
      )}

      {/* Next page */}
      <button
        type="button"
        className={`${btnBase} ${btnIdle}`}
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Last page */}
      <button
        type="button"
        className={`${btnBase} ${btnIdle}`}
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}
