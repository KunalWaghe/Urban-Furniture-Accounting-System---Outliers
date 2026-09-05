/**
 * SkeletonTable — Loading skeleton for DataTable component.
 * 
 * Shows a shimmer placeholder that matches the table structure
 * while data is being fetched.
 */
import { Skeleton, SkeletonButton, SkeletonText } from "@/components/ui/skeleton"

interface SkeletonTableProps {
  /** Number of columns */
  columns?: number
  /** Number of rows */
  rows?: number
  /** Show search bar */
  showSearch?: boolean
  /** Show pagination */
  showPagination?: boolean
}

export function SkeletonTable({
  columns = 4,
  rows = 5,
  showSearch = true,
  showPagination = true,
}: SkeletonTableProps) {
  return (
    <div className="space-y-4">
      {/* Search toolbar skeleton */}
      {showSearch && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <div className="flex gap-2">
            <SkeletonButton width={100} />
          </div>
        </div>
      )}

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            {/* Table header skeleton */}
            <thead className="bg-surface-muted">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th
                    key={i}
                    className="px-3 py-3 text-left sm:px-4"
                  >
                    <SkeletonText width="80%" className="h-4" />
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table body skeleton */}
            <tbody className="divide-y divide-border">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-surface-muted/60">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="px-3 py-3 sm:px-4">
                      <SkeletonText
                        width={colIndex === 0 ? "90%" : colIndex === columns - 1 ? "60%" : "75%"}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination skeleton */}
        {showPagination && (
          <div className="border-t border-border px-3 sm:px-4">
            <div className="flex flex-col items-center justify-between gap-2 py-2 sm:flex-row sm:gap-0">
              <SkeletonText width={120} className="h-4" />
              <div className="flex items-center gap-2">
                <SkeletonButton width={32} className="h-8" />
                <SkeletonButton width={32} className="h-8" />
                <SkeletonButton width={32} className="h-8" />
                <SkeletonButton width={32} className="h-8" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
