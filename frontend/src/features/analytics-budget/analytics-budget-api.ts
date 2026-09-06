import { apiFetch } from "@/lib/api";

export type AnalyticType = "income" | "expense";
export type BudgetStatus = "draft" | "confirmed" | "revised" | "cancelled";

export interface AnalyticAccount {
  id: number;
  code?: string | null;
  name: string;
  type: AnalyticType;
  description?: string | null;
  is_active: boolean;
}

export interface Budget {
  id: number;
  name: string;
  responsible_contact_id?: number | null;
  responsible_contact_name?: string | null;
  analytic_account_id: number;
  analytic_account_name?: string | null;
  type: AnalyticType;
  start_date: string;
  end_date: string;
  committed_amount: number;
  achieved_amount: number;
  achieved_percent: number;
  amount_to_achieve: number;
  status: BudgetStatus;
  revised_from_id?: number | null;
  revised_to_id?: number | null;
}

export interface BudgetReportRow extends Budget {
  balance: number;
}

export interface BudgetInput {
  name: string;
  responsible_contact_id?: number | null;
  analytic_account_id: number;
  start_date: string;
  end_date: string;
  committed_amount: number;
}

interface ListEnvelope<T> {
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

interface BudgetReportResponse {
  budgets?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
}

function asList<T>(response: ListEnvelope<T> | T[]): T[] {
  return Array.isArray(response) ? response : response.data ?? [];
}

function asDateTime(val: string): string {
  if (!val) return "";
  return val.includes("T") ? val : `${val}T00:00:00`;
}

function normalizeBudget(raw: Record<string, unknown>): Budget {
  const committed = Number(raw.committed_amount ?? 0);
  const achieved = Number(raw.achieved_amount ?? 0);
  const percent = Number(raw.achieved_pct ?? (committed > 0 ? (achieved / committed) * 100 : 0));
  const startDate = raw.start_date ?? raw.period_start;
  const endDate = raw.end_date ?? raw.period_end;

  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? "Budget"),
    responsible_contact_id: raw.responsible_person_id == null ? null : Number(raw.responsible_person_id),
    responsible_contact_name: raw.responsible_person_name == null ? null : String(raw.responsible_person_name),
    analytic_account_id: Number(raw.analytic_account_id ?? 0),
    analytic_account_name: raw.analytic_account_name == null ? null : String(raw.analytic_account_name),
    type: raw.type === "income" || raw.analytic_account_type === "income" ? "income" : "expense",
    start_date: startDate == null ? "" : String(startDate).split("T")[0],
    end_date: endDate == null ? "" : String(endDate).split("T")[0],
    committed_amount: committed,
    achieved_amount: achieved,
    achieved_percent: percent,
    amount_to_achieve: Number(raw.amount_to_achieve ?? Math.max(0, committed - achieved)),
    status: raw.status === "confirmed" || raw.status === "revised" || raw.status === "cancelled" ? raw.status : "draft",
    revised_from_id: raw.revised_from_id == null ? null : Number(raw.revised_from_id),
    revised_to_id: raw.revised_to_id == null ? null : Number(raw.revised_to_id),
  };
}

export async function fetchAnalyticAccounts(params: { type?: AnalyticType; is_active?: boolean; limit?: number } = {}): Promise<AnalyticAccount[]> {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
  query.set("limit", String(params.limit ?? 100));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<ListEnvelope<AnalyticAccount> | AnalyticAccount[]>(`/api/v1/analytic-accounts${suffix}`, { auth: true });
  return asList(response);
}

export async function fetchBudgets(): Promise<Budget[]> {
  const response = await apiFetch<ListEnvelope<Record<string, unknown>> | Record<string, unknown>[]>("/api/v1/budgets", { auth: true });
  return asList(response).map((item) => normalizeBudget(item));
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  const response = await apiFetch<Record<string, unknown>>("/api/v1/budgets", {
    method: "POST",
    auth: true,
    body: {
      name: input.name,
      analytic_account_id: input.analytic_account_id,
      period_start: asDateTime(input.start_date),
      period_end: asDateTime(input.end_date),
      committed_amount: input.committed_amount,
      responsible_person_id: input.responsible_contact_id ?? null,
    },
  });
  return normalizeBudget(response);
}

export async function confirmBudget(id: number): Promise<Budget> {
  const response = await apiFetch<Record<string, unknown>>(`/api/v1/budgets/${id}/confirm`, { method: "PATCH", auth: true });
  return normalizeBudget(response);
}

export async function reviseBudget(id: number, input: BudgetInput): Promise<Budget> {
  const response = await apiFetch<Record<string, unknown>>(`/api/v1/budgets/${id}/revise`, {
    method: "POST",
    auth: true,
    body: {
      name: input.name,
      committed_amount: input.committed_amount,
      responsible_person_id: input.responsible_contact_id ?? null,
    },
  });
  return normalizeBudget(response);
}

export async function cancelBudget(id: number): Promise<void> {
  await apiFetch(`/api/v1/budgets/${id}/cancel`, { method: "PATCH", auth: true });
}

export async function fetchBudgetReport(): Promise<BudgetReportRow[]> {
  const response = await apiFetch<BudgetReportResponse | Record<string, unknown>[]>("/api/v1/reports/budget", { auth: true });
  const items = Array.isArray(response) ? response : response.budgets ?? response.data ?? [];
  return items.map((item) => ({
    ...normalizeBudget(item),
    balance: Number(item.balance ?? item.amount_to_achieve ?? 0),
  }));
}
