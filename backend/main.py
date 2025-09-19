from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import random, re
from datetime import datetime

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

# Improved malicious patterns
MALICIOUS_PATTERNS = [
    # crude SQL injection: " or " / " and " followed by =
    r"(\bor\b|\band\b)\s+[^=]*=.*",

    # <script> ... </script>
    r"<script.*?>.*?</script>",

    # event handlers: onerror=, onclick=, onload=, etc.  (matches single/double/unquoted)
    r"on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",

    # javascript: URIs (e.g. href="javascript:alert(1)")
    r"javascript\s*:\s*[^\s>]+",

    # data: URIs carrying javascript
    r"data\s*:\s*text\/html|data\s*:\s*text\/javascript|data\s*:\s*application\/javascript",

    # path traversal
    r"\.\./",
]

# compile once for speed
COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in MALICIOUS_PATTERNS]

def check_malicious(text: str):
    if not isinstance(text, str):
        return False
    for pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            return True
    return False

# ----------------- ALERTS -----------------
@app.get("/alerts")
def get_alerts():
    return ALERTS

@app.post("/alerts")
def submit_alert(payload: dict = Body(...)):
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    is_malicious = check_malicious(text)
    level = "CRITICAL" if is_malicious else "LOW"
    alert = {"level": level, "text": text, "ts": "just now"}
    
    if is_malicious:
        ALERTS.insert(0, alert)
    return {"flagged": is_malicious, "alert": alert}

# ----------------- METRICS -----------------
@app.get("/metrics")
def get_metrics():
    return {
        "requests": random.randint(500, 1500),
        "anomalies": random.randint(10, 50),
        "blocked": random.randint(0, 10),
        "uptime": f"{random.randint(1, 24)}h"
    }

# ----------------- INGESTION -----------------
@app.get("/ingestion")
def get_ingestion():
    return {
        "batch": {"status": "processed", "logs": 2_000_000, "last_run": "5m ago"},
        "streaming": {"status": "active", "rate": "500 lines/sec"},
    }

# ----------------- MODEL -----------------
@app.get("/model")
def get_model():
    return {
        "version": "v1.3 Transformer-L",
        "last_retrain": "1 hour ago",
        "incremental_data": "50MB"
    }
