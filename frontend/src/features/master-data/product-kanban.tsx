"use client";

import { useState } from "react";
import { Edit3, RotateCcw, Trash2 } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

export interface ProductKanbanProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onReactivate: (product: Product) => void;
  reactivating?: boolean;
  onMove: (product: Product, category: string | null) => void;
  search: string;
  onSearch: (value: string) => void;
  loading: boolean;
}

function productTypeLabel(value: string) {
  return value === "goods" ? "Goods" : value === "service" ? "Service" : value[0].toUpperCase() + value.slice(1);
}

function productInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Kanban-style product view grouped by category.
 *
 * Receives the same paginated `products` array as the table — columns are
 * built client-side from unique category names. Edit/delete callbacks bubble
 * up to ProductsPage so the parent owns modal and mutation state.
 */
export function ProductKanban({
  products,
  onEdit,
  onDelete,
  onReactivate,
  reactivating = false,
  onMove,
  search,
  onSearch,
  loading,
}: ProductKanbanProps) {
  const groups = Array.from(new Set(products.map((product) => product.category || "Uncategorized"))).sort();
  const [hiddenGroups, setHiddenGroups] = useState<string[]>([]);
  const [draggingProductId, setDraggingProductId] = useState<number | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const visibleGroups = groups.filter((group) => !hiddenGroups.includes(group));

  function toggleGroup(group: string) {
    setHiddenGroups((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group]
    );
  }

  function dropProduct(group: string) {
    const product = products.find((item) => item.id === draggingProductId);
    if (!product) return;
    const currentGroup = product.category || "Uncategorized";
    if (currentGroup !== group) onMove(product, group === "Uncategorized" ? null : group);
    setDraggingProductId(null);
    setDragOverGroup(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search products..."
          className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text">
            Columns ({visibleGroups.length}/{groups.length})
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Show columns
              </span>
              <button
                type="button"
                onClick={() => setHiddenGroups([])}
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Show all
              </button>
            </div>
            <div className="space-y-2">
              {groups.map((group) => (
                <label key={group} className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={!hiddenGroups.includes(group)}
                    onChange={() => toggleGroup(group)}
                    className="h-4 w-4 accent-primary-600"
                  />
                  {group}
                </label>
              ))}
            </div>
          </div>
        </details>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
          No products found.
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
          Select at least one column to view products.
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto xl:grid-cols-3">
          {visibleGroups.map((group) => {
            const groupProducts = products.filter(
              (product) => (product.category || "Uncategorized") === group
            );

            return (
              <section
                key={group}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverGroup(group);
                }}
                onDragLeave={() => setDragOverGroup(null)}
                onDrop={() => dropProduct(group)}
                className={`min-h-48 min-w-[260px] rounded-xl p-3 transition-colors ${
                  dragOverGroup === group
                    ? "bg-primary-50 ring-2 ring-primary-300 dark:bg-primary-950/30"
                    : "bg-surface-muted/60"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text">{group}</h3>
                    <p className="text-[11px] text-text-muted">Drop products here to move category</p>
                  </div>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
                    {groupProducts.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {groupProducts.map((product) => (
                    <div
                      key={product.id}
                      draggable
                      onDragStart={() => setDraggingProductId(product.id)}
                      onDragEnd={() => {
                        setDraggingProductId(null);
                        setDragOverGroup(null);
                      }}
                      className={`group relative w-full cursor-grab rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md active:cursor-grabbing ${
                        draggingProductId === product.id ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="block w-full text-left"
                      >
                        <div
                          role="img"
                          aria-label={`${product.name} product image`}
                          className="mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-lg bg-primary-50 bg-cover bg-center text-primary-600 dark:bg-primary-950/40"
                          style={
                            product.image_url
                              ? { backgroundImage: `url(${product.image_url})` }
                              : undefined
                          }
                        >
                          {product.image_url ? null : (
                            <span className="text-2xl font-bold">
                              {productInitials(product.name)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-text">{product.name}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{productTypeLabel(product.product_type)}</Badge>
                              {!product.is_active && <Badge variant="outline">Inactive</Badge>}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-text-muted">
                              Sales price
                            </p>
                            <p className="mt-0.5 text-lg font-bold text-primary-600">
                              {formatINR(product.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-text-muted">
                              Cost
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-text">
                              {product.cost == null ? "—" : formatINR(product.cost)}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-surface/90 p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className="p-1 text-text-muted hover:text-text"
                          title="Edit product"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {product.is_active ? (
                          <button
                            type="button"
                            onClick={() => onDelete(product)}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Deactivate product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onReactivate(product)}
                            disabled={reactivating}
                            className="p-1 text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                            title="Reactivate product"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
