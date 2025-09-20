# backend/main.py
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote_plus
import joblib
import time
import re
import pandas as pd
import os

# ----------------- Setup -----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load environment threshold if set, else default 0.5
THRESHOLD = float(os.environ.get("ML_THRESHOLD", 0.5))

# Load ML model
MODEL_PATH = os.path.join(BASE_DIR, "ml_model.joblib")
clf = joblib.load(MODEL_PATH)

# Load whitelist and blacklist CSVs
WHITELIST_PATH = os.path.join(BASE_DIR, "whitelist.csv")
BLACKLIST_PATH = os.path.join(BASE_DIR, "blacklist.csv")

whitelist_df = pd.read_csv(WHITELIST_PATH)
blacklist_df = pd.read_csv(BLACKLIST_PATH)

WHITELIST = set(whitelist_df['url'].str.lower().str.strip())
BLACKLIST = set(blacklist_df['url'].str.lower().str.strip())

# FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow all origins
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False
)

# ----------------- Alerts & Stats -----------------
ALERTS = []
STATS = {
    "start_time": time.time(),
    "requests": 0,
    "regex_flagged": 0,
    "ml_flagged": 0,
    "not_flagged": 0,
    "blocked": 0
}

INGESTION = {
    "batch": {"status": "processed", "logs": 0, "last_run": "never"},
    "streaming": {"status": "active", "rate": "0 lines/sec"}
}

# ----------------- Regex Patterns -----------------
REGEX_PATTERNS = [
    r"(\bor\b|\band\b)\s+[^=]*=.*",         # SQLi
    r"<script.*?>.*?</script>",             # XSS
    r"on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",  # Event handlers
    r"javascript\s*:\s*[^\s>]+",            # JS URI
    r"\.\./",                               # Path traversal
]
COMPILED_REGEX = [(p, re.compile(p, re.IGNORECASE | re.DOTALL)) for p in REGEX_PATTERNS]

# ----------------- Helper Functions -----------------
def normalize(url: str):
    return url.strip().lower().rstrip('/')

def check_regex(url: str):
    candidates = [url, unquote_plus(url)]
    for candidate in candidates:
        for pattern_str, patt in COMPILED_REGEX:
            if patt.search(candidate):
                return True, pattern_str
    return False, None

def check_ml(url: str):
    url_norm = normalize(url)

    # Whitelist overrides
    if url_norm in WHITELIST:
        return False, 0.0
    if url_norm in BLACKLIST:
        return True, 1.0

    prob = clf.predict_proba([url_norm])[0][1]  # probability malicious
    return prob >= THRESHOLD, prob

def flag_url(url: str):
    """
    Separate domains:
    - URLs with query params (contains ? or =) → regex domain
    - URLs without query params → ML domain
    """
    if "?" in url or "=" in url:
        # regex domain
        is_regex, matched_pattern = check_regex(url)
        return {"flagged": is_regex, "source": "regex", "matched_pattern": matched_pattern}
    else:
        # ML domain
        is_ml, prob = check_ml(url)
        return {"flagged": is_ml, "source": "ml", "matched_pattern": None, "probability": prob}

# ----------------- Endpoints -----------------
@app.post("/alerts")
def submit_alert(payload: dict = Body(...)):
    url = payload.get("text")
    if not url:
        raise HTTPException(status_code=400, detail="No URL provided")

    STATS["requests"] += 1
    result = flag_url(url)

    # update stats
    if result["flagged"]:
        if result["source"] == "regex":
            STATS["regex_flagged"] += 1
        else:
            STATS["ml_flagged"] += 1
        STATS["blocked"] += 1
    else:
        STATS["not_flagged"] += 1

    # update ingestion logs
    INGESTION["batch"]["logs"] = STATS["requests"]
    INGESTION["batch"]["last_run"] = "just now"
    INGESTION["streaming"]["rate"] = f"{STATS['requests']} lines/sec"

    level = "CRITICAL" if result["flagged"] else "LOW"
    alert = {"level": level, "text": url, "ts": "just now"}
    if result["flagged"]:
        ALERTS.insert(0, alert)
    result["alert"] = alert
    return result

@app.get("/alerts")
def get_alerts():
    return ALERTS

@app.get("/metrics")
def get_metrics():
    uptime_hours = int((time.time() - STATS["start_time"]) // 3600)
    return {
        "requests": STATS["requests"],
        "regex_flagged": STATS["regex_flagged"],
        "ml_flagged": STATS["ml_flagged"],
        "not_flagged": STATS["not_flagged"],
        "blocked": STATS["blocked"],
        "uptime": f"{uptime_hours}h"
    }

@app.get("/ingestion")
def get_ingestion():
    return INGESTION

@app.get("/model")
def get_model():
    return {
        "version": "v2.1 Hybrid (Regex + ML with Whitelist/Blacklist)",
        "last_retrain": "manual run via train_ml_flagger.py",
        "incremental_data": f"{STATS['requests']} requests ingested",
        "threshold": THRESHOLD
    }
