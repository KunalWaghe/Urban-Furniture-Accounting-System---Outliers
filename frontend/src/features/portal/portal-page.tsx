"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, Receipt, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppModal, ModalError } from "@/components/app-modal";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR, todayDate } from "@/lib/format";
import { fetchPortalInvoices, payPortalInvoice, type PortalInvoice } from "./portal-api";

export function PortalPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PortalInvoice | null>(null);
  const [method, setMethod] = useState<"bank" | "cash">("bank");
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["portal-invoices"],
    queryFn: fetchPortalInvoices,
  });

  const payMutation = useMutation({
    mutationFn: (invoice: PortalInvoice) =>
      payPortalInvoice(invoice.id, {
        amount: invoice.amount_due,
        payment_method: method,
        date: todayDate(),
        note: "Portal payment",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal-invoices"] });
      setSelected(null);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Unable to register payment.");
    },
  });

  const invoices = query.data ?? [];

  function closeModal() {
    setSelected(null);
    setError(null);
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
          Self-service / Portal
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          My Invoices
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">
          View your invoice balances and pay outstanding dues through Cash or Bank.
        </p>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner label="Loading your invoices…" />
        </div>
      ) : query.isError ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm font-medium text-red-600">Unable to load your portal invoices.</p>
            <p className="mt-1 text-xs text-text-muted">
              Check that your account is linked to a contact, then try again.
            </p>
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-sm text-text-muted">You have no invoices to display.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {invoices.map((invoice) => {
            const paid = invoice.amount_due <= 0 || invoice.status.toLowerCase() === "paid";
            return (
              <Card key={invoice.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-text">{invoice.invoice_number}</p>
                        <p className="text-xs text-text-muted">
                          Issued {invoice.invoice_date?.split("T")[0] || "—"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={paid ? "secondary" : "outline"}>
                      {paid ? "Paid" : "Outstanding"}
                    </Badge>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-text-muted">Invoice total</p>
                      <p className="mt-1 font-semibold text-text">{formatINR(invoice.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Amount due</p>
                      <p className="mt-1 font-semibold text-text">{formatINR(invoice.amount_due)}</p>
                    </div>
                  </div>

                  {invoice.due_date && (
                    <p className="mt-4 text-xs text-text-muted">
                      Due {invoice.due_date.split("T")[0]}
                    </p>
                  )}

                  <Button
                    className="mt-5 w-full"
                    variant={paid ? "outline" : "default"}
                    disabled={paid}
                    onClick={() => {
                      setError(null);
                      setSelected(invoice);
                    }}
                  >
                    {paid ? (
                      "Payment complete"
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-1.5" /> Pay {formatINR(invoice.amount_due)}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <AppModal
          open
          onClose={closeModal}
          title={`Pay ${selected.invoice_number}`}
          subtitle={`Register the full outstanding amount of ${formatINR(selected.amount_due)}.`}
          titleId="portal-modal-title"
          maxWidth="sm"
          disableClose={payMutation.isPending}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={payMutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => payMutation.mutate(selected)}
                disabled={payMutation.isPending}
              >
                {payMutation.isPending ? "Processing…" : "Confirm payment"}
              </Button>
            </div>
          }
        >
          <label className="block text-xs font-semibold text-text">
            Payment via
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as "bank" | "cash")}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-normal text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
            </select>
          </label>
          {error && (
            <div className="mt-4 flex items-start justify-between gap-2">
              <ModalError>{error}</ModalError>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          )}
        </AppModal>
      )}
    </div>
  );
}
