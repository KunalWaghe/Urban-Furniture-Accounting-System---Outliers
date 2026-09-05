/**
 * Opens a printable HTML document and triggers the browser print dialog
 * so the user can save the report as a PDF.
 */
export function exportHtmlAsPdf(title: string, bodyHtml: string): boolean {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return false;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111827; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
    .summary { display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 20px; }
    .summary-item { font-size: 12px; }
    .summary-item strong { display: block; font-size: 16px; color: #111827; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f9fafb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; }
    tfoot td { background: #f9fafb; font-weight: 600; }
    td.amount { font-family: ui-monospace, monospace; font-weight: 600; white-space: nowrap; }
    @media print {
      body { padding: 0; }
      @page { margin: 16mm; }
    }
  </style>
</head>
<body>
  ${bodyHtml}
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  printWindow.document.close();
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
