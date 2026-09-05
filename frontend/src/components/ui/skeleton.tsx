/**
 * Skeleton — Base skeleton loading component for placeholder content.
 * 
 * Provides a shimmer animation effect to indicate loading state.
 * Can be composed into complex skeleton layouts.
 */
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional custom width */
  width?: string | number
  /** Optional custom height */
  height?: string | number
  /** Disable animation */
  noAnimation?: boolean
}

export function Skeleton({
  className,
  width,
  height,
  noAnimation = false,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-surface-muted",
        !noAnimation && "animate-pulse",
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  )
}

/** Circular skeleton for avatars or icons */
export function SkeletonCircle({
  size = 40,
  className,
  ...props
}: { size?: number } & Omit<SkeletonProps, "width" | "height">) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      width={size}
      height={size}
      {...props}
    />
  )
}

/** Text line skeleton with optional width percentage */
export function SkeletonText({
  width = "100%",
  className,
  ...props
}: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-4", className)}
      width={width}
      {...props}
    />
  )
}

/** Button-shaped skeleton */
export function SkeletonButton({
  width = 100,
  className,
  ...props
}: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-10 rounded-lg", className)}
      width={width}
      {...props}
    />
  )
}
