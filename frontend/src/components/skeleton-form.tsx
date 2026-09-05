/**
 * SkeletonForm — Loading skeleton for form pages.
 * 
 * Shows placeholder fields while form data is being loaded
 * (e.g., when editing an existing record).
 */
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton, SkeletonButton, SkeletonText } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SkeletonFormProps {
  /** Number of form fields */
  fields?: number
  /** Show form header */
  showHeader?: boolean
  /** Show action buttons */
  showActions?: boolean
  /** Custom className */
  className?: string
}

export function SkeletonForm({
  fields = 6,
  showHeader = true,
  showActions = true,
  className,
}: SkeletonFormProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {showHeader && (
        <CardHeader className="space-y-2">
          <SkeletonText width="40%" className="h-7" />
          <SkeletonText width="60%" className="h-4" />
        </CardHeader>
      )}
      <CardContent className={cn("space-y-6", showHeader && "pt-0")}>
        {/* Form fields */}
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonText width="30%" className="h-4" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <SkeletonButton width={100} />
            <SkeletonButton width={100} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Skeleton for a single form field */
export function SkeletonFormField({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <SkeletonText width="30%" className="h-4" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}
