"use client"

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { useServerInsertedHTML } from "next/navigation"

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

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isInserted = useRef(false)

  useServerInsertedHTML(() => {
    if (isInserted.current) return null
    isInserted.current = true
    return (
      <script
        key="ufas-theme-init"
        dangerouslySetInnerHTML={{ __html: themeInitScript }}
      />
    )
  })

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
