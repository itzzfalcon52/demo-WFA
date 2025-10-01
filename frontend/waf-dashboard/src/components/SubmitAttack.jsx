import { useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";

export default function SubmitAttack({ onSuccess }) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const buildAlertFromResponse = (resData, originalText) => {
    // prefer server-provided alert object, otherwise build a safe fallback
    if (resData && resData.alert && typeof resData.alert === "object") {
      return resData.alert;
    }
    return {
      level: resData && resData.flagged ? "CRITICAL" : "LOW",
      text: originalText,
      ts: "just now",
    };
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const text = (input || "").trim();
    if (!text) {
      setMessage("Please enter a URL or payload.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_URL}/alerts`, { text });
      console.log("POST /alerts response:", res.data);
      const alertObj = buildAlertFromResponse(res.data, text);

      setMessage(
        res.data && res.data.flagged ? "🚨 Malicious! Flagged." : "✅ Safe."
      );
      setInput("");

      // Always call onSuccess with a proper alert object (so parent can prepend it)
      if (onSuccess) onSuccess(alertObj);
    } catch (err) {
      console.error("Submit error:", err);
      setMessage("Error submitting input. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Send className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Test Input</h3>
          <p className="text-xs text-slate-400">
            Submit URLs or payloads for analysis
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 ">
        <div className="flex gap-3 max-sm:flex-col">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter URL or payload to test..."
            className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg  bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.includes("Malicious")
                ? "bg-red-500/10 border border-red-500/30 text-red-300"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
            }`}
          >
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
