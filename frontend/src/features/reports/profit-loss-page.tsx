"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { ReportExportMenu } from "@/components/report-export-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { exportHtmlAsPdf } from "@/lib/export-pdf";
import { formatINR } from "@/lib/format";
import { showInfoToast } from "@/lib/toast-utils";
import { buildProfitLossExportHtml } from "./report-export-html";
import { fetchProfitLoss, type ReportSection } from "./reports-api";

const currentYear = new Date().getFullYear();

function ProfitLossSection({ title, description, section }: { title: string; description: string; section: ReportSection }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-semibold text-text">{title}</h2>
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        </div>
        {section.lines.length === 0 ? (
          <p className="p-5 text-sm text-text-muted">No posted balances in this section.</p>
        ) : (
          <div className="divide-y divide-border">
            {section.lines.map((line) => (
              <div key={line.account_code} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-text">{line.account_name}</p>
                  <p className="text-xs text-text-muted">{line.account_code}</p>
                </div>
                <p className="text-sm font-semibold text-text">{formatINR(line.balance)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border bg-surface-muted/50 px-5 py-3">
          <span className="text-sm font-semibold text-text">Total {title}</span>
          <span className="text-sm font-bold text-text">{formatINR(section.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfitLossPage() {
  const [year, setYear] = useState(currentYear);
  const [exporting, setExporting] = useState(false);
  const reportQuery = useQuery({ queryKey: ["profit-loss", year], queryFn: () => fetchProfitLoss(year) });
  const report = reportQuery.data;
  const isProfit = (report?.net_income ?? 0) >= 0;

  const handleExportPdf = useCallback(() => {
    if (!report) return;
    setExporting(true);
    try {
      const opened = exportHtmlAsPdf("Profit & Loss", buildProfitLossExportHtml(report, year));
      if (!opened) showInfoToast("Allow pop-ups to export the report as PDF.");
    } finally {
      setExporting(false);
    }
  }, [report, year]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Reports / Financial statements</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">Profit &amp; Loss</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">Income, expenses, and net result from posted journal entries.</p>
        </div>
        <div className="flex items-end gap-2">
          <label className="text-xs font-medium text-text-muted">
            Financial year
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="mt-1 block w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </label>
          <ReportExportMenu
            onPrint={() => window.print()}
            onExportPdf={handleExportPdf}
            disabled={reportQuery.isLoading || reportQuery.isError || !report}
            exporting={exporting}
          />
        </div>
      </div>

      {reportQuery.isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : reportQuery.isError || !report ? (
        <Card><CardContent className="p-10 text-center"><p className="text-sm text-red-600">Unable to load the Profit &amp; Loss report.</p><p className="mt-1 text-xs text-text-muted">Check that the accounting report API is available and try again.</p></CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card size="sm"><CardContent className="flex items-center gap-3"><div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40"><TrendingUp className="h-5 w-5" /></div><div><p className="text-xs text-text-muted">Total income</p><p className="text-xl font-bold text-text">{formatINR(report.income.total)}</p></div></CardContent></Card>
            <Card size="sm"><CardContent><p className="text-xs text-text-muted">Total expenses</p><p className="mt-1 text-xl font-bold text-text">{formatINR(report.expenses.total)}</p></CardContent></Card>
            <Card size="sm"><CardContent><p className="text-xs text-text-muted">Net result</p><p className={`mt-1 text-xl font-bold ${isProfit ? "text-emerald-600" : "text-red-600"}`}>{formatINR(report.net_income)}</p></CardContent></Card>
          </div>
          <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${isProfit ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"}`}>
            <div className="flex items-center gap-2">
              {isProfit ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
              <div>
                <p className={`text-sm font-semibold ${isProfit ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{isProfit ? "Net profit" : "Net loss"}</p>
                <p className="text-xs text-text-muted">Income minus expenses for {report.year ?? year}</p>
              </div>
            </div>
            <Badge variant={isProfit ? "secondary" : "destructive"}>{isProfit ? "Profitable" : "Loss"}</Badge>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <ProfitLossSection title="Income" description="Revenue and operating income" section={report.income} />
            <ProfitLossSection title="Expenses" description="Purchases and operating costs" section={report.expenses} />
          </div>
          <Card><CardContent className="flex items-center justify-between p-5"><span className="font-semibold text-text">Net income</span><span className={`text-lg font-bold ${isProfit ? "text-emerald-600" : "text-red-600"}`}>{formatINR(report.net_income)}</span></CardContent></Card>
        </>
      )}
    </div>
  );
}
