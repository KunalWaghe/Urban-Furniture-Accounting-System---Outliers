# Error Handling Migration Guide

This guide helps you migrate existing code to use the centralized error handling system.

## 🎯 Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
// Scattered constants
const STATUS_UNAUTHORIZED = 401;
const ERROR_MSG = "Something went wrong";
```

**After:**
```typescript
import { 
  HTTP_STATUS, 
  ERROR_MESSAGES,
  ERROR_TITLES,
  DETAILED_ERROR_MESSAGES 
} from "@/lib/constants";

import { 
  getErrorMessage,
  isUnauthorizedError 
} from "@/lib/error-utils";

import { showErrorToast } from "@/lib/toast-utils";
```

---

### Step 2: Replace Hardcoded Status Codes

**Before:**
```typescript
if (error.status === 401) {
  router.push("/login");
}

if (error.status === 422) {
  setErrors(error.fields);
}

if (error.status === 404) {
  showError("Not found");
}
```

**After:**
```typescript
if (isUnauthorizedError(error)) {
  router.push("/login");
}

if (isValidationError(error)) {
  setErrors(getFieldErrors(error));
}

if (isNotFoundError(error)) {
  showErrorToast(error, ERROR_TITLES.LOAD_FAILED);
}
```

---

### Step 3: Replace Hardcoded Error Messages

**Before:**
```typescript
function handleLoginError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      setNotice({
        kind: "error",
        title: "Invalid credentials",
        message: "The login ID or password you entered is incorrect. Please try again.",
      });
    }
  } else {
    setNotice({
      kind: "error",
      title: "Unable to sign in",
      message: "Something went wrong. Please try again.",
    });
  }
}
```

**After:**
```typescript
import { 
  ERROR_TITLES, 
  DETAILED_ERROR_MESSAGES 
} from "@/lib/constants";
import { 
  getAuthErrorMessage, 
  isUnauthorizedError 
} from "@/lib/error-utils";

function handleLoginError(error: unknown) {
  if (isUnauthorizedError(error)) {
    setNotice({
      kind: "error",
      title: ERROR_TITLES.INVALID_CREDENTIALS,
      message: DETAILED_ERROR_MESSAGES.LOGIN_INVALID_CREDENTIALS,
    });
  } else {
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
}
```

---

### Step 4: Update Error Checking Logic

**Before:**
```typescript
try {
  await createContact(data);
  alert("Success!");
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.fields) {
      setErrors(error.fields);
      alert(error.message);
    } else if (error.status === 409) {
      if (error.code === "EMAIL_ALREADY_EXISTS") {
        setErrors({ email: "Email already exists" });
      }
    } else {
      alert("Failed to create contact");
    }
  } else {
    alert("Network error");
  }
}
```

**After:**
```typescript
import { 
  isValidationError, 
  isConflictError, 
  isBackendError,
  getFieldErrors 
} from "@/lib/error-utils";
import { 
  BACKEND_ERROR_CODES,
  DETAILED_ERROR_MESSAGES 
} from "@/lib/constants";
import { 
  showCreateSuccessToast, 
  showErrorToast 
} from "@/lib/toast-utils";

try {
  await createContact(data);
  showCreateSuccessToast("Contact");
} catch (error) {
  if (isValidationError(error)) {
    setErrors(getFieldErrors(error));
    showErrorToast(error);
  } else if (isConflictError(error)) {
    if (isBackendError(error, BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS)) {
      setErrors({ 
        email: DETAILED_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS 
      });
    }
    showErrorToast(error);
  } else {
    showErrorToast(error, "Failed to create contact");
  }
}
```

---

### Step 5: Update Mutation Error Handlers

**Before:**
```typescript
const createMutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries(["products"]);
    alert("Product created!");
  },
  onError: (error) => {
    if (error instanceof ApiError) {
      alert(error.message || "Failed to create product");
    } else {
      alert("Something went wrong");
    }
  },
});
```

**After:**
```typescript
import { 
  showCreateSuccessToast, 
  showErrorToast 
} from "@/lib/toast-utils";
import { logError } from "@/lib/error-utils";
import { QUERY_KEYS } from "@/lib/constants";

const createMutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
    showCreateSuccessToast("Product");
  },
  onError: (error) => {
    logError(error, "Product creation");
    showErrorToast(error, "Failed to create product");
  },
});
```

---

### Step 6: Update Field Validation

**Before:**
```typescript
function validateLoginFields(fields: LoginFields): LoginErrors {
  const errors: LoginErrors = {};
  
  if (!fields.login_id) {
    errors.login_id = "Login ID is required";
  }
  
  if (!fields.password) {
    errors.password = "Password is required";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  
  return errors;
}
```

**After:**
```typescript
import { FIELD_VALIDATION_MESSAGES } from "@/lib/constants";

function validateLoginFields(fields: LoginFields): LoginErrors {
  const errors: LoginErrors = {};
  
  if (!fields.login_id) {
    errors.login_id = FIELD_VALIDATION_MESSAGES.REQUIRED_LOGIN_ID;
  }
  
  if (!fields.password) {
    errors.password = FIELD_VALIDATION_MESSAGES.REQUIRED_PASSWORD;
  } else if (fields.password.length < 8) {
    errors.password = FIELD_VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
  }
  
  return errors;
}
```

---

### Step 7: Update Backend Error Code Handling

**Before:**
```typescript
function handleSignupError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "LOGIN_ID_ALREADY_EXISTS") {
      setErrors({ 
        login_id: "This login ID is already taken" 
      });
    } else if (error.code === "EMAIL_ALREADY_EXISTS") {
      setErrors({ 
        email: "An account with this email already exists" 
      });
    }
  }
}
```

**After:**
```typescript
import { 
  isBackendError 
} from "@/lib/error-utils";
import { 
  BACKEND_ERROR_CODES,
  DETAILED_ERROR_MESSAGES 
} from "@/lib/constants";

function handleSignupError(error: unknown) {
  if (isBackendError(error, BACKEND_ERROR_CODES.LOGIN_ID_ALREADY_EXISTS)) {
    setErrors({ 
      login_id: DETAILED_ERROR_MESSAGES.LOGIN_ID_ALREADY_EXISTS 
    });
  } else if (isBackendError(error, BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS)) {
    setErrors({ 
      email: DETAILED_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS 
    });
  }
}
```

---

### Step 8: Update Success Messages

**Before:**
```typescript
// Scattered success messages
toast.success("User created successfully");
toast.success("Contact updated successfully");
toast.success("Product deleted successfully");
```

**After:**
```typescript
import { 
  showCreateSuccessToast,
  showUpdateSuccessToast,
  showDeleteSuccessToast 
} from "@/lib/toast-utils";
// Or use constants directly
import { SUCCESS_MESSAGES } from "@/lib/constants";

showCreateSuccessToast("User");
showUpdateSuccessToast("Contact");
showDeleteSuccessToast("Product");

// Or with constants
showSuccessToast(SUCCESS_MESSAGES.USER_CREATED);
showSuccessToast(SUCCESS_MESSAGES.CONTACT_UPDATED);
showSuccessToast(SUCCESS_MESSAGES.PRODUCT_DELETED);
```

---

## 📋 Files to Update

### Priority 1: Authentication Files

- ✅ `features/auth/hooks/use-login-form.ts` - Already migrated
- ✅ `features/auth/hooks/use-signup-form.ts` - Already migrated
- `features/auth/error-mapping.ts` - Update to use constants

### Priority 2: API Client Files

- ✅ `lib/api.ts` - Already using constants
- `features/*/api.ts` - Update all API service files

### Priority 3: Form Hooks

- `features/contacts/hooks/*`
- `features/products/hooks/*`
- `features/accounting/hooks/*`
- `features/purchase-orders/hooks/*`
- `features/vendor-bills/hooks/*`

### Priority 4: Page Components

- `app/*/page.tsx` - All page components
- `features/*/components/*` - Feature components

---

## 🔍 Search and Replace Patterns

Use these patterns to find code that needs migration:

### Find Hardcoded Status Codes
```regex
error\.status\s*===\s*\d+
status\s*===\s*\d+
```

### Find Hardcoded Error Messages
```regex
(message|title):\s*["'].*error.*["']
alert\(["'].*["']\)
```

### Find Manual Error Checking
```regex
error instanceof ApiError
error\.status
error\.code\s*===
```

---

## ✅ Migration Checklist

For each file you migrate:

- [ ] Replace hardcoded status codes with `HTTP_STATUS.*`
- [ ] Replace hardcoded messages with constants
- [ ] Use utility functions (`getErrorMessage`, `isUnauthorizedError`, etc.)
- [ ] Use toast utilities for user feedback
- [ ] Add `logError` calls for debugging
- [ ] Update field validation to use `FIELD_VALIDATION_MESSAGES`
- [ ] Replace backend code checks with `isBackendError()`
- [ ] Use success message constants
- [ ] Update imports to use centralized modules
- [ ] Test error scenarios

---

## 🧪 Testing After Migration

Test these scenarios to ensure migration is successful:

### Authentication Errors
- [ ] Invalid credentials (401)
- [ ] Inactive account (403)
- [ ] Duplicate email/login ID (409)
- [ ] Validation errors (422)

### CRUD Operations
- [ ] Create success
- [ ] Create validation error
- [ ] Update success
- [ ] Update not found error
- [ ] Delete success
- [ ] Delete forbidden error

### Network Errors
- [ ] Network timeout
- [ ] Server unavailable (503)
- [ ] Internal server error (500)

### Field Validation
- [ ] Required fields
- [ ] Invalid formats
- [ ] Length constraints
- [ ] Business logic validation

---

## 💡 Tips

1. **Migrate incrementally** - Start with auth files, then move to other features
2. **Test each file** after migration before moving to the next
3. **Use Find & Replace** carefully with regex patterns
4. **Keep old code commented** temporarily until testing is complete
5. **Update tests** to use new constants and utilities
6. **Document custom error codes** if you add project-specific ones

---

## 🆘 Common Issues

### Issue: Toast not showing
**Solution:** Make sure you've integrated `showToast` in `toast-utils.ts` with your toast library

### Issue: Type errors with constants
**Solution:** Import the correct type exports:
```typescript
import type { HttpStatus, AuthErrorCode } from "@/lib/constants";
```

### Issue: Error message not found
**Solution:** Check if the message exists in constants, or add it if needed

### Issue: Field errors not displaying
**Solution:** Use `getFieldErrors(error)` and check that error has `fields` property

---

## 📚 Resources

- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md) - Complete usage guide
- `lib/constants.ts` - All constants
- `lib/error-utils.ts` - All utility functions
- `lib/toast-utils.ts` - Toast helpers

---

*Migration complete! All errors are now centralized and consistent.* ✅
