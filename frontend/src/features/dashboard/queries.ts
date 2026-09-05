import { useQuery } from "@tanstack/react-query";

import { fetchDashboardContacts, fetchDashboardProducts } from "./dashboard-api";

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: fetchDashboardContacts,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchDashboardProducts,
  });
}
