"""
scripts/harvest_kalshi_weather_30d.py
High-speed concurrent harvester for settled Kalshi KXRAIN daily precipitation markets over the past 30 days.
Pulls first-hour candlestick prices (OHLCV, yes_ask, yes_bid) using ThreadPoolExecutor.
Saves to backtest_data/kalshi_kxrain_30d.json.
"""

import concurrent.futures
import json
import logging
import os
import sys
import time
import urllib.request
import urllib.error
import ssl
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("harvest_kalshi")

BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"
OUTPUT_DIR = "backtest_data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "kalshi_kxrain_30d.json")

# SSL context
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "mone-quant-backtest/0.1.0 (Mozilla/5.0)",
    "Accept": "application/json",
}


def http_get(url: str, retries: int = 2, delay: float = 0.5) -> Optional[Dict[str, Any]]:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10, context=ssl_ctx) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(delay * (attempt + 2))
            elif e.code == 404:
                return None
            else:
                time.sleep(delay)
        except Exception:
            time.sleep(delay)
    return None


def parse_iso_to_unix(iso_str: Optional[str]) -> Optional[int]:
    if not iso_str:
        return None
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return int(dt.timestamp())
    except Exception:
        return None


def fetch_all_settled_kxrain_markets(days: int = 30) -> List[Dict[str, Any]]:
    now_ts = int(datetime.now(timezone.utc).timestamp())
    min_close_ts = now_ts - (days * 86400)
    
    logger.info(f"Fetching settled KXRAIN markets since {datetime.fromtimestamp(min_close_ts, timezone.utc).isoformat()} (last {days} days)...")
    
    all_markets = []
    cursor = None
    page = 1

    while True:
        url = f"{BASE_URL}/markets?series_ticker=KXRAIN&status=settled&limit=200&min_close_ts={min_close_ts}"
        if cursor:
            url += f"&cursor={cursor}"
            
        data = http_get(url)
        if not data:
            break
            
        markets = data.get("markets", [])
        if not markets:
            break
            
        all_markets.extend(markets)
        cursor = data.get("cursor")
        logger.info(f"Page {page}: received {len(markets)} markets (Total: {len(all_markets)})")
        
        if not cursor or len(markets) == 0:
            break
            
        page += 1
        time.sleep(0.1)

    return all_markets


def fetch_market_candlesticks(ticker: str, open_ts: int) -> Optional[Dict[str, Any]]:
    start_ts = open_ts
    end_ts = open_ts + 7200  # 2 hours window
    url = f"{BASE_URL}/series/KXRAIN/markets/{ticker}/candlesticks?start_ts={start_ts}&end_ts={end_ts}&period_interval=60"
    data = http_get(url)
    if data and "candlesticks" in data and len(data["candlesticks"]) > 0:
        return data["candlesticks"]
    return None


def process_single_market(m: Dict[str, Any]) -> Dict[str, Any]:
    ticker = m.get("ticker", "")
    open_time_str = m.get("open_time")
    open_ts = parse_iso_to_unix(open_time_str)
    
    parts = ticker.split("-")
    city_suffix = parts[-1] if len(parts) >= 3 else "UNKNOWN"
    date_code = parts[1] if len(parts) >= 3 else ""
    
    first_hour_candle = None
    if open_ts:
        candles = fetch_market_candlesticks(ticker, open_ts)
        if candles and len(candles) > 0:
            first_hour_candle = candles[0]
            
    final_result = m.get("result", "").lower()
    expiration_val = m.get("expiration_value", "")
    
    candle_yes_ask = None
    candle_yes_bid = None
    candle_volume = 0.0
    candle_mean_price = None
    
    if first_hour_candle:
        yes_ask_dict = first_hour_candle.get("yes_ask", {})
        yes_bid_dict = first_hour_candle.get("yes_bid", {})
        price_dict = first_hour_candle.get("price", {})
        
        candle_yes_ask = float(yes_ask_dict.get("close_dollars") or yes_ask_dict.get("open_dollars") or 0.0)
        candle_yes_bid = float(yes_bid_dict.get("close_dollars") or yes_bid_dict.get("open_dollars") or 0.0)
        candle_mean_price = float(price_dict.get("mean_dollars") or price_dict.get("close_dollars") or 0.0)
        candle_volume = float(first_hour_candle.get("volume_fp", 0.0) or 0.0)

    # Fallback to previous quotes if first candle was unquoted
    if not candle_yes_ask or candle_yes_ask == 0.0:
        candle_yes_ask = float(m.get("previous_yes_ask_dollars", 0.0) or 0.0)
    if not candle_yes_bid or candle_yes_bid == 0.0:
        candle_yes_bid = float(m.get("previous_yes_bid_dollars", 0.0) or 0.0)

    candle_no_ask = round(1.0 - candle_yes_bid, 4) if (candle_yes_bid and candle_yes_bid > 0) else None

    return {
        "ticker": ticker,
        "event_ticker": m.get("event_ticker"),
        "city_suffix": city_suffix,
        "date_code": date_code,
        "title": m.get("title"),
        "created_time": m.get("created_time"),
        "open_time": open_time_str,
        "close_time": m.get("close_time"),
        "settlement_ts": m.get("settlement_ts"),
        "status": m.get("status"),
        "result": final_result,
        "settlement_value_dollars": float(m.get("settlement_value_dollars", 0.0) or (1.0 if final_result == "yes" else 0.0)),
        "expiration_value_inches": expiration_val,
        "total_volume_fp": float(m.get("volume_fp", 0.0) or 0.0),
        "total_open_interest_fp": float(m.get("open_interest_fp", 0.0) or 0.0),
        "first_hour": {
            "yes_ask": candle_yes_ask,
            "yes_bid": candle_yes_bid,
            "no_ask": candle_no_ask,
            "mean_price": candle_mean_price,
            "volume_fp": candle_volume,
            "has_first_hour_candle": first_hour_candle is not None
        }
    }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    logger.info("Starting Kalshi 30-Day KXRAIN Harvester...")
    raw_markets = fetch_all_settled_kxrain_markets(days=30)
    logger.info(f"Retrieved {len(raw_markets)} settled KXRAIN raw markets.")
    
    if not raw_markets:
        logger.error("No settled markets found!")
        sys.exit(1)
        
    logger.info(f"Concurrently processing {len(raw_markets)} markets with ThreadPoolExecutor (max_workers=12)...")
    processed_records = []
    
    t0 = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(process_single_market, m): m for m in raw_markets}
        completed = 0
        for future in concurrent.futures.as_completed(futures):
            try:
                res = future.result()
                processed_records.append(res)
            except Exception as e:
                logger.warning(f"Error processing market: {e}")
            completed += 1
            if completed % 50 == 0 or completed == len(raw_markets):
                elapsed = round(time.time() - t0, 1)
                rate = round(completed / elapsed, 1) if elapsed > 0 else 0
                logger.info(f"Progress: {completed}/{len(raw_markets)} markets completed ({rate} markets/sec)...")
                
    # Sort chronologically by open_time
    processed_records.sort(key=lambda x: x.get("open_time") or "")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "harvest_timestamp": datetime.now(timezone.utc).isoformat(),
            "market_count": len(processed_records),
            "date_range": {
                "start": processed_records[0].get("open_time") if processed_records else None,
                "end": processed_records[-1].get("open_time") if processed_records else None,
            },
            "markets": processed_records
        }, f, indent=2)
        
    total_time = round(time.time() - t0, 1)
    logger.info(f"Finished harvesting {len(processed_records)} markets in {total_time}s into {OUTPUT_FILE}!")


if __name__ == "__main__":
    main()
