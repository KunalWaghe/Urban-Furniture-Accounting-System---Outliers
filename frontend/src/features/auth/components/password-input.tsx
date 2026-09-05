/**
 * @file password-input.tsx
 *
 * Password field with show/hide toggle.
 *
 * What this file does:
 * - Wraps `TextField` with type toggling (password ↔ text) and an eye icon button
 * - Keeps password UX consistent across login and signup forms
 *
 * Who consumes this:
 * - `LoginForm` and `SignupForm`
 */

import { Eye, EyeOff, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { TextField } from "./text-field";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
  labelAddon?: ReactNode;
}

/**
 * Text input configured for passwords with a visibility toggle.
 *
 * Parent owns `show` state (typically from useLoginForm / useSignupForm).
 *
 * @param show - When true, displays plain text instead of masked dots
 * @param onToggleShow - Flips show/hide when user clicks the eye button
 */
export function PasswordInput({
  show,
  onToggleShow,
  ...props
}: PasswordInputProps) {
  return (
    <TextField
      {...props}
      icon={Lock}
      type={show ? "text" : "password"}
      rightAddon={
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          className="text-text-muted/70 transition-colors hover:text-text"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}
