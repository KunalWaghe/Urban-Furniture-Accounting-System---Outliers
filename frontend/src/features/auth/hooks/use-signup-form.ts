import { useState } from "react";
import type { FormEvent } from "react";

import { getPasswordStrength, validateSignupFields } from "../validation";
import type { AuthNotice, SignupErrors, SignupFields } from "../validation";

const FIELD_ORDER: Array<keyof SignupErrors> = [
  "name",
  "email",
  "password",
  "confirmPassword",
  "terms",
];

export function useSignupForm() {
  const [fields, setFields] = useState<SignupFields>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const passwordStrength = getPasswordStrength(fields.password);
  const passwordsMatch =
    fields.confirmPassword.length > 0 &&
    fields.password === fields.confirmPassword;

  function setField(
    field: keyof Omit<SignupFields, "acceptedTerms">,
    value: string
  ) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function setAcceptedTerms(value: boolean) {
    setFields((prev) => ({ ...prev, acceptedTerms: value }));
    setErrors((prev) => ({ ...prev, terms: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSignupFields(fields);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      setNotice({
        kind: "error",
        title: "Unable to create account",
        message: "Please correct the highlighted fields and try again.",
      });
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    // Demo only — real registration wiring happens in P0-INT-01
    console.log("[demo] signup submit", fields);
    setNotice({
      kind: "info",
      title: "Demo mode",
      message:
        "Registration is not connected yet. Your details were not sent anywhere.",
    });
  }

  return {
    fields,
    setField,
    errors,
    setAcceptedTerms,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    passwordStrength,
    passwordsMatch,
    notice,
    dismissNotice: () => setNotice(null),
    handleSubmit,
  };
}
