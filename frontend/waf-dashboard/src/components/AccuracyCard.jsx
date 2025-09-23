// components/AccuracyCard.jsx
import React from "react";

const AccuracyCard = ({ ml_metrics }) => {
  const metrics = {
    accuracy: Number(ml_metrics?.accuracy) * 100,
    precision: Number(ml_metrics?.precision) * 100,
    recall: Number(ml_metrics?.recall) * 100,
    f1_score: Number(ml_metrics?.f1_score) * 100,
    roc_auc: Number(ml_metrics?.roc_auc) * 100,
    pr_auc: Number(ml_metrics?.pr_auc) * 100,
    tn: ml_metrics?.tn,
    fp: ml_metrics?.fp,
    fn: ml_metrics?.fn,
    tp: ml_metrics?.tp,
  };

  const hasMetrics = Object.values(metrics).some(
    (v) => !isNaN(v) && v !== null
  );

  return (
    <div className="rounded-lg p-4 bg-gradient-to-r from-green-700 to-green-500 shadow-md text-white">
      <h3 className="text-lg font-bold mb-2">Transformer Metrics</h3>
      {hasMetrics ? (
        <ul className="text-sm space-y-1">
          <li>
            <span className="font-medium">Accuracy:</span>{" "}
            {metrics.accuracy.toFixed(3)}%
          </li>
          <li>
            <span className="font-medium">Precision:</span>{" "}
            {metrics.precision.toFixed(3)}%
          </li>
          <li>
            <span className="font-medium">Recall:</span>{" "}
            {metrics.recall.toFixed(3)}%
          </li>
          <li>
            <span className="font-medium">F1 Score:</span>{" "}
            {metrics.f1_score.toFixed(3)}%
          </li>
          <li>
            <span className="font-medium">ROC-AUC:</span>{" "}
            {isNaN(metrics.roc_auc) ? "N/A" : metrics.roc_auc.toFixed(3) + "%"}
          </li>
          <li>
            <span className="font-medium">PR-AUC:</span>{" "}
            {isNaN(metrics.pr_auc) ? "N/A" : metrics.pr_auc.toFixed(3) + "%"}
          </li>
          <li className="mt-2 font-semibold">Confusion Matrix</li>
          <li className="text-xs">
            TN: {metrics.tn ?? "?"}, FP: {metrics.fp ?? "?"}, FN:{" "}
            {metrics.fn ?? "?"}, TP: {metrics.tp ?? "?"}
          </li>
        </ul>
      ) : (
        <p className="text-gray-200 text-sm">No metrics available</p>
      )}

      {/* Disclaimer */}
      <div className="mt-4 p-2 rounded bg-gray-900 text-gray-200 text-xs">
        ⚠️ <span className="font-semibold">Note:</span> Metrics appear
        unrealistically high because the demo uses a Kaggle URL dataset where
        malicious vs benign links are easily separable. In the{" "}
        <span className="font-semibold">final product</span>, the model will be
        retrained on{" "}
        <span className="font-semibold">real application logs</span>
        (HTTP headers, query params, bodies). Performance will be lower but
        reflect realistic, adversarial conditions.
      </div>
    </div>
  );
};

export default AccuracyCard;
