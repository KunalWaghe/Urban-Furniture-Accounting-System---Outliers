/**
 * SiteFooter — simple footer bar shown at the bottom of app layouts.
 *
 * Displays app name and tech stack credit. No interactive state.
 */

/**
 * Static footer with app branding and build credit.
 *
 * **State OWNED:** none.
 *
 * **State CONSUMED:** none — all content is hardcoded.
 *
 * **Source of truth:** static JSX (no props or context).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-text-muted sm:flex-row sm:px-6 lg:px-8 2xl:px-10">
        <span className="text-center sm:text-left">Urban Furniture Accounting System</span>
        <span className="text-center sm:text-right">Built with Next.js &amp; shadcn/ui</span>
      </div>
    </footer>
  )
}
