"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Protected route failed to render:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <h1 className="text-2xl font-bold text-text">This accounting screen could not load</h1>
      <p className="mt-2 text-sm text-text-muted">No changes were made. Retry the request or return to the dashboard.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">Retry</button>
    </div>
  );
}
