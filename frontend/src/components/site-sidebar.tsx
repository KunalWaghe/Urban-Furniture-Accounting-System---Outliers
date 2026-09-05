"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Armchair,
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  Receipt,
  ShoppingCart,
  Sun,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/features/auth/auth-context"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles?: string[]
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Purchase Orders", href: "#", icon: ShoppingCart, roles: ["admin", "invoicing_user"] },
  { label: "Bills", href: "#", icon: Receipt, roles: ["admin", "invoicing_user"] },
  { label: "Payments", href: "#", icon: CreditCard, roles: ["admin", "invoicing_user"] },
  { label: "Reports", href: "#", icon: BarChart3, roles: ["admin", "invoicing_user"] },
  { label: "User Management", href: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Portal Invoices", href: "#", icon: FileText, roles: ["contact"] },
]

export function SiteSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  const userRole = user?.role || "invoicing_user"
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      {/* Logo */}
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

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href) && item.href !== "#"
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

      {/* Bottom: user + theme + logout */}
      <div className="space-y-2 border-t border-border p-4">
        {/* User info with role badge */}
        {user && (
          <div className="rounded-lg border border-border/60 bg-surface-muted/50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-xs font-semibold text-text">{user.name}</p>
                  {user.role === "admin" && (
                    <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      Admin
                    </span>
                  )}
                  {user.role === "invoicing_user" && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Accountant
                    </span>
                  )}
                  {user.role === "contact" && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      Portal
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-text-muted">
                  {user.login_id ? `@${user.login_id}` : user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text hover:bg-surface-muted"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {darkMode ? "Light mode" : "Dark mode"}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
