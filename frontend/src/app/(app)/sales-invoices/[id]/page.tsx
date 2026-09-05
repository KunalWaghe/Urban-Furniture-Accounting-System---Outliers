/**
 * Next.js App Router — Customer Invoice Detail Page
 *
 * Route: `/sales-invoices/[id]`
 */
import { CustomerInvoiceDetailPage } from "@/features/customer-invoices/customer-invoice-detail-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerInvoiceDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return <CustomerInvoiceDetailPage invoiceId={id} />;
}
