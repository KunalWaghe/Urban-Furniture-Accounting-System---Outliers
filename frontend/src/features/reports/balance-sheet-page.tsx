"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Scale, XCircle } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import {
  FinancialYearField,
  PageToolbar,
  PageToolbarActions,
} from "@/components/page-toolbar";
import { ReportExportMenu } from "@/components/report-export-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-media-query";
import { exportHtmlAsPdf } from "@/lib/export-pdf";
import { formatINR } from "@/lib/format";
import { showInfoToast } from "@/lib/toast-utils";
import { buildBalanceSheetExportHtml } from "./report-export-html";
import { fetchBalanceSheet, type ReportSection } from "./reports-api";

const currentYear = new Date().getFullYear();

function ReportSectionCard({ title, description, section }: { title: string; description: string; section: ReportSection }) {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-border p-4 sm:p-5">
          <h2 className="font-semibold text-text">{title}</h2>
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        </div>
        {section.lines.length === 0 ? (
          <p className="p-4 sm:p-5 text-sm text-text-muted">No posted balances in this section.</p>
        ) : (
          <div className="divide-y divide-border">
            {section.lines.map((line) => (
              <div key={line.account_code} className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center justify-between gap-4'} px-4 py-3 sm:px-5`}>
                <div className={isMobile ? 'w-full' : ''}>
                  <p className="text-sm font-medium text-text">{line.account_name}</p>
                  <p className="text-xs text-text-muted">{line.account_code}</p>
                </div>
                <p className={`text-sm font-semibold text-text ${isMobile ? 'text-left' : 'text-right shrink-0'}`}>{formatINR(line.balance)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border bg-surface-muted/50 px-4 py-3 sm:px-5">
          <span className="text-sm font-semibold text-text">Total {title}</span>
          <span className="text-sm font-bold text-text">{formatINR(section.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function BalanceSheetPage() {
  const [year, setYear] = useState(currentYear);
  const [exporting, setExporting] = useState(false);
  const reportQuery = useQuery({ queryKey: ["balance-sheet", year], queryFn: () => fetchBalanceSheet(year) });
  const report = reportQuery.data;

  const handleExportPdf = useCallback(() => {
    if (!report) return;
    setExporting(true);
    try {
      const opened = exportHtmlAsPdf("Balance Sheet", buildBalanceSheetExportHtml(report, year));
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
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">Balance Sheet</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">Assets, liabilities, and capital based on posted journal entries.</p>
        </div>
        <PageToolbar>
          <FinancialYearField value={year} onChange={setYear} id="balance-sheet-year" />
          <PageToolbarActions>
            <ReportExportMenu
              onPrint={() => window.print()}
              onExportPdf={handleExportPdf}
              disabled={reportQuery.isLoading || reportQuery.isError || !report}
              exporting={exporting}
            />
          </PageToolbarActions>
        </PageToolbar>
      </div>

      {reportQuery.isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : reportQuery.isError || !report ? (
        <Card><CardContent className="p-10 text-center"><p className="text-sm text-red-600">Unable to load the Balance Sheet.</p><p className="mt-1 text-xs text-text-muted">Check that the accounting report API is available and try again.</p></CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card size="sm"><CardContent className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40"><Scale className="h-5 w-5" /></div><div><p className="text-xs text-text-muted">Total assets</p><p className="text-xl font-bold text-text">{formatINR(report.assets.total)}</p></div></CardContent></Card>
            <Card size="sm"><CardContent><p className="text-xs text-text-muted">Liabilities + capital</p><p className="mt-1 text-xl font-bold text-text">{formatINR(report.total_liabilities_and_capital)}</p></CardContent></Card>
            <Card size="sm"><CardContent><p className="text-xs text-text-muted">Financial year</p><p className="mt-1 text-sm font-semibold text-text">{report.year ?? year}</p></CardContent></Card>
          </div>
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border px-4 py-3 ${report.is_balanced ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"}`}>
            <div className="flex items-center gap-2">
              {report.is_balanced ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <XCircle className="h-5 w-5 text-red-600 shrink-0" />}
              <div>
                <p className={`text-sm font-semibold ${report.is_balanced ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{report.is_balanced ? "Balance Sheet is balanced" : "Balance Sheet is not balanced"}</p>
                <p className="text-xs text-text-muted">Assets = Liabilities + Capital</p>
              </div>
            </div>
            <Badge variant={report.is_balanced ? "secondary" : "destructive"}>{report.is_balanced ? "Balanced" : "Check entries"}</Badge>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <ReportSectionCard title="Assets" description="Resources owned by the business" section={report.assets} />
            <div className="space-y-5">
              <ReportSectionCard title="Liabilities" description="Amounts owed by the business" section={report.liabilities} />
              <ReportSectionCard title="Capital" description="Owner equity and retained earnings" section={report.capital} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
