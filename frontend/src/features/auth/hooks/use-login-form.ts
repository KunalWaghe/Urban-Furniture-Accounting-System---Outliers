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

  function setField(field: keyof LoginFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

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
