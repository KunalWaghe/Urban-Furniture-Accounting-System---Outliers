"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { LoadingSpinner } from "@/components/loading-spinner";
import { PurchaseOrderFormPage } from "@/features/purchase-orders/purchase-order-form-page";
import { fetchPurchaseOrderApi } from "@/features/purchase-orders/purchase-orders-api";

export function PurchaseOrderEditPage({ poId }: { poId: number }) {
  const query = useQuery({ queryKey: ["purchase-order", poId], queryFn: () => fetchPurchaseOrderApi(poId) });

  if (query.isLoading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>;
  if (query.isError || !query.data) {
    return <div className="space-y-4 py-12 text-center"><p className="text-sm text-text-muted">Could not load this purchase order.</p><Link href={`/purchase-orders/${poId}`} className="text-sm font-semibold text-primary-600 hover:underline">Back to Purchase Order</Link></div>;
  }
  if (query.data.status !== "draft") {
    return <div className="space-y-4 py-12 text-center"><p className="text-sm text-text-muted">Only draft purchase orders can be edited.</p><Link href={`/purchase-orders/${poId}`} className="text-sm font-semibold text-primary-600 hover:underline">Back to Purchase Order</Link></div>;
  }
  return <PurchaseOrderFormPage initialOrder={query.data} />;
}
