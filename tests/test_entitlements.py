"""
tests.test_entitlements — Test suite for Anti-Tamper Licensing and Paywall Entitlements.
Verifies trial countdown, runs exhaustion, error banner, and crypto payment unlocks.
"""

import json
import os
import shutil
import tempfile
import pytest
from datetime import datetime, timezone, timedelta

from mone.entitlements import (
    EntitlementManager,
    EntitlementRequiredError,
    EntitlementStatus,
)
from mone.billing.crypto import DESTINATION_WALLETS


@pytest.fixture
def temp_entitlement_dir():
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_initial_trial_status(temp_entitlement_dir):
    mgr = EntitlementManager(storage_dir=temp_entitlement_dir)
    status = mgr.get_status()

    assert status.allowed is True
    assert status.plan == "7-Day Free Trial"
    assert status.runs_remaining == 50
    assert status.trial_days_remaining == 7
    assert status.is_trial_active is True
    assert status.is_pro is False
    assert status.cli_api_token is not None


def test_consume_runs(temp_entitlement_dir):
    mgr = EntitlementManager(storage_dir=temp_entitlement_dir)
    status = mgr.consume_run()

    assert status.runs_remaining == 49
    assert status.allowed is True

    # Consume multiple
    mgr.consume_run(count=9)
    status_after = mgr.get_status()
    assert status_after.runs_remaining == 40


def test_exhausted_runs_blocks_execution(temp_entitlement_dir):
    mgr = EntitlementManager(storage_dir=temp_entitlement_dir)
    # Drain runs to 0
    data = mgr._load_data()
    data["runs_remaining"] = 0
    mgr._save_data(data)

    status = mgr.get_status()
    assert status.allowed is False
    assert "exhausted" in status.message.lower()

    with pytest.raises(EntitlementRequiredError) as exc_info:
        mgr.require_entitlement("Test trade run")

    err = exc_info.value
    assert err.status.allowed is False
    assert err.action == "Test trade run"


def test_expired_trial_days_blocks_execution(temp_entitlement_dir):
    mgr = EntitlementManager(storage_dir=temp_entitlement_dir)
    # Set created_at to 8 days ago
    data = mgr._load_data()
    eight_days_ago = (datetime.now(timezone.utc) - timedelta(days=8)).isoformat()
    data["created_at"] = eight_days_ago
    mgr._save_data(data)

    status = mgr.get_status()
    assert status.trial_days_remaining == 0
    assert status.allowed is False

    with pytest.raises(EntitlementRequiredError):
        mgr.require_entitlement("Autonomous step")


def test_credit_payment_unlocks_runs(temp_entitlement_dir):
    mgr = EntitlementManager(storage_dir=temp_entitlement_dir)
    # Start in exhausted state
    data = mgr._load_data()
    data["runs_remaining"] = 0
    mgr._save_data(data)
    assert mgr.get_status().allowed is False

    # Simulate valid EVM payment transaction hash (66 chars)
    fake_tx = "0x" + "a" * 64
    new_status = mgr.credit_payment(plan_key="pass_10", tx_hash=fake_tx, network="polygon")

    assert new_status.allowed is True
    assert new_status.plan == "100 Runs Pass"
    assert new_status.runs_remaining == 100
    assert new_status.last_tx_hash == fake_tx


def test_anti_tamper_signature(temp_entitlement_dir):
    mgr = EntitlementManager(storage_dir=temp_entitlement_dir)
    # Ensure file is initialized
    mgr.get_status()
    license_file = mgr.license_file

    # Read and manually tamper with file without updating HMAC signature
    with open(license_file, "r") as f:
        data = json.load(f)
    data["runs_remaining"] = 999999  # Attempted cheat
    with open(license_file, "w") as f:
        json.dump(data, f)

    # Manager should detect tamper and reset to 0 runs / tampered
    status = mgr.get_status()
    assert status.allowed is False
    assert "Tampered" in status.plan
    assert status.runs_remaining == 0


def test_upgrade_banner_contains_wallets(temp_entitlement_dir, capsys):
    mgr = EntitlementManager(storage_dir=temp_entitlement_dir)
    status = EntitlementStatus(
        allowed=False,
        plan="7-Day Free Trial (Expired)",
        runs_remaining=0,
        trial_days_remaining=0,
    )
    err = EntitlementRequiredError(status, action="Execute Market Scan")
    err.print_upgrade_banner()

    captured = capsys.readouterr()
    assert "[!] TRIAL EXPIRED / UPGRADE REQUIRED" in captured.err
    assert DESTINATION_WALLETS["evm"] in captured.err
    assert DESTINATION_WALLETS["solana"] in captured.err
    assert "10 USDC" in captured.err
    assert "49 USDC" in captured.err


def test_fee_tolerance_guardrail():
    from mone.billing.crypto import evaluate_underpayment_guardrail
    # User sent 9.90 USDC for 10 USDC plan (within 2% tolerance)
    res = evaluate_underpayment_guardrail(9.90, "pass_10")
    assert res["status"] == "FULL_CREDIT"
    assert res["runs_granted"] == 100
    assert "tolerance" in res["note"]


def test_underpayment_prorated_credit():
    from mone.billing.crypto import evaluate_underpayment_guardrail
    # User sent 5.00 USDC for 10 USDC plan
    res = evaluate_underpayment_guardrail(5.00, "pass_10")
    assert res["status"] == "PRO_RATED_CREDIT"
    assert res["runs_granted"] == 50
    assert "No money lost" in res["note"]

    # User sent 25 USDC for Pro ($49)
    res_pro = evaluate_underpayment_guardrail(25.00, "pro_subscription")
    assert res_pro["status"] == "PARTIAL_CREDIT"
    assert res_pro["runs_granted"] == 300


def test_pro_subscription_30_days_and_stacking(temp_entitlement_dir, monkeypatch):
    monkeypatch.setenv("MONE_TEST_MODE", "1")
    mgr = EntitlementManager(storage_dir=temp_entitlement_dir)
    fake_tx1 = "0x" + "b" * 64
    status = mgr.credit_payment(plan_key="pro_subscription", tx_hash=fake_tx1, network="polygon")

    assert status.is_pro is True
    assert status.plan == "Pro"
    assert status.pro_days_remaining in (29, 30)

    # Day stacking: renew while active
    fake_tx2 = "0x" + "c" * 64
    status_renew = mgr.credit_payment(plan_key="pro_subscription", tx_hash=fake_tx2, network="polygon")
    assert status_renew.pro_days_remaining in (59, 60)

