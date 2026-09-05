/**
 * SkeletonCard — Reusable card skeleton for loading states.
 * 
 * Used across dashboard, lists, and detail pages to show
 * loading placeholders while data is being fetched.
 */
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton, SkeletonText } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  /** Show header skeleton */
  showHeader?: boolean
  /** Number of content lines */
  lines?: number
  /** Custom className */
  className?: string
}

export function SkeletonCard({
  showHeader = true,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {showHeader && (
        <CardHeader className="space-y-2">
          <SkeletonText width="60%" className="h-6" />
          <SkeletonText width="40%" className="h-4" />
        </CardHeader>
      )}
      <CardContent className={cn("space-y-3", showHeader && "pt-0")}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonText
            key={i}
            width={i === lines - 1 ? "70%" : "100%"}
          />
        ))}
      </CardContent>
    </Card>
  )
}
