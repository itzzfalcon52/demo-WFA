# app.py
import os, time, re
import pandas as pd
from urllib.parse import unquote_plus, urlparse
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ----------------- Helper: normalize URLs -----------------
def normalize(url: str):
    parsed = urlparse(url.strip().lower())
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"

# ----------------- Load whitelist/blacklist -----------------
WHITELIST = set(normalize(u) for u in pd.read_csv(os.path.join(BASE_DIR, "whitelist.csv"))['url'])
BLACKLIST = set(normalize(u) for u in pd.read_csv(os.path.join(BASE_DIR, "blacklist.csv"))['url'])

# ----------------- Load Transformer -----------------
MODEL_DIR = os.path.join(BASE_DIR, "tiny_waf_model")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
device = torch.device("cpu")
model.to(device).eval()

# ----------------- Regex patterns -----------------
REGEX_PATTERNS = [
    r"(\bor\b|\band\b)\s+[^=]*=.*",    # SQLi
    r"<script.*?>.*?</script>",        # XSS
    r"on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",  
    r"javascript\s*:\s*[^\s>]+",      
    r"\.\./",                          
]
COMPILED_REGEX = [(p, re.compile(p, re.IGNORECASE | re.DOTALL)) for p in REGEX_PATTERNS]

# ----------------- FastAPI -----------------
app = FastAPI(title="Hybrid Transformer WAF")
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

# ----------------- Load metrics (from training) -----------------
def load_ml_metrics():
    metrics_file = os.path.join(BASE_DIR, "ml_metrics_transformer.csv")
    if os.path.exists(metrics_file):
        df = pd.read_csv(metrics_file)
        if not df.empty:
            row = df.iloc[0]
            return {
                "accuracy": row.get("accuracy", None),
                "precision": row.get("precision", None),
                "recall": row.get("recall", None),
                "f1_score": row.get("f1_score", None),
                "roc_auc": row.get("roc_auc", None),
                "pr_auc": row.get("pr_auc", None),
                "tn": row.get("tn", None),
                "fp": row.get("fp", None),
                "fn": row.get("fn", None),
                "tp": row.get("tp", None),
            }
    return {
        "accuracy": None,
        "precision": None,
        "recall": None,
        "f1_score": None,
        "roc_auc": None,
        "pr_auc": None,
        "tn": None,
        "fp": None,
        "fn": None,
        "tp": None,
    }

# ----------------- Helpers -----------------
def update_streaming_rate():
    elapsed_sec = max(1, time.time() - STATS["start_time"])
    INGESTION["streaming"]["rate"] = f"{STATS['requests']/elapsed_sec:.2f} lines/sec"

def check_regex(url: str):
    for candidate in [url, unquote_plus(url)]:
        for pattern_str, patt in COMPILED_REGEX:
            if patt.search(candidate):
                return True, pattern_str
    return False, None

def check_ml(url: str):
    url_norm = normalize(url)
    if url_norm in WHITELIST:
        return False, 0.0
    if url_norm in BLACKLIST:
        return True, 1.0
    # Transformer inference
    inputs = tokenizer(url_norm, return_tensors="pt", truncation=True, padding="max_length", max_length=64)
    with torch.no_grad():
        logits = model(**inputs.to(device)).logits
        prob = float(torch.softmax(logits, dim=-1)[0][1])
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

    # ----------------- Regex + Transformer -----------------
    regex_flagged, matched_pattern = check_regex(url)
    ml_flagged, ml_prob = check_ml(url)

    # Hybrid probability
    hybrid_prob = min(1.0, ml_prob + 0.1 * regex_flagged)
    flagged = regex_flagged or ml_flagged

    # --- FIX: Explicit source labeling ---
    if regex_flagged:
        source = "regex"
    else:
        source = "ml"  # even if ml_prob < 0.5, we want to show it came from ML

    return {
        "url": url,
        "flagged": flagged,
        "source": source,
        "matched_pattern": matched_pattern,
        "probability": float(hybrid_prob)
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
        "ml_metrics": load_ml_metrics()  # dynamically read from CSV
    }

@app.get("/ingestion")
def get_ingestion():
    update_streaming_rate()
    return INGESTION

@app.get("/model")
def get_model():
    return {
        "version": "v3.0 Hybrid (Regex + Transformer + Whitelist/Blacklist)",
        "last_retrain": "via train_transformer.py",
        "incremental_data": f"{STATS['requests']} requests ingested",
        "threshold": 0.5
    }
