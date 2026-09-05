/**
 * Shared UI utility re-exports.
 *
 * Role in the app:
 * - Provides a single import path (`@/lib/utils`) for common helpers
 * - Currently re-exports `cn` for merging Tailwind CSS class names
 *
 * Use `cn("base-class", condition && "conditional-class")` in components
 * to combine static and dynamic class strings without conflicts.
 */

export { cn } from "cn"
