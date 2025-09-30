// MetricsCard.jsx
import { Activity, Target, Brain, CheckCircle, XCircle } from "lucide-react";
export default function MetricsCard({ metrics }) {
  const data = [
    {
      label: "Total Requests",
      value: metrics.requests || 0,
      icon: Activity,
      color: "blue",
    },
    {
      label: "Regex Flagged",
      value: metrics.regex_flagged || 0,
      icon: Target,
      color: "orange",
    },
    {
      label: "ML Flagged",
      value: metrics.ml_flagged || 0,
      icon: Brain,
      color: "purple",
    },
    {
      label: "Not Flagged",
      value: metrics.not_flagged || 0,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "Blocked",
      value: metrics.blocked || 0,
      icon: XCircle,
      color: "red",
    },
  ];

  return (
    <div className="rounded-xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">System Metrics</h3>
          <p className="text-xs text-slate-400">Performance overview</p>
        </div>
        <div className="px-3 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30">
          <p className="text-xs text-emerald-300 font-medium">
            Uptime: {metrics.uptime || "0h"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {data.map((item, idx) => {
          const Icon = item.icon;
          const colorClasses = {
            blue: "bg-blue-500/10 border-blue-500/30 text-blue-300",
            orange: "bg-orange-500/10 border-orange-500/30 text-orange-300",
            purple: "bg-purple-500/10 border-purple-500/30 text-purple-300",
            emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
            red: "bg-red-500/10 border-red-500/30 text-red-300",
          };

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${colorClasses[item.color]}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" />
                <p className="text-xs font-medium">{item.label}</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {item.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
