"""
FastAPI WAF: Regex + Optional Transformer (TinyBERT) Detection
Render-ready: binds to $PORT and allows CORS
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Tuple
import re
from urllib.parse import unquote_plus
import logging
import os
import time
from fastapi.responses import JSONResponse


# ----------------- Transformer Setup -----------------
TRANSFORMER_AVAILABLE = False
try:
    from transformers import pipeline
    TRANSFORMER_AVAILABLE = True
except Exception:
    TRANSFORMER_AVAILABLE = False

# ----------------- Configuration -----------------
MODEL_ID = os.getenv("WAF_MODEL_ID", "prajjwal1/bert-tiny")  # tiny model
TRANSFORMER_THRESHOLD = float(os.getenv("WAF_THRESHOLD", "0.75"))
MAX_INPUT_CHARS = int(os.getenv("WAF_MAX_INPUT_CHARS", "2000"))

# ----------------- Logging -----------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("waf")

# ----------------- Regex-based rules -----------------
MALICIOUS_PATTERNS = [
    r"(\bor\b|\band\b)\s+[^=]*=.*",
    r"<script.*?>.*?</script>",
    r"on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",
    r"javascript\s*:\s*[^\s>]+",
    r"data\s*:\s*(text|application)\/javascript",
    r"\.\./",
    r"<[^>]*(alert\s*\(|on\w+\s*=)[^>]*>",
    r"alert\s*\("
]
COMPILED_PATTERNS = [(p, re.compile(p, re.IGNORECASE | re.DOTALL)) for p in MALICIOUS_PATTERNS]

# ----------------- App & Data -----------------
app = FastAPI(title="Regex+Transformer WAF", version="0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],  # Add this line
)


ALERTS: List[Dict[str, Any]] = []

class AlertIn(BaseModel):
    text: str
    source: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# ----------------- Transformer -----------------
clf = None

# ----------------- Utility Functions -----------------
def check_malicious_regex(text: str) -> Tuple[bool, Optional[str], str]:
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
    try:
        decoded = unquote_plus(text)
    except Exception:
        decoded = text
    s = decoded if decoded else text
    s = " ".join(s.split())
    if len(s) > MAX_INPUT_CHARS:
        s = s[:MAX_INPUT_CHARS]
    return s

async def check_transformer(text: str, threshold: float = TRANSFORMER_THRESHOLD) -> Tuple[bool, float, str, Any]:
    global clf
    if not TRANSFORMER_AVAILABLE or clf is None:
        return False, 0.0, "TRANSFORMER_UNAVAILABLE", None
    inp = normalize_input(text)
    try:
        out = clf(inp)
        if not out:
            return False, 0.0, "NO_OUTPUT", out
        top = out[0]
        label = str(top.get("label", ""))
        score = float(top.get("score", 0.0))
        lab_upper = label.upper()
        if lab_upper in ("MALICIOUS", "ATTACK", "POSITIVE", "LABEL_1"):
            is_malicious = score >= threshold
        elif lab_upper in ("BENIGN", "CLEAN", "NEGATIVE", "LABEL_0"):
            is_malicious = False
        else:
            is_malicious = score >= threshold
        return is_malicious, score, label, top
    except Exception as e:
        logger.exception("Transformer inference failed")
        return False, 0.0, "ERROR", str(e)

# ----------------- Startup Event -----------------
@app.on_event("startup")
def startup_event():
    global clf
    if TRANSFORMER_AVAILABLE:
        try:
            logger.info(f"Loading transformer model: {MODEL_ID}")
            clf = pipeline("text-classification", model=MODEL_ID, device=-1)  # CPU
            logger.info("Transformer loaded")
        except Exception as e:
            logger.exception("Failed to load transformer; fallback to regex-only")
            clf = None
    else:
        logger.warning("transformers library not available; regex-only mode")

# ----------------- API Endpoints -----------------
@app.get("/alerts")
def get_alerts():
    return ALERTS

@app.post("/alerts")
async def submit_alert(payload: AlertIn):
    text = payload.text
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    t0 = time.time()
    is_malicious_regex, matched_pattern, checked_text = check_malicious_regex(text)
    is_malicious_ml, ml_score, ml_label, ml_out = await check_transformer(text)
    is_malicious = is_malicious_regex or is_malicious_ml
    level = "CRITICAL" if is_malicious else "LOW"
    alert = {"level": level, "text": text, "ts": "just now", "ml": {"flagged": is_malicious_ml, "label": ml_label, "score": ml_score, "raw": ml_out}}
    if is_malicious:
        ALERTS.insert(0, {**alert, "reason": ml_label if is_malicious_ml else matched_pattern or "regex"})
        logger.warning("[ALERT] regex=%s ml=%s (label=%s score=%.3f) text=%s", is_malicious_regex, is_malicious_ml, ml_label, ml_score, text)
    else:
        logger.info("[OK] regex=%s ml=%s (label=%s score=%.3f) text=%s", is_malicious_regex, is_malicious_ml, ml_label, ml_score, text)
    t1 = time.time()
    return {
        "flagged": is_malicious,
        "alert": alert,
        "matched_pattern": matched_pattern,
        "checked_text": checked_text,
        "timings": {"start": t0, "end": t1, "inference_ms": int((t1-t0)*1000)}
    }
@app.get("/metrics")
def get_metrics():
    try:
        total_requests = len(ALERTS)

        blocked = 0
        ml_flagged = 0
        regex_flagged = 0
        ml_scores = []

        for a in ALERTS:
            if not isinstance(a, dict):
                continue  # skip malformed alerts
            level = a.get("level", "")
            ml = a.get("ml") or {}

            flagged_ml = bool(ml.get("flagged", False))

            if level == "CRITICAL" or flagged_ml:
                blocked += 1
            if flagged_ml:
                ml_flagged += 1
            if level == "CRITICAL" and not flagged_ml:
                regex_flagged += 1
            try:
                ml_scores.append(float(ml.get("score", 0.0)))
            except Exception:
                continue

        avg_ml_score = round(sum(ml_scores)/len(ml_scores), 3) if ml_scores else 0.0

        return {
            "requests_total": total_requests,
            "alerts_blocked": blocked,
            "ml_flagged": ml_flagged,
            "regex_flagged": regex_flagged,
            "ml_score_avg": avg_ml_score,
            "uptime": "24h"
        }

    except Exception as e:
        logger.exception("Error generating metrics")
        return JSONResponse(
            status_code=500,
            content={"error": "Metrics calculation failed", "details": str(e)}
        )

@app.get("/ingestion")
def get_ingestion():
    # Safely get the last 100 alerts
    recent_alerts = ALERTS[-100:] if ALERTS else []
    recent_alerts_count = len(recent_alerts)

    # Calculate a simple rate (alerts per 5 seconds window)
    rate = recent_alerts_count / 5 if recent_alerts_count > 0 else 0.0

    return {
        "batch": {
            "status": "processed",
            "logs": len(ALERTS),
            "last_run": "just now"  # Could be extended with actual timestamps
        },
        "streaming": {
            "status": "active" if recent_alerts_count > 0 else "idle",
            "rate": f"{rate:.1f} alerts/sec"
        }
    }

@app.get("/model")
def get_model():
    return {"version": MODEL_ID, "transformer_loaded": TRANSFORMER_AVAILABLE and clf is not None}

@app.get("/health")
def health():
    return {"status": "ok"}


# ----------------- Run App -----------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))  # required for Render
    uvicorn.run("fastapi_transformer_waf:app", host="0.0.0.0", port=port, reload=True)
