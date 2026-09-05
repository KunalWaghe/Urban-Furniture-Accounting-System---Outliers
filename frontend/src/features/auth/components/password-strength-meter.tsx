/**
 * @file password-strength-meter.tsx
 *
 * Visual feedback for password requirements during signup.
 *
 * What this file does:
 * - Shows a 4-segment strength bar (Weak → Strong)
 * - Lists each password rule with a check/circle icon
 *
 * State consumed:
 * - `strength` prop from parent (computed by getPasswordStrength in the hook)
 *
 * Who consumes this:
 * - `SignupForm` renders this when the password field is non-empty
 */

import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PasswordStrength } from "../validation";

/** Bar segment colors indexed by strength score (1–4). */
const SEGMENT_COLORS = [
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-500",
];

/** Label text colors matching the bar segments. */
const LABEL_COLORS = [
  "text-red-600 dark:text-red-400",
  "text-amber-600 dark:text-amber-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-emerald-600 dark:text-emerald-400",
];

/**
 * Password strength indicator with progress bar and rule checklist.
 *
 * @param strength - Output of getPasswordStrength() from validation.ts
 */
export function PasswordStrengthMeter({
  strength,
}: {
  strength: PasswordStrength;
}) {
  const colorIndex = Math.max(strength.score - 1, 0);
  return (
    <div className="mt-2.5 rounded-lg border border-border bg-surface-muted p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-text">Password strength</span>
        <span className={cn("text-xs font-semibold", LABEL_COLORS[colorIndex])}>
          {strength.label} ({strength.score}/4)
        </span>
      </div>
      {/* Four segments — filled count matches strength.score */}
      <div className="mb-2.5 grid h-1.5 grid-cols-4 gap-1.5">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={cn(
              "rounded-full",
              index < strength.score ? SEGMENT_COLORS[colorIndex] : "bg-border"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        {strength.rules.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5",
              rule.passed
                ? "font-medium text-emerald-700 dark:text-emerald-400"
                : "text-text-muted"
            )}
          >
            {rule.passed ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
