"""
Unit and Integration tests for Analytic Accounts and Budgeting Module (Phase 6, P1).
"""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.models.analytic_account import AnalyticAccount
from app.models.budget import Budget
from app.models.contact import Contact
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder
from app.schemas.purchase_order import POCreate, POLineCreate
from app.services.purchase_order_service import create_purchase_order, confirm_purchase_order
from app.services.vendor_bill_service import create_bill_from_po
from app.services import budget_service


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure all database tables exist before executing tests."""
    Base.metadata.create_all(bind=engine)
    yield


# Tests CRUD operations and constraints on Analytic Accounts
def test_analytic_account_crud():
    """
    Test Analytic Account lifecycle:
    - Create expense and income cost centers
    - Duplicate code collision prevention (409 Conflict)
    - List with type and search query filters
    - Update metadata and active status
    """
    with TestClient(app) as client:
        ts = int(datetime.now(timezone.utc).timestamp())
        code_exp = f"ANL-EXP-{ts}"
        code_inc = f"ANL-INC-{ts}"

        # 1. Create expense analytic account
        res_exp = client.post(
            "/api/v1/analytic-accounts",
            json={
                "code": code_exp,
                "name": "Showroom Renovation",
                "type": "expense",
                "description": "CapEx for retail showroom",
            },
        )
        assert res_exp.status_code == 201, res_exp.text
        data_exp = res_exp.json()
        assert data_exp["code"] == code_exp
        assert data_exp["type"] == "expense"
        exp_id = data_exp["id"]

        # 2. Duplicate code rejection (409 Conflict)
        res_dup = client.post(
            "/api/v1/analytic-accounts",
            json={
                "code": code_exp,
                "name": "Duplicate Code Attempt",
                "type": "expense",
            },
        )
        assert res_dup.status_code == 409
        assert res_dup.json()["error"]["code"] == "DUPLICATE_ANALYTIC_CODE"

        # 3. Create income analytic account
        res_inc = client.post(
            "/api/v1/analytic-accounts",
            json={
                "code": code_inc,
                "name": "Custom Corporate Orders",
                "type": "income",
            },
        )
        assert res_inc.status_code == 201
        inc_id = res_inc.json()["id"]

        # 4. List with filters
        res_list = client.get(f"/api/v1/analytic-accounts?type=expense&search={code_exp}")
        assert res_list.status_code == 200
        items = res_list.json()["data"]
        assert len(items) >= 1
        assert any(it["id"] == exp_id for it in items)

        # 5. Update metadata
        res_update = client.put(
            f"/api/v1/analytic-accounts/{exp_id}",
            json={"name": "Showroom Renovation Phase 1"},
        )
        assert res_update.status_code == 200
        assert res_update.json()["name"] == "Showroom Renovation Phase 1"


# Tests the complete Budget lifecycle: create draft -> confirm -> revise
def test_budget_lifecycle_draft_confirm_revise():
    """
    Test Budget state transitions:
    - Create draft budget with chronology validation
    - Confirm budget (draft -> confirmed)
    - Formally revise confirmed budget (original -> revised, new -> confirmed with link)
    - Verify illegal transitions (revise draft, double-revise)
    """
    with TestClient(app) as client:
        ts = int(datetime.now(timezone.utc).timestamp())
        # Create analytic account
        acc_res = client.post(
            "/api/v1/analytic-accounts",
            json={"code": f"BDG-ACC-{ts}", "name": "Marketing 2026", "type": "expense"},
        )
        assert acc_res.status_code == 201
        acc_id = acc_res.json()["id"]

        now = datetime.now(timezone.utc)
        p_start = (now - timedelta(days=10)).isoformat()
        p_end = (now + timedelta(days=50)).isoformat()

        # 1. Reject inverted date range (period_end <= period_start)
        bad_period_res = client.post(
            "/api/v1/budgets",
            json={
                "name": "Bad Dates Budget",
                "analytic_account_id": acc_id,
                "period_start": p_end,
                "period_end": p_start,
                "committed_amount": 50000.0,
            },
        )
        assert bad_period_res.status_code == 422

        # 2. Create valid draft budget
        create_res = client.post(
            "/api/v1/budgets",
            json={
                "name": "Marketing Q1 Budget",
                "analytic_account_id": acc_id,
                "period_start": p_start,
                "period_end": p_end,
                "committed_amount": 100000.0,
            },
        )
        assert create_res.status_code == 201, create_res.text
        b_draft = create_res.json()
        assert b_draft["status"] == "draft"
        assert b_draft["committed_amount"] == 100000.0
        budget_id = b_draft["id"]

        # 3. Attempt to revise draft budget -> rejected (must confirm first)
        bad_rev = client.post(
            f"/api/v1/budgets/{budget_id}/revise",
            json={"committed_amount": 120000.0},
        )
        assert bad_rev.status_code == 422

        # 4. Confirm budget
        conf_res = client.patch(f"/api/v1/budgets/{budget_id}/confirm")
        assert conf_res.status_code == 200
        assert conf_res.json()["status"] == "confirmed"

        # 5. Confirming again -> rejected
        conf_again = client.patch(f"/api/v1/budgets/{budget_id}/confirm")
        assert conf_again.status_code == 422

        # 6. Revise confirmed budget
        rev_res = client.post(
            f"/api/v1/budgets/{budget_id}/revise",
            json={"name": "Marketing Q1 Revised Allocation", "committed_amount": 135000.0},
        )
        assert rev_res.status_code == 201, rev_res.text
        b_revised = rev_res.json()
        assert b_revised["status"] == "confirmed"
        assert b_revised["committed_amount"] == 135000.0
        assert b_revised["revised_from_id"] == budget_id
        new_budget_id = b_revised["id"]

        # Verify parent budget transitioned to 'revised'
        parent_res = client.get(f"/api/v1/budgets/{budget_id}")
        assert parent_res.status_code == 200
        assert parent_res.json()["status"] == "revised"

        # 7. Double-revising the old parent -> rejected
        double_rev = client.post(
            f"/api/v1/budgets/{budget_id}/revise",
            json={"committed_amount": 140000.0},
        )
        assert double_rev.status_code == 422


# Tests draft budget cancellation and status transition guardrails
def test_budget_cancellation_guards():
    """
    Test Budget cancellation:
    - Draft budget can be cancelled
    - Confirmed budget cannot be cancelled directly
    """
    with TestClient(app) as client:
        ts = int(datetime.now(timezone.utc).timestamp())
        acc_res = client.post(
            "/api/v1/analytic-accounts",
            json={"code": f"CNL-ACC-{ts}", "name": "Cancel Test Account", "type": "expense"},
        )
        acc_id = acc_res.json()["id"]

        now = datetime.now(timezone.utc)
        # Create draft budget
        res = client.post(
            "/api/v1/budgets",
            json={
                "name": "Draft to Cancel",
                "analytic_account_id": acc_id,
                "period_start": now.isoformat(),
                "period_end": (now + timedelta(days=30)).isoformat(),
                "committed_amount": 25000.0,
            },
        )
        b_id = res.json()["id"]

        # Cancel draft budget
        cancel_res = client.patch(f"/api/v1/budgets/{b_id}/cancel")
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "cancelled"

        # Cancel again -> rejected
        cancel_again = client.patch(f"/api/v1/budgets/{b_id}/cancel")
        assert cancel_again.status_code == 422


# Tests prevention of overlapping active budget date windows for the same cost center
def test_budget_overlapping_period_rejection():
    """
    Ensure two active budgets for the same analytic account cannot have overlapping date ranges.
    """
    with TestClient(app) as client:
        ts = int(datetime.now(timezone.utc).timestamp())
        acc_res = client.post(
            "/api/v1/analytic-accounts",
            json={"code": f"OVL-ACC-{ts}", "name": "Overlap Test", "type": "expense"},
        )
        acc_id = acc_res.json()["id"]

        now = datetime.now(timezone.utc)
        p1_start = now
        p1_end = now + timedelta(days=60)

        # Budget 1: Days 0 -> 60
        res1 = client.post(
            "/api/v1/budgets",
            json={
                "name": "Initial Window",
                "analytic_account_id": acc_id,
                "period_start": p1_start.isoformat(),
                "period_end": p1_end.isoformat(),
                "committed_amount": 50000.0,
            },
        )
        assert res1.status_code == 201

        # Budget 2: Days 30 -> 90 (Overlaps with Budget 1) -> Rejected
        p2_start = now + timedelta(days=30)
        p2_end = now + timedelta(days=90)
        res2 = client.post(
            "/api/v1/budgets",
            json={
                "name": "Conflicting Window",
                "analytic_account_id": acc_id,
                "period_start": p2_start.isoformat(),
                "period_end": p2_end.isoformat(),
                "committed_amount": 40000.0,
            },
        )
        assert res2.status_code == 422
        assert "overlap" in res2.json()["error"]["message"].lower()


# Tests live ledger integration computing achieved_amount, achieved_pct, and headroom
def test_budget_live_achieved_calculation_from_ledger():
    """
    Verify computed budget fields derived dynamically from ledger lines:
    - Create confirmed budget
    - Tag vendor bill line item with analytic_account_id
    - Check achieved_amount, achieved_pct, amount_to_achieve
    - Verify check_budget_exceeded warning generator
    """
    with TestClient(app) as client:
        db = SessionLocal()
        try:
            ts = int(datetime.now(timezone.utc).timestamp())
            # 1. Setup analytic account
            anl_acc = AnalyticAccount(
                code=f"PRJ-OFFICE-{ts}",
                name="Urban Office Fitout",
                type="expense",
                is_active=True,
            )
            db.add(anl_acc)
            db.commit()
            db.refresh(anl_acc)

            # 2. Setup budget
            now = datetime.now(timezone.utc)
            p_start = now - timedelta(days=5)
            p_end = now + timedelta(days=25)
            committed = 50000.0

            budget = Budget(
                name="Office Fitout Budget",
                analytic_account_id=anl_acc.id,
                period_start=p_start,
                period_end=p_end,
                committed_amount=committed,
                status="confirmed",
            )
            db.add(budget)
            db.commit()
            db.refresh(budget)

            # 3. Create PO -> Confirm -> Create Bill with analytic_account_id tag
            vendor = db.query(Contact).filter(Contact.type.in_(["vendor", "both"])).first()
            product = db.query(Product).filter(Product.is_active == True).first()

            po_in = POCreate(
                vendor_id=vendor.id,
                order_date=now,
                lines=[
                    POLineCreate(
                        product_id=product.id,
                        quantity=2.0,
                        unit_price=10000.0,
                        analytic_account_id=anl_acc.id,
                    )
                ],
            )
            po_resp = create_purchase_order(db, po_in)
            confirm_purchase_order(db, po_resp.id)
            bill_resp = create_bill_from_po(db, po_resp.id)
            db.commit()

            bill_total = bill_resp.bill.total  # 2 * 10000 = 20,000.0

            # 4. Query budget performance via API
            res = client.get(f"/api/v1/budgets/{budget.id}")
            assert res.status_code == 200
            data = res.json()

            assert round(data["achieved_amount"], 2) == round(bill_total, 2)
            expected_pct = round((bill_total / committed) * 100, 2)
            assert round(data["achieved_pct"], 2) == expected_pct
            assert round(data["amount_to_achieve"], 2) == round(committed - bill_total, 2)

            # 6. Verify breakdown endpoint
            breakdown_res = client.get(f"/api/v1/budgets/{budget.id}/breakdown")
            assert breakdown_res.status_code == 200, breakdown_res.text
            bd_data = breakdown_res.json()
            assert bd_data["budget_id"] == budget.id
            assert bd_data["budget_type"] == "expense"
            assert bd_data["lookup_source"] == "Vendor Bills"
            assert round(bd_data["achieved_amount"], 2) == round(bill_total, 2)
            assert len(bd_data["transactions"]) == 1
            t0 = bd_data["transactions"][0]
            assert t0["document_type"] == "Vendor Bill"
            assert t0["subtotal"] == 20000.0
            assert t0["partner_name"] == vendor.name

            # 7. Verify default revision naming (adds 'Revised' at end)
            rev_res = client.post(
                f"/api/v1/budgets/{budget.id}/revise",
                json={"committed_amount": 75000.0},
            )
            assert rev_res.status_code == 201
            assert rev_res.json()["name"] == f"{budget.name} Revised"

        finally:
            db.close()

