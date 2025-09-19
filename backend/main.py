
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import random, re
from datetime import datetime
from urllib.parse import unquote_plus

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALERTS = [
    {"level": "CRITICAL", "text": "SQL Injection - /products?id=1 OR 1=1", "ts": "just now"},
    {"level": "HIGH", "text": "XSS Attempt - <script>alert(1)</script>", "ts": "15s ago"},
]

MALICIOUS_PATTERNS = [
    r"(\bor\b|\band\b)\s+[^=]*=.*",                    # crude SQL injection
    r"<script.*?>.*?</script>",                        # <script> tags
    r"on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",     # event handlers
    r"javascript\s*:\s*[^\s>]+",                       # javascript: URIs
    r"data\s*:\s*(text|application)\/javascript",      # data: js payload
    r"\.\./",                                          # path traversal
    r"<[^>]*(alert\s*\(|on\w+\s*=)[^>]*>",             # tags with alert() or on*
]

# compile once
COMPILED_PATTERNS = [(p, re.compile(p, re.IGNORECASE | re.DOTALL)) for p in MALICIOUS_PATTERNS]

def check_malicious(text: str):
    """
    Returns tuple (is_malicious: bool, matched_pattern: str | None, checked_text: str)
    - decodes URL-encoded payloads (so id=1%20OR%201%3D1 will match).
    - tests both raw and decoded forms.
    """
    if not isinstance(text, str):
        return False, None, text

    candidates = [text]
    try:
        decoded = unquote_plus(text)
        if decoded != text:
            candidates.append(decoded)
    except Exception:
        decoded = text

    for candidate in candidates:
        for pattern_str, patt in COMPILED_PATTERNS:
            if patt.search(candidate):
                return True, pattern_str, candidate

    return False, None, candidates[0]

# ----------------- ALERTS -----------------
@app.get("/alerts")
def get_alerts():
    return ALERTS

@app.post("/alerts")
def submit_alert(payload: dict = Body(...)):
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    is_malicious, matched_pattern, checked_text = check_malicious(text)
    level = "CRITICAL" if is_malicious else "LOW"
    alert = {"level": level, "text": text, "ts": "just now"}

    # log to stdout so Render/Heroku logs show it
    if is_malicious:
        ALERTS.insert(0, alert)
        print(f"[ALERT] matched pattern: {matched_pattern!r} | original: {text!r} | checked: {checked_text!r}")
    else:
        print(f"[OK] not flagged | original: {text!r} | checked: {checked_text!r}")

    # include matched_pattern in response for debugging
    resp = {"flagged": is_malicious, "alert": alert}
    if matched_pattern:
        resp["matched_pattern"] = matched_pattern
        resp["checked_text"] = checked_text
    return resp

# ... keep metrics/ingestion/model endpoints as before ...
@app.get("/metrics")
def get_metrics():
    return {
        "requests": random.randint(500, 1500),
        "anomalies": random.randint(10, 50),
        "blocked": random.randint(0, 10),
        "uptime": f"{random.randint(1, 24)}h"
    }

@app.get("/ingestion")
def get_ingestion():
    return {
        "batch": {"status": "processed", "logs": 2_000_000, "last_run": "5m ago"},
        "streaming": {"status": "active", "rate": "500 lines/sec"},
    }

@app.get("/model")
def get_model():
    return {
        "version": "v1.3 Transformer-L",
        "last_retrain": "1 hour ago",
        "incremental_data": "50MB"
    }
