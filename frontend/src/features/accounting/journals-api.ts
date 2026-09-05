import { apiFetch } from "@/lib/api";
import type { Journal, JournalListResponse } from "@/lib/types";

export interface JournalListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  is_active?: boolean;
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
