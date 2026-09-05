/**
 * Next.js App Router — Products Page
 *
 * Route: `/products`
 *
 * Thin route file: maps the URL to the feature component that owns the UI and logic.
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 */
import { ProductsPage } from "@/features/master-data/products-page";

/**
 * Renders the products master-data screen (catalog CRUD, search, pagination).
 *
 * Feature component: `@/features/master-data/products-page`
 * No extra role guard — any authenticated user can access this route.
 */
export default function ProductsRoute() {
  return <ProductsPage />;
}
