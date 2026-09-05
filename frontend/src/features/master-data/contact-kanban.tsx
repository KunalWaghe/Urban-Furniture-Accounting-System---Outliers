"use client";

import { useState } from "react";
import { Edit3, Mail, MapPin, Phone, Trash2, Users } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { ActionTooltip } from "@/components/ui/tooltip";
import type { Contact } from "@/lib/types";

export interface ContactKanbanProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onMove: (contact: Contact, type: Contact["type"]) => void;
  search: string;
  onSearch: (value: string) => void;
  loading: boolean;
}

const COLUMNS: { id: Contact["type"]; label: string; badgeStyle: string }[] = [
  {
    id: "customer",
    label: "Customers",
    badgeStyle: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
  },
  {
    id: "vendor",
    label: "Vendors",
    badgeStyle: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
  },
  {
    id: "both",
    label: "Customer & Vendor",
    badgeStyle: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
];

function contactInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Kanban-style contact view grouped by contact type (Customer / Vendor / Both).
 *
 * Supports drag-and-drop or column moves, search, and direct edit/delete triggers.
 */
export function ContactKanban({
  contacts,
  onEdit,
  onDelete,
  onMove,
  search,
  onSearch,
  loading,
}: ContactKanbanProps) {
  const [hiddenGroups, setHiddenGroups] = useState<Contact["type"][]>([]);
  const [draggingContactId, setDraggingContactId] = useState<number | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<Contact["type"] | null>(null);

  const visibleColumns = COLUMNS.filter((col) => !hiddenGroups.includes(col.id));

  function toggleGroup(group: Contact["type"]) {
    setHiddenGroups((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group]
    );
  }

  function dropContact(type: Contact["type"]) {
    const contact = contacts.find((item) => item.id === draggingContactId);
    if (!contact) return;
    if (contact.type !== type) {
      onMove(contact, type);
    }
    setDraggingContactId(null);
    setDragOverGroup(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search contacts..."
          className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text">
            Columns ({visibleColumns.length}/{COLUMNS.length})
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Show columns
              </span>
              <button
                type="button"
                onClick={() => setHiddenGroups([])}
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="space-y-2">
              {COLUMNS.map((col) => (
                <label key={col.id} className="flex items-center gap-2 text-xs text-text">
                  <input
                    type="checkbox"
                    checked={!hiddenGroups.includes(col.id)}
                    onChange={() => toggleGroup(col.id)}
                    className="rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </details>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {visibleColumns.map((col) => {
          const columnContacts = contacts.filter((c) => c.type === col.id);
          const isDragOver = dragOverGroup === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverGroup(col.id);
              }}
              onDragLeave={() => {
                if (dragOverGroup === col.id) setDragOverGroup(null);
              }}
              onDrop={() => dropContact(col.id)}
              className={`flex w-80 shrink-0 flex-col rounded-2xl border bg-surface-muted/50 p-4 transition-colors ${
                isDragOver
                  ? "border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/20"
                  : "border-border"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">{col.label}</span>
                  <Badge variant="outline" className={col.badgeStyle}>
                    {columnContacts.length}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 min-h-[120px]">
                {columnContacts.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border py-8 text-center text-xs text-text-muted">
                    No contacts in this column
                  </div>
                ) : (
                  columnContacts.map((contact) => (
                    <div
                      key={contact.id}
                      draggable
                      onDragStart={() => setDraggingContactId(contact.id)}
                      onDragEnd={() => {
                        setDraggingContactId(null);
                        setDragOverGroup(null);
                      }}
                      className={`group relative cursor-grab rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary-500/40 hover:shadow-md active:cursor-grabbing ${
                        draggingContactId === contact.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 font-bold text-xs text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                            {contactInitials(contact.name)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-text leading-snug">
                              {contact.name}
                            </h3>
                            <p className="text-[11px] text-text-muted">
                              ID: #{contact.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <ActionTooltip label={`Edit ${contact.name}`}>
                            <button
                              type="button"
                              onClick={() => onEdit(contact)}
                              className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </ActionTooltip>
                          <ActionTooltip label={`Deactivate ${contact.name}`}>
                            <button
                              type="button"
                              onClick={() => onDelete(contact)}
                              className="rounded-lg p-1 text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </ActionTooltip>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 border-t border-border/50 pt-2 text-xs text-text-muted">
                        {contact.email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.mobile && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                            <span>{contact.mobile}</span>
                          </div>
                        )}
                        {(contact.city || contact.state) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                            <span>
                              {[contact.city, contact.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
