// src/components/TestPage.jsx
import { useState } from "react";
import axios from "axios";
import SAMPLE_URLS from "../data/sampleurls";

const FLATTENED_SAMPLE_LIST = Object.values(SAMPLE_URLS)
  .flat()
  .map((o) => o.url);

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function TestPage() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  const runSingle = async (urlObj) => {
    setMessage("");
    try {
      const res = await axios.post(`${API_URL}/alerts`, { text: urlObj.url });
      const data = res.data;
      setResults((prev) => [
        {
          url: urlObj.url,
          flagged: !!data.flagged,
          source: data.source || null,
          probability: data.probability ?? null,
          matched_pattern: data.matched_pattern ?? null,
          expected: urlObj.expected,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
      setMessage("Error running test. See console.");
    }
  };

  const runAll = async () => {
    setRunning(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_URL}/test-batch`, {
        urls: FLATTENED_SAMPLE_LIST,
      });
      const payload = res.data;
      if (payload?.results) {
        const mapped = payload.results.map((r) => {
          const expectedObj = Object.values(SAMPLE_URLS)
            .flat()
            .find((obj) => obj.url === r.url)?.expected;
          return { ...r, flagged: !!r.flagged, expected: expectedObj };
        });
        setResults(mapped);
      } else setMessage("No results from server.");
    } catch (err) {
      console.error(err);
      setMessage("Batch test failed (check console).");
    } finally {
      setRunning(false);
    }
  };

  const clearResults = () => setResults([]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-sm text-white">
      <h3 className="text-lg font-semibold mb-2">Test URLs Page</h3>
      <p className="text-sm text-gray-300 mb-3">
        Test different sample URLs. Run single URL or all at once and compare
        with expected results.
      </p>

      {Object.entries(SAMPLE_URLS).map(([category, urls]) => (
        <div key={category} className="mb-5">
          <h4 className="font-semibold mb-2 text-gray-200 capitalize">
            {category.replace("_", " ")}
          </h4>
          <div className="grid gap-2 md:grid-cols-2">
            {urls.map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-700 p-2 rounded"
              >
                <div className="text-sm break-words">
                  <code
                    dangerouslySetInnerHTML={{ __html: escapeHtml(u.url) }}
                  />
                  {u.expected && (
                    <div className="text-xs text-gray-400">
                      Expected:{" "}
                      <span className="font-medium">
                        {u.expected.flagged ? "FLAGGED" : "SAFE"}
                      </span>{" "}
                      via {u.expected.source}
                    </div>
                  )}
                </div>
                <button
                  className="ml-3 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm"
                  onClick={() => runSingle(u)}
                >
                  Run
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2 mb-3">
        <button
          onClick={runAll}
          disabled={running}
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-700"
        >
          {running ? "Running..." : "Run all"}
        </button>
        <button
          onClick={clearResults}
          className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
        >
          Clear results
        </button>
      </div>

      {message && <p className="text-sm text-yellow-300 mb-2">{message}</p>}

      <div className="space-y-2 max-h-72 overflow-auto">
        {results.length === 0 && (
          <p className="text-sm text-gray-400">No results yet.</p>
        )}
        {results.map((r, idx) => (
          <div key={idx} className="p-2 rounded bg-gray-700">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-sm break-words">
                  <code
                    dangerouslySetInnerHTML={{ __html: escapeHtml(r.url) }}
                  />
                </div>
                <div className="text-xs text-gray-300">
                  Source:{" "}
                  <span className="font-medium">{r.source ?? "n/a"}</span>
                  {r.probability !== null && (
                    <>
                      {" "}
                      — Prob:{" "}
                      <span className="font-medium">
                        {r.probability.toFixed(3)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <div
                  className={`inline-block px-2 py-0.5 rounded text-xs ${
                    r.flagged ? "bg-red-600" : "bg-green-600"
                  }`}
                >
                  {r.flagged ? "FLAGGED" : "SAFE"}
                </div>
              </div>
            </div>
            {r.expected && (
              <div className="mt-1 text-xs">
                {r.flagged === r.expected.flagged ? (
                  <span className="text-green-400">✅ Matches expected</span>
                ) : (
                  <span className="text-red-400">❌ Mismatch</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
