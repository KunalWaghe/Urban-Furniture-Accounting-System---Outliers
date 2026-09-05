/**
 * Toast notification utilities for displaying errors and success messages.
 * 
 * This module provides helpers for showing user-friendly notifications
 * using a toast library (can be integrated with react-hot-toast, sonner, etc.)
 * 
 * For now, this provides the interface. Integrate with your preferred toast library.
 */

import { getErrorMessage, getErrorTitle, createErrorSummary } from "./error-utils";
import { SUCCESS_MESSAGES } from "./constants";

// ============================================================================
// Toast Types
// ============================================================================

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  /** Toast duration in milliseconds (default: 4000) */
  duration?: number;
  /** Custom title for the toast */
  title?: string;
  /** Custom description/message */
  description?: string;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastEventDetail {
  type: ToastType;
  message: string;
  options?: ToastOptions;
}

export const TOAST_EVENT = "urban-furniture:toast";

function showToast(type: ToastType, message: string, options?: ToastOptions): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(TOAST_EVENT, {
      detail: { type, message, options },
    })
  );
}

// ============================================================================
// Error Toast Helpers
// ============================================================================

/**
 * Show an error toast with automatic message extraction.
 * 
 * @param error - Any error object
 * @param customTitle - Optional custom title
 * @param options - Additional toast options
 */
export function showErrorToast(error: unknown, customTitle?: string, options?: Omit<ToastOptions, "title">): void {
  const summary = createErrorSummary(error, customTitle);
  
  showToast("error", summary.message, {
    ...options,
    title: summary.title,
    description: summary.fields 
      ? `${Object.keys(summary.fields).length} field(s) have errors`
      : undefined,
  });
}

/**
 * Show an error toast for API errors with field validation details.
 * 
 * @param error - The error object
 * @param options - Additional toast options
 */
export function showValidationErrorToast(error: unknown, options?: ToastOptions): void {
  const message = getErrorMessage(error, "Please check your input and try again.");
  const title = options?.title || "Validation Error";
  
  showToast("error", message, {
    ...options,
    title,
  });
}

/**
 * Show a generic error toast with a custom message.
 * 
 * @param message - The error message to display
 * @param title - Optional title
 * @param options - Additional toast options
 */
export function showGenericErrorToast(message: string, title?: string, options?: Omit<ToastOptions, "title">): void {
  showToast("error", message, {
    ...options,
    title: title || "Error",
  });
}

/**
 * Show an authentication error toast.
 * 
 * @param error - The error object
 * @param options - Additional toast options
 */
export function showAuthErrorToast(error: unknown, options?: ToastOptions): void {
  const message = getErrorMessage(error);
  const title = getErrorTitle(error);
  
  showToast("error", message, {
    ...options,
    title,
  });
}

/**
 * Show a network error toast.
 * 
 * @param options - Additional toast options
 */
export function showNetworkErrorToast(options?: ToastOptions): void {
  showToast("error", "Unable to connect to the server. Please check your internet connection.", {
    ...options,
    title: "Network Error",
  });
}

/**
 * Show a server error toast.
 * 
 * @param options - Additional toast options
 */
export function showServerErrorToast(options?: ToastOptions): void {
  showToast("error", "An unexpected server error occurred. Please try again later.", {
    ...options,
    title: "Server Error",
  });
}

// ============================================================================
// Success Toast Helpers
// ============================================================================

/**
 * Show a success toast.
 * 
 * @param message - Success message
 * @param options - Additional toast options
 */
export function showSuccessToast(message: string, options?: ToastOptions): void {
  showToast("success", message, options);
}

/**
 * Show a success toast for create operations.
 * 
 * @param itemName - Name of the created item (e.g., "Contact", "Product")
 * @param options - Additional toast options
 */
export function showCreateSuccessToast(itemName?: string, options?: ToastOptions): void {
  const message = itemName 
    ? `${itemName} created successfully.`
    : SUCCESS_MESSAGES.CREATE_SUCCESS;
  
  showToast("success", message, options);
}

/**
 * Show a success toast for update operations.
 * 
 * @param itemName - Name of the updated item
 * @param options - Additional toast options
 */
export function showUpdateSuccessToast(itemName?: string, options?: ToastOptions): void {
  const message = itemName
    ? `${itemName} updated successfully.`
    : SUCCESS_MESSAGES.UPDATE_SUCCESS;
  
  showToast("success", message, options);
}

/**
 * Show a success toast for delete operations.
 * 
 * @param itemName - Name of the deleted item
 * @param options - Additional toast options
 */
export function showDeleteSuccessToast(itemName?: string, options?: ToastOptions): void {
  const message = itemName
    ? `${itemName} deleted successfully.`
    : SUCCESS_MESSAGES.DELETE_SUCCESS;
  
  showToast("success", message, options);
}

/**
 * Show a success toast for save operations.
 * 
 * @param options - Additional toast options
 */
export function showSaveSuccessToast(options?: ToastOptions): void {
  showToast("success", SUCCESS_MESSAGES.SAVE_SUCCESS, options);
}

// ============================================================================
// Info and Warning Toast Helpers
// ============================================================================

/**
 * Show an info toast.
 * 
 * @param message - Info message
 * @param options - Additional toast options
 */
export function showInfoToast(message: string, options?: ToastOptions): void {
  showToast("info", message, options);
}

/**
 * Show a warning toast.
 * 
 * @param message - Warning message
 * @param options - Additional toast options
 */
export function showWarningToast(message: string, options?: ToastOptions): void {
  showToast("warning", message, options);
}

// ============================================================================
// CRUD Operation Helpers
// ============================================================================

/**
 * Handle CRUD operation result with appropriate toast.
 * 
 * @param operation - The operation performed
 * @param success - Whether the operation succeeded
 * @param itemName - Optional name of the item
 * @param error - Optional error object if failed
 */
export function handleCrudResult(
  operation: "create" | "update" | "delete" | "save",
  success: boolean,
  itemName?: string,
  error?: unknown
): void {
  if (success) {
    switch (operation) {
      case "create":
        showCreateSuccessToast(itemName);
        break;
      case "update":
        showUpdateSuccessToast(itemName);
        break;
      case "delete":
        showDeleteSuccessToast(itemName);
        break;
      case "save":
        showSaveSuccessToast();
        break;
    }
  } else if (error) {
    showErrorToast(error);
  }
}

// ============================================================================
// Export showToast for custom implementations
// ============================================================================

export { showToast };
