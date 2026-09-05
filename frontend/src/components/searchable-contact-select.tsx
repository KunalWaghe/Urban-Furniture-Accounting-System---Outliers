"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, ChevronDown, Search } from "lucide-react";

import type { Contact } from "@/lib/types";

interface SearchableContactSelectProps {
  contacts: Contact[];
  value: number | null | undefined;
  onChange: (contactId: number | null) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Searchable contact picker used anywhere a customer or vendor is selected.
 * Searches name, city, and email while keeping the submitted value as the
 * contact id rather than relying on a typed display name.
 */
export function SearchableContactSelect({
  contacts,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  placeholder = "Search by name, city, or email...",
  emptyMessage = "No contacts found.",
  className = "",
}: SearchableContactSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = contacts.find((contact) => contact.id === value);
  const optionsId = `${inputId}-options`;

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;

    return contacts.filter((contact) =>
      [contact.name, contact.city, contact.state, contact.email]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    );
  }, [contacts, search]);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  function selectContact(contactId: number) {
    onChange(contactId);
    setSearch("");
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setSearch("");
    setOpen(true);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label htmlFor={inputId} className="text-xs font-semibold text-text">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>

      <div className="relative mt-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={optionsId}
          required={required && !selected}
          disabled={disabled}
          value={selected ? selected.name : search}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            if (selected) onChange(null);
            setSearch(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-9 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? `Close ${label} options` : `Open ${label} options`}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text disabled:opacity-50"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {selected ? (
        <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
          <Building2 className="h-3.5 w-3.5" />
          <span>{selected.city || selected.email || "Contact selected"}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={clearSelection}
            className="font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            Change
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          id={optionsId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          {filteredContacts.length === 0 ? (
            <div className="p-3 text-center text-xs text-text-muted">
              {search ? `No matches for “${search}”.` : emptyMessage}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                role="option"
                aria-selected={contact.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectContact(contact.id)}
                className="flex w-full items-center justify-between border-b border-border/40 px-3 py-2.5 text-left text-sm text-text transition-colors hover:bg-surface-muted last:border-0"
              >
                <span>
                  <span className="block font-medium">{contact.name}</span>
                  <span className="block text-xs text-text-muted">
                    {[contact.city, contact.state, contact.email].filter(Boolean).join(" · ") || "No details listed"}
                  </span>
                </span>
                {contact.id === value ? <span className="text-xs font-semibold text-primary-600">Selected</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
