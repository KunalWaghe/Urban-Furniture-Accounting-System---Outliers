import { SalesOrderEditPage } from "@/features/sales-orders/sales-order-edit-page";

export default async function SalesOrderEditRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalesOrderEditPage soId={Number(id)} />;
}
