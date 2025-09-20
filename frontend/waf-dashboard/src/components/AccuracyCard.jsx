// components/AccuracyCard.jsx
import React from "react";

const AccuracyCard = ({ ml_metrics }) => {
  const metrics = {
    accuracy: Number(ml_metrics?.accuracy) * 100,
    precision: Number(ml_metrics?.precision) * 100,
    recall: Number(ml_metrics?.recall) * 100,
    f1_score: Number(ml_metrics?.f1_score) * 100,
  };

  const hasMetrics = Object.values(metrics).some((v) => !isNaN(v));

  return (
    <div className="rounded-lg p-4 bg-gradient-to-r from-green-700 to-green-500 shadow-md text-white">
      <h3 className="text-lg font-bold mb-2">ML + Regex Accuracy</h3>
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
        </ul>
      ) : (
        <p className="text-gray-200 text-sm">No metrics available</p>
      )}
    </div>
  );
};

export default AccuracyCard;
