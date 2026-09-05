/**
 * Next.js App Router — Contacts Page
 *
 * Route: `/contacts`
 *
 * Thin route file: maps the URL to the feature component that owns the UI and logic.
 * Auth: protected by `(app)/layout.tsx` via `RequireAuth` (must be logged in).
 */
import { ContactsPage } from "@/features/master-data/contacts-page";

/**
 * Renders the contacts master-data screen (customers, vendors, and related CRUD).
 *
 * Feature component: `@/features/master-data/contacts-page`
 * No extra role guard — any authenticated user can access this route.
 */
export default function ContactsRoute() {
  return <ContactsPage />;
}
