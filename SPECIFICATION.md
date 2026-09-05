## Urban Furniture: Accounting System

An accounting system for Urban Furniture that enables:

- Journals) Entry of core master data (Contacts, Products, Chart of Accounts, Budget,

- Smooth recording of sales, purchases, and payments using the master data.

- Automated generation of financial and stock reports like Balance Sheet, Profit & Loss (P&L), and Budget Report.

## 2. Primary Actors

- Admin (Business Owner) – Creates/ Modify/ Archived Master Data, Record Transaction and View Report

- Reports. Invoicing User (Accountant) – Creates Master Data, Records Transactions, Views

- view their own invoice/bills and make payment. Contact - Contact users can be created when creating Contact Master data. Only

- System – Validates data, computes taxes, updates ledgers, and generates reports

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

## [Mockup Link - https://app.excalidraw.com/s/65VNwvy7c4X/6ofCsWuwhe](https://app.excalidraw.com/s/65VNwvy7c4X/6ofCsWuwhe)
