import DOMPurify from "dompurify";

export default function AttackFeed({ alerts }) {
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center">
        <span className="inline-block w-3 h-3 rounded-full bg-red-400 animate-pulse mr-2"></span>
        Live Attack Feed
      </h2>
      <ul className="space-y-3">
        {alerts?.map((a, i) => (
          <li
            key={i}
            className="flex flex-col p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`px-2 py-1 rounded-full text-sm font-semibold ${
                  a.level === "CRITICAL"
                    ? "bg-red-600"
                    : a.level === "HIGH"
                    ? "bg-orange-500"
                    : "bg-yellow-500"
                }`}
              >
                {a.level}
              </span>
              <span className="text-gray-300 text-xs">{a.ts}</span>
            </div>

            {/* Sanitized alert text */}
            <div
              className="text-white break-words mb-2"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(a.text),
              }}
            />

            {/* ML info (Transformer) */}
            {a.ml && a.ml.available && (
              <div className="bg-gray-800 px-2 py-1 rounded text-sm text-gray-200">
                <p>
                  <strong>ML Label:</strong> {a.ml.label}
                </p>
                <p>
                  <strong>ML Score:</strong> {(a.ml.score * 100).toFixed(1)}%
                </p>
                <p>
                  <strong>ML Flagged:</strong> {a.ml.flagged ? "Yes" : "No"}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
