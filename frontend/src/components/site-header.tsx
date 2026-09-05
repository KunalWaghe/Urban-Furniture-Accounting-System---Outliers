"use client"

import Link from "next/link"
import { Armchair, Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/theme-provider"

export function SiteHeader() {
  const { darkMode, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-600 p-1.5 text-white">
            <Armchair className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-sm font-bold text-text">Urban Furniture</span>
            <span className="block text-xs text-text-muted">Accounting System</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-lg border border-border p-2 text-text hover:bg-surface-muted"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}
