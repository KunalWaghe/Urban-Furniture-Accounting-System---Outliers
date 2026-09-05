/**
 * SkeletonKpiCard — Loading skeleton for KPI dashboard cards.
 * 
 * Matches the structure of the KpiCard component.
 */
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/skeleton"

export function SkeletonKpiCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <SkeletonText width="50%" className="h-4" />
            <SkeletonText width="70%" className="h-8" />
            <SkeletonText width="40%" className="h-4" />
          </div>
          <SkeletonCircle size={48} />
        </div>
      </CardContent>
    </Card>
  )
}
