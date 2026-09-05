"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileDown, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReportExportMenuProps {
  onPrint: () => void;
  onExportPdf: () => void;
  disabled?: boolean;
  exporting?: boolean;
}

/**
 * Export control for report pages — opens Print or Export PDF actions from one menu.
 */
export function ReportExportMenu({
  onPrint,
  onExportPdf,
  disabled = false,
  exporting = false,
}: ReportExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={disabled || exporting}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <FileDown className="h-4 w-4" />
        {exporting ? "Exporting…" : "Export"}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
            onClick={() => {
              setOpen(false);
              onPrint();
            }}
          >
            <Printer className="h-4 w-4 text-text-muted" />
            Print
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-surface-muted disabled:opacity-50"
            disabled={exporting}
            onClick={() => {
              setOpen(false);
              onExportPdf();
            }}
          >
            <FileDown className="h-4 w-4 text-text-muted" />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
