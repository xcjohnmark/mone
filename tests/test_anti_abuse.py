"""
tests.test_anti_abuse — Test suite for Anti-Abuse Sybil Prevention & Free Trial Tombstone Ledger.
Verifies that deleting an account and re-signing up cannot reset or grant duplicate 7-day free trials.
"""

import os
import shutil
import tempfile
import pytest
from datetime import datetime, timezone, timedelta

from mone.state.db import Database


@pytest.fixture
def temp_db():
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "test_anti_abuse.db")
    db = Database(db_path=db_path)
    yield db
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_first_time_signup_gets_trial(temp_db):
    """First-time signup should be granted 7-day trial with 50 runs."""
    res = temp_db.check_or_grant_trial(google_sub="google_sub_101")
    assert res["is_new_trial"] is True
    assert res["is_trial_active"] is True
    assert res["trial_days_remaining"] == 7
    assert res["runs_remaining"] == 50
    assert res["plan"] == "7-Day Free Trial"


def test_re_signup_after_account_deletion_does_not_reset_trial(temp_db):
    """
    Even if user deletes their account and re-registers with the same Google sub,
    the immutable tombstone ledger prevents resetting the 50 runs / 7 days.
    """
    # 1. User signs up and gets 50 runs
    res1 = temp_db.check_or_grant_trial(google_sub="google_sub_102")
    assert res1["runs_remaining"] == 50

    # 2. User consumes 15 runs
    for _ in range(15):
        temp_db.record_trial_run_used(google_sub="google_sub_102")

    # 3. User deletes their account
    deleted = temp_db.delete_user_account(user_id="usr_102", google_sub="google_sub_102")
    assert deleted is True

    # 4. User signs up again with the exact same Google account
    res2 = temp_db.check_or_grant_trial(google_sub="google_sub_102")
    assert res2["is_new_trial"] is False
    assert res2["is_trial_active"] is True
    # Crucial: Must have 35 runs remaining, NOT reset back to 50!
    assert res2["runs_remaining"] == 35
    assert res2["plan"] == "7-Day Free Trial"


def test_expired_trial_re_signup_denied(temp_db):
    """Exhausted or expired trial user re-signing up is permanently assigned Expired Free Trial."""
    # 1. User consumes all 50 runs
    temp_db.check_or_grant_trial(google_sub="google_sub_103")
    for _ in range(50):
        temp_db.record_trial_run_used(google_sub="google_sub_103")

    # 2. User deletes and re-registers
    temp_db.delete_user_account(user_id="usr_103", google_sub="google_sub_103")
    res = temp_db.check_or_grant_trial(google_sub="google_sub_103")

    assert res["is_new_trial"] is False
    assert res["is_trial_active"] is False
    assert res["runs_remaining"] == 0
    assert res["trial_days_remaining"] == 0
    assert res["plan"] == "Expired Free Trial"


def test_device_fingerprint_throttles_sybils(temp_db):
    """More than 2 trial signups from the same device fingerprint are rejected."""
    device_id = "device_canvas_fingerprint_abc"

    # User 1 on device
    res1 = temp_db.check_or_grant_trial(google_sub="user_1", device_hash=device_id)
    assert res1["is_new_trial"] is True
    assert res1["is_trial_active"] is True

    # User 2 on device
    res2 = temp_db.check_or_grant_trial(google_sub="user_2", device_hash=device_id)
    assert res2["is_new_trial"] is True
    assert res2["is_trial_active"] is True

    # User 3 on same device -> flagged as device abuse
    res3 = temp_db.check_or_grant_trial(google_sub="user_3", device_hash=device_id)
    assert res3["is_new_trial"] is False
    assert res3["is_trial_active"] is False
    assert res3["plan"] == "Expired Free Trial"
    assert "Device trial allocation limit reached" in res3["reason"]
