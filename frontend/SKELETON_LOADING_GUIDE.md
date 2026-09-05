# Skeleton Loading System

## Overview

This guide documents the skeleton loading system implemented across the frontend to provide better user experience during data fetching. Skeleton screens show content placeholders with shimmer animations instead of spinners or blank pages.

## Components

### Base Skeleton Components (`/components/ui/skeleton.tsx`)

#### `Skeleton`
Base component with shimmer animation.

```tsx
<Skeleton className="h-4 w-full" />
<Skeleton width={200} height={50} />
<Skeleton noAnimation /> // disable shimmer
```

#### `SkeletonCircle`
For avatars and icons.

```tsx
<SkeletonCircle size={40} />
```

#### `SkeletonText`
Text line placeholder.

```tsx
<SkeletonText width="80%" />
<SkeletonText width={200} className="h-6" />
```

#### `SkeletonButton`
Button-shaped placeholder.

```tsx
<SkeletonButton width={120} />
```

### Composite Components

#### `SkeletonCard` (`/components/skeleton-card.tsx`)
Card with optional header and content lines.

```tsx
<SkeletonCard showHeader lines={5} />
<SkeletonCard showHeader={false} lines={3} />
```

#### `SkeletonKpiCard` (`/components/skeleton-kpi-card.tsx`)
Matches KpiCard structure for dashboard metrics.

```tsx
<SkeletonKpiCard />
```

#### `SkeletonTable` (`/components/skeleton-table.tsx`)
Table placeholder matching DataTable structure.

```tsx
<SkeletonTable 
  columns={5} 
  rows={10} 
  showSearch={true}
  showPagination={true}
/>
```

#### `SkeletonForm` (`/components/skeleton-form.tsx`)
Form placeholder for edit/create pages.

```tsx
<SkeletonForm 
  fields={8} 
  showHeader={true}
  showActions={true}
/>
```

### Page Layouts (`/components/skeleton-page.tsx`)

Full-page skeleton layouts:

- `SkeletonDashboard` - Dashboard with KPI cards
- `SkeletonListPage` - List page with table
- `SkeletonDetailPage` - Detail page with sections
- `SkeletonFormPage` - Form page
- `SkeletonReportPage` - Report with filters

```tsx
import { SkeletonListPage } from "@/components/skeleton-page"

if (isLoading) return <SkeletonListPage />;
```

## Usage Patterns

### 1. DataTable (Automatic)

The `DataTable` component automatically shows skeleton during loading:

```tsx
<DataTable
  columns={columns}
  data={data}
  loading={isLoading}  // triggers SkeletonTable
  pageSize={10}
/>
```

### 2. Page-Level Loading

```tsx
export function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  if (isLoading) {
    return <SkeletonListPage />;
  }

  return (
    <div className="space-y-6">
      {/* Page content */}
    </div>
  );
}
```

### 3. Section-Level Skeletons

```tsx
export function JournalsPage() {
  const query = useQuery({
    queryKey: ["journals"],
    queryFn: fetchJournals,
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1>Journals</h1>
      </div>

      {/* KPI cards with skeleton */}
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} showHeader={false} lines={2} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Actual cards */}
        </div>
      )}

      {/* Table with skeleton */}
      <Card>
        {query.isLoading ? (
          <SkeletonTable columns={5} rows={8} />
        ) : (
          {/* Actual table */}
        )}
      </Card>
    </div>
  );
}
```

### 4. Dashboard KPI Cards

```tsx
export function DashboardKpiCards() {
  const query = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: fetchKpis,
  });

  if (query.isLoading) {
    return (
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {/* Actual KPI cards */}
    </section>
  );
}
```

### 5. Custom Compositions

```tsx
function CustomSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonCircle size={48} />
        <div className="flex-1 space-y-2">
          <SkeletonText width="40%" />
          <SkeletonText width="60%" />
        </div>
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
```

## Implementation Status

### ✅ Updated Components
- `DataTable` - Uses `SkeletonTable`
- `DashboardKpiCards` - Uses `SkeletonKpiCard`
- `JournalsPage` - Uses `SkeletonCard` and `SkeletonTable`
- `PaymentsPage` - Uses `SkeletonCard` and `SkeletonTable`

### 📋 Recommended Updates

Pages that would benefit from skeleton screens:
- Dashboard page sections
- Sales orders, purchase orders list pages
- Vendor bills, customer invoices list pages
- Contacts, products master data pages  
- Report pages (balance sheet, P&L, budget)
- Detail pages (order details, bill details)
- Form pages (edit product, edit contact)

## Best Practices

1. **Match Structure**: Skeleton should mirror actual content layout
2. **Appropriate Granularity**: Use page/section/element skeletons as needed
3. **Performance**: Disable animation for large numbers of elements with `noAnimation`
4. **Responsive**: Skeletons follow same responsive patterns as content
5. **Consistent Spacing**: Match padding and margins between skeleton and content

## Migration from LoadingSpinner

**Before:**
```tsx
if (isLoading) {
  return (
    <div className="flex justify-center py-16">
      <LoadingSpinner label="Loading..." />
    </div>
  );
}
```

**After:**
```tsx
if (isLoading) {
  return <SkeletonListPage />;
}
// Or for specific sections:
{isLoading ? (
  <SkeletonTable columns={5} rows={10} />
) : (
  <DataTable data={data} />
)}
```

## Styling

Skeletons use theme-aware classes:
- `bg-surface-muted` - Adapts to light/dark mode
- `animate-pulse` - Shimmer animation
- Border and spacing match actual components

## Accessibility

Skeleton components are decorative. Consider adding:

```tsx
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? (
    <>
      <span className="sr-only">Loading data...</span>
      <SkeletonTable />
    </>
  ) : (
    <DataTable data={data} />
  )}
</div>
```

## Examples

See implementations in:
- `/components/data-table.tsx`
- `/features/accounting/journals-page.tsx`
- `/features/payments/payments-page.tsx`
- `/features/dashboard/dashboard-kpi-cards.tsx`
