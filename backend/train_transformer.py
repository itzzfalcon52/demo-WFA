# train_transformer.py
import os
import pandas as pd
from sklearn.utils import shuffle
from sklearn.model_selection import GroupShuffleSplit
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from sklearn.metrics import (
    precision_recall_fscore_support,
    accuracy_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
)
import torch
from torch.nn import CrossEntropyLoss



BASE_DIR = os.getcwd()
MODEL_DIR = os.path.join(BASE_DIR, "tiny_waf_model")

# ---------- Load dataset ----------
df = pd.read_csv("urldata.csv")   # expects: url,label,result
df = shuffle(df, random_state=42).reset_index(drop=True)

print(f"Full dataset size: {len(df)}, benign={sum(df['result']==0)}, malicious={sum(df['result']==1)}")

# ---------- Extract domain ----------
df['domain'] = df['url'].str.extract(r'//([^/]+)/')[0].fillna("unknown")

# ---------- Domain-level split ----------
splitter = GroupShuffleSplit(test_size=0.2, n_splits=1, random_state=42)
train_idx, test_idx = next(splitter.split(df, groups=df['domain']))

train_df = df.iloc[train_idx]
test_df  = df.iloc[test_idx]

print(f"Train size: {len(train_df)}, Test size: {len(test_df)}")
print(f"Unique train domains: {train_df['domain'].nunique()}, test domains: {test_df['domain'].nunique()}")

# ---------- HuggingFace datasets ----------
MODEL_NAME = "prajjwal1/bert-tiny"   # tiny (~15MB)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

train_hf = pd.DataFrame({
    "text": train_df['url'].astype(str),
    "label": train_df['result'].astype(int)
})
test_hf = pd.DataFrame({
    "text": test_df['url'].astype(str),
    "label": test_df['result'].astype(int)
})

train_ds = Dataset.from_pandas(train_hf)
test_ds = Dataset.from_pandas(test_hf)

def tokenize(batch):
    return tokenizer(batch["text"], truncation=True, padding="max_length", max_length=64)

train_ds = train_ds.map(tokenize, batched=True)
test_ds = test_ds.map(tokenize, batched=True)

# ---------- Model ----------
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)

# Handle class imbalance with weighted loss

class WeightedTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):  # <--- added **kwargs
        labels = inputs.get("labels")
        outputs = model(**inputs)
        logits = outputs.get("logits")

        # Class weights: inverse frequency
        class_counts = train_df['result'].value_counts(normalize=True)
        weight = torch.tensor([
            1.0 / class_counts[0],
            1.0 / class_counts[1]
        ], device=logits.device, dtype=torch.float32)

        loss_fct = CrossEntropyLoss(weight=weight)
        loss = loss_fct(
            logits.view(-1, self.model.config.num_labels),
            labels.view(-1)
        )

        return (loss, outputs) if return_outputs else loss

# ---------- Training Args ----------
args = TrainingArguments(
    output_dir=MODEL_DIR,
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=5e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=2,
    weight_decay=0.01,
    save_total_limit=1,
    load_best_model_at_end=True,
    metric_for_best_model="f1"
)

# ---------- Metrics ----------
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = logits.argmax(-1)

    acc = accuracy_score(labels, preds)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average="binary")

    try:
        auc = roc_auc_score(labels, logits[:,1])
    except:
        auc = None
    try:
        pr_auc = average_precision_score(labels, logits[:,1])
    except:
        pr_auc = None

    # Confusion matrix
    tn, fp, fn, tp = confusion_matrix(labels, preds).ravel()

    return {
        "accuracy": acc,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": auc,
        "pr_auc": pr_auc,
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "tp": tp
    }

trainer = WeightedTrainer(
    model=model,
    args=args,
    train_dataset=train_ds,
    eval_dataset=test_ds,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics
)

trainer.train()

# ---------- Save model ----------
trainer.save_model(MODEL_DIR)
tokenizer.save_pretrained(MODEL_DIR)
torch.save(model.state_dict(), os.path.join(MODEL_DIR, "pytorch_model.bin"))
print("✅ Transformer model saved at:", MODEL_DIR)

# ---------- Evaluate & Save Metrics ----------
eval_results = trainer.evaluate(test_ds)
print("📊 Evaluation results:", eval_results)

metrics_df = pd.DataFrame([{
    "accuracy": eval_results.get("eval_accuracy", None),
    "precision": eval_results.get("eval_precision", None),
    "recall": eval_results.get("eval_recall", None),
    "f1_score": eval_results.get("eval_f1", None),
    "roc_auc": eval_results.get("eval_roc_auc", None),
    "pr_auc": eval_results.get("eval_pr_auc", None),
    "tn": eval_results.get("eval_tn", None),
    "fp": eval_results.get("eval_fp", None),
    "fn": eval_results.get("eval_fn", None),
    "tp": eval_results.get("eval_tp", None),
}])
metrics_path = os.path.join(BASE_DIR, "ml_metrics_transformer.csv")
metrics_df.to_csv(metrics_path, index=False)
print("📊 Metrics saved to:", metrics_path)
