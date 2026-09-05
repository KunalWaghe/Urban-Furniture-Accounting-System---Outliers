import { PurchaseOrderEditPage } from "@/features/purchase-orders/purchase-order-edit-page";

export default async function PurchaseOrderEditRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PurchaseOrderEditPage poId={Number(id)} />;
}
