"""
mone.entitlements — Anti-Tamper Licensing and Paywall Entitlement Engine.
Enforces the 7-Day Free Trial (50 runs), native USDC crypto payment verification,
and blocks unentitled agent execution with structured upgrade instructions.
"""

import hashlib
import hmac
import json
import logging
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Optional

from pydantic import BaseModel, Field

from mone.billing.crypto import (
    CRYPTO_PLANS,
    DESTINATION_WALLETS,
    USDC_CONTRACTS,
    verify_evm_transaction,
    verify_solana_transaction,
)

logger = logging.getLogger("mone.entitlements")

# Anti-tamper signing secret
_SIGNING_SALT = "mone_weather_trading_agent_2026_salt_anti_tamper"


class EntitlementStatus(BaseModel):
    allowed: bool
    plan: str = "7-Day Free Trial"
    runs_remaining: int = 50
    trial_days_remaining: int = 7
    pro_days_remaining: int = 0
    is_trial_active: bool = True
    is_pro: bool = False
    expires_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    cli_api_token: Optional[str] = None
    last_tx_hash: Optional[str] = None
    message: str = "Active"
    payment_note: Optional[str] = None


class EntitlementRequiredError(Exception):
    """
    Raised when an unentitled action (run, scan, trade, approve) is attempted.
    Contains the full entitlement status and human-readable upgrade banner.
    """

    def __init__(self, status: EntitlementStatus, action: str = "Agent execution"):
        self.status = status
        self.action = action
        self.message = (
            f"Upgrade Required: {action} is locked. "
            f"Plan '{status.plan}' has {status.runs_remaining} runs remaining "
            f"and {status.trial_days_remaining} trial days remaining."
        )
        super().__init__(self.message)

    def print_upgrade_banner(self):
        """Prints a high-visibility terminal banner with plans and deposit addresses."""
        banner = f"""
================================================================================
[!] TRIAL EXPIRED / UPGRADE REQUIRED
================================================================================
Action Blocked  : {self.action}
Current Plan    : {self.status.plan}
Runs Remaining  : {self.status.runs_remaining}
Trial Days Left : {self.status.trial_days_remaining}

Your 7-day free trial has expired or your runs quota has been exhausted.
Autonomous execution and live WeatherNext quant signals are protected behind
the paywall.

AVAILABLE UPGRADE PLANS (Native USDC):
  1. 100 Runs Pass  : 10 USDC  (Code: pass_10)          — 100 Automated Cycles
  2. 300 Runs Pass  : 25 USDC  (Code: pass_25)          — 300 Cycles + Priority
  3. Pro Trader     : 49 USDC  (Code: pro_subscription) — 30 Days Unlimited Runs

OFFICIAL FOUNDER DEPOSIT ADDRESSES:
  • Polygon (Native USDC) : {DESTINATION_WALLETS['evm']}
  • Base (Native USDC)    : {DESTINATION_WALLETS['evm']}
  • Solana (Native USDC)  : {DESTINATION_WALLETS['solana']}

HOW TO UNLOCK INSTANTLY:
  Option A (Web) : Visit https://mono-agent.vercel.app/#pricing (MetaMask/Phantom)
  Option B (CLI) : Run 'mone pay --plan pass_10 --network polygon --tx <tx_hash>'
================================================================================
"""
        print(banner, file=sys.stderr)


class EntitlementManager:
    """
    Manages local and remote entitlement state, license files, trial aging,
    and crypto payment verification.
    """

    def __init__(self, storage_dir: Optional[str] = None):
        if storage_dir:
            self.storage_dir = Path(storage_dir)
        else:
            self.storage_dir = Path(os.path.expanduser("~/.mone"))
        
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.license_file = self.storage_dir / "entitlement.json"

    def _generate_signature(self, data: dict) -> str:
        """Computes HMAC-SHA256 signature over entitlement data to prevent manual tampering."""
        fields = [
            str(data.get("plan")),
            str(data.get("runs_remaining")),
            str(data.get("created_at")),
            str(data.get("expires_at")),
            str(data.get("last_tx_hash")),
        ]
        payload = "|".join(fields).encode("utf-8")
        return hmac.new(_SIGNING_SALT.encode("utf-8"), payload, hashlib.sha256).hexdigest()

    def _default_entitlement(self) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        token = f"mone_sec_{abs(hash(now + 'init')) % 100000000:08d}"
        data = {
            "plan": "7-Day Free Trial",
            "runs_remaining": 50,
            "created_at": now,
            "expires_at": None,
            "cli_api_token": token,
            "last_tx_hash": None,
        }
        data["signature"] = self._generate_signature(data)
        return data

    def _save_data(self, data: dict):
        data["signature"] = self._generate_signature(data)
        with open(self.license_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def _load_data(self) -> dict:
        if not self.license_file.exists():
            default_data = self._default_entitlement()
            self._save_data(default_data)
            return default_data

        try:
            with open(self.license_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Anti-tamper verification
            sig = data.get("signature")
            expected_sig = self._generate_signature(data)
            if sig != expected_sig:
                logger.warning("Tamper detected in entitlement.json! Resetting to expired state.")
                data["runs_remaining"] = 0
                data["plan"] = "7-Day Free Trial (Tampered)"
                self._save_data(data)

            return data
        except Exception as e:
            logger.warning(f"Error loading entitlement file: {e}. Reinitializing.")
            default_data = self._default_entitlement()
            self._save_data(default_data)
            return default_data

    def get_status(self) -> EntitlementStatus:
        """Evaluates current entitlement status taking into account trial age, plan, and runs."""
        data = self._load_data()

        created_str = data.get("created_at")
        try:
            created_dt = datetime.fromisoformat(created_str)
        except Exception:
            created_dt = datetime.now(timezone.utc)

        now = datetime.now(timezone.utc)
        elapsed = now - created_dt
        trial_days_remaining = max(0, 7 - elapsed.days)
        is_trial_active = trial_days_remaining > 0

        plan = data.get("plan", "7-Day Free Trial")
        runs_remaining = data.get("runs_remaining", 0)
        expires_at = data.get("expires_at")
        cli_api_token = data.get("cli_api_token")
        last_tx_hash = data.get("last_tx_hash")

        # Pro Plan Check
        is_pro = False
        pro_days_remaining = 0
        if plan == "Pro":
            if expires_at:
                try:
                    exp_dt = datetime.fromisoformat(expires_at)
                    if exp_dt > now:
                        is_pro = True
                        pro_days_remaining = max(0, (exp_dt - now).days)
                        if pro_days_remaining == 0 and exp_dt > now:
                            pro_days_remaining = 1
                except Exception:
                    pass
            else:
                is_pro = True
                pro_days_remaining = 30

        # Determine permission
        allowed = False
        message = "Active"

        if is_pro:
            allowed = True
            message = f"Unlimited Pro Access Active ({pro_days_remaining} days remaining)"
        elif runs_remaining > 0 and (is_trial_active or plan in ("100 Runs Pass", "300 Runs Pass") or "Trade Runs Pass" in plan):
            allowed = True
            message = f"{runs_remaining} runs remaining on {plan}"
        else:
            allowed = False
            if plan == "7-Day Free Trial" and not is_trial_active:
                message = "7-Day Free Trial has expired. Upgrade required."
            elif runs_remaining <= 0:
                message = "Runs allowance exhausted (0 runs remaining). Upgrade required."
            else:
                message = "Active plan expired. Upgrade required."

        return EntitlementStatus(
            allowed=allowed,
            plan=plan,
            runs_remaining=runs_remaining,
            trial_days_remaining=trial_days_remaining,
            pro_days_remaining=pro_days_remaining,
            is_trial_active=is_trial_active,
            is_pro=is_pro,
            expires_at=expires_at,
            created_at=created_str or now.isoformat(),
            cli_api_token=cli_api_token,
            last_tx_hash=last_tx_hash,
            message=message,
            payment_note=data.get("payment_note"),
        )

    def require_entitlement(self, action: str = "Trading cycle"):
        """Validates entitlement and raises EntitlementRequiredError if not allowed."""
        status = self.get_status()
        if not status.allowed:
            raise EntitlementRequiredError(status, action=action)

    def consume_run(self, count: int = 1) -> EntitlementStatus:
        """Deducts run(s) from local balance unless user has active Pro unlimited subscription."""
        status = self.get_status()
        if not status.allowed:
            raise EntitlementRequiredError(status, action="Execute trade cycle")

        if status.is_pro:
            return status  # Unlimited, do not decrement

        data = self._load_data()
        current_runs = data.get("runs_remaining", 0)
        data["runs_remaining"] = max(0, current_runs - count)
        self._save_data(data)

        return self.get_status()

    def credit_payment(self, plan_key: str, tx_hash: str, network: str = "polygon") -> EntitlementStatus:
        """
        Verifies on-chain USDC payment transaction and credits the account balance.
        Supports fee tolerance, underpayment pro-rated runs, and stacked Pro renewal days.
        """
        network_clean = network.lower()
        if network_clean == "solana":
            verify_res = verify_solana_transaction(tx_hash, plan_key)
        else:
            verify_res = verify_evm_transaction(network_clean, tx_hash, plan_key)

        if not verify_res.get("valid"):
            raise ValueError(verify_res.get("error", "Transaction verification failed on-chain."))

        activated = verify_res.get("plan_activated", plan_key)
        runs_granted = verify_res.get("runs_granted", 0)
        days_granted = verify_res.get("days_granted")
        note = verify_res.get("note", "Payment verified and credited.")

        data = self._load_data()
        now = datetime.now(timezone.utc)

        if activated == "pro_subscription":
            data["plan"] = "Pro"
            # Day Stacking: If renewing while active, add 30 days to existing expiration!
            base_date = now
            if data.get("expires_at"):
                try:
                    exp_dt = datetime.fromisoformat(data["expires_at"])
                    if exp_dt > now:
                        base_date = exp_dt
                except Exception:
                    pass
            data["expires_at"] = (base_date + timedelta(days=30)).isoformat()
            data["runs_remaining"] = 999999
        elif activated == "pass_25":
            data["plan"] = "300 Runs Pass"
            current_runs = data.get("runs_remaining", 0)
            data["runs_remaining"] = current_runs + runs_granted
        elif activated == "pass_10":
            data["plan"] = "100 Runs Pass"
            current_runs = data.get("runs_remaining", 0)
            data["runs_remaining"] = current_runs + runs_granted
        else:
            # Custom / pro-rated runs from fee underpayment guardrail
            current_runs = data.get("runs_remaining", 0)
            data["runs_remaining"] = current_runs + runs_granted
            data["plan"] = f"Trade Runs Pass ({data['runs_remaining']} runs)"

        data["last_tx_hash"] = tx_hash
        data["payment_note"] = note
        self._save_data(data)

        status = self.get_status()
        status.payment_note = note
        return status


# Global singleton instance
_entitlement_manager: Optional[EntitlementManager] = None


def get_entitlement_manager() -> EntitlementManager:
    global _entitlement_manager
    if _entitlement_manager is None:
        _entitlement_manager = EntitlementManager()
    return _entitlement_manager
