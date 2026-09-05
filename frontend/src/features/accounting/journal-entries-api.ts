import { apiFetch } from "@/lib/api";
import type { JournalEntry, JournalEntryListResponse } from "@/lib/types";

export interface JournalEntryListParams {
  page?: number;
  limit?: number;
  journal_code?: string;
  is_posted?: boolean;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface JournalEntryItemInput {
  account_id: number;
  partner_id?: number | null;
  debit?: number;
  credit?: number;
  description?: string;
  analytic_account_id?: number | null;
}

export interface JournalEntryInput {
  journal_code: string;
  reference?: string;
  date?: string;
  items: JournalEntryItemInput[];
}

export async function fetchJournalEntriesPage(
  params: JournalEntryListParams = {}
): Promise<JournalEntryListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.journal_code && params.journal_code !== "all") query.set("journal_code", params.journal_code);
  if (params.is_posted !== undefined) query.set("is_posted", String(params.is_posted));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.start_date) query.set("start_date", `${params.start_date}T00:00:00`);
  if (params.end_date) query.set("end_date", `${params.end_date}T23:59:59`);

  const qs = query.toString();
  return apiFetch<JournalEntryListResponse>(`/api/v1/journal-entries${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
}

export async function createJournalEntry(input: JournalEntryInput): Promise<JournalEntry> {
  return apiFetch<JournalEntry>("/api/v1/journal-entries", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function fetchJournalEntry(id: number): Promise<JournalEntry> {
  return apiFetch<JournalEntry>(`/api/v1/journal-entries/${id}`, { auth: true });
}
