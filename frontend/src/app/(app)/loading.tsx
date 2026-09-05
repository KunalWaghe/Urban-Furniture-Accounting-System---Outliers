export default function AppLoading() {
  return (
    <div className="space-y-5 p-6" aria-label="Loading accounting screen">
      <div className="h-8 w-64 animate-pulse rounded bg-surface-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-surface-muted" />
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-surface-muted" />
    </div>
  );
}
