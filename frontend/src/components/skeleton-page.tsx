/**
 * SkeletonPage — Full-page skeleton layouts for different page types.
 * 
 * Provides pre-built skeleton layouts for common page structures:
 * - Dashboard with KPI cards and charts
 * - List pages with table
 * - Detail pages with header and content sections
 * - Form pages with input fields
 */
import { Skeleton, SkeletonButton, SkeletonText } from "@/components/ui/skeleton"
import { SkeletonKpiCard } from "@/components/skeleton-kpi-card"
import { SkeletonTable } from "@/components/skeleton-table"
import { SkeletonCard } from "@/components/skeleton-card"
import { SkeletonForm } from "@/components/skeleton-form"

/** Dashboard page skeleton with KPI cards and content sections */
export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-2">
        <SkeletonText width="30%" className="h-8" />
        <SkeletonText width="50%" className="h-5" />
      </div>

      {/* KPI cards grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </div>

      {/* Content sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>
    </div>
  )
}

/** List page skeleton with header, actions, and table */
export function SkeletonListPage() {
  return (
    <div className="space-y-6">
      {/* Page header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonText width={200} className="h-8" />
          <SkeletonText width={300} className="h-5" />
        </div>
        <SkeletonButton width={120} />
      </div>

      {/* Data table */}
      <SkeletonTable />
    </div>
  )
}

/** Detail page skeleton with header and content sections */
export function SkeletonDetailPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonText width={250} className="h-8" />
          <SkeletonText width={150} className="h-5" />
        </div>
        <div className="flex gap-2">
          <SkeletonButton width={80} />
          <SkeletonButton width={80} />
        </div>
      </div>

      {/* Main content card */}
      <SkeletonCard lines={8} />

      {/* Related data section */}
      <div className="space-y-4">
        <SkeletonText width={150} className="h-6" />
        <SkeletonTable columns={3} rows={3} showSearch={false} showPagination={false} />
      </div>
    </div>
  )
}

/** Form page skeleton */
export function SkeletonFormPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <SkeletonText width={200} className="h-8" />
        <SkeletonText width={350} className="h-5" />
      </div>

      {/* Form */}
      <SkeletonForm fields={8} showHeader={false} />
    </div>
  )
}

/** Report page skeleton with filters and content */
export function SkeletonReportPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonText width={200} className="h-8" />
          <SkeletonText width={300} className="h-5" />
        </div>
        <SkeletonButton width={120} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Report content */}
      <div className="space-y-6">
        <SkeletonCard lines={6} />
        <SkeletonTable showSearch={false} />
      </div>
    </div>
  )
}
