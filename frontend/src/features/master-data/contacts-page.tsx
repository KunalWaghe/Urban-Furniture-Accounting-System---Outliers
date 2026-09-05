"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Mail, MapPin, Phone, Plus, Trash2, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Contact } from "@/lib/types";
import {
  createContact,
  deleteContact,
  fetchContactsPage,
  updateContact,
  type ContactInput,
} from "./master-data-api";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

function typeLabel(type: Contact["type"]): string {
  return type === "both" ? "Customer & Vendor" : type[0].toUpperCase() + type.slice(1);
}

function typeBadge(type: Contact["type"]) {
  const styles: Record<Contact["type"], string> = {
    customer: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
    vendor: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
    both: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  };
  return <Badge variant="outline" className={styles[type]}>{typeLabel(type)}</Badge>;
}

const emptyForm: ContactInput = { name: "", type: "customer", email: "", mobile: "", city: "", state: "", pincode: "" };

export function ContactsPage() {
  const queryClient = useQueryClient();

  // Server-side query parameters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | Contact["type"]>("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts-paged", { page, search, typeFilter, sortBy, sortOrder }],
    queryFn: () =>
      fetchContactsPage({
        page,
        limit: 10,
        search: search.trim() || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
    placeholderData: (prev) => prev,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const normalized = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          typeof value === "string" && !value.trim() ? undefined : value,
        ])
      ) as ContactInput;
      return editing ? updateContact(editing.id, normalized) : createContact(normalized);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["contacts-paged"] });
      setEditing(null);
      setIsModalOpen(false);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save contact."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["contacts-paged"] });
      setDeletingContact(null);
    },
  });

  const contacts = contactsQuery.data?.data ?? [];
  const totalCount = contactsQuery.data?.total ?? 0;
  const totalPages = contactsQuery.data?.pages ?? 1;

  function handleSort(columnKey: string) {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditing(contact);
    setForm({
      name: contact.name,
      type: contact.type,
      email: contact.email ?? "",
      mobile: contact.mobile ?? "",
      city: contact.city ?? "",
      state: contact.state ?? "",
      pincode: contact.pincode ?? "",
    });
    setError(null);
    setIsModalOpen(true);
  }

  function updateField(field: keyof ContactInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const columns: DataTableColumn<Contact>[] = [
    {
      key: "name",
      label: "Contact",
      sortable: true,
      render: (contact) => (
        <div>
          <p className="font-semibold text-text">{contact.name}</p>
          <p className="mt-0.5 text-xs text-text-muted">#{contact.id}</p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (contact) => typeBadge(contact.type),
    },
    {
      key: "email",
      label: "Contact details",
      render: (contact) => (
        <div className="space-y-1 text-xs text-text-muted">
          {contact.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {contact.email}
            </div>
          )}
          {contact.mobile && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {contact.mobile}
            </div>
          )}
          {!contact.email && !contact.mobile && "No details added"}
        </div>
      ),
    },
    {
      key: "city",
      label: "Location",
      sortable: true,
      render: (contact) => (
        <span className="flex items-center gap-1.5 text-sm text-text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {[contact.city, contact.state].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (contact) => (
        <Badge variant={contact.is_active ? "default" : "secondary"}>
          {contact.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (contact) => (
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(contact)}>
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Button>
          {contact.is_active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeletingContact(contact)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Account / Master data
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">Contacts</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Keep customers and vendors ready to use across every order, bill, and invoice.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New contact
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Total records</p>
              <p className="text-xl font-bold text-text">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-text-muted">Current view</p>
            <p className="mt-1 text-xl font-bold text-text">
              {typeFilter === "all"
                ? "All Contacts"
                : typeFilter === "customer"
                ? "Customers"
                : typeFilter === "vendor"
                ? "Vendors"
                : "Both"}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-text-muted">Sort order</p>
            <p className="mt-1 text-sm font-semibold capitalize text-text">
              {sortBy} ({sortOrder.toUpperCase()})
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <DataTable
            columns={columns}
            data={contacts}
            loading={contactsQuery.isLoading}
            searchPlaceholder="Search contacts by name, email, or city..."
            searchValue={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            toolbarExtra={
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value as typeof typeFilter);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text outline-none focus:border-primary-500"
                aria-label="Filter contacts by type"
              >
                <option value="all">All contact types</option>
                <option value="customer">Customers</option>
                <option value="vendor">Vendors</option>
                <option value="both">Customer &amp; Vendor</option>
              </select>
            }
            emptyTitle="No contacts found"
            emptyDescription="Add a contact or adjust your search and type filter."
          />
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 id="contact-dialog-title" className="text-lg font-semibold text-text">{editing ? "Edit contact" : "New contact"}</h2><p className="mt-1 text-sm text-text-muted">Use this contact in sales and purchase workflows.</p></div><button type="button" onClick={() => setIsModalOpen(false)} className="text-sm text-text-muted hover:text-text" aria-label="Close dialog">✕</button></div>
            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); if (!form.name.trim()) { setError("Name is required."); return; } saveMutation.mutate(); }}>
              <label className="sm:col-span-2 text-sm font-medium text-text">Name *<input required value={form.name} onChange={(event) => updateField("name", event.target.value)} className={inputClass} placeholder="e.g. Acme Interiors" /></label>
              <label className="text-sm font-medium text-text">Type *<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as Contact["type"] }))} className={inputClass}><option value="customer">Customer</option><option value="vendor">Vendor</option><option value="both">Both</option></select></label>
              <label className="text-sm font-medium text-text">Email<input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className={inputClass} placeholder="accounts@example.com" /></label>
              <label className="text-sm font-medium text-text">Mobile<input value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} className={inputClass} placeholder="+91 98765 43210" /></label>
              <label className="text-sm font-medium text-text">City<input value={form.city} onChange={(event) => updateField("city", event.target.value)} className={inputClass} placeholder="Mumbai" /></label>
              <label className="text-sm font-medium text-text">State<input value={form.state} onChange={(event) => updateField("state", event.target.value)} className={inputClass} placeholder="Maharashtra" /></label>
              <label className="text-sm font-medium text-text">Pincode<input value={form.pincode} onChange={(event) => updateField("pincode", event.target.value)} className={inputClass} placeholder="400001" /></label>
              <div className="mt-2 flex justify-end gap-3 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? <LoadingSpinner /> : editing ? "Save changes" : "Create contact"}</Button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingContact)}
        title="Deactivate Contact"
        message={`Are you sure you want to deactivate ${deletingContact?.name}? Deactivated contacts will no longer appear in active order dropdowns.`}
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => {
          if (deletingContact) {
            deleteMutation.mutate(deletingContact.id);
          }
        }}
        onCancel={() => setDeletingContact(null)}
      />
    </div>
  );
}

