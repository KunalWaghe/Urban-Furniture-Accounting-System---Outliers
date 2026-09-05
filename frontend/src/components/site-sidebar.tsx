"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Armchair,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Moon,
  Receipt,
  ShoppingCart,
  Sun,
  type LucideIcon,
} from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Purchase Orders", href: "#", icon: ShoppingCart },
  { label: "Bills", href: "#", icon: Receipt },
  { label: "Payments", href: "#", icon: CreditCard },
  { label: "Reports", href: "#", icon: BarChart3 },
]

export function SiteSidebar() {
  const pathname = usePathname()
  const { darkMode, toggleTheme } = useTheme()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-600 p-2 text-white">
            <Armchair className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text">Urban Furniture</h1>
            <p className="text-xs text-text-muted">Accounting System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) && item.href !== "#"
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-text-muted hover:bg-surface-muted hover:text-text"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text hover:bg-surface-muted"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>
    </aside>
  )
}
