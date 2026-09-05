/**
 * Dark/light theme context and persistence.
 *
 * Role in the app:
 * - Reads/writes the `dark` class on `<html>` for Tailwind dark mode
 * - Persists user preference in localStorage (`theme` key)
 * - Injects a blocking script so the first paint matches saved preference
 *
 * Wrap layout content with ThemeProvider and call `useTheme()` in nav/header
 * components to read or toggle the theme.
 */

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

/** Shape of the theme context value exposed by useTheme(). */
interface ThemeContextValue {
  darkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Custom event name fired after toggling theme so subscribers re-read DOM state. */
const THEME_CHANGE_EVENT = "ufas-theme-change"

/** Subscribes to theme changes from toggle events and cross-tab storage updates. */
function subscribeToTheme(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

/** Reads current dark mode from the DOM class list (client snapshot). */
function getDarkModeSnapshot() {
  return document.documentElement.classList.contains("dark")
}

/** Always returns false on the server so SSR HTML is consistent. */
function getServerDarkModeSnapshot() {
  return false
}

/**
 * Inline script injected before first paint.
 * Reads localStorage or system preference and sets the `dark` class immediately
 * to prevent a flash of the wrong theme.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`

/**
 * Provides theme state and a toggle function to descendants.
 *
 * When to use: wrap the app layout (typically alongside AppProviders).
 *
 * Flow (toggle):
 * 1. Flip `dark` class on `<html>`
 * 2. Save `"dark"` or `"light"` to localStorage
 * 3. Dispatch THEME_CHANGE_EVENT so useSyncExternalStore re-reads the DOM
 *
 * State owned: none directly — `darkMode` is derived from DOM via useSyncExternalStore
 * State consumed: DOM class list + localStorage (via init script and toggle)
 * Source of truth: `<html class="dark">` and localStorage `theme` key
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const isInserted = useRef(false)

  // Inject theme init script once during SSR so the first paint uses saved preference.
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

/**
 * Reads the current theme and exposes `toggleTheme`.
 *
 * Must be called inside a ThemeProvider — throws otherwise.
 *
 * @returns `{ darkMode, toggleTheme }`
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
