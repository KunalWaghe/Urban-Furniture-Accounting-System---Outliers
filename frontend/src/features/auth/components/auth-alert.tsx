/**
 * @file auth-alert.tsx
 *
 * Dismissible banner for auth form messages (errors and info).
 *
 * What this file does:
 * - Renders a colored alert box with title, message, and close button
 * - Uses `role="alert"` for screen reader accessibility
 *
 * Who consumes this:
 * - `LoginForm` and `SignupForm` show this when `form.notice` is set
 */

import { AlertCircle, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AuthNotice } from "../validation";

interface AuthAlertProps extends AuthNotice {
  onDismiss: () => void;
}

/**
 * Banner alert shown above login/signup forms.
 *
 * @param kind - "error" (red) or "info" (blue)
 * @param title - Short heading (e.g. "Unable to sign in")
 * @param message - Longer explanation for the user
 * @param onDismiss - Called when user clicks the X button
 */
export function AuthAlert({ kind, title, message, onDismiss }: AuthAlertProps) {
  const isError = kind === "error";
  return (
    <div
      role="alert"
      className={cn(
        "mb-5 flex items-start gap-3 rounded-lg border p-3.5",
        isError
          ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40"
          : "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/40"
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      ) : (
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
      )}
      <div className="flex-1 text-xs sm:text-sm">
        <p
          className={cn(
            "font-semibold",
            isError
              ? "text-red-800 dark:text-red-300"
              : "text-blue-800 dark:text-blue-300"
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5",
            isError
              ? "text-red-700 dark:text-red-400"
              : "text-blue-700 dark:text-blue-400"
          )}
        >
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={cn(
          "p-0.5 transition-colors",
          isError
            ? "text-red-400 hover:text-red-600"
            : "text-blue-400 hover:text-blue-600"
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
