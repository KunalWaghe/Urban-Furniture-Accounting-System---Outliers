"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Armchair,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
} from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface SubNavItem {
  label: string;
  href: string;
  description?: string;
  tab?: "po" | "bills";
  adminOnly?: boolean;
}

interface NavCategory {
  id: "sales" | "purchase" | "account" | "reports";
  label: string;
  color: string;
  items: SubNavItem[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "sales",
    label: "Sales",
    color: "bg-blue-500",
    items: [
      { label: "Sales Orders", href: "/sales-orders", description: "Customer orders & fulfillment status" },
      { label: "Sales Invoices", href: "/#sales-section", description: "Commercial invoicing & customer dues" },
      { label: "Payments / Receipts", href: "/#sales-section", description: "Customer receipts & accounts receivable" },
    ],
  },
  {
    id: "purchase",
    label: "Purchase",
    color: "bg-indigo-500",
    items: [
      { label: "Purchase Orders", href: "/purchase-orders", description: "Supplier purchase orders & goods receipt" },
      { label: "Purchase Bills", href: "/#purchase-bills", tab: "bills", description: "Vendor bills & accounts payable" },
      { label: "Payments", href: "/#purchase-section", description: "Bank & cash vendor disbursements" },
    ],
  },
  {
    id: "account",
    label: "Account",
    color: "bg-emerald-500",
    items: [
      { label: "Contacts", href: "/#contacts", description: "Customers & Vendors master directory" },
      { label: "Products Catalog", href: "/#products", description: "Furniture inventory & sales pricing" },
      { label: "Analytical Budget", href: "/#budget-section", description: "Production & operational cost centers" },
      { label: "Chart of Accounts", href: "/#budget-section", description: "8 canonical double-entry ledger accounts" },
      { label: "Journals & Entries", href: "/#budget-section", description: "Sales, Purchase, Bank & Cash journal entries" },
      { label: "User Management", href: "/admin/users", description: "RBAC & system user administration", adminOnly: true },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    color: "bg-purple-500",
    items: [
      { label: "Balance Sheet", href: "/#budget-section", description: "Assets = Liabilities + Capital check" },
      { label: "Profit and Loss", href: "/#budget-section", description: "Operating revenue, COGS & net income" },
      { label: "Budget Report", href: "/#budget-section", description: "Committed vs Achieved utilization metrics" },
    ],
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const userRole = user?.role || "invoicing_user";

  // Filter category items based on user role
  const categories = useMemo(() => {
    return NAV_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (item.adminOnly && userRole !== "admin") return false;
        return true;
      }),
    }));
  }, [userRole]);

  // Navigate with smooth scroll and tab trigger
  const handleNavClick = useCallback(
    (item: SubNavItem) => {
      setActiveDropdown(null);
      setIsMegaMenuOpen(false);
      setIsSearchFocused(false);
      setMobileMenuOpen(false);

      if (pathname === "/" && item.href.startsWith("/#")) {
        // Dispatch custom event for dashboard page to switch tabs and scroll
        window.dispatchEvent(
          new CustomEvent("erp-navigate", {
            detail: { href: item.href, tab: item.tab },
          })
        );
      } else {
        router.push(item.href);
      }
    },
    [pathname, router]
  );

  // Close dropdowns and mega menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
        setIsMegaMenuOpen(false);
        setIsSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: ⌘K or Ctrl+K to focus search, ESC to close all menus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setIsMegaMenuOpen(false);
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Quick search results
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: { category: string; item: SubNavItem }[] = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        if (
          item.label.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          cat.label.toLowerCase().includes(q)
        ) {
          results.push({ category: cat.label, item });
        }
      }
    }
    return results.slice(0, 6);
  }, [searchQuery, categories]);

  return (
    <header
      ref={navContainerRef}
      className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3 sm:gap-4">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="rounded-xl bg-primary-600 p-2 text-white shadow-sm shadow-primary-500/20">
            <Armchair className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="block text-sm font-bold tracking-tight text-text sm:text-base leading-tight">
              Urban<span className="text-primary-600">Furniture</span>
            </span>
            <span className="block text-[11px] text-text-muted leading-none">
              Accounting System
            </span>
          </div>
        </Link>

        {/* Center: Module Dropdown Pills + Global Search + ERP Directory Launcher */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 justify-center max-w-2xl">
          {/* Module Dropdown Navigation Pill */}
          <nav className="flex items-center space-x-0.5 sm:space-x-1 rounded-2xl bg-surface-muted/80 p-1 border border-border/60 shadow-xs">
            {categories.map((cat) => {
              const isOpen = activeDropdown === cat.id;

              return (
                <div key={cat.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMegaMenuOpen(false);
                      setActiveDropdown(isOpen ? null : cat.id);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                      isOpen
                        ? "bg-surface text-primary-600 shadow-xs font-semibold"
                        : "text-text-muted hover:bg-surface/70 hover:text-text"
                    )}
                  >
                    <span>{cat.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 text-text-muted transition-transform duration-200",
                        isOpen && "rotate-180 text-primary-600"
                      )}
                    />
                  </button>

                  {/* Category Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-border bg-surface p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="mb-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", cat.color)} />
                        {cat.label} Modules
                      </div>
                      <div className="space-y-1">
                        {cat.items.map((sub) => (
                          <button
                            key={sub.label}
                            type="button"
                            onClick={() => handleNavClick(sub)}
                            className="w-full rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface-muted text-xs group block"
                          >
                            <div className="font-semibold text-text group-hover:text-primary-600 transition-colors">
                              {sub.label}
                            </div>
                            {sub.description && (
                              <div className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                                {sub.description}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Global Search Bar with ⌘K */}
          <div className="relative w-44 lg:w-64">
            <input
              ref={searchInputRef}
              id="globalNavSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsSearchFocused(true);
                setActiveDropdown(null);
                setIsMegaMenuOpen(false);
              }}
              placeholder="Search orders, bills, accounts..."
              className="w-full rounded-2xl border border-border/80 bg-surface-muted/60 py-1.5 pl-8 pr-11 text-xs text-text placeholder:text-text-muted transition-all focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            <kbd className="absolute right-2 top-1.5 hidden sm:flex items-center gap-0.5 rounded border border-border/80 bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-muted shadow-xs pointer-events-none">
              <span>⌘</span>K
            </kbd>

            {/* Quick Search Autocomplete Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-border bg-surface p-2 shadow-2xl z-50">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border/60 pb-1.5 mb-1">
                  Matching Modules &amp; Records
                </div>
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map(({ category, item }) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          handleNavClick(item);
                          setSearchQuery("");
                        }}
                        className="w-full rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-surface-muted flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-text group-hover:text-primary-600">
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-[10px] text-text-muted">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-text-muted font-medium">
                          {category}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-center text-xs text-text-muted">
                    No matching navigation targets found for &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ERP Central Directory App Launcher Button */}
          <button
            type="button"
            id="globalMegaMenuBtn"
            onClick={() => {
              setActiveDropdown(null);
              setIsSearchFocused(false);
              setIsMegaMenuOpen((prev) => !prev)}
            }
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-surface transition-all shadow-xs",
              isMegaMenuOpen
                ? "border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950/40"
                : "text-text-muted hover:border-primary-300 hover:bg-surface-muted hover:text-primary-600"
            )}
            title="ERP Central Directory (Sketch Model)"
            aria-label="Toggle ERP Central Directory"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {/* Right: User Pill + Dark Mode + Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-border/70 bg-surface-muted/40 px-2.5 py-1.5 text-xs">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[120px] truncate font-medium text-text">
                {user.name}
              </div>
              {user.role === "admin" && (
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  Admin
                </span>
              )}
              {user.role === "invoicing_user" && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Accountant
                </span>
              )}
              {user.role === "contact" && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Portal
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text transition-colors hover:bg-surface-muted shadow-xs"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text shadow-xs"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>

          {/* Mobile menu hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text transition-colors hover:bg-surface-muted md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ERP Central Directory Mega Menu (4 Columns matching Sketch Model) */}
      {/* ========================================================================= */}
      {isMegaMenuOpen && (
        <div className="absolute right-4 sm:right-6 lg:right-8 top-16 z-50 w-[840px] max-w-[94vw] rounded-2xl border border-border bg-surface p-6 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                ERP Central Directory (Sketch Model)
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-text-muted">
                Press <kbd className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px]">ESC</kbd> to close
              </span>
              <button
                type="button"
                onClick={() => setIsMegaMenuOpen(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <div key={cat.id}>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text">
                  <span className={cn("h-1.5 w-1.5 rounded-full", cat.color)} />
                  {cat.label}
                </h3>
                <ul className="space-y-2 text-xs">
                  {cat.items.map((sub) => (
                    <li key={sub.label}>
                      <button
                        type="button"
                        onClick={() => handleNavClick(sub)}
                        className="flex items-center gap-1.5 text-text-muted transition-all hover:translate-x-1 hover:text-primary-600 text-left w-full"
                      >
                        <span>{sub.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-text-muted">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>Double-entry accounting, procurement &amp; customer dispatch connected</span>
            </div>
            <div className="font-medium text-primary-600">
              Urban Furniture ERP
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Mobile navigation drawer */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden max-h-[85vh] overflow-y-auto space-y-4">
          {/* User profile card */}
          {user && (
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-muted/40 p-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text">{user.name}</div>
                  <div className="text-[11px] text-text-muted">
                    {user.login_id ? `@${user.login_id}` : user.email}
                  </div>
                </div>
              </div>
              {user.role === "admin" && (
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  Admin
                </span>
              )}
              {user.role === "invoicing_user" && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Accountant
                </span>
              )}
            </div>
          )}

          {/* Mobile search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, bills, accounts..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2 pl-9 pr-4 text-xs text-text placeholder:text-text-muted focus:border-primary-500 focus:bg-surface focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
          </div>

          {/* Categorized Mobile Navigation */}
          <div className="space-y-4 pt-1">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text px-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", cat.color)} />
                  {cat.label}
                </div>
                <div className="space-y-1 pl-3 border-l border-border/80">
                  {cat.items.map((sub) => (
                    <button
                      key={sub.label}
                      type="button"
                      onClick={() => handleNavClick(sub)}
                      className="flex items-center justify-between w-full py-1.5 px-2 rounded-lg text-xs font-medium text-text-muted hover:text-text hover:bg-surface-muted text-left"
                    >
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
