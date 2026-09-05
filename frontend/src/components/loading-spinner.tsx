const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
} as const

interface LoadingSpinnerProps {
  size?: keyof typeof SIZES
  label?: string
}

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
