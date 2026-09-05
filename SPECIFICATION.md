## Urban Furniture: Accounting System

An accounting system for Urban Furniture that enables:

- Journals) Entry of core master data (Contacts, Products, Chart of Accounts, Budget,

- Smooth recording of sales, purchases, and payments using the master data.

- Automated generation of financial and stock reports like Balance Sheet, Profit & Loss (P&L), and Budget Report.

## 2. Primary Actors

- Admin (Business Owner) – Creates users, creates/modifies/archives master data, records transactions, and views reports.
- Accountant (API role: `invoicing_user`) – Creates master data, records transactions, manages invoices/bills/payments, and views reports.
- User (API role: `contact`) – A portal account linked to a Contact; sees only that contact's invoices/bills and paid/unpaid status and can pay its own dues.
- System – Validates data, computes taxes, updates ledgers, enforces permissions, and generates reports.

## 3. Master Data Modules

## 1. Contact Master

Fields: Name, Type (Customer/Vendor/Both), Email, Mobile, Address (City, State,

Pincode), Profile Image.

## Example:


- Purchase Journal: Vendor bills and purchase transactions

- Bank Journal: Bank-related transactions

- Cash Journal: Cash receipts and payments

## 5. Journal Entries

Concept: A Journal Entry is the actual accounting record created for a financial

transaction. It records the debit and credit accounts along with the amount, ensuring that

every transaction follows the double-entry accounting principle.

Fields: Journal, Date, Reference, Journal Items, Account, Debit, Credit.

## Example:

- Cash received from customer → Debit: Cash, Credit: Debtor

- Purchase made on credit → Debit: Purchase Expense, Credit: Creditor

Users can use master data to create and link transactions:

| Process | Fields/Details |
| --- | --- |
| Purchase Order | Select Vendor, Product, Quantity, Unit Price |
| Vendor Bill | Convert PO to Bill, record invoice date, due date, and register |
|   | payment (Cash/Bank) |
| Sales Order | Select Customer, Product, Quantity, Unit Price, Tax |
| Customer | Generate Invoice from SO and receive payment via Cash/Bank |
| Invoice |   |
| Payment | Register against bill/invoice - select bank or cash |


## 5. Budget Flow

## Analytic Account:

Concept: An Analytic Account serves as a financial marker to monitor and group

expenses or income related to a particular project, department, or business unit. It

provides the foundation for evaluating the fiscal success of that specific sector.

Fields: Analytic Account name, Type (Income/Expenses)

## Budget:

Concept: A Budget is then created by defining the budget period, planned amount, and

the relevant analytic account.

Fields: Budget Name, Period, Responsible Person

## 6. Reporting Requirements

After transactions are recorded, the system must generate:

- 1. Balance Sheet – Real-time snapshot of Assets, Liabilities, and Capital.

- 2. Profit & Loss Account – Income from product sales minus purchases/expenses to show net profit.

- 3. Budget Report – Provides an overview of the planned budget.

## 7.1 Create Master Data

- 1. User creates and maintains the required master data.

- 2. User adds Contacts, such as Azure Furniture and Nimesh Pathak.

- 3. User adds Products, such as Wooden Chair.

- 4. Sets up the Chart of Accounts.


## 7.2 Record a Purchase

- 1. User creates a Purchase Order for Azure Furniture.

- 2. Once the goods are received, the user converts the Purchase Order into a Vendor Bill.

- 3. User records the payment through Bank.

## 7.3 Record a Sale

- 1. User creates a Sales Order for Nimesh Pathak for 5 Office Chairs.

- 2. User generates a Customer Invoice.

- 3. User records the payment through Cash/Bank.

## 7.4 Generate Reports

- 1. User selects the reporting period.

- 2. The system generates the following financial reports:

- Balance Sheet: Showing Companyʼs assets and liabilities.

- profit. Profit & Loss Report: Showing total sales, purchases, expenses, and net

- Budget Report

## Why This Hackathon Problem is Important

Real-world accounting workflow: Shows how a complete accounting process works end-to-end (Master Data → Purchase/Sales → Invoice/Bill → Payment → Accounting

Entries → Reporting).

Business logic focus: Teaches handling practical accounting rules like debit/credit

entries, payment tracking, account classification, budgets, and financial report generation

— not just UI screens.


Industry-ready system thinking: Builds a production-like solution connecting contacts,

products, journals, transactions, budgets, and financial reports while maintaining accurate

and consistent accounting data.

## 8. Excalidraw Clarifications (authoritative UI requirement addendum)

The attached `excalidraw-board.png` is the detailed workflow reference. Where it adds detail to this document, these clarifications are now the accepted requirements.

### 8.1 Authentication and users

- Login uses `Login ID` plus password. Email is not the login credential.
- Login ID is unique, case-insensitive, and 6–12 characters.
- Email is unique in the user database, case-insensitive.
- Password is at least 8 characters and contains at least one lowercase letter, one uppercase letter, and one special character. The mockup's “unique password” wording is interpreted as “must not equal the Login ID or email”; passwords remain hashed and are never globally compared in plaintext.
- Invalid credentials show `Invalid Login Id or Password`.
- Public Sign Up creates a user record with the Accountant/Invoicing User role only. The public form has no role selector.
- Admin has a separate Create User form with Name, Login ID, Email, Role, Password, and Re-enter Password. Role choices are Admin, Accountant, and User. A User/portal account must link to a Contact.
- User/portal accounts can see only their own invoices/bills, their paid/unpaid status, and can pay their own dues. Admin and Accountant can access the internal accounting application according to the authorization matrix.
- Login includes a Forgot Password route. Until a reset-delivery provider exists, the page may submit a reset request and display a truthful not-configured/demo response.

### 8.2 Navigation and view behavior

The dashboard exposes Sales, Purchase, Accounting, Reports, and Master Data areas. The required navigation targets are Sales Orders, Sales Invoices, Payments; Purchase Orders, Purchase Bills, Payments; Contacts, Products, Chart of Accounts, Journals, Journal Entries; Balance Sheet, Profit & Loss, Budget Report, and Analytics/Budget.

All master-data pages are list-first. New opens a blank form; clicking an existing row opens its populated form. Contacts, Products, Analytics, and Budgets support a list/kanban toggle. Destructive archive/cancel actions require confirmation and archived master records cannot be selected in new transactions.

### 8.3 Master-data details

- Contact: profile image/initials, name, email, phone/mobile, and address (city, state, pincode); type is Customer, Vendor, or Both.
- Product: image/initials, name, product type (Goods, Service, Combo), category, sales price, and cost price. Category is a many-to-one field and may be created inline.
- Chart of Accounts: account name, fixed account type (Asset, Liability, Bank, Cash, Capital, Income, Expense, Other Expense), and default-account behavior. Account type determines report placement.
- Journal: preconfigured Sales, Purchase, Bank, and Cash journals with a default account.
- Journal Entry: journal, accounting date, partner, account, debit, and credit. The form blocks confirmation and shows a warning until total debits equal total credits.

### 8.4 Transactions, analytics, and reports

- PO and SO numbers are generated sequentially. Their lines include Product, Chart of Accounts, Budget Analytic, quantity, unit price, and computed total. Purchase accounts default to the purchase expense account; sales accounts default to the sales income account.
- Confirming a Vendor Bill creates a balanced Purchase Journal entry. Confirming a Customer Invoice creates a balanced Sales Journal entry. Bill/Invoice payment is via Cash or Bank and creates the corresponding balanced payment entry. Bill/Invoice detail must retain a link to its source PO/SO and expose Print/Send; invoice also supports PDF download when the export capability is available.
- Analytic Accounts have a name and type (Income/Expense). Invoice lines map to Income analytics; PO/Vendor Bill lines map to Expense analytics.
- Budgets have name, responsible Contact, start date, end date, analytic account/type, and committed amount. Confirmed budgets calculate Achieved Amount, Achieved % = Achieved / Committed × 100, and Amount to Achieve = Committed − Achieved. Achieved Amount opens the matching invoices/bills in the budget period. Revision creates a new linked budget named `<original> Revised` and moves the old budget to Revised; cancellation archives it.
- Balance Sheet groups Assets, Liabilities, and Capital and must show the equation check `Total Assets = Total Liabilities + Capital`. P&L shows Income, Expenses (including Other Expenses), and Net Income = Income − Expenses. Budget Report shows committed versus achieved values and utilization.

## 9. Source mockup

[Excalidraw mockup](https://app.excalidraw.com/s/65VNwvy7c4X/6ofCsWuwhe)
