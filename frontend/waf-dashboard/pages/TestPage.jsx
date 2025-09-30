// src/components/TestPage.jsx
import { useState } from "react";
import axios from "axios";
import SAMPLE_URLS from "../data/sampleurls";
import {
  CheckCircle,
  XCircle,
  PlayCircle,
  Loader2,
  Trash2,
  Play,
} from "lucide-react";

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
  const [activeTest, setActiveTest] = useState(null);

  const runSingle = async (urlObj) => {
    setMessage("");
    setActiveTest(urlObj.url);
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
    } finally {
      setActiveTest(null);
    }
  };

  const runAll = async () => {
    setRunning(true);
    setMessage("");
    setResults([]);
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
        setMessage("All tests completed successfully!");
      } else setMessage("No results from server.");
    } catch (err) {
      console.error(err);
      setMessage("Batch test failed (check console).");
    } finally {
      setRunning(false);
      setActiveTest(null);
    }
  };

  const clearResults = () => {
    setResults([]);
    setMessage("");
  };
  const passedTests = results.filter(
    (r) => r.flagged === r.expected?.flagged
  ).length;
  const totalTests = results.length;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            URL Testing Suite
          </h1>
          <p className="text-slate-400">
            Test sample URLs against the detection system and validate results
          </p>
        </div>

        {/* Control Panel */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={runAll}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Run All Tests
              </>
            )}
          </button>

          <button
            onClick={clearResults}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear Results
          </button>

          {totalTests > 0 && (
            <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-sm text-slate-400">Results:</span>
              <span
                className={`text-lg font-bold ${
                  passedTests === totalTests
                    ? "text-emerald-400"
                    : "text-orange-400"
                }`}
              >
                {passedTests}/{totalTests}
              </span>
            </div>
          )}
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-200">{message}</p>
          </div>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: URL Categories Grid (3 rows x 2 cols) */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(SAMPLE_URLS).map(([category, urls]) => (
                <div
                  key={category}
                  className="rounded-xl p-5 bg-slate-800/50 border border-slate-700"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 capitalize">
                    {category.replace("_", " ")}
                  </h3>
                  <div className="space-y-3">
                    {urls.map((u, i) => {
                      const isActive = activeTest === u.url;
                      return (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                            isActive
                              ? "bg-blue-500/20 border-2 border-blue-500"
                              : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <code
                              className="text-sm text-slate-200 break-all block mb-2"
                              dangerouslySetInnerHTML={{
                                __html: escapeHtml(u.url),
                              }}
                            />
                            {u.expected && (
                              <div className="text-xs text-slate-400">
                                Expected:{" "}
                                <span
                                  className={`font-medium ${
                                    u.expected.flagged
                                      ? "text-red-400"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {u.expected.flagged ? "FLAGGED" : "SAFE"}
                                </span>{" "}
                                via {u.expected.source}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => runSingle(u)}
                            disabled={isActive}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                          >
                            {isActive ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            Run
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Results Panel */}
          <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700 max-h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">
                Test Results
              </h3>

              {results.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                      <PlayCircle className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400">No results yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Run a test to see results here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                  {results.map((r, idx) => {
                    const matches = r.flagged === r.expected?.flagged;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          matches
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-red-500/10 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <code
                            className="text-sm text-slate-200 break-all block mb-2"
                            dangerouslySetInnerHTML={{
                              __html: escapeHtml(r.url),
                            }}
                          />
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                              r.flagged
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {r.flagged ? "FLAGGED" : "SAFE"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="text-slate-400">
                            <span className="font-medium text-slate-300">
                              {r.source || "n/a"}
                            </span>
                            {r.probability !== null && (
                              <span className="ml-2">
                                Confidence:{" "}
                                <span className="font-medium">
                                  {(r.probability * 100).toFixed(1)}%
                                </span>
                              </span>
                            )}
                          </div>

                          {r.expected && (
                            <div
                              className={`flex items-center gap-1 ${
                                matches ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {matches ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="font-medium">Match</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  <span className="font-medium">Mismatch</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
