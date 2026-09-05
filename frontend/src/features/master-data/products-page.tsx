"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Edit3, Grid2X2, List, Package, Plus, Tag, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import {
  createProduct,
  deleteProduct,
  fetchProductsPage,
  updateProduct,
  type ProductInput,
} from "./master-data-api";
import { formatINR } from "@/lib/format";

const inputClass = "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";
const emptyForm: ProductInput = { name: "", product_type: "goods", category: "", price: 0, cost: null, tax_percent: 0, description: "" };

function productTypeLabel(value: string) { return value === "goods" ? "Goods" : value === "service" ? "Service" : value[0].toUpperCase() + value.slice(1); }

export function ProductsPage() {
  const queryClient = useQueryClient();

  // View state
  const [view, setView] = useState<"table" | "kanban">("table");

  // Server-side query parameters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  // Paginated server query
  const productsQuery = useQuery({
    queryKey: [
      "products-paged",
      { page, search, categoryFilter, productTypeFilter, sortBy, sortOrder },
    ],
    queryFn: () =>
      fetchProductsPage({
        page,
        limit: 10,
        search: search.trim() || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        product_type: productTypeFilter !== "all" ? productTypeFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
    placeholderData: (prev) => prev,
  });

  // Query to populate category filter dropdown
  const allProductsQuery = useQuery({
    queryKey: ["products-all-categories"],
    queryFn: () => fetchProductsPage({ limit: 100 }),
    staleTime: 60000,
  });

  const categories = useMemo(() => {
    const list = allProductsQuery.data?.data ?? productsQuery.data?.data ?? [];
    return Array.from(
      new Set(list.map((p) => p.category).filter(Boolean) as string[])
    ).sort();
  }, [allProductsQuery.data, productsQuery.data]);

  const products = productsQuery.data?.data ?? [];
  const totalCount = productsQuery.data?.total ?? 0;
  const totalPages = productsQuery.data?.pages ?? 1;

  const saveMutation = useMutation({
    mutationFn: () => (editing ? updateProduct(editing.id, form) : createProduct(form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["products-paged"] });
      await queryClient.invalidateQueries({ queryKey: ["products-all-categories"] });
      setEditing(null);
      setForm(emptyForm);
      setIsModalOpen(false);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save product."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["products-paged"] });
      await queryClient.invalidateQueries({ queryKey: ["products-all-categories"] });
      setDeletingProduct(null);
    },
  });

  function handleSort(columnKey: string) {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      product_type: product.product_type,
      category: product.category ?? "",
      price: product.price,
      cost: product.cost,
      tax_percent: product.tax_percent,
      description: product.description ?? "",
    });
    setError(null);
    setIsModalOpen(true);
  }

  function updateField(field: keyof ProductInput, value: string | number | null) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (form.price < 0 || !Number.isFinite(form.price)) {
      setError("Sales price must be zero or more.");
      return;
    }
    saveMutation.mutate();
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      label: "Product",
      sortable: true,
      render: (product) => (
        <div>
          <p className="font-semibold text-text">{product.name}</p>
          <p className="mt-0.5 text-xs text-text-muted">{product.description || "No description"}</p>
        </div>
      ),
    },
    {
      key: "product_type",
      label: "Type",
      render: (product) => <Badge variant="secondary">{productTypeLabel(product.product_type)}</Badge>,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (product) => <span className="text-text-muted">{product.category || "Uncategorized"}</span>,
    },
    {
      key: "price",
      label: "Sales price",
      sortable: true,
      render: (product) => <span className="font-semibold text-text">{formatINR(product.price)}</span>,
    },
    {
      key: "cost",
      label: "Cost price",
      sortable: true,
      render: (product) => (
        <span className="text-text-muted">{product.cost == null ? "—" : formatINR(product.cost)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (product) => (
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(product)}>
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Button>
          {product.is_active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeletingProduct(product)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Account / Master data
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">Products</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Manage your furniture catalogue, pricing, tax, and product categories.
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New product
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Total catalogue items</p>
              <p className="text-xl font-bold text-text">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-text-muted">Categories detected</p>
            <p className="mt-1 text-xl font-bold text-text">{categories.length}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-text-muted">Current sort</p>
            <p className="mt-1 text-sm font-semibold capitalize text-text">
              {sortBy} ({sortOrder.toUpperCase()})
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-text">Product catalogue</h2>
              <p className="mt-1 text-xs text-text-muted">
                Switch views to scan prices quickly or browse products by category.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted pointer-events-none" />
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-8 text-xs text-text outline-none focus:border-primary-500 sm:w-auto"
                  aria-label="Filter products by category"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={productTypeFilter}
                onChange={(event) => {
                  setProductTypeFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-surface py-2 px-3 text-xs text-text outline-none focus:border-primary-500"
                aria-label="Filter products by type"
              >
                <option value="all">All types</option>
                <option value="goods">Goods</option>
                <option value="service">Service</option>
                <option value="combo">Combo</option>
              </select>
              <div className="flex rounded-lg border border-border bg-surface-muted p-1">
                <button
                  type="button"
                  onClick={() => setView("table")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                    view === "table"
                      ? "bg-surface text-primary-600 shadow-sm"
                      : "text-text-muted"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setView("kanban")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                    view === "kanban"
                      ? "bg-surface text-primary-600 shadow-sm"
                      : "text-text-muted"
                  }`}
                >
                  <Grid2X2 className="h-3.5 w-3.5" />
                  Kanban
                </button>
              </div>
            </div>
          </div>

          {view === "table" ? (
            <DataTable
              columns={columns}
              data={products}
              loading={productsQuery.isLoading}
              searchPlaceholder="Search products by name or description..."
              searchValue={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              emptyTitle="No products found"
              emptyDescription="Add a product or adjust your filters."
            />
          ) : (
            <ProductKanban
              products={products}
              onEdit={openEdit}
              onDelete={(p) => setDeletingProduct(p)}
              search={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              loading={productsQuery.isLoading}
            />
          )}
        </CardContent>
      </Card>
    {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="product-dialog-title" className="text-base font-semibold text-text sm:text-lg">{editing ? "Edit product" : "New product"}</h2><p className="mt-1 text-xs text-text-muted sm:text-sm">Pricing here flows into sales orders and purchase orders.</p></div><button type="button" onClick={() => setIsModalOpen(false)} className="text-sm text-text-muted hover:text-text" aria-label="Close dialog">✕</button></div>{error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}<form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submitForm}><label className="sm:col-span-2 text-sm font-medium text-text">Name *<input required value={form.name} onChange={(event) => updateField("name", event.target.value)} className={inputClass} placeholder="Executive Ergonomic Chair" /></label><label className="text-sm font-medium text-text">Product type<select value={form.product_type} onChange={(event) => updateField("product_type", event.target.value)} className={inputClass}><option value="goods">Goods</option><option value="service">Service</option><option value="combo">Combo</option></select></label><label className="text-sm font-medium text-text">Category<input value={form.category} onChange={(event) => updateField("category", event.target.value)} className={inputClass} placeholder="Office Seating" /></label><label className="text-sm font-medium text-text">Sales price *<input type="number" min="0" step="0.01" required value={form.price} onChange={(event) => updateField("price", Number(event.target.value))} className={inputClass} /></label><label className="text-sm font-medium text-text">Cost price<input type="number" min="0" step="0.01" value={form.cost ?? ""} onChange={(event) => updateField("cost", event.target.value === "" ? null : Number(event.target.value))} className={inputClass} /></label><label className="text-sm font-medium text-text">Tax rate (%)<input type="number" min="0" max="100" step="0.01" value={form.tax_percent} onChange={(event) => updateField("tax_percent", Number(event.target.value))} className={inputClass} /></label><label className="sm:col-span-2 text-sm font-medium text-text">Description<textarea rows={3} value={form.description} onChange={(event) => updateField("description", event.target.value)} className={inputClass} placeholder="Short description for users and invoices" /></label><div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Cancel</Button><Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto">{saveMutation.isPending ? <LoadingSpinner /> : editing ? "Save changes" : "Create product"}</Button></div></form></div></div>}
    <ConfirmDialog
      open={Boolean(deletingProduct)}
      title="Deactivate Product"
      message={`Are you sure you want to deactivate ${deletingProduct?.name}? Deactivated products will no longer appear in order item selection.`}
      confirmLabel="Deactivate"
      destructive
      onConfirm={() => {
        if (deletingProduct) {
          deleteMutation.mutate(deletingProduct.id);
        }
      }}
      onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
}

function ProductKanban({ products, onEdit, onDelete, search, onSearch, loading }: { products: Product[]; onEdit: (product: Product) => void; onDelete: (product: Product) => void; search: string; onSearch: (value: string) => void; loading: boolean }) {
  const groups = Array.from(new Set(products.map((product) => product.category || "Uncategorized")));
  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  return <div className="space-y-4"><input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search products..." className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />{groups.length === 0 ? <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">No products found.</div> : <div className="grid gap-4 xl:grid-cols-3">{groups.map((group) => { const groupProducts = products.filter((product) => (product.category || "Uncategorized") === group); return <section key={group} className="min-h-48 rounded-xl bg-surface-muted/60 p-3"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-text">{group}</h3><span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">{groupProducts.length}</span></div><div className="space-y-3">{groupProducts.map((product) => <div key={product.id} className="group relative w-full rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => onEdit(product)} className="flex items-center gap-2 text-left"><div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-950/40"><Boxes className="h-4 w-4" /></div><p className="font-semibold text-text">{product.name}</p></button><div className="flex items-center gap-1"><button type="button" onClick={() => onEdit(product)} className="p-1 text-text-muted hover:text-text" title="Edit product"><Edit3 className="h-3.5 w-3.5" /></button>{product.is_active && <button type="button" onClick={() => onDelete(product)} className="p-1 text-red-600 hover:text-red-700" title="Deactivate product"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div><div className="mt-4 flex items-end justify-between"><div><p className="text-[11px] uppercase tracking-wide text-text-muted">Sales price</p><p className="mt-0.5 text-lg font-bold text-primary-600">{formatINR(product.price)}</p></div><div className="text-right"><Badge variant="secondary">{productTypeLabel(product.product_type)}</Badge>{product.cost != null && <p className="mt-1 text-[11px] text-text-muted">Cost {formatINR(product.cost)}</p>}</div></div></div>)}</div></section>; })}</div>}</div>;
}

