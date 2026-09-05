/**
 * Display formatting helpers for money and dates.
 *
 * Role in the app:
 * - Keeps currency and date output consistent across tables and cards
 * - Uses Indian locale (`en-IN`) for rupee symbol and date style
 *
 * Use these in UI components instead of calling `toLocaleString` inline.
 */

/**
 * Formats a number as Indian Rupees (e.g. `₹1,23,456.78`).
 *
 * @param value - Numeric amount (not paise — pass rupees directly)
 * @returns Formatted string with ₹ prefix and Indian grouping
 */
export function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Returns a local calendar date for date inputs without converting through UTC. */
export function todayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPlainDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats an ISO date string for display (e.g. `05 Sep 2026`).
 *
 * If the input is not a valid date, returns the original string unchanged
 * so the UI still shows something rather than "Invalid Date".
 *
 * @param value - ISO date string from the API (e.g. `"2026-09-05"`)
 */
export function formatDate(value: string): string {
  const plainDate = formatPlainDate(value);
  if (plainDate) return plainDate;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats an ISO datetime string with date and time (e.g. `05 Sep 2026, 9:30 pm`).
 *
 * Same fallback behavior as `formatDate` — invalid input is returned as-is.
 *
 * @param value - ISO datetime string from the API
 */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
