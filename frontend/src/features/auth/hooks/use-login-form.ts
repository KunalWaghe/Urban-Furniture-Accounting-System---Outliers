import { useState } from "react";
import type { FormEvent } from "react";

import { validateLoginFields } from "../validation";
import type { AuthNotice, LoginErrors, LoginFields } from "../validation";

const FIELD_ORDER: Array<keyof LoginFields> = ["email", "password"];

export function useLoginForm() {
  const [fields, setFields] = useState<LoginFields>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  function setField(field: keyof LoginFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginFields(fields);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      setNotice({
        kind: "error",
        title: "Unable to sign in",
        message: "Please correct the highlighted fields and try again.",
      });
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    // Demo only — real auth wiring happens in P0-INT-01 (spec §Future Seams)
    console.log("[demo] login submit", { ...fields, rememberDevice });
    setNotice({
      kind: "info",
      title: "Demo mode",
      message:
        "Authentication is not connected yet. Your credentials were not sent anywhere.",
    });
  }

  return {
    fields,
    setField,
    errors,
    rememberDevice,
    setRememberDevice,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    notice,
    dismissNotice: () => setNotice(null),
    handleSubmit,
  };
}
