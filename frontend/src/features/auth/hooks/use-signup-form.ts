import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";
import { useCreateUser } from "@/features/users/queries";

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
  "role",
  "password",
  "confirmPassword",
  "terms",
];

import type { AuthUser, RegisterRequest } from "@/lib/types";

export interface UseSignupFormOptions {
  mode?: "signup" | "admin-create";
  onSuccess?: (createdUser: AuthUser) => void;
}

export function useSignupForm(options: UseSignupFormOptions = {}) {
  const { mode = "signup", onSuccess } = options;
  const router = useRouter();
  const { register } = useAuth();

  const [fields, setFields] = useState<SignupFields>({
    name: "",
    login_id: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: mode === "admin-create" ? "invoicing_user" : "contact",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
  });
  const createUserMutation = useCreateUser();

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
    const nextErrors = validateSignupFields(fields, {
      requireTerms: mode === "signup",
    });
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      setNotice({
        kind: "error",
        title: mode === "admin-create" ? "Unable to create user" : "Unable to create account",
        message: "Please correct the highlighted fields and try again.",
      });
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setNotice(null);

    if (mode === "admin-create") {
      createUserMutation.mutate(
        {
          name: fields.name.trim(),
          login_id: fields.login_id.trim(),
          email: fields.email.trim(),
          password: fields.password,
          role: fields.role || "invoicing_user",
        },
        {
          onSuccess: (res) => {
            setNotice({
              kind: "info",
              title: "User Created Successfully",
              message: `Account '${res.login_id}' created with role '${res.role}'.`,
            });

            setFields({
              name: "",
              login_id: "",
              email: "",
              password: "",
              confirmPassword: "",
              role: "invoicing_user",
              acceptedTerms: false,
            });
            setErrors({});
            onSuccess?.(res);
          },
          onError: (error) => handleApiError(error, "create user"),
        }
      );
      return;
    }

    // mode === "signup": Public registration creates user role (contact)
    registerMutation.mutate(
      {
        name: fields.name.trim(),
        login_id: fields.login_id.trim(),
        email: fields.email.trim(),
        password: fields.password,
      },
      {
        onSuccess: () => router.push("/"),
        onError: (error) => handleApiError(error, "create account"),
      }
    );
  }

  function handleApiError(error: unknown, actionName: string) {
    if (error instanceof ApiError) {
      if (error.status === 422 && error.fields) {
        const apiErrors = mapApiFieldsToSignupErrors(error.fields);
        setErrors((prev) => ({ ...prev, ...apiErrors }));
        setNotice({
          kind: "error",
          title: `Unable to ${actionName}`,
          message: error.message,
        });
        const firstApiInvalid = FIELD_ORDER.find((field) => apiErrors[field]);
        if (firstApiInvalid) {
          document.getElementById(firstApiInvalid)?.focus();
        }
        return;
      }

      if (error.status === 403) {
        setNotice({
          kind: "error",
          title: "Access Denied",
          message: error.message || "Only users with the Admin role can perform this action.",
        });
        return;
      }

      if (error.status === 409) {
        if (error.code === "LOGIN_ID_ALREADY_EXISTS") {
          setErrors((prev) => ({
            ...prev,
            login_id: error.message,
          }));
          setNotice({
            kind: "error",
            title: "Login ID already taken",
            message: error.message,
          });
          document.getElementById("login_id")?.focus();
          return;
        }
        if (error.code === "EMAIL_ALREADY_EXISTS") {
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
    }

    setNotice({
      kind: "error",
      title: `Unable to ${actionName}`,
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
    setRole,
    setAcceptedTerms,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    passwordStrength,
    passwordsMatch,
    notice,
    dismissNotice: () => setNotice(null),
    isSubmitting: registerMutation.isPending || createUserMutation.isPending,
    handleSubmit,
  };
}
