# Error Handling Quick Reference

**One-page cheat sheet for centralized error handling**

---

## 📥 Imports

```typescript
// Constants
import { 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  ERROR_TITLES,
  DETAILED_ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  BACKEND_ERROR_CODES,
  FIELD_VALIDATION_MESSAGES 
} from "@/lib/constants";

// Utilities
import { 
  getErrorMessage,
  getErrorTitle,
  isUnauthorizedError,
  isValidationError,
  isForbiddenError,
  isConflictError,
  getFieldErrors,
  logError 
} from "@/lib/error-utils";

// Toast
import { 
  showErrorToast,
  showSuccessToast,
  showCreateSuccessToast 
} from "@/lib/toast-utils";

// API
import { ApiError } from "@/lib/api";
```

---

## 🔢 Common HTTP Status Codes

| Code | Constant | Meaning |
|------|----------|---------|
| 200 | `HTTP_STATUS.OK` | Success |
| 201 | `HTTP_STATUS.CREATED` | Created |
| 400 | `HTTP_STATUS.BAD_REQUEST` | Bad request |
| 401 | `HTTP_STATUS.UNAUTHORIZED` | Not authenticated |
| 403 | `HTTP_STATUS.FORBIDDEN` | Not authorized |
| 404 | `HTTP_STATUS.NOT_FOUND` | Not found |
| 409 | `HTTP_STATUS.CONFLICT` | Conflict (duplicate) |
| 422 | `HTTP_STATUS.UNPROCESSABLE_ENTITY` | Validation error |
| 500 | `HTTP_STATUS.INTERNAL_SERVER_ERROR` | Server error |

---

## ✅ Error Type Checking

```typescript
// Check error types
if (isUnauthorizedError(error)) { /* 401 */ }
if (isForbiddenError(error)) { /* 403 */ }
if (isNotFoundError(error)) { /* 404 */ }
if (isConflictError(error)) { /* 409 */ }
if (isValidationError(error)) { /* 422 */ }
if (isServerError(error)) { /* 5xx */ }
if (isNetworkError(error)) { /* Network failure */ }

// Check backend error code
if (isBackendError(error, BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS)) {
  // Handle specific backend error
}
```

---

## 💬 Get Error Messages

```typescript
// Get user-friendly message
const message = getErrorMessage(error, "Fallback message");

// Get error title
const title = getErrorTitle(error);

// Get auth error message
const authMsg = getAuthErrorMessage(error, "Default auth message");

// Get CRUD error message
const crudMsg = getCrudErrorMessage(error, "create"); // create|update|delete|load

// Get field-level errors
const fields = getFieldErrors(error);
// Returns: { email: "Invalid format", password: "Too short" }
```

---

## 🎨 Show Toast Notifications

```typescript
// Error toasts
showErrorToast(error);
showErrorToast(error, "Custom Title");
showValidationErrorToast(error);
showAuthErrorToast(error);
showNetworkErrorToast();
showServerErrorToast();

// Success toasts
showSuccessToast("Custom message");
showCreateSuccessToast("Contact");  // "Contact created successfully"
showUpdateSuccessToast("Product");  // "Product updated successfully"
showDeleteSuccessToast("User");     // "User deleted successfully"
showSaveSuccessToast();             // "Saved successfully"

// Info & Warning
showInfoToast("Info message");
showWarningToast("Warning message");
```

---

## 🔧 Common Patterns

### Pattern 1: Simple API Call
```typescript
try {
  const data = await apiFetch("/api/v1/contacts", { auth: true });
  return data;
} catch (error) {
  showErrorToast(error, "Failed to load contacts");
  throw error;
}
```

### Pattern 2: Mutation with Success Toast
```typescript
const createMutation = useMutation({
  mutationFn: createContact,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTACTS });
    showCreateSuccessToast("Contact");
  },
  onError: (error) => {
    logError(error, "Contact creation");
    showErrorToast(error);
  },
});
```

### Pattern 3: Form with Validation Errors
```typescript
const handleSubmit = async () => {
  try {
    await createContact(data);
    showCreateSuccessToast("Contact");
  } catch (error) {
    if (isValidationError(error)) {
      setErrors(getFieldErrors(error));
    }
    showErrorToast(error);
  }
};
```

### Pattern 4: Comprehensive Error Handling
```typescript
function handleError(error: unknown) {
  logError(error, "Operation");

  // Auth errors - redirect to login
  if (isUnauthorizedError(error)) {
    router.push("/login");
    return;
  }

  // Validation errors - show field errors
  if (isValidationError(error)) {
    setErrors(getFieldErrors(error));
    showValidationErrorToast(error);
    return;
  }

  // Conflict errors - specific handling
  if (isConflictError(error)) {
    if (isBackendError(error, BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS)) {
      setErrors({ email: DETAILED_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS });
    }
    showErrorToast(error);
    return;
  }

  // Generic error
  showErrorToast(error);
}
```

---

## 📋 Useful Constants

### Error Titles
```typescript
ERROR_TITLES.LOGIN_FAILED          // "Unable to sign in"
ERROR_TITLES.ACCESS_DENIED         // "Access Denied"
ERROR_TITLES.VALIDATION_FAILED     // "Validation Failed"
ERROR_TITLES.CREATE_FAILED         // "Unable to create"
ERROR_TITLES.UPDATE_FAILED         // "Unable to update"
ERROR_TITLES.SERVER_ERROR          // "Server Error"
```

### Detailed Messages
```typescript
DETAILED_ERROR_MESSAGES.LOGIN_INVALID_CREDENTIALS
DETAILED_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
DETAILED_ERROR_MESSAGES.PASSWORD_MISMATCH
DETAILED_ERROR_MESSAGES.VALIDATION_CHECK_FIELDS
DETAILED_ERROR_MESSAGES.NETWORK_CONNECTION_ERROR
```

### Success Messages
```typescript
SUCCESS_MESSAGES.CREATE_SUCCESS       // "Created successfully."
SUCCESS_MESSAGES.USER_CREATED         // "User created successfully."
SUCCESS_MESSAGES.CONTACT_CREATED      // "Contact created successfully."
SUCCESS_MESSAGES.PO_CREATED           // "Purchase order created successfully."
```

### Field Validation
```typescript
FIELD_VALIDATION_MESSAGES.REQUIRED_FIELD
FIELD_VALIDATION_MESSAGES.INVALID_EMAIL_FORMAT
FIELD_VALIDATION_MESSAGES.PASSWORD_TOO_SHORT
FIELD_VALIDATION_MESSAGES.AMOUNT_MUST_BE_POSITIVE
```

### Backend Error Codes
```typescript
BACKEND_ERROR_CODES.NOT_FOUND
BACKEND_ERROR_CODES.INVALID_CREDENTIALS
BACKEND_ERROR_CODES.LOGIN_ID_ALREADY_EXISTS
BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS
BACKEND_ERROR_CODES.INVALID_STATUS_TRANSITION
```

---

## 🚫 Don't Do This

```typescript
// ❌ Hardcoded status code
if (error.status === 401) { }

// ❌ Hardcoded error message
alert("Unable to create contact");

// ❌ Manual error parsing
const message = error.message || "Error occurred";

// ❌ No error logging
// Missing logError() call

// ❌ Inconsistent messages
"Contact created!" vs "Created successfully" vs "Success!"
```

---

## ✅ Do This Instead

```typescript
// ✅ Use constant
if (isUnauthorizedError(error)) { }

// ✅ Use toast helper
showErrorToast(error, ERROR_TITLES.CREATE_FAILED);

// ✅ Use utility function
const message = getErrorMessage(error, ERROR_MESSAGES.UNKNOWN_ERROR);

// ✅ Log errors
logError(error, "Contact creation");

// ✅ Use consistent messages
showCreateSuccessToast("Contact");
```

---

## 🔍 Quick Debug

```typescript
// Log error details (development only)
logError(error, "Context");

// Create error summary
const summary = createErrorSummary(error);
console.log(summary);
// { title, message, fields?, status?, code?, requestId? }

// Check if error is ApiError
if (error instanceof ApiError) {
  console.log("Status:", error.status);
  console.log("Code:", error.code);
  console.log("Message:", error.message);
  console.log("Fields:", error.fields);
  console.log("Request ID:", error.requestId);
}
```

---

## 📱 Complete Example: Login Form

```typescript
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  isUnauthorizedError,
  isValidationError,
  isForbiddenError,
  getFieldErrors,
  getAuthErrorMessage,
  logError 
} from "@/lib/error-utils";
import { 
  ERROR_TITLES,
  DETAILED_ERROR_MESSAGES 
} from "@/lib/constants";
import { useAuth } from "@/features/auth/auth-context";

function useLoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [fields, setFields] = useState({ login_id: "", password: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);

  const loginMutation = useMutation({
    mutationFn: (payload) => login(payload),
    onSuccess: () => router.push("/"),
    onError: handleLoginError,
  });

  function handleLoginError(error: unknown) {
    logError(error, "Login");

    // Validation errors (422)
    if (isValidationError(error)) {
      setErrors(getFieldErrors(error));
      setNotice({
        kind: "error",
        title: ERROR_TITLES.VALIDATION_FAILED,
        message: DETAILED_ERROR_MESSAGES.VALIDATION_CHECK_FIELDS,
      });
      return;
    }

    // Invalid credentials (401)
    if (isUnauthorizedError(error)) {
      setNotice({
        kind: "error",
        title: ERROR_TITLES.INVALID_CREDENTIALS,
        message: DETAILED_ERROR_MESSAGES.LOGIN_INVALID_CREDENTIALS,
      });
      return;
    }

    // Account inactive (403)
    if (isForbiddenError(error)) {
      setNotice({
        kind: "error",
        title: ERROR_TITLES.ACCOUNT_INACTIVE,
        message: DETAILED_ERROR_MESSAGES.LOGIN_ACCOUNT_INACTIVE,
      });
      return;
    }

    // Generic error
    const message = getAuthErrorMessage(
      error,
      DETAILED_ERROR_MESSAGES.LOGIN_GENERIC_ERROR
    );
    setNotice({
      kind: "error",
      title: ERROR_TITLES.LOGIN_FAILED,
      message,
    });
  }

  return {
    fields,
    setFields,
    errors,
    notice,
    isSubmitting: loginMutation.isPending,
    handleSubmit: (e) => {
      e.preventDefault();
      loginMutation.mutate(fields);
    },
  };
}
```

---

## 📚 Full Documentation

- **[ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md)** - Complete guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration instructions
- **[CENTRALIZED_ERROR_HANDLING_SUMMARY.md](./CENTRALIZED_ERROR_HANDLING_SUMMARY.md)** - Overview

---

*Quick reference for centralized error handling* ⚡
