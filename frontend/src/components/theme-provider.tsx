"use client"

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"

interface ThemeContextValue {
  darkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_CHANGE_EVENT = "ufas-theme-change"

function subscribeToTheme(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function getDarkModeSnapshot() {
  return document.documentElement.classList.contains("dark")
}

function getServerDarkModeSnapshot() {
  return false
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getDarkModeSnapshot,
    getServerDarkModeSnapshot
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      darkMode,
      toggleTheme: () => {
        const next = !document.documentElement.classList.contains("dark")
        document.documentElement.classList.toggle("dark", next)
        try {
          localStorage.setItem("theme", next ? "dark" : "light")
        } catch {
          // localStorage unavailable (e.g. private browsing) — theme still toggles
        }
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
      },
    }),
    [darkMode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
