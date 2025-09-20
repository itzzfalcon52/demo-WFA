import pandas as pd
import joblib
import os
import time
import re
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote_plus

# ----------------- Setup -----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Threshold
THRESHOLD = float(os.environ.get("ML_THRESHOLD", 0.5))

# Load ML model
clf = joblib.load(os.path.join(BASE_DIR, "ml_model.joblib"))

# Load whitelist/blacklist
WHITELIST = set(pd.read_csv(os.path.join(BASE_DIR, "whitelist.csv"))['url'].str.lower().str.strip())
BLACKLIST = set(pd.read_csv(os.path.join(BASE_DIR, "blacklist.csv"))['url'].str.lower().str.strip())

# Load ML metrics
ML_METRICS_PATH = os.path.join(BASE_DIR, "ml_metrics.csv")
if os.path.exists(ML_METRICS_PATH):
    ML_METRICS = pd.read_csv(ML_METRICS_PATH).iloc[0].to_dict()
    # Ensure all values are floats
    for k, v in ML_METRICS.items():
        try:
            ML_METRICS[k] = float(v)
        except:
            ML_METRICS[k] = None
else:
    ML_METRICS = {"accuracy": None, "precision": None, "recall": None, "f1_score": None}

# ----------------- App -----------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ----------------- Alerts & Stats -----------------
ALERTS = []
STATS = {"start_time": time.time(), "requests": 0, "regex_flagged": 0, "ml_flagged": 0,
         "not_flagged": 0, "blocked": 0}
INGESTION = {"batch": {"status": "processed", "logs": 0, "last_run": "never"},
             "streaming": {"status": "active", "rate": "0 lines/sec"}}

# ----------------- Regex -----------------
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
    for candidate in [url, unquote_plus(url)]:
        for pattern_str, patt in COMPILED_REGEX:
            if patt.search(candidate):
                return True, pattern_str
    return False, None

def check_ml(url: str):
    url_norm = normalize(url)
    if url_norm in WHITELIST: return False, 0.0
    if url_norm in BLACKLIST: return True, 1.0
    prob = float(clf.predict_proba([url_norm])[0][1])
    return bool(prob >= THRESHOLD), prob

def flag_url(url: str):
    if "?" in url or "=" in url:
        flagged, matched = check_regex(url)
        return {"flagged": flagged, "source": "regex", "matched_pattern": matched}
    flagged, prob = check_ml(url)
    return {"flagged": flagged, "source": "ml", "matched_pattern": None, "probability": prob}

# ----------------- Endpoints -----------------
@app.post("/alerts")
def submit_alert(payload: dict = Body(...)):
    url = payload.get("text")
    if not url: raise HTTPException(400, "No URL provided")
    STATS["requests"] += 1
    result = flag_url(url)
    if result["flagged"]:
        if result["source"] == "regex": STATS["regex_flagged"] += 1
        else: STATS["ml_flagged"] += 1
        STATS["blocked"] += 1
    else:
        STATS["not_flagged"] += 1
    INGESTION["batch"]["logs"] = STATS["requests"]
    INGESTION["batch"]["last_run"] = "just now"
    INGESTION["streaming"]["rate"] = f"{STATS['requests']} lines/sec"
    level = "CRITICAL" if result["flagged"] else "LOW"
    alert = {"level": level, "text": url, "ts": "just now"}
    if result["flagged"]: ALERTS.insert(0, alert)
    result["alert"] = alert
    return result

@app.get("/alerts")
def get_alerts(): return ALERTS

@app.get("/metrics")
def get_metrics():
    uptime_hours = int((time.time() - STATS["start_time"]) // 3600)
    return {**STATS, "uptime": f"{uptime_hours}h"}

@app.get("/ingestion")
def get_ingestion(): return INGESTION

@app.get("/model")
def get_model():
    return {
        "version": "v2.2 Hybrid (Regex + ML + Whitelist/Blacklist)",
        "last_retrain": "manual run via train_ml_flagger.py",
        "incremental_data": f"{STATS['requests']} requests ingested",
        "threshold": THRESHOLD,
        "ml_metrics": ML_METRICS
    }
