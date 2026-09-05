/**
 * DataTable — reusable table for listing records across master-data pages.
 *
 * Supports client-side search/filter/pagination out of the box, or can be
 * switched to server-side mode by passing pagination/sort/search callbacks.
 *
 * Used by: contacts-page, products-page, and other list views.
 */
"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { SkeletonTable } from "@/components/skeleton-table"
import { TablePagination } from "@/components/ui/table-pagination"

/** Default number of rows shown per page when using client-side pagination. */
const DEFAULT_PAGE_SIZE = 10

/**
 * Describes one column in the table.
 *
 * @template T - The row data type (e.g. Contact, Product).
 */
export interface DataTableColumn<T> {
  /** Unique key used for sorting and default cell lookup. */
  key: string
  /** Header label shown in the table head. */
  label: string
  /** Optional custom value extractor for search filtering. */
  accessor?: (row: T) => unknown
  /** Optional custom cell renderer. Falls back to row[key] when omitted. */
  render?: (row: T) => ReactNode
  /** When true and onSort is provided, the column header becomes clickable. */
  sortable?: boolean
}

interface DataTableProps<T extends { id?: string | number }> {
  columns: DataTableColumn<T>[]
  data?: T[]
  loading?: boolean
  searchPlaceholder?: string
  emptyTitle?: string
  emptyDescription?: string
  /** Controlled search value (if using server search) */
  searchValue?: string
  /** Called when the search input changes (use for server-side search) */
  onSearch?: (value: string) => void
  /** Page size for client-side pagination (default: 10). Pass 0 to disable. */
  pageSize?: number
  /** Server-side pagination page */
  currentPage?: number
  /** Server-side pagination total pages */
  totalPages?: number
  /** Server-side total count */
  totalCount?: number
  /** Server-side page change handler */
  onPageChange?: (page: number) => void
  /** Server-side current sort key */
  sortBy?: string
  /** Server-side current sort order */
  sortOrder?: "asc" | "desc"
  /** Server-side sort handler */
  onSort?: (key: string) => void
  /** Optional custom filter controls rendered beside the search bar */
  toolbarExtra?: ReactNode
}

/**
 * Generic data table with search, sort, pagination, loading, and empty states.
 *
 * **State OWNED (internal):**
 * - `internalSearch` — search text when parent does not control search
 * - `clientPage` — current page when using client-side pagination
 *
 * **State CONSUMED (from props):**
 * - `data`, `loading`, column config
 * - Optional controlled search (`searchValue` + `onSearch`)
 * - Optional server pagination/sort (`currentPage`, `totalPages`, `onPageChange`, etc.)
 *
 * **Source of truth:**
 * - Row data → parent (usually React Query)
 * - Search/page/sort → parent when callback props are passed; otherwise this component
 *
 * **Flow:**
 * 1. Show spinner while `loading` is true
 * 2. Filter rows locally (unless `onSearch` is provided)
 * 3. Slice rows for client pagination (or trust server-provided page)
 * 4. Render table, empty state, or pagination footer
 */
export function DataTable<T extends { id?: string | number }>({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = "Search...",
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or add a new record.",
  searchValue,
  onSearch,
  pageSize = DEFAULT_PAGE_SIZE,
  currentPage,
  totalPages: serverTotalPages,
  totalCount: serverTotalCount,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  toolbarExtra,
}: DataTableProps<T>) {
  // Local search text — only used when parent does not pass searchValue
  const [internalSearch, setInternalSearch] = useState("")
  // Local page number — only used for client-side pagination
  const [clientPage, setClientPage] = useState(1)

  // "Controlled" means the parent owns the search value via searchValue prop
  const isControlledSearch = searchValue !== undefined
  const currentSearch = isControlledSearch ? searchValue : internalSearch

  // Server mode: parent passes onPageChange + totalPages
  const isServerPagination = typeof onPageChange === "function" && serverTotalPages !== undefined

  // Client-side filter: match search query against each column's value
  const filteredData = useMemo(() => {
    if (onSearch || !currentSearch.trim()) return data
    const query = currentSearch.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessor
          ? col.accessor(row)
          : (row as Record<string, unknown>)[col.key]
        return String(value ?? "").toLowerCase().includes(query)
      })
    )
  }, [columns, data, onSearch, currentSearch])

  const clientPaginationEnabled = !isServerPagination && pageSize > 0
  const totalPages = isServerPagination
    ? serverTotalPages
    : clientPaginationEnabled
      ? Math.max(1, Math.ceil(filteredData.length / pageSize))
      : 1

  // Keep client page in bounds if filtered results shrink
  const safeClientPage = Math.min(clientPage, totalPages)
  const activePage = isServerPagination ? (currentPage ?? 1) : safeClientPage

  // Slice visible rows for client pagination; server mode shows full data prop
  const visibleData = useMemo(() => {
    if (isServerPagination || !clientPaginationEnabled) return filteredData
    const start = (safeClientPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [safeClientPage, clientPaginationEnabled, filteredData, isServerPagination, pageSize])

  const totalRecords = isServerPagination
    ? (serverTotalCount ?? filteredData.length)
    : filteredData.length

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (!isControlledSearch) {
      setInternalSearch(value)
    }
    onSearch?.(value)
  }

  const handlePageChange = (nextPage: number) => {
    if (isServerPagination) {
      onPageChange(nextPage)
    } else {
      setClientPage(nextPage)
    }
  }

  if (loading) {
    return (
      <SkeletonTable
        columns={columns.length}
        rows={pageSize || 5}
        showSearch={true}
        showPagination={pageSize > 0}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={currentSearch}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/40"
          />
        </div>
        {toolbarExtra && <div className="flex items-center gap-2">{toolbarExtra}</div>}
      </div>

      {visibleData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {/* Horizontal scroll wrapper for tables on mobile */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  {columns.map((col) => {
                    const isSorted = sortBy === col.key
                    const canSort = col.sortable && onSort
                    return (
                      <th
                        key={col.key}
                        className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted sm:px-4"
                      >
                        {canSort ? (
                          <button
                            type="button"
                            onClick={() => onSort(col.key)}
                            className="inline-flex items-center gap-1.5 font-semibold text-text-muted transition-colors hover:text-text"
                          >
                            <span>{col.label}</span>
                            {isSorted ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-primary-600" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                            )}
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    )
                  })}
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

          {/* Pagination footer — hidden when only one page exists */}
          {totalPages > 1 && (
            <div className="border-t border-border px-3 sm:px-4">
              <div className="flex flex-col items-center justify-between gap-2 py-2 sm:flex-row sm:gap-0">
                <p className="text-xs text-text-muted">
                  {totalRecords === 0
                    ? 0
                    : `${(activePage - 1) * pageSize + 1}–${Math.min(
                      activePage * pageSize,
                      totalRecords
                    )} of ${totalRecords}`}
                </p>
                <TablePagination
                  page={activePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
