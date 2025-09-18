export default function MetricsCard({ metrics }) {
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:scale-105 transition-all">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center">
        <span className="inline-block w-3 h-3 rounded-full bg-green-400 animate-pulse mr-2"></span>
        System Metrics
      </h2>
      <ul className="space-y-2 text-white">
        <li className="flex justify-between">
          <span className="text-gray-200">Requests/sec</span>
          <span className="font-bold">{metrics.requests_sec || 0}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-200">Anomalies</span>
          <span className="font-bold">{metrics.anomalies || 0}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-200">Blocked</span>
          <span className="font-bold">{metrics.blocked || 0}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-200">Uptime</span>
          <span className="font-bold">{metrics.uptime || "0h"}</span>
        </li>
      </ul>
    </div>
  );
}
