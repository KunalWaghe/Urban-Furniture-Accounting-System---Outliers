"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReportExportMenuProps {
  onPrint: () => void;
  onExportPdf?: () => void;
  disabled?: boolean;
  exporting?: boolean;
}

/**
 * Print control for report pages — triggers browser print dialog.
 */
export function ReportExportMenu({
  onPrint,
  disabled = false,
}: ReportExportMenuProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={disabled}
      onClick={onPrint}
    >
      <Printer className="h-4 w-4 mr-1.5" />
      Print
    </Button>
  );
}
