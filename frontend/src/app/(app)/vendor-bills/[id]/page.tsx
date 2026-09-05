import { use } from "react";
import { VendorBillDetailPage } from "@/features/vendor-bills/vendor-bill-detail-page";

export const metadata = {
  title: "Vendor Bill Details | Urban Furniture Accounting",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);
  return <VendorBillDetailPage billId={id} />;
}
