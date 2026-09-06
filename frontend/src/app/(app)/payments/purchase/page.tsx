import { Suspense } from "react";
import { PaymentsPage } from "@/features/payments/payments-page";

export const metadata = { title: "Vendor Payments (Purchase) | Urban Furniture Accounting" };

export default function PurchasePaymentsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <PaymentsPage forcedType="outbound" />
    </Suspense>
  );
}
