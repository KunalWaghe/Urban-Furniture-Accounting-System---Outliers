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

/**
 * User-friendly error titles for different scenarios
 */
export const ERROR_TITLES = {
  // Authentication
  LOGIN_FAILED: "Unable to sign in",
  SIGNUP_FAILED: "Unable to create account",
  INVALID_CREDENTIALS: "Invalid credentials",
  ACCOUNT_INACTIVE: "Account Inactive",
  ACCESS_DENIED: "Access Denied",
  SESSION_EXPIRED: "Session Expired",

  // Authorization
  FORBIDDEN: "Access Forbidden",
  UNAUTHORIZED: "Authentication Required",

  // Validation
  VALIDATION_FAILED: "Validation Failed",
  DUPLICATE_ENTRY: "Duplicate Entry",

  // General
  CREATE_FAILED: "Unable to create",
  UPDATE_FAILED: "Unable to update",
  DELETE_FAILED: "Unable to delete",
  LOAD_FAILED: "Unable to load",
  NETWORK_ERROR: "Network Error",
  SERVER_ERROR: "Server Error",
} as const;

/**
 * Detailed error messages for specific scenarios
 */
export const DETAILED_ERROR_MESSAGES = {
  // Authentication & Authorization
  LOGIN_INVALID_CREDENTIALS: "The login ID or password you entered is incorrect. Please try again.",
  LOGIN_ACCOUNT_INACTIVE: "Your account has been deactivated. Please contact an administrator.",
  LOGIN_GENERIC_ERROR: "Something went wrong during login. Please try again.",
  SIGNUP_GENERIC_ERROR: "Something went wrong during registration. Please try again.",
  SESSION_EXPIRED_MESSAGE: "Your session has expired. Please log in again.",
  ACCESS_DENIED_ADMIN_ONLY: "Only users with the Admin role can perform this action.",
  TOKEN_INVALID: "Your authentication token is invalid. Please log in again.",

  // Validation
  VALIDATION_CHECK_FIELDS: "Please correct the highlighted fields and try again.",
  LOGIN_ID_TAKEN: "This login ID is already in use. Please choose another.",
  EMAIL_TAKEN: "An account with this email already exists.",
  EMAIL_ALREADY_EXISTS: "An account with this email address already exists.",
  LOGIN_ID_ALREADY_EXISTS: "This login ID is already taken. Please choose another.",

  // Password
  PASSWORD_WEAK: "Password must be at least 8 characters with uppercase, lowercase, and special characters.",
  PASSWORD_MISMATCH: "Passwords do not match. Please try again.",
  PASSWORD_RESET_SUCCESS: "Password has been successfully reset. You can now login with your new password.",
  PASSWORD_RESET_TOKEN_INVALID: "Invalid or expired reset token. Please request a new password reset.",
  PASSWORD_RESET_SENT: "If the email exists in our system, a password reset link has been sent.",

  // CRUD Operations
  CREATE_SUCCESS: "Created successfully.",
  UPDATE_SUCCESS: "Updated successfully.",
  DELETE_SUCCESS: "Deleted successfully.",
  CREATE_FAILED_GENERIC: "Unable to create the item. Please try again.",
  UPDATE_FAILED_GENERIC: "Unable to update the item. Please try again.",
  DELETE_FAILED_GENERIC: "Unable to delete the item. Please try again.",
  LOAD_FAILED_GENERIC: "Unable to load data. Please try again.",

  // Journal Entries
  JOURNAL_ENTRY_CREATE_FAILED: "Unable to create journal entry.",
  JOURNAL_ENTRY_INVALID_BALANCE: "Journal entry must be balanced. Total debits must equal total credits.",
  JOURNAL_ENTRY_MISSING_LINES: "Journal entry must have at least two lines.",

  // Purchase Orders
  PO_CREATE_FAILED: "Unable to create purchase order.",
  PO_UPDATE_FAILED: "Unable to update purchase order.",
  PO_STATUS_CHANGE_FAILED: "Unable to change purchase order status.",

  // Vendor Bills
  VENDOR_BILL_CREATE_FAILED: "Unable to create vendor bill.",
  VENDOR_BILL_POST_FAILED: "Unable to post vendor bill.",
  VENDOR_BILL_PAY_FAILED: "Unable to mark bill as paid.",

  // Sales Orders
  SALES_ORDER_CREATE_FAILED: "Unable to create sales order.",
  SALES_ORDER_CONFIRM_FAILED: "Unable to confirm sales order.",
  SALES_ORDER_INVOICE_FAILED: "Unable to create invoice from sales order.",

  // Network
  NETWORK_CONNECTION_ERROR: "Unable to connect to the server. Please check your internet connection.",
  NETWORK_TIMEOUT: "The request timed out. Please try again.",

  // Generic
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  OPERATION_CANCELLED: "Operation cancelled.",
} as const;

// ============================================================================
// Authentication Error Codes
// ============================================================================

/**
 * Authentication-specific error codes from the backend
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_INACTIVE: "USER_INACTIVE",
  ACCOUNT_INACTIVE: "account_inactive",
  ACCOUNT_LOCKED: "account_locked",
  TOKEN_EXPIRED: "token_expired",
  TOKEN_INVALID: "token_invalid",
  SESSION_EXPIRED: "session_expired",
  ROLE_NOT_ALLOWED: "ROLE_NOT_ALLOWED",
  LOGIN_ID_ALREADY_EXISTS: "LOGIN_ID_ALREADY_EXISTS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
} as const;

/**
 * Map backend auth error codes to user-friendly messages
 */
export const AUTH_ERROR_CODE_MESSAGES = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: "The login ID or password you entered is incorrect.",
  [AUTH_ERROR_CODES.USER_INACTIVE]: "Your account is inactive. Please contact support.",
  [AUTH_ERROR_CODES.ACCOUNT_INACTIVE]: "Your account has been deactivated. Contact an administrator.",
  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: "Your account has been locked. Please contact support.",
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: "Your session has expired. Please log in again.",
  [AUTH_ERROR_CODES.TOKEN_INVALID]: "Invalid authentication token. Please log in again.",
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: "Your session has expired. Please log in again.",
  [AUTH_ERROR_CODES.ROLE_NOT_ALLOWED]: "You don't have permission to perform this action.",
  [AUTH_ERROR_CODES.LOGIN_ID_ALREADY_EXISTS]: "This login ID is already taken.",
  [AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]: "An account with this email already exists.",
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
  INVALID_DATE: "invalid_date",
  INVALID_NUMBER: "invalid_number",
  OUT_OF_RANGE: "out_of_range",
  INVALID_PHONE: "invalid_phone",
} as const;

/**
 * User-friendly validation error messages
 */
export const FIELD_VALIDATION_MESSAGES = {
  // Required fields
  REQUIRED_FIELD: "This field is required.",
  REQUIRED_NAME: "Name is required.",
  REQUIRED_EMAIL: "Email is required.",
  REQUIRED_PASSWORD: "Password is required.",
  REQUIRED_LOGIN_ID: "Login ID is required.",
  REQUIRED_ROLE: "Role is required.",
  REQUIRED_ACCOUNT: "Account is required.",
  REQUIRED_DATE: "Date is required.",
  REQUIRED_AMOUNT: "Amount is required.",

  // Format validation
  INVALID_EMAIL_FORMAT: "Please enter a valid email address.",
  INVALID_LOGIN_ID_FORMAT: "Login ID must be 6-12 alphanumeric characters.",
  INVALID_DATE_FORMAT: "Please enter a valid date.",
  INVALID_NUMBER_FORMAT: "Please enter a valid number.",
  INVALID_PHONE_FORMAT: "Please enter a valid phone number.",

  // Length validation
  LOGIN_ID_TOO_SHORT: "Login ID must be at least 6 characters.",
  LOGIN_ID_TOO_LONG: "Login ID must not exceed 12 characters.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password must not exceed 128 characters.",
  NAME_TOO_SHORT: "Name must be at least 2 characters.",
  NAME_TOO_LONG: "Name must not exceed 255 characters.",

  // Password strength
  PASSWORD_WEAK_GENERIC: "Password is too weak.",
  PASSWORD_NEED_UPPERCASE: "Password must contain at least one uppercase letter.",
  PASSWORD_NEED_LOWERCASE: "Password must contain at least one lowercase letter.",
  PASSWORD_NEED_NUMBER: "Password must contain at least one number.",
  PASSWORD_NEED_SPECIAL: "Password must contain at least one special character.",
  PASSWORD_MUST_MATCH: "Passwords must match.",

  // Business validation
  AMOUNT_MUST_BE_POSITIVE: "Amount must be greater than zero.",
  QUANTITY_MUST_BE_POSITIVE: "Quantity must be greater than zero.",
  DUPLICATE_ENTRY: "This entry already exists.",
  INVALID_STATUS_TRANSITION: "Invalid status transition.",
  DEBIT_CREDIT_MUST_BALANCE: "Total debits must equal total credits.",

  // General
  INVALID_INPUT: "Invalid input. Please check your data.",
  CHARACTERS_ONLY: "Only letters and numbers are allowed.",
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
// Backend Error Codes
// ============================================================================

/**
 * Backend-specific error codes mapped to the API error envelope
 */
export const BACKEND_ERROR_CODES = {
  // General
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  INTERNAL_ERROR: "INTERNAL_ERROR",

  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_INACTIVE: "USER_INACTIVE",
  ROLE_NOT_ALLOWED: "ROLE_NOT_ALLOWED",
  LOGIN_ID_ALREADY_EXISTS: "LOGIN_ID_ALREADY_EXISTS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",

  // Business Logic
  INSUFFICIENT_QUANTITY: "INSUFFICIENT_QUANTITY",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
} as const;

/**
 * Map backend error codes to user-friendly messages
 */
export const BACKEND_ERROR_MESSAGES = {
  [BACKEND_ERROR_CODES.NOT_FOUND]: "The requested item was not found.",
  [BACKEND_ERROR_CODES.VALIDATION_ERROR]: "Please check your input and try again.",
  [BACKEND_ERROR_CODES.INVALID_STATUS_TRANSITION]: "Invalid status change.",
  [BACKEND_ERROR_CODES.INTERNAL_ERROR]: "An unexpected error occurred. Please try again.",
  [BACKEND_ERROR_CODES.INVALID_CREDENTIALS]: "Invalid login credentials.",
  [BACKEND_ERROR_CODES.USER_INACTIVE]: "Your account is inactive.",
  [BACKEND_ERROR_CODES.ROLE_NOT_ALLOWED]: "You don't have permission for this action.",
  [BACKEND_ERROR_CODES.LOGIN_ID_ALREADY_EXISTS]: "This login ID is already taken.",
  [BACKEND_ERROR_CODES.EMAIL_ALREADY_EXISTS]: "This email is already registered.",
  [BACKEND_ERROR_CODES.INSUFFICIENT_QUANTITY]: "Insufficient quantity available.",
  [BACKEND_ERROR_CODES.INVALID_TRANSITION]: "Invalid status transition.",
  [BACKEND_ERROR_CODES.DUPLICATE_ENTRY]: "This entry already exists.",
} as const;

// ============================================================================
// Success Messages
// ============================================================================

/**
 * Success messages for various operations
 */
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: "Successfully logged in!",
  LOGOUT_SUCCESS: "Successfully logged out.",
  SIGNUP_SUCCESS: "Account created successfully!",
  PASSWORD_RESET_REQUEST_SUCCESS: "Password reset link sent to your email.",
  PASSWORD_RESET_SUCCESS: "Password reset successfully. You can now log in.",

  // CRUD
  CREATE_SUCCESS: "Created successfully.",
  UPDATE_SUCCESS: "Updated successfully.",
  DELETE_SUCCESS: "Deleted successfully.",
  SAVE_SUCCESS: "Saved successfully.",

  // User Management
  USER_CREATED: "User created successfully.",
  USER_UPDATED: "User updated successfully.",
  USER_DELETED: "User deleted successfully.",

  // Contacts
  CONTACT_CREATED: "Contact created successfully.",
  CONTACT_UPDATED: "Contact updated successfully.",
  CONTACT_DELETED: "Contact deleted successfully.",

  // Products
  PRODUCT_CREATED: "Product created successfully.",
  PRODUCT_UPDATED: "Product updated successfully.",
  PRODUCT_DELETED: "Product deleted successfully.",

  // Purchase Orders
  PO_CREATED: "Purchase order created successfully.",
  PO_UPDATED: "Purchase order updated successfully.",
  PO_SENT: "Purchase order sent to vendor.",
  PO_CONFIRMED: "Purchase order confirmed.",
  PO_RECEIVED: "Purchase order marked as received.",
  PO_CANCELLED: "Purchase order cancelled.",

  // Vendor Bills
  VENDOR_BILL_CREATED: "Vendor bill created successfully.",
  VENDOR_BILL_POSTED: "Vendor bill posted successfully.",
  VENDOR_BILL_PAID: "Vendor bill marked as paid.",
  VENDOR_BILL_CANCELLED: "Vendor bill cancelled.",

  // Sales Orders
  SALES_ORDER_CREATED: "Sales order created successfully.",
  SALES_ORDER_CONFIRMED: "Sales order confirmed.",
  SALES_ORDER_DELIVERED: "Sales order marked as delivered.",
  SALES_ORDER_INVOICED: "Invoice created from sales order.",
  SALES_ORDER_CANCELLED: "Sales order cancelled.",

  // Journal Entries
  JOURNAL_ENTRY_CREATED: "Journal entry created successfully.",
  JOURNAL_ENTRY_POSTED: "Journal entry posted successfully.",

  // Generic
  OPERATION_SUCCESS: "Operation completed successfully.",
  CHANGES_SAVED: "Changes saved successfully.",
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
