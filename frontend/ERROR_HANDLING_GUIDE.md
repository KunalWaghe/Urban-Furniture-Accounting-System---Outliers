# Frontend Error Handling Guide

This guide explains how to use the centralized error handling system in the Urban Furniture Accounting System frontend.

## 📁 File Structure

```
src/lib/
├── constants.ts        # All error codes, messages, and constants
├── error-utils.ts      # Error handling utility functions
├── toast-utils.ts      # Toast notification helpers
└── api.ts             # API client and ApiError class
```

---

## 🎯 Quick Start

### 1. Import What You Need

```typescript
// Error constants
import { 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  ERROR_TITLES,
  DETAILED_ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from "@/lib/constants";

// Error utilities
import { 
  getErrorMessage, 
  getErrorTitle,
  isUnauthorizedError,
  isValidationError 
} from "@/lib/error-utils";

// Toast notifications
import { 
  showErrorToast, 
  showSuccessToast,
  showCreateSuccessToast 
} from "@/lib/toast-utils";

// API Error class
import { ApiError } from "@/lib/api";
```

---

## 📋 Constants Reference

### HTTP Status Codes

```typescript
HTTP_STATUS.OK                      // 200
HTTP_STATUS.CREATED                 // 201
HTTP_STATUS.NO_CONTENT              // 204

HTTP_STATUS.BAD_REQUEST             // 400
HTTP_STATUS.UNAUTHORIZED            // 401
HTTP_STATUS.FORBIDDEN               // 403
HTTP_STATUS.NOT_FOUND               // 404
HTTP_STATUS.CONFLICT                // 409
HTTP_STATUS.UNPROCESSABLE_ENTITY    // 422
HTTP_STATUS.TOO_MANY_REQUESTS       // 429

HTTP_STATUS.INTERNAL_SERVER_ERROR   // 500
HTTP_STATUS.BAD_GATEWAY             // 502
HTTP_STATUS.SERVICE_UNAVAILABLE     // 503
HTTP_STATUS.GATEWAY_TIMEOUT         // 504
```

### Error Messages

```typescript
// Generic HTTP status messages
ERROR_MESSAGES[HTTP_STATUS.UNAUTHORIZED]  // "You need to log in..."
ERROR_MESSAGES[HTTP_STATUS.NOT_FOUND]     // "The requested resource..."
ERROR_MESSAGES.NETWORK_ERROR              // "Network error. Please..."
ERROR_MESSAGES.UNKNOWN_ERROR              // "An unexpected error..."

// Error titles
ERROR_TITLES.LOGIN_FAILED           // "Unable to sign in"
ERROR_TITLES.ACCESS_DENIED          // "Access Denied"
ERROR_TITLES.VALIDATION_FAILED      // "Validation Failed"
ERROR_TITLES.SERVER_ERROR           // "Server Error"

// Detailed messages
DETAILED_ERROR_MESSAGES.LOGIN_INVALID_CREDENTIALS
DETAILED_ERROR_MESSAGES.PASSWORD_MISMATCH
DETAILED_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
DETAILED_ERROR_MESSAGES.NETWORK_CONNECTION_ERROR
```

### Success Messages

```typescript
SUCCESS_MESSAGES.LOGIN_SUCCESS
SUCCESS_MESSAGES.CREATE_SUCCESS
SUCCESS_MESSAGES.UPDATE_SUCCESS
SUCCESS_MESSAGES.DELETE_SUCCESS
SUCCESS_MESSAGES.USER_CREATED
SUCCESS_MESSAGES.CONTACT_CREATED
SUCCESS_MESSAGES.PO_CREATED
SUCCESS_MESSAGES.VENDOR_BILL_POSTED
```

### Backend Error Codes

```typescript
BACKEND_ERROR_CODES.NOT_FOUND
BACKEND_ERROR_CODES.INVALID_CREDENTIALS
BACKEND_ERROR_CODES.LOGIN_ID_ALREADY_EXISTS
BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS
BACKEND_ERROR_CODES.INVALID_STATUS_TRANSITION

// Get user-friendly message for backend code
BACKEND_ERROR_MESSAGES[BACKEND_ERROR_CODES.NOT_FOUND]
```

### Authentication Error Codes

```typescript
AUTH_ERROR_CODES.INVALID_CREDENTIALS
AUTH_ERROR_CODES.USER_INACTIVE
AUTH_ERROR_CODES.ROLE_NOT_ALLOWED
AUTH_ERROR_CODES.LOGIN_ID_ALREADY_EXISTS

// Get user-friendly message for auth code
AUTH_ERROR_CODE_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS]
```

### Field Validation Messages

```typescript
FIELD_VALIDATION_MESSAGES.REQUIRED_FIELD
FIELD_VALIDATION_MESSAGES.INVALID_EMAIL_FORMAT
FIELD_VALIDATION_MESSAGES.PASSWORD_TOO_SHORT
FIELD_VALIDATION_MESSAGES.LOGIN_ID_TOO_LONG
FIELD_VALIDATION_MESSAGES.AMOUNT_MUST_BE_POSITIVE
```

---

## 🛠️ Error Utility Functions

### Basic Error Extraction

```typescript
// Get user-friendly error message
const message = getErrorMessage(error, "Default fallback message");

// Get error title
const title = getErrorTitle(error);

// Get HTTP status message
const statusMessage = getHttpStatusMessage(404);

// Create comprehensive error summary
const summary = createErrorSummary(error, "Custom Title");
// Returns: { title, message, fields?, status?, code?, requestId? }
```

### Authentication Errors

```typescript
// Get auth-specific error message
const authMessage = getAuthErrorMessage(error, "Default auth message");

// Example in login handler
function handleLoginError(error: unknown) {
  const message = getAuthErrorMessage(
    error, 
    DETAILED_ERROR_MESSAGES.LOGIN_GENERIC_ERROR
  );
  setNotice({ kind: "error", title: ERROR_TITLES.LOGIN_FAILED, message });
}
```

### Error Type Checking

```typescript
// Check specific error types
if (isUnauthorizedError(error)) {
  // Handle 401 - redirect to login
  router.push("/login");
}

if (isForbiddenError(error)) {
  // Handle 403 - show access denied message
  showErrorToast(error, ERROR_TITLES.ACCESS_DENIED);
}

if (isValidationError(error)) {
  // Handle 422 - show field errors
  const fields = getFieldErrors(error);
  setErrors(fields);
}

if (isNotFoundError(error)) {
  // Handle 404
  showErrorToast(error, ERROR_TITLES.LOAD_FAILED);
}

if (isConflictError(error)) {
  // Handle 409
  showErrorToast(error, ERROR_TITLES.DUPLICATE_ENTRY);
}

if (isServerError(error)) {
  // Handle 5xx
  showServerErrorToast();
}

if (isNetworkError(error)) {
  // Handle network failure
  showNetworkErrorToast();
}
```

### Field Error Handling

```typescript
// Check if error has field-level validation errors
if (hasFieldErrors(error)) {
  const fieldErrors = getFieldErrors(error);
  // fieldErrors = { email: "Invalid format", password: "Too short" }
  
  setErrors(fieldErrors);
  
  // Focus first invalid field
  const firstField = Object.keys(fieldErrors)[0];
  document.getElementById(firstField)?.focus();
}
```

### Backend Error Code Handling

```typescript
// Check specific backend error code
if (isBackendError(error, BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS)) {
  setErrors({ email: DETAILED_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS });
}

// Get message for backend code
const message = getBackendErrorMessage(error.code);
```

### CRUD Error Handling

```typescript
// Get appropriate message for CRUD operations
const errorMessage = getCrudErrorMessage(error, "create");
// Operations: "create" | "update" | "delete" | "load"
```

### Error Logging

```typescript
// Log errors in development (automatically skipped in production)
logError(error, "Contact creation");
// Console output: [Error - Contact creation] { status, code, message, ... }
```

---

## 🎨 Toast Notification Helpers

### Error Toasts

```typescript
// Generic error toast
showErrorToast(error);
showErrorToast(error, "Custom Title");

// Validation error toast
showValidationErrorToast(error);

// Authentication error toast
showAuthErrorToast(error);

// Network error toast
showNetworkErrorToast();

// Server error toast
showServerErrorToast();

// Custom error message
showGenericErrorToast("Something went wrong", "Error Title");
```

### Success Toasts

```typescript
// Generic success toast
showSuccessToast("Operation completed successfully");

// CRUD success toasts
showCreateSuccessToast();              // "Created successfully."
showCreateSuccessToast("Contact");     // "Contact created successfully."

showUpdateSuccessToast("Product");     // "Product updated successfully."
showDeleteSuccessToast("User");        // "User deleted successfully."
showSaveSuccessToast();                // "Saved successfully."
```

### Info and Warning Toasts

```typescript
showInfoToast("Information message");
showWarningToast("Warning message");
```

### CRUD Result Handler

```typescript
// Automatically show appropriate toast based on result
handleCrudResult("create", true, "Contact");  // Success toast
handleCrudResult("update", false, "Product", error);  // Error toast
```

---

## 📝 Usage Examples

### Example 1: Login Form Error Handling

```typescript
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { 
  HTTP_STATUS, 
  ERROR_TITLES, 
  DETAILED_ERROR_MESSAGES 
} from "@/lib/constants";
import { 
  getAuthErrorMessage, 
  isUnauthorizedError,
  isValidationError,
  getFieldErrors 
} from "@/lib/error-utils";
import { showErrorToast } from "@/lib/toast-utils";

function useLoginForm() {
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onError: handleLoginError,
  });

  function handleLoginError(error: unknown) {
    // Check for validation errors (422)
    if (isValidationError(error)) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      showErrorToast(error, ERROR_TITLES.VALIDATION_FAILED);
      return;
    }

    // Check for invalid credentials (401)
    if (isUnauthorizedError(error)) {
      setNotice({
        kind: "error",
        title: ERROR_TITLES.INVALID_CREDENTIALS,
        message: DETAILED_ERROR_MESSAGES.LOGIN_INVALID_CREDENTIALS,
      });
      return;
    }

    // Generic error handling
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

  return { loginMutation, errors, notice };
}
```

### Example 2: Create Contact with Toast

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  showCreateSuccessToast, 
  showErrorToast 
} from "@/lib/toast-utils";
import { SUCCESS_MESSAGES } from "@/lib/constants";
import { logError } from "@/lib/error-utils";

function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      showCreateSuccessToast("Contact");
      // Or use constant: 
      // showSuccessToast(SUCCESS_MESSAGES.CONTACT_CREATED);
    },
    onError: (error) => {
      logError(error, "Contact creation");
      showErrorToast(error, "Unable to create contact");
    },
  });
}
```

### Example 3: Comprehensive Form Error Handling

```typescript
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  HTTP_STATUS,
  ERROR_TITLES,
  BACKEND_ERROR_CODES,
  DETAILED_ERROR_MESSAGES 
} from "@/lib/constants";
import { 
  isValidationError,
  isConflictError,
  isForbiddenError,
  getFieldErrors,
  createErrorSummary,
  isBackendError,
  logError 
} from "@/lib/error-utils";

function useSignupForm() {
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);

  const signupMutation = useMutation({
    mutationFn: register,
    onError: handleSignupError,
  });

  function handleSignupError(error: unknown) {
    // Log for debugging
    logError(error, "Signup");

    // Validation errors (422)
    if (isValidationError(error)) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      setNotice({
        kind: "error",
        title: ERROR_TITLES.VALIDATION_FAILED,
        message: DETAILED_ERROR_MESSAGES.VALIDATION_CHECK_FIELDS,
      });
      return;
    }

    // Conflict errors (409) - duplicate email/login
    if (isConflictError(error)) {
      if (isBackendError(error, BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS)) {
        setErrors({ email: DETAILED_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS });
        setNotice({
          kind: "error",
          title: ERROR_TITLES.DUPLICATE_ENTRY,
          message: DETAILED_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
        });
        return;
      }
      
      if (isBackendError(error, BACKEND_ERROR_CODES.LOGIN_ID_ALREADY_EXISTS)) {
        setErrors({ login_id: DETAILED_ERROR_MESSAGES.LOGIN_ID_ALREADY_EXISTS });
        setNotice({
          kind: "error",
          title: ERROR_TITLES.DUPLICATE_ENTRY,
          message: DETAILED_ERROR_MESSAGES.LOGIN_ID_ALREADY_EXISTS,
        });
        return;
      }
    }

    // Forbidden (403) - admin role not allowed
    if (isForbiddenError(error)) {
      setNotice({
        kind: "error",
        title: ERROR_TITLES.ACCESS_DENIED,
        message: DETAILED_ERROR_MESSAGES.ACCESS_DENIED_ADMIN_ONLY,
      });
      return;
    }

    // Generic error
    const summary = createErrorSummary(error, ERROR_TITLES.SIGNUP_FAILED);
    setNotice({
      kind: "error",
      title: summary.title,
      message: summary.message,
    });
  }

  return { signupMutation, errors, notice };
}
```

### Example 4: API Call with Error Handling

```typescript
import { apiFetch } from "@/lib/api";
import { 
  HTTP_STATUS,
  ERROR_MESSAGES 
} from "@/lib/constants";
import { 
  isUnauthorizedError,
  showErrorToast,
  showNetworkErrorToast 
} from "@/lib/error-utils";

async function fetchContacts() {
  try {
    const contacts = await apiFetch("/api/v1/contacts", { auth: true });
    return contacts;
  } catch (error) {
    // Redirect to login if unauthorized
    if (isUnauthorizedError(error)) {
      router.push("/login");
      return;
    }

    // Show network error toast
    if (isNetworkError(error)) {
      showNetworkErrorToast();
      throw error;
    }

    // Show generic error
    showErrorToast(error, "Failed to load contacts");
    throw error;
  }
}
```

---

## 🎭 Integration with Toast Library

The `toast-utils.ts` file provides a placeholder implementation. Integrate with your preferred library:

### Option 1: react-hot-toast

```typescript
// In toast-utils.ts
import toast from 'react-hot-toast';

function showToast(type: ToastType, message: string, options?: ToastOptions): void {
  const config = {
    duration: options?.duration || 4000,
  };

  switch (type) {
    case 'success':
      return toast.success(message, config);
    case 'error':
      return toast.error(message, config);
    case 'info':
      return toast(message, config);
    case 'warning':
      return toast(message, { ...config, icon: '⚠️' });
  }
}
```

### Option 2: sonner

```typescript
// In toast-utils.ts
import { toast } from 'sonner';

function showToast(type: ToastType, message: string, options?: ToastOptions): void {
  toast[type](options?.title || message, {
    description: options?.description,
    duration: options?.duration || 4000,
  });
}
```

---

## ✅ Best Practices

1. **Always use constants instead of hardcoding**
   ```typescript
   // ❌ Bad
   if (error.status === 401) { }
   
   // ✅ Good
   if (error.status === HTTP_STATUS.UNAUTHORIZED) { }
   if (isUnauthorizedError(error)) { }
   ```

2. **Use utility functions for error messages**
   ```typescript
   // ❌ Bad
   const message = error.message || "Something went wrong";
   
   // ✅ Good
   const message = getErrorMessage(error, ERROR_MESSAGES.UNKNOWN_ERROR);
   ```

3. **Handle specific errors before generic ones**
   ```typescript
   // Check specific errors first
   if (isUnauthorizedError(error)) { }
   else if (isValidationError(error)) { }
   else if (isForbiddenError(error)) { }
   else {
     // Generic error handling
   }
   ```

4. **Log errors in development**
   ```typescript
   logError(error, "Context description");
   ```

5. **Use toast utilities for user feedback**
   ```typescript
   // Show appropriate toasts
   showErrorToast(error);
   showSuccessToast(SUCCESS_MESSAGES.CREATE_SUCCESS);
   ```

6. **Extract and display field errors**
   ```typescript
   if (hasFieldErrors(error)) {
     const fields = getFieldErrors(error);
     setErrors(fields);
   }
   ```

---

## 📚 Full Reference

See the source files for complete lists:
- **`constants.ts`** - All error codes, messages, and constants
- **`error-utils.ts`** - All utility functions
- **`toast-utils.ts`** - All toast helpers
- **`api.ts`** - ApiError class and HTTP client

---

*All error handling is now centralized and consistent across the application!* 🎉
