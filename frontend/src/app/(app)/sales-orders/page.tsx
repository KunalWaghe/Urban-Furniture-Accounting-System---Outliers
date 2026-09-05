/**
 * Next.js App Router — Sales Orders Page
 *
 * Route: `/sales-orders`
 * Directory list page displaying customer sales orders with filtering, search, and pagination.
 */
import { SalesOrdersListPage } from "@/features/sales-orders/sales-orders-list-page";

export default function SalesOrdersPage() {
  return <SalesOrdersListPage />;
}
