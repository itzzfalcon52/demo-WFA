import DOMPurify from "dompurify";
import { Shield, Clock } from "lucide-react";

export default function AttackFeed({ alerts }) {
  return (
    <div className="rounded-xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-red-500/20">
          <Shield className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Live Attack Feed</h2>
          <p className="text-xs text-slate-400">Real-time threat detection</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {alerts?.map((a, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 rounded-lg bg-slate-700/50 border border-slate-600/50 hover:border-slate-500 transition-all"
          >
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                a.level === "CRITICAL"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : a.level === "HIGH"
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              }`}
            >
              {a.level}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 break-words">{a.text}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {a.ts}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
