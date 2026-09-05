/**
 * @file text-field.tsx
 *
 * Reusable labeled input with icon, error, hint, and optional addons.
 *
 * What this file does:
 * - Standard auth form field: label, left icon, input, error/hint text
 * - Supports success styling and right-side addons (e.g. checkmark, toggle)
 *
 * State consumed (controlled component):
 * - `value` and `onChange` come from the parent hook — this component does not store input state
 *
 * Who consumes this:
 * - `LoginForm`, `SignupForm`, and `PasswordInput`
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface TextFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  required?: boolean;
  labelAddon?: ReactNode;
  rightAddon?: ReactNode;
}

/**
 * Controlled text input used across auth forms.
 *
 * @param id - HTML id/name — also used to focus invalid fields from hooks
 * @param error - When set, shows red error text and aria-invalid
 * @param success - Green border when true and no error (e.g. passwords match)
 * @param hint - Helper text shown when there is no error
 * @param labelAddon - Extra content beside the label (e.g. "Forgot password?" link)
 * @param rightAddon - Icon or button inside the input on the right
 */
export function TextField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  error,
  success = false,
  hint,
  required = false,
  labelAddon,
  rightAddon,
}: TextFieldProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        {labelAddon}
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted/70">
          <Icon className="h-4 w-4" />
        </div>
        <Input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-10 pl-9",
            rightAddon ? "pr-10" : "pr-3",
            success && !error && "border-emerald-400 dark:border-emerald-600"
          )}
        />
        {rightAddon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightAddon}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
