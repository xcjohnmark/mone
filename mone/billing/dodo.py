"""
mone.billing.dodo — Dodo Payments Integration (Hackathon Partner).
Provides non-custodial runner compute fuel wallet top-ups ($10, $25) and $49/mo Pro subscriptions.
Strict Non-Custodial Principle: The agent NEVER takes custody of user exchange funds on Kalshi or Polymarket.
"""

import hashlib
import hmac
import json
import logging
import urllib.request
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

from mone.config import MoneConfig, get_config
from mone.state.db import Database

logger = logging.getLogger("mone.billing.dodo")


# Standard Dodo Payments Products for mone
PRODUCTS = {
    "fuel_10": {
        "name": "Runner Compute Fuel (100 Cycles)",
        "amount_usd": 10.00,
        "credits_usd": 10.00,
        "type": "one_time",
    },
    "fuel_25": {
        "name": "Runner Compute Fuel (300 Cycles)",
        "amount_usd": 25.00,
        "credits_usd": 25.00,
        "type": "one_time",
    },
    "pro_subscription": {
        "name": "mone Pro SaaS Subscription",
        "amount_usd": 49.00,
        "type": "subscription",
        "interval": "month",
    },
}


class DodoPaymentsClient:
    """
    Client for Dodo Payments API.
    Handles checkout session creation, webhook signature validation, and fuel credit balancing.
    """

    def __init__(self, config: Optional[MoneConfig] = None):
        self.config = config or get_config()
        self.api_key = self.config.dodo_payments_api_key
        self.webhook_secret = self.config.dodo_payments_webhook_secret
        self.environment = self.config.dodo_payments_environment or "test"

        if self.environment == "live":
            self.base_url = "https://live.dodopayments.com"
        else:
            self.base_url = "https://test.dodopayments.com"

    def create_checkout_session(
        self,
        product_key: str,
        customer_email: str,
        user_id: str,
        return_url: str = "https://mone.trade/agent?checkout=success",
    ) -> Dict:
        """
        Creates a Dodo Payments hosted checkout session.
        If live API key is not yet set, returns a sandbox checkout link.
        """
        prod = PRODUCTS.get(product_key)
        if not prod:
            raise ValueError(f"Unknown product key: {product_key}. Valid keys: {list(PRODUCTS.keys())}")

        if not self.api_key:
            # Mock / Sandbox checkout response for testing & offline evaluation
            session_id = f"dodo_sess_{uuid.uuid4().hex[:12]}"
            return {
                "session_id": session_id,
                "checkout_url": f"https://checkout.dodopayments.com/test/{session_id}?amount={prod['amount_usd']}",
                "product_key": product_key,
                "amount_usd": prod["amount_usd"],
                "customer_email": customer_email,
                "user_id": user_id,
                "mode": "test_sandbox",
            }

        endpoint = f"{self.base_url}/checkouts"
        payload = {
            "billing": {"email": customer_email},
            "product_cart": [{"product_id": product_key, "quantity": 1}],
            "metadata": {"user_id": user_id, "product_key": product_key},
            "return_url": return_url,
        }

        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "session_id": data.get("checkout_id"),
                "checkout_url": data.get("payment_link"),
                "product_key": product_key,
                "amount_usd": prod["amount_usd"],
                "customer_email": customer_email,
                "user_id": user_id,
            }

    def verify_webhook_signature(self, payload_bytes: bytes, signature_header: str) -> bool:
        """
        Validates HMAC SHA256 webhook signature from Dodo Payments.
        """
        if not self.webhook_secret:
            # In test mode without secret configured, return True
            return True

        expected_sig = hmac.new(
            self.webhook_secret.encode("utf-8"), payload_bytes, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_sig, signature_header.strip())

    def handle_webhook_event(self, event_data: dict, db: Database) -> Dict:
        """
        Processes Dodo Payments webhook event and updates SQLite fuel credit records.
        """
        event_type = event_data.get("type", "")
        data = event_data.get("data", {})
        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id", "default_user")
        product_key = metadata.get("product_key", "")

        conn = db._get_connection()
        cursor = conn.cursor()

        if event_type in ("payment.succeeded", "checkout.session.completed"):
            amount = float(data.get("total_amount", 0.0)) / 100.0 if "total_amount" in data else 10.0
            # Credit fuel wallet
            cursor.execute("""
                INSERT INTO fuel_credits (user_id, credit_balance_usd, is_pro_subscriber, last_updated)
                VALUES (?, ?, 0, datetime('now'))
                ON CONFLICT(user_id) DO UPDATE SET
                    credit_balance_usd = credit_balance_usd + ?,
                    last_updated = datetime('now')
            """, (user_id, amount, amount))
            conn.commit()
            logger.info(f"Credited ${amount:.2f} fuel to user {user_id}")
            return {"status": "credited", "user_id": user_id, "amount_usd": amount}

        elif event_type in ("subscription.active", "subscription.created"):
            cursor.execute("""
                INSERT INTO fuel_credits (user_id, credit_balance_usd, is_pro_subscriber, last_updated)
                VALUES (?, 0.0, 1, datetime('now'))
                ON CONFLICT(user_id) DO UPDATE SET
                    is_pro_subscriber = 1,
                    last_updated = datetime('now')
            """, (user_id,))
            conn.commit()
            logger.info(f"Activated Pro subscription for user {user_id}")
            return {"status": "pro_activated", "user_id": user_id}

        return {"status": "ignored", "event_type": event_type}

    def get_user_fuel_balance(self, user_id: str, db: Database) -> Dict:
        """Returns active compute credit fuel balance and Pro subscription status."""
        conn = db._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT credit_balance_usd, is_pro_subscriber FROM fuel_credits WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            return {
                "user_id": user_id,
                "credit_balance_usd": float(row["credit_balance_usd"]),
                "is_pro_subscriber": bool(row["is_pro_subscriber"]),
            }
        return {
            "user_id": user_id,
            "credit_balance_usd": 0.00,
            "is_pro_subscriber": False,
        }
