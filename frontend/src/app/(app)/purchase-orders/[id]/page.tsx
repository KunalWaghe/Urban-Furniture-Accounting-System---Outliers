import { PurchaseOrderDetailPage } from "@/features/purchase-orders/purchase-order-detail-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return <PurchaseOrderDetailPage poId={Number(id)} />;
}
