"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Search } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { LoadingSpinner } from "@/components/loading-spinner"

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
  onSearch?: (value: string) => void
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = "Search...",
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or add a new record.",
  onSearch,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")

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
      <div className="relative max-w-sm">
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
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((row, index) => (
                <tr key={row.id ?? index} className="hover:bg-surface-muted/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-text">
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
      )}
    </div>
  )
}
