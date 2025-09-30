// components/AccuracyCard.jsx
import React from "react";
import { TrendingUp, AlertTriangle, Target } from "lucide-react";

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
    <div className="rounded-xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Target className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Model Performance
          </h3>
          <p className="text-xs text-slate-400">Transformer metrics</p>
        </div>
      </div>

      {hasMetrics ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs text-slate-400 mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-emerald-300">
                {metrics.accuracy.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-slate-400 mb-1">Precision</p>
              <p className="text-2xl font-bold text-blue-300">
                {metrics.precision.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs text-slate-400 mb-1">Recall</p>
              <p className="text-2xl font-bold text-purple-300">
                {metrics.recall.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-slate-400 mb-1">F1 Score</p>
              <p className="text-2xl font-bold text-amber-300">
                {metrics.f1_score.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-5 border border-slate-600">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              Confusion Matrix
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                <p className="text-xs text-slate-400 mb-2">True Negative</p>
                <p className="text-3xl font-bold text-emerald-300">
                  {metrics.tn || 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                <p className="text-xs text-slate-400 mb-2">False Positive</p>
                <p className="text-3xl font-bold text-orange-300">
                  {metrics.fp || 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                <p className="text-xs text-slate-400 mb-2">False Negative</p>
                <p className="text-3xl font-bold text-orange-300">
                  {metrics.fn || 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                <p className="text-xs text-slate-400 mb-2">True Positive</p>
                <p className="text-3xl font-bold text-emerald-300">
                  {metrics.tp || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">
                <span className="font-semibold">Demo Note:</span> Metrics appear
                unrealistically high due to Kaggle dataset. Production model
                will show realistic performance on real application logs.
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-slate-400 text-center py-8">No metrics available</p>
      )}
    </div>
  );
};

export default AccuracyCard;
