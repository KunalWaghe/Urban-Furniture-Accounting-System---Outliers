/**
 * LoadingSpinner — animated spinner with optional label.
 *
 * Used while async data is fetching (e.g. inside DataTable or page loaders).
 * Includes accessibility attributes for screen readers.
 */

/** Maps size prop values to Tailwind classes for the spinning circle. */
const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
} as const

interface LoadingSpinnerProps {
  /** Visual size of the spinner (default: "md"). */
  size?: keyof typeof SIZES
  /** Text shown below the spinner (default: "Loading..."). Pass empty string to hide. */
  label?: string
}

/**
 * Spinning loading indicator.
 *
 * **State OWNED:** none — no internal state.
 *
 * **State CONSUMED:** size and label from props.
 *
 * **Source of truth:** parent decides when to render this (usually when isLoading is true).
 */
export function LoadingSpinner({ size = "md", label = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-2" role="status" aria-live="polite">
      <div
        className={`animate-spin rounded-full border-primary-500 border-t-transparent ${SIZES[size]}`}
      />
      {label && <span className="text-sm text-text-muted">{label}</span>}
    </div>
  )
}
