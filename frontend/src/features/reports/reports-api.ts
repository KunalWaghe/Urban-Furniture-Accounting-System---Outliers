import { apiFetch } from "@/lib/api";

export interface BalanceSheetLine {
  account_id: number;
  code: string;
  name: string;
  balance: number;
}

export interface BalanceSheetResponse {
  as_of_date: string;
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  capital: BalanceSheetLine[];
  net_income: number;
  total_assets: number;
  total_liabilities: number;
  total_capital: number;
  total_liabilities_and_capital: number;
  balanced: boolean;
}

export async function fetchBalanceSheet(asOfDate?: string): Promise<BalanceSheetResponse> {
  const query = asOfDate ? `?as_of_date=${encodeURIComponent(asOfDate)}` : "";
  return apiFetch<BalanceSheetResponse>(`/api/v1/reports/balance-sheet${query}`, { auth: true });
}
