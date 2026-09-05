import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "@/lib/api";

import { useAuth } from "../auth-context";
import {
  getAuthErrorMessage,
  mapApiFieldsToSignupErrors,
} from "../error-mapping";
import { getPasswordStrength, validateSignupFields } from "../validation";
import type { AuthNotice, RoleValue, SignupErrors, SignupFields } from "../validation";

const FIELD_ORDER: Array<keyof SignupErrors> = [
  "name",
  "login_id",
  "email",
  "password",
  "confirmPassword",
  "role",
  "terms",
];

export function useSignupForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [fields, setFields] = useState<SignupFields>({
    name: "",
    login_id: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "invoicing_user",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function setRole(value: RoleValue) {
    setFields((prev) => ({ ...prev, role: value }));
    setErrors((prev) => ({ ...prev, role: undefined }));
  }

  function setAcceptedTerms(value: boolean) {
    setFields((prev) => ({ ...prev, acceptedTerms: value }));
    setErrors((prev) => ({ ...prev, terms: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setIsSubmitting(true);
    setNotice(null);

    try {
      await register({
        name: fields.name.trim(),
        login_id: fields.login_id.trim(),
        email: fields.email.trim(),
        password: fields.password,
        role: fields.role,
      });
      router.push("/");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 422 && error.fields) {
          const apiErrors = mapApiFieldsToSignupErrors(error.fields);
          setErrors((prev) => ({ ...prev, ...apiErrors }));
          setNotice({
            kind: "error",
            title: "Unable to create account",
            message: error.message,
          });
          const firstApiInvalid = FIELD_ORDER.find((field) => apiErrors[field]);
          if (firstApiInvalid) {
            document.getElementById(firstApiInvalid)?.focus();
          }
          return;
        }

        if (error.status === 409 && error.code === "EMAIL_ALREADY_EXISTS") {
          setErrors((prev) => ({
            ...prev,
            email: error.message,
          }));
          setNotice({
            kind: "error",
            title: "Account already exists",
            message: error.message,
          });
          document.getElementById("email")?.focus();
          return;
        }
      }

      setNotice({
        kind: "error",
        title: "Unable to create account",
        message: getAuthErrorMessage(
          error,
          "Something went wrong. Please try again."
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    fields,
    setField,
    errors,
    setRole,
    setAcceptedTerms,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    passwordStrength,
    passwordsMatch,
    notice,
    dismissNotice: () => setNotice(null),
    isSubmitting,
    handleSubmit,
  };
}
