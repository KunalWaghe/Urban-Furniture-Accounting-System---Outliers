import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Receipt,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react"

interface Section {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

const sections: Section[] = [
  {
    title: "Purchase Orders",
    description:
      "Create and track purchase orders for furniture procurements across vendors.",
    href: "#",
    icon: ShoppingCart,
  },
  {
    title: "Bills",
    description:
      "Record vendor bills, match them to orders, and monitor approval status.",
    href: "#",
    icon: Receipt,
  },
  {
    title: "Payments",
    description:
      "Schedule and log outgoing payments with a clear audit trail.",
    href: "#",
    icon: CreditCard,
  },
  {
    title: "Reports",
    description:
      "View spend summaries, outstanding balances, and vendor-wise reports.",
    href: "#",
    icon: BarChart3,
  },
]

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-10">
        <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          Accounting &amp; ERP
        </span>
        <h1 className="mt-4 text-2xl font-bold text-text sm:text-3xl">
          Urban Furniture Accounting System
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
          A simple, reliable way to manage purchase orders, bills, and payments
          for urban furniture operations — with reports that keep every rupee
          accounted for.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
          >
            View reports
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300 w-fit">
              <section.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-text">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{section.description}</p>
            <Link
              href={section.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Open module
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
