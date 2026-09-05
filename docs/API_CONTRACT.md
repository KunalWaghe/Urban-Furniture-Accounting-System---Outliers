# Shared API Contract — Urban Furniture Accounting System

This document is the authoritative boundary between Frontend and Backend. Lock examples before implementation. Any breaking change requires both owners to acknowledge it here.

## Contract Rules

- **Base path:** `/api/v1`
- **JSON field naming:** `snake_case` (FastAPI / Pydantic default)
- **Timestamps:** ISO 8601 UTC (e.g. `2026-09-05T10:30:00Z`)
- **Currency amounts:** Numeric formatted to 2 decimals (e.g. `5000.00`)
- **Standard Error Envelope:** Always returned for all 4xx and 5xx errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "fields": {
      "login_id": "Login Id must be between 6 and 12 characters long"
    },
    "request_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
```

### Standard Error Codes

| HTTP Status | Error Code | Description / Trigger |
|---|---|---|
| 400 / 422 | `VALIDATION_ERROR` | Schema or field validation failure (`fields` map contains field errors) |
| 401 | `INVALID_CREDENTIALS` | Invalid Login Id or Password (message: `"Invalid Login Id or Password"`) |
| 401 | `USER_INACTIVE` | User account has been deactivated |
| 401 | `NOT_AUTHENTICATED` | Missing or invalid Bearer token |
| 403 | `FORBIDDEN` | Insufficient role permissions or accessing another contact's records |
| 404 | `NOT_FOUND` | Entity (Contact, Product, Order, Bill, etc.) does not exist |
| 409 | `LOGIN_ID_ALREADY_EXISTS` | Registration with an already registered `login_id` |
| 409 | `EMAIL_ALREADY_EXISTS` | Registration with an already registered `email` |
| 409 | `CONFLICT` | Invalid business state transition (e.g. confirming already confirmed order) |
| 422 | `JOURNAL_UNBALANCED` | Journal Entry debits do not equal credits |
| 422 | `PAYMENT_EXCEEDS_AMOUNT` | Payment amount exceeds remaining unpaid balance |
| 500 | `INTERNAL_ERROR` | Unhandled server error (details hidden from client; `request_id` logged) |

---

## Endpoint Inventory

| Priority | Method & Path | Purpose | Auth / Role | Status |
|---|---|---|---|---|
| **P0** | `POST /api/v1/auth/register` | User signup; creates Accountant (`invoicing_user`) | Public | **Implemented & Verified** |
| **P0** | `POST /api/v1/auth/login` | User login by `login_id` or `email` (returns JWT + user profile) | Public | **Implemented & Verified** |
| **P0** | `GET /api/v1/auth/me` | Current logged-in user profile | Bearer Token | **Implemented & Verified** |
| **P0** | `POST /api/v1/users` | Admin creates a user and selects role (`admin`, `invoicing_user`, `contact`) | Admin | **Contract Locked** |
| **P1** | `POST /api/v1/auth/forgot-password` | Request password reset for Login ID / email | Public | **Contract Locked (Delivery TBD)** |
| **P0** | `GET /api/v1/contacts` | List contacts with filters (`type`, `search`, `is_active`) | Any internal | **Implemented & Verified** |
| **P0** | `POST /api/v1/contacts` | Create contact (`customer`, `vendor`, `both`) | Admin / Invoicing | **Implemented & Verified** |
| **P0** | `GET /api/v1/contacts/:id` | Get contact details | Any internal | **Implemented & Verified** |
| **P0** | `PUT /api/v1/contacts/:id` | Update contact details | Admin / Invoicing | **Implemented & Verified** |
| **P0** | `DELETE /api/v1/contacts/:id` | Soft delete contact (sets `is_active=false`) | Admin / Invoicing | **Implemented & Verified** |
| **P0** | `GET /api/v1/products` | List products with filters (`search`, `is_active`) | Any internal | **Implemented & Verified** |
| **P0** | `POST /api/v1/products` | Create product (`goods`, `service`, price, cost, tax %) | Admin / Invoicing | **Implemented & Verified** |
| **P0** | `GET /api/v1/products/:id` | Get product details | Any internal | **Implemented & Verified** |
| **P0** | `PUT /api/v1/products/:id` | Update product details | Admin / Invoicing | **Implemented & Verified** |
| **P0** | `DELETE /api/v1/products/:id` | Soft delete product (sets `is_active=false`) | Admin / Invoicing | **Implemented & Verified** |
| **P0** | `GET /api/v1/accounts` | Chart of Accounts with filters (`type`, `search`, `is_active`) | Any internal | **Implemented & Verified** |
| **P0** | `GET /api/v1/journals` | List journals (`sale`, `purchase`, `bank`, `cash`) | Any internal | **Implemented & Verified** |
| **P1** | `GET /api/v1/analytic-accounts` | List Income/Expense analytic tags for order lines | Admin / Invoicing | **Backend Implemented; FE alignment pending** |
| **P0** | `POST /api/v1/purchase-orders` | Create Purchase Order (in `draft`) | Admin / Invoicing | **Contract Locked** |
| **P0** | `GET /api/v1/purchase-orders` | List Purchase Orders | Any internal | **Contract Locked** |
| **P0** | `GET /api/v1/purchase-orders/:id` | Purchase Order detail | Any internal | **Contract Locked** |
| **P0** | `PATCH /api/v1/purchase-orders/:id` | Replace a draft Purchase Order before confirmation | Admin / Invoicing | **Contract Locked** |
| **P0** | `PATCH /api/v1/purchase-orders/:id/confirm` | Confirm PO (`draft` -> `confirmed`) | Admin / Invoicing | **Contract Locked** |
| **P0** | `POST /api/v1/purchase-orders/:id/create-bill` | Convert PO to Vendor Bill + auto Journal Entry | Admin / Invoicing | **Contract Locked** |
| **P0** | `GET /api/v1/vendor-bills/:id` | Vendor Bill detail | Any internal | **Contract Locked** |
| **P0** | `POST /api/v1/sales-orders` | Create Sales Order (in `draft`) | Admin / Invoicing | **Contract Locked** |
| **P0** | `GET /api/v1/sales-orders` | List Sales Orders | Any internal | **Contract Locked** |
| **P0** | `GET /api/v1/sales-orders/:id` | Sales Order detail | Any internal | **Contract Locked** |
| **P0** | `PATCH /api/v1/sales-orders/:id/confirm` | Confirm SO (`draft` -> `confirmed`) | Admin / Invoicing | **Contract Locked** |
| **P0** | `POST /api/v1/sales-orders/:id/create-invoice` | Generate Customer Invoice + auto Journal Entry | Admin / Invoicing | **Contract Locked** |
| **P0** | `GET /api/v1/customer-invoices/:id` | Customer Invoice detail | Any internal | **Contract Locked** |
| **P0** | `POST /api/v1/payments` | Record Payment (Bank/Cash) + auto Journal Entry | Admin / Invoicing | **Contract Locked** |
| **P0** | `GET /api/v1/journal-entries` | List Journal Entries (debit/credit lines) | Admin / Invoicing | **Contract Locked** |
| **P0** | `POST /api/v1/journal-entries` | Create manual balanced Journal Entry | Admin / Invoicing | **Contract Locked** |
| **P0** | `GET /api/v1/reports/balance-sheet` | Real-time Balance Sheet | Admin / Invoicing | **Contract Locked** |
| **P0** | `GET /api/v1/reports/profit-loss` | Real-time Profit & Loss statement | Admin / Invoicing | **Implemented; runtime verification pending** |
| **P1** | `GET /api/v1/reports/budget` | Budget vs Actual performance | Admin / Invoicing | **Backend Implemented; FE alignment pending** |
| **P1** | `POST /api/v1/budgets` | Create Budget linked to Analytic Account | Admin / Invoicing | **Backend Implemented; FE alignment pending** |
| **P1** | `PATCH /api/v1/budgets/:id/confirm` | Confirm a draft Budget | Admin / Invoicing | **Backend Implemented** |
| **P1** | `POST /api/v1/budgets/:id/revise` | Revise a confirmed Budget | Admin / Invoicing | **Backend Implemented** |
| **P1** | `PATCH /api/v1/budgets/:id/cancel` | Cancel a draft Budget | Admin / Invoicing | **Backend Implemented; FE method mismatch** |
| **P1** | `GET /api/v1/self-service/my-invoices` | Contact-scoped invoice list | Authenticated contact | **Backend Implemented; FE path mismatch** |
| **P1** | `POST /api/v1/self-service/my-invoices/:id/pay` | Contact-scoped invoice payment | Authenticated contact | **Backend Implemented; FE path mismatch** |

---

## Detailed Specifications

### 1. Auth

#### Identity and Role Rules

- `login_id` is the primary credential used for login; `email` is a separate unique contact and recovery field.
- `login_id` is case-insensitive, 6–12 characters long.
- `email` is case-insensitive and strictly validated.
- Passwords must be greater than 8 characters, containing at least one uppercase letter, one lowercase letter, and one special character.
- Canonical API role values are:
  - `admin` (UI label: **Admin**)
  - `invoicing_user` (UI label: **Accountant**)
  - `contact` (UI label: **User**)
- Aliases accepted during user registration/creation: `administrator` -> `admin`, `accountant` -> `invoicing_user`, `user` -> `contact`.
- Public signup defaults to role `invoicing_user` (Accountant).
- Admin-created users (`POST /api/v1/users`) may assign any role; the `contact` role requires a linked `contact_id` and is restricted to portal endpoints.
- Inactive users (`is_active = false`) cannot authenticate (`401 USER_INACTIVE`).

#### `POST /api/v1/auth/register`

Register a new user account (public signup).

```json
// Request
{
  "login_id": "riya001",
  "email": "riya@urbanfurniture.com",
  "password": "SecureP@ssword123!",
  "name": "Riya Sharma",
  "role": "invoicing_user"
}

// Response 201 Created
{
  "id": 1,
  "login_id": "riya001",
  "email": "riya@urbanfurniture.com",
  "name": "Riya Sharma",
  "role": "invoicing_user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

*Errors:*
- `409` with code `LOGIN_ID_ALREADY_EXISTS` if `login_id` is taken.
- `409` with code `EMAIL_ALREADY_EXISTS` if `email` is taken.
- `422` with code `VALIDATION_ERROR` if fields violate validation constraints.

#### `POST /api/v1/auth/login`

Authenticate user credentials by Login ID or Email.

```json
// Request
{
  "login_id": "riya001",
  "password": "SecureP@ssword123!"
}

// Response 200 OK
{
  "id": 1,
  "login_id": "riya001",
  "email": "riya@urbanfurniture.com",
  "name": "Riya Sharma",
  "role": "invoicing_user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

*Errors:*
- `401` with code `INVALID_CREDENTIALS` and message `"Invalid Login Id or Password"`.
- `401` with code `USER_INACTIVE` if account is deactivated.

#### `GET /api/v1/auth/me`

Fetch profile of currently authenticated user.

```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
// Response 200 OK
{
  "id": 1,
  "login_id": "riya001",
  "email": "riya@urbanfurniture.com",
  "name": "Riya Sharma",
  "role": "invoicing_user",
  "contact_id": null,
  "is_active": true
}
```

#### `POST /api/v1/users`

Admin endpoint to create system users, accountants, or portal users linked to a contact.

```json
// Request (Admin Only)
{
  "login_id": "nimesh_portal",
  "email": "nimesh@gmail.com",
  "password": "SecureP@ssword123!",
  "name": "Nimesh Pathak",
  "role": "contact",
  "contact_id": 2
}

// Response 201 Created
{
  "id": 2,
  "login_id": "nimesh_portal",
  "email": "nimesh@gmail.com",
  "name": "Nimesh Pathak",
  "role": "contact",
  "contact_id": 2,
  "is_active": true
}
```

#### `POST /api/v1/auth/forgot-password`

Request a password reset link or recovery dispatch.

```json
// Request
{
  "login_id": "riya001"
}

// Response 200 OK
{
  "message": "If the account exists, password reset instructions have been dispatched."
}
```

---

### 2. Contacts & Products

#### `POST /api/v1/contacts`

Create a new contact (Customer, Vendor, or Both).

```json
// Request
{
  "name": "Azure Furniture",
  "type": "vendor",
  "email": "azure@furniture.com",
  "mobile": "9876543210",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}

// Response 201 Created
{
  "id": 1,
  "name": "Azure Furniture",
  "type": "vendor",
  "email": "azure@furniture.com",
  "mobile": "9876543210",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "is_active": true
}
```

#### `GET /api/v1/contacts`

List contacts with optional query filters:
- `type`: `customer` | `vendor` | `both`
- `search`: filters across name, email, city
- `is_active`: `true` | `false`

```json
// Response 200 OK
{
  "data": [
    {
      "id": 1,
      "name": "Azure Furniture",
      "type": "vendor",
      "email": "azure@furniture.com",
      "mobile": "9876543210",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "is_active": true
    }
  ],
  "total": 1
}
```

#### `GET /api/v1/contacts/:id`
Returns single `ContactResponse` (same shape as item above).

#### `PUT /api/v1/contacts/:id`
Accepts partial or complete contact update; returns updated `ContactResponse`.

#### `DELETE /api/v1/contacts/:id`
Soft-deletes the contact by setting `is_active = false`. Returns `204 No Content`.

---

#### `POST /api/v1/products`

Create a product or service catalog item.

```json
// Request
{
  "name": "Wooden Chair",
  "product_type": "goods",
  "category": "Furniture",
  "price": 500.00,
  "cost": 350.00,
  "tax_percent": 18.0,
  "image_url": "data:image/jpeg;base64,...",
  "description": "Solid teak wood dining chair"
}

// Response 201 Created
{
  "id": 1,
  "name": "Wooden Chair",
  "product_type": "goods",
  "category": "Furniture",
  "price": 500.00,
  "cost": 350.00,
  "tax_percent": 18.0,
  "image_url": "data:image/jpeg;base64,...",
  "description": "Solid teak wood dining chair",
  "is_active": true
}
```

#### `GET /api/v1/products`

List products with optional query filters:
- `search`: filters across name or description
- `is_active`: `true` | `false`

```json
// Response 200 OK
{
  "data": [
    {
      "id": 1,
      "name": "Wooden Chair",
      "product_type": "goods",
      "category": "Furniture",
      "price": 500.00,
      "cost": 350.00,
      "tax_percent": 18.0,
      "image_url": "data:image/jpeg;base64,...",
      "description": "Solid teak wood dining chair",
      "is_active": true
    }
  ],
  "total": 1
}
```

#### `GET /api/v1/products/:id`
Returns single `ProductResponse`.

#### `PUT /api/v1/products/:id`
Accepts partial or complete product update; returns updated `ProductResponse`.

#### `DELETE /api/v1/products/:id`
Soft-deletes the product by setting `is_active = false`. Returns `204 No Content`.

---

### 3. Financial Reports

#### `GET /api/v1/reports/balance-sheet`

Returns balances from posted journal entries through the selected date. If
`as_of_date` is omitted, the current date is used.

Example: `/api/v1/reports/balance-sheet?as_of_date=2026-09-05`

The response includes Assets, Liabilities, Capital, current-period net income,
totals, and an equation check for `Assets = Liabilities + Capital + Net Income`.

---

### 3. Chart of Accounts & Journals

The system auto-seeds standard accounting master data on startup to guarantee double-entry transaction compliance.

#### `GET /api/v1/accounts`

Retrieve Chart of Accounts.
- Query filters: `type` (`asset`, `liability`, `capital`, `income`, `expense`), `search`, `is_active`.

```json
// Response 200 OK
{
  "data": [
    {
      "id": 1,
      "code": "1010",
      "name": "Cash",
      "type": "asset",
      "description": "Main Cash balance",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 2,
      "code": "1020",
      "name": "Bank Account",
      "type": "asset",
      "description": "Primary Bank account",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 3,
      "code": "1030",
      "name": "Accounts Receivable (Debtors)",
      "type": "asset",
      "description": "Trade Debtors",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 4,
      "code": "2010",
      "name": "Accounts Payable (Creditors)",
      "type": "liability",
      "description": "Trade Creditors",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 5,
      "code": "2020",
      "name": "Tax Payable",
      "type": "liability",
      "description": "Output tax / GST payable",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 6,
      "code": "3010",
      "name": "Owner Capital",
      "type": "capital",
      "description": "Owner Equity & Capital",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 7,
      "code": "4010",
      "name": "Sales Income",
      "type": "income",
      "description": "Revenue from furniture sales",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 8,
      "code": "5010",
      "name": "Purchase Expense",
      "type": "expense",
      "description": "Cost of goods purchased",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    }
  ],
  "total": 8
}
```

#### `GET /api/v1/journals`

Retrieve Journals.
- Query filters: `type` (`sale`, `purchase`, `bank`, `cash`), `is_active`.

```json
// Response 200 OK
{
  "data": [
    {
      "id": 1,
      "code": "SLS",
      "name": "Sales Journal",
      "type": "sale",
      "default_account_id": 7,
      "default_account_name": "Sales Income",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 2,
      "code": "PUR",
      "name": "Purchase Journal",
      "type": "purchase",
      "default_account_id": 8,
      "default_account_name": "Purchase Expense",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 3,
      "code": "BNK",
      "name": "Bank Journal",
      "type": "bank",
      "default_account_id": 2,
      "default_account_name": "Bank Account",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    },
    {
      "id": 4,
      "code": "CSH",
      "name": "Cash Journal",
      "type": "cash",
      "default_account_id": 1,
      "default_account_name": "Cash",
      "is_active": true,
      "created_at": "2026-09-05T07:55:00Z",
      "updated_at": "2026-09-05T07:55:00Z"
    }
  ],
  "total": 4
}
```

#### `GET /api/v1/analytic-accounts`

Retrieve Income/Expense analytic tags used for budget tracking.
- Query filters: `type` (`income`, `expense`), `is_active`.

```json
// Response 200 OK
{
  "data": [
    {
      "id": 1,
      "name": "Raw Timber & Joinery",
      "type": "expense",
      "description": "Wood materials and processing expenses",
      "is_active": true
    },
    {
      "id": 2,
      "name": "Showroom Furniture Sales",
      "type": "income",
      "description": "Retail furniture showroom revenue",
      "is_active": true
    }
  ],
  "total": 2
}
```

---

### 4. Purchase Flow

#### `POST /api/v1/purchase-orders`

Create a Purchase Order in `draft` status.
- Lines require `product_id`, `account_id` (pointing to an Expense account such as Purchase Expense `5010`), optional `analytic_account_id` (Expense analytic tag), `quantity`, and `unit_price`.

```json
// Request
{
  "vendor_id": 1,
  "order_date": "2026-09-05",
  "lines": [
    {
      "product_id": 1,
      "account_id": 8,
      "analytic_account_id": 1,
      "quantity": 10,
      "unit_price": 500.00
    }
  ]
}

// Response 201 Created
{
  "id": 1,
  "po_number": "PO-0001",
  "vendor_id": 1,
  "vendor_name": "Azure Furniture",
  "status": "draft",
  "total": 5000.00,
  "lines": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Wooden Chair",
      "account_id": 8,
      "analytic_account_id": 1,
      "quantity": 10,
      "unit_price": 500.00,
      "subtotal": 5000.00
    }
  ]
}
```

#### `PATCH /api/v1/purchase-orders/:id`

Replace the vendor, order date, and line items on a draft Purchase Order. Confirmed, billed, and cancelled orders cannot be edited.

The request body uses the same shape as `POST /api/v1/purchase-orders`; the response is the updated `POResponse`.

#### `PATCH /api/v1/purchase-orders/:id/confirm`

Confirm a draft Purchase Order (`status` -> `confirmed`).

```json
// Response 200 OK
{
  "id": 1,
  "po_number": "PO-0001",
  "status": "confirmed"
}
```

#### `POST /api/v1/purchase-orders/:id/create-bill`

Convert a confirmed Purchase Order into a Vendor Bill and post the balanced Journal Entry.

```json
// Response 201 Created
{
  "bill": {
    "id": 1,
    "bill_number": "BILL-0001",
    "po_id": 1,
    "vendor_id": 1,
    "bill_date": "2026-09-05",
    "total": 5000.00,
    "amount_paid": 0.00,
    "status": "open"
  },
  "journal_entry": {
    "id": 1,
    "entry_number": "JE-0001",
    "journal_code": "PUR",
    "journal_name": "Purchase Journal",
    "date": "2026-09-05",
    "items": [
      { "account_id": 8, "account_name": "Purchase Expense", "debit": 5000.00, "credit": 0.00 },
      { "account_id": 4, "account_name": "Accounts Payable (Creditors)", "debit": 0.00, "credit": 5000.00 }
    ]
  }
}
```

#### `GET /api/v1/vendor-bills/:id`

Retrieve Vendor Bill details and payment status.

---

### 5. Sales Flow

#### `POST /api/v1/sales-orders`

Create a Sales Order in `draft` status.
- Lines require `product_id`, `account_id` (pointing to an Income account such as Sales Income `4010`), optional `analytic_account_id` (Income analytic tag), `quantity`, `unit_price`, and `tax_percent`.

```json
// Request
{
  "customer_id": 2,
  "order_date": "2026-09-05",
  "lines": [
    {
      "product_id": 1,
      "account_id": 7,
      "analytic_account_id": 2,
      "quantity": 5,
      "unit_price": 1200.00,
      "tax_percent": 18.0
    }
  ]
}

// Response 201 Created
{
  "id": 1,
  "so_number": "SO-0001",
  "customer_id": 2,
  "customer_name": "Nimesh Pathak",
  "status": "draft",
  "subtotal": 6000.00,
  "tax_amount": 1080.00,
  "total": 7080.00,
  "lines": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Wooden Chair",
      "account_id": 7,
      "analytic_account_id": 2,
      "quantity": 5,
      "unit_price": 1200.00,
      "tax_percent": 18.0,
      "subtotal": 6000.00,
      "tax_amount": 1080.00,
      "line_total": 7080.00
    }
  ]
}
```

#### `PATCH /api/v1/sales-orders/:id/confirm`

Confirm a draft Sales Order (`status` -> `confirmed`).

```json
// Response 200 OK
{
  "id": 1,
  "so_number": "SO-0001",
  "status": "confirmed"
}
```

#### `POST /api/v1/sales-orders/:id/create-invoice`

Generate a Customer Invoice from a confirmed Sales Order and post the balanced Journal Entry.

```json
// Response 201 Created
{
  "invoice": {
    "id": 1,
    "invoice_number": "INV-0001",
    "so_id": 1,
    "customer_id": 2,
    "invoice_date": "2026-09-05",
    "subtotal": 6000.00,
    "tax_amount": 1080.00,
    "total": 7080.00,
    "amount_paid": 0.00,
    "status": "open"
  },
  "journal_entry": {
    "id": 2,
    "entry_number": "JE-0002",
    "journal_code": "SLS",
    "journal_name": "Sales Journal",
    "date": "2026-09-05",
    "items": [
      { "account_id": 3, "account_name": "Accounts Receivable (Debtors)", "debit": 7080.00, "credit": 0.00 },
      { "account_id": 7, "account_name": "Sales Income", "debit": 0.00, "credit": 6000.00 },
      { "account_id": 5, "account_name": "Tax Payable", "debit": 0.00, "credit": 1080.00 }
    ]
  }
}
```

#### `GET /api/v1/customer-invoices/:id`

Retrieve Customer Invoice details, line items, and payment progress.

---

### 6. Payments

Payments record bank or cash settlement against a Vendor Bill (`outbound`) or a Customer Invoice (`inbound`) and post the balancing journal entry.

#### `POST /api/v1/payments` (Outbound: Vendor Bill)

```json
// Request
{
  "payment_type": "outbound",
  "journal_id": 3,
  "vendor_bill_id": 1,
  "amount": 5000.00,
  "payment_date": "2026-09-05"
}

// Response 201 Created
{
  "payment": {
    "id": 1,
    "payment_ref": "PAY-0001",
    "payment_type": "outbound",
    "amount": 5000.00,
    "status": "completed"
  },
  "journal_entry": {
    "id": 3,
    "entry_number": "JE-0003",
    "journal_code": "BNK",
    "journal_name": "Bank Journal",
    "date": "2026-09-05",
    "items": [
      { "account_id": 4, "account_name": "Accounts Payable (Creditors)", "debit": 5000.00, "credit": 0.00 },
      { "account_id": 2, "account_name": "Bank Account", "debit": 0.00, "credit": 5000.00 }
    ]
  }
}
```

#### `POST /api/v1/payments` (Inbound: Customer Invoice)

```json
// Request
{
  "payment_type": "inbound",
  "journal_id": 3,
  "customer_invoice_id": 1,
  "amount": 7080.00,
  "payment_date": "2026-09-05"
}

// Response 201 Created
{
  "payment": {
    "id": 2,
    "payment_ref": "PAY-0002",
    "payment_type": "inbound",
    "amount": 7080.00,
    "status": "completed"
  },
  "journal_entry": {
    "id": 4,
    "entry_number": "JE-0004",
    "journal_code": "BNK",
    "journal_name": "Bank Journal",
    "date": "2026-09-05",
    "items": [
      { "account_id": 2, "account_name": "Bank Account", "debit": 7080.00, "credit": 0.00 },
      { "account_id": 3, "account_name": "Accounts Receivable (Debtors)", "debit": 0.00, "credit": 7080.00 }
    ]
  }
}
```

---

### 7. Journal Entries

Journal entries represent double-entry general ledger transactions. Debits must equal credits.

#### `GET /api/v1/journal-entries`

Retrieve journal entries with their debit and credit line breakdowns.

```json
// Response 200 OK
{
  "data": [
    {
      "id": 1,
      "entry_number": "JE-0001",
      "journal_code": "PUR",
      "journal_name": "Purchase Journal",
      "date": "2026-09-05",
      "total_amount": 5000.00,
      "items": [
        { "account_id": 8, "account_name": "Purchase Expense", "debit": 5000.00, "credit": 0.00 },
        { "account_id": 4, "account_name": "Accounts Payable (Creditors)", "debit": 0.00, "credit": 5000.00 }
      ]
    }
  ],
  "total": 1
}
```

#### `POST /api/v1/journal-entries`

Create a manual journal entry (Admin / Accountant). Rejected with `422 JOURNAL_UNBALANCED` if total debits do not equal total credits.

---

### 8. Financial Reports

Real-time aggregated accounting statements computed from posted journal entries.

#### `GET /api/v1/reports/balance-sheet`

Real-time statement of financial position.

```json
// Response 200 OK
{
  "as_of_date": "2026-09-05",
  "assets": {
    "items": [
      { "account_code": "1010", "account_name": "Cash", "balance": 7080.00 },
      { "account_code": "1020", "account_name": "Bank Account", "balance": 50000.00 }
    ],
    "total": 57080.00
  },
  "liabilities": {
    "items": [
      { "account_code": "2010", "account_name": "Accounts Payable (Creditors)", "balance": 0.00 },
      { "account_code": "2020", "account_name": "Tax Payable", "balance": 1080.00 }
    ],
    "total": 1080.00
  },
  "capital": {
    "items": [
      { "account_code": "3010", "account_name": "Owner Capital", "balance": 55000.00 },
      { "account_code": "RETAINED", "account_name": "Retained Earnings (Net Profit)", "balance": 1000.00 }
    ],
    "total": 56000.00
  },
  "total_assets": 57080.00,
  "total_liabilities_and_capital": 57080.00,
  "is_balanced": true
}
```

#### `GET /api/v1/reports/profit-loss`

Real-time Profit & Loss statement for a given date period.
- Query parameters: `period_start` (YYYY-MM-DD), `period_end` (YYYY-MM-DD).

```json
// Response 200 OK
{
  "period_start": "2026-09-01",
  "period_end": "2026-09-05",
  "income": {
    "items": [
      { "account_code": "4010", "account_name": "Sales Income", "amount": 6000.00 }
    ],
    "total": 6000.00
  },
  "expenses": {
    "items": [
      { "account_code": "5010", "account_name": "Purchase Expense", "amount": 5000.00 }
    ],
    "total": 5000.00
  },
  "net_profit": 1000.00
}
```

#### `GET /api/v1/reports/budget`

Comparison of committed/actual expenses and income against budgeted allocations per analytic account.

---

### 9. Budgets & Customer Portal

#### `POST /api/v1/budgets`

Create a budget plan associated with an Analytic Account and timeframe (Admin only).

#### `GET /api/v1/self-service/my-invoices`

Self-service invoice ledger strictly filtered by the authenticated user's `contact_id`. Internal accounts cannot be accessed via portal endpoints.
