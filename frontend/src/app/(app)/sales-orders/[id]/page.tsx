/**
 * Next.js App Router — Sales Order Detail Page
 *
 * Route: `/sales-orders/[id]`
 */
import { SalesOrderDetailPage } from "@/features/sales-orders/sales-order-detail-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SalesOrderDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return <SalesOrderDetailPage soId={Number(id)} />;
}
