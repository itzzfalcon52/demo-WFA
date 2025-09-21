import os
import time
import pandas as pd
import joblib
import re
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote_plus, urlparse
from scipy.sparse import hstack

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ----------------- Helper Functions -----------------
def normalize(url: str):
    """
    Normalize URL: lowercase, strip trailing slash, remove query & fragment.
    """
    parsed = urlparse(url.strip().lower())
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"

# ----------------- Load whitelist/blacklist -----------------
WHITELIST = set(normalize(u) for u in pd.read_csv(os.path.join(BASE_DIR, "whitelist.csv"))['url'])
BLACKLIST = set(normalize(u) for u in pd.read_csv(os.path.join(BASE_DIR, "blacklist.csv"))['url'])

# ----------------- Load ML pipeline -----------------
PIPELINE_PATH = os.path.join(BASE_DIR, "ml_pipeline_fast.joblib")
pipeline = joblib.load(PIPELINE_PATH)

clf = pipeline
vectorizer = getattr(pipeline, 'named_steps', {}).get('vectorizer')
scaler = getattr(pipeline, 'named_steps', {}).get('scaler')

# ----------------- Compile regex patterns -----------------
REGEX_PATTERNS = [
    r"(\bor\b|\band\b)\s+[^=]*=.*",
    r"<script.*?>.*?</script>",
    r"on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",
    r"javascript\s*:\s*[^\s>]+",
    r"\.\./",
]
COMPILED_REGEX = [(p, re.compile(p, re.IGNORECASE | re.DOTALL)) for p in REGEX_PATTERNS]

# ----------------- FastAPI -----------------
app = FastAPI(title="Hybrid URL WAF")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ----------------- Stats, Alerts, Ingestion -----------------
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

# ----------------- ML Metrics Loader -----------------
def load_ml_metrics():
    metrics_file = os.path.join(BASE_DIR, "ml_metrics.csv")
    if os.path.exists(metrics_file):
        df = pd.read_csv(metrics_file)
        if not df.empty:
            row = df.iloc[0]
            return {
                "accuracy": row.get('accuracy_hybrid', None),
                "precision": row.get('precision_hybrid', None),
                "recall": row.get('recall_hybrid', None),
                "f1_score": row.get('f1_score_hybrid', None)
            }
    return {"accuracy": None, "precision": None, "recall": None, "f1_score": None}

# ----------------- Helper Functions -----------------
def update_streaming_rate():
    elapsed_sec = max(1, time.time() - STATS["start_time"])
    INGESTION["streaming"]["rate"] = f"{STATS['requests']/elapsed_sec:.2f} lines/sec"

def check_regex(url: str):
    for candidate in [url, unquote_plus(url)]:
        for pattern_str, patt in COMPILED_REGEX:
            if patt.search(candidate):
                return True, pattern_str
    return False, None

def extract_features(url: str):
    return [[len(url), url.count('?'), url.count('='), url.count('.'), url.count('-'), url.count('/')]]

def check_ml(url: str):
    url_norm = normalize(url)
    if url_norm in WHITELIST:
        return False, 0.0
    if url_norm in BLACKLIST:
        return True, 1.0

    X_basic = extract_features(url_norm)
    if vectorizer:
        X_vect = vectorizer.transform([url_norm])
        X_combined = hstack([X_vect, X_basic])
    else:
        X_combined = X_basic

    if scaler:
        X_combined = scaler.transform(X_combined)

    prob = float(clf.predict_proba(X_combined)[0][1])
    return prob >= 0.5, prob

def flag_url(url: str):
    url_norm = normalize(url)

    # ----------------- Whitelist/Blacklist -----------------
    if url_norm in WHITELIST:
        return {
            "url": url,
            "flagged": False,
            "source": "whitelist",
            "matched_pattern": None,
            "probability": 0.0
        }
    if url_norm in BLACKLIST:
        return {
            "url": url,
            "flagged": True,
            "source": "blacklist",
            "matched_pattern": None,
            "probability": 1.0
        }

    # ----------------- Regex + ML -----------------
    regex_flagged, matched_pattern = check_regex(url)
    ml_flagged, ml_prob = check_ml(url)
    hybrid_prob = min(1.0, ml_prob + 0.1 * regex_flagged)
    flagged = regex_flagged or ml_flagged
    source = "regex" if regex_flagged else "ml"

    return {
        "url": url,
        "flagged": flagged,
        "source": source,
        "matched_pattern": matched_pattern,
        "probability": round(hybrid_prob, 3)
    }

# ----------------- Endpoints -----------------
@app.post("/alerts")
def submit_alert(payload: dict = Body(...)):
    url = payload.get("text")
    if not url:
        raise HTTPException(400, "No URL provided")
    STATS["requests"] += 1

    result = flag_url(url)
    level = "CRITICAL" if result["flagged"] else "LOW"
    alert = {"level": level, "text": url, "ts": "just now"}
    result["alert"] = alert

    ALERTS.insert(0, alert)
    if result["flagged"]:
        if result["source"] == "regex":
            STATS["regex_flagged"] += 1
        else:
            STATS["ml_flagged"] += 1
        STATS["blocked"] += 1
    else:
        STATS["not_flagged"] += 1

    INGESTION["batch"]["logs"] += 1
    INGESTION["batch"]["last_run"] = time.strftime("%Y-%m-%d %H:%M:%S")
    update_streaming_rate()
    return result

@app.post("/test-batch")
def test_batch(payload: dict = Body(...)):
    urls = payload.get("urls")
    if not urls or not isinstance(urls, list):
        raise HTTPException(400, "Provide a list of URLs under 'urls'")
    results = [flag_url(u) for u in urls]

    STATS["requests"] += len(results)
    for r in results:
        if r["flagged"]:
            if r["source"] == "regex":
                STATS["regex_flagged"] += 1
            else:
                STATS["ml_flagged"] += 1
            STATS["blocked"] += 1
        else:
            STATS["not_flagged"] += 1

    INGESTION["batch"]["logs"] += len(results)
    INGESTION["batch"]["last_run"] = time.strftime("%Y-%m-%d %H:%M:%S")
    update_streaming_rate()
    return {"results": results, "count": len(results)}

@app.get("/alerts")
def get_alerts():
    return ALERTS

@app.get("/metrics")
def get_metrics():
    uptime_hours = int((time.time() - STATS["start_time"]) // 3600)
    return {
        **STATS,
        "uptime": f"{uptime_hours}h",
        "ml_metrics": load_ml_metrics()  # dynamic load
    }

@app.get("/ingestion")
def get_ingestion():
    update_streaming_rate()
    return INGESTION

@app.get("/model")
def get_model():
    return {
        "version": "v2.4 Hybrid (Regex + ML + Whitelist/Blacklist)",
        "last_retrain": "manual run via train_ml_flagger.py",
        "incremental_data": f"{STATS['requests']} requests ingested",
        "threshold": 0.5
    }
