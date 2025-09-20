"""
FastAPI app: combined regex + transformer (Hugging Face) detection layer


"""

from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Tuple
import re
from urllib.parse import unquote_plus
import logging
import os
import time
import random

# Optional transformer imports will be attempted at startup
TRANSFORMER_AVAILABLE = False
try:
    from transformers import pipeline
    TRANSFORMER_AVAILABLE = True
except Exception:
    TRANSFORMER_AVAILABLE = False

# ----------------- Configuration -----------------
MODEL_ID = os.getenv("WAF_MODEL_1.0", "")  
TRANSFORMER_THRESHOLD = float(os.getenv("WAF_THRESHOLD", "0.85"))
MAX_INPUT_CHARS = int(os.getenv("WAF_MAX_INPUT_CHARS", "2000"))  # basic truncation

# ----------------- Logging -----------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("waf")

# ----------------- Regex-based rules -----------------
MALICIOUS_PATTERNS = [
    r"(\bor\b|\band\b)\s+[^=]*=.*",                    # crude SQL injection
    r"<script.*?>.*?</script>",                            # <script> tags
    r"on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)", # event handlers
    r"javascript\s*:\s*[^\s>]+",                         # javascript: URIs
    r"data\s*:\s*(text|application)\/javascript",        # data: js payload
    r"\.\./",                                            # path traversal
    r"<[^>]*(alert\s*\(|on\w+\s*=)[^>]*>",             # tags with alert() or on*
    r"alert\s*\("                                      # catch alert() anywhere
]
COMPILED_PATTERNS = [(p, re.compile(p, re.IGNORECASE | re.DOTALL)) for p in MALICIOUS_PATTERNS]

# ----------------- App & data structures -----------------
app = FastAPI(title="Regex+Transformer WAF", version="0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALERTS: List[Dict[str, Any]] = []

class AlertIn(BaseModel):
    text: str
    source: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# ----------------- Transformer pipeline holder -----------------
clf = None

# ----------------- Utility functions -----------------

def check_malicious_regex(text: str) -> Tuple[bool, Optional[str], str]:
    """Return (is_malicious, matched_pattern, checked_text)"""
    if not isinstance(text, str):
        return False, None, str(text)

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


def normalize_input(text: str) -> str:
    """Preprocess the input for the transformer: decode, collapse whitespace, optional lowercasing."""
    try:
        decoded = unquote_plus(text)
    except Exception:
        decoded = text
    # combine decoded/original to preserve signals - here we use decoded
    s = decoded if decoded else text
    # collapse excessive whitespace
    s = " ".join(s.split())
    # optionally lowercase if model is uncased; for a safe default we do not force lowercase
    if len(s) > MAX_INPUT_CHARS:
        s = s[:MAX_INPUT_CHARS]
    return s


async def check_transformer(text: str, threshold: float = TRANSFORMER_THRESHOLD) -> Tuple[bool, float, str, Any]:
    """Run transformer pipeline; returns (is_malicious, score, label, raw_output)
    If transformer not available, returns False, 0.0, 'TRANSFORMER_UNAVAILABLE', None
    """
    global clf
    if not TRANSFORMER_AVAILABLE or clf is None:
        return False, 0.0, "TRANSFORMER_UNAVAILABLE", None

    inp = normalize_input(text)
    try:
        # pipeline handles tokenization + truncation; we call it once
        out = clf(inp)
        if not out:
            return False, 0.0, "NO_OUTPUT", out
        top = out[0]
        label = str(top.get("label", ""))
        score = float(top.get("score", 0.0))

        # Interpret labels - common schemes: MALICIOUS/BENIGN or labels 'LABEL_0' etc.
        is_malicious = False
        lab_upper = label.upper()
        if lab_upper in ("MALICIOUS", "ATTACK", "POSITIVE", "LABEL_1"):
            is_malicious = (score >= threshold)
        elif lab_upper in ("BENIGN", "CLEAN", "NEGATIVE", "LABEL_0"):
            is_malicious = False
        else:
            # unknown label names: assume label meaning MALICIOUS when score high and label isn't something like 'NEGATIVE'/'BENIGN'
            is_malicious = (score >= threshold)

        return is_malicious, score, label, top
    except Exception as e:
        logger.exception("Transformer inference failed")
        return False, 0.0, "ERROR", str(e)


# ----------------- Startup event: initialize model -----------------
@app.on_event("startup")
def startup_event():
    global clf
    if TRANSFORMER_AVAILABLE:
        try:
            model_id = MODEL_ID or "distilbert-base-uncased-finetuned-sst-2-english"
            logger.info(f"Loading transformer model: {model_id}")
            # pipeline may download the model the first time
            clf = pipeline("text-classification", model=model_id, device=-1)  # device=-1 -> CPU
            logger.info("Transformer loaded")
        except Exception as e:
            logger.exception("Failed to load transformer; falling back to regex-only")
            clf = None
    else:
        logger.warning("transformers library not available; running regex-only mode")


# ----------------- API endpoints -----------------
@app.get("/alerts")
def get_alerts():
    return ALERTS


@app.post("/alerts")
async def submit_alert(payload: AlertIn):
    text = payload.text
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    t0 = time.time()
    # regex check
    is_malicious_regex, matched_pattern, checked_text = check_malicious_regex(text)

    # transformer check
    is_malicious_ml, ml_score, ml_label, ml_out = await check_transformer(text)

    # final decision: flagged if either regex OR transformer says so
    is_malicious = is_malicious_regex or is_malicious_ml
    level = "CRITICAL" if is_malicious else "LOW"

    alert = {"level": level, "text": text, "ts": "just now"}

    # record alert for quick UI
    if is_malicious:
        ALERTS.insert(0, {**alert, "reason": ml_label if is_malicious_ml else matched_pattern or "regex"})

    # logging — include both signals for triage
    if is_malicious:
        logger.warning("[ALERT] regex=%s ml=%s (label=%s score=%.3f) text=%s",
                       is_malicious_regex, is_malicious_ml, ml_label, ml_score, text)
    else:
        logger.info("[OK] regex=%s ml=%s (label=%s score=%.3f) text=%s",
                    is_malicious_regex, is_malicious_ml, ml_label, ml_score, text)

    t1 = time.time()
    resp = {
        "flagged": is_malicious,
        "alert": alert,
        "matched_pattern": matched_pattern,
        "checked_text": checked_text,
        "ml": {"available": TRANSFORMER_AVAILABLE and clf is not None, "label": ml_label, "score": ml_score, "flagged": is_malicious_ml, "raw": ml_out},
        "timings": {"start": t0, "end": t1, "inference_ms": int((t1 - t0) * 1000)}
    }
    return resp


@app.get("/metrics")
def get_metrics():
    total_requests = len(ALERTS)
    blocked = sum(
        1 for a in ALERTS
        if a.level == "CRITICAL" or (a.ml and a.ml.get("flagged"))
    )
    ml_flagged = sum(
        1 for a in ALERTS
        if a.ml and a.ml.get("flagged")
    )
    regex_flagged = sum(
        1 for a in ALERTS
        if a.level == "CRITICAL" and not (a.ml and a.ml.get("flagged"))
    )
    avg_ml_score = (
        sum(a.ml.get("score", 0) for a in ALERTS if a.ml) / ml_flagged
        if ml_flagged > 0 else 0.0
    )

    return {
        "requests_total": total_requests,
        "alerts_blocked": blocked,
        "ml_flagged": ml_flagged,
        "regex_flagged": regex_flagged,
        "ml_score_avg": round(avg_ml_score, 3),
        "uptime": "24h"  # replace with actual server uptime if needed
    }



@app.get("/ingestion")
def get_ingestion():
    recent_alerts_count = len(ALERTS[-100:])  # last 100 alerts
    rate = recent_alerts_count / 5  # assuming /metrics scraped every 5s
    return {
        "batch": {
            "status": "processed",
            "logs": len(ALERTS),
            "last_run": "just now"
        },
        "streaming": {
            "status": "active",
            "rate": f"{rate:.1f} alerts/sec"
        }
    }


@app.get("/model")
def get_model():
    return {
        "version": MODEL_ID or "distilbert-sst2-demo",
        "transformer_loaded": TRANSFORMER_AVAILABLE and clf is not None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_transformer_waf:app", host="0.0.0.0", port=8000, reload=True)
