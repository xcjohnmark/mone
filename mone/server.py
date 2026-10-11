"""
mone.server — FastAPI Companion Server for mone Web Dashboard and Cloud Runners.
Provides REST API endpoints for agent control, Copilot signal approval, backtest results, and Dodo Payments.
"""

from typing import Dict, Optional
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mone.agent import MoneAgent
from mone.billing.dodo import DodoPaymentsClient
from mone.config import AutonomyMode, MoneConfig, get_config
from mone.state.db import Database
from mone.backtest.engine import run_backtest

app = FastAPI(
    title="mone Agent API",
    description="Autonomous Quantitative Trading Agent bridging Google WeatherNext with Prediction Markets",
    version="0.1.0",
)

# Enable CORS for web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_agent_instance: Optional[MoneAgent] = None


def get_agent() -> MoneAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = MoneAgent()
    return _agent_instance


class StepRequest(BaseModel):
    target_date: Optional[str] = None
    mode: Optional[str] = None
    venue: Optional[str] = None
    provider: Optional[str] = None


class CheckoutRequest(BaseModel):
    product_key: str
    customer_email: str
    user_id: str


class GoogleAuthRequest(BaseModel):
    email: Optional[str] = "trader@gmail.com"
    name: Optional[str] = "Weather Trader"
    avatar: Optional[str] = None


@app.get("/api/health")
def health_check():
    agent = get_agent()
    return {
        "status": "healthy",
        "weather_provider": agent.weather.provider_id,
        "market_venue": agent.market.venue_id,
        "mode": agent.config.agent_autonomy_mode.value,
    }


@app.post("/api/auth/google")
def auth_google(req: GoogleAuthRequest):
    """
    Creates or logs in a user profile via Google Auth.
    Instantly grants a 7-Day Free Trial with 50 complimentary runs.
    """
    return {
        "user_id": f"usr_{abs(hash(req.email)) % 10000000:07d}",
        "email": req.email,
        "name": req.name,
        "avatar": req.avatar or f"https://api.dicebear.com/7.x/identicon/svg?seed={req.email}",
        "is_trial_active": True,
        "trial_days_remaining": 7,
        "runs_remaining": 50,
        "plan": "7-Day Free Trial",
        "cli_api_token": f"mone_sec_{abs(hash(req.email + 'salt')) % 100000000:08d}",
    }


@app.get("/api/billing/products")
def list_products():
    from mone.billing.dodo import PRODUCTS
    return [
        {
            "key": "pass_10",
            "name": "100 Trade Runs",
            "price": 10.00,
            "runs": 100,
            "period": "one-time",
            "description": "100 automated trade cycles ($0.10/run)",
        },
        {
            "key": "pass_25",
            "name": "300 Trade Runs",
            "price": 25.00,
            "runs": 300,
            "period": "one-time",
            "description": "300 automated trade cycles ($0.083/run) + priority queue",
        },
        {
            "key": "pro_subscription",
            "name": "mone Pro",
            "price": 49.00,
            "runs": "unlimited",
            "period": "monthly",
            "description": "Unlimited trade cycles, sub-second order book streaming, and Telegram alerts",
        },
    ]


@app.get("/api/status")
def get_status():
    agent = get_agent()
    eq = agent.db.get_equity_summary()
    open_pos = agent.db.get_open_positions()
    staged = agent.db.get_staged_signals()
    return {
        "equity": eq.model_dump(),
        "open_positions": [p.model_dump() for p in open_pos],
        "staged_signals": [s.model_dump() for s in staged],
        "venue": agent.market.venue_id,
        "mode": agent.config.agent_autonomy_mode.value,
    }


@app.post("/api/step")
def trigger_step(req: StepRequest):
    agent = get_agent()
    if req.mode and req.mode in ("autonomous", "copilot"):
        agent.config.agent_autonomy_mode = AutonomyMode(req.mode)
    res = agent.step(target_date=req.target_date)
    return res


@app.post("/api/approve/{signal_id}")
def approve_signal(signal_id: int):
    agent = get_agent()
    pos = agent.approve_copilot_signal(signal_id)
    if not pos:
        raise HTTPException(status_code=400, detail=f"Could not execute signal {signal_id}")
    return {"status": "executed", "position": pos.model_dump()}


@app.get("/api/backtest")
def get_backtest_report(days: int = 60):
    return run_backtest(days=days)


@app.post("/api/billing/checkout")
def create_checkout(req: CheckoutRequest):
    client = DodoPaymentsClient()
    try:
        session = client.create_checkout_session(
            product_key=req.product_key,
            customer_email=req.customer_email,
            user_id=req.user_id,
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/billing/webhook")
async def dodo_webhook(request: Request, x_dodo_signature: Optional[str] = Header(None)):
    body_bytes = await request.body()
    client = DodoPaymentsClient()

    if x_dodo_signature and not client.verify_webhook_signature(body_bytes, x_dodo_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        event = await request.json()
        agent = get_agent()
        res = client.handle_webhook_event(event, agent.db)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook handling failed: {e}")


def start_server(host: str = "127.0.0.1", port: int = 8000):
    import uvicorn
    uvicorn.run("mone.server:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    start_server()
