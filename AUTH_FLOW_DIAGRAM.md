# Authentication Flow Diagrams

## 1. Registration Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /api/v1/auth/register
       │ {login_id, email, password, name}
       │
       ▼
┌─────────────────────────────────────┐
│  Validation & Security Checks       │
│  • Login ID format (6-12 chars)     │
│  • Email format                     │
│  • Password strength                │
│  • No admin role escalation         │
│  • Login ID uniqueness              │
│  • Email uniqueness                 │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │   Database   │
        │  Create User │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │  Generate    │
        │  JWT Token   │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │   Response   │
        │ {user, token}│
        └──────────────┘
```

---

## 2. Login Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /api/v1/auth/login
       │ {login_id, password}
       │
       ▼
┌─────────────────────────────────────┐
│  Authentication                     │
│  • Find user by login_id OR email   │
│  • Verify password hash             │
│  • Check if account is active       │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  Generate    │
        │  JWT Token   │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │   Response   │
        │ {user, token}│
        └──────────────┘
```

---

## 3. Admin User Creation Flow

```
┌─────────────┐
│Admin Client │
└──────┬──────┘
       │
       │ POST /api/v1/users
       │ Authorization: Bearer <admin_token>
       │ {login_id, email, password, name, role}
       │
       ▼
┌─────────────────────────────────────┐
│  Authorization Check                │
│  • Verify JWT token                 │
│  • Check if user has "admin" role   │
└──────────────┬──────────────────────┘
               │ Authorized
               ▼
┌─────────────────────────────────────┐
│  Validation & Security Checks       │
│  • Login ID format & uniqueness     │
│  • Email uniqueness                 │
│  • Password strength                │
│  • Role validation (any role OK)    │
│  • Contact ID validation (if set)   │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │   Database   │
        │  Create User │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │   Response   │
        │  {user data} │
        │  (no token)  │
        └──────────────┘
```

---

## 4. Forgot Password Flow (NEW)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /api/v1/auth/forgot-password
       │ {email}
       │
       ▼
┌─────────────────────────────────────┐
│  Lookup User                        │
│  • Find user by email               │
│  • Check if account is active       │
└──────────────┬──────────────────────┘
               │
               ├─── User Found ────────┐
               │                       │
               │                       ▼
               │            ┌─────────────────────┐
               │            │  Generate Token     │
               │            │  • 32-byte secure   │
               │            │  • Store in DB      │
               │            │  • Set 1hr expiry   │
               │            └──────────┬──────────┘
               │                       │
               │                       ▼
               │            ┌─────────────────────┐
               │            │  Send Email         │
               │            │  [Production]       │
               │            │  OR                 │
               │            │  Log to Console     │
               │            │  [Demo/Testing]     │
               │            └─────────────────────┘
               │
               ├─── User Not Found ────┤
               │                       │
               ▼                       ▼
        ┌─────────────────────────────────┐
        │  Always Return Success Message  │
        │  (Prevents email enumeration)   │
        └─────────────────────────────────┘
```

---

## 5. Reset Password Flow (NEW)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /api/v1/auth/reset-password
       │ {token, new_password}
       │
       ▼
┌─────────────────────────────────────┐
│  Validate Token                     │
│  • Find user by reset_token         │
│  • Check token exists               │
│  • Check token not expired          │
└──────────────┬──────────────────────┘
               │
               ├─── Valid ─────────────┐
               │                       │
               │                       ▼
               │            ┌─────────────────────┐
               │            │  Validate Password  │
               │            │  • Length > 8       │
               │            │  • Has uppercase    │
               │            │  • Has lowercase    │
               │            │  • Has special char │
               │            └──────────┬──────────┘
               │                       │
               │                       ▼
               │            ┌─────────────────────┐
               │            │  Update Database    │
               │            │  • Hash password    │
               │            │  • Clear token      │
               │            │  • Clear expiry     │
               │            └──────────┬──────────┘
               │                       │
               │                       ▼
               │            ┌─────────────────────┐
               │            │  Success Response   │
               │            └─────────────────────┘
               │
               ├─── Invalid/Expired ───┐
               │                       │
               ▼                       ▼
        ┌─────────────────────────────────┐
        │  Error Response                 │
        │  "Invalid or expired token"     │
        └─────────────────────────────────┘
```

---

## 6. Complete Password Reset User Journey

```
┌────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                            │
└────────────────────────────────────────────────────────────┘

Step 1: User Forgets Password
    │
    │ Clicks "Forgot Password" link
    │
    ▼
┌─────────────────────────┐
│  Enter Email Address    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  "Check your email"     │
│  message displayed      │
└──────────┬──────────────┘
           │
           │
Step 2: Check Email (Production) or Console (Demo)
    │
    │ [Production: Opens email]
    │ [Demo: Admin checks server logs]
    │
    ▼
┌─────────────────────────┐
│  Click Reset Link       │
│  (contains token)       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Reset Password Form    │
│  • Enter token          │
│  • Enter new password   │
│  • Confirm password     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  "Password reset        │
│   successful" message   │
└──────────┬──────────────┘
           │
           ▼
Step 3: Login with New Password
    │
    ▼
┌─────────────────────────┐
│  Enter credentials      │
│  • Email/Login ID       │
│  • New password         │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Logged In Successfully │
└─────────────────────────┘
```

---

## 7. Security Measures

```
┌─────────────────────────────────────────────────────┐
│              SECURITY LAYERS                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────┐
│  Password Requirements  │
│  ✓ > 8 characters       │
│  ✓ Uppercase letter     │
│  ✓ Lowercase letter     │
│  ✓ Special character    │
│  ✓ bcrypt hashing       │
└─────────────────────────┘

┌─────────────────────────┐
│  Token Security         │
│  ✓ 32-byte random       │
│  ✓ URL-safe encoding    │
│  ✓ 1-hour expiry        │
│  ✓ Single-use only      │
│  ✓ Stored hashed in DB  │
└─────────────────────────┘

┌─────────────────────────┐
│  Anti-Enumeration       │
│  ✓ Same response for    │
│    valid/invalid email  │
│  ✓ No user existence    │
│    indication           │
└─────────────────────────┘

┌─────────────────────────┐
│  Role-Based Access      │
│  ✓ JWT authentication   │
│  ✓ Admin role check     │
│  ✓ No privilege escal.  │
└─────────────────────────┘

┌─────────────────────────┐
│  Input Validation       │
│  ✓ Email format         │
│  ✓ Login ID regex       │
│  ✓ SQL injection prev.  │
│  ✓ XSS prevention       │
└─────────────────────────┘
```

---

## 8. Database Schema

```
┌─────────────────────────────────────────────────┐
│                  USERS TABLE                    │
├─────────────────────────────────────────────────┤
│  id                  INTEGER PRIMARY KEY        │
│  login_id            VARCHAR(50) UNIQUE         │
│  email               VARCHAR(255) UNIQUE        │
│  password_hash       VARCHAR(255)               │
│  name                VARCHAR(255)               │
│  role                VARCHAR(50)                │
│  contact_id          INTEGER (nullable)         │
│  is_active           BOOLEAN                    │
│  reset_token         VARCHAR(255) (nullable) ⭐ │
│  reset_token_expiry  TIMESTAMP (nullable)    ⭐ │
└─────────────────────────────────────────────────┘

⭐ = New fields added for password reset
```

---

## API Endpoint Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/auth/register` | No | Public signup |
| POST | `/api/v1/auth/login` | No | User login |
| GET | `/api/v1/auth/me` | Yes | Get profile |
| POST | `/api/v1/auth/logout` | Yes | User logout |
| POST | `/api/v1/auth/forgot-password` | No | Request reset ⭐ |
| POST | `/api/v1/auth/reset-password` | No | Reset password ⭐ |
| POST | `/api/v1/users` | Admin | Create user |
| GET | `/api/v1/users` | Admin | List users |

⭐ = New endpoints

---

*All authentication flows are now complete and secure!*
