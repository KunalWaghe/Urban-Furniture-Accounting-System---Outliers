import { apiFetch } from "@/lib/api";
import type { Journal, JournalListResponse } from "@/lib/types";

export interface JournalListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  is_active?: boolean;
}

export interface JournalInput {
  code: string;
  name: string;
  type: Journal["type"];
  default_account_id?: number | null;
}

export async function fetchJournalsPage(
  params: JournalListParams = {}
): Promise<JournalListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.type && params.type !== "all") query.set("type", params.type);
  if (params.is_active !== undefined) query.set("is_active", String(params.is_active));

  const qs = query.toString();
  return apiFetch<JournalListResponse>(`/api/v1/journals${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
}

export async function fetchJournals(): Promise<Journal[]> {
  const response = await fetchJournalsPage({ limit: 100, is_active: true });
  return response.data ?? [];
}

export async function createJournal(input: JournalInput): Promise<Journal> {
  return apiFetch<Journal>("/api/v1/journals", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function updateJournal(id: number, input: Partial<JournalInput & { is_active?: boolean }>): Promise<Journal> {
  return apiFetch<Journal>(`/api/v1/journals/${id}`, {
    method: "PUT",
    auth: true,
    body: input,
  });
}

export async function deleteJournal(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/journals/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function reactivateJournal(id: number): Promise<Journal> {
  return updateJournal(id, { is_active: true });
}
