import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "cn";

import type { PasswordStrength } from "../validation";

const SEGMENT_COLORS = [
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-500",
];

const LABEL_COLORS = [
  "text-red-600 dark:text-red-400",
  "text-amber-600 dark:text-amber-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-emerald-600 dark:text-emerald-400",
];

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
