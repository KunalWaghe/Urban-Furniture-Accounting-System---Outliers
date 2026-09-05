import type { BudgetReportRow } from "@/features/analytics-budget/analytics-budget-api";
import { formatDate, formatINR } from "@/lib/format";
import type { BalanceSheetResponse, ProfitLossResponse, ReportSection } from "./reports-api";

function sectionTable(title: string, section: ReportSection): string {
  if (section.lines.length === 0) {
    return `<h2>${title}</h2><p class="meta">No posted balances in this section.</p>`;
  }

  const rows = section.lines
    .map(
      (line) => `<tr>
        <td>${line.account_code}</td>
        <td>${line.account_name}</td>
        <td class="amount">${formatINR(line.balance)}</td>
      </tr>`
    )
    .join("");

  return `<h2>${title}</h2>
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Account</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2"><strong>Total ${title}</strong></td>
          <td class="amount"><strong>${formatINR(section.total)}</strong></td>
        </tr>
      </tfoot>
    </table>`;
}

export function buildBalanceSheetExportHtml(report: BalanceSheetResponse, year: number): string {
  return `<h1>Balance Sheet</h1>
    <p class="meta">Financial year ${report.year ?? year} · Generated on ${formatDate(new Date().toISOString())}</p>
    <div class="summary">
      <div class="summary-item">Total assets<strong>${formatINR(report.assets.total)}</strong></div>
      <div class="summary-item">Liabilities + capital<strong>${formatINR(report.total_liabilities_and_capital)}</strong></div>
      <div class="summary-item">Status<strong>${report.is_balanced ? "Balanced" : "Not balanced"}</strong></div>
    </div>
    ${sectionTable("Assets", report.assets)}
    ${sectionTable("Liabilities", report.liabilities)}
    ${sectionTable("Capital", report.capital)}`;
}

export function buildProfitLossExportHtml(report: ProfitLossResponse, year: number): string {
  const isProfit = report.net_income >= 0;
  return `<h1>Profit &amp; Loss</h1>
    <p class="meta">Financial year ${report.year ?? year} · Generated on ${formatDate(new Date().toISOString())}</p>
    <div class="summary">
      <div class="summary-item">Total income<strong>${formatINR(report.income.total)}</strong></div>
      <div class="summary-item">Total expenses<strong>${formatINR(report.expenses.total)}</strong></div>
      <div class="summary-item">Net result<strong>${formatINR(report.net_income)}</strong></div>
    </div>
    ${sectionTable("Income", report.income)}
    ${sectionTable("Expenses", report.expenses)}
    <p class="meta"><strong>${isProfit ? "Net profit" : "Net loss"}:</strong> ${formatINR(report.net_income)}</p>`;
}

export function buildBudgetReportExportHtml(rows: BudgetReportRow[]): string {
  const committed = rows.reduce((sum, row) => sum + row.committed_amount, 0);
  const achieved = rows.reduce((sum, row) => sum + row.achieved_amount, 0);
  const remaining = Math.max(0, committed - achieved);

  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${row.name}</td>
        <td>${row.analytic_account_name ?? `Account #${row.analytic_account_id}`}</td>
        <td>${row.start_date} → ${row.end_date}</td>
        <td>${row.status}</td>
        <td class="amount">${formatINR(row.committed_amount)}</td>
        <td class="amount">${formatINR(row.achieved_amount)}</td>
        <td class="amount">${formatINR(row.balance)}</td>
      </tr>`
    )
    .join("");

  return `<h1>Budget Report</h1>
    <p class="meta">Generated on ${formatDate(new Date().toISOString())}</p>
    <div class="summary">
      <div class="summary-item">Committed<strong>${formatINR(committed)}</strong></div>
      <div class="summary-item">Achieved<strong>${formatINR(achieved)}</strong></div>
      <div class="summary-item">Balance to achieve<strong>${formatINR(remaining)}</strong></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Budget</th>
          <th>Analytic account</th>
          <th>Period</th>
          <th>Status</th>
          <th>Committed</th>
          <th>Achieved</th>
          <th>Remaining</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>`;
}
