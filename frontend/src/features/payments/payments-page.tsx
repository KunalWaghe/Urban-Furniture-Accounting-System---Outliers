"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Printer,
  Search,
  WalletCards,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Building2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { SkeletonCard } from "@/components/skeleton-card";
import { SkeletonTable } from "@/components/skeleton-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate, formatINR } from "@/lib/format";
import { showInfoToast } from "@/lib/toast-utils";
import { fetchPayments, type PaymentRecord } from "./payments-api";

function paymentLabel(payment: PaymentRecord) {
  return payment.payment_type === "inbound" ? "Customer Receipt" : "Vendor Payment";
}

function documentLabel(payment: PaymentRecord) {
  if (payment.bill_id) {
    return payment.bill_number ?? `Bill #${payment.bill_id}`;
  }
  if (payment.invoice_id) {
    return payment.invoice_number ?? `Invoice #${payment.invoice_id}`;
  }
  return "—";
}

function parseTypeParam(param: string | null | undefined): "all" | "inbound" | "outbound" {
  if (!param) return "all";
  const lower = param.toLowerCase().trim();
  if (lower === "customer" || lower === "inbound" || lower === "sales" || lower === "receipt") {
    return "inbound";
  }
  if (
    lower === "vendor" ||
    lower === "outbound" ||
    lower === "purchase" ||
    lower === "purchases" ||
    lower === "disbursement"
  ) {
    return "outbound";
  }
  return "all";
}

interface PaymentsPageProps {
  forcedType?: "inbound" | "outbound";
}

export function PaymentsPage({ forcedType }: PaymentsPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlType = parseTypeParam(searchParams?.get("type"));

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "inbound" | "outbound">(() => forcedType ?? urlType);
  const debouncedSearch = useDebouncedValue(search);

  // Synchronize state if URL query param or forced prop changes
  useEffect(() => {
    if (forcedType) {
      setType(forcedType);
    } else {
      setType(urlType);
    }
  }, [urlType, forcedType]);

  const handleTabChange = useCallback(
    (nextType: "all" | "inbound" | "outbound") => {
      setType(nextType);
      if (!forcedType) {
        const queryVal = nextType === "inbound" ? "customer" : nextType === "outbound" ? "vendor" : "all";
        router.push(`/payments?type=${queryVal}`);
      }
    },
    [forcedType, router]
  );

  const query = useQuery({
    queryKey: ["payments", type, debouncedSearch],
    queryFn: () =>
      fetchPayments({
        payment_type: type === "all" ? undefined : type,
        search: debouncedSearch.trim() || undefined,
      }),
  });

  const payments = query.data?.data ?? [];
  const inbound = payments
    .filter((payment) => payment.payment_type === "inbound")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outbound = payments
    .filter((payment) => payment.payment_type === "outbound")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const viewMeta = useMemo(() => {
    if (type === "inbound") {
      return {
        category: "Sales / Customer Receipts",
        title: "Customer Receipts (Sales Payments)",
        description: "Incoming payments, cash receipts, and customer settlements against sales invoices.",
        partnerCol: "Customer",
        docCol: "Sales Invoice",
        filterLabel: "Customer Receipts (Sales)",
        emptyMsg: "No customer receipts found. When customer invoices are settled, receipts will appear here.",
      };
    }
    if (type === "outbound") {
      return {
        category: "Purchase / Vendor Disbursements",
        title: "Vendor Payments (Purchase Payments)",
        description: "Outgoing disbursements and supplier payments issued against purchase bills.",
        partnerCol: "Vendor / Supplier",
        docCol: "Purchase Bill",
        filterLabel: "Vendor Payments (Purchase)",
        emptyMsg: "No vendor payments found. When vendor bills are paid, disbursements will appear here.",
      };
    }
    return {
      category: "Accounting / Cash Flow",
      title: "All Payments & Receipts",
      description: "Comprehensive financial ledger of incoming customer receipts and outgoing vendor disbursements.",
      partnerCol: "Partner",
      docCol: "Document",
      filterLabel: "All Transactions",
      emptyMsg: "No payment records match your filters.",
    };
  }, [type]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Breadcrumb & Segmented Mode Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            {viewMeta.category}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {viewMeta.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            {viewMeta.description}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        {!forcedType && (
          <div className="no-print flex items-center gap-1 self-start rounded-xl border border-border bg-surface p-1 shadow-xs text-xs font-medium">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                type === "all"
                  ? "bg-primary-600 text-white font-semibold shadow-xs"
                  : "text-text-muted hover:text-text hover:bg-surface-muted"
              }`}
            >
              All Payments
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("inbound")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                type === "inbound"
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "text-text-muted hover:text-text hover:bg-surface-muted"
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Sales Receipts
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("outbound")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                type === "outbound"
                  ? "bg-amber-600 text-white font-semibold shadow-xs"
                  : "text-text-muted hover:text-text hover:bg-surface-muted"
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Purchase Payments
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Summary Cards */}
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} showHeader={false} lines={2} />
          ))}
        </div>
      ) : type === "inbound" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card size="sm" className="border-emerald-200/60 dark:border-emerald-900/40">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Receipts Collected</p>
                <p className="text-xl font-bold text-text">{formatINR(inbound)}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Receipts Count</p>
                <p className="text-xl font-bold text-text">{payments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Average Collection</p>
                <p className="text-xl font-bold text-text">
                  {payments.length ? formatINR(inbound / payments.length) : "₹0.00"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : type === "outbound" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card size="sm" className="border-amber-200/60 dark:border-amber-900/40">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Disbursed to Vendors</p>
                <p className="text-xl font-bold text-text">{formatINR(outbound)}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950/40">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Disbursements Count</p>
                <p className="text-xl font-bold text-text">{payments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Average Disbursement</p>
                <p className="text-xl font-bold text-text">
                  {payments.length ? formatINR(outbound / payments.length) : "₹0.00"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Customer Receipts</p>
                <p className="text-xl font-bold text-text">{formatINR(inbound)}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Vendor Payments</p>
                <p className="text-xl font-bold text-text">{formatINR(outbound)}</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Net Cash Flow</p>
                <p
                  className={`text-xl font-bold ${
                    inbound - outbound >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatINR(inbound - outbound)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-950/40">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Transactions</p>
                <p className="text-xl font-bold text-text">{query.data?.total ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="no-print flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${type === "inbound" ? "receipts, customers, invoices" : type === "outbound" ? "payments, vendors, bills" : "transactions"}...`}
                className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={type}
                onChange={(event) => handleTabChange(event.target.value as "all" | "inbound" | "outbound")}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                <option value="all">All transactions</option>
                <option value="inbound">Sales Receipts</option>
                <option value="outbound">Purchase Payments</option>
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                disabled={query.isLoading}
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
            </div>
          </div>

          {query.isLoading ? (
            <div className="p-8">
              <SkeletonTable columns={8} rows={7} showSearch={false} showPagination={false} />
            </div>
          ) : query.isError ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-red-600">Unable to load payments.</p>
              <p className="mt-1 text-xs text-text-muted">Check the payments API and try again.</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-sm text-text-muted">
              <WalletCards className="mx-auto h-8 w-8 text-text-muted/60 mb-2" />
              {viewMeta.emptyMsg}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-5 py-3">Number</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">{viewMeta.partnerCol}</th>
                    <th className="px-5 py-3">{viewMeta.docCol}</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Journal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => {
                    const isInbound = payment.payment_type === "inbound";
                    return (
                      <tr key={payment.id} className="hover:bg-surface-muted/40 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-primary-600">
                          {payment.payment_number}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isInbound
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {isInbound ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            {paymentLabel(payment)}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-text">
                          {payment.contact_name ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          {payment.bill_id ? (
                            <Link
                              href={`/vendor-bills/${payment.bill_id}`}
                              className="font-mono text-xs font-semibold text-primary-600 hover:underline"
                            >
                              {payment.bill_number ?? `Bill #${payment.bill_id}`}
                            </Link>
                          ) : payment.invoice_id ? (
                            <Link
                              href={`/sales-invoices/${payment.invoice_id}`}
                              className="font-mono text-xs font-semibold text-emerald-600 hover:underline"
                            >
                              {payment.invoice_number ?? `Invoice #${payment.invoice_id}`}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3 text-text-muted">
                          {payment.date?.split("T")[0]}
                        </td>
                        <td className="px-5 py-3 capitalize text-text-muted">
                          <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-0.5 font-mono text-xs text-text">
                            {payment.payment_method}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3 font-mono font-semibold ${
                            isInbound ? "text-emerald-600" : "text-text"
                          }`}
                        >
                          {isInbound ? "+" : "-"}
                          {formatINR(payment.amount)}
                        </td>
                        <td className="px-5 py-3 text-text-muted">
                          {payment.journal_name ?? payment.journal_code ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
