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
            className="flex items-center justify-between p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all"
          >
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

            {/* sanitize text before rendering */}
            <span
              className="flex-1 ml-3 text-white break-words"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(a.text),
              }}
            />

            <span className="text-gray-300 text-xs ml-3">{a.ts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
