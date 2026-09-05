# Shared API Contract — Urban Furniture Accounting System

This document is the boundary between Sourabh (Frontend) and Kunal (Backend). Lock examples before implementation. Any breaking change requires both owners to acknowledge it here.

## Contract Rules

- **Base path:** `/api/v1`
- **JSON field naming:** `snake_case` (FastAPI / Pydantic default)
- **Timestamps:** ISO 8601 UTC (e.g. `2026-09-05T10:30:00Z`)
- **Currency amounts:** Decimal as number or string formatted to 2 decimals (e.g. `5000.00`)
- **Standard Error Envelope:** Always returned for 4xx and 5xx errors.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "fields": {
      "email": "Invalid email format"
    },
    "request_id": "req_12345"
  }
}
```

---

## Endpoint Inventory

| Priority | Method & Path | Purpose | Auth / Role | Status |
|---|---|---|---|---|
| **P0** | `POST /api/v1/auth/register` | User signup | Public | Contract Locked |
| **P0** | `POST /api/v1/auth/login` | User login (returns JWT) | Public | Contract Locked |
| **P0** | `GET /api/v1/auth/me` | Current user profile | Bearer Token | Contract Locked |
| **P0** | `GET /api/v1/contacts` | List contacts (Customer/Vendor) | Any internal | Contract Locked |
| **P0** | `POST /api/v1/contacts` | Create contact | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/products` | List products | Any internal | Contract Locked |
| **P0** | `POST /api/v1/products` | Create product (with tax %) | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/accounts` | Chart of Accounts | Any internal | Contract Locked |
| **P0** | `GET /api/v1/journals` | List journals (Sales, Purchase, Bank, Cash) | Any internal | Contract Locked |
| **P0** | `POST /api/v1/purchase-orders` | Create Purchase Order | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/purchase-orders` | List Purchase Orders | Any internal | Contract Locked |
| **P0** | `GET /api/v1/purchase-orders/:id` | PO Detail | Any internal | Contract Locked |
| **P0** | `PATCH /api/v1/purchase-orders/:id/confirm` | Confirm PO | Admin / Invoicing | Contract Locked |
| **P0** | `POST /api/v1/purchase-orders/:id/create-bill` | Convert PO to Vendor Bill + Journal Entry | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/vendor-bills/:id` | Vendor Bill detail | Any internal | Contract Locked |
| **P0** | `POST /api/v1/sales-orders` | Create Sales Order | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/sales-orders` | List Sales Orders | Any internal | Contract Locked |
| **P0** | `GET /api/v1/sales-orders/:id` | SO Detail | Any internal | Contract Locked |
| **P0** | `PATCH /api/v1/sales-orders/:id/confirm` | Confirm SO | Admin / Invoicing | Contract Locked |
| **P0** | `POST /api/v1/sales-orders/:id/create-invoice` | Generate Invoice + Journal Entry | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/customer-invoices/:id` | Customer Invoice detail | Any internal | Contract Locked |
| **P0** | `POST /api/v1/payments` | Record Payment (Bank/Cash) + Journal Entry | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/journal-entries` | List Journal Entries (debit/credit) | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/reports/balance-sheet` | Real-time Balance Sheet | Admin / Invoicing | Contract Locked |
| **P0** | `GET /api/v1/reports/pnl` | Real-time Profit & Loss statement | Admin / Invoicing | Contract Locked |
| **P1** | `GET /api/v1/reports/budget` | Budget vs Actual performance | Admin / Invoicing | Contract Locked |
| **P1** | `POST /api/v1/budgets` | Create Budget | Admin | Contract Locked |
| **P1** | `GET /api/v1/portal/invoices` | Customer/Vendor self-service invoices | Contact role | Contract Locked |

---

## Detailed Specifications

### 1. Auth

#### `POST /api/v1/auth/login`
```json
// Request
{
  "email": "riya@urbanfurniture.com",
  "password": "password123"
}

// Response 200
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "riya@urbanfurniture.com",
    "name": "Riya Sharma",
    "role": "admin"
  }
}
```

---

### 2. Contacts & Products

#### `POST /api/v1/contacts`
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

// Response 201
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

#### `POST /api/v1/products`
```json
// Request
{
  "name": "Wooden Chair",
  "price": 500.00,
  "tax_percent": 18.0,
  "description": "Solid teak wood dining chair"
}

// Response 201
{
  "id": 1,
  "name": "Wooden Chair",
  "price": 500.00,
  "tax_percent": 18.0,
  "description": "Solid teak wood dining chair",
  "is_active": true
}
```

---

### 3. Purchase Flow

#### `POST /api/v1/purchase-orders`
```json
// Request
{
  "vendor_id": 1,
  "order_date": "2026-09-05",
  "lines": [
    { "product_id": 1, "quantity": 10, "unit_price": 500.00 }
  ]
}

// Response 201
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
      "quantity": 10,
      "unit_price": 500.00,
      "subtotal": 5000.00
    }
  ]
}
```

#### `POST /api/v1/purchase-orders/:id/create-bill`
```json
// Response 201
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
    "journal_name": "Purchase Journal",
    "date": "2026-09-05",
    "items": [
      { "account_name": "Purchase Expense", "debit": 5000.00, "credit": 0.00 },
      { "account_name": "Accounts Payable (Creditors)", "debit": 0.00, "credit": 5000.00 }
    ]
  }
}
```

---

### 4. Sales Flow

#### `POST /api/v1/sales-orders`
```json
// Request
{
  "customer_id": 2,
  "order_date": "2026-09-05",
  "lines": [
    { "product_id": 2, "quantity": 5, "unit_price": 1200.00, "tax_percent": 18.0 }
  ]
}

// Response 201
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
      "product_id": 2,
      "product_name": "Office Chair",
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

#### `POST /api/v1/sales-orders/:id/create-invoice`
```json
// Response 201
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
    "journal_name": "Sales Journal",
    "date": "2026-09-05",
    "items": [
      { "account_name": "Accounts Receivable (Debtors)", "debit": 7080.00, "credit": 0.00 },
      { "account_name": "Sales Income", "debit": 0.00, "credit": 6000.00 },
      { "account_name": "Tax Payable", "debit": 0.00, "credit": 1080.00 }
    ]
  }
}
```

---

### 5. Payments

#### `POST /api/v1/payments`
```json
// Request (Vendor Bill Payment via Bank)
{
  "payment_type": "outbound",
  "journal_id": 3,
  "vendor_bill_id": 1,
  "amount": 5000.00,
  "payment_date": "2026-09-05"
}

// Response 201
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
    "journal_name": "Bank Journal",
    "items": [
      { "account_name": "Accounts Payable (Creditors)", "debit": 5000.00, "credit": 0.00 },
      { "account_name": "Bank Account", "debit": 0.00, "credit": 5000.00 }
    ]
  }
}
```

---

### 6. Reports

#### `GET /api/v1/reports/balance-sheet`
```json
// Response 200
{
  "as_of_date": "2026-09-05",
  "assets": {
    "items": [
      { "account_name": "Cash", "balance": 7080.00 },
      { "account_name": "Bank", "balance": 50000.00 }
    ],
    "total": 57080.00
  },
  "liabilities": {
    "items": [
      { "account_name": "Accounts Payable", "balance": 0.00 },
      { "account_name": "Tax Payable", "balance": 1080.00 }
    ],
    "total": 1080.00
  },
  "capital": {
    "items": [
      { "account_name": "Owner Capital", "balance": 55000.00 },
      { "account_name": "Retained Earnings (Net Profit)", "balance": 1000.00 }
    ],
    "total": 56000.00
  },
  "total_assets": 57080.00,
  "total_liabilities_and_capital": 57080.00,
  "is_balanced": true
}
```

#### `GET /api/v1/reports/pnl`
```json
// Response 200
{
  "period_start": "2026-09-01",
  "period_end": "2026-09-05",
  "income": {
    "items": [
      { "account_name": "Sales Income", "amount": 6000.00 }
    ],
    "total": 6000.00
  },
  "expenses": {
    "items": [
      { "account_name": "Purchase Expense", "amount": 5000.00 }
    ],
    "total": 5000.00
  },
  "net_profit": 1000.00
}
```
