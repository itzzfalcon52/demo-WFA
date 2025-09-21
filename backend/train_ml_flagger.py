import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.utils import shuffle
import re
from urllib.parse import unquote_plus

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------- Load dataset ----------------
df = pd.read_csv("urldata.csv")
df = shuffle(df, random_state=42)

# Balance dataset 50-50
num_malicious = (df['result'] == 1).sum()
num_benign = (df['result'] == 0).sum()
n_samples = min(num_malicious, num_benign)
df_balanced = pd.concat([
    df[df['result']==1].sample(n=n_samples, random_state=42),
    df[df['result']==0].sample(n=n_samples, random_state=42)
])
df_balanced = shuffle(df_balanced, random_state=42).reset_index(drop=True)

# ---------------- Features ----------------
def url_features(url_series):
    return pd.DataFrame({
        'length': url_series.str.len(),
        'num_query': url_series.str.count(r'\?'),
        'num_equals': url_series.str.count(r'='),
        'num_dots': url_series.str.count(r'\.'),
        'num_hyphens': url_series.str.count(r'-'),
        'num_slashes': url_series.str.count(r'/'),
    })

X = url_features(df_balanced['url'])
y = df_balanced['result']

X_train, X_test, y_train, y_test, urls_train, urls_test = train_test_split(
    X, y, df_balanced['url'], test_size=0.2, random_state=42, stratify=y
)

# ---------------- ML Pipeline ----------------
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    ))
])
pipeline.fit(X_train, y_train)

# ---------------- Regex Patterns ----------------
REGEX_PATTERNS = [
    r"(\bor\b|\band\b)\s+[^=]*=.*",         # SQLi
    r"<script.*?>.*?</script>",             # XSS
    r"on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",  # Event handlers
    r"javascript\s*:\s*[^\s>]+",            # JS URI
    r"\.\./",                               # Path traversal
]
COMPILED_REGEX = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in REGEX_PATTERNS]

# ---------------- Hybrid Flags ----------------
def regex_flag_vectorized(urls):
    """Return boolean array if any regex matches"""
    flagged = []
    for url in urls:
        match = any(p.search(url) or p.search(unquote_plus(url)) for p in COMPILED_REGEX)
        flagged.append(match)
    return pd.Series(flagged)

# ML predictions
ml_probs = pipeline.predict_proba(X_test)[:, 1]
ml_flags = ml_probs >= 0.5

# Regex flags
regex_flags = regex_flag_vectorized(urls_test)

# Hybrid probability (ML + small boost if regex matched)
regex_boost = 0.1
hybrid_probs = ml_probs + regex_flags.astype(float) * regex_boost
hybrid_probs = hybrid_probs.clip(0, 1)
hybrid_flags = hybrid_probs >= 0.5

# ---------------- Metrics ----------------
metrics = {
    "accuracy_ml": accuracy_score(y_test, ml_flags),
    "precision_ml": precision_score(y_test, ml_flags),
    "recall_ml": recall_score(y_test, ml_flags),
    "f1_score_ml": f1_score(y_test, ml_flags),
    "accuracy_hybrid": accuracy_score(y_test, hybrid_flags),
    "precision_hybrid": precision_score(y_test, hybrid_flags),
    "recall_hybrid": recall_score(y_test, hybrid_flags),
    "f1_score_hybrid": f1_score(y_test, hybrid_flags)
}

print("ML-only Metrics:")
print(f"accuracy: {metrics['accuracy_ml']:.4f}")
print(f"precision: {metrics['precision_ml']:.4f}")
print(f"recall: {metrics['recall_ml']:.4f}")
print(f"f1_score: {metrics['f1_score_ml']:.4f}\n")

print("Hybrid (Regex + ML) Metrics:")
print(f"accuracy: {metrics['accuracy_hybrid']:.4f}")
print(f"precision: {metrics['precision_hybrid']:.4f}")
print(f"recall: {metrics['recall_hybrid']:.4f}")
print(f"f1_score: {metrics['f1_score_hybrid']:.4f}")

# ---------------- Save Pipeline & Metrics ----------------
joblib.dump(pipeline, os.path.join(BASE_DIR, 'ml_pipeline_fast.joblib'))

metrics_df = pd.DataFrame([metrics])
metrics_df.to_csv(os.path.join(BASE_DIR, 'ml_metrics.csv'), index=False)
print("Pipeline and metrics saved successfully.")
