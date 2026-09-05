/**
 * Centralized HTTP Status Codes and Error Constants
 * 
 * This file contains all HTTP status codes and error-related constants
 * used throughout the application for consistent error handling.
 */

// ============================================================================
// HTTP Status Codes
// ============================================================================

/**
 * HTTP Status Codes used in the application
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Generic error messages for different HTTP status codes
 */
export const ERROR_MESSAGES = {
  [HTTP_STATUS.BAD_REQUEST]: "Invalid request. Please check your input.",
  [HTTP_STATUS.UNAUTHORIZED]: "You need to log in to access this resource.",
  [HTTP_STATUS.FORBIDDEN]: "You don't have permission to access this resource.",
  [HTTP_STATUS.NOT_FOUND]: "The requested resource was not found.",
  [HTTP_STATUS.CONFLICT]: "This resource already exists or conflicts with existing data.",
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: "The data provided could not be processed.",
  [HTTP_STATUS.TOO_MANY_REQUESTS]: "Too many requests. Please try again later.",
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: "An internal server error occurred. Please try again.",
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable. Please try again later.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;

// ============================================================================
// Authentication Error Codes
// ============================================================================

/**
 * Authentication-specific error codes
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "invalid_credentials",
  ACCOUNT_INACTIVE: "account_inactive",
  ACCOUNT_LOCKED: "account_locked",
  TOKEN_EXPIRED: "token_expired",
  TOKEN_INVALID: "token_invalid",
  SESSION_EXPIRED: "session_expired",
} as const;

// ============================================================================
// Validation Error Codes
// ============================================================================

/**
 * Field validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  REQUIRED: "required",
  INVALID_FORMAT: "invalid_format",
  TOO_SHORT: "too_short",
  TOO_LONG: "too_long",
  INVALID_EMAIL: "invalid_email",
  WEAK_PASSWORD: "weak_password",
  PASSWORDS_MISMATCH: "passwords_mismatch",
  DUPLICATE: "duplicate",
} as const;

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * Keys used for browser storage (localStorage/sessionStorage)
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "uf_auth_token",
  AUTH_USER: "uf_auth_user",
  THEME: "uf_theme",
} as const;

// ============================================================================
// API Constants
// ============================================================================

/**
 * API-related constants
 */
export const API_CONSTANTS = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// ============================================================================
// Query Keys
// ============================================================================

/**
 * React Query cache keys for consistent data fetching
 */
export const QUERY_KEYS = {
  // Auth
  CURRENT_USER: ["auth", "current-user"],
  
  // Dashboard
  DASHBOARD_STATS: ["dashboard", "stats"],
  
  // Accounts
  ACCOUNTS: ["accounts"],
  ACCOUNT_DETAIL: (id: number) => ["accounts", id],
  
  // Contacts
  CONTACTS: ["contacts"],
  CONTACT_DETAIL: (id: number) => ["contacts", id],
  
  // Products
  PRODUCTS: ["products"],
  PRODUCT_DETAIL: (id: number) => ["products", id],
  
  // Purchase Orders
  PURCHASE_ORDERS: ["purchase-orders"],
  PURCHASE_ORDER_DETAIL: (id: number) => ["purchase-orders", id],
  
  // Vendor Bills
  VENDOR_BILLS: ["vendor-bills"],
  VENDOR_BILL_DETAIL: (id: number) => ["vendor-bills", id],
  
  // Sales Orders
  SALES_ORDERS: ["sales-orders"],
  SALES_ORDER_DETAIL: (id: number) => ["sales-orders", id],
  
  // Users
  USERS: ["users"],
  USER_DETAIL: (id: number) => ["users", id],
} as const;

// ============================================================================
// User Roles
// ============================================================================

/**
 * User roles in the system
 */
export const USER_ROLES = {
  ADMIN: "admin",
  ACCOUNTANT: "accountant",
  MANAGER: "manager",
  STAFF: "staff",
} as const;

// ============================================================================
// Order/Document Status
// ============================================================================

/**
 * Purchase Order statuses
 */
export const PO_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  CONFIRMED: "confirmed",
  PARTIALLY_RECEIVED: "partially_received",
  RECEIVED: "received",
  CANCELLED: "cancelled",
} as const;

/**
 * Vendor Bill statuses
 */
export const BILL_STATUS = {
  DRAFT: "draft",
  POSTED: "posted",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

/**
 * Sales Order statuses
 */
export const SALES_ORDER_STATUS = {
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  DELIVERED: "delivered",
  INVOICED: "invoiced",
  CANCELLED: "cancelled",
} as const;

// ============================================================================
// Type Exports for TypeScript
// ============================================================================

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
export type ValidationErrorCode = (typeof VALIDATION_ERROR_CODES)[keyof typeof VALIDATION_ERROR_CODES];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type POStatus = (typeof PO_STATUS)[keyof typeof PO_STATUS];
export type BillStatus = (typeof BILL_STATUS)[keyof typeof BILL_STATUS];
export type SalesOrderStatus = (typeof SALES_ORDER_STATUS)[keyof typeof SALES_ORDER_STATUS];
