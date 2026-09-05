# Purchase Orders Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete Purchase Orders workflow — list, new/edit form, detail with confirm/cancel — live-wired to the FastAPI backend, using the Stitch "clean top nav" layouts and the existing dashboard card components.

**Architecture:** Thin backend slice (cancel/edit endpoints, `confirmed_at`, analytic-accounts table + budget endpoint, seed data) following the existing router → service → schema pattern. Frontend gets a new `features/purchase-orders/` module (React Query for server state, local state for the form) built with `DashboardPanel` / `DashboardMetricCard` / `DashboardTableCard` from `features/dashboard/components/dashboard-card.tsx`.

**Tech Stack:** FastAPI + SQLAlchemy + Pydantic (backend), Next.js 16 App Router + TypeScript + Tailwind 4 + @tanstack/react-query 5.80.7 (frontend), pytest (backend tests).

**Spec:** `docs/superpowers/specs/2026-09-05-purchase-orders-module-design.md`

---

## Pre-flight notes (read first)

1. **Pre-existing broken test baseline (NOT caused by this work):** `backend/tests/test_auth.py` has a syntax error (`'{' was never closed`) and fails collection; `test_contacts.py`, `test_products.py`, `test_pagination_and_sorting.py` fail with 401s (written before auth was added to those routers). **This plan only guarantees `tests/test_purchase_orders.py` is green.** Run pytest with explicit file paths, never bare `pytest tests/`.
2. **Working tree has uncommitted frontend changes** (P0-FE-17: `dashboard-api.ts`, `orders-api.ts`, `orders-list-page.tsx`, `LOGIC.md`). Tasks 9 and 13 modify two of those files — that is expected; the work builds on top of them.
3. **Commit messages** follow Conventional Commits: `<type>(<scope>): <description>` — lowercase, imperative, no trailing period.
4. Backend commands run from `backend/` with `.venv/bin/python`. Frontend commands run from `frontend/` with `npm run ...` / `npx ...`.

---

## Task 1: Repair PO test suite with auth helper

The existing PO tests fail because contacts/products endpoints require a bearer token and the tests send none. Add an `auth_headers` helper and thread it through every call. This task is the foundation for Tasks 2–6.

**Files:**
- Modify: `backend/tests/test_purchase_orders.py` (full rewrite)

- [ ] **Step 1: Rewrite the test file**

Replace the entire contents of `backend/tests/test_purchase_orders.py` with:

```python
"""
Unit & Integration tests for Purchase Order endpoints (P0-BE-05).
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base, SessionLocal


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables exist before running tests."""
    Base.metadata.create_all(bind=engine)
    yield


def auth_headers(client: TestClient) -> dict:
    """Register a fresh user and return Authorization headers for it."""
    unique = uuid.uuid4().hex[:8]
    res = client.post(
        "/api/v1/auth/register",
        json={
            "login_id": f"po{unique}",
            "email": f"po_{unique}@example.com",
            "password": "SecurePass123!",
            "name": "PO Tester",
        },
    )
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}


def create_vendor(client: TestClient, headers: dict) -> int:
    res = client.post(
        "/api/v1/contacts",
        headers=headers,
        json={
            "name": f"Vendor {uuid.uuid4().hex[:6]}",
            "type": "vendor",
            "email": "vendor@example.com",
            "mobile": "9876543210",
            "city": "Mumbai",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


def create_product(client: TestClient, headers: dict) -> int:
    res = client.post(
        "/api/v1/products",
        headers=headers,
        json={
            "name": f"Product {uuid.uuid4().hex[:6]}",
            "product_type": "goods",
            "category": "Furniture",
            "price": 1500.00,
            "cost": 1000.00,
            "tax_percent": 18.0,
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


def create_draft_po(client: TestClient, headers: dict, vendor_id: int, product_id: int, quantity: float = 10, unit_price: float = 1000.00, analytic_account_id=None) -> dict:
    payload = {
        "vendor_id": vendor_id,
        "lines": [
            {
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": unit_price,
                "analytic_account_id": analytic_account_id,
            }
        ],
    }
    res = client.post("/api/v1/purchase-orders", headers=headers, json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def test_purchase_order_lifecycle():
    with TestClient(app) as client:
        headers = auth_headers(client)
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)

        po_data = create_draft_po(client, headers, vendor_id, product_id)

        assert po_data["po_number"].startswith("PO-")
        assert po_data["vendor_id"] == vendor_id
        assert po_data["status"] == "draft"
        assert po_data["total"] == 10000.00
        assert len(po_data["lines"]) == 1
        assert po_data["lines"][0]["subtotal"] == 10000.00

        po_id = po_data["id"]

        get_res = client.get(f"/api/v1/purchase-orders/{po_id}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["po_number"] == po_data["po_number"]

        list_res = client.get("/api/v1/purchase-orders", headers=headers)
        assert list_res.status_code == 200
        assert any(p["id"] == po_id for p in list_res.json()["data"])

        confirm_res = client.patch(f"/api/v1/purchase-orders/{po_id}/confirm", headers=headers)
        assert confirm_res.status_code == 200
        assert confirm_res.json()["status"] == "confirmed"

        reconfirm_res = client.patch(f"/api/v1/purchase-orders/{po_id}/confirm", headers=headers)
        assert reconfirm_res.status_code in (400, 422)


def test_purchase_order_validation_errors():
    with TestClient(app) as client:
        headers = auth_headers(client)

        bad_vendor_payload = {
            "vendor_id": 999999,
            "lines": [{"product_id": 1, "quantity": 2, "unit_price": 500.00}],
        }
        res_vendor = client.post("/api/v1/purchase-orders", headers=headers, json=bad_vendor_payload)
        assert res_vendor.status_code == 404

        res_404 = client.get("/api/v1/purchase-orders/999999", headers=headers)
        assert res_404.status_code == 404


def test_purchase_orders_require_auth():
    with TestClient(app) as client:
        assert client.get("/api/v1/purchase-orders").status_code == 401
        assert client.post("/api/v1/purchase-orders", json={"vendor_id": 1, "lines": []}).status_code == 401
        assert client.get("/api/v1/purchase-orders/1").status_code == 401
        assert client.patch("/api/v1/purchase-orders/1/confirm").status_code == 401
```

- [ ] **Step 2: Run tests — auth test still fails, others pass**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py -v`
Expected: `test_purchase_order_lifecycle` PASS, `test_purchase_order_validation_errors` PASS, `test_purchase_orders_require_auth` **FAIL** (PO endpoints don't require auth yet — that lands in Task 2).

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_purchase_orders.py
git commit -m "test(purchase-orders): add auth helpers to test suite"
```

---

## Task 2: Require auth on PO router

Every other router uses `get_current_user`; the PO router is the odd one out.

**Files:**
- Modify: `backend/app/routers/purchase_orders.py`

- [ ] **Step 1: Add auth dependency to all endpoints**

Replace the file contents with:

```python
"""
Purchase Order API endpoints (P0-BE-05).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.purchase_order import POCreate, POResponse, POListResponse
from app.services import purchase_order_service

router = APIRouter()


@router.post("", response_model=POResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=POResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_purchase_order(req: POCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new Purchase Order in draft status."""
    return purchase_order_service.create_purchase_order(db, req)


@router.get("", response_model=POListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=POListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_purchase_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (draft, confirmed, cancelled)"),
    vendor_id: Optional[int] = Query(None, description="Filter by Vendor Contact ID"),
    search: Optional[str] = Query(None, description="Search by PO number or Vendor name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by (po_number, order_date, total, created_at, id)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List Purchase Orders with optional filtering, sorting, and pagination."""
    pos, total, page, limit, pages = purchase_order_service.list_purchase_orders(
        db,
        status=status_filter,
        vendor_id=vendor_id,
        search=search,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return POListResponse(data=pos, total=total, page=page, limit=limit, pages=pages)


@router.get("/{po_id}", response_model=POResponse, status_code=status.HTTP_200_OK)
def get_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get Purchase Order detail by ID."""
    return purchase_order_service.get_purchase_order(db, po_id)


@router.patch("/{po_id}/confirm", response_model=POResponse, status_code=status.HTTP_200_OK)
def confirm_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Confirm a Purchase Order (draft -> confirmed)."""
    return purchase_order_service.confirm_purchase_order(db, po_id)
```

- [ ] **Step 2: Run tests**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py -v`
Expected: all 3 PASS (including `test_purchase_orders_require_auth`).

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/purchase_orders.py
git commit -m "feat(purchase-orders): require auth on all endpoints"
```

---

## Task 3: Track confirmation timestamp

**Files:**
- Modify: `backend/app/models/purchase_order.py`
- Modify: `backend/app/schemas/purchase_order.py`
- Modify: `backend/app/services/purchase_order_service.py`
- Modify: `backend/app/main.py` (lifespan ALTER)
- Test: `backend/tests/test_purchase_orders.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_purchase_orders.py`:

```python
def test_confirm_sets_confirmed_at():
    with TestClient(app) as client:
        headers = auth_headers(client)
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)
        po = create_draft_po(client, headers, vendor_id, product_id)

        assert po.get("confirmed_at") is None

        confirm_res = client.patch(f"/api/v1/purchase-orders/{po['id']}/confirm", headers=headers)
        assert confirm_res.status_code == 200
        confirmed_at = confirm_res.json().get("confirmed_at")
        assert confirmed_at is not None

        get_res = client.get(f"/api/v1/purchase-orders/{po['id']}", headers=headers)
        assert get_res.json()["confirmed_at"] == confirmed_at
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py::test_confirm_sets_confirmed_at -v`
Expected: PASS on the first assert but the response has no `confirmed_at` key — actually `po.get("confirmed_at")` returns None either way, so the failure shows at `assert confirmed_at is not None`. FAIL expected there.

- [ ] **Step 3: Add the column to the model**

In `backend/app/models/purchase_order.py`, add to `PurchaseOrder` after `status`:

```python
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
```

(`datetime` and `Optional` are already imported in that file.)

- [ ] **Step 4: Migrate existing databases via lifespan**

In `backend/app/main.py`, inside the `lifespan` `with engine.connect() as conn:` block, add after the existing ALTER statements:

```python
            conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP"))
```

- [ ] **Step 5: Expose in the schema**

In `backend/app/schemas/purchase_order.py`, add to `POResponse` after `created_at`:

```python
    confirmed_at: Optional[datetime] = None
```

- [ ] **Step 6: Set it in the service**

In `backend/app/services/purchase_order_service.py`:

a) In `_build_po_response`, add to the `POResponse(...)` constructor after `created_at=po.created_at,`:

```python
        confirmed_at=po.confirmed_at,
```

b) In `confirm_purchase_order`, replace `po.status = "confirmed"` with:

```python
    po.status = "confirmed"
    po.confirmed_at = datetime.now(timezone.utc)
```

(`datetime, timezone` are already imported at the top of the file.)

- [ ] **Step 7: Run tests**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py -v`
Expected: all 4 PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/purchase_order.py backend/app/schemas/purchase_order.py backend/app/services/purchase_order_service.py backend/app/main.py backend/tests/test_purchase_orders.py
git commit -m "feat(purchase-orders): track confirmation timestamp"
```

---

## Task 4: Cancel endpoint

**Files:**
- Modify: `backend/app/services/purchase_order_service.py`
- Modify: `backend/app/routers/purchase_orders.py`
- Test: `backend/tests/test_purchase_orders.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_purchase_orders.py`:

```python
def test_cancel_purchase_order():
    with TestClient(app) as client:
        headers = auth_headers(client)
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)

        # Draft -> cancelled works
        po = create_draft_po(client, headers, vendor_id, product_id)
        cancel_res = client.patch(f"/api/v1/purchase-orders/{po['id']}/cancel", headers=headers)
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "cancelled"

        # Cancelling a cancelled PO fails
        recancel = client.patch(f"/api/v1/purchase-orders/{po['id']}/cancel", headers=headers)
        assert recancel.status_code == 422

        # Cancelling a confirmed PO fails
        po2 = create_draft_po(client, headers, vendor_id, product_id)
        client.patch(f"/api/v1/purchase-orders/{po2['id']}/confirm", headers=headers)
        cancel_confirmed = client.patch(f"/api/v1/purchase-orders/{po2['id']}/cancel", headers=headers)
        assert cancel_confirmed.status_code == 422
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py::test_cancel_purchase_order -v`
Expected: FAIL with 404 (route does not exist).

- [ ] **Step 3: Implement the service function**

Append to `backend/app/services/purchase_order_service.py`:

```python
def cancel_purchase_order(db: Session, po_id: int) -> POResponse:
    """Cancel a Purchase Order ('draft' -> 'cancelled')."""
    po = db.scalar(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    if not po:
        raise NotFoundException("PurchaseOrder", po_id)

    if po.status != "draft":
        raise ValidationException(f"Cannot cancel Purchase Order in status '{po.status}'")

    po.status = "cancelled"
    db.commit()

    return get_purchase_order(db, po_id)
```

- [ ] **Step 4: Add the route**

In `backend/app/routers/purchase_orders.py`, append after the confirm route:

```python
@router.patch("/{po_id}/cancel", response_model=POResponse, status_code=status.HTTP_200_OK)
def cancel_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Cancel a Purchase Order (draft -> cancelled)."""
    return purchase_order_service.cancel_purchase_order(db, po_id)
```

- [ ] **Step 5: Run tests**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py -v`
Expected: all 5 PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/purchase_order_service.py backend/app/routers/purchase_orders.py backend/tests/test_purchase_orders.py
git commit -m "feat(purchase-orders): add cancel endpoint"
```

---

## Task 5: Draft-only edit endpoint

**Files:**
- Modify: `backend/app/services/purchase_order_service.py`
- Modify: `backend/app/routers/purchase_orders.py`
- Test: `backend/tests/test_purchase_orders.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_purchase_orders.py`:

```python
def test_update_purchase_order_draft_only():
    with TestClient(app) as client:
        headers = auth_headers(client)
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)
        product2_id = create_product(client, headers)

        po = create_draft_po(client, headers, vendor_id, product_id, quantity=10, unit_price=1000.00)

        # Edit replaces lines and recomputes total
        update_payload = {
            "vendor_id": vendor_id,
            "lines": [
                {"product_id": product2_id, "quantity": 3, "unit_price": 500.00},
                {"product_id": product_id, "quantity": 1, "unit_price": 250.00},
            ],
        }
        put_res = client.put(f"/api/v1/purchase-orders/{po['id']}", headers=headers, json=update_payload)
        assert put_res.status_code == 200, put_res.text
        updated = put_res.json()
        assert updated["total"] == 1750.00
        assert len(updated["lines"]) == 2
        assert updated["lines"][0]["product_id"] == product2_id

        # Confirmed POs cannot be edited
        client.patch(f"/api/v1/purchase-orders/{po['id']}/confirm", headers=headers)
        edit_confirmed = client.put(f"/api/v1/purchase-orders/{po['id']}", headers=headers, json=update_payload)
        assert edit_confirmed.status_code == 422
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py::test_update_purchase_order_draft_only -v`
Expected: FAIL with 405 (PUT not allowed).

- [ ] **Step 3: Implement the service function**

Append to `backend/app/services/purchase_order_service.py`:

```python
def update_purchase_order(db: Session, po_id: int, po_in: POCreate) -> POResponse:
    """Update a draft Purchase Order: vendor, order date, and full line replacement."""
    po = db.scalar(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    if not po:
        raise NotFoundException("PurchaseOrder", po_id)

    if po.status != "draft":
        raise ValidationException(f"Cannot edit Purchase Order in status '{po.status}'")

    vendor = db.scalar(select(Contact).where(Contact.id == po_in.vendor_id))
    if not vendor:
        raise NotFoundException("Contact", po_in.vendor_id)

    default_account = db.scalar(select(Account).where(Account.code == "5010"))
    default_account_id = default_account.id if default_account else None

    po.vendor_id = po_in.vendor_id
    if po_in.order_date:
        po.order_date = po_in.order_date

    # Replace all lines (relationship cascade="all, delete-orphan" removes old rows)
    po.lines.clear()
    db.flush()

    total_amount = 0.0
    for line_in in po_in.lines:
        product = db.scalar(select(Product).where(Product.id == line_in.product_id))
        if not product:
            raise NotFoundException("Product", line_in.product_id)

        account_id = line_in.account_id or default_account_id
        if account_id:
            acc = db.scalar(select(Account).where(Account.id == account_id))
            if not acc:
                raise NotFoundException("Account", account_id)

        subtotal = round(line_in.quantity * line_in.unit_price, 2)
        total_amount += subtotal

        db.add(PurchaseOrderLine(
            po_id=po.id,
            product_id=line_in.product_id,
            account_id=account_id,
            analytic_account_id=line_in.analytic_account_id,
            quantity=line_in.quantity,
            unit_price=line_in.unit_price,
            subtotal=subtotal,
        ))

    po.total = round(total_amount, 2)
    db.commit()

    return get_purchase_order(db, po_id)
```

- [ ] **Step 4: Add the route**

In `backend/app/routers/purchase_orders.py`, add between the get and confirm routes:

```python
@router.put("/{po_id}", response_model=POResponse, status_code=status.HTTP_200_OK)
def update_purchase_order(po_id: int, req: POCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update a draft Purchase Order (vendor, date, full line replacement)."""
    return purchase_order_service.update_purchase_order(db, po_id, req)
```

- [ ] **Step 5: Run tests**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py -v`
Expected: all 6 PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/purchase_order_service.py backend/app/routers/purchase_orders.py backend/tests/test_purchase_orders.py
git commit -m "feat(purchase-orders): add draft-only edit endpoint"
```

---

## Task 6: Analytic accounts with budget tracking

**Files:**
- Create: `backend/app/models/analytic_account.py`
- Create: `backend/app/schemas/analytic_account.py`
- Create: `backend/app/services/analytic_account_service.py`
- Create: `backend/app/routers/analytic_accounts.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/routers/__init__.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_purchase_orders.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_purchase_orders.py`:

```python
def test_analytic_accounts_budget_tracking():
    from app.models.analytic_account import AnalyticAccount

    with TestClient(app) as client:
        headers = auth_headers(client)

        # Create an analytic account directly in the DB (no POST endpoint by design)
        db = SessionLocal()
        try:
            analytic = AnalyticAccount(name=f"Test Project {uuid.uuid4().hex[:6]}", budget_amount=10000.0)
            db.add(analytic)
            db.commit()
            db.refresh(analytic)
            analytic_id = analytic.id
        finally:
            db.close()

        # Nothing committed yet
        res = client.get("/api/v1/analytic-accounts", headers=headers)
        assert res.status_code == 200
        entry = next(a for a in res.json()["data"] if a["id"] == analytic_id)
        assert entry["budget_amount"] == 10000.0
        assert entry["committed_amount"] == 0.0
        assert entry["remaining_amount"] == 10000.0

        # Confirm a PO against the analytic -> committed moves
        vendor_id = create_vendor(client, headers)
        product_id = create_product(client, headers)
        po = create_draft_po(client, headers, vendor_id, product_id, quantity=2, unit_price=1000.00, analytic_account_id=analytic_id)
        client.patch(f"/api/v1/purchase-orders/{po['id']}/confirm", headers=headers)

        res2 = client.get("/api/v1/analytic-accounts", headers=headers)
        entry2 = next(a for a in res2.json()["data"] if a["id"] == analytic_id)
        assert entry2["committed_amount"] == 2000.0
        assert entry2["remaining_amount"] == 8000.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py::test_analytic_accounts_budget_tracking -v`
Expected: FAIL — `ModuleNotFoundError: app.models.analytic_account`.

- [ ] **Step 3: Create the model**

Create `backend/app/models/analytic_account.py`:

```python
"""
Analytic Account model (budget analytics / cost centers).
"""

from sqlalchemy import String, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AnalyticAccount(Base):
    """
    Analytic account used on PO lines for budget tracking.
    """

    __tablename__ = "analytic_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    budget_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
```

- [ ] **Step 4: Create the schema**

Create `backend/app/schemas/analytic_account.py`:

```python
"""
Pydantic schemas for Analytic Accounts.
"""

from typing import List
from pydantic import BaseModel


class AnalyticAccountResponse(BaseModel):
    id: int
    name: str
    budget_amount: float
    committed_amount: float
    remaining_amount: float


class AnalyticAccountListResponse(BaseModel):
    data: List[AnalyticAccountResponse]
```

- [ ] **Step 5: Create the service**

Create `backend/app/services/analytic_account_service.py`:

```python
"""
Service logic for Analytic Accounts (budget analytics).
"""

from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.analytic_account import AnalyticAccount
from app.models.purchase_order import PurchaseOrder, PurchaseOrderLine
from app.schemas.analytic_account import AnalyticAccountResponse


def list_analytic_accounts(db: Session) -> List[AnalyticAccountResponse]:
    """List active analytic accounts with committed/remaining budget.

    committed = sum of PO line subtotals for that analytic on CONFIRMED POs.
    """
    committed_stmt = (
        select(
            PurchaseOrderLine.analytic_account_id,
            func.coalesce(func.sum(PurchaseOrderLine.subtotal), 0.0),
        )
        .join(PurchaseOrder, PurchaseOrderLine.po_id == PurchaseOrder.id)
        .where(
            PurchaseOrder.status == "confirmed",
            PurchaseOrderLine.analytic_account_id.isnot(None),
        )
        .group_by(PurchaseOrderLine.analytic_account_id)
    )
    committed_map = {row[0]: float(row[1]) for row in db.execute(committed_stmt).all()}

    accounts = db.scalars(
        select(AnalyticAccount)
        .where(AnalyticAccount.is_active == True)  # noqa: E712
        .order_by(AnalyticAccount.name)
    ).all()

    return [
        AnalyticAccountResponse(
            id=a.id,
            name=a.name,
            budget_amount=a.budget_amount,
            committed_amount=committed_map.get(a.id, 0.0),
            remaining_amount=a.budget_amount - committed_map.get(a.id, 0.0),
        )
        for a in accounts
    ]
```

- [ ] **Step 6: Create the router**

Create `backend/app/routers/analytic_accounts.py`:

```python
"""
Analytic Account API endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.analytic_account import AnalyticAccountListResponse
from app.services import analytic_account_service

router = APIRouter()


@router.get("", response_model=AnalyticAccountListResponse, status_code=status.HTTP_200_OK)
@router.get("/", response_model=AnalyticAccountListResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
def list_analytic_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List active analytic accounts with budget, committed, and remaining amounts."""
    return AnalyticAccountListResponse(data=analytic_account_service.list_analytic_accounts(db))
```

- [ ] **Step 7: Register model and router**

a) In `backend/app/models/__init__.py`, add the import and export:

```python
from app.models.analytic_account import AnalyticAccount
```

and add `"AnalyticAccount"` to `__all__`.

b) In `backend/app/routers/__init__.py`, add:

```python
from app.routers.analytic_accounts import router as analytic_account_router
```

and add `"analytic_account_router"` to `__all__`.

c) In `backend/app/main.py`, add `analytic_account_router` to the `from app.routers import (...)` import list, then add after the purchase-orders include:

```python
app.include_router(analytic_account_router, prefix="/api/v1/analytic-accounts", tags=["Analytic Accounts"])
```

- [ ] **Step 8: Run tests**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py -v`
Expected: all 7 PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/app/models/analytic_account.py backend/app/schemas/analytic_account.py backend/app/services/analytic_account_service.py backend/app/routers/analytic_accounts.py backend/app/models/__init__.py backend/app/routers/__init__.py backend/app/main.py backend/tests/test_purchase_orders.py
git commit -m "feat(analytics): add analytic accounts budget endpoint"
```

---

## Task 7: Seed the demo dataset

Adds the brief's vendors, products, analytic accounts, and the 3 sample POs. Idempotent: vendors/products/analytics guard by name; POs skip entirely if any PO exists (so numbering lands on PO-0001…0003 only on a fresh table).

**Files:**
- Modify: `backend/seed.py`

- [ ] **Step 1: Add the new imports**

At the top of `backend/seed.py`, replace the import block with:

```python
from datetime import datetime

from app.core.database import SessionLocal, engine, Base
from app.models.contact import Contact
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder
from app.models.analytic_account import AnalyticAccount
from app.services.accounting_service import seed_accounting_defaults
from app.services import purchase_order_service
from app.schemas.purchase_order import POCreate, POLineCreate
```

- [ ] **Step 2: Add the brief's vendors and products**

Append to `contacts_data` (inside `run_seed`):

```python
            {
                "name": "Azure Furniture",
                "type": "vendor",
                "email": "sales@azurefurniture.in",
                "mobile": "+91 98110 22334",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560001",
                "is_active": True,
            },
            {
                "name": "Modern Office Supplies",
                "type": "vendor",
                "email": "orders@modernoffice.in",
                "mobile": "+91 99220 44556",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "is_active": True,
            },
            {
                "name": "Woodcraft Vendors",
                "type": "vendor",
                "email": "supply@woodcraft.in",
                "mobile": "+91 99330 55667",
                "city": "Jaipur",
                "state": "Rajasthan",
                "pincode": "302001",
                "is_active": True,
            },
```

Append to `products_data`:

```python
            {
                "name": "Wooden Chair",
                "product_type": "goods",
                "category": "Seating",
                "price": 800.0,
                "cost": 500.0,
                "tax_percent": 18.0,
                "description": "Solid wood dining chair",
                "is_active": True,
            },
            {
                "name": "Office Chair",
                "product_type": "goods",
                "category": "Office Furniture",
                "price": 1800.0,
                "cost": 1200.0,
                "tax_percent": 18.0,
                "description": "Ergonomic office chair",
                "is_active": True,
            },
            {
                "name": "Conference Table",
                "product_type": "goods",
                "category": "Office Furniture",
                "price": 12000.0,
                "cost": 8000.0,
                "tax_percent": 18.0,
                "description": "8-seater conference table",
                "is_active": True,
            },
            {
                "name": "Storage Cabinet",
                "product_type": "goods",
                "category": "Storage",
                "price": 9500.0,
                "cost": 6500.0,
                "tax_percent": 18.0,
                "description": "Lockable office storage cabinet",
                "is_active": True,
            },
```

- [ ] **Step 3: Add analytic + PO seeding functions**

Add these functions above `run_seed`:

```python
ANALYTICS_DATA = [
    {"name": "Furniture Project", "budget_amount": 50000.0},
    {"name": "Office Renovation", "budget_amount": 100000.0},
    {"name": "General Operations", "budget_amount": 25000.0},
]


def seed_analytic_accounts(db):
    for item in ANALYTICS_DATA:
        existing = db.query(AnalyticAccount).filter(AnalyticAccount.name == item["name"]).first()
        if not existing:
            db.add(AnalyticAccount(**item))
    db.commit()


def seed_purchase_orders(db):
    """Seed the 3 demo POs. Skips entirely if any PO already exists,
    so PO numbers land on PO-0001..PO-0003 on a fresh table."""
    if db.query(PurchaseOrder).first():
        return

    vendor = {c.name: c for c in db.query(Contact).filter(Contact.type == "vendor").all()}
    product = {p.name: p for p in db.query(Product).all()}
    analytic = {a.name: a for a in db.query(AnalyticAccount).all()}

    # PO-0001 — Azure Furniture — 05 Sep 2026 — Confirmed — ₹5,000
    po1 = purchase_order_service.create_purchase_order(db, POCreate(
        vendor_id=vendor["Azure Furniture"].id,
        order_date=datetime(2026, 9, 5),
        lines=[POLineCreate(
            product_id=product["Wooden Chair"].id,
            analytic_account_id=analytic["Furniture Project"].id,
            quantity=10,
            unit_price=500.0,
        )],
    ))
    purchase_order_service.confirm_purchase_order(db, po1.id)

    # PO-0002 — Modern Office Supplies — 04 Sep 2026 — Draft — ₹12,500
    purchase_order_service.create_purchase_order(db, POCreate(
        vendor_id=vendor["Modern Office Supplies"].id,
        order_date=datetime(2026, 9, 4),
        lines=[
            POLineCreate(
                product_id=product["Office Chair"].id,
                analytic_account_id=analytic["Office Renovation"].id,
                quantity=5,
                unit_price=1200.0,
            ),
            POLineCreate(
                product_id=product["Storage Cabinet"].id,
                analytic_account_id=analytic["Office Renovation"].id,
                quantity=1,
                unit_price=6500.0,
            ),
        ],
    ))

    # PO-0003 — Woodcraft Vendors — 01 Sep 2026 — Confirmed — ₹8,400
    po3 = purchase_order_service.create_purchase_order(db, POCreate(
        vendor_id=vendor["Woodcraft Vendors"].id,
        order_date=datetime(2026, 9, 1),
        lines=[POLineCreate(
            product_id=product["Office Chair"].id,
            analytic_account_id=analytic["Furniture Project"].id,
            quantity=7,
            unit_price=1200.0,
        )],
    ))
    purchase_order_service.confirm_purchase_order(db, po3.id)
```

- [ ] **Step 4: Call them from run_seed**

In `run_seed`, after the products loop and before `db.commit()`, nothing changes; instead replace the final block:

```python
        db.commit()
        print("[SUCCESS] Master data seeded: Accounts, Journals, Contacts, Products.")
```

with:

```python
        db.commit()

        # 4. Seed Analytic Accounts
        seed_analytic_accounts(db)

        # 5. Seed demo Purchase Orders (skipped if any PO exists)
        seed_purchase_orders(db)

        print("[SUCCESS] Master data seeded: Accounts, Journals, Contacts, Products, Analytics, Purchase Orders.")
```

- [ ] **Step 5: Run the seed and verify**

Run: `cd backend && .venv/bin/python seed.py`
Expected: `[SUCCESS] Master data seeded: ... Purchase Orders.` — then verify with the API (backend must be running) or:

Run: `cd backend && .venv/bin/python -c "from app.core.database import SessionLocal; from app.models.purchase_order import PurchaseOrder; db = SessionLocal(); print([(p.po_number, p.status, p.total) for p in db.query(PurchaseOrder).all()]); db.close()"`
Expected (fresh table): `[('PO-0001', 'confirmed', 5000.0), ('PO-0002', 'draft', 12500.0), ('PO-0003', 'confirmed', 8400.0)]`

- [ ] **Step 6: Run the PO tests once more**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py -q`
Expected: 7 passed (tests tolerate existing seed data — they look up records by id).

- [ ] **Step 7: Commit**

```bash
git add backend/seed.py
git commit -m "chore(seed): add purchase orders demo dataset"
```

---

## Task 8: Frontend API client, types, and format helpers

**Files:**
- Create: `frontend/src/lib/format.ts`
- Modify: `frontend/src/lib/types.ts` (append one interface)
- Create: `frontend/src/features/purchase-orders/purchase-orders-api.ts`

- [ ] **Step 1: Create the format helpers**

Create `frontend/src/lib/format.ts`:

```typescript
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
```

- [ ] **Step 2: Add the AnalyticAccount type**

Append to `frontend/src/lib/types.ts`:

```typescript
export interface AnalyticAccount {
  id: number;
  name: string;
  budget_amount: number;
  committed_amount: number;
  remaining_amount: number;
}
```

- [ ] **Step 3: Create the API client**

Create `frontend/src/features/purchase-orders/purchase-orders-api.ts`:

```typescript
import { apiFetch } from "@/lib/api";
import type {
  Account,
  AnalyticAccount,
  Contact,
  ContactListResponse,
  Product,
  ProductListResponse,
} from "@/lib/types";

// API-shaped Purchase Order types. These differ from the demo-adapter
// PurchaseOrder in lib/types (string ids, display formatting) — this module
// talks to the real backend, so ids are numbers and status is lowercase.
export interface PurchaseOrderLine {
  id: number;
  product_id: number;
  product_name?: string | null;
  account_id?: number | null;
  account_name?: string | null;
  analytic_account_id?: number | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type PurchaseOrderStatus = "draft" | "confirmed" | "cancelled";

export interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_id: number;
  vendor_name?: string | null;
  status: PurchaseOrderStatus;
  total: number;
  order_date: string;
  created_at: string;
  confirmed_at?: string | null;
  lines: PurchaseOrderLine[];
}

export interface PurchaseOrderPage {
  data: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type PurchaseOrderSort = "po_number" | "order_date" | "total" | "created_at" | "id";

export interface PurchaseOrderListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy: PurchaseOrderSort;
  sortOrder: "asc" | "desc";
}

export interface PurchaseOrderLineInput {
  product_id: number;
  account_id?: number | null;
  analytic_account_id?: number | null;
  quantity: number;
  unit_price: number;
}

export interface PurchaseOrderInput {
  vendor_id: number;
  order_date?: string;
  lines: PurchaseOrderLineInput[];
}

export async function fetchPurchaseOrdersPage(params: PurchaseOrderListParams): Promise<PurchaseOrderPage> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    sort_by: params.sortBy,
    sort_order: params.sortOrder,
  });
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.status && params.status !== "all") search.set("status", params.status);
  return apiFetch<PurchaseOrderPage>(`/api/v1/purchase-orders?${search.toString()}`, { auth: true });
}

export async function fetchPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}`, { auth: true });
}

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders`, { auth: true, method: "POST", body: input });
}

export async function updatePurchaseOrder(id: string, input: PurchaseOrderInput): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}`, { auth: true, method: "PUT", body: input });
}

export async function confirmPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/confirm`, { auth: true, method: "PATCH" });
}

export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/cancel`, { auth: true, method: "PATCH" });
}

export async function fetchVendors(): Promise<Contact[]> {
  const res = await apiFetch<ContactListResponse>(`/api/v1/contacts?type=vendor&is_active=true&limit=100`, { auth: true });
  return res.data;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await apiFetch<ProductListResponse>(`/api/v1/products?is_active=true&limit=100`, { auth: true });
  return res.data;
}

export async function fetchExpenseAccounts(): Promise<Account[]> {
  const res = await apiFetch<{ data: Account[] }>(`/api/v1/accounts?is_active=true&limit=100`, { auth: true });
  return res.data.filter((a) => a.type === "expense" || a.type === "other_expense");
}

export async function fetchAnalyticAccounts(): Promise<AnalyticAccount[]> {
  const res = await apiFetch<{ data: AnalyticAccount[] }>(`/api/v1/analytic-accounts`, { auth: true });
  return res.data;
}

export async function fetchNextPoNumberPreview(): Promise<string> {
  const res = await fetchPurchaseOrdersPage({ page: 1, limit: 1, sortBy: "id", sortOrder: "desc" });
  const latest = res.data[0]?.po_number;
  const nextNumber = latest ? parseInt(latest.replace(/\D/g, ""), 10) + 1 : 1;
  return `PO-${String(nextNumber).padStart(4, "0")}`;
}
```

- [ ] **Step 4: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors (nothing imports the new files yet, but they must compile).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/format.ts frontend/src/lib/types.ts frontend/src/features/purchase-orders/purchase-orders-api.ts
git commit -m "feat(frontend): add purchase orders api client"
```

---

## Task 9: List screen (Stitch layout, dashboard components)

**Files:**
- Create: `frontend/src/features/purchase-orders/po-status-badge.tsx`
- Create: `frontend/src/features/purchase-orders/purchase-orders-list-page.tsx`
- Modify: `frontend/src/app/(app)/purchase-orders/page.tsx`

- [ ] **Step 1: Create the status badge**

Create `frontend/src/features/purchase-orders/po-status-badge.tsx`:

```tsx
import type { PurchaseOrderStatus } from "./purchase-orders-api";

const STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  confirmed: "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-400",
  draft: "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-400",
  cancelled: "border-red-200/70 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-400",
};

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  confirmed: "Confirmed",
  draft: "Draft",
  cancelled: "Cancelled",
};

export function PoStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 2: Create the list page**

Create `frontend/src/features/purchase-orders/purchase-orders-list-page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  IndianRupee,
  Package,
  Plus,
  Search,
} from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { DashboardMetricCard, DashboardTableCard } from "@/features/dashboard/components/dashboard-card";
import { formatDate, formatINR } from "@/lib/format";
import { fetchPurchaseOrdersPage, type PurchaseOrderSort } from "./purchase-orders-api";
import { PoStatusBadge } from "./po-status-badge";

const PAGE_SIZE = 10;

type SortKey = "reference" | "date" | "total";
type SortOrder = "asc" | "desc";

const SORT_TO_API: Record<SortKey, PurchaseOrderSort> = {
  reference: "po_number",
  date: "order_date",
  total: "total",
};

export function PurchaseOrdersListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const listQuery = useQuery({
    queryKey: ["purchase-orders", { page, search: debouncedSearch, status: statusFilter, sortKey, sortOrder }],
    queryFn: () =>
      fetchPurchaseOrdersPage({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
        sortBy: SORT_TO_API[sortKey],
        sortOrder,
      }),
  });

  // Summary cards read the unfiltered set. Demo-scale assumption: <= 100 POs.
  const summaryQuery = useQuery({
    queryKey: ["purchase-orders", "summary"],
    queryFn: () => fetchPurchaseOrdersPage({ page: 1, limit: 100, sortBy: "id", sortOrder: "desc" }),
  });

  function handleSort(nextKey: SortKey) {
    setPage(1);
    if (sortKey === nextKey) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortOrder("asc");
  }

  const orders = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const pages = Math.max(1, listQuery.data?.pages ?? 1);

  const summaryOrders = summaryQuery.data?.data ?? [];
  const draftOrders = summaryOrders.filter((o) => o.status === "draft");
  const confirmedOrders = summaryOrders.filter((o) => o.status === "confirmed");
  const totalValue = summaryOrders.reduce((sum, o) => sum + o.total, 0);
  const draftValue = draftOrders.reduce((sum, o) => sum + o.total, 0);
  const confirmedValue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgValue = summaryOrders.length > 0 ? Math.round(totalValue / summaryOrders.length) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Purchase Orders</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage supplier orders, approvals, and committed procurement value.
          </p>
        </div>
        <Link
          href="/purchase-orders/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Total Orders"
          icon={Package}
          value={summaryQuery.data?.total ?? 0}
          valueDetail="active records"
          footerLabel="Total value"
          footerValue={formatINR(totalValue)}
        />
        <DashboardMetricCard
          title="Draft Orders"
          icon={Clock3}
          tone="amber"
          value={draftOrders.length}
          valueDetail="pending approval"
          footerLabel="Draft value"
          footerValue={formatINR(draftValue)}
        />
        <DashboardMetricCard
          title="Confirmed Orders"
          icon={CheckCircle2}
          tone="emerald"
          value={confirmedOrders.length}
          valueDetail="approved"
          footerLabel="Confirmed value"
          footerValue={formatINR(confirmedValue)}
        />
        <DashboardMetricCard
          title="Total Purchase Value"
          icon={IndianRupee}
          tone="blue"
          value={formatINR(totalValue)}
          valueDetail="all orders"
          footerLabel="Avg order value"
          footerValue={formatINR(avgValue)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search PO number or vendor..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-xs text-text outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <DashboardTableCard
        title="All Purchase Orders"
        tone="indigo"
        count={`Showing ${orders.length} of ${total} orders`}
      >
        {listQuery.isError ? (
          <div className="px-6 py-20 text-center">
            <p className="font-semibold text-destructive">Could not load purchase orders.</p>
            <p className="mt-1 text-sm text-text-muted">Please try again after the backend is available.</p>
          </div>
        ) : listQuery.isLoading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Package className="mx-auto h-8 w-8 text-text-muted" />
            <h3 className="mt-3 font-semibold text-text">No purchase orders found</h3>
            <p className="mt-1 text-sm text-text-muted">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <SortableHeader label="PO Number" sortKey="reference" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                  <th className="px-5 py-3">Vendor</th>
                  <SortableHeader label="PO Date" sortKey="date" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                  <th className="px-5 py-3">Status</th>
                  <SortableHeader label="Total Amount" sortKey="total" activeKey={sortKey} sortOrder={sortOrder} onSort={handleSort} align="right" />
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/purchase-orders/${order.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-muted/70"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {order.po_number}
                    </td>
                    <td className="px-5 py-4 font-medium text-text">{order.vendor_name ?? `Vendor #${order.vendor_id}`}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-text-muted">{formatDate(order.order_date)}</td>
                    <td className="px-5 py-4"><PoStatusBadge status={order.status} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-semibold text-text">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/purchase-orders/${order.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/40"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!listQuery.isLoading && !listQuery.isError && total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-text-muted">
            <span>Page {page} of {pages}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pages, current + 1))}
                disabled={page >= pages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </DashboardTableCard>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortOrder,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;
  const Icon = sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={`px-5 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-primary-600"
      >
        {label}
        {active && <Icon className="h-3 w-3" />}
      </button>
    </th>
  );
}
```

- [ ] **Step 3: Point the route at the new page**

Replace the contents of `frontend/src/app/(app)/purchase-orders/page.tsx` with:

```tsx
import { PurchaseOrdersListPage } from "@/features/purchase-orders/purchase-orders-list-page";

export default function PurchaseOrdersPage() {
  return <PurchaseOrdersListPage />;
}
```

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run lint && npx tsc --noEmit`
Expected: clean (0 errors). Note: `orders-list-page.tsx` still imports `fetchPurchaseOrdersPage` from `orders-api.ts` — that file is untouched at this point, so everything still compiles.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/purchase-orders/po-status-badge.tsx frontend/src/features/purchase-orders/purchase-orders-list-page.tsx "frontend/src/app/(app)/purchase-orders/page.tsx"
git commit -m "feat(frontend): rebuild purchase orders list screen"
```

---

## Task 10: Detail screen

**Files:**
- Create: `frontend/src/features/purchase-orders/purchase-order-detail-page.tsx`
- Create: `frontend/src/app/(app)/purchase-orders/[id]/page.tsx`

- [ ] **Step 1: Create the detail page**

Create `frontend/src/features/purchase-orders/purchase-order-detail-page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CheckCircle2, Pencil, Receipt } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { DashboardPanel, DashboardTableCard } from "@/features/dashboard/components/dashboard-card";
import { ApiError } from "@/lib/api";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import {
  cancelPurchaseOrder,
  confirmPurchaseOrder,
  fetchAnalyticAccounts,
  fetchPurchaseOrder,
} from "./purchase-orders-api";
import { PoStatusBadge } from "./po-status-badge";

export function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = String(params.id);

  const [dialog, setDialog] = useState<"confirm" | "cancel" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const poQuery = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => fetchPurchaseOrder(id),
    retry: false,
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytic-accounts"],
    queryFn: fetchAnalyticAccounts,
  });

  function invalidatePo() {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
  }

  const confirmMutation = useMutation({
    mutationFn: () => confirmPurchaseOrder(id),
    onSuccess: () => {
      setDialog(null);
      setActionError(null);
      invalidatePo();
    },
    onError: (err) => {
      setDialog(null);
      setActionError(err instanceof ApiError ? err.message : "Could not confirm the purchase order.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchaseOrder(id),
    onSuccess: () => {
      setDialog(null);
      setActionError(null);
      invalidatePo();
    },
    onError: (err) => {
      setDialog(null);
      setActionError(err instanceof ApiError ? err.message : "Could not cancel the purchase order.");
    },
  });

  if (poQuery.isLoading) {
    return <div className="flex justify-center py-24"><LoadingSpinner /></div>;
  }

  if (poQuery.isError || !poQuery.data) {
    const notFound = poQuery.error instanceof ApiError && poQuery.error.status === 404;
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold text-text">
          {notFound ? "Purchase order not found" : "Could not load the purchase order"}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {notFound ? "It may have been removed, or the link is wrong." : "Please try again in a moment."}
        </p>
        <Link href="/purchase-orders" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Purchase Orders
        </Link>
      </div>
    );
  }

  const po = poQuery.data;
  const analytics = analyticsQuery.data ?? [];
  const analyticName = (analyticId?: number | null) =>
    analyticId ? analytics.find((a) => a.id === analyticId)?.name ?? "—" : "—";
  const busy = confirmMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb + title + actions */}
      <div>
        <Link
          href="/purchase-orders"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Purchase Orders
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-text">{po.po_number}</h1>
              <PoStatusBadge status={po.status} />
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {po.vendor_name ?? `Vendor #${po.vendor_id}`} · Ordered {formatDate(po.order_date)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {po.status === "draft" && (
              <>
                <button
                  type="button"
                  onClick={() => setDialog("confirm")}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm
                </button>
                <Link
                  href={`/purchase-orders/${po.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-muted"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setDialog("cancel")}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                >
                  <Ban className="h-4 w-4" />
                  Cancel
                </button>
              </>
            )}
            {po.status === "confirmed" && (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  disabled
                  title="Vendor Bill workflow lands next"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white opacity-50"
                >
                  <Receipt className="h-4 w-4" />
                  Create Bill
                </button>
                <span className="text-[11px] text-text-muted">Next step: Vendor Bill</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Status banner */}
      {po.status === "confirmed" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Confirmed{po.confirmed_at ? ` on ${formatDateTime(po.confirmed_at)}` : ""}. Ready to convert to a vendor bill.
          </span>
        </div>
      )}
      {po.status === "cancelled" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          <Ban className="h-4 w-4 shrink-0" />
          <span>This purchase order was cancelled.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line items */}
        <div className="lg:col-span-2">
          <DashboardTableCard title="Line Items" tone="indigo" count={`${po.lines.length} item${po.lines.length === 1 ? "" : "s"}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="w-12 px-4 py-2.5">Sr</th>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Purchase Account</th>
                    <th className="px-4 py-2.5">Budget Analytics</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {po.lines.map((line, index) => (
                    <tr key={line.id}>
                      <td className="px-4 py-3 text-text-muted">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-text">{line.product_name ?? `Product #${line.product_id}`}</td>
                      <td className="px-4 py-3 text-text-muted">{line.account_name ?? "Purchase Expense"}</td>
                      <td className="px-4 py-3 text-text-muted">{analyticName(line.analytic_account_id)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-text-muted">{line.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-text-muted">{formatINR(line.unit_price)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-text">{formatINR(line.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardTableCard>
        </div>

        {/* Summary rail */}
        <DashboardPanel id="po-summary" className="h-fit space-y-4">
          <h3 className="text-sm font-semibold text-text">Summary</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Vendor</dt>
              <dd className="font-medium text-text">{po.vendor_name ?? `Vendor #${po.vendor_id}`}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">PO Date</dt>
              <dd className="font-medium text-text">{formatDate(po.order_date)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Status</dt>
              <dd><PoStatusBadge status={po.status} /></dd>
            </div>
            {po.confirmed_at && (
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Confirmed At</dt>
                <dd className="font-medium text-text">{formatDateTime(po.confirmed_at)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="text-text-muted">Subtotal</dt>
              <dd className="font-mono font-medium text-text">{formatINR(po.total)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-semibold text-text">Total Amount</dt>
              <dd className="font-mono text-lg font-bold text-primary-600">{formatINR(po.total)}</dd>
            </div>
            <p className="text-right text-[11px] text-text-muted">Currency: INR ₹</p>
          </dl>
        </DashboardPanel>
      </div>

      <ConfirmDialog
        open={dialog === "confirm"}
        title="Confirm purchase order"
        message={`Confirm ${po.po_number}? Only draft orders can be confirmed. This locks the order for billing.`}
        confirmLabel="Confirm"
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "cancel"}
        title="Cancel purchase order"
        message={`Cancel ${po.po_number}? This cannot be undone.`}
        confirmLabel="Cancel order"
        destructive
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the route**

Create `frontend/src/app/(app)/purchase-orders/[id]/page.tsx`:

```tsx
import { PurchaseOrderDetailPage } from "@/features/purchase-orders/purchase-order-detail-page";

export default function PurchaseOrderDetail() {
  return <PurchaseOrderDetailPage />;
}
```

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run lint && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/purchase-orders/purchase-order-detail-page.tsx "frontend/src/app/(app)/purchase-orders/[id]/page.tsx"
git commit -m "feat(frontend): add purchase order detail screen"
```

---

## Task 11: New / Edit form screens

**Files:**
- Create: `frontend/src/features/purchase-orders/purchase-order-form-page.tsx`
- Create: `frontend/src/app/(app)/purchase-orders/new/page.tsx`
- Create: `frontend/src/app/(app)/purchase-orders/[id]/edit/page.tsx`

- [ ] **Step 1: Create the form page**

Create `frontend/src/features/purchase-orders/purchase-order-form-page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Plus, Trash2 } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-card";
import { ApiError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import {
  createPurchaseOrder,
  confirmPurchaseOrder,
  fetchAnalyticAccounts,
  fetchExpenseAccounts,
  fetchNextPoNumberPreview,
  fetchProducts,
  fetchPurchaseOrder,
  fetchVendors,
  updatePurchaseOrder,
  type PurchaseOrderInput,
} from "./purchase-orders-api";

interface LineState {
  key: number;
  productId: string;
  accountId: string;
  analyticId: string;
  quantity: string;
  unitPrice: string;
}

let nextLineKey = 1;
function emptyLine(): LineState {
  return { key: nextLineKey++, productId: "", accountId: "", analyticId: "", quantity: "1", unitPrice: "" };
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

export function PurchaseOrderFormPage({ mode }: { mode: "new" | "edit" }) {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const poId = mode === "edit" ? String(params.id) : null;

  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOpen, setVendorOpen] = useState(false);
  const [poDate, setPoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<LineState[]>([emptyLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const vendorsQuery = useQuery({ queryKey: ["vendors"], queryFn: fetchVendors });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const accountsQuery = useQuery({ queryKey: ["expense-accounts"], queryFn: fetchExpenseAccounts });
  const analyticsQuery = useQuery({ queryKey: ["analytic-accounts"], queryFn: fetchAnalyticAccounts });
  const nextPoQuery = useQuery({
    queryKey: ["next-po-number"],
    queryFn: fetchNextPoNumberPreview,
    enabled: mode === "new",
  });
  const existingPoQuery = useQuery({
    queryKey: ["purchase-order", poId],
    queryFn: () => fetchPurchaseOrder(poId!),
    enabled: mode === "edit" && !!poId,
  });

  const vendors = vendorsQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const analytics = analyticsQuery.data ?? [];

  // Edit mode: prefill from the loaded PO; non-drafts bounce back to detail.
  useEffect(() => {
    if (mode !== "edit" || !existingPoQuery.data) return;
    const po = existingPoQuery.data;
    if (po.status !== "draft") {
      router.replace(`/purchase-orders/${po.id}`);
      return;
    }
    setVendorId(po.vendor_id);
    setVendorSearch(po.vendor_name ?? "");
    setPoDate(po.order_date.slice(0, 10));
    setLines(
      po.lines.map((line) => ({
        key: nextLineKey++,
        productId: String(line.product_id),
        accountId: line.account_id ? String(line.account_id) : "",
        analyticId: line.analytic_account_id ? String(line.analytic_account_id) : "",
        quantity: String(line.quantity),
        unitPrice: String(line.unit_price),
      }))
    );
  }, [mode, existingPoQuery.data, router]);

  // Default every line's Purchase Account to "Purchase Expense" (code 5010).
  const defaultAccountId = useMemo(
    () => accounts.find((a) => a.code === "5010")?.id,
    [accounts]
  );
  useEffect(() => {
    if (!defaultAccountId) return;
    setLines((current) =>
      current.map((line) => (line.accountId ? line : { ...line, accountId: String(defaultAccountId) }))
    );
  }, [defaultAccountId]);

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.toLowerCase().trim();
    if (!q) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendors, vendorSearch]);

  function updateLine(key: number, patch: Partial<LineState>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: number) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.key !== key) : current));
  }

  function lineTotal(line: LineState): number {
    const qty = parseFloat(line.quantity);
    const price = parseFloat(line.unitPrice);
    if (isNaN(qty) || isNaN(price)) return 0;
    return qty * price;
  }

  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  // Totals computed inline (not via lineTotal) to keep exhaustive-deps happy.
  const exceededAnalytics = useMemo(() => {
    const totals = new Map<number, number>();
    for (const line of lines) {
      if (!line.analyticId) continue;
      const qty = parseFloat(line.quantity);
      const price = parseFloat(line.unitPrice);
      if (isNaN(qty) || isNaN(price)) continue;
      const id = Number(line.analyticId);
      totals.set(id, (totals.get(id) ?? 0) + qty * price);
    }
    return analytics.filter((a) => (totals.get(a.id) ?? 0) > a.remaining_amount);
  }, [lines, analytics]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!vendorId) next.vendor = "Vendor is required";
    if (!poDate) next.poDate = "PO date is required";
    if (lines.length === 0) next.lines = "At least one line item is required";
    for (const line of lines) {
      if (!line.productId) next[`line-${line.key}-product`] = "Product is required";
      const qty = parseFloat(line.quantity);
      if (isNaN(qty) || qty <= 0) next[`line-${line.key}-quantity`] = "Quantity must be greater than zero";
      const price = parseFloat(line.unitPrice);
      if (line.unitPrice === "" || isNaN(price) || price < 0)
        next[`line-${line.key}-unitPrice`] = "Unit price cannot be negative";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildPayload(): PurchaseOrderInput {
    return {
      vendor_id: vendorId!,
      order_date: new Date(`${poDate}T00:00:00`).toISOString(),
      lines: lines.map((line) => ({
        product_id: Number(line.productId),
        account_id: line.accountId ? Number(line.accountId) : null,
        analytic_account_id: line.analyticId ? Number(line.analyticId) : null,
        quantity: parseFloat(line.quantity),
        unit_price: parseFloat(line.unitPrice),
      })),
    };
  }

  function invalidatePoQueries() {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-order"] });
    queryClient.invalidateQueries({ queryKey: ["analytic-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["next-po-number"] });
  }

  const saveMutation = useMutation({
    mutationFn: (payload: PurchaseOrderInput) =>
      mode === "edit" && poId ? updatePurchaseOrder(poId, payload) : createPurchaseOrder(payload),
  });

  function errorMessage(err: unknown): string {
    return err instanceof ApiError ? err.message : "Could not save the purchase order.";
  }

  function handleSaveDraft() {
    if (!validate()) return;
    setSubmitError(null);
    saveMutation.mutate(buildPayload(), {
      onSuccess: (po) => {
        invalidatePoQueries();
        router.push(`/purchase-orders/${po.id}`);
      },
      onError: (err) => setSubmitError(errorMessage(err)),
    });
  }

  function handleConfirm() {
    if (!validate()) return;
    setSubmitError(null);
    saveMutation.mutate(buildPayload(), {
      onSuccess: (po) => {
        confirmPurchaseOrder(String(po.id))
          .catch(() => undefined) // order exists as draft; detail screen can retry confirm
          .finally(() => {
            invalidatePoQueries();
            router.push(`/purchase-orders/${po.id}`);
          });
      },
      onError: (err) => setSubmitError(errorMessage(err)),
    });
  }

  if (mode === "edit" && existingPoQuery.isLoading) {
    return <div className="flex justify-center py-24"><LoadingSpinner /></div>;
  }

  const busy = saveMutation.isPending;
  const title = mode === "edit" ? `Edit ${existingPoQuery.data?.po_number ?? "Purchase Order"}` : "New Purchase Order";

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb + title */}
      <div>
        <Link
          href="/purchase-orders"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Purchase Orders
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {mode === "edit" ? "Update the draft order, then save your changes." : "Create a draft purchase order, then save or confirm it."}
        </p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          {submitError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order details */}
          <DashboardPanel id="po-details" className="space-y-4">
            <h3 className="text-sm font-semibold text-text">Order Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  PO Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={mode === "edit" ? existingPoQuery.data?.po_number ?? "" : nextPoQuery.data ?? "…"}
                  className={`${inputClass} cursor-not-allowed bg-surface-muted font-mono`}
                />
                <p className="mt-1 text-[11px] text-text-muted">Auto-assigned on save</p>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Status
                </label>
                <input type="text" readOnly value="Draft" className={`${inputClass} cursor-not-allowed bg-surface-muted`} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Vendor Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(event) => {
                      setVendorSearch(event.target.value);
                      setVendorId(null);
                      setVendorOpen(true);
                    }}
                    onFocus={() => setVendorOpen(true)}
                    onBlur={() => setTimeout(() => setVendorOpen(false), 150)}
                    placeholder="Search vendors..."
                    className={inputClass}
                  />
                  {vendorOpen && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
                      {filteredVendors.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-text-muted">No vendors found</div>
                      ) : (
                        filteredVendors.map((vendor) => (
                          <button
                            key={vendor.id}
                            type="button"
                            onMouseDown={() => {
                              setVendorId(vendor.id);
                              setVendorSearch(vendor.name);
                              setVendorOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-surface-muted"
                          >
                            <span className="font-medium text-text">{vendor.name}</span>
                            {vendor.city && <span className="text-text-muted">{vendor.city}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.vendor && <p className="mt-1 text-xs text-destructive">{errors.vendor}</p>}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  PO Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(event) => setPoDate(event.target.value)}
                  className={inputClass}
                />
                {errors.poDate && <p className="mt-1 text-xs text-destructive">{errors.poDate}</p>}
              </div>
            </div>
          </DashboardPanel>

          {/* Line items */}
          <DashboardPanel id="po-lines" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Line Items</h3>
              <button
                type="button"
                onClick={() => setLines((current) => [...current, emptyLine()])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Line
              </button>
            </div>
            {errors.lines && <p className="text-xs text-destructive">{errors.lines}</p>}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="w-10 px-3 py-2.5">Sr</th>
                    <th className="min-w-44 px-3 py-2.5">Product</th>
                    <th className="min-w-36 px-3 py-2.5">Purchase Account</th>
                    <th className="min-w-36 px-3 py-2.5">Budget Analytics</th>
                    <th className="w-24 px-3 py-2.5 text-right">Qty</th>
                    <th className="w-28 px-3 py-2.5 text-right">Unit Price</th>
                    <th className="w-28 px-3 py-2.5 text-right">Total</th>
                    <th className="w-10 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((line, index) => (
                    <tr key={line.key} className="align-top">
                      <td className="px-3 py-3 text-text-muted">{index + 1}</td>
                      <td className="px-3 py-2">
                        <select
                          value={line.productId}
                          onChange={(event) => {
                            const product = products.find((p) => String(p.id) === event.target.value);
                            updateLine(line.key, {
                              productId: event.target.value,
                              unitPrice: product?.cost != null ? String(product.cost) : line.unitPrice,
                            });
                          }}
                          className={inputClass}
                        >
                          <option value="">Select product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} — Cost {formatINR(product.cost ?? 0)}
                            </option>
                          ))}
                        </select>
                        {errors[`line-${line.key}-product`] && (
                          <p className="mt-1 text-[11px] text-destructive">{errors[`line-${line.key}-product`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={line.accountId}
                          onChange={(event) => updateLine(line.key, { accountId: event.target.value })}
                          className={inputClass}
                        >
                          <option value="">Purchase Expense</option>
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={line.analyticId}
                          onChange={(event) => updateLine(line.key, { analyticId: event.target.value })}
                          className={inputClass}
                        >
                          <option value="">None</option>
                          {analytics.map((analytic) => (
                            <option key={analytic.id} value={analytic.id}>
                              {analytic.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.quantity}
                          onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                          className={`${inputClass} text-right`}
                        />
                        {errors[`line-${line.key}-quantity`] && (
                          <p className="mt-1 text-[11px] text-destructive">{errors[`line-${line.key}-quantity`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                          className={`${inputClass} text-right font-mono`}
                        />
                        {errors[`line-${line.key}-unitPrice`] && (
                          <p className="mt-1 text-[11px] text-destructive">{errors[`line-${line.key}-unitPrice`]}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-mono font-semibold text-text">
                        {formatINR(lineTotal(line))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          disabled={lines.length === 1}
                          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/30"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {exceededAnalytics.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Exceeds Approved Budget</p>
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {exceededAnalytics.map((analytic) => (
                      <li key={analytic.id}>
                        {analytic.name} — remaining budget {formatINR(analytic.remaining_amount)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </DashboardPanel>
        </div>

        {/* Summary rail */}
        <DashboardPanel id="po-summary" className="h-fit space-y-4 lg:sticky lg:top-20">
          <h3 className="text-sm font-semibold text-text">Summary</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Subtotal</dt>
              <dd className="font-mono font-medium text-text">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="font-semibold text-text">Total Amount</dt>
              <dd className="font-mono text-lg font-bold text-primary-600">{formatINR(subtotal)}</dd>
            </div>
            <p className="text-right text-[11px] text-text-muted">Currency: INR ₹</p>
          </dl>
          <div className="space-y-2 border-t border-border pt-4">
            {mode === "new" ? (
              <>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={busy}
                  className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={busy}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface-muted disabled:opacity-50"
                >
                  Save as Draft
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={busy}
                className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(mode === "edit" && poId ? `/purchase-orders/${poId}` : "/purchase-orders")}
              disabled={busy}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the routes**

Create `frontend/src/app/(app)/purchase-orders/new/page.tsx`:

```tsx
import { PurchaseOrderFormPage } from "@/features/purchase-orders/purchase-order-form-page";

export default function NewPurchaseOrderPage() {
  return <PurchaseOrderFormPage mode="new" />;
}
```

Create `frontend/src/app/(app)/purchase-orders/[id]/edit/page.tsx`:

```tsx
import { PurchaseOrderFormPage } from "@/features/purchase-orders/purchase-order-form-page";

export default function EditPurchaseOrderPage() {
  return <PurchaseOrderFormPage mode="edit" />;
}
```

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run lint && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/purchase-orders/purchase-order-form-page.tsx "frontend/src/app/(app)/purchase-orders/new/page.tsx" "frontend/src/app/(app)/purchase-orders/[id]/edit/page.tsx"
git commit -m "feat(frontend): add purchase order form screens"
```

---

## Task 12: Simplify the header to the Stitch clean top nav

Replaces the dropdown/mega-menu/search chrome with flat nav pills per the Stitch reference and the brief's nav list. `NAV_CATEGORIES` is only used inside `site-header.tsx`, and `SiteHeader` is only imported by `(app)/layout.tsx` — the rewrite is contained. The unused `site-sidebar.tsx` stays on disk, unmounted (zero risk, easy rollback).

**Files:**
- Modify: `frontend/src/components/site-header.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the header**

Replace the entire contents of `frontend/src/components/site-header.tsx` with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Armchair, LogOut, Menu, Moon, Sun, User, X } from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Sales", href: "/sales-orders", roles: ["admin", "invoicing_user"] },
  { label: "Purchase Orders", href: "/purchase-orders", roles: ["admin", "invoicing_user"] },
  { label: "Master Data", href: "#", roles: ["admin", "invoicing_user"] },
  { label: "Journals", href: "#", roles: ["admin", "invoicing_user"] },
  { label: "Reports", href: "#", roles: ["admin", "invoicing_user"] },
  { label: "User Management", href: "/admin/users", roles: ["admin"] },
  { label: "Portal Invoices", href: "#", roles: ["contact"] },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Admin</span>;
  }
  if (role === "invoicing_user") {
    return <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Accountant</span>;
  }
  return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Portal</span>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const userRole = user?.role || "invoicing_user";
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(userRole));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="rounded-xl bg-primary-600 p-2 text-white shadow-sm shadow-primary-500/20">
            <Armchair className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="block text-sm font-bold leading-tight tracking-tight text-text sm:text-base">
              Urban<span className="text-primary-600">Furniture</span>
            </span>
            <span className="block text-[11px] leading-none text-text-muted">Accounting System</span>
          </div>
        </Link>

        {/* Flat nav pills (Stitch clean top nav) */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-primary-50 font-semibold text-primary-600 shadow-sm dark:bg-primary-950/40 dark:text-primary-400"
                    : "font-medium text-text-muted hover:bg-surface-muted hover:text-text"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: user + theme + sign out + mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="hidden items-center gap-2 rounded-xl border border-border/70 bg-surface-muted/40 px-2.5 py-1.5 text-xs lg:flex">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[120px] truncate font-medium text-text">{user.name}</div>
              <RoleBadge role={user.role} />
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text transition-colors hover:bg-surface-muted"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text sm:flex"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text transition-colors hover:bg-surface-muted md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          {user && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-border/70 bg-surface-muted/40 p-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-text">{user.name}</div>
                <div className="text-[11px] text-text-muted">{user.login_id ? `@${user.login_id}` : user.email}</div>
              </div>
              <RoleBadge role={user.role} />
            </div>
          )}
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary-50 font-semibold text-primary-600 dark:bg-primary-950/40 dark:text-primary-400"
                      : "font-medium text-text-muted hover:bg-surface-muted hover:text-text"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd frontend && npm run lint && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/site-header.tsx
git commit -m "refactor(frontend): simplify header to flat top nav"
```

---

## Task 13: Remove the dormant purchase branch from the shared orders files

After Task 9, `/purchase-orders` uses the new feature module, so the purchase code path in `features/orders/` is unreachable. Remove it so there is one honest home for PO code. `/sales-orders` (`OrdersListPage kind="sales"`) keeps working unchanged.

**Files:**
- Modify: `frontend/src/features/orders/orders-list-page.tsx`
- Modify: `frontend/src/features/orders/orders-api.ts`

- [ ] **Step 1: Trim the API file**

In `frontend/src/features/orders/orders-api.ts`:

a) Remove the `apiFetch` import and the `PurchaseOrder` type import, so the import block is:

```typescript
import { buildDashboardDataFromBackend } from "@/features/dashboard/dashboard-data";
import {
  fetchDashboardContacts,
  fetchDashboardProducts,
} from "@/features/dashboard/dashboard-api";
import type { SalesOrder } from "@/lib/types";
```

b) Delete these declarations entirely: `OrderListResult`, `PurchaseOrderListResponse`, `formatOrderDate`, `mapPurchaseOrderStatus`, `mapPurchaseOrder`, `fetchPurchaseOrders`, `fetchPurchaseOrdersPage`.

What remains: the imports above and `fetchSalesOrders`.

- [ ] **Step 2: Trim the list page**

In `frontend/src/features/orders/orders-list-page.tsx`:

a) Change the API import to:

```typescript
import { fetchSalesOrders } from "./orders-api";
```

b) Delete the entire second `useEffect` (the one starting `if (isSales) return;` that calls `fetchPurchaseOrdersPage`).

c) Narrow the state to sales orders: change `useState<(SalesOrder | PurchaseOrder)[]>([])` to `useState<SalesOrder[]>([])`, remove `PurchaseOrder` from the `@/lib/types` import, and delete the now-unused `isSalesOrder` type-guard function.

d) In `filteredOrders`, change:

```typescript
    const matchingOrders = isSales
      ? orders.filter((order) => {
```

to:

```typescript
    const matchingOrders = orders.filter((order) => {
```

fix the indentation of the filter body accordingly, and delete the line `if (!isSales) return matchingOrders;`.

e) Replace the whole `getSortValue` (its purchase branch would otherwise leave a code path with no return) with the sales-only version:

```typescript
    const getSortValue = (order: SalesOrder): string | number => {
      if (sortKey === "reference") return order.so_number;
      if (sortKey === "partner") return order.customer_name;
      if (sortKey === "date") return order.so_date;
      return order.total_amount;
    };
```

f) Replace the pagination/summary derivations:

```typescript
  const visibleOrders = isSales
    ? filteredOrders.slice((page - 1) * pageSize, page * pageSize)
    : filteredOrders;
  const totalCount = isSales ? filteredOrders.length : serverTotal;
  const totalPages = isSales
    ? Math.max(1, Math.ceil(filteredOrders.length / pageSize))
    : Math.max(1, serverPages);

  const summaryOrders = isSales ? orders : visibleOrders;
```

with:

```typescript
  const visibleOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);
  const totalCount = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const summaryOrders = orders;
```

g) Delete the now-unused `serverTotal`/`serverPages` state declarations and the `setServerTotal(orders.length);` / `setServerPages(1);` lines in the sales effect.

h) In the table body, simplify the union-type guards (all rows are `SalesOrder` now): `{"order_number" in order ? order.order_number : order.po_number}` → `{order.order_number}`; the same for the partner cell (`order.customer_name`) and the date cell (`order.so_date`). The status cell ternary is unchanged.

i) In the Vendor/Customer `SortableHeader`, remove `disabled={!isSales}`. Then remove the now-unused `disabled` prop from the `SortableHeader` component (its props type, the `disabled = false` default, and the two `disabled`-aware class/expression spots).

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run lint && npx tsc --noEmit && npm run build`
Expected: lint clean, tsc clean, build succeeds. `/sales-orders` still renders (spot-check in the browser if the dev server is running).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/orders/orders-list-page.tsx frontend/src/features/orders/orders-api.ts
git commit -m "refactor(frontend): remove dormant purchase order code"
```

---

## Task 14: Docs + end-to-end verification

**Files:**
- Modify: `docs/TASK_BOARD.md`
- Modify: `docs/frontend/LOGIC.md`

- [ ] **Step 1: Backend verification**

Run: `cd backend && .venv/bin/python -m pytest tests/test_purchase_orders.py -v`
Expected: 7 passed.

- [ ] **Step 2: Frontend verification**

Run: `cd frontend && npm run lint && npx tsc --noEmit && npm run build`
Expected: all clean.

- [ ] **Step 3: Browser golden path** (backend on :8000, frontend on :3000, seed run)

1. Login → header shows flat pills: Dashboard, Sales, Purchase Orders, Master Data, Journals, Reports.
2. `/purchase-orders` shows the 3 seeded POs (PO-0001 Confirmed ₹5,000 · PO-0002 Draft ₹12,500 · PO-0003 Confirmed ₹8,400), 4 KPI cards, search, status filter including Cancelled, sortable columns, pagination footer.
3. Row click → detail screen. PO-0002 (Draft): Confirm / Edit / Cancel actions. PO-0001 (Confirmed): confirmation timestamp banner + disabled Create Bill.
4. New Purchase Order: PO number preview shows next number; vendor type-ahead works; picking Wooden Chair auto-fills ₹500; totals update live; set Quantity 200 on Furniture Project → "Exceeds Approved Budget" banner appears; submit empty form → inline validation errors.
5. Save as Draft → lands on detail (Draft). Confirm → status flips to Confirmed with timestamp. Edit a draft → change lines → Save Changes → total updates. Cancel a draft → Cancelled badge; list shows it under the Cancelled filter.

- [ ] **Step 4: Update the task board**

In `docs/TASK_BOARD.md`:
- Update the `**Last updated:**` line with the current time and a note: "Purchase Orders module complete (list/form/detail, confirm/cancel, budget analytics, seeded demo data)".
- Add a DONE entry under the Frontend group:

```markdown
- [x] **P0-FE-18** — Purchase Orders module (list + form + detail, live API) · Sourabh · 5 Sep — Evidence: `/purchase-orders` list with KPI cards/search/filter/sort/pagination, `/purchase-orders/new` + `[id]/edit` form with line items and budget warning, `/purchase-orders/[id]` detail with Confirm/Edit/Cancel; backend cancel/edit/confirmed_at + analytic-accounts endpoints; `pytest tests/test_purchase_orders.py` 7 passed; lint + tsc + build clean
```

- [ ] **Step 5: Update LOGIC.md**

In `docs/frontend/LOGIC.md`, update the two Purchase Order rows:

```markdown
| **P0** | Purchase Orders List | `/purchase-orders` | View list of POs, filter by status, server-side sort and pagination, quick action to create | loading / empty / error / success | Implemented with live API |
| **P0** | Purchase Order Detail | `/purchase-orders/[id]` | Track PO status, confirm/cancel drafts, edit drafts, inspect lines and budget analytics | loading / mutating / error / success / not-found | Implemented with live API; Create Bill queued for next workflow |
```

- [ ] **Step 6: Commit**

```bash
git add docs/TASK_BOARD.md docs/frontend/LOGIC.md
git commit -m "docs: update task board for purchase orders module"
```

---

## Self-review notes (already applied)

- **Spec coverage:** §3.1→Task 4, §3.2→Task 5, §3.3→Task 3, §3.4→Task 6, §3.5→Task 7, §3.6→Task 2, §4.1/4.2→Tasks 8–11, §4.3→Task 9, §4.4→Task 11, §4.5→Task 10, §4.6→Task 11 validation, §4.7→Task 8, §5→Tasks 9–12, §6→Tasks 10–11 error states, §7→Task 14.
- **Type consistency:** frontend `PurchaseOrder` (feature module, numeric id, lowercase status) is distinct from `lib/types` `PurchaseOrder` (demo adapter, kept for the dashboard page) — called out in the Task 8 code comments. `PoStatusBadge` consumes the feature-module `PurchaseOrderStatus`. Query keys match across Tasks 9–11 (`purchase-orders`, `purchase-order`, `analytic-accounts`, `next-po-number`).
- **Known pre-existing issues deliberately out of scope:** `test_auth.py` syntax error and the 401 failures in `test_contacts.py` / `test_products.py` / `test_pagination_and_sorting.py`.
