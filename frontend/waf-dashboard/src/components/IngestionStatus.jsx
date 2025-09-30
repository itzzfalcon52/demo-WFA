import { Zap, Database } from "lucide-react";
export default function IngestionStatus({ ingestion }) {
  if (!ingestion) return null;
  const { batch, streaming } = ingestion;

  return (
    <div className="rounded-xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Database className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Data Ingestion</h3>
          <p className="text-xs text-slate-400">Pipeline status</p>
        </div>
      </div>

      {batch && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Batch Ingestion
            </h4>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-medium">
              {batch.status}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Logs Processed:</span>
              <span className="font-semibold text-white">
                {batch.logs?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Last Run:</span>
              <span className="font-semibold text-white">{batch.last_run}</span>
            </div>
          </div>
        </div>
      )}

      {streaming && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Streaming Ingestion
            </h4>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-medium">
              {streaming.status}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-300">
            <span>Rate:</span>
            <span className="font-semibold text-white flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              {streaming.rate}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
