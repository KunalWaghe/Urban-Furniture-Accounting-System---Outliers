import { Suspense } from "react";
import { PaymentsPage } from "@/features/payments/payments-page";

export const metadata = { title: "Customer Receipts (Sales) | Urban Furniture Accounting" };

export default function SalesPaymentsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-muted" />}>
      <PaymentsPage forcedType="inbound" />
    </Suspense>
  );
}
