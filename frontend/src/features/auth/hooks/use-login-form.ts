/**
 * @file use-login-form.ts
 *
 * Custom hook that owns all login form logic.
 *
 * What this file does:
 * - Manages form fields, validation errors, and UI toggles (show password, remember me)
 * - Validates locally, then calls AuthContext.login via React Query
 * - Maps API errors back to field messages and banner notices
 *
 * Who consumes this:
 * - `LoginForm` component — renders UI and wires inputs to this hook's return values
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";
import { HTTP_STATUS } from "@/lib/constants";
import type { LoginRequest } from "@/lib/types";

import { useAuth } from "../auth-context";
import {
  getAuthErrorMessage,
  mapApiFieldsToLoginErrors,
} from "../error-mapping";
import { getHomeRouteForRole, validateLoginFields } from "../validation";
import type { AuthNotice, LoginErrors, LoginFields } from "../validation";

/** Order used to focus the first invalid field on validation failure. */
const FIELD_ORDER: Array<keyof LoginFields> = ["login_id", "password"];

/**
 * Hook for the login form — state, validation, submit, and error handling.
 *
 * State owned:
 * - `fields` — login_id and password input values
 * - `errors` — per-field validation/API error messages
 * - `rememberDevice` — whether to persist session in localStorage
 * - `showPassword` — toggles password visibility
 * - `notice` — top-of-form banner (error/info)
 *
 * Side effects:
 * - On successful login: redirects to "/" (dashboard)
 * - On error: sets notice and focuses the relevant input
 *
 * Flow:
 * 1. User submits → validate locally
 * 2. If valid → loginMutation calls AuthContext.login
 * 3. Success → router.push("/")
 * 4. Failure → map status codes (422, 401, 403) to user messages
 *
 * @returns Form state, setters, handlers, and isSubmitting flag for LoginForm
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
   * Updates one field and clears its error so the user gets a fresh start.
   */
  function setField(field: keyof LoginFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  /**
   * Form submit handler — validate, then call login API.
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
        onSuccess: (user) => {
          router.push(getHomeRouteForRole(user.role));
        },
        onError: handleLoginError,
      }
    );
  }

  /**
   * Handles login API errors — maps HTTP status to field errors or banner notices.
   */
  function handleLoginError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === HTTP_STATUS.UNPROCESSABLE_ENTITY && error.fields) {
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

      if (error.status === HTTP_STATUS.UNAUTHORIZED) {
        setNotice({
          kind: "error",
          title: "Invalid credentials",
          message: error.message,
        });
        document.getElementById("password")?.focus();
        return;
      }

      if (error.status === HTTP_STATUS.FORBIDDEN) {
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
