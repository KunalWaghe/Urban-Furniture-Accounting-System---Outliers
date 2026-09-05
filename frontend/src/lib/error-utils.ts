/**
 * Error handling utilities for consistent error display across the application.
 * 
 * This module provides:
 * - Helper functions to extract user-friendly error messages
 * - Utilities to map HTTP status codes to messages
 * - Functions to handle ApiError instances
 * - Toast notification helpers for errors and success messages
 */

import { ApiError } from "./api";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  ERROR_TITLES,
  DETAILED_ERROR_MESSAGES,
  AUTH_ERROR_CODES,
  AUTH_ERROR_CODE_MESSAGES,
  BACKEND_ERROR_CODES,
  BACKEND_ERROR_MESSAGES,
} from "./constants";

// ============================================================================
// Error Message Extraction
// ============================================================================

/**
 * Get a user-friendly error message from any error type.
 * 
 * @param error - The error object (ApiError, Error, or unknown)
 * @param fallback - Default message if no specific message is available
 * @returns User-friendly error message string
 */
export function getErrorMessage(error: unknown, fallback: string = ERROR_MESSAGES.UNKNOWN_ERROR): string {
  // Handle ApiError instances from the backend
  if (error instanceof ApiError) {
    return error.message || getHttpStatusMessage(error.status);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Fallback for unknown error types
  return fallback;
}

/**
 * Get error title based on error type and status code.
 * 
 * @param error - The error object
 * @returns Appropriate error title
 */
export function getErrorTitle(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return ERROR_TITLES.UNAUTHORIZED;
      case HTTP_STATUS.FORBIDDEN:
        return ERROR_TITLES.FORBIDDEN;
      case HTTP_STATUS.NOT_FOUND:
        return ERROR_TITLES.LOAD_FAILED;
      case HTTP_STATUS.CONFLICT:
        return ERROR_TITLES.DUPLICATE_ENTRY;
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return ERROR_TITLES.VALIDATION_FAILED;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return ERROR_TITLES.SERVER_ERROR;
      default:
        return ERROR_TITLES.NETWORK_ERROR;
    }
  }

  return ERROR_TITLES.NETWORK_ERROR;
}

/**
 * Get a user-friendly message for an HTTP status code.
 * 
 * @param status - HTTP status code
 * @returns Corresponding error message
 */
export function getHttpStatusMessage(status: number): string {
  if (status in ERROR_MESSAGES) {
    return ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES];
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// ============================================================================
// Authentication Error Handling
// ============================================================================

/**
 * Get a user-friendly message for authentication errors.
 * 
 * @param error - The error object
 * @param fallback - Default message if no specific message is available
 * @returns User-friendly auth error message
 */
export function getAuthErrorMessage(error: unknown, fallback: string = DETAILED_ERROR_MESSAGES.LOGIN_GENERIC_ERROR): string {
  if (error instanceof ApiError) {
    // Check for specific auth error codes
    if (error.code in AUTH_ERROR_CODE_MESSAGES) {
      return AUTH_ERROR_CODE_MESSAGES[error.code as keyof typeof AUTH_ERROR_CODE_MESSAGES];
    }
    
    // Check for HTTP status-based auth errors
    switch (error.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return DETAILED_ERROR_MESSAGES.LOGIN_INVALID_CREDENTIALS;
      case HTTP_STATUS.FORBIDDEN:
        return DETAILED_ERROR_MESSAGES.ACCESS_DENIED_ADMIN_ONLY;
      default:
        return error.message || fallback;
    }
  }

  return getErrorMessage(error, fallback);
}

// ============================================================================
// Backend Error Code Handling
// ============================================================================

/**
 * Get a user-friendly message for backend error codes.
 * 
 * @param code - Backend error code
 * @returns User-friendly error message
 */
export function getBackendErrorMessage(code: string): string {
  if (code in BACKEND_ERROR_MESSAGES) {
    return BACKEND_ERROR_MESSAGES[code as keyof typeof BACKEND_ERROR_MESSAGES];
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if an error is a specific backend error code.
 * 
 * @param error - The error object
 * @param code - Backend error code to check
 * @returns True if the error matches the code
 */
export function isBackendError(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code;
}

// ============================================================================
// HTTP Status Checks
// ============================================================================

/**
 * Check if the error is an authentication error (401).
 */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_STATUS.UNAUTHORIZED;
}

/**
 * Check if the error is a forbidden error (403).
 */
export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_STATUS.FORBIDDEN;
}

/**
 * Check if the error is a not found error (404).
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND;
}

/**
 * Check if the error is a conflict error (409).
 */
export function isConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_STATUS.CONFLICT;
}

/**
 * Check if the error is a validation error (422).
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_STATUS.UNPROCESSABLE_ENTITY;
}

/**
 * Check if the error is a server error (5xx).
 */
export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 500 && error.status < 600;
}

/**
 * Check if the error is a network error (no response from server).
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && error.message.includes("network"));
}

// ============================================================================
// Field Error Handling
// ============================================================================

/**
 * Extract field-level errors from an ApiError.
 * 
 * @param error - The error object
 * @returns Record of field names to error messages, or empty object
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.fields) {
    return error.fields;
  }
  
  return {};
}

/**
 * Check if an error has field-level validation errors.
 */
export function hasFieldErrors(error: unknown): boolean {
  return error instanceof ApiError && Boolean(error.fields);
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log error details for debugging (in development only).
 * 
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === "development") {
    console.error(
      `[Error${context ? ` - ${context}` : ""}]`,
      error instanceof ApiError
        ? {
            status: error.status,
            code: error.code,
            message: error.message,
            fields: error.fields,
            requestId: error.requestId,
          }
        : error
    );
  }
}

// ============================================================================
// Error Summary for UI
// ============================================================================

export interface ErrorSummary {
  title: string;
  message: string;
  fields?: Record<string, string>;
  status?: number;
  code?: string;
  requestId?: string;
}

/**
 * Create a comprehensive error summary for UI display.
 * 
 * @param error - The error object
 * @param customTitle - Optional custom title
 * @returns Structured error summary
 */
export function createErrorSummary(error: unknown, customTitle?: string): ErrorSummary {
  const title = customTitle || getErrorTitle(error);
  const message = getErrorMessage(error);
  
  if (error instanceof ApiError) {
    return {
      title,
      message,
      fields: error.fields,
      status: error.status,
      code: error.code,
      requestId: error.requestId,
    };
  }
  
  return { title, message };
}

// ============================================================================
// Common Error Scenarios
// ============================================================================

/**
 * Handle common CRUD operation errors.
 * 
 * @param error - The error object
 * @param operation - The operation being performed (create, update, delete, load)
 * @returns User-friendly error message
 */
export function getCrudErrorMessage(error: unknown, operation: "create" | "update" | "delete" | "load"): string {
  const operationMessages = {
    create: DETAILED_ERROR_MESSAGES.CREATE_FAILED_GENERIC,
    update: DETAILED_ERROR_MESSAGES.UPDATE_FAILED_GENERIC,
    delete: DETAILED_ERROR_MESSAGES.DELETE_FAILED_GENERIC,
    load: DETAILED_ERROR_MESSAGES.LOAD_FAILED_GENERIC,
  };

  if (error instanceof ApiError) {
    // Return the specific error message from the API
    if (error.message) {
      return error.message;
    }
  }

  return operationMessages[operation];
}
