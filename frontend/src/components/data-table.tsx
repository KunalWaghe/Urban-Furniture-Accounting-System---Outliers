"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Search } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { LoadingSpinner } from "@/components/loading-spinner"
import { TablePagination } from "@/components/ui/table-pagination"

const DEFAULT_PAGE_SIZE = 10

export interface DataTableColumn<T> {
  key: string
  label: string
  accessor?: (row: T) => unknown
  render?: (row: T) => ReactNode
}

interface DataTableProps<T extends { id?: string | number }> {
  columns: DataTableColumn<T>[]
  data?: T[]
  loading?: boolean
  searchPlaceholder?: string
  emptyTitle?: string
  emptyDescription?: string
  /** Called when the search input changes (use for server-side search) */
  onSearch?: (value: string) => void
  /** Page size for client-side pagination (default: 10). Pass 0 to disable. */
  pageSize?: number
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = "Search...",
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or add a new record.",
  onSearch,
  pageSize = DEFAULT_PAGE_SIZE,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filteredData = useMemo(() => {
    if (onSearch || !search.trim()) return data
    const query = search.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessor
          ? col.accessor(row)
          : (row as Record<string, unknown>)[col.key]
        return String(value ?? "").toLowerCase().includes(query)
      })
    )
  }, [columns, data, onSearch, search])

  // Reset to page 1 whenever the filtered set changes
  useEffect(() => {
    setPage(1)
  }, [filteredData.length, search])

  const paginationEnabled = pageSize > 0
  const totalPages = paginationEnabled ? Math.max(1, Math.ceil(filteredData.length / pageSize)) : 1

  const visibleData = useMemo(() => {
    if (!paginationEnabled) return filteredData
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize, paginationEnabled])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearch(value)
    onSearch?.(value)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/40"
        />
      </div>

      {filteredData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {/* Horizontal scroll wrapper for tables on mobile */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted sm:px-4"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleData.map((row, index) => (
                  <tr key={row.id ?? index} className="hover:bg-surface-muted/60">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-3 text-text sm:px-4">
                        {col.render
                          ? col.render(row)
                          : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {paginationEnabled && totalPages > 1 && (
            <div className="border-t border-border px-3 sm:px-4">
              <div className="flex flex-col items-center justify-between gap-2 py-2 sm:flex-row sm:gap-0">
                <p className="text-xs text-text-muted">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredData.length)} of {filteredData.length}
                </p>
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
