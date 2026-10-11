"""
tests/test_billing.py — Unit tests for Dodo Payments checkout and webhook processing.
"""

import pytest
from mone.billing import DodoPaymentsClient, PRODUCTS
from mone.state import Database


def test_create_checkout_session():
    client = DodoPaymentsClient()
    sess = client.create_checkout_session(
        product_key="fuel_10",
        customer_email="judge@neathack.com",
        user_id="user_judge_1",
    )
    assert sess["amount_usd"] == 10.00
    assert "checkout_url" in sess
    assert sess["user_id"] == "user_judge_1"


def test_webhook_payment_succeeded(tmp_path):
    db_file = str(tmp_path / "billing_test.db")
    db = Database(db_path=db_file)
    client = DodoPaymentsClient()

    # Initial balance should be 0
    bal_initial = client.get_user_fuel_balance("user_42", db)
    assert bal_initial["credit_balance_usd"] == 0.00
    assert bal_initial["is_pro_subscriber"] is False

    # Mock webhook event
    mock_event = {
        "type": "payment.succeeded",
        "data": {
            "total_amount": 2500,  # $25.00 in cents
            "metadata": {
                "user_id": "user_42",
                "product_key": "fuel_25",
            },
        },
    }

    res = client.handle_webhook_event(mock_event, db)
    assert res["status"] == "credited"
    assert res["amount_usd"] == 25.00

    # Verify updated balance
    bal_updated = client.get_user_fuel_balance("user_42", db)
    assert bal_updated["credit_balance_usd"] == 25.00


def test_webhook_pro_subscription(tmp_path):
    db_file = str(tmp_path / "billing_sub_test.db")
    db = Database(db_path=db_file)
    client = DodoPaymentsClient()

    mock_event = {
        "type": "subscription.active",
        "data": {
            "metadata": {
                "user_id": "user_pro_99",
                "product_key": "pro_subscription",
            },
        },
    }

    res = client.handle_webhook_event(mock_event, db)
    assert res["status"] == "pro_activated"

    bal = client.get_user_fuel_balance("user_pro_99", db)
    assert bal["is_pro_subscriber"] is True
