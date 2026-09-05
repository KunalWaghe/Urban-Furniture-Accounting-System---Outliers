import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";
import type { LoginRequest } from "@/lib/types";

import { useAuth } from "../auth-context";
import {
  getAuthErrorMessage,
  mapApiFieldsToLoginErrors,
} from "../error-mapping";
import { validateLoginFields } from "../validation";
import type { AuthNotice, LoginErrors, LoginFields } from "../validation";

const FIELD_ORDER: Array<keyof LoginFields> = ["login_id", "password"];

/**
 * Custom hook for managing login form state and submission
 * 
 * Flow:
 * 1. Manages form fields (login_id, password), validation errors, and UI state
 * 2. Uses React Query mutation for async login API call
 * 3. Validates fields locally before submission
 * 4. On success: Caches user session via AuthContext and redirects to dashboard
 * 5. On error: Maps API errors to field-specific messages and displays notices
 * 6. Supports "remember device" option for persistent sessions
 * 
 * @returns Form state, handlers, and submission logic for login component
 */
export function useLoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [fields, setFields] = useState<LoginFields>({
    login_id: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const loginMutation = useMutation({
    mutationFn: ({
      payload,
      remember,
    }: {
      payload: LoginRequest;
      remember: boolean;
    }) => login(payload, remember),
  });

  /**
   * Updates a single form field and clears its error
   */
  function setField(field: keyof LoginFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  /**
   * Handles form submission with validation and authentication
   * 
   * Flow:
   * 1. Validates all fields locally
   * 2. Focuses first invalid field if validation fails
   * 3. Calls login API via AuthContext
   * 4. On success: Redirects to dashboard
   * 5. On error: Displays appropriate error message and focuses relevant field
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setNotice(null);

    loginMutation.mutate(
      {
        payload: {
          login_id: fields.login_id.trim(),
          password: fields.password,
        },
        remember: rememberDevice,
      },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: handleLoginError,
      }
    );
  }

  /**
   * Handles login errors from API
   * Maps different error types (422 validation, 401 unauthorized, 403 forbidden) to user-friendly messages
   */
  function handleLoginError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 422 && error.fields) {
        const apiErrors = mapApiFieldsToLoginErrors(error.fields);
        setErrors((prev) => ({ ...prev, ...apiErrors }));
        setNotice({
          kind: "error",
          title: "Unable to sign in",
          message: error.message,
        });
        const firstApiInvalid = FIELD_ORDER.find((field) => apiErrors[field]);
        if (firstApiInvalid) {
          document.getElementById(firstApiInvalid)?.focus();
        }
        return;
      }

      if (error.status === 401) {
        setNotice({
          kind: "error",
          title: "Invalid credentials",
          message: error.message,
        });
        document.getElementById("password")?.focus();
        return;
      }

      if (error.status === 403) {
        setNotice({
          kind: "error",
          title: "Account Inactive",
          message: error.message || "Your account has been deactivated. Contact an administrator.",
        });
        return;
      }
    }

    setNotice({
      kind: "error",
      title: "Unable to sign in",
      message: getAuthErrorMessage(
        error,
        "Something went wrong. Please try again."
      ),
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
    isSubmitting: loginMutation.isPending,
    handleSubmit,
  };
}
