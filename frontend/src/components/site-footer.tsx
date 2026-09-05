export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-text-muted sm:flex-row sm:px-6 lg:px-8">
        <span className="text-center sm:text-left">Urban Furniture Accounting System</span>
        <span className="text-center sm:text-right">Built with Next.js &amp; shadcn/ui</span>
      </div>
    </footer>
  )
}
