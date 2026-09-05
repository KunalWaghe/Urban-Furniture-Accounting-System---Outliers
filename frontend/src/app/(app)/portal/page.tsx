import { RequireRole } from "@/components/require-role";
import { PortalPage } from "@/features/portal/portal-page";

export const metadata = { title: "My Invoices | Urban Furniture Accounting" };

export default function Page() {
  return <RequireRole allowedRoles={["contact"]}><PortalPage /></RequireRole>;
}
