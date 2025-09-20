# train_ml_flagger.py
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split

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

# ----------------- Save Model -----------------
joblib.dump(clf, "ml_model.joblib")
