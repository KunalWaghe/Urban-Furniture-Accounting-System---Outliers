/**
 * Dashboard React Query Hooks
 *
 * Thin wrappers that connect the dashboard UI to `dashboard-api.ts`.
 * Each hook returns a standard React Query result (`data`, `isLoading`, `error`, etc.).
 *
 * Data flow: Component → useContacts/useProducts → dashboard-api → backend
 */

import { useQuery } from "@tanstack/react-query";

import { fetchDashboardContacts, fetchDashboardProducts } from "./dashboard-api";

/**
 * Load active contacts for the dashboard.
 *
 * Query key `["contacts"]` is shared with the contacts master-data page so
 * both stay in sync when contacts are created or updated elsewhere.
 */
export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: fetchDashboardContacts,
  });
}

/**
 * Load active products for the dashboard.
 *
 * Query key `["products"]` is shared with the products master-data page.
 */
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchDashboardProducts,
  });
}
