import { apiFetch } from "@/lib/api";

export interface ReportLine {
  account_id?: number | null;
  account_code: string;
  account_name: string;
  balance: number;
}

export interface ReportSection {
  lines: ReportLine[];
  total: number;
}

export interface BalanceSheetResponse {
  year?: number | null;
  assets: ReportSection;
  liabilities: ReportSection;
  capital: ReportSection;
  is_balanced: boolean;
  total_liabilities_and_capital: number;
}

export interface ProfitLossResponse {
  year?: number | null;
  income: ReportSection;
  expenses: ReportSection;
  net_income: number;
}

export async function fetchBalanceSheet(year?: number): Promise<BalanceSheetResponse> {
  const query = year ? `?year=${year}` : "";
  return apiFetch<BalanceSheetResponse>(`/api/v1/reports/balance-sheet${query}`, { auth: true });
}

export async function fetchProfitLoss(year?: number): Promise<ProfitLossResponse> {
  const query = year ? `?year=${year}` : "";
  return apiFetch<ProfitLossResponse>(`/api/v1/reports/profit-loss${query}`, { auth: true });
}
