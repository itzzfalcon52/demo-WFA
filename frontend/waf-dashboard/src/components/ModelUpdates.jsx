import { Brain } from "lucide-react";
export default function ModelUpdates({ model }) {
  if (!model) return null;

  return (
    <div className="rounded-xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Model Updates</h3>
          <p className="text-xs text-slate-400">Training & version info</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Version</p>
          <p className="text-xl font-bold text-white">
            {model.version || "N/A"}
          </p>
        </div>

        {model.accuracy && (
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
            <p className="text-xs text-slate-400 mb-1">Accuracy</p>
            <p className="text-xl font-bold text-emerald-400">
              {model.accuracy}%
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Last Retrain</p>
          <p className="text-sm font-semibold text-white">
            {model.last_retrain || "N/A"}
          </p>
        </div>

        {model.incremental_data && (
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
            <p className="text-xs text-slate-400 mb-1">Incremental Data</p>
            <p className="text-sm font-semibold text-white">
              {model.incremental_data}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
