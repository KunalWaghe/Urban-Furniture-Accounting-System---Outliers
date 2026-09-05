# Authentication API Documentation

This document describes the authentication endpoints available in the Urban Furniture Accounting System.

## Base URL
All authentication endpoints are prefixed with: `/api/v1/auth`

---

## Endpoints

### 1. **Register (Public Signup)** ✅
**Endpoint:** `POST /api/v1/auth/register`

**Description:** Create a new user account. Public registration creates users with `contact` role by default. Admin role registration is forbidden for security.

**Request Body:**
```json
{
  "login_id": "user123",
  "email": "user@example.com",
  "password": "SecurePass@123",
  "name": "John Doe",
  "role": "contact",
  "contact_id": null
}
```

**Validation Rules:**
- `login_id`: 6-12 characters, alphanumeric only
- `email`: Valid email format
- `password`: More than 8 characters, at least 1 uppercase, 1 lowercase, 1 special character
- `role`: Defaults to "contact", admin role not allowed

**Response:** `201 Created`
```json
{
  "id": 1,
  "login_id": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "contact",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. **Login** ✅
**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authenticate user credentials by Login ID or Email.

**Request Body:**
```json
{
  "login_id": "user123",
  "password": "SecurePass@123"
}
```

**Note:** The `login_id` field accepts either the Login ID or Email address.

**Response:** `200 OK`
```json
{
  "id": 1,
  "login_id": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "contact",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. **Get Current User Profile**
**Endpoint:** `GET /api/v1/auth/me`

**Description:** Get the profile of the currently authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "login_id": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "contact",
  "contact_id": null,
  "is_active": true
}
```

---

### 4. **Logout**
**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Log out the current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

**Note:** Currently relies on frontend clearing the stored token. For production, implement server-side token denylist.

---

### 5. **Forgot Password** ✅ NEW
**Endpoint:** `POST /api/v1/auth/forgot-password`

**Description:** Initiate password reset process. Generates a reset token valid for 1 hour.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If the email exists in our system, a password reset link has been sent.",
  "email": "user@example.com"
}
```

**Security Note:** 
- Always returns success to prevent email enumeration attacks
- Token is valid for 1 hour
- In production, should send email with reset link
- For demo purposes, token is logged to console: `[DEBUG] Password reset token for user@example.com: <token>`

---

### 6. **Reset Password** ✅ NEW
**Endpoint:** `POST /api/v1/auth/reset-password`

**Description:** Reset user password using a valid reset token from forgot-password endpoint.

**Request Body:**
```json
{
  "token": "abc123xyz789_reset_token_from_email",
  "new_password": "NewSecurePass@456"
}
```

**Validation Rules:**
- `new_password`: More than 8 characters, at least 1 uppercase, 1 lowercase, 1 special character
- `token`: Must be valid and not expired (1 hour limit)

**Response:** `200 OK`
```json
{
  "message": "Password has been successfully reset. You can now login with your new password."
}
```

**Error Response:** `400 Bad Request` (if token is invalid/expired)
```json
{
  "error": "ValidationException",
  "message": "Invalid or expired reset token",
  "code": null
}
```

---

## Admin User Management

### Create User (Admin Only) ✅
**Endpoint:** `POST /api/v1/users`

**Description:** Create a new internal user account. Only accessible to admin users. Allows creating accounts with any role including admin.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "login_id": "admin001",
  "email": "admin@example.com",
  "password": "AdminPass@123",
  "name": "Admin User",
  "role": "admin",
  "contact_id": null
}
```

**Valid Roles:**
- `admin`: Full system access
- `invoicing_user` / `accountant`: Standard accountant user
- `contact` / `user`: Portal user

**Response:** `201 Created`
```json
{
  "id": 2,
  "login_id": "admin001",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "contact_id": null,
  "is_active": true
}
```

---

### List All Users (Admin Only)
**Endpoint:** `GET /api/v1/users`

**Description:** List all system users. Only accessible to admin users.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "login_id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "contact",
    "contact_id": null,
    "is_active": true
  },
  {
    "id": 2,
    "login_id": "admin001",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "contact_id": null,
    "is_active": true
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "ValidationException",
  "message": "Password must have more than 8 characters",
  "code": null
}
```

### 401 Unauthorized
```json
{
  "error": "UnauthorizedException",
  "message": "Invalid Login Id or Password",
  "code": "INVALID_CREDENTIALS"
}
```

### 403 Forbidden
```json
{
  "error": "ForbiddenException",
  "message": "Registration with admin role is forbidden",
  "code": "ROLE_NOT_ALLOWED"
}
```

### 409 Conflict
```json
{
  "error": "ConflictException",
  "message": "User with email 'user@example.com' already exists",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

---

## Testing Password Reset Flow

### Step 1: Request Password Reset
```bash
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Step 2: Check Console for Token
Look for output like:
```
[DEBUG] Password reset token for user@example.com: abc123xyz789_token_here
```

### Step 3: Reset Password
```bash
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123xyz789_token_here",
    "new_password": "NewPassword@123"
  }'
```

### Step 4: Login with New Password
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "user@example.com",
    "password": "NewPassword@123"
  }'
```

---

## Summary of Implementation

✅ **Login** - `/api/v1/auth/login`
✅ **Signup** - `/api/v1/auth/register`
✅ **Create User (Admin)** - `/api/v1/users` (admin-only)
✅ **Forgot Password** - `/api/v1/auth/forgot-password` (NEW)
✅ **Reset Password** - `/api/v1/auth/reset-password` (NEW)

All authentication features are now fully implemented and functional!
