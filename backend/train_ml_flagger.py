import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# ----------------- Load Dataset -----------------
df = pd.read_csv("urldata.csv")  # columns: index,url,label,result
if 'url' not in df.columns or 'label' not in df.columns:
    raise ValueError("CSV must have 'url' and 'label' columns")

urls = df['url'].dropna().tolist()
labels = df['label'].tolist()

# ----------------- Normalize URLs -----------------
def normalize(url):
    return url.strip().lower().rstrip('/')

urls = [normalize(url) for url in urls]

# ----------------- Train/Test Split -----------------
X_train, X_test, y_train, y_test = train_test_split(
    urls, labels, test_size=0.1, random_state=42, stratify=labels
)

# ----------------- Build ML Pipeline -----------------
clf = make_pipeline(
    TfidfVectorizer(ngram_range=(1,4), analyzer='char_wb', max_features=20000),
    LogisticRegression(class_weight='balanced', max_iter=2000)
)

# ----------------- Train Model -----------------
clf.fit(X_train, y_train)

# ----------------- Evaluate -----------------
y_pred = clf.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, pos_label="malicious")
recall = recall_score(y_test, y_pred, pos_label="malicious")
f1 = f1_score(y_test, y_pred, pos_label="malicious")

print(f"Accuracy: {accuracy:.4f}, Precision: {precision:.4f}, Recall: {recall:.4f}, F1: {f1:.4f}")

# ----------------- Save Model -----------------
joblib.dump(clf, "ml_model.joblib")

# ----------------- Save Metrics -----------------
metrics_df = pd.DataFrame([{
    "accuracy": accuracy,
    "precision": precision,
    "recall": recall,
    "f1_score": f1
}])
metrics_df.to_csv("ml_metrics.csv", index=False)

print("✅ ML model and metrics saved successfully")
