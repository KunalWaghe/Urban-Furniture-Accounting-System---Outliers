/**
 * Next.js App Router — Sales Order Detail Page
 *
 * Route: `/sales-orders/[id]`
 */
import { notFound } from "next/navigation";
import { SalesOrderDetailPage } from "@/features/sales-orders/sales-order-detail-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SalesOrderDetailRoute({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    notFound();
  }

  return <SalesOrderDetailPage soId={numericId} />;
}
