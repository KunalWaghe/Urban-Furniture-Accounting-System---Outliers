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
