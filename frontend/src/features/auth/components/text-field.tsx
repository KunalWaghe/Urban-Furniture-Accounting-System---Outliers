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
